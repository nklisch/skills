const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

function appendText(parent, text) {
  parent.append(document.createTextNode(text));
}

function safeHref(raw) {
  const value = String(raw || "").trim();
  if (!/^(https?:|mailto:)/i.test(value)) {
    return null;
  }
  try {
    const url = new URL(value);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch (_error) {
    return null;
  }
}

function appendInline(parent, text, options = {}) {
  const allowLinks = options.allowLinks !== false;
  let index = 0;

  while (index < text.length) {
    if (text.startsWith("**", index)) {
      const end = text.indexOf("**", index + 2);
      if (end !== -1) {
        const strong = document.createElement("strong");
        appendInline(strong, text.slice(index + 2, end), { allowLinks });
        parent.append(strong);
        index = end + 2;
        continue;
      }
    }

    if (text[index] === "`") {
      const end = text.indexOf("`", index + 1);
      if (end !== -1) {
        const code = document.createElement("code");
        code.textContent = text.slice(index + 1, end);
        parent.append(code);
        index = end + 1;
        continue;
      }
    }

    if (allowLinks && text[index] === "[") {
      const labelEnd = text.indexOf("]", index + 1);
      const hrefStart = labelEnd === -1 ? -1 : text.indexOf("(", labelEnd);
      const hrefEnd = hrefStart === -1 ? -1 : text.indexOf(")", hrefStart);
      if (labelEnd !== -1 && hrefStart === labelEnd + 1 && hrefEnd !== -1) {
        const label = text.slice(index + 1, labelEnd);
        const rawHref = text.slice(hrefStart + 1, hrefEnd);
        const href = safeHref(rawHref);
        if (href) {
          const anchor = document.createElement("a");
          anchor.setAttribute("href", href);
          anchor.setAttribute("rel", "noreferrer");
          appendInline(anchor, label, { allowLinks: false });
          parent.append(anchor);
        } else {
          appendText(parent, text.slice(index, hrefEnd + 1));
        }
        index = hrefEnd + 1;
        continue;
      }
    }

    const nextSpecial = ["**", "`", "["]
      .map((token) => text.indexOf(token, index + 1))
      .filter((position) => position !== -1)
      .sort((a, b) => a - b)[0];
    const next = nextSpecial || text.length;
    appendText(parent, text.slice(index, next));
    index = next;
  }
}

function appendParagraph(root, lines) {
  if (lines.length === 0) {
    return;
  }
  const paragraph = document.createElement("p");
  appendInline(paragraph, lines.join(" ").trim());
  root.append(paragraph);
}

function appendList(root, items) {
  if (items.length === 0) {
    return;
  }
  const list = document.createElement("ul");
  for (const item of items) {
    const listItem = document.createElement("li");
    appendInline(listItem, item);
    list.append(listItem);
  }
  root.append(list);
}

function appendQuote(root, lines) {
  if (lines.length === 0) {
    return;
  }
  const quote = document.createElement("blockquote");
  appendParagraph(quote, lines);
  root.append(quote);
}

function flush(root, state) {
  appendParagraph(root, state.paragraph);
  appendList(root, state.list);
  appendQuote(root, state.quote);
  state.paragraph = [];
  state.list = [];
  state.quote = [];
}

function normalizeBody(markdown) {
  return String(markdown || "").replace(/\r\n?/g, "\n");
}

export function renderInlineMarkdown(markdown, options = {}) {
  const fragment = document.createDocumentFragment();
  appendInline(fragment, String(markdown || ""), options);
  return fragment;
}

export function renderMarkdown(markdown, options = { mode: "detail" }) {
  const root = el("div", options.mode === "summary" ? "md md--summary" : "md");
  const state = { paragraph: [], list: [], quote: [] };
  const lines = normalizeBody(markdown).split("\n");
  let inFence = false;
  let fenceLines = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inFence) {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = fenceLines.join("\n");
        pre.append(code);
        root.append(pre);
        fenceLines = [];
        inFence = false;
      } else {
        flush(root, state);
        inFence = true;
      }
      continue;
    }

    if (inFence) {
      fenceLines.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (trimmed === "") {
      flush(root, state);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flush(root, state);
      const level = String(Math.min(heading[1].length, 3));
      const node = document.createElement(`h${level}`);
      appendInline(node, heading[2]);
      root.append(node);
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(trimmed);
    if (listItem) {
      appendParagraph(root, state.paragraph);
      appendQuote(root, state.quote);
      state.paragraph = [];
      state.quote = [];
      state.list.push(listItem[1]);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      appendParagraph(root, state.paragraph);
      appendList(root, state.list);
      state.paragraph = [];
      state.list = [];
      state.quote.push(quote[1]);
      continue;
    }

    appendList(root, state.list);
    appendQuote(root, state.quote);
    state.list = [];
    state.quote = [];
    state.paragraph.push(trimmed);
  }

  if (inFence) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = fenceLines.join("\n");
    pre.append(code);
    root.append(pre);
  }
  flush(root, state);

  if (!root.hasChildNodes()) {
    root.append(el("p", ""));
  }
  return root;
}

export function markdownSummary(markdown, maxChars = 220) {
  const lines = normalizeBody(markdown).split("\n");
  const paragraph = [];
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^#{1,3}\s+/.test(trimmed)) {
      continue;
    }
    if (trimmed === "") {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      paragraph.push(trimmed.replace(/^[-*]\s+/, ""));
      break;
    }
    if (/^>\s?/.test(trimmed)) {
      paragraph.push(trimmed.replace(/^>\s?/, ""));
      break;
    }
    paragraph.push(trimmed);
  }

  const summary = paragraph.join(" ").trim();
  if (summary.length <= maxChars) {
    return summary;
  }
  return `${summary.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}
