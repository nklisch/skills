import { NULL_SENTINEL, deriveFilterOptions } from "/assets/filters.js";

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

function renderColumn(stage, items, ctx, index) {
  const column = document.createElement("section");
  column.className = "kanban-column";
  column.dataset.stage = stage;
  column.setAttribute("aria-labelledby", `kanban-stage-${index}`);

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

export const kanbanView = {
  id: "kanban",
  label: "Kanban",
  mount(root, ctx) {
    const items = ctx.visibleItems();
    const snapshot = ctx.getState().snapshot;
    const stages = stageOrder(snapshot, items);
    const groups = groupItemsByStage(items, stages);

    const view = document.createElement("div");
    view.className = "kanban-view";

    const header = document.createElement("header");
    header.className = "kanban-view__header";
    header.append(
      textElement("h1", "", "Kanban"),
      textElement("p", "view-digest", `${items.length} filtered items grouped by workflow stage.`),
    );

    const board = document.createElement("div");
    board.className = "kanban-board";
    board.setAttribute("aria-label", "Items grouped by stage");
    let index = 0;
    for (const [stage, stageItems] of groups) {
      board.append(renderColumn(stage, stageItems, ctx, index));
      index += 1;
    }

    view.append(header, board);
    root.replaceChildren(view);
  },
};
