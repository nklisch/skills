import { markdownSummary, renderInlineMarkdown } from "/assets/markdown.js";

function text(tag, className, value) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = value;
  return node;
}

function valueOrNone(value) {
  return value == null || value === "" ? "—" : String(value);
}

function countOf(value) {
  return Array.isArray(value) ? value.length : 0;
}

function kindClass(kind) {
  const normalized = valueOrNone(kind).toLowerCase();
  return ["epic", "feature", "story", "release", "backlog"].includes(normalized)
    ? normalized
    : "backlog";
}

function badge(label, className) {
  return text("span", `badge ${className}`, label);
}

function meta(label, value, className = "") {
  const node = text("span", className, `${label}: ${valueOrNone(value)}`);
  node.dataset.label = label;
  return node;
}

function dependencyMeta(item) {
  const deps = countOf(item.depends_on);
  const unmet = countOf(item.unmet_deps);
  const dependents = countOf(item.dependents);
  const children = countOf(item.children);
  const node = document.createElement("span");
  node.className = "dep";
  node.append(
    text("span", "arrow", "deps"),
    document.createTextNode(` ${deps}`),
    document.createTextNode(` / unmet ${unmet}`),
    document.createTextNode(` / unblocks ${dependents}`),
    document.createTextNode(` / children ${children}`),
  );
  return node;
}

function resolveOpen(options) {
  if (typeof options.onOpen === "function") {
    return options.onOpen;
  }
  const context = options.context || options.ctx;
  if (context && typeof context.openDetail === "function") {
    return (id) => context.openDetail(id);
  }
  return null;
}

function activateCard(item, options) {
  const open = resolveOpen(options);
  if (open && item?.id) {
    open(item.id);
  }
}

export function renderCard(item, options = {}) {
  const kind = kindClass(item?.kind);
  const card = document.createElement("article");
  card.className = [
    "item-card",
    `item-card--${kind}`,
    options.compact ? "item-card--compact" : "",
    item?.blocked ? "is-blocked" : "",
    options.selected ? "is-selected" : "",
  ].filter(Boolean).join(" ");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${valueOrNone(item?.id)}`);
  if (item?.id) {
    card.dataset.id = String(item.id);
  }

  const head = document.createElement("div");
  head.className = "ic-head";
  head.append(
    text("span", `chip chip--${kind}`, valueOrNone(item?.kind)),
    text("span", "ic-id", valueOrNone(item?.id)),
  );
  if (item?.ready) {
    head.append(badge("ready", "badge--ready"));
  }
  if (item?.blocked) {
    head.append(badge("blocked", "badge--blocked"));
  }
  if (item?.is_terminal || item?.stage === "done" || item?.stage === "released") {
    head.append(badge("done", "badge--done"));
  }

  const summary = document.createElement("div");
  summary.className = "ic-body";
  const summaryText = markdownSummary(item?.body || "", options.compact ? 120 : 220);
  if (summaryText) {
    summary.append(renderInlineMarkdown(summaryText, { allowLinks: false }));
  } else {
    summary.textContent = "No body summary.";
    summary.classList.add("is-empty");
  }

  const metaRow = document.createElement("div");
  metaRow.className = "ic-meta";
  metaRow.append(
    meta("stage", item?.stage, "ic-stage"),
    meta("parent", item?.parent, "ic-parent"),
    dependencyMeta(item || {}),
  );

  const tags = Array.isArray(item?.tags) ? item.tags : [];
  if (tags.length > 0) {
    metaRow.append(meta("tags", tags.join(", "), "ic-tags"));
  }

  card.append(head, summary, metaRow);

  card.addEventListener("click", () => activateCard(item, options));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateCard(item, options);
    }
  });

  return card;
}
