import { renderMarkdown } from "/assets/markdown.js";

let activeDetail = null;
let returnFocus = null;

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function valueOrNone(value) {
  return value == null || value === "" ? "—" : String(value);
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

function detailTitle(item) {
  const title = textElement("span", "dd-id", valueOrNone(item.id));
  title.id = "item-detail-title";
  return title;
}

function drawer(item, ctx, presentation) {
  const article = document.createElement("article");
  article.className = [
    "detail-drawer",
    "as-drawer",
    presentation === "drawer-wide" ? "w-wide" : "w-narrow",
  ].join(" ");
  article.tabIndex = -1;
  article.setAttribute("role", "dialog");
  article.setAttribute("aria-modal", "true");
  article.setAttribute("aria-labelledby", "item-detail-title");
  const head = document.createElement("div");
  head.className = "dd-head";
  head.append(
    textElement("span", "chip", valueOrNone(item.kind)),
    detailTitle(item),
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
  article.tabIndex = -1;
  article.setAttribute("role", "dialog");
  article.setAttribute("aria-modal", "true");
  article.setAttribute("aria-labelledby", "item-detail-title");
  const head = document.createElement("div");
  head.className = "m-head";
  const title = detailTitle(item);
  title.className = "m-id";
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

function setBackgroundInert(active) {
  const shell = document.querySelector(".app-shell");
  if (!shell) {
    return;
  }
  if (active) {
    shell.setAttribute("aria-hidden", "true");
    shell.inert = true;
  } else {
    shell.removeAttribute("aria-hidden");
    shell.inert = false;
  }
}

function rememberReturnFocus() {
  const element = document.activeElement;
  if (element && element !== document.body && typeof element.focus === "function") {
    returnFocus = element;
  }
}

function restoreReturnFocus() {
  const element = returnFocus;
  returnFocus = null;
  if (element?.isConnected && typeof element.focus === "function") {
    element.focus({ preventScroll: true });
  }
}

function focusDetail(node) {
  const target = node.querySelector(".dd-close") || node.querySelector("[role='dialog']") || node;
  target.focus({ preventScroll: true });
}

function focusableNodes() {
  if (!activeDetail) {
    return [];
  }
  return Array.from(activeDetail.node.querySelectorAll(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
  )).filter((node) => !node.disabled && node.getAttribute("aria-hidden") !== "true");
}

function trapFocus(event) {
  const focusable = focusableNodes();
  if (focusable.length === 0) {
    event.preventDefault();
    activeDetail?.node.focus?.({ preventScroll: true });
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
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
  setBackgroundInert(true);
  document.body.append(node);
  activeDetail = { id: item.id, item, presentation, node, ctx };
  focusDetail(node);
}

function closeActive() {
  activeDetail?.node.remove();
  activeDetail = null;
  setBackgroundInert(false);
  restoreReturnFocus();
}

document.addEventListener("keydown", (event) => {
  if (!activeDetail) {
    return;
  }
  if (event.key === "Escape") {
    closeDetail(activeDetail.ctx);
  } else if (event.key === "Tab") {
    trapFocus(event);
  }
});

export function openDetail(id, ctx) {
  const item = ctx.getItemById(id);
  if (!item) {
    closeDetail(ctx);
    return;
  }
  rememberReturnFocus();
  ctx.setSelectedItem?.(item.id);
  renderDetail(item, ctx);
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
