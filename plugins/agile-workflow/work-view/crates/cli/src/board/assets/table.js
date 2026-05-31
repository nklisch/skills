import { deriveFilterOptions } from "/assets/filters.js";

const COLUMNS = [
  { id: "id", label: "id", className: "mono" },
  { id: "kind", label: "kind" },
  { id: "stage", label: "stage" },
  { id: "status", label: "status" },
  { id: "parent", label: "parent", className: "mono" },
  { id: "depends_on", label: "depends_on", className: "mono" },
  { id: "updated", label: "updated", className: "mono" },
];
const STATUS_ORDER = ["blocked", "ready", "active", "done"];

let sortState = null;
let pendingHeaderFocus = null;

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

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""));
}

function compareNumber(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function updatedTime(item) {
  const time = Date.parse(item?.updated || "");
  return Number.isNaN(time) ? 0 : time;
}

function dependencySortValue(item) {
  return arrayCount(item?.unmet_deps) * 10000 + arrayCount(item?.depends_on);
}

function stageIndex(snapshot, stage) {
  const stages = deriveFilterOptions(snapshot).stages;
  const index = stages.indexOf(stage || "");
  return index === -1 ? stages.length : index;
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

export function compareRows(left, right, columnId, snapshot) {
  switch (columnId) {
    case "status":
      return compareNumber(STATUS_ORDER.indexOf(statusFor(left)), STATUS_ORDER.indexOf(statusFor(right)));
    case "stage":
      return compareNumber(stageIndex(snapshot, left?.stage), stageIndex(snapshot, right?.stage));
    case "depends_on":
      return compareNumber(dependencySortValue(left), dependencySortValue(right));
    case "updated":
      return compareNumber(updatedTime(left), updatedTime(right));
    default:
      return compareText(tableValue(left, columnId), tableValue(right, columnId));
  }
}

function defaultCompare(left, right, snapshot) {
  return compareRows(left, right, "status", snapshot)
    || compareRows(left, right, "stage", snapshot)
    || -compareRows(left, right, "updated", snapshot)
    || compareRows(left, right, "id", snapshot);
}

function sortedItems(items, snapshot) {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((left, right) => {
    if (!sortState) {
      return defaultCompare(left.item, right.item, snapshot) || compareNumber(left.index, right.index);
    }
    const direction = sortState.dir === "desc" ? -1 : 1;
    return direction * compareRows(left.item, right.item, sortState.column, snapshot)
      || compareRows(left.item, right.item, "id", snapshot)
      || compareNumber(left.index, right.index);
  });
  return indexed.map(({ item }) => item);
}

function toggleSort(columnId) {
  if (sortState?.column === columnId) {
    sortState = { column: columnId, dir: sortState.dir === "asc" ? "desc" : "asc" };
  } else {
    sortState = { column: columnId, dir: "asc" };
  }
}

function renderHeader(root, ctx) {
  const thead = document.createElement("thead");
  const row = document.createElement("tr");
  for (const column of COLUMNS) {
    const th = document.createElement("th");
    const active = sortState?.column === column.id;
    th.setAttribute("aria-sort", active ? (sortState.dir === "asc" ? "ascending" : "descending") : "none");
    const button = document.createElement("button");
    button.className = "table-sort-button";
    button.type = "button";
    button.dataset.column = column.id;
    button.textContent = column.label;
    button.addEventListener("click", () => {
      toggleSort(column.id);
      pendingHeaderFocus = column.id;
      tableView.mount(root, ctx);
    });
    th.append(button);
    if (active) {
      th.append(textElement("span", "sort", sortState.dir === "asc" ? "↑" : "↓"));
    }
    row.append(th);
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

function renderTable(items, ctx, root) {
  const table = document.createElement("table");
  table.className = "table board-table";
  const tbody = document.createElement("tbody");
  for (const item of items) {
    tbody.append(renderRow(item, ctx));
  }
  table.append(renderHeader(root, ctx), tbody);
  return table;
}

function restoreHeaderFocus(root) {
  if (!pendingHeaderFocus) {
    return;
  }
  const focusColumn = pendingHeaderFocus;
  pendingHeaderFocus = null;
  for (const button of root.querySelectorAll(".table-sort-button")) {
    if (button.dataset.column === focusColumn) {
      button.focus({ preventScroll: true });
      return;
    }
  }
}

export const tableView = {
  id: "table",
  label: "Table",
  mount(root, ctx) {
    const state = ctx.getState();
    const items = sortedItems(ctx.visibleItems(), state.snapshot);
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
    tableWrap.append(renderTable(items, ctx, root));
    view.append(header, tableWrap);
    root.replaceChildren(view);
    restoreHeaderFocus(root);
  },
};
