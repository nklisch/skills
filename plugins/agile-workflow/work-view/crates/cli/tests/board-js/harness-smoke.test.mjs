import test from "node:test";
import assert from "node:assert/strict";

import { installDomGlobals, loadBoardModule } from "./harness.mjs";

test("board asset modules load through the no-build harness", async () => {
  installDomGlobals();
  const filters = await loadBoardModule("filters.js");
  assert.equal(typeof filters.createDefaultFilters, "function");
  assert.equal(typeof filters.matchesFilters, "function");
});
