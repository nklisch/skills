import test from "node:test";
import assert from "node:assert/strict";

import { TestEvent, installDomGlobals, loadBoardModule, makeItem } from "./harness.mjs";

test("kanban lanes group by parent and lane focus does not mutate global filters", async () => {
  const { document } = installDomGlobals();
  const { createDefaultFilters } = await loadBoardModule("filters.js");
  const { groupItemsByLane, laneProgress, kanbanView } = await loadBoardModule("kanban.js");
  const items = [
    makeItem({ id: "epic-alpha", kind: "epic", parent: null, stage: "done", is_terminal: true }),
    makeItem({ id: "feature-alpha", kind: "feature", parent: "epic-alpha", stage: "review" }),
    makeItem({ id: "story-alpha", kind: "story", parent: "feature-alpha", stage: "implementing" }),
    makeItem({ id: "orphan", kind: "story", parent: null, stage: "drafting" }),
  ];

  const lanes = groupItemsByLane(items);
  assert.deepEqual(Array.from(lanes.keys()).sort(), ["(no parent)", "epic-alpha", "feature-alpha"]);
  assert.deepEqual(laneProgress(lanes.get("epic-alpha")), { done: 1, total: 2 });

  const filters = createDefaultFilters();
  let setFilterCalls = 0;
  const ctx = {
    visibleItems: () => items,
    getState: () => ({ snapshot: { items }, filters }),
    setFilter: () => { setFilterCalls += 1; },
    renderCard: (item) => {
      const node = document.createElement("article");
      node.dataset.id = item.id;
      return node;
    },
  };
  const root = document.createElement("main");
  document.body.append(root);
  kanbanView.mount(root, ctx);

  const laneButton = root.querySelectorAll(".kanban-lane-chip")
    .find((button) => button.dataset.lane === "epic-alpha");
  assert.ok(laneButton);
  laneButton.dispatchEvent(new TestEvent("click", { cancelable: true }));

  assert.equal(setFilterCalls, 0);
  assert.deepEqual(Array.from(filters.parents), []);
  assert.deepEqual(Array.from(filters.tags), []);
});

test("detail presentation and selected id refresh behavior are deterministic", async () => {
  installDomGlobals();
  const { detectDetailPresentation } = await loadBoardModule("detail.js");
  const { createBoardStore } = await loadBoardModule("state.js");

  assert.equal(detectDetailPresentation(makeItem({ body: "short" }), 500), "modal");
  assert.equal(detectDetailPresentation(makeItem({ body: "short" }), 1024), "drawer-narrow");
  assert.equal(detectDetailPresentation(makeItem({ body: "x".repeat(1200) }), 1024), "drawer-wide");
  assert.equal(detectDetailPresentation(makeItem({ body: "x".repeat(2600) }), 1024), "modal");

  const snapshots = [
    { items: [makeItem({ id: "story-alpha" })] },
    { items: [makeItem({ id: "story-alpha" })] },
    { items: [makeItem({ id: "story-beta" })] },
  ];
  const store = createBoardStore({
    storage: null,
    root: { addEventListener() {}, visibilityState: "visible" },
    fetchJson: async () => snapshots.shift(),
  });

  await store.refresh();
  store.setSelectedItem("story-alpha");
  await store.refresh();
  assert.equal(store.getState().selectedItemId, "story-alpha");

  await store.refresh();
  assert.equal(store.getState().selectedItemId, null);
});
