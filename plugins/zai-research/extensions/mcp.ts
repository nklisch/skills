/**
 * Thin MCP client seam over Z.ai's three remote MCP servers.
 *
 * Keeps a lazily-initialized, reused MCP `Client` per server (connect once per
 * session, reuse across tool calls) and exposes a single `call(server, tool,
 * args, signal)`. Auth is the Z.ai API key resolved from pi's configured `zai`
 * provider, sent as `Authorization: Bearer <key>` on every request via the
 * transport's `requestInit.headers`. On a 401 the key cache + client are
 * dropped and the call retries once after re-resolving the key.
 *
 * Intentionally a small seam with an injected `resolveKey` so tests can drive
 * it without touching the network (the tool layer injects the real resolver).
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export type McpServerName = "web-search-prime" | "web-reader" | "zread";

const URLS: Record<McpServerName, string> = {
  "web-search-prime": "https://api.z.ai/api/mcp/web_search_prime/mcp",
  "web-reader": "https://api.z.ai/api/mcp/web_reader/mcp",
  zread: "https://api.z.ai/api/mcp/zread/mcp",
};

/** Minimal client shape createMcpHub depends on (so tests can inject a fake). */
export interface McpClientLike {
  connect: (transport: unknown) => Promise<void>;
  callTool: (
    request: { name: string; arguments: Record<string, unknown> },
    resultSchema?: unknown,
    options?: { signal?: AbortSignal },
  ) => Promise<McpCallToolResult>;
  close: () => Promise<void>;
}

export interface McpCallResult {
  /** Concatenated text content blocks from the tool result. */
  text: string;
  /** True if the server reported the tool call as an error. */
  isError: boolean;
  /** The raw CallToolResult, for debugging/optional structured output. */
  raw?: unknown;
}

export interface McpHubOptions {
  /** Resolves the Z.ai API key (or null if unavailable). Called lazily + cached. */
  resolveKey: () => Promise<string | null | undefined>;
  clientName?: string;
  clientVersion?: string;
  /** Test seam: build a (possibly fake) client. Defaults to the real MCP Client. */
  createClient?: (name: string, version: string) => McpClientLike;
  /** Test seam: build a (possibly fake) transport for a server + key. */
  createTransport?: (server: McpServerName, key: string) => unknown;
}

interface McpContentItem {
  type?: string;
  text?: string;
}

export interface McpCallToolResult {
  content?: McpContentItem[];
  isError?: boolean;
}

/**
 * Detect a 401/auth failure from the thrown error. The real MCP
 * `StreamableHTTPClientTransport` throws `StreamableHTTPError` with the status
 * on `.code` (e.g. 401) and a generic message like "Streamable HTTP error:
 * Error POSTing to endpoint: …" — the numeric 401 is NOT in the message. So we
 * check `.code` first, then fall back to a message regex for other clients.
 */
function isAuthError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const code = (err as { code?: unknown }).code;
    if (code === 401) return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /\b401\b|unauthorized/i.test(message);
}

function extractText(result: McpCallToolResult): string {
  return (result.content ?? [])
    .map((c) => (c?.type === "text" ? c.text ?? "" : ""))
    .filter(Boolean)
    .join("\n");
}

export interface McpHub {
  call: (
    server: McpServerName,
    tool: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<McpCallResult>;
  close: () => Promise<void>;
}

export function createMcpHub(opts: McpHubOptions): McpHub {
  const clients = new Map<McpServerName, McpClientLike>();
  const pending = new Map<McpServerName, Promise<McpClientLike>>();
  let cachedKey: string | null | undefined; // undefined = not yet cached; null cached = a known-unavailable key
  let shuttingDown = false;

  function buildClient(): McpClientLike {
    if (opts.createClient) {
      return opts.createClient(opts.clientName ?? "pi-zai-research", opts.clientVersion ?? "0.1.0");
    }
    // Real default — the installed MCP SDK client.
    return new Client({
      name: opts.clientName ?? "pi-zai-research",
      version: opts.clientVersion ?? "0.1.0",
    }) as unknown as McpClientLike;
  }

  function buildTransport(key: string, server: McpServerName): unknown {
    if (opts.createTransport) return opts.createTransport(server, key);
    return new StreamableHTTPClientTransport(new URL(URLS[server]), {
      requestInit: { headers: { Authorization: `Bearer ${key}` } },
    });
  }

  async function getKey(): Promise<string> {
    // Re-resolve on every miss (cachedKey === undefined). A *successful* key is
    // cached and reused; a null result is cached only transiently and is
    // invalidated by dropClient on a retry, so a later-available key is picked up.
    if (cachedKey === undefined) cachedKey = (await opts.resolveKey()) ?? null;
    if (!cachedKey) {
      throw new Error(
        "No Z.ai API key available. Configure the zai provider in pi (auth.json) so the extension can resolve it, or set the provider's key.",
      );
    }
    return cachedKey;
  }

  async function connect(server: McpServerName): Promise<McpClientLike> {
    // Single-flight: if a connect for this server is already in flight, await it.
    const inflight = pending.get(server);
    if (inflight) return inflight;
    if (shuttingDown) throw new Error("MCP hub is shutting down");

    const p = (async () => {
      const key = await getKey();
      const client = buildClient();
      await client.connect(buildTransport(key, server));
      // If shutdown landed while we were awaiting, close the orphan immediately
      // so its transport doesn't leak into a nulled hub.
      if (shuttingDown) {
        await client.close().catch(() => {});
        throw new Error("MCP hub is shutting down");
      }
      clients.set(server, client);
      return client;
    })();
    pending.set(server, p);
    try {
      return await p;
    } finally {
      pending.delete(server);
    }
  }

  /**
   * Drop a server's client. If `expectedClient` is provided, only drop when it
   * is still the current client — this prevents a concurrent 401 retry from
   * closing a fresh replacement another caller just installed.
   */
  function dropClient(server: McpServerName, invalidateKey: boolean, expectedClient?: McpClientLike): void {
    const current = clients.get(server);
    if (current && (expectedClient === undefined || current === expectedClient)) {
      void current.close().catch(() => {});
      clients.delete(server);
    }
    if (invalidateKey) cachedKey = undefined;
  }

  async function runCall(
    client: McpClientLike,
    tool: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<McpCallResult> {
    const result = await client.callTool({ name: tool, arguments: args }, undefined, signal ? { signal } : undefined);
    return { text: extractText(result), isError: result.isError === true, raw: result };
  }

  async function call(
    server: McpServerName,
    tool: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<McpCallResult> {
    if (shuttingDown) throw new Error("MCP hub is shutting down");

    const client = clients.get(server) ?? (await connect(server));
    try {
      return await runCall(client, tool, args, signal);
    } catch (err) {
      // One retry after re-auth on a 401 (key may have rotated/expired). Only
      // drop THIS client (expectedClient) so a concurrent retry's fresh client
      // isn't closed out from under it.
      if (isAuthError(err)) {
        dropClient(server, true, client);
        const fresh = await connect(server);
        return await runCall(fresh, tool, args, signal);
      }
      throw err;
    }
  }

  async function close(): Promise<void> {
    shuttingDown = true;
    // Wait for any in-flight connects first — otherwise their IIFEs would
    // clients.set a freshly-connected transport into a cleared map (leak).
    const inflight = [...pending.values()];
    await Promise.allSettled(inflight);
    // Now drain whatever clients survived (connect() closes its orphan if
    // shuttingDown flipped mid-connect, so this catches the rest).
    const all = [...clients.values()].map((c) => c.close().catch(() => {}));
    clients.clear();
    await Promise.all(all);
  }

  return { call, close };
}
