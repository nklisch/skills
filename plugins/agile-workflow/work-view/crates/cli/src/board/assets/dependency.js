const EXTERNAL_PREFIX = "external:";
const KIND_CLASSES = new Set(["epic", "feature", "story", "release", "backlog"]);
const NODE_WIDTH = 280;
const MIN_NODE_HEIGHT = 132;
const NODE_WEB_WIDTH = 168;
const NODE_WEB_HEIGHT = 76;
const LAYER_GAP = 110;
const ROW_GAP = 28;
const CANVAS_PADDING = 24;
const LARGE_GRAPH_THRESHOLD = 48;
const ID_CHARS_PER_LINE = 25;
const EDGE_CHARS_PER_LINE = 22;
const NODE_HEIGHT_BUFFER = 10;
const DRAG_THRESHOLD_PX = 4;
const NODE_DRAG_HOLD_MS = 160;
const GROUP_LABEL_HEIGHT = 24;
const GROUP_LABEL_GAP = 14;
const WEB_RING_RADIUS = 240;
const MIN_GRAPH_ZOOM = 0.5;
const MAX_GRAPH_ZOOM = 2;
const GRAPH_ZOOM_STEP = 0.25;
const DEFAULT_GRAPH_ZOOM = 0.75;
const GRAPH_LAYOUTS = [
  { id: "flow", label: "Flow" },
  { id: "stage", label: "Stage" },
  { id: "kind", label: "Kind" },
  { id: "impact", label: "Impact" },
  { id: "web", label: "Web" },
];
const GRAPH_TOOLS = [
  { id: "inspect", label: "Inspect", icon: "inspect", title: "Inspect items; hold and drag nodes to rearrange" },
  { id: "pan", label: "Hand", icon: "pan", title: "Pan empty canvas; click nodes for details; hold and drag nodes to rearrange" },
];
const STAGE_LAYOUT_ORDER = ["drafting", "implementing", "review", "done", "released", "backlog", "unstaged", "external"];
const KIND_LAYOUT_ORDER = ["epic", "feature", "story", "release", "backlog", "idea", "item", "external"];

let focusedNode = null;
let activeLayoutId = GRAPH_LAYOUTS[0].id;
let activeGraphTool = GRAPH_TOOLS[0].id;
let activeGraphZoom = DEFAULT_GRAPH_ZOOM;
let showTerminalBranches = false;
let activeEdgeGeometryCleanup = null;

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

function svgIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("dependency-toolbar__icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.6");
  if (name === "pan") {
    path.setAttribute("d", "M5.3 7.2V4.4a1 1 0 0 1 2 0v2.4M7.3 6.6V3.5a1 1 0 0 1 2 0v3.3M9.3 6.8V4.7a1 1 0 0 1 2 0v3.5M5.3 7.2 4.2 6.1a1.1 1.1 0 0 0-1.6 1.5l2.8 3.6c.8 1 1.9 1.6 3.2 1.6h1.2c2 0 3.2-1.3 3.2-3.4V7a1 1 0 0 0-2 0");
  } else {
    path.setAttribute("d", "M4.3 2.7 12.2 8l-3.5.8 2 3.9-1.8.9-2-3.9-2.4 2.6-.2-9.6Z");
  }
  svg.append(path);
  return svg;
}

function clampGraphZoom(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Math.min(MAX_GRAPH_ZOOM, Math.max(MIN_GRAPH_ZOOM, rounded));
}

function setGraphZoom(value) {
  activeGraphZoom = clampGraphZoom(value);
}

function graphZoomLabel() {
  return `${Math.round(activeGraphZoom * 100)}%`;
}

function updateGraphZoomControls() {
  for (const button of document.querySelectorAll("[data-zoom-action]")) {
    if (button.dataset.zoomAction === "reset") {
      button.textContent = graphZoomLabel();
    }
    if (button.dataset.zoomAction === "out") {
      button.disabled = activeGraphZoom <= MIN_GRAPH_ZOOM;
    }
    if (button.dataset.zoomAction === "in") {
      button.disabled = activeGraphZoom >= MAX_GRAPH_ZOOM;
    }
  }
}

function applyGraphZoom(viewport, surface, canvas, layout) {
  viewport.dataset.zoom = String(activeGraphZoom);
  surface.style.width = `${Math.ceil(layout.width * activeGraphZoom)}px`;
  surface.style.height = `${Math.ceil(layout.height * activeGraphZoom)}px`;
  canvas.style.transform = `scale(${activeGraphZoom})`;
  updateGraphZoomControls();
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function dependencyIds(item) {
  return arrayOfStrings(item?.depends_on);
}

function unmetIds(item) {
  return new Set(arrayOfStrings(item?.unmet_deps));
}

function externalId(id) {
  return `${EXTERNAL_PREFIX}${id}`;
}

function itemLabel(node) {
  if (!node) {
    return "(missing)";
  }
  return node.external ? node.id.slice(EXTERNAL_PREFIX.length) : node.id;
}

function kindClass(kind) {
  return KIND_CLASSES.has(kind) ? kind : "backlog";
}

function isTerminalItem(item) {
  return Boolean(item?.is_terminal || item?.stage === "done" || item?.stage === "released");
}

export function buildDependencyModel(items) {
  const nodes = new Map();
  const edges = [];
  for (const item of items) {
    if (item?.id) {
      nodes.set(String(item.id), { id: String(item.id), item, external: false });
    }
  }
  for (const item of items) {
    if (!item?.id) {
      continue;
    }
    const to = String(item.id);
    const unmet = unmetIds(item);
    for (const dep of dependencyIds(item)) {
      const visibleDep = nodes.has(dep);
      const from = visibleDep ? dep : externalId(dep);
      if (!visibleDep && !nodes.has(from)) {
        nodes.set(from, { id: from, item: null, external: true });
      }
      edges.push({
        from,
        to,
        external: !visibleDep,
        unmet: unmet.has(dep),
      });
    }
  }
  return layerGraph({ nodes, edges });
}

function layerGraph(model) {
  const indegree = new Map();
  const outgoing = new Map();
  const depth = new Map();
  for (const id of model.nodes.keys()) {
    indegree.set(id, 0);
    outgoing.set(id, []);
    depth.set(id, 0);
  }
  for (const edge of model.edges) {
    indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
    outgoing.get(edge.from)?.push(edge);
  }

  const queue = Array.from(indegree.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort((a, b) => itemLabel(model.nodes.get(a)).localeCompare(itemLabel(model.nodes.get(b))));
  const processed = new Set();
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index];
    processed.add(id);
    for (const edge of outgoing.get(id) || []) {
      depth.set(edge.to, Math.max(depth.get(edge.to) || 0, (depth.get(id) || 0) + 1));
      const nextCount = (indegree.get(edge.to) || 0) - 1;
      indegree.set(edge.to, nextCount);
      if (nextCount === 0) {
        queue.push(edge.to);
      }
    }
  }

  const cycleIds = Array.from(model.nodes.keys()).filter((id) => !processed.has(id));
  if (cycleIds.length > 0) {
    const fallbackDepth = Math.max(0, ...Array.from(depth.values())) + 1;
    for (const id of cycleIds) {
      depth.set(id, fallbackDepth);
    }
  }

  const layers = new Map();
  for (const [id, node] of model.nodes) {
    const layer = depth.get(id) || 0;
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer).push(node);
  }
  for (const nodes of layers.values()) {
    nodes.sort((a, b) => itemLabel(a).localeCompare(itemLabel(b)));
  }

  return {
    ...model,
    depth,
    layers: Array.from(layers.entries()).sort(([a], [b]) => a - b),
    cycleIds,
  };
}

function edgesFor(model, nodeId, direction) {
  return model.edges.filter((edge) => direction === "in" ? edge.to === nodeId : edge.from === nodeId);
}

function renderEdgeLine(label, ids, className) {
  const line = document.createElement("div");
  line.className = "edge";
  line.append(textElement("span", className, label), textElement("span", "", ids.length === 0 ? "none" : ids.join(", ")));
  return line;
}

function renderNode(node, model, ctx) {
  const nodeElement = node.external ? document.createElement("div") : document.createElement("button");
  nodeElement.className = "dep-node";
  if (node.external) {
    nodeElement.classList.add("dep-node--external");
  }
  if (node.item?.blocked) {
    nodeElement.classList.add("is-blocked");
  }
  if (!node.external) {
    nodeElement.type = "button";
    nodeElement.addEventListener("click", () => {
      ctx.openDetail(node.id);
    });
  }

  const head = document.createElement("div");
  head.className = "dn-head";
  const kind = node.external ? "external" : String(node.item?.kind || "item");
  head.append(
    textElement("span", `chip chip--${kindClass(kind)}`, kind),
    textElement("span", "ic-id", itemLabel(node)),
  );
  if (node.item?.blocked) {
    head.append(textElement("span", "badge badge--blocked", "blocked"));
  } else if (node.item?.ready) {
    head.append(textElement("span", "badge badge--ready", "ready"));
  }

  const incoming = edgesFor(model, node.id, "in");
  const outgoing = edgesFor(model, node.id, "out");
  const edges = document.createElement("div");
  edges.className = "edges";
  edges.append(
    renderEdgeLine("depends on", incoming.map((edge) => itemLabel(model.nodes.get(edge.from))), "up"),
    renderEdgeLine("unblocks", outgoing.map((edge) => itemLabel(model.nodes.get(edge.to))), "down"),
  );

  nodeElement.append(head, edges);
  return nodeElement;
}

function renderWebNode(node, model, ctx) {
  const nodeElement = node.external ? document.createElement("div") : document.createElement("button");
  const kind = node.external ? "external" : String(node.item?.kind || "item");
  nodeElement.className = `dep-node dep-node--web dep-node--${kindClass(kind)}`;
  if (node.external) {
    nodeElement.classList.add("dep-node--external");
  }
  if (node.item?.blocked) {
    nodeElement.classList.add("is-blocked");
  }
  if (!node.external) {
    nodeElement.type = "button";
    nodeElement.addEventListener("click", () => {
      ctx.openDetail(node.id);
    });
  }

  const head = document.createElement("div");
  head.className = "dn-head";
  head.append(textElement("span", `chip chip--${kindClass(kind)}`, kind));
  if (node.item?.blocked) {
    head.append(textElement("span", "badge badge--blocked", "blocked"));
  } else if (node.item?.ready) {
    head.append(textElement("span", "badge badge--ready", "ready"));
  }

  nodeElement.append(head, textElement("span", "ic-id", itemLabel(node)));
  if (!node.external && node.item?.stage) {
    nodeElement.append(textElement("span", "dn-web-meta", String(node.item.stage)));
  }
  return nodeElement;
}

function renderCycleWarning(model) {
  if (model.cycleIds.length === 0) {
    return null;
  }
  const warning = document.createElement("div");
  warning.className = "alert alert--warning";
  warning.append(
    textElement("span", "ico", "?"),
    textElement("span", "body", `Cycle detected: ${model.cycleIds.map((id) => itemLabel(model.nodes.get(id))).join(", ")}`),
  );
  return warning;
}

function wrappedLineCount(text, charsPerLine) {
  const length = String(text || "").length;
  return Math.max(1, Math.ceil(length / charsPerLine));
}

function edgeLabels(model, nodeId, direction) {
  return edgesFor(model, nodeId, direction).map((edge) => itemLabel(model.nodes.get(direction === "in" ? edge.from : edge.to)));
}

function edgeTextLineCount(labels) {
  const text = labels.length === 0 ? "none" : labels.join(", ");
  return wrappedLineCount(text, EDGE_CHARS_PER_LINE);
}

function estimatedNodeHeight(node, model) {
  const labelLines = wrappedLineCount(itemLabel(node), ID_CHARS_PER_LINE);
  const incomingLines = edgeTextLineCount(edgeLabels(model, node.id, "in"));
  const outgoingLines = edgeTextLineCount(edgeLabels(model, node.id, "out"));
  const headerHeight = Math.max(30, labelLines * 24);
  const edgesHeight = (incomingLines + outgoingLines) * 17;
  return Math.max(MIN_NODE_HEIGHT, 42 + headerHeight + edgesHeight + NODE_HEIGHT_BUFFER);
}

function titleLabel(value) {
  return String(value || "unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compareKeysByOrder(a, b, order) {
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);
  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  }
  return a.localeCompare(b);
}

function sortNodesByLabel(nodes) {
  return [...nodes].sort((a, b) => itemLabel(a).localeCompare(itemLabel(b)));
}

function groupedBy(model, groupForNode, order) {
  const groups = new Map();
  for (const node of model.nodes.values()) {
    const key = groupForNode(node);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(node);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => compareKeysByOrder(a, b, order))
    .map(([key, nodes]) => ({
      id: key,
      label: titleLabel(key),
      nodes: sortNodesByLabel(nodes),
    }));
}

function groupNodesByFlow(model) {
  return model.layers.map(([layer, nodes]) => ({
    id: `flow-${layer}`,
    label: `Depth ${layer}`,
    nodes,
  }));
}

function groupNodesByStage(model) {
  return groupedBy(model, (node) => {
    if (node.external) {
      return "external";
    }
    return String(node.item?.stage || "unstaged");
  }, STAGE_LAYOUT_ORDER);
}

function groupNodesByKind(model) {
  return groupedBy(model, (node) => {
    if (node.external) {
      return "external";
    }
    return String(node.item?.kind || "item");
  }, KIND_LAYOUT_ORDER);
}

function unlockImpactCounts(model) {
  const outgoing = new Map();
  for (const id of model.nodes.keys()) {
    outgoing.set(id, []);
  }
  for (const edge of model.edges) {
    outgoing.get(edge.from)?.push(edge.to);
  }

  const counts = new Map();
  for (const id of model.nodes.keys()) {
    const reachable = new Set();
    const stack = [...(outgoing.get(id) || [])];
    while (stack.length > 0) {
      const next = stack.pop();
      if (!next || next === id || reachable.has(next)) {
        continue;
      }
      reachable.add(next);
      for (const child of outgoing.get(next) || []) {
        stack.push(child);
      }
    }
    counts.set(id, reachable.size);
  }
  return counts;
}

function impactGroupLabel(count) {
  const noun = count === 1 ? "Item" : "Items";
  return `Unblocks ${count} Downstream ${noun}`;
}

function groupNodesByImpact(model) {
  const counts = unlockImpactCounts(model);
  const groups = new Map();
  for (const node of model.nodes.values()) {
    const count = counts.get(node.id) || 0;
    if (!groups.has(count)) {
      groups.set(count, []);
    }
    groups.get(count).push(node);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([count, nodes]) => ({
      id: `impact-${count}`,
      label: impactGroupLabel(count),
      nodes: sortNodesByLabel(nodes),
    }));
}

function groupsForLayout(model, layoutId) {
  if (layoutId === "stage") {
    return groupNodesByStage(model);
  }
  if (layoutId === "kind") {
    return groupNodesByKind(model);
  }
  if (layoutId === "impact") {
    return groupNodesByImpact(model);
  }
  return groupNodesByFlow(model);
}

function layoutWebGraph(model) {
  const rings = new Map();
  for (const [id, node] of model.nodes) {
    const depth = model.depth.get(id) || 0;
    if (!rings.has(depth)) {
      rings.set(depth, []);
    }
    rings.get(depth).push(node);
  }

  const ringLayouts = Array.from(rings.entries())
    .sort(([a], [b]) => a - b)
    .map(([depth, nodes]) => {
      const sortedNodes = sortNodesByLabel(nodes);
      const neededRadius = sortedNodes.length * (NODE_WEB_WIDTH + 42) / (2 * Math.PI);
      return {
        depth,
        nodes: sortedNodes,
        radius: Math.max((depth + 1) * WEB_RING_RADIUS, neededRadius),
      };
    });
  const maxRadius = Math.max(WEB_RING_RADIUS, ...ringLayouts.map((ring) => ring.radius));
  const center = CANVAS_PADDING + maxRadius + NODE_WEB_WIDTH;
  const positions = new Map();

  for (const ring of ringLayouts) {
    ring.nodes.forEach((node, index) => {
      const angleOffset = ring.depth % 2 === 0 ? 0 : Math.PI / Math.max(1, ring.nodes.length);
      const angle = ring.nodes.length === 1
        ? -Math.PI / 2
        : (index / ring.nodes.length) * 2 * Math.PI - Math.PI / 2 + angleOffset;
      positions.set(node.id, {
        x: Math.round(center + ring.radius * Math.cos(angle) - NODE_WEB_WIDTH / 2),
        y: Math.round(center + ring.radius * Math.sin(angle) - NODE_WEB_HEIGHT / 2),
        width: NODE_WEB_WIDTH,
        height: NODE_WEB_HEIGHT,
      });
    });
  }

  return {
    positions,
    groups: [],
    width: Math.ceil(center * 2),
    height: Math.ceil(center * 2),
  };
}

function layoutGraph(model, layoutId) {
  if (layoutId === "web") {
    return layoutWebGraph(model);
  }
  const groups = groupsForLayout(model, layoutId);
  const positions = new Map();
  const laidOutGroups = [];
  let maxLayerHeight = MIN_NODE_HEIGHT;
  groups.forEach((group, layerIndex) => {
    const x = CANVAS_PADDING + layerIndex * (NODE_WIDTH + LAYER_GAP);
    let y = CANVAS_PADDING + GROUP_LABEL_HEIGHT + GROUP_LABEL_GAP;
    laidOutGroups.push({ ...group, x });
    for (const node of group.nodes) {
      const height = estimatedNodeHeight(node, model);
      positions.set(node.id, {
        x,
        y,
        width: NODE_WIDTH,
        height,
      });
      y += height + ROW_GAP;
    }
    maxLayerHeight = Math.max(maxLayerHeight, y - ROW_GAP);
  });
  return {
    positions,
    groups: laidOutGroups,
    width: CANVAS_PADDING * 2 + groups.length * NODE_WIDTH + Math.max(0, groups.length - 1) * LAYER_GAP,
    height: maxLayerHeight + CANVAS_PADDING,
  };
}

function webEdgePath(from, to) {
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height / 2;
  const x2 = to.x + to.width / 2;
  const y2 = to.y + to.height / 2;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nudge = 10;
  const controlX = midX - dy / length * nudge;
  const controlY = midY + dx / length * nudge;
  return `M ${x1} ${y1} Q ${controlX} ${controlY}, ${x2} ${y2}`;
}

function edgePath(from, to) {
  if (activeLayoutId === "web") {
    return webEdgePath(from, to);
  }
  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const control = Math.max(48, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + control} ${y1}, ${x2 - control} ${y2}, ${x2} ${y2}`;
}

function renderEdges(model) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("dependency-edges");
  svg.setAttribute("aria-hidden", "true");
  for (const edge of model.edges) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("dependency-edge", edge.unmet ? "dependency-edge--unmet" : "dependency-edge--met");
    path.dataset.from = edge.from;
    path.dataset.to = edge.to;
    svg.append(path);
  }
  return svg;
}

function renderLayoutLabels(layout) {
  const fragment = document.createDocumentFragment();
  for (const group of layout.groups) {
    const label = textElement("div", "dependency-layout-label", group.label);
    label.style.left = `${group.x}px`;
    label.style.top = `${CANVAS_PADDING}px`;
    fragment.append(label);
  }
  return fragment;
}

function measuredNodeBounds(canvas) {
  const canvasRect = canvas.getBoundingClientRect();
  const scale = activeGraphZoom || 1;
  const bounds = new Map();
  for (const wrapper of canvas.querySelectorAll(".dependency-graph-node")) {
    const rect = wrapper.getBoundingClientRect();
    bounds.set(wrapper.dataset.nodeId, {
      x: (rect.left - canvasRect.left) / scale,
      y: (rect.top - canvasRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    });
  }
  return bounds;
}

function syncEdgeGeometry(canvas, model) {
  const svg = canvas.querySelector(".dependency-edges");
  if (!svg) {
    return;
  }
  const width = Math.max(1, canvas.scrollWidth, canvas.offsetWidth);
  const height = Math.max(1, canvas.scrollHeight, canvas.offsetHeight);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;

  const bounds = measuredNodeBounds(canvas);
  for (const path of svg.querySelectorAll(".dependency-edge")) {
    const from = bounds.get(path.dataset.from);
    const to = bounds.get(path.dataset.to);
    if (!from || !to) {
      path.hidden = true;
      continue;
    }
    path.hidden = false;
    path.setAttribute("d", edgePath(from, to));
  }
  applyTrace(canvas, model, focusedNode);
}

function positionValue(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function expandCanvasForNode(canvas, wrapper) {
  const left = positionValue(wrapper.style.left);
  const top = positionValue(wrapper.style.top);
  const width = Math.max(canvas.offsetWidth, canvas.scrollWidth, left + wrapper.offsetWidth + CANVAS_PADDING);
  const height = Math.max(canvas.offsetHeight, canvas.scrollHeight, top + wrapper.offsetHeight + CANVAS_PADDING);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function installNodeDragging(canvas, wrapper, model) {
  let drag = null;
  let suppressClick = false;

  const clearNodeDragHold = (dragState) => {
    if (dragState?.holdTimer) {
      window.clearTimeout(dragState.holdTimer);
    }
  };

  const detachNodeDragListeners = (dragState) => {
    if (!dragState) {
      return;
    }
    window.removeEventListener("pointermove", dragState.onPointerMove, true);
    window.removeEventListener("pointerup", dragState.onPointerEnd, true);
    window.removeEventListener("pointercancel", dragState.onPointerEnd, true);
  };

  const cleanupNodeDrag = (dragState) => {
    clearNodeDragHold(dragState);
    detachNodeDragListeners(dragState);
  };

  wrapper.addEventListener("click", (event) => {
    if (!suppressClick) {
      return;
    }
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  const moveNodeDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    const rawDeltaX = event.clientX - drag.startX;
    const rawDeltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(rawDeltaX, rawDeltaY) < DRAG_THRESHOLD_PX) {
      return;
    }
    if (!drag.ready) {
      return;
    }
    if (!drag.captured) {
      try {
        wrapper.setPointerCapture(event.pointerId);
        drag.captured = true;
      } catch {
        drag.captured = false;
      }
    }
    const deltaX = rawDeltaX / activeGraphZoom;
    const deltaY = rawDeltaY / activeGraphZoom;
    drag.moved = true;
    suppressClick = true;
    wrapper.classList.add("is-dragging");
    wrapper.style.left = `${Math.max(CANVAS_PADDING, drag.startLeft + deltaX)}px`;
    wrapper.style.top = `${Math.max(CANVAS_PADDING, drag.startTop + deltaY)}px`;
    expandCanvasForNode(canvas, wrapper);
    syncEdgeGeometry(canvas, model);
    event.preventDefault();
  };

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    const didMove = drag.moved;
    cleanupNodeDrag(drag);
    if (wrapper.hasPointerCapture(event.pointerId)) {
      wrapper.releasePointerCapture(event.pointerId);
    }
    wrapper.classList.remove("is-dragging");
    if (didMove) {
      event.preventDefault();
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
    drag = null;
  };

  wrapper.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    if (drag) {
      cleanupNodeDrag(drag);
    }
    const pointerId = event.pointerId;
    const onPointerMove = (moveEvent) => moveNodeDrag(moveEvent);
    const onPointerEnd = (endEvent) => endDrag(endEvent);
    drag = {
      pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: positionValue(wrapper.style.left),
      startTop: positionValue(wrapper.style.top),
      moved: false,
      ready: false,
      captured: false,
      holdTimer: 0,
      onPointerMove,
      onPointerEnd,
    };
    drag.holdTimer = window.setTimeout(() => {
      if (drag?.pointerId === pointerId) {
        drag.ready = true;
      }
    }, NODE_DRAG_HOLD_MS);
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerEnd, true);
    window.addEventListener("pointercancel", onPointerEnd, true);
  });
}

function cleanupEdgeGeometrySync() {
  if (activeEdgeGeometryCleanup) {
    activeEdgeGeometryCleanup();
    activeEdgeGeometryCleanup = null;
  }
}

function installEdgeGeometrySync(canvas, model) {
  cleanupEdgeGeometrySync();
  const cleanups = [];
  let frame = 0;
  const schedule = () => {
    if (frame !== 0) {
      return;
    }
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (canvas.isConnected) {
        syncEdgeGeometry(canvas, model);
      }
    });
  };

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    for (const wrapper of canvas.querySelectorAll(".dependency-graph-node")) {
      observer.observe(wrapper);
    }
    cleanups.push(() => observer.disconnect());
  } else {
    window.addEventListener("resize", schedule);
    cleanups.push(() => window.removeEventListener("resize", schedule));
  }

  schedule();
  activeEdgeGeometryCleanup = () => {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

function installViewportPanning(viewport) {
  let pan = null;
  let suppressClick = false;

  viewport.addEventListener("click", (event) => {
    if (!suppressClick) {
      return;
    }
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".dependency-graph-node")) {
      return;
    }
    const isMiddlePan = event.button === 1;
    if (activeGraphTool !== "pan" && !isMiddlePan) {
      return;
    }
    if (event.button !== 0 && !isMiddlePan) {
      return;
    }
    pan = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: viewport.scrollLeft,
      startTop: viewport.scrollTop,
      moved: false,
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-panning");
    event.preventDefault();
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pan || event.pointerId !== pan.pointerId) {
      return;
    }
    const deltaX = event.clientX - pan.startX;
    const deltaY = event.clientY - pan.startY;
    if (!pan.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
      return;
    }
    pan.moved = true;
    suppressClick = true;
    viewport.scrollLeft = pan.startLeft - deltaX;
    viewport.scrollTop = pan.startTop - deltaY;
    event.preventDefault();
  });

  const endPan = (event) => {
    if (!pan || event.pointerId !== pan.pointerId) {
      return;
    }
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    viewport.classList.remove("is-panning");
    pan = null;
  };
  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);
}

function installWheelZoom(viewport, surface, canvas, layout, model) {
  viewport.addEventListener("wheel", (event) => {
    if (event.deltaY === 0) {
      return;
    }
    const nextZoom = clampGraphZoom(activeGraphZoom + (event.deltaY < 0 ? GRAPH_ZOOM_STEP : -GRAPH_ZOOM_STEP));
    if (nextZoom === activeGraphZoom) {
      return;
    }
    event.preventDefault();
    const previousZoom = activeGraphZoom;
    const viewportRect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - viewportRect.left;
    const pointerY = event.clientY - viewportRect.top;
    const graphX = (viewport.scrollLeft + pointerX) / previousZoom;
    const graphY = (viewport.scrollTop + pointerY) / previousZoom;

    setGraphZoom(nextZoom);
    applyGraphZoom(viewport, surface, canvas, layout);
    viewport.scrollLeft = graphX * activeGraphZoom - pointerX;
    viewport.scrollTop = graphY * activeGraphZoom - pointerY;
    syncEdgeGeometry(canvas, model);
  }, { passive: false });
}

function renderGraphCanvas(model, ctx) {
  const layout = layoutGraph(model, activeLayoutId);
  const viewport = document.createElement("div");
  viewport.className = "dependency-canvas-viewport";
  viewport.dataset.tool = activeGraphTool;
  viewport.dataset.zoom = String(activeGraphZoom);

  const surface = document.createElement("div");
  surface.className = "dependency-canvas-surface";

  const canvas = document.createElement("div");
  canvas.className = "dependency-canvas";
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;
  applyGraphZoom(viewport, surface, canvas, layout);
  canvas.append(renderEdges(model));
  canvas.append(renderLayoutLabels(layout));

  for (const node of model.nodes.values()) {
    const position = layout.positions.get(node.id);
    if (!position) {
      continue;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "dependency-graph-node";
    wrapper.dataset.nodeId = node.id;
    wrapper.style.left = `${position.x}px`;
    wrapper.style.top = `${position.y}px`;
    wrapper.style.width = `${position.width}px`;
    wrapper.style.minHeight = `${position.height}px`;
    wrapper.append(activeLayoutId === "web" ? renderWebNode(node, model, ctx) : renderNode(node, model, ctx));
    installNodeDragging(canvas, wrapper, model);
    canvas.append(wrapper);
  }

  wireTraceInteractions(canvas, model);
  installEdgeGeometrySync(canvas, model);
  installViewportPanning(viewport);
  installWheelZoom(viewport, surface, canvas, layout, model);
  surface.append(canvas);
  viewport.append(surface);
  return viewport;
}

function connectedIds(model, nodeId) {
  const ids = new Set([nodeId]);
  for (const edge of model.edges) {
    if (edge.from === nodeId) {
      ids.add(edge.to);
    }
    if (edge.to === nodeId) {
      ids.add(edge.from);
    }
  }
  return ids;
}

function applyTrace(canvas, model, nodeId) {
  const active = nodeId && model.nodes.has(nodeId) ? connectedIds(model, nodeId) : null;
  for (const node of canvas.querySelectorAll(".dependency-graph-node")) {
    const isActive = active == null || active.has(node.dataset.nodeId);
    node.classList.toggle("is-dimmed", !isActive);
  }
  for (const edge of canvas.querySelectorAll(".dependency-edge")) {
    const isTraced = active != null && (edge.dataset.from === nodeId || edge.dataset.to === nodeId);
    const isDimmed = active != null && !isTraced;
    edge.classList.toggle("is-traced", isTraced);
    edge.classList.toggle("is-dimmed", isDimmed);
  }
}

function wireTraceInteractions(canvas, model) {
  for (const wrapper of canvas.querySelectorAll(".dependency-graph-node")) {
    const nodeId = wrapper.dataset.nodeId;
    wrapper.addEventListener("pointerenter", () => {
      focusedNode = nodeId;
      applyTrace(canvas, model, focusedNode);
    });
    wrapper.addEventListener("pointerleave", () => {
      if (!wrapper.contains(document.activeElement)) {
        focusedNode = null;
        applyTrace(canvas, model, null);
      }
    });
    wrapper.addEventListener("focusin", () => {
      focusedNode = nodeId;
      applyTrace(canvas, model, focusedNode);
    });
    wrapper.addEventListener("focusout", (event) => {
      if (!canvas.contains(event.relatedTarget)) {
        focusedNode = null;
        applyTrace(canvas, model, null);
      }
    });
  }
  applyTrace(canvas, model, focusedNode);
}

function graphItems(items) {
  if (items.length <= LARGE_GRAPH_THRESHOLD || showTerminalBranches) {
    return items;
  }
  const active = items.filter((item) => !isTerminalItem(item));
  return active.length > 0 ? active : items;
}

function renderLayoutButtons(root, ctx) {
  const group = document.createElement("div");
  group.className = "dependency-layout-buttons";
  group.setAttribute("role", "group");
  for (const layout of GRAPH_LAYOUTS) {
    const button = document.createElement("button");
    button.className = "filter-chip dependency-toolbar__button";
    button.type = "button";
    button.dataset.layoutId = layout.id;
    button.textContent = layout.label;
    button.setAttribute("aria-pressed", String(activeLayoutId === layout.id));
    button.addEventListener("click", () => {
      activeLayoutId = layout.id;
      dependencyView.mount(root, ctx);
    });
    group.append(button);
  }
  return group;
}

function renderGraphInteractionControls(root, ctx) {
  const controls = document.createElement("div");
  controls.className = "dependency-interaction-controls";

  const toolGroup = document.createElement("div");
  toolGroup.className = "dependency-tool-buttons";
  toolGroup.setAttribute("role", "group");
  for (const tool of GRAPH_TOOLS) {
    const button = document.createElement("button");
    button.className = "filter-chip dependency-toolbar__button";
    button.type = "button";
    button.dataset.toolId = tool.id;
    button.setAttribute("aria-label", tool.title);
    button.title = tool.title;
    button.append(svgIcon(tool.icon), textElement("span", "dependency-tool-label", tool.label));
    button.setAttribute("aria-pressed", String(activeGraphTool === tool.id));
    button.addEventListener("click", () => {
      activeGraphTool = tool.id;
      dependencyView.mount(root, ctx);
    });
    toolGroup.append(button);
  }

  const zoomGroup = document.createElement("div");
  zoomGroup.className = "dependency-zoom-buttons";
  zoomGroup.setAttribute("role", "group");
  const zoomOut = document.createElement("button");
  zoomOut.className = "filter-chip dependency-toolbar__button";
  zoomOut.type = "button";
  zoomOut.dataset.zoomAction = "out";
  zoomOut.textContent = "-";
  zoomOut.setAttribute("aria-label", "Zoom out");
  zoomOut.disabled = activeGraphZoom <= MIN_GRAPH_ZOOM;
  zoomOut.addEventListener("click", () => {
    setGraphZoom(activeGraphZoom - GRAPH_ZOOM_STEP);
    dependencyView.mount(root, ctx);
  });

  const zoomReset = document.createElement("button");
  zoomReset.className = "filter-chip dependency-toolbar__button dependency-toolbar__zoom-label";
  zoomReset.type = "button";
  zoomReset.dataset.zoomAction = "reset";
  zoomReset.textContent = graphZoomLabel();
  zoomReset.setAttribute("aria-label", "Reset zoom");
  zoomReset.addEventListener("click", () => {
    setGraphZoom(1);
    dependencyView.mount(root, ctx);
  });

  const zoomIn = document.createElement("button");
  zoomIn.className = "filter-chip dependency-toolbar__button";
  zoomIn.type = "button";
  zoomIn.dataset.zoomAction = "in";
  zoomIn.textContent = "+";
  zoomIn.setAttribute("aria-label", "Zoom in");
  zoomIn.disabled = activeGraphZoom >= MAX_GRAPH_ZOOM;
  zoomIn.addEventListener("click", () => {
    setGraphZoom(activeGraphZoom + GRAPH_ZOOM_STEP);
    dependencyView.mount(root, ctx);
  });

  zoomGroup.append(zoomOut, zoomReset, zoomIn);
  controls.append(toolGroup, zoomGroup);
  return controls;
}

function renderEdgeLegendItem(className, label) {
  const item = document.createElement("span");
  item.className = "dependency-edge-legend__item";
  const line = document.createElement("span");
  line.className = `dependency-edge-legend__line ${className}`;
  item.append(line, textElement("span", "", label));
  return item;
}

function renderEdgeLegend() {
  const legend = document.createElement("div");
  legend.className = "dependency-edge-legend";
  legend.setAttribute("aria-label", "Dependency edge legend");
  legend.append(
    renderEdgeLegendItem("dependency-edge-legend__line--met", "Satisfied dependency"),
    renderEdgeLegendItem("dependency-edge-legend__line--unmet", "Unmet dependency"),
  );
  return legend;
}

function renderGraphToolbar(root, ctx, items) {
  const toolbar = document.createElement("div");
  toolbar.className = "dependency-toolbar";
  toolbar.append(renderLayoutButtons(root, ctx), renderGraphInteractionControls(root, ctx));

  if (items.length > LARGE_GRAPH_THRESHOLD) {
    const terminalButton = document.createElement("button");
    terminalButton.className = "filter-chip dependency-toolbar__button";
    terminalButton.type = "button";
    terminalButton.textContent = showTerminalBranches ? "Collapse terminal" : "Show terminal";
    terminalButton.setAttribute("aria-pressed", String(showTerminalBranches));
    terminalButton.addEventListener("click", () => {
      showTerminalBranches = !showTerminalBranches;
      dependencyView.mount(root, ctx);
    });
    toolbar.append(terminalButton);
  }

  toolbar.append(renderEdgeLegend());
  return toolbar;
}

export const dependencyView = {
  id: "dependency",
  label: "Dependency",
  mount(root, ctx) {
    cleanupEdgeGeometrySync();
    const items = ctx.visibleItems();
    const model = buildDependencyModel(graphItems(items));

    const view = document.createElement("div");
    view.className = "dependency-view";
    const header = document.createElement("header");
    header.className = "dependency-view__header";
    header.append(
      textElement("h1", "", "Dependency"),
      textElement("p", "view-digest", `${model.nodes.size} nodes and ${model.edges.length} dependency edges in the filtered set.`),
    );
    view.append(header);

    const warning = renderCycleWarning(model);
    if (warning) {
      view.append(warning);
    }

    view.append(renderGraphToolbar(root, ctx, items));
    view.append(renderGraphCanvas(model, ctx));
    root.replaceChildren(view);
  },
};
