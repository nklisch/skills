import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assetRoot = resolve(here, "../../src/board/assets");
let moduleGraphDir = null;

class StyleDeclaration {
  setProperty(name, value) {
    this[name] = String(value);
  }
}

class ClassList {
  constructor(element) {
    this.element = element;
  }

  values() {
    return this.element.className.split(/\s+/).filter(Boolean);
  }

  add(...names) {
    const values = new Set(this.values());
    for (const name of names) {
      if (name) {
        values.add(String(name));
      }
    }
    this.element.className = Array.from(values).join(" ");
  }

  remove(...names) {
    const remove = new Set(names.map(String));
    this.element.className = this.values().filter((name) => !remove.has(name)).join(" ");
  }

  toggle(name, force = undefined) {
    const shouldAdd = force === undefined ? !this.contains(name) : Boolean(force);
    if (shouldAdd) {
      this.add(name);
    } else {
      this.remove(name);
    }
    return shouldAdd;
  }

  contains(name) {
    return this.values().includes(String(name));
  }
}

class TestNode {
  constructor(ownerDocument, nodeType, nodeName) {
    this.ownerDocument = ownerDocument;
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.parentNode = null;
    this.childNodes = [];
    this.isConnected = false;
  }

  append(...children) {
    for (const child of children.flat()) {
      const node = typeof child === "string"
        ? this.ownerDocument.createTextNode(child)
        : child;
      if (!node) {
        continue;
      }
      if (node.parentNode) {
        node.remove();
      }
      node.parentNode = this;
      node.isConnected = this.isConnected;
      this.childNodes.push(node);
      markConnected(node, node.isConnected);
    }
  }

  replaceChildren(...children) {
    for (const child of this.childNodes) {
      child.parentNode = null;
      markConnected(child, false);
    }
    this.childNodes = [];
    this.append(...children);
  }

  remove() {
    if (!this.parentNode) {
      return;
    }
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this);
    if (index !== -1) {
      siblings.splice(index, 1);
    }
    this.parentNode = null;
    markConnected(this, false);
  }

  hasChildNodes() {
    return this.childNodes.length > 0;
  }

  get children() {
    return this.childNodes.filter((child) => child.nodeType === 1);
  }

  get textContent() {
    if (this.nodeType === 3) {
      return this.data;
    }
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    if (this.nodeType === 3) {
      this.data = String(value);
      return;
    }
    this.replaceChildren(this.ownerDocument.createTextNode(String(value)));
  }
}

class TestText extends TestNode {
  constructor(ownerDocument, text) {
    super(ownerDocument, 3, "#text");
    this.data = String(text);
  }
}

class TestElement extends TestNode {
  constructor(ownerDocument, tagName) {
    super(ownerDocument, 1, String(tagName).toUpperCase());
    this.tagName = String(tagName).toUpperCase();
    this.attributes = new Map();
    this.dataset = {};
    this.style = new StyleDeclaration();
    this.className = "";
    this.classList = new ClassList(this);
    this.eventListeners = new Map();
    this.disabled = false;
    this.hidden = false;
    this.value = "";
    this.type = "";
    this.id = "";
    this.tabIndex = undefined;
  }

  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    if (name === "class") {
      this.className = text;
    } else if (name === "id") {
      this.id = text;
    } else if (name === "tabindex") {
      this.tabIndex = Number.parseInt(text, 10);
    } else if (name.startsWith("data-")) {
      this.dataset[dataKey(name.slice(5))] = text;
    } else {
      this[name] = text;
    }
  }

  getAttribute(name) {
    if (name === "class") {
      return this.className || null;
    }
    if (name === "id") {
      return this.id || null;
    }
    if (name === "tabindex" && this.tabIndex !== undefined) {
      return String(this.tabIndex);
    }
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "class") {
      this.className = "";
    } else if (name === "id") {
      this.id = "";
    } else if (name.startsWith("data-")) {
      delete this.dataset[dataKey(name.slice(5))];
    } else {
      delete this[name];
    }
  }

  addEventListener(type, listener) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.eventListeners.get(type) || [];
    this.eventListeners.set(type, listeners.filter((entry) => entry !== listener));
  }

  dispatchEvent(event) {
    event.target ||= this;
    event.currentTarget = this;
    for (const listener of this.eventListeners.get(event.type) || []) {
      listener.call(this, event);
      if (event.immediatePropagationStopped) {
        break;
      }
    }
    if (
      event.type === "keydown"
      && this.tagName === "BUTTON"
      && !event.defaultPrevented
      && (event.key === "Enter" || event.key === " " || event.key === "Space")
    ) {
      const click = new TestEvent("click", { cancelable: true });
      this.dispatchEvent(click);
      if (click.defaultPrevented && event.cancelable) {
        event.preventDefault();
      }
    }
    return !event.defaultPrevented;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(",").map((part) => part.trim()).filter(Boolean);
    const matches = [];
    walkElements(this, (element) => {
      if (element !== this && selectors.some((part) => matchesSelector(element, part))) {
        matches.push(element);
      }
    });
    return matches;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.nodeType === 1 && matchesSelector(current, selector)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }
}

class TestDocument extends TestElement {
  constructor() {
    super(null, "#document");
    this.ownerDocument = this;
    this.nodeType = 9;
    this.nodeName = "#document";
    this.documentElement = new TestElement(this, "html");
    this.body = new TestElement(this, "body");
    this.activeElement = this.body;
    this.isConnected = true;
    this.documentElement.isConnected = true;
    this.body.isConnected = true;
    this.documentElement.append(this.body);
    this.childNodes = [this.documentElement];
  }

  createElement(tagName) {
    return new TestElement(this, tagName);
  }

  createElementNS(_namespace, tagName) {
    return new TestElement(this, tagName);
  }

  createTextNode(text) {
    return new TestText(this, text);
  }

  createDocumentFragment() {
    const fragment = new TestElement(this, "#fragment");
    fragment.nodeType = 11;
    fragment.nodeName = "#document-fragment";
    return fragment;
  }
}

export class TestEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.cancelable = Boolean(options.cancelable);
    this.defaultPrevented = false;
    this.immediatePropagationStopped = false;
    this.key = options.key || "";
    this.shiftKey = Boolean(options.shiftKey);
    this.target = options.target || null;
    this.currentTarget = null;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopImmediatePropagation() {
    this.immediatePropagationStopped = true;
  }
}

export function installDomGlobals({ width = 1024 } = {}) {
  const document = new TestDocument();
  const listeners = new Map();
  const window = {
    document,
    innerWidth: width,
    localStorage: null,
    addEventListener(type, listener) {
      const values = listeners.get(type) || [];
      values.push(listener);
      listeners.set(type, values);
    },
    removeEventListener(type, listener) {
      const values = listeners.get(type) || [];
      listeners.set(type, values.filter((entry) => entry !== listener));
    },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) || []) {
        listener.call(window, event);
      }
      return !event.defaultPrevented;
    },
    setTimeout,
    clearTimeout,
  };

  globalThis.window = window;
  globalThis.document = document;
  globalThis.Event = TestEvent;
  globalThis.KeyboardEvent = TestEvent;
  globalThis.URL = URL;
  return { document, window };
}

export async function loadBoardModule(name) {
  const dir = await ensureModuleGraph();
  return import(`${pathToFileURL(join(dir, name)).href}?v=${Date.now()}-${Math.random()}`);
}

export function makeItem(overrides = {}) {
  return {
    id: "story-alpha",
    kind: "story",
    stage: "implementing",
    parent: null,
    tags: [],
    depends_on: [],
    unmet_deps: [],
    dependents: [],
    children: [],
    body: "Story body",
    updated: "2026-06-01",
    ready: false,
    blocked: false,
    is_terminal: false,
    tier: "active",
    ...overrides,
  };
}

async function ensureModuleGraph() {
  if (moduleGraphDir) {
    return moduleGraphDir;
  }
  moduleGraphDir = await mkdtemp(join(tmpdir(), "board-js-assets-"));
  const files = (await readdir(assetRoot)).filter((file) => file.endsWith(".js"));
  await Promise.all(files.map(async (file) => {
    const source = await readFile(join(assetRoot, file), "utf8");
    const rewritten = source.replaceAll(/from\s+["']\/assets\/([^"']+)["']/g, 'from "./$1"');
    await writeFile(join(moduleGraphDir, file), rewritten, "utf8");
  }));
  return moduleGraphDir;
}

function dataKey(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function markConnected(node, connected) {
  node.isConnected = connected;
  for (const child of node.childNodes || []) {
    markConnected(child, connected);
  }
}

function walkElements(root, visit) {
  for (const child of root.childNodes || []) {
    if (child.nodeType === 1) {
      visit(child);
      walkElements(child, visit);
    }
  }
}

function matchesSelector(element, selector) {
  const attrMatch = selector.match(/^(.+)(\[.+\])$/);
  if (attrMatch) {
    return matchesSelector(element, attrMatch[1]) && matchesSelector(element, attrMatch[2]);
  }
  const notTabIndex = selector.match(/^(.*):not\(\[tabindex=['"]?-1['"]?\]\)$/);
  if (notTabIndex) {
    return matchesSelector(element, notTabIndex[1]) && element.getAttribute("tabindex") !== "-1";
  }
  if (selector.startsWith(".")) {
    return element.classList.contains(selector.slice(1));
  }
  if (selector.startsWith("#")) {
    return element.id === selector.slice(1);
  }
  const attr = selector.match(/^\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\]$/);
  if (attr) {
    const value = element.getAttribute(attr[1]);
    return attr[2] === undefined ? value !== null : value === attr[2];
  }
  return element.tagName.toLowerCase() === selector.toLowerCase();
}
