/**
 * Article extraction: HTML → cleaned markdown.
 *
 * Stack: linkedom (lightweight DOM, no jsdom weight) → @mozilla/readability
 * (Mozilla's reader-view boilerplate stripper, battle-tested across templates)
 * → turndown (HTML→markdown). All three are pure JS, no native deps.
 *
 * Pure (no network). Failure modes are EXPLICIT and surfaced to the caller:
 *
 *   - Readability returns null (no main content identified), or
 *   - the extracted article is below {@link MIN_ARTICLE_CHARS} characters.
 *     This floor catches false-positives where Readability latches onto a
 *     small sidebar/widget and would otherwise silently discard the real
 *     content elsewhere on the page.
 *
 *   → falls back to a stripped-tag plain-text dump of the whole page, prefixed
 *     with {@link ARTICLE_FALLBACK_MARKER} so the model knows the output is
 *     whole-page text rather than the distilled article. Silently discarding
 *     real content is the failure mode this guard exists to prevent.
 *
 * Returns `{ markdown, fallback }`. The integration passes `markdown` straight
 * through; the `fallback` flag is informational (e.g. for telemetry/details).
 */

import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";

/**
 * Minimum extracted-article size (chars) below which extraction is treated as
 * failed and we fall back to whole-page text. Tuned to sit safely above
 * typical nav/sidebar chrome noise (~50–150 chars) and safely below a real
 * doc body, so a real article always passes and a stray widget never does.
 */
const MIN_ARTICLE_CHARS = 400;

/**
 * Marker prepended to fallback output. Worded so a reader (model or human)
 * immediately knows this is whole-page text, not the distilled article, and
 * that distillation failed rather than producing low-quality output.
 * Mirrors the phrasing the integration contract documents.
 */
export const ARTICLE_FALLBACK_MARKER =
  "…[article extraction failed; returning full page]\n\n";

export interface ExtractArticleResult {
  /** Cleaned markdown (success) or stripped plain text (fallback). */
  markdown: string;
  /** True when Readability could not identify a viable article and the helper
   * fell back to whole-page text. Callers may surface this to the user. */
  fallback: boolean;
}

// Structural type for the Readability.parse() return — defined locally so we
// don't depend on @mozilla/readability's exported `Article` type (which has
// moved between versions). We only consume three fields.
type ParsedArticle = {
  length?: number;
  content?: string | null;
  textContent?: string | null;
};

// Single shared Turndown instance. Construction is cheap and the instance is
// stateless across calls, so reusing avoids per-call allocation. ATX headings
// + fenced code produce the cleanest markdown for doc pages.
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

/**
 * Normalize whitespace in a plain-text dump: NBSP → space, collapse runs of
 * spaces/tabs, trim trailing space per line, collapse 3+ blank lines to one,
 * and trim the ends. Keeps the fallback readable rather than a wall of jagged
 * text inherited from the source HTML.
 */
function normalizePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Reduce HTML to plain text. Prefers the parsed DOM's `textContent` (correct
 * entity/whitespace handling); falls back to a regex tag-strip if the DOM has
 * no usable body/documentElement (deeply malformed input where linkedom
 * itself produced an empty tree).
 */
function htmlToPlainText(document: Document, rawHtml: string): string {
  const root = document.body ?? document.documentElement ?? null;
  const text = root?.textContent ?? rawHtml.replace(/<[^>]+>/g, " ");
  return normalizePlainText(text || "");
}

/**
 * Extract the main article from a raw HTML string and return it as markdown.
 *
 * @param html Raw HTML page source.
 * @param _source Optional source URL/label. Reserved for future use (e.g. a
 *   citation footer); accepted to keep the integration's calling shape stable.
 */
export function extractArticle(html: string, _source?: string): ExtractArticleResult {
  let document: Document;
  try {
    document = parseHTML(html).document;
  } catch {
    // linkedom choked on the HTML — last-resort regex strip so we still return
    // something useful rather than throwing.
    return {
      markdown: `${ARTICLE_FALLBACK_MARKER}${normalizePlainText(
        html.replace(/<[^>]+>/g, " "),
      )}`,
      fallback: true,
    };
  }

  let article: ParsedArticle | null = null;
  try {
    // cloneNode(true): Readability mutates the doc during scoring; cloning
    // keeps our parsed DOM intact for the fallback path's textContent read.
    article = new Readability(document.cloneNode(true), {
      // Hand Readability the same floor we re-check below, so its internal
      // threshold and our external one agree on what "too short" means.
      charThreshold: MIN_ARTICLE_CHARS,
    }).parse() as ParsedArticle | null;
  } catch {
    article = null;
  }

  if (article && (article.length ?? 0) >= MIN_ARTICLE_CHARS && article.content) {
    let markdown = "";
    try {
      markdown = turndown.turndown(article.content).trim();
    } catch {
      // Turndown very rarely throws on exotic markup; fall back to the
      // article's own textContent (already cleaned by Readability).
      markdown = normalizePlainText(article.textContent ?? "");
    }
    // Re-check the markdown length: a long `article.length` could still
    // produce near-empty markdown if Turndown discards everything (e.g. an
    // article composed entirely of unsupported nodes). Belt-and-suspenders
    // against silently returning an empty article.
    if (markdown.length >= MIN_ARTICLE_CHARS) {
      return { markdown, fallback: false };
    }
  }

  // Fallback: whole-page stripped text, marker-first so it can't be mistaken
  // for a clean article extraction.
  const text = htmlToPlainText(document, html);
  return {
    markdown: `${ARTICLE_FALLBACK_MARKER}${text}`.trimEnd(),
    fallback: true,
  };
}
