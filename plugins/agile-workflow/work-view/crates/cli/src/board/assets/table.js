const COLUMNS = [
  { id: "id", label: "id", className: "mono" },
  { id: "kind", label: "kind" },
  { id: "stage", label: "stage" },
  { id: "status", label: "status" },
  { id: "parent", label: "parent", className: "mono" },
  { id: "depends_on", label: "depends_on", className: "mono" },
  { id: "updated", label: "updated", className: "mono" },
];

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function arrayCount(value) {
  return Array.isArray(value) ? value.length : 0;
}

function statusFor(item) {
  if (item?.blocked) {
    return "blocked";
  }
  if (item?.ready) {
    return "ready";
  }
  if (item?.is_terminal || item?.stage === "done" || item?.stage === "released") {
    return "done";
  }
  return "active";
}

export function tableValue(item, columnId) {
  switch (columnId) {
    case "id":
      return item?.id || "";
    case "kind":
      return item?.kind || "";
    case "stage":
      return item?.stage || "";
    case "status":
      return statusFor(item);
    case "parent":
      return item?.parent || "(none)";
    case "depends_on": {
      const total = arrayCount(item?.depends_on);
      const unmet = arrayCount(item?.unmet_deps);
      return unmet > 0 ? `${unmet}/${total} unmet` : String(total);
    }
    case "updated":
      return item?.updated || "";
    default:
      return "";
  }
}

function renderHeader() {
  const thead = document.createElement("thead");
  const row = document.createElement("tr");
  for (const column of COLUMNS) {
    row.append(textElement("th", "", column.label));
  }
  thead.append(row);
  return thead;
}

function renderStatusCell(item) {
  const status = statusFor(item);
  const td = document.createElement("td");
  if (status === "active") {
    td.textContent = status;
    return td;
  }
  td.append(textElement("span", `badge badge--${status}`, status));
  return td;
}

function openItemDetail(item, ctx) {
  if (item?.id) {
    ctx.openDetail(item.id);
  }
}

function renderRow(item, ctx) {
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.dataset.itemId = item?.id || "";
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `Open ${item?.id || "item"} detail`);
  row.addEventListener("click", () => openItemDetail(item, ctx));
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItemDetail(item, ctx);
    }
  });

  for (const column of COLUMNS) {
    if (column.id === "status") {
      row.append(renderStatusCell(item));
      continue;
    }
    row.append(textElement("td", column.className || "", tableValue(item, column.id)));
  }
  return row;
}

function renderTable(items, ctx) {
  const table = document.createElement("table");
  table.className = "table board-table";
  const tbody = document.createElement("tbody");
  for (const item of items) {
    tbody.append(renderRow(item, ctx));
  }
  table.append(renderHeader(), tbody);
  return table;
}

export const tableView = {
  id: "table",
  label: "Table",
  mount(root, ctx) {
    const items = ctx.visibleItems();
    const view = document.createElement("div");
    view.className = "table-view";
    const header = document.createElement("header");
    header.className = "table-view__header";
    header.append(
      textElement("h1", "", "Table"),
      textElement("p", "view-digest", `${items.length} filtered items in a dense table.`),
    );
    const tableWrap = document.createElement("div");
    tableWrap.className = "table-wrap";
    tableWrap.append(renderTable(items, ctx));
    view.append(header, tableWrap);
    root.replaceChildren(view);
  },
};
