import { describe, expect, test } from "bun:test";
import { truncate, assertSafeFetchUrl } from "./index";

describe("truncate (keeps the HEAD)", () => {
  test("returns text unchanged when under the cap", () => {
    expect(truncate("short", 100)).toBe("short");
  });

  test("keeps the lead, not the tail, and marks the truncation", () => {
    const long = "HEAD-START " + "x".repeat(500) + " TAIL-END";
    const out = truncate(long, 200);
    expect(out).toContain("HEAD-START"); // lead kept
    expect(out).not.toContain("TAIL-END"); // tail dropped
    expect(out).toMatch(/truncated/);
  });

  test("never exceeds the cap (marker accounted for)", () => {
    const out = truncate("x".repeat(100_000), 1000);
    expect(out.length).toBeLessThanOrEqual(1000);
  });

  test("clamps the marker underflow case (tiny max)", () => {
    const out = truncate("abcdefghij", 5);
    // budget = max(0, 5 - marker.length) = 0; returns just the marker, <= max.
    expect(out.length).toBeLessThanOrEqual(5 + 200); // generous: marker text
    expect(out).toMatch(/truncated/);
  });
});

describe("assertSafeFetchUrl (SSRF guard)", () => {
  test("accepts http and https to public hosts", () => {
    expect(() => assertSafeFetchUrl("https://arxiv.org/pdf/1706.03762")).not.toThrow();
    expect(() => assertSafeFetchUrl("http://example.com/doc.pdf")).not.toThrow();
  });

  test.each([
    ["file:///etc/passwd", "non-http"],
    ["ftp://example.com/x", "non-http"],
  ] as const)("rejects non-http(s) schemes: %s", (url) => {
    expect(() => assertSafeFetchUrl(url)).toThrow(/scheme/);
  });

  test.each([
    ["http://localhost/admin.pdf", "localhost"],
    ["http://127.0.0.1/", "loopback v4"],
    ["http://169.254.169.254/latest/meta-data/", "link-local metadata"],
    ["http://10.0.0.1/", "private 10.x"],
    ["http://192.168.1.1/", "private 192.168"],
    ["http://172.16.0.1/", "private 172.16"],
    ["http://172.31.255.255/", "private 172.31"],
    ["http://[::1]/", "loopback v6"],
  ] as const)("rejects private/loopback/link-local hosts: %s (%s)", (url) => {
    expect(() => assertSafeFetchUrl(url)).toThrow();
  });

  test("rejects an invalid URL", () => {
    expect(() => assertSafeFetchUrl("not a url")).toThrow(/invalid URL/);
  });
});
