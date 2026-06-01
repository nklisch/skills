import test from "node:test";
import assert from "node:assert/strict";

import { TestEvent, installDomGlobals, loadBoardModule, makeItem } from "./harness.mjs";

test("epic filters match an epic and all descendants through parent chains", async () => {
  installDomGlobals();
  const { createDefaultFilters, deriveFilterOptions, epicIdForItem, matchesFilters } = await loadBoardModule("filters.js");
  const items = [
    makeItem({ id: "epic-alpha", kind: "epic", parent: null }),
    makeItem({ id: "feature-alpha", kind: "feature", parent: "epic-alpha" }),
    makeItem({ id: "story-alpha", kind: "story", parent: "feature-alpha" }),
    makeItem({ id: "epic-beta", kind: "epic", parent: null }),
    makeItem({ id: "story-beta", kind: "story", parent: "epic-beta" }),
    makeItem({ id: "cycle-a", kind: "story", parent: "cycle-b" }),
    makeItem({ id: "cycle-b", kind: "feature", parent: "cycle-a" }),
  ];
  const snapshot = { items };
  const options = deriveFilterOptions(snapshot);
  assert.deepEqual(options.epics, ["epic-alpha", "epic-beta"]);
  assert.equal(epicIdForItem(items[2], new Map(items.map((item) => [item.id, item]))), "epic-alpha");
  assert.equal(epicIdForItem(items[5], new Map(items.map((item) => [item.id, item]))), "");

  const filters = createDefaultFilters();
  filters.epics = new Set(["epic-alpha"]);
  assert.equal(matchesFilters(items[0], filters, snapshot), true);
  assert.equal(matchesFilters(items[1], filters, snapshot), true);
  assert.equal(matchesFilters(items[2], filters, snapshot), true);
  assert.equal(matchesFilters(items[3], filters, snapshot), false);
  assert.equal(matchesFilters(items[4], filters, snapshot), false);
});

test("tag and epic groups expand in the sidebar without changing filter semantics", async () => {
  const { document } = installDomGlobals();
  const { createDefaultFilters, renderFilterBar } = await loadBoardModule("filters.js");
  const tags = Array.from({ length: 16 }, (_, index) => `tag-${index + 1}`);
  const items = [
    makeItem({ id: "epic-alpha", kind: "epic", tags: ["tag-1"] }),
    ...tags.map((tag, index) => makeItem({
      id: `story-${index}`,
      kind: "story",
      parent: "epic-alpha",
      tags: [tag],
    })),
  ];
  const filters = createDefaultFilters();
  let setFilterCalls = 0;
  const ctx = {
    getState: () => ({ snapshot: { items }, filters }),
    setFilter(key, value) {
      setFilterCalls += 1;
      filters[key] = value;
    },
  };
  const root = document.createElement("aside");
  const ui = renderFilterBar(root, ctx);
  ui.sync(ctx.getState());

  const tagOptions = root.querySelectorAll(".filter-options")
    .find((node) => node.getAttribute("aria-label") === "Tag filters");
  const tagToggle = root.querySelectorAll(".filter-expand-toggle")
    .find((button) => button.dataset.expandKey === "tags");
  assert.ok(tagOptions);
  assert.ok(tagToggle);
  assert.equal(tagToggle.tagName, "BUTTON");
  assert.notEqual(tagToggle.getAttribute("tabindex"), "-1");
  assert.equal(tagOptions.dataset.expanded, "false");
  assert.equal(tagToggle.getAttribute("aria-expanded"), "false");

  tagToggle.dispatchEvent(new TestEvent("keydown", { key: "Enter", cancelable: true }));
  assert.equal(tagOptions.dataset.expanded, "true");
  assert.equal(tagToggle.getAttribute("aria-expanded"), "true");

  const tagButton = tagOptions.querySelectorAll(".filter-chip")
    .find((button) => button.dataset.filterValue === "tag-3");
  tagButton.dispatchEvent(new TestEvent("click", { cancelable: true }));
  assert.equal(setFilterCalls, 1);
  assert.deepEqual(Array.from(filters.tags), ["tag-3"]);
});
