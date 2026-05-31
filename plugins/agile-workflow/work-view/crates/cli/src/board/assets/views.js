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

function placeholderView(id, label, body) {
  return {
    id,
    label,
    mount(root, ctx) {
      const visible = ctx.visibleItems();
      const panel = document.createElement("div");
      panel.className = "view-preview";
      panel.dataset.viewId = id;
      panel.append(
        textElement("h1", "", label),
        textElement("p", "view-digest", `${visible.length} filtered items are mounted through the BoardView contract.`),
        textElement("p", "view-digest", body),
      );
      const stack = document.createElement("div");
      stack.className = "card-stack";
      for (const item of visible.slice(0, 12)) {
        stack.append(ctx.renderCard(item, { compact: true, context: ctx }));
      }
      panel.append(stack);
      root.replaceChildren(panel);
    },
  };
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

export function registeredViews() {
  return Array.from(registry.values());
}

registerView(kanbanView);

registerView(dependencyView);

registerView(tableView);
