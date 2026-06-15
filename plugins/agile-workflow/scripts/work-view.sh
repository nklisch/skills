#!/usr/bin/env bash
# work-view — query items in the agile-workflow substrate.
#
# FROZEN DEGRADED FALLBACK. The canonical work-view is the Rust binary
# (crates/, installed to .work/bin/work-view). This script is only the
# install fallback for platforms without a prebuilt binary. It deliberately
# LACKS newer features: no `--scope` tier filtering (it always queries all
# tiers) and no `work-view board`. bash<->Rust byte-parity is no longer
# enforced. Full retirement is tracked as a parked epic; until then this stays
# as a best-effort degraded fallback.
#
# Pure bash + a single awk pass. Frontmatter for every item is parsed exactly
# once, in one awk process for the whole tree, instead of spawning an awk per
# field per file. Optional yq enhancement detected at runtime but not required.
#
# Exit codes:
#   0  success
#   1  usage error (bad flag, conflicting flags)
#   2  no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)
#   3  internal error (corrupted item file)

set -euo pipefail

# Kept in lockstep with plugin.json by scripts/bump-version.sh. Do not hand-edit.
WORK_VIEW_VERSION="0.13.0"

# ============================================================================
# Version prelude (POSIX / bash 3.2 safe — runs BEFORE the Bash-4 guard)
# ============================================================================
#
# `--version` must answer correctly even on a host whose only bash is the
# macOS system 3.2 with no modern bash to re-exec into. If it fell through to
# the Bash-4 guard below it would print "requires bash 4" and exit 1, and a
# self-heal staleness probe would read that failure as a broken/stale tool
# instead of a version. So short-circuit here using only constructs that work
# in bash 3.2 (printf, simple parameter expansion, case). Output is
# byte-identical to the Rust binary: `work-view <semver>\n`, exit 0.
case "${1:-}" in
  --version|-V) printf 'work-view %s\n' "$WORK_VIEW_VERSION"; exit 0 ;;
esac

# ============================================================================
# Bash 4+ required (associative arrays). macOS ships bash 3.2 at /bin/bash,
# so re-exec under a modern bash if one is available.
# ============================================================================

if [[ "${BASH_VERSINFO[0]:-0}" -lt 4 ]]; then
  for candidate in \
    /opt/homebrew/bin/bash \
    /usr/local/bin/bash \
    /home/linuxbrew/.linuxbrew/bin/bash \
    /usr/bin/bash \
    "$(command -v bash 2>/dev/null || true)"
  do
    [[ -n "$candidate" && -x "$candidate" ]] || continue
    ver="$("$candidate" -c 'echo "${BASH_VERSINFO[0]}"' 2>/dev/null || echo 0)"
    if [[ "${ver:-0}" -ge 4 ]]; then
      exec "$candidate" "$0" "$@"
    fi
  done
  {
    echo "work-view: requires bash 4 or newer (current: ${BASH_VERSION:-unknown})"
    case "$(uname -s 2>/dev/null)" in
      Darwin) echo "  macOS ships bash 3.2. Install a modern bash: brew install bash" ;;
      *)      echo "  Install bash 4+ via your package manager." ;;
    esac
  } >&2
  exit 1
fi

# ============================================================================
# Usage
# ============================================================================

usage() {
  cat <<'USAGE'
work-view — query items in the agile-workflow substrate

Usage: work-view [FILTERS...] [OUTPUT]

Filters (compose with AND semantics):
  --stage <stage>      Items at the given stage
  --tag <tag>          Items with the given tag (repeatable, AND)
  --kind <kind>        Items of the given kind (epic|feature|story|release)
  --parent <id>        Direct children of the given item
  --release <version>  Items with release_binding: <version>
  --gate <name>        Items with gate_origin: <name>
  --ready              Active items at drafting/implementing/review with all depends_on done
  --blocked            Active items at drafting/implementing/review with unmet dependencies
  --blocking <id>      Items that depend on <id>

Output (default tabular):
  --paths              One file path per line
  --cat                Full item bodies (separated by ---)
  --count              Match count only

Other:
  --version            Print the work-view version and exit
  --help               Show this help and exit
USAGE
}

# ============================================================================
# Substrate root detection
# ============================================================================

find_substrate_root() {
  local dir
  dir="$(pwd)"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/.work/CONVENTIONS.md" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

# ============================================================================
# Frontmatter parser (single awk pass for the whole tree)
# ============================================================================
#
# Reads every item file once and emits one Unit-Separator-delimited record per
# file:
#   path \037 id \037 kind \037 stage \037 parent \037 release_binding \037
#        gate_origin \037 tags \037 depends_on
#
# Scalars are whitespace- and one-layer-quote-stripped exactly like the old
# fm_field. tags/depends_on are normalized from flow style ([a, b, c]) to
# space-joined tokens exactly like the old fm_array (only flow arrays are
# supported, matching prior behavior). The Unit Separator (0x1F) never appears
# in YAML frontmatter, so empty fields survive the round trip.

read -r -d '' AWK_INDEX <<'AWK' || true
function strip(v) {
  sub(/^[[:space:]]+/, "", v)
  sub(/[[:space:]]+$/, "", v)
  sub(/^"/, "", v); sub(/"$/, "", v)
  sub(/^'/, "", v); sub(/'$/, "", v)
  return v
}
# Normalize a flow-style scalar ("[a, b]") to space-joined tokens ("a b").
function narr(v) {
  if (v == "" || v == "[]") return ""
  sub(/^\[/, "", v); sub(/\]$/, "", v)
  gsub(/ /, "", v)
  gsub(/,/, " ", v)
  return v
}
function field(line, key,   p) {
  p = "^" key ":"
  if (match(line, p)) return strip(substr(line, RLENGTH + 1))
  return "\001NOMATCH\001"
}
function emit() {
  if (cf == "") return
  printf "%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\n", \
    cf, id, kind, stage, parent, rel, gate, narr(tags), narr(deps)
}
function reset(fname) {
  cf = fname; in_fm = 0; fm_done = 0
  id = ""; kind = ""; stage = ""; parent = ""
  rel = ""; gate = ""; tags = ""; deps = ""
  delete have
}
BEGIN { v = "" }
FNR == 1 { emit(); reset(FILENAME) }
{
  if (fm_done) next
  if ($0 ~ /^---[[:space:]]*$/) {
    if (in_fm == 0) { in_fm = 1 } else { fm_done = 1 }
    next
  }
  if (in_fm != 1) next
  if (!("id" in have))      { v = field($0, "id");              if (v != "\001NOMATCH\001") { id = v;     have["id"] = 1;     next } }
  if (!("kind" in have))    { v = field($0, "kind");            if (v != "\001NOMATCH\001") { kind = v;   have["kind"] = 1;   next } }
  if (!("stage" in have))   { v = field($0, "stage");           if (v != "\001NOMATCH\001") { stage = v;  have["stage"] = 1;  next } }
  if (!("parent" in have))  { v = field($0, "parent");          if (v != "\001NOMATCH\001") { parent = v; have["parent"] = 1; next } }
  if (!("rel" in have))     { v = field($0, "release_binding"); if (v != "\001NOMATCH\001") { rel = v;    have["rel"] = 1;    next } }
  if (!("gate" in have))    { v = field($0, "gate_origin");     if (v != "\001NOMATCH\001") { gate = v;   have["gate"] = 1;   next } }
  if (!("tags" in have))    { v = field($0, "tags");            if (v != "\001NOMATCH\001") { tags = v;   have["tags"] = 1;   next } }
  if (!("deps" in have))    { v = field($0, "depends_on");      if (v != "\001NOMATCH\001") { deps = v;   have["deps"] = 1;   next } }
}
END { emit() }
AWK

# ============================================================================
# Item index
# ============================================================================
#
# Globals populated by build_index (all keyed by file path unless noted):
#   ALL_FILES          — array of item file paths, in find traversal order
#   IDX_ID/KIND/STAGE/PARENT/REL/GATE — scalar fields
#   IDX_TAGS/IDX_DEPS  — space-joined tokens
#   FILE_BY_ID/STAGE_BY_ID — keyed by item id (for the dependency graph)

declare -a ALL_FILES=()
declare -A IDX_ID IDX_KIND IDX_STAGE IDX_PARENT IDX_REL IDX_GATE IDX_TAGS IDX_DEPS
declare -A STAGE_BY_ID FILE_BY_ID

build_index() {
  local root="$1"
  local path id kind stage parent rel gate tags deps
  ALL_FILES=()
  while IFS=$'\037' read -r path id kind stage parent rel gate tags deps; do
    [[ -n "$path" ]] || continue
    ALL_FILES+=("$path")
    IDX_ID["$path"]="$id"
    IDX_KIND["$path"]="$kind"
    IDX_STAGE["$path"]="$stage"
    IDX_PARENT["$path"]="$parent"
    IDX_REL["$path"]="$rel"
    IDX_GATE["$path"]="$gate"
    IDX_TAGS["$path"]="$tags"
    IDX_DEPS["$path"]="$deps"
    if [[ -n "$id" ]]; then
      FILE_BY_ID["$id"]="$path"
      STAGE_BY_ID["$id"]="$stage"
    fi
  done < <(find "$root/.work/active" "$root/.work/backlog" "$root/.work/releases" "$root/.work/archive" \
             -type f -name '*.md' -print0 2>/dev/null \
           | LC_ALL=C sort -z \
           | xargs -0 awk "$AWK_INDEX" 2>/dev/null || true)
}

# True if item id is at stage:done OR lives in releases/ or archive/ (terminal).
is_done() {
  local id="$1"
  local stage="${STAGE_BY_ID[$id]:-}"
  if [[ "$stage" == "done" || "$stage" == "released" ]]; then
    return 0
  fi
  local file="${FILE_BY_ID[$id]:-}"
  case "$file" in
    */.work/releases/*|*/.work/archive/*) return 0 ;;
  esac
  return 1
}

# True if item file's depends_on are all done.
deps_satisfied() {
  local file="$1"
  local dep
  for dep in ${IDX_DEPS[$file]:-}; do
    if ! is_done "$dep"; then
      return 1
    fi
  done
  return 0
}

# ============================================================================
# Argument parsing
# ============================================================================

want_stage=""
want_kind=""
want_parent=""
want_release=""
want_gate=""
want_blocking=""
want_ready=0
want_blocked=0
declare -a want_tags=()
output_mode="table"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)       usage; exit 0 ;;
    # Short-circuits before substrate detection (like --help) so --version
    # works outside a substrate. -V is the short form; lowercase -v is reserved
    # for a possible future --verbose. The POSIX prelude at the top already
    # handles --version as the first arg (for bash 3.2); this arm covers it in
    # any position once running under bash 4+.
    --version|-V)    printf 'work-view %s\n' "$WORK_VIEW_VERSION"; exit 0 ;;
    --stage)         want_stage="$2"; shift 2 ;;
    --kind)          want_kind="$2"; shift 2 ;;
    --parent)        want_parent="$2"; shift 2 ;;
    --release)       want_release="$2"; shift 2 ;;
    --gate)          want_gate="$2"; shift 2 ;;
    --blocking)      want_blocking="$2"; shift 2 ;;
    --tag)           want_tags+=("$2"); shift 2 ;;
    --ready)         want_ready=1; shift ;;
    --blocked)       want_blocked=1; shift ;;
    --paths)         output_mode="paths"; shift ;;
    --cat)           output_mode="cat"; shift ;;
    --count)         output_mode="count"; shift ;;
    --)              shift; break ;;
    -*)              echo "work-view: unknown flag: $1" >&2; exit 1 ;;
    *)               echo "work-view: unexpected argument: $1" >&2; exit 1 ;;
  esac
done

# --ready and --blocked are mutually exclusive
if [[ $want_ready -eq 1 && $want_blocked -eq 1 ]]; then
  echo "work-view: --ready and --blocked are mutually exclusive" >&2
  exit 1
fi

# ============================================================================
# Main
# ============================================================================

ROOT="$(find_substrate_root || true)"
if [[ -z "$ROOT" ]]; then
  echo "work-view: no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)" >&2
  exit 2
fi

build_index "$ROOT"

declare -a matches=()

for f in "${ALL_FILES[@]}"; do
  # --kind
  if [[ -n "$want_kind" ]]; then
    [[ "${IDX_KIND[$f]}" == "$want_kind" ]] || continue
  fi

  # --stage
  if [[ -n "$want_stage" ]]; then
    [[ "${IDX_STAGE[$f]}" == "$want_stage" ]] || continue
  fi

  # --parent
  if [[ -n "$want_parent" ]]; then
    [[ "${IDX_PARENT[$f]}" == "$want_parent" ]] || continue
  fi

  # --release
  if [[ -n "$want_release" ]]; then
    [[ "${IDX_REL[$f]}" == "$want_release" ]] || continue
  fi

  # --gate
  if [[ -n "$want_gate" ]]; then
    [[ "${IDX_GATE[$f]}" == "$want_gate" ]] || continue
  fi

  # --tag (AND semantics, repeatable)
  if (( ${#want_tags[@]} > 0 )); then
    file_tags="${IDX_TAGS[$f]}"
    skip=0
    for t in "${want_tags[@]}"; do
      if [[ " $file_tags " != *" $t "* ]]; then
        skip=1
        break
      fi
    done
    [[ $skip -eq 0 ]] || continue
  fi

  # --blocking <id>
  if [[ -n "$want_blocking" ]]; then
    if [[ " ${IDX_DEPS[$f]} " != *" $want_blocking "* ]]; then
      continue
    fi
  fi

  # --ready / --blocked: active-tier items at a movable stage
  if [[ $want_ready -eq 1 || $want_blocked -eq 1 ]]; then
    # only active-tier items are actionable candidates
    case "$f" in */.work/active/*) ;; *) continue ;; esac
    # stage must be one of: drafting, implementing, review
    case "${IDX_STAGE[$f]}" in drafting|implementing|review) ;; *) continue ;; esac
    if [[ $want_ready -eq 1 ]]; then
      deps_satisfied "$f" || continue
    else
      if deps_satisfied "$f"; then
        continue
      fi
    fi
  fi

  matches+=("$f")
done

# ============================================================================
# Output
# ============================================================================

case "$output_mode" in
  count)
    echo "${#matches[@]}"
    ;;
  paths)
    for f in "${matches[@]}"; do
      printf '%s\n' "$f"
    done
    ;;
  cat)
    first=1
    for f in "${matches[@]}"; do
      if [[ $first -eq 0 ]]; then
        echo ""
        echo "---"
        echo ""
      fi
      cat "$f"
      first=0
    done
    ;;
  table|*)
    if (( ${#matches[@]} == 0 )); then
      exit 0
    fi
    # Header
    printf '%-40s  %-8s  %-14s  %-30s  %s\n' "ID" "KIND" "STAGE" "TAGS" "PARENT"
    printf '%-40s  %-8s  %-14s  %-30s  %s\n' "----------------------------------------" "--------" "--------------" "------------------------------" "----------------"
    for f in "${matches[@]}"; do
      id="${IDX_ID[$f]}"
      kind="${IDX_KIND[$f]}"
      stage="${IDX_STAGE[$f]}"
      tags_csv="${IDX_TAGS[$f]// /,}"
      parent="${IDX_PARENT[$f]}"
      [[ "$parent" == "null" ]] && parent="-"
      printf '%-40s  %-8s  %-14s  %-30s  %s\n' "$id" "$kind" "$stage" "$tags_csv" "$parent"
    done
    ;;
esac

exit 0
