/**
 * Provider-free PDF → markdown extraction (local, no network). Uses `unpdf`
 * (a pdfjs-dist wrapper) to pull text page-by-page. Ported from pi-web-access
 * but returns the markdown inline (for the agent) instead of writing a file.
 *
 * Used by fetch_content when the target is a PDF (by URL extension or
 * content-type), so the new Z.ai plugin keeps local PDF handling without
 * pulling in a foreign provider.
 */

import { getDocumentProxy } from "unpdf";

export interface PdfExtractResult {
  title: string;
  pages: number;
  extractedPages: number;
  truncated: boolean;
  markdown: string;
}

export interface PdfExtractOptions {
  /** Cap on pages extracted (the rest are skipped with a marker). Default 50. */
  maxPages?: number;
  /** Source URL/label, used to derive a fallback title. */
  source?: string;
}

const DEFAULT_MAX_PAGES = 50;

function deriveTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname;
    return last.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim() || u.hostname;
  } catch {
    return "Untitled PDF";
  }
}

export async function pdfBufferToMarkdown(
  buffer: ArrayBuffer | Uint8Array,
  options: PdfExtractOptions = {},
): Promise<PdfExtractResult> {
  const maxPages = Number.isFinite(options.maxPages)
    ? Math.max(1, Math.floor(options.maxPages ?? DEFAULT_MAX_PAGES))
    : DEFAULT_MAX_PAGES;

  // Normalize to a PLAIN Uint8Array (unpdf/pdfjs rejects Node Buffer subclasses
  // and this respects a view's byteOffset/byteLength for sliced/pooled buffers).
  const data = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer);
  const pdf = await getDocumentProxy(data);
  try {
    const meta = (await pdf.getMetadata().catch(() => null)) as {
      info?: Record<string, unknown>;
    } | null;
    const info = meta?.info && typeof meta.info === "object" ? meta.info : {};
    const metaTitle = typeof info.Title === "string" ? info.Title.trim() : "";
    const title = metaTitle || (options.source ? deriveTitleFromUrl(options.source) : "Untitled PDF");

    const pagesToExtract = Math.min(pdf.numPages, maxPages);
    const truncated = pdf.numPages > pagesToExtract;

    const blocks: string[] = [];
    for (let i = 1; i <= pagesToExtract; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: unknown) => {
          const str = (item as { str?: string }).str ?? "";
          return str;
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) blocks.push(`<!-- Page ${i} -->\n${text}`);
    }

    const body = blocks.join("\n\n");
    const header = [
      `# ${title}`,
      "",
      `> Source: ${options.source ?? "(inline buffer)"}`,
      `> Pages: ${pdf.numPages}${truncated ? ` (extracted first ${pagesToExtract})` : ""}`,
      "",
      "---",
      "",
    ].join("\n");
    const footer = truncated
      ? `\n\n---\n\n*[Truncated: only the first ${pagesToExtract} of ${pdf.numPages} pages were extracted.]*`
      : "";

    return {
      title,
      pages: pdf.numPages,
      extractedPages: pagesToExtract,
      truncated,
      markdown: `${header}${body}${footer}`,
    };
  } finally {
    // Release the PDF.js parser/worker resources (no unbounded retention across calls).
    await pdf.destroy().catch(() => {});
  }
}

/**
 * Cheap heuristic: does this URL point at a PDF? Catches `.pdf` file
 * extensions and common `/pdf/<id>` patterns (e.g. arxiv.org/pdf/1706.03762).
 * The caller is responsible for falling back to webReader when local
 * extraction fails (e.g. a `.pdf` URL that is actually HTML).
 */
export function looksLikePdfUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\.pdf(\?|#|$)/i.test(u.pathname) || /\/pdf\/[^/]+$/i.test(u.pathname);
  } catch {
    return /\.pdf$/i.test(url) || /\/pdf\/[^/]+$/i.test(url);
  }
}
