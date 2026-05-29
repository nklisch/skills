#!/usr/bin/env python3
"""
Fix frontmatter `related:` blocks that break YAML parsing.

Two problem patterns:
1. Flow-style:  `- {slug: X, relationship: Y, note: ...with # or " inside...}`
   → `#` starts comment in flow mode; embedded `"` breaks quoting.
2. Block-style with unquoted note value starting with `"` or containing both `"` and other YAML metas
   → e.g. `note: "BigFrames is ergonomics, not new capability" verdict`

Fix: re-emit `related:` as block style with `note: |` (block scalar — no quoting needed).
"""
import re
import sys
from pathlib import Path

REPO = Path("/Users/andrewclark/dev/ds-engine")

# Match a flow-style related item:
#   - {slug: X, relationship: Y, note: Z}
# or with `type:` instead of `relationship:`, or without note.
# slug and relationship values don't contain commas/braces in practice.
FLOW_RE = re.compile(
    r"^(\s*)- \{slug:\s*([^,}]+?)\s*,\s*(relationship|type):\s*([^,}]+?)\s*"
    r"(?:,\s*note:\s*(.+?))?\}\s*$",
    re.MULTILINE,
)

# Block-style: standalone `- slug:` line starting an item
BLOCK_ITEM_START_RE = re.compile(r"^(\s*)- slug:\s*(.+?)\s*$")


def split_frontmatter(text):
    """Return (fm_block, rest) where fm_block excludes the leading/trailing ---."""
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    fm = text[3:end].lstrip("\n")
    rest = text[end + 4:]  # skip "\n---"
    return fm, rest


def emit_item(indent, slug, rel_key, rel_val, note):
    out = []
    out.append(f"{indent}- slug: {slug.strip()}")
    out.append(f"{indent}  {rel_key}: {rel_val.strip()}")
    if note is not None and note.strip():
        # Always emit note as block scalar — sidesteps all quoting issues
        out.append(f"{indent}  note: |")
        for line in note.strip().splitlines():
            out.append(f"{indent}    {line}")
    return "\n".join(out)


def fix_flow_items(fm):
    """Replace flow-style `related:` items with block style."""
    def repl(m):
        indent, slug, rel_key, rel_val, note = m.groups()
        return emit_item(indent, slug, rel_key, rel_val, note)
    return FLOW_RE.sub(repl, fm)


def find_related_block(fm):
    """
    Locate the `related:` block in frontmatter text.
    Returns (start_line_idx, end_line_idx_exclusive, indent_str) or None.
    """
    lines = fm.splitlines()
    related_idx = None
    related_indent = None
    for i, line in enumerate(lines):
        if re.match(r"^related:\s*$", line):
            related_idx = i
            related_indent = ""
            break
    if related_idx is None:
        return None
    # Find end: next non-indented line, or EOF
    end_idx = len(lines)
    for j in range(related_idx + 1, len(lines)):
        line = lines[j]
        if not line.strip():
            continue
        # Check leading whitespace
        leading_ws = len(line) - len(line.lstrip())
        if leading_ws == 0:  # back to top-level key
            end_idx = j
            break
    return related_idx, end_idx, related_indent


def parse_block_items(lines):
    """
    Parse block-style related items from a list of lines.
    Returns list of dicts {slug, relationship_key, relationship_val, note}.
    """
    items = []
    cur = None
    cur_indent = None
    note_lines = None  # list of strings if collecting a note

    def flush():
        if cur is not None:
            if note_lines is not None:
                cur["note"] = "\n".join(note_lines).strip()
            items.append(cur)

    for line in lines:
        if not line.strip():
            if note_lines is not None:
                note_lines.append("")
            continue
        m_start = re.match(r"^(\s*)- slug:\s*(.+?)\s*$", line)
        if m_start:
            flush()
            cur = {"slug": m_start.group(2).strip(), "rel_key": "relationship", "rel_val": "", "note": None}
            cur_indent = m_start.group(1)
            note_lines = None
            continue
        # subsequent keys at indent + 2
        m_kv = re.match(r"^\s+(relationship|type):\s*(.+?)\s*$", line)
        if m_kv and cur is not None and note_lines is None:
            cur["rel_key"] = m_kv.group(1)
            cur["rel_val"] = m_kv.group(2).strip()
            continue
        m_note = re.match(r"^\s+note:\s*(.*)$", line)
        if m_note and cur is not None:
            note_val = m_note.group(1).strip()
            # if it's `note: |` or `note: >`, start collecting indented lines
            if note_val in ("|", ">"):
                note_lines = []
                continue
            else:
                # inline note value (single line)
                cur["note"] = note_val
                note_lines = None
                continue
        # if collecting note block scalar, accumulate
        if note_lines is not None:
            # strip the indent prefix relative to "  " inside the note block
            note_lines.append(line.strip())
            continue
        # unknown line — skip but log
        # print(f"  ? unrecognized line: {line!r}", file=sys.stderr)
    flush()
    return items


def rebuild_related(fm):
    """Find the related: block and re-emit it cleanly."""
    rb = find_related_block(fm)
    if rb is None:
        return fm
    start, end, _ = rb
    lines = fm.splitlines()
    related_lines = lines[start + 1:end]  # exclude the `related:` line itself
    items = parse_block_items(related_lines)
    if not items:
        return fm
    new_block = ["related:"]
    for it in items:
        new_block.append(emit_item("  ", it["slug"], it["rel_key"], it["rel_val"], it["note"]))
    new_fm = "\n".join(lines[:start] + new_block + lines[end:])
    return new_fm


def fix_file(path):
    text = path.read_text(encoding="utf-8")
    fm, rest = split_frontmatter(text)
    if fm is None:
        return False
    # Step 1: convert any flow-style items to block-style
    new_fm = fix_flow_items(fm)
    # Step 2: parse and re-emit the entire related: block (handles unquoted notes with " etc.)
    new_fm = rebuild_related(new_fm)
    if new_fm == fm:
        return False
    new_text = "---\n" + new_fm + "\n---" + rest
    path.write_text(new_text, encoding="utf-8")
    return True


def main():
    if len(sys.argv) > 1:
        files = [Path(p).resolve() for p in sys.argv[1:]]
    else:
        files = sorted((REPO / "docs").rglob("*.md"))
    changed = 0
    for p in files:
        if any(part == "_archive" for part in p.parts):
            continue
        try:
            if fix_file(p):
                print(f"fixed: {p.relative_to(REPO)}")
                changed += 1
        except Exception as e:
            print(f"ERROR {p.relative_to(REPO)}: {e}", file=sys.stderr)
    print(f"\n{changed} files changed")


if __name__ == "__main__":
    main()
