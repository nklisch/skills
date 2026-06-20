import { describe, expect, test } from "bun:test";
import { createMcpHub, type McpClientLike, type McpCallToolResult } from "./mcp";

// A scriptable fake MCP client. callTool consults a queue of responses or a handler.
function makeFakeClient(opts: {
  connectDelayMs?: number;
  calls?: Array<{ result?: McpCallToolResult; throw?: string | Error }>;
  handler?: (name: string, args: Record<string, unknown>) => McpCallToolResult | Promise<McpCallToolResult>;
}): { client: McpClientLike; state: { connects: number; callInvocations: number; closes: number } } {
  const state = { connects: 0, callInvocations: 0, closes: 0 };
  let callIdx = 0;
  const client: McpClientLike = {
    async connect() {
      state.connects++;
      if (opts.connectDelayMs) await new Promise((r) => setTimeout(r, opts.connectDelayMs));
    },
    async callTool(request) {
      state.callInvocations++;
      if (opts.handler) return await opts.handler(request.name, request.arguments);
      const next = opts.calls?.[callIdx++];
      if (!next) throw new Error("fake client: no more queued responses");
      if (next.throw !== undefined) throw typeof next.throw === "string" ? new Error(next.throw) : next.throw;
      return next.result ?? { content: [] };
    },
    async close() {
      state.closes++;
    },
  };
  return { client, state };
}

function textResult(text: string, isError = false): McpCallToolResult {
  return { content: [{ type: "text", text }], isError };
}

describe("createMcpHub", () => {
  test("connects lazily once per server and reuses the client (single-flight)", async () => {
    const { client, state } = makeFakeClient({ handler: () => textResult("ok") });
    const hub = createMcpHub({ resolveKey: async () => "test-key", createClient: () => client, createTransport: () => ({}) });

    await hub.call("web-search-prime", "web_search_prime", { search_query: "a" });
    await hub.call("web-search-prime", "web_search_prime", { search_query: "b" });
    expect(state.connects).toBe(1); // reused across two calls to the same server

    await hub.call("zread", "search_doc", { repo_name: "x/y", query: "q" });
    expect(state.connects).toBe(2); // different server -> its own connect
    await hub.close();
  });

  test("concurrent first calls to the same server share one connect (single-flight)", async () => {
    const { client, state } = makeFakeClient({ connectDelayMs: 30, handler: () => textResult("ok") });
    const hub = createMcpHub({ resolveKey: async () => "test-key", createClient: () => client, createTransport: () => ({}) });
    await Promise.all([
      hub.call("web-reader", "webReader", { url: "http://a" }),
      hub.call("web-reader", "webReader", { url: "http://b" }),
      hub.call("web-reader", "webReader", { url: "http://c" }),
    ]);
    expect(state.connects).toBe(1);
    await hub.close();
  });

  test("extracts text content blocks and surfaces isError", async () => {
    const { client } = makeFakeClient({
      handler: () => ({ content: [{ type: "text", text: "line1" }, { type: "text", text: "line2" }, { type: "image" }], isError: true }),
    });
    const hub = createMcpHub({ resolveKey: async () => "k", createClient: () => client, createTransport: () => ({}) });
    const res = await hub.call("zread", "search_doc", { repo_name: "a/b", query: "q" });
    expect(res.text).toBe("line1\nline2");
    expect(res.isError).toBe(true);
    await hub.close();
  });

  test("retries once on a 401 — detects via .code, not just the message (real StreamableHTTPError shape)", async () => {
    let keyCalls = 0;
    const keys = ["stale-key", "fresh-key"];
    // Mirror the REAL SDK error: a StreamableHTTPError carries the status on
    // `.code` (401) with a generic message that contains NEITHER "401" nor
    // "unauthorized". isAuthError MUST inspect .code — a message-only check
    // would miss this and fail to retry.
    const real401 = Object.assign(new Error("Streamable HTTP error: Error POSTing to endpoint: {\"error\":{\"code\":\"1001\"}}"), { code: 401 });
    const { client, state } = makeFakeClient({
      calls: [{ throw: real401 }, { result: textResult("recovered") }],
    });
    const hub = createMcpHub({
      resolveKey: async () => keys[keyCalls++] ?? "fresh-key",
      createClient: () => client,
      createTransport: () => ({}),
    });
    const res = await hub.call("zread", "search_doc", { repo_name: "a/b", query: "q" });
    expect(res.text).toBe("recovered");
    expect(state.connects).toBe(2); // initial + post-401 reconnect
    expect(keyCalls).toBe(2); // key re-resolved after the 401
    expect(state.callInvocations).toBe(2);
    await hub.close();
  });

  test("does NOT retry on a non-auth error", async () => {
    const { client, state } = makeFakeClient({ calls: [{ throw: "HTTP 500 Internal Server Error" }] });
    const hub = createMcpHub({ resolveKey: async () => "k", createClient: () => client, createTransport: () => ({}) });
    await expect(hub.call("web-search-prime", "web_search_prime", { search_query: "x" })).rejects.toThrow(/500/);
    expect(state.connects).toBe(1); // no reconnect for non-auth
    await hub.close();
  });

  test("throws a clear error when no key resolves", async () => {
    const { client } = makeFakeClient({ handler: () => textResult("ok") });
    const hub = createMcpHub({ resolveKey: async () => null, createClient: () => client, createTransport: () => ({}) });
    await expect(hub.call("zread", "search_doc", { repo_name: "a/b", query: "q" })).rejects.toThrow(/No Z\.ai API key/);
    await hub.close();
  });

  test("close shuts down and prevents further calls", async () => {
    const { client, state } = makeFakeClient({ handler: () => textResult("ok") });
    const hub = createMcpHub({ resolveKey: async () => "k", createClient: () => client, createTransport: () => ({}) });
    await hub.call("web-search-prime", "web_search_prime", { search_query: "x" });
    await hub.close();
    expect(state.closes).toBeGreaterThanOrEqual(1);
    await expect(hub.call("web-search-prime", "web_search_prime", { search_query: "y" })).rejects.toThrow(/shutting down/);
  });

  test("close() during an in-flight connect awaits it and closes the orphan (no leak)", async () => {
    const { client, state } = makeFakeClient({ connectDelayMs: 40, handler: () => textResult("ok") });
    const hub = createMcpHub({ resolveKey: async () => "k", createClient: () => client, createTransport: () => ({}) });
    // Start a call (which triggers connect), but don't await it.
    const callP = hub.call("web-reader", "webReader", { url: "http://x" }).catch((e) => e);
    // Close while the connect is still pending.
    await new Promise((r) => setTimeout(r, 10));
    await hub.close();
    // The in-flight connect must NOT leak a live client: its close() runs either
    // via the connect-IIFE's shuttingDown guard or via close()'s drain.
    expect(state.closes).toBeGreaterThanOrEqual(1);
    // The pending call rejects (shutting down), not resolve.
    const result = await callP;
    expect(result).toBeInstanceOf(Error);
    await hub.close();
  });

  test("concurrent 401s on a shared client don't close each other's fresh client", async () => {
    // Two calls both 401 on the same stale client. Each retry drops ONLY its
    // own (stale) client via expectedClient, so the first retry's fresh client
    // is not closed by the second retry's dropClient.
    const real401 = Object.assign(new Error("Streamable HTTP error: POSTing failed"), { code: 401 });
    let keyCalls = 0;
    const { client, state } = makeFakeClient({
      // Both initial calls 401; both retries succeed.
      calls: [
        { throw: real401 },
        { throw: real401 },
        { result: textResult("ok1") },
        { result: textResult("ok2") },
      ],
    });
    const hub = createMcpHub({
      resolveKey: async () => { keyCalls++; return "k"; },
      createClient: () => client,
      createTransport: () => ({}),
    });
    const [r1, r2] = await Promise.all([
      hub.call("web-reader", "webReader", { url: "http://a" }),
      hub.call("web-reader", "webReader", { url: "http://b" }),
    ]);
    expect(r1.text).toBe("ok1");
    expect(r2.text).toBe("ok2");
    // Both succeeded — neither fresh client was closed out from under the other.
    expect(state.callInvocations).toBe(4); // 2 initial 401s + 2 retry successes
    await hub.close();
  });
});
