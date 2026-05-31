import { renderMarkdown } from "/assets/markdown.js";

let activeDetail = null;

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function valueOrNone(value) {
  return value == null || value === "" ? "(none)" : String(value);
}

function bodyLength(item) {
  return String(item?.body || "").length;
}

export function detectDetailPresentation(item, viewportWidth = window.innerWidth) {
  if (viewportWidth < 760) {
    return "modal";
  }
  const length = bodyLength(item);
  if (length < 900) {
    return "drawer-narrow";
  }
  if (length < 2400) {
    return "drawer-wide";
  }
  return "modal";
}

function frontmatter(item) {
  return [
    ["kind", item.kind],
    ["stage", item.stage],
    ["parent", item.parent],
    ["release", item.release_binding],
    ["tags", Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.join(", ") : null],
    ["depends_on", Array.isArray(item.depends_on) ? item.depends_on.length : 0],
    ["unmet", Array.isArray(item.unmet_deps) ? item.unmet_deps.length : 0],
    ["unblocks", Array.isArray(item.dependents) ? item.dependents.length : 0],
  ];
}

function frontmatterList(item) {
  const list = document.createElement("dl");
  list.className = "dd-frontmatter";
  for (const [label, value] of frontmatter(item)) {
    list.append(
      textElement("dt", "", label),
      textElement("dd", "", valueOrNone(value)),
    );
  }
  return list;
}

function closeButton(ctx) {
  const button = document.createElement("button");
  button.className = "btn btn-ghost btn--sm dd-close";
  button.type = "button";
  button.textContent = "Close";
  button.addEventListener("click", () => closeDetail(ctx));
  return button;
}

function drawer(item, ctx, presentation) {
  const article = document.createElement("article");
  article.className = [
    "detail-drawer",
    "as-drawer",
    presentation === "drawer-wide" ? "w-wide" : "w-narrow",
  ].join(" ");
  const head = document.createElement("div");
  head.className = "dd-head";
  head.append(
    textElement("span", "chip", valueOrNone(item.kind)),
    textElement("span", "dd-id", valueOrNone(item.id)),
    closeButton(ctx),
  );
  const body = document.createElement("div");
  body.className = "dd-md";
  body.append(renderMarkdown(item.body || "", { mode: "detail" }));
  article.append(head, frontmatterList(item), body);
  return article;
}

function modal(item, ctx) {
  const scrim = document.createElement("div");
  scrim.className = "detail-scrim";
  const article = document.createElement("article");
  article.className = "item-modal";
  article.setAttribute("role", "dialog");
  article.setAttribute("aria-modal", "true");
  article.setAttribute("aria-labelledby", "item-detail-title");
  const head = document.createElement("div");
  head.className = "m-head";
  const title = textElement("span", "m-id", valueOrNone(item.id));
  title.id = "item-detail-title";
  head.append(
    textElement("span", "chip", valueOrNone(item.kind)),
    title,
    closeButton(ctx),
  );
  const scroll = document.createElement("div");
  scroll.className = "m-scroll";
  scroll.append(frontmatterList(item), renderMarkdown(item.body || "", { mode: "detail" }));
  article.append(head, scroll);
  scrim.append(article);
  scrim.addEventListener("click", (event) => {
    if (event.target === scrim) {
      closeDetail(ctx);
    }
  });
  return scrim;
}

function renderDetail(item, ctx) {
  const presentation = detectDetailPresentation(item, window.innerWidth);
  if (
    activeDetail?.id === item.id
    && activeDetail?.item === item
    && activeDetail?.presentation === presentation
  ) {
    return;
  }
  const node = presentation === "modal" ? modal(item, ctx) : drawer(item, ctx, presentation);
  activeDetail?.node.remove();
  document.body.append(node);
  activeDetail = { id: item.id, item, presentation, node, ctx };
}

function closeActive() {
  activeDetail?.node.remove();
  activeDetail = null;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeDetail) {
    closeDetail(activeDetail.ctx);
  }
});

export function openDetail(id, ctx) {
  const item = ctx.getItemById(id);
  if (!item) {
    closeDetail(ctx);
    return;
  }
  const wasSelected = ctx.getState().selectedItemId === item.id;
  ctx.setSelectedItem?.(item.id);
  if (wasSelected || typeof ctx.setSelectedItem !== "function") {
    renderDetail(item, ctx);
  }
}

export function closeDetail(ctx = null) {
  closeActive();
  ctx?.setSelectedItem?.(null);
}

export function syncDetail(ctx) {
  const selectedItemId = ctx.getState().selectedItemId;
  if (!selectedItemId) {
    closeActive();
    return;
  }
  const item = ctx.getItemById(selectedItemId);
  if (!item) {
    closeDetail(ctx);
    return;
  }
  renderDetail(item, ctx);
}
