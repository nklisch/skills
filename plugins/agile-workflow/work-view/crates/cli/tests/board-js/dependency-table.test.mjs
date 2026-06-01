import test from "node:test";
import assert from "node:assert/strict";

import { installDomGlobals, loadBoardModule, makeItem } from "./harness.mjs";

test("dependency model reports cycles and missing dependency stubs", async () => {
  installDomGlobals();
  const { buildDependencyModel } = await loadBoardModule("dependency.js");
  const model = buildDependencyModel([
    makeItem({ id: "story-a", depends_on: ["story-c"] }),
    makeItem({ id: "story-b", depends_on: ["story-a"] }),
    makeItem({ id: "story-c", depends_on: ["story-b", "missing-dep"], unmet_deps: ["missing-dep"] }),
  ]);

  assert.deepEqual(new Set(model.cycleIds), new Set(["story-a", "story-b", "story-c"]));
  assert.equal(model.nodes.has("external:missing-dep"), true);
  assert.equal(model.nodes.get("external:missing-dep").external, true);
  assert.equal(
    model.edges.some((edge) => edge.from === "external:missing-dep" && edge.to === "story-c" && edge.unmet),
    true,
  );
});

test("dependency model represents filtered dependencies as unmet external stubs", async () => {
  installDomGlobals();
  const { buildDependencyModel } = await loadBoardModule("dependency.js");
  const model = buildDependencyModel([
    makeItem({ id: "visible-story", depends_on: ["filtered-story"], unmet_deps: ["filtered-story"] }),
  ]);

  assert.equal(model.nodes.has("external:filtered-story"), true);
  assert.equal(model.nodes.get("external:filtered-story").external, true);
  assert.equal(
    model.edges.some((edge) => (
      edge.from === "external:filtered-story"
      && edge.to === "visible-story"
      && edge.external
      && edge.unmet
    )),
    true,
  );
});

test("table comparators are deterministic, stage-aware, and tolerate missing updated", async () => {
  installDomGlobals();
  const { compareRows, sortedItems } = await loadBoardModule("table.js");
  const snapshot = {
    items: [
      makeItem({ id: "draft", stage: "drafting" }),
      makeItem({ id: "done", stage: "done" }),
      makeItem({ id: "empty-updated", updated: "" }),
      makeItem({ id: "dated", updated: "2026-06-01" }),
    ],
  };

  assert.equal(compareRows(snapshot.items[0], snapshot.items[1], "stage", snapshot) < 0, true);
  assert.equal(compareRows(snapshot.items[2], snapshot.items[3], "updated", snapshot) < 0, true);

  const duplicateA = makeItem({ id: "same", stage: "done", updated: "2026-06-01" });
  const duplicateB = makeItem({ id: "same", stage: "done", updated: "2026-06-01" });
  const sorted = sortedItems([duplicateA, duplicateB], { items: [duplicateA, duplicateB] });
  assert.equal(sorted[0], duplicateA);
  assert.equal(sorted[1], duplicateB);
});
