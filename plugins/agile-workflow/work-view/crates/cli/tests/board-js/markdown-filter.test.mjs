import test from "node:test";
import assert from "node:assert/strict";

import { installDomGlobals, loadBoardModule, makeItem } from "./harness.mjs";

test("markdown renderer keeps adversarial HTML inert", async () => {
  installDomGlobals();
  const { renderMarkdown } = await loadBoardModule("markdown.js");
  const root = renderMarkdown(`
# Unsafe
<script>alert("x")</script>
<img src=x onerror=alert(1)>
[bad](javascript:alert(1))
[ok](https://example.com/docs)
`);

  assert.equal(root.querySelectorAll("script").length, 0);
  assert.equal(root.querySelectorAll("img").length, 0);
  assert.match(root.textContent, /<script>alert\("x"\)<\/script>/);
  assert.match(root.textContent, /\[bad\]\(javascript:alert\(1\)\)/);

  const anchors = root.querySelectorAll("a");
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].getAttribute("href"), "https://example.com/docs");
  assert.equal(anchors[0].getAttribute("rel"), "noreferrer");
});

test("filters compose scalar ORs, group ANDs, tag ANDs, search, null parent, and tier hide", async () => {
  installDomGlobals();
  const { createDefaultFilters, matchesFilters } = await loadBoardModule("filters.js");
  const item = makeItem({
    kind: "story",
    stage: "review",
    parent: null,
    tags: ["tooling", "testing"],
    body: "Dependency board behavior",
  });

  const filters = createDefaultFilters();
  filters.kinds = new Set(["feature", "story"]);
  filters.stages = new Set(["done", "review"]);
  filters.parents = new Set([""]);
  filters.tags = new Set(["tooling", "testing"]);
  filters.search = "dependency";
  assert.equal(matchesFilters(item, filters), true);

  filters.tags = new Set(["tooling", "missing"]);
  assert.equal(matchesFilters(item, filters), false);

  filters.tags = new Set(["tooling"]);
  filters.kinds = new Set(["feature"]);
  assert.equal(matchesFilters(item, filters), false);

  filters.kinds = new Set(["story"]);
  filters.autoHideReleased = true;
  assert.equal(matchesFilters({ ...item, tier: "releases" }, filters), false);

  filters.autoHideReleased = false;
  assert.equal(matchesFilters({ ...item, tier: "releases" }, filters), true);
});
