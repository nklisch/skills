import { kanbanView } from "/assets/kanban.js";
import { dependencyView } from "/assets/dependency.js";
import { tableView } from "/assets/table.js";

const registry = new Map();

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

export function registerView(view) {
  if (!view || typeof view.id !== "string" || typeof view.mount !== "function") {
    throw new Error("Board views must provide string id and mount(root, ctx)");
  }
  registry.set(view.id, view);
  return view;
}

export function mountCurrentView(root, ctx) {
  if (!root) {
    return;
  }
  const state = ctx.getState();
  const view = registry.get(state.view);
  if (!view) {
    root.replaceChildren(textElement("div", "view-placeholder empty", `No registered view: ${state.view}`));
    return;
  }
  view.mount(root, ctx);
}

registerView(kanbanView);

registerView(dependencyView);

registerView(tableView);
