import { deriveFilterOptions } from "/assets/filters.js";

const NO_PARENT_LANE = "(no parent)";
const NULL_SENTINEL = "unassigned";

let focusedLane = null;
let pendingFocusLane = undefined;

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function stageValue(item) {
  return item?.stage == null || item.stage === "" ? NULL_SENTINEL : String(item.stage);
}

function withNullLast(values) {
  const stages = values.filter((stage) => stage !== NULL_SENTINEL);
  if (values.includes(NULL_SENTINEL)) {
    stages.push(NULL_SENTINEL);
  }
  return stages;
}

export function stageOrder(snapshot, items) {
  const derived = deriveFilterOptions(snapshot).stages;
  const known = new Set(derived);
  const extras = [];
  for (const item of items) {
    const stage = stageValue(item);
    if (!known.has(stage)) {
      known.add(stage);
      extras.push(stage);
    }
  }
  return withNullLast(derived.concat(extras.sort((a, b) => a.localeCompare(b))));
}

export function groupItemsByStage(items, stages) {
  const groups = new Map(stages.map((stage) => [stage, []]));
  for (const item of items) {
    const stage = stageValue(item);
    if (!groups.has(stage)) {
      groups.set(stage, []);
    }
    groups.get(stage).push(item);
  }
  return groups;
}

export function laneIdForItem(item) {
  if (item?.parent) {
    return String(item.parent);
  }
  if (item?.kind === "epic" && item.id) {
    return String(item.id);
  }
  return NO_PARENT_LANE;
}

export function groupItemsByLane(items) {
  const groups = new Map();
  for (const item of items) {
    const laneId = laneIdForItem(item);
    if (!groups.has(laneId)) {
      groups.set(laneId, []);
    }
    groups.get(laneId).push(item);
  }
  return groups;
}

export function laneProgress(items) {
  const done = items.filter((item) => item?.is_terminal || stageValue(item) === "done").length;
  return { done, total: items.length };
}

function renderColumn(stage, items, ctx, columnId) {
  const column = document.createElement("section");
  column.className = "kanban-column";
  column.dataset.stage = stage;
  column.setAttribute("aria-labelledby", columnId);

  const heading = document.createElement("header");
  heading.className = "kanban-column__header";
  const title = textElement("h2", "", stage);
  title.id = column.getAttribute("aria-labelledby");
  heading.append(title, textElement("span", "kanban-count", String(items.length)));

  const stack = document.createElement("div");
  stack.className = "kanban-column__cards";
  if (items.length === 0) {
    stack.append(textElement("p", "kanban-empty", "empty"));
  } else {
    for (const item of items) {
      stack.append(ctx.renderCard(item, { compact: true, context: ctx }));
    }
  }

  column.append(heading, stack);
  return column;
}

function renderFocusStrip(laneIds, activeLane, root, ctx) {
  const strip = document.createElement("nav");
  strip.className = "kanban-lane-strip";
  strip.setAttribute("aria-label", "Kanban lane focus");

  const allButton = document.createElement("button");
  allButton.className = "filter-chip kanban-lane-chip";
  allButton.type = "button";
  allButton.textContent = "All lanes";
  allButton.dataset.laneAll = "true";
  allButton.setAttribute("aria-pressed", String(activeLane == null));
  allButton.addEventListener("click", () => {
    focusedLane = null;
    pendingFocusLane = null;
    kanbanView.mount(root, ctx);
  });
  strip.append(allButton);

  for (const laneId of laneIds) {
    const button = document.createElement("button");
    button.className = "filter-chip kanban-lane-chip";
    button.type = "button";
    button.textContent = laneId;
    button.dataset.lane = laneId;
    button.setAttribute("aria-pressed", String(activeLane === laneId));
    button.addEventListener("click", () => {
      focusedLane = laneId;
      pendingFocusLane = laneId;
      kanbanView.mount(root, ctx);
    });
    strip.append(button);
  }

  return strip;
}

function renderLane(laneId, items, stages, ctx, laneIndex) {
  const lane = document.createElement("section");
  lane.className = "kanban-lane";
  lane.dataset.lane = laneId;
  lane.setAttribute("aria-labelledby", `kanban-lane-${laneIndex}`);

  const progress = laneProgress(items);
  const header = document.createElement("header");
  header.className = "kanban-lane__header";
  const title = textElement("h2", "", laneId);
  title.id = lane.getAttribute("aria-labelledby");
  const summary = textElement("span", "kanban-progress", `${progress.done}/${progress.total} done`);
  const meter = document.createElement("span");
  meter.className = "kanban-progressbar";
  meter.setAttribute("role", "progressbar");
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", String(progress.total));
  meter.setAttribute("aria-valuenow", String(progress.done));
  meter.style.setProperty(
    "--lane-progress",
    progress.total === 0 ? "0%" : `${(progress.done / progress.total) * 100}%`,
  );
  header.append(title, summary, meter);

  const board = document.createElement("div");
  board.className = "kanban-board";
  board.setAttribute("aria-label", `${laneId} items grouped by stage`);
  const groups = groupItemsByStage(items, stages);
  let columnIndex = 0;
  for (const [stage, stageItems] of groups) {
    board.append(renderColumn(stage, stageItems, ctx, `kanban-stage-${laneIndex}-${columnIndex}`));
    columnIndex += 1;
  }

  lane.append(header, board);
  return lane;
}

function restoreLaneFocus(root) {
  if (pendingFocusLane === undefined) {
    return;
  }
  const focusLane = pendingFocusLane;
  pendingFocusLane = undefined;
  for (const button of root.querySelectorAll(".kanban-lane-chip")) {
    if ((focusLane == null && button.dataset.laneAll === "true") || button.dataset.lane === focusLane) {
      button.focus({ preventScroll: true });
      return;
    }
  }
}

export const kanbanView = {
  id: "kanban",
  label: "Kanban",
  mount(root, ctx) {
    const items = ctx.visibleItems();
    const snapshot = ctx.getState().snapshot;
    const stages = stageOrder(snapshot, items);
    const lanes = groupItemsByLane(items);
    const laneIds = Array.from(lanes.keys()).sort((a, b) => a.localeCompare(b));
    const activeLane = focusedLane && lanes.has(focusedLane) ? focusedLane : null;
    const visibleLaneIds = activeLane ? [activeLane] : laneIds;

    const view = document.createElement("div");
    view.className = "kanban-view";

    const header = document.createElement("header");
    header.className = "kanban-view__header";
    header.append(
      textElement("h1", "", "Kanban"),
      textElement("p", "view-digest", `${items.length} filtered items grouped by lane and workflow stage.`),
    );

    const lanesRoot = document.createElement("div");
    lanesRoot.className = "kanban-lanes";
    let laneIndex = 0;
    for (const laneId of visibleLaneIds) {
      lanesRoot.append(renderLane(laneId, lanes.get(laneId) || [], stages, ctx, laneIndex));
      laneIndex += 1;
    }

    view.append(header, renderFocusStrip(laneIds, activeLane, root, ctx), lanesRoot);
    root.replaceChildren(view);
    restoreLaneFocus(root);
  },
};
