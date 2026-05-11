#!/usr/bin/env bash
# work-view — query items in the agile-workflow substrate.
#
# Pure bash + grep + sed + awk. Optional yq enhancement detected at runtime
# but not required.
#
# Exit codes:
#   0  success
#   1  usage error (bad flag, conflicting flags)
#   2  no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)
#   3  internal error (corrupted item file)

set -euo pipefail

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
  --ready              Items at stage:implementing with all depends_on done
  --blocked            Items at stage:implementing with unmet dependencies
  --blocking <id>      Items that depend on <id>

Output (default tabular):
  --paths              One file path per line
  --cat                Full item bodies (separated by ---)
  --count              Match count only

Other:
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
# Frontmatter parsing
# ============================================================================

# Print the value of a scalar frontmatter field, or empty if absent.
fm_field() {
  local file="$1" field="$2"
  awk -v f="$field" '
    BEGIN { in_fm = 0 }
    /^---[[:space:]]*$/ {
      if (in_fm == 0) { in_fm = 1; next }
      else { exit }
    }
    in_fm == 1 {
      pat = "^" f ":[[:space:]]*"
      if (match($0, pat)) {
        val = substr($0, RLENGTH + 1)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
        # Strip surrounding quotes
        gsub(/^"|"$/, "", val)
        gsub(/^'\''|'\''$/, "", val)
        print val
        exit
      }
    }
  ' "$file"
}

# Print elements of an array frontmatter field as space-separated tokens.
# Handles flow style: tags: [a, b, c]
# Empty array -> no output.
fm_array() {
  local file="$1" field="$2" raw
  raw="$(fm_field "$file" "$field")"
  if [[ -z "$raw" || "$raw" == "[]" ]]; then
    return 0
  fi
  raw="${raw#[}"
  raw="${raw%]}"
  raw="${raw// /}"
  raw="${raw//,/ }"
  printf '%s\n' "$raw"
}

# Convert "null" or empty to empty string; otherwise echo as-is.
fm_optional() {
  local v="$1"
  if [[ -z "$v" || "$v" == "null" ]]; then
    return 0
  fi
  printf '%s\n' "$v"
}

# ============================================================================
# Item index
# ============================================================================

# Globals populated by build_index:
#   ALL_FILES — array of all item file paths
#   declare -A STAGE_BY_ID, FILE_BY_ID

declare -a ALL_FILES=()
declare -A STAGE_BY_ID
declare -A FILE_BY_ID

build_index() {
  local root="$1"
  local f id stage
  ALL_FILES=()
  while IFS= read -r -d '' f; do
    ALL_FILES+=("$f")
    id="$(fm_field "$f" id)"
    stage="$(fm_field "$f" stage)"
    if [[ -n "$id" ]]; then
      FILE_BY_ID["$id"]="$f"
      STAGE_BY_ID["$id"]="$stage"
    fi
  done < <(find "$root/.work/active" "$root/.work/backlog" "$root/.work/releases" "$root/.work/archive" \
             -type f -name '*.md' -print0 2>/dev/null || true)
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
  for dep in $(fm_array "$file" depends_on); do
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
    k="$(fm_field "$f" kind)"
    [[ "$k" == "$want_kind" ]] || continue
  fi

  # --stage
  if [[ -n "$want_stage" ]]; then
    s="$(fm_field "$f" stage)"
    [[ "$s" == "$want_stage" ]] || continue
  fi

  # --parent
  if [[ -n "$want_parent" ]]; then
    p="$(fm_field "$f" parent)"
    [[ "$p" == "$want_parent" ]] || continue
  fi

  # --release
  if [[ -n "$want_release" ]]; then
    r="$(fm_field "$f" release_binding)"
    [[ "$r" == "$want_release" ]] || continue
  fi

  # --gate
  if [[ -n "$want_gate" ]]; then
    g="$(fm_field "$f" gate_origin)"
    [[ "$g" == "$want_gate" ]] || continue
  fi

  # --tag (AND semantics, repeatable)
  if (( ${#want_tags[@]} > 0 )); then
    file_tags="$(fm_array "$f" tags || true)"
    skip=0
    for t in "${want_tags[@]}"; do
      if ! echo " $file_tags " | grep -q " $t "; then
        skip=1
        break
      fi
    done
    [[ $skip -eq 0 ]] || continue
  fi

  # --blocking <id>
  if [[ -n "$want_blocking" ]]; then
    deps="$(fm_array "$f" depends_on || true)"
    if ! echo " $deps " | grep -q " $want_blocking "; then
      continue
    fi
  fi

  # --ready / --blocked: only items at stage:implementing
  if [[ $want_ready -eq 1 || $want_blocked -eq 1 ]]; then
    s="$(fm_field "$f" stage)"
    [[ "$s" == "implementing" ]] || continue
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
      id="$(fm_field "$f" id)"
      kind="$(fm_field "$f" kind)"
      stage="$(fm_field "$f" stage)"
      tags_csv="$(fm_array "$f" tags | tr ' ' ',' || true)"
      parent="$(fm_field "$f" parent)"
      [[ "$parent" == "null" ]] && parent="-"
      printf '%-40s  %-8s  %-14s  %-30s  %s\n' "$id" "$kind" "$stage" "$tags_csv" "$parent"
    done
    ;;
esac

exit 0
