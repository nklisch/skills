import { createBoardStore } from "/assets/state.js";
import { renderCard } from "/assets/card.js";

const root = document.documentElement;
const accentPicker = document.getElementById("theme-accent");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const viewTabs = Array.from(document.querySelectorAll("[data-view]"));
const statusRegion = document.getElementById("status-region");
const statusText = statusRegion?.querySelector(".status-text");
const statusSpinner = statusRegion?.querySelector(".spinner");
const diagnosticsSummary = document.getElementById("diagnostics-summary");
const diagnosticsRegion = document.getElementById("diagnostics-region");
const viewRoot = document.getElementById("view-root");
const refreshButton = document.getElementById("refresh-button");
const searchInput = document.getElementById("filter-search");
const autoHideButton = document.getElementById("auto-hide-released");
const kindButtons = filterButtons("Kind filters");
const stageButtons = filterButtons("Stage filters");

const store = createBoardStore({ storage: window.localStorage, root: document });
window.boardContext = store;

function filterButtons(label) {
  const group = document.querySelector(`[aria-label="${label}"]`);
  return Array.from(group?.querySelectorAll(".filter-chip") || []);
}

function replaceChildren(node, children) {
  if (!node) {
    return;
  }
  node.replaceChildren(...children);
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function emptyState(glyph, title, body) {
  const wrapper = document.createElement("div");
  wrapper.className = "view-placeholder empty";
  wrapper.append(
    textElement("span", "glyph", glyph),
    textElement("h1", "", title),
    textElement("p", "", body),
  );
  return wrapper;
}

function alertNode(kind, title, detail) {
  const alert = document.createElement("div");
  alert.className = `alert alert--${kind}`;
  const icon = textElement("span", "ico", kind === "danger" ? "!" : kind === "warning" ? "?" : "i");
  icon.setAttribute("aria-hidden", "true");
  const body = document.createElement("span");
  body.className = "body";
  body.append(textElement("strong", "", title));
  if (detail) {
    body.append(textElement("small", "", detail));
  }
  alert.append(icon, body);
  return alert;
}

function diagnosticsFor(snapshot) {
  const diagnostics = snapshot?.diagnostics || {};
  const entries = [];
  for (const error of diagnostics.parse_errors || []) {
    entries.push({
      kind: "danger",
      title: "Parse error",
      detail: [error.rel_path, error.reason].filter(Boolean).join(" - "),
    });
  }
  for (const warning of diagnostics.validation_warnings || []) {
    entries.push({
      kind: "warning",
      title: warning.id ? `Validation warning: ${warning.id}` : "Validation warning",
      detail: [warning.rel_path, warning.field, warning.reason].filter(Boolean).join(" - "),
    });
  }
  for (const duplicate of diagnostics.duplicate_ids || []) {
    entries.push({
      kind: "warning",
      title: duplicate.id ? `Duplicate id: ${duplicate.id}` : "Duplicate id",
      detail: [duplicate.rel_path, duplicate.reason].filter(Boolean).join(" - "),
    });
  }
  for (const id of diagnostics.client_duplicate_ids || []) {
    entries.push({
      kind: "warning",
      title: `Duplicate id in feed: ${id}`,
      detail: "The browser snapshot contains more than one item with this id.",
    });
  }
  return entries;
}

function applyTheme(theme) {
  root.dataset.accent = theme.accent;
  if (theme.mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = theme.mode;
  }
  if (accentPicker) {
    accentPicker.value = theme.accent;
  }
  for (const button of modeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === theme.mode));
  }
}

function applyView(view) {
  for (const tab of viewTabs) {
    tab.setAttribute("aria-selected", String(tab.dataset.view === view));
  }
}

function syncFilterControls(filters) {
  if (searchInput && searchInput.value !== filters.search) {
    searchInput.value = filters.search;
  }
  for (const button of kindButtons) {
    button.setAttribute("aria-pressed", String(filters.kinds.has(button.textContent.trim())));
  }
  for (const button of stageButtons) {
    button.setAttribute("aria-pressed", String(filters.stages.has(button.textContent.trim())));
  }
  autoHideButton?.setAttribute("aria-pressed", String(filters.autoHideReleased));
}

function updateStatus(state, visibleCount) {
  if (statusSpinner) {
    statusSpinner.hidden = !state.loading;
  }
  if (refreshButton) {
    refreshButton.disabled = state.loading;
  }
  if (!statusText) {
    return;
  }
  if (state.loading && !state.snapshot) {
    statusText.textContent = "Loading substrate data";
    return;
  }
  if (state.error && !state.snapshot) {
    statusText.textContent = "Substrate feed unavailable";
    return;
  }
  if (state.snapshot) {
    const total = state.snapshot.items.length;
    const project = state.snapshot.project || "substrate";
    const version = state.snapshot.work_view_version || "unknown";
    statusText.textContent = `${project} / ${version} / ${visibleCount}/${total} visible`;
    return;
  }
  statusText.textContent = "Waiting for substrate data";
}

function renderDiagnostics(state) {
  const diagnostics = diagnosticsFor(state.snapshot);
  diagnosticsSummary?.replaceChildren(textElement("span", "count", `${diagnostics.length} diagnostics`));
  const nodes = diagnostics.map((entry) => alertNode(entry.kind, entry.title, entry.detail));
  if (state.error) {
    nodes.unshift(alertNode("danger", "Feed request failed", state.error));
  }
  replaceChildren(diagnosticsRegion, nodes);
}

function renderView(state) {
  if (!viewRoot) {
    return;
  }
  if (state.loading && !state.snapshot) {
    viewRoot.replaceChildren(emptyState("::", "Loading substrate data", "Fetching /api/substrate from the local board host."));
    return;
  }
  if (state.error && !state.snapshot) {
    viewRoot.replaceChildren(emptyState("!", "Feed unavailable", "The board shell is still usable; refresh when the substrate feed is available."));
    return;
  }
  if (!state.snapshot) {
    viewRoot.replaceChildren(emptyState("::", "Board shell ready", "Kanban, dependency, and table views mount here as their stories land."));
    return;
  }

  const visible = store.visibleItems();
  if (state.snapshot.items.length === 0) {
    viewRoot.replaceChildren(emptyState("0", "No substrate items", "The feed loaded successfully, but it did not contain any items."));
    return;
  }
  if (visible.length === 0) {
    viewRoot.replaceChildren(emptyState("0", "No matching items", "Adjust filters or show released and archived items to widen the view."));
    return;
  }

  const panel = document.createElement("div");
  panel.className = "view-preview";
  panel.append(textElement("h1", "", `${state.view} view pending`));
  panel.append(textElement("p", "view-digest", `${visible.length} visible items are ready for the ${state.view} view story.`));
  const stack = document.createElement("div");
  stack.className = "card-stack";
  for (const item of visible.slice(0, 8)) {
    stack.append(renderCard(item, {
      compact: true,
      onOpen: (id) => {
        const selected = store.getItemById(id);
        if (statusText && selected) {
          statusText.textContent = `Selected ${selected.id}`;
        }
      },
    }));
  }
  panel.append(stack);
  viewRoot.replaceChildren(panel);
}

function render(state) {
  const visibleCount = store.visibleItems().length;
  applyTheme(state.theme);
  applyView(state.view);
  syncFilterControls(state.filters);
  updateStatus(state, visibleCount);
  renderDiagnostics(state);
  renderView(state);
}

accentPicker?.addEventListener("change", (event) => {
  store.setTheme({ accent: event.target.value });
});

for (const button of modeButtons) {
  button.addEventListener("click", () => store.setTheme({ mode: button.dataset.mode || "system" }));
}

for (const tab of viewTabs) {
  tab.addEventListener("click", () => store.setView(tab.dataset.view || "kanban"));
}

for (const button of kindButtons) {
  button.addEventListener("click", () => {
    const filters = store.getState().filters;
    const value = button.textContent.trim();
    const next = new Set(filters.kinds);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    store.setFilter("kinds", next);
  });
}

for (const button of stageButtons) {
  button.addEventListener("click", () => {
    const filters = store.getState().filters;
    const value = button.textContent.trim();
    const next = new Set(filters.stages);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    store.setFilter("stages", next);
  });
}

searchInput?.addEventListener("input", (event) => {
  store.setFilter("search", event.target.value);
});

autoHideButton?.addEventListener("click", () => {
  store.setFilter("autoHideReleased", !store.getState().filters.autoHideReleased);
});

refreshButton?.addEventListener("click", () => {
  void store.refresh();
});

store.subscribe(render);
render(store.getState());
void store.refresh();
