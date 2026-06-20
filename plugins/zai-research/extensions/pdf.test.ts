import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pdfBufferToMarkdown, looksLikePdfUrl } from "./pdf";

const FIXTURE = join(import.meta.dir, "..", "test", "fixtures", "sample.pdf");

describe("looksLikePdfUrl", () => {
  const cases: Array<[string, boolean]> = [
    ["https://arxiv.org/pdf/1706.03762", true], // arxiv /pdf/<id>
    ["https://arxiv.org/pdf/1706.03762v7", true],
    ["https://example.com/doc.pdf", true],
    ["https://example.com/doc.PDF", true],
    ["https://example.com/doc.pdf?download=1", true],
    ["https://example.com/guide", false],
    ["https://example.com/paper.html", false],
    ["https://example.com/pdf-viewer", false], // 'pdf' in path, not a pdf file
    ["https://example.com/pdf-to-text", false],
    ["https://example.com/pdf/", false], // empty id segment
  ];
  for (const [url, expected] of cases) {
    test(`"${url}" -> ${expected}`, () => {
      expect(looksLikePdfUrl(url)).toBe(expected);
    });
  }
});

describe("pdfBufferToMarkdown", () => {
  test("extracts text from a real PDF fixture, page-by-page", async () => {
    const buf = await readFile(FIXTURE);
    const res = await pdfBufferToMarkdown(buf, { source: "sample.pdf" });

    expect(res.pages).toBe(2);
    expect(res.extractedPages).toBe(2);
    expect(res.truncated).toBe(false);
    // Both pages' content present, with page markers.
    expect(res.markdown).toContain("Page one zai-research fixture");
    expect(res.markdown).toContain("Page two has different content");
    expect(res.markdown).toContain("<!-- Page 1 -->");
    expect(res.markdown).toContain("<!-- Page 2 -->");
    // Header carries the source + page count.
    expect(res.markdown).toContain("Source: sample.pdf");
    expect(res.markdown).toContain("Pages: 2");
  });

  test("respects maxPages and marks truncation", async () => {
    const buf = await readFile(FIXTURE);
    const res = await pdfBufferToMarkdown(buf, { source: "sample.pdf", maxPages: 1 });
    expect(res.pages).toBe(2); // total pages reported truthfully
    expect(res.extractedPages).toBe(1); // only first extracted
    expect(res.truncated).toBe(true);
    expect(res.markdown).toContain("Page one zai-research fixture");
    expect(res.markdown).not.toContain("Page two has different content");
    expect(res.markdown).toMatch(/Truncated.*first 1 of 2/);
  });

  test("rejects non-PDF bytes with a thrown error", async () => {
    const notPdf = new TextEncoder().encode("this is not a pdf");
    await expect(pdfBufferToMarkdown(notPdf)).rejects.toThrow();
  });
});
