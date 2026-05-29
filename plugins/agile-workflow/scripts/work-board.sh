#!/usr/bin/env bash
# work-board — render the agile-workflow .work/ substrate as a
# self-contained HTML kanban board.
#
# Pure bash + awk + base64. No Node/Python required to render.
# Optional: python3 only used for `--serve`.
#
# Exit codes:
#   0  success
#   1  usage error
#   2  no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)

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
    echo "work-board: requires bash 4 or newer (current: ${BASH_VERSION:-unknown})"
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
work-board — render .work/ as a classic agile kanban board (HTML)

Usage: work-board [OPTIONS]

Output:
  --out <path>     Write HTML to this path (default: temp file)
  --print          Print the output path; do not open a browser
  --serve [port]   Start a local http server (requires python3, default port 8181)
  --no-open        Alias for --print

Other:
  --help           Show this help and exit

Without flags: writes to a temp file and tries to open it via xdg-open / open / start.
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
        gsub(/^"|"$/, "", val)
        gsub(/^'\''|'\''$/, "", val)
        print val
        exit
      }
    }
  ' "$file"
}

# Print elements of a flow-style array frontmatter field, space-separated.
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

# Extract a title from the body: first H1 or H2, else first non-empty line.
extract_title() {
  awk '
    BEGIN { in_fm = 0; fm_done = 0 }
    /^---[[:space:]]*$/ {
      if (in_fm == 0 && fm_done == 0) { in_fm = 1; next }
      else if (in_fm == 1) { in_fm = 0; fm_done = 1; next }
    }
    fm_done == 1 {
      if (match($0, /^#{1,2}[[:space:]]+/)) {
        line = substr($0, RLENGTH + 1)
        sub(/[[:space:]]+$/, "", line)
        print line
        exit
      }
      if (NF > 0 && fallback == "") {
        fallback = $0
      }
    }
    END {
      if (fallback != "") { print fallback }
    }
  ' "$1"
}

# Extract a short excerpt: first paragraph after the title, capped to ~200 chars.
extract_excerpt() {
  awk '
    BEGIN { in_fm = 0; fm_done = 0; past_title = 0; buf = "" }
    /^---[[:space:]]*$/ {
      if (in_fm == 0 && fm_done == 0) { in_fm = 1; next }
      else if (in_fm == 1) { in_fm = 0; fm_done = 1; next }
    }
    fm_done != 1 { next }
    /^#{1,6}[[:space:]]/ {
      if (past_title == 0) { past_title = 1; next }
      else { exit }
    }
    past_title == 1 {
      if (NF == 0) {
        if (buf != "") { exit }
        else { next }
      }
      buf = (buf == "" ? $0 : buf " " $0)
      if (length(buf) > 200) { exit }
    }
    fm_done == 1 && past_title == 0 {
      # No title heading — capture first paragraph after frontmatter.
      if (NF == 0) {
        if (buf != "") { exit }
        else { next }
      }
      buf = (buf == "" ? $0 : buf " " $0)
      if (length(buf) > 200) { exit }
    }
    END {
      gsub(/[[:space:]]+/, " ", buf)
      if (length(buf) > 220) { buf = substr(buf, 1, 217) "..." }
      print buf
    }
  ' "$1"
}

# Base64 encode stdin → single-line ASCII. Handles GNU and BSD base64.
b64() {
  if base64 --help 2>&1 | grep -q -- '-w'; then
    base64 -w 0
  else
    base64 | tr -d '\n'
  fi
}

# ============================================================================
# Argument parsing
# ============================================================================

out_path=""
mode="open"
serve_port=8181

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)   usage; exit 0 ;;
    --out)       out_path="${2:-}"; shift 2 ;;
    --print)     mode="print"; shift ;;
    --no-open)   mode="print"; shift ;;
    --serve)
      mode="serve"
      if [[ $# -ge 2 && "${2:-}" =~ ^[0-9]+$ ]]; then
        serve_port="$2"; shift 2
      else
        shift
      fi
      ;;
    --port)      serve_port="${2:-8181}"; shift 2 ;;
    *)           echo "work-board: unknown arg: $1" >&2; usage >&2; exit 1 ;;
  esac
done

# ============================================================================
# Find substrate
# ============================================================================

ROOT="$(find_substrate_root || true)"
if [[ -z "$ROOT" ]]; then
  echo "work-board: no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)" >&2
  exit 2
fi

PROJECT_NAME="$(basename "$ROOT")"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

# ============================================================================
# Resolve template
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/work-board.template.html"
if [[ ! -f "$TEMPLATE" ]]; then
  echo "work-board: template not found at $TEMPLATE" >&2
  exit 1
fi

# ============================================================================
# Resolve output path
# ============================================================================

if [[ -z "$out_path" ]]; then
  if [[ "$mode" == "serve" ]]; then
    serve_dir="$(mktemp -d -t work-board.XXXXXX)"
    out_path="$serve_dir/index.html"
  else
    out_path="$(mktemp -t work-board.XXXXXX).html"
  fi
fi

# ============================================================================
# Gather items → JSON
# ============================================================================

declare -a all_files=()
while IFS= read -r -d '' f; do
  all_files+=("$f")
done < <(find \
  "$ROOT/.work/active" \
  "$ROOT/.work/backlog" \
  "$ROOT/.work/releases" \
  "$ROOT/.work/archive" \
  -type f -name '*.md' ! -name 'CONVENTIONS.md' -print0 2>/dev/null || true)

# Build a quick stage-by-id index for ready/blocked computation.
declare -A STAGE_BY_ID
declare -A BUCKET_BY_ID
for f in "${all_files[@]}"; do
  fid="$(fm_field "$f" id)"
  fstage="$(fm_field "$f" stage)"
  case "$f" in
    */.work/active/*)   fbucket="active" ;;
    */.work/backlog/*)  fbucket="backlog" ;;
    */.work/releases/*) fbucket="releases" ;;
    */.work/archive/*)  fbucket="archive" ;;
    *)                  fbucket="other" ;;
  esac
  if [[ -n "$fid" ]]; then
    STAGE_BY_ID["$fid"]="$fstage"
    BUCKET_BY_ID["$fid"]="$fbucket"
  fi
done

is_done() {
  local id="$1"
  local stage="${STAGE_BY_ID[$id]:-}"
  local bucket="${BUCKET_BY_ID[$id]:-}"
  if [[ "$stage" == "done" || "$stage" == "released" ]]; then return 0; fi
  if [[ "$bucket" == "releases" || "$bucket" == "archive" ]]; then return 0; fi
  return 1
}

# Emit the JSON array.
emit_items_json() {
  local first=1
  echo "["
  for f in "${all_files[@]}"; do
    if [[ $first -eq 0 ]]; then echo ","; fi
    first=0

    local id kind stage parent rb gate created updated
    id="$(fm_field "$f" id)"
    kind="$(fm_field "$f" kind)"
    stage="$(fm_field "$f" stage)"
    parent="$(fm_field "$f" parent)"
    rb="$(fm_field "$f" release_binding)"
    gate="$(fm_field "$f" gate_origin)"
    created="$(fm_field "$f" created)"
    updated="$(fm_field "$f" updated)"

    local bucket release_dir=""
    case "$f" in
      */.work/active/*)
        bucket="active"
        ;;
      */.work/backlog/*)
        bucket="backlog"
        ;;
      */.work/releases/*)
        bucket="releases"
        # Extract version directory: .work/releases/<version>/<file>.md
        release_dir="${f#*/.work/releases/}"
        release_dir="${release_dir%%/*}"
        ;;
      */.work/archive/*)
        bucket="archive"
        ;;
      *) bucket="other" ;;
    esac

    # Tags array
    local tags_json="[" t first_t=1
    for t in $(fm_array "$f" tags); do
      if [[ $first_t -eq 0 ]]; then tags_json+=","; fi
      tags_json+="\"$t\""
      first_t=0
    done
    tags_json+="]"

    # Depends_on array
    local deps_json="[" d first_d=1 unmet_arr=()
    for d in $(fm_array "$f" depends_on); do
      if [[ $first_d -eq 0 ]]; then deps_json+=","; fi
      deps_json+="\"$d\""
      first_d=0
      if ! is_done "$d"; then unmet_arr+=("$d"); fi
    done
    deps_json+="]"

    local unmet_json="[" first_u=1 u
    for u in "${unmet_arr[@]:-}"; do
      [[ -z "$u" ]] && continue
      if [[ $first_u -eq 0 ]]; then unmet_json+=","; fi
      unmet_json+="\"$u\""
      first_u=0
    done
    unmet_json+="]"

    # Computed flags
    local ready=false blocked=false
    if [[ "$stage" == "implementing" ]]; then
      if (( ${#unmet_arr[@]} == 0 )); then ready=true
      else blocked=true
      fi
    fi

    # Optional / null-able scalars
    json_or_null() {
      local v="$1"
      if [[ -z "$v" || "$v" == "null" ]]; then echo "null"
      else echo "\"$v\""
      fi
    }

    local parent_v rb_v gate_v rd_v
    parent_v="$(json_or_null "$parent")"
    rb_v="$(json_or_null "$rb")"
    gate_v="$(json_or_null "$gate")"
    rd_v="$(json_or_null "$release_dir")"

    # Title / excerpt / path → base64 (avoids JSON escaping headaches).
    local title excerpt path_rel title_b64 excerpt_b64 path_b64
    title="$(extract_title "$f")"
    excerpt="$(extract_excerpt "$f")"
    path_rel="${f#"$ROOT"/}"
    title_b64="$(printf '%s' "$title" | b64)"
    excerpt_b64="$(printf '%s' "$excerpt" | b64)"
    path_b64="$(printf '%s' "$path_rel" | b64)"

    cat <<JSON
{"id":"$id","kind":"$kind","stage":"$stage","parent":$parent_v,"release_binding":$rb_v,"gate_origin":$gate_v,"created":"$created","updated":"$updated","tags":$tags_json,"depends_on":$deps_json,"unmet_deps":$unmet_json,"bucket":"$bucket","release_dir":$rd_v,"ready":$ready,"blocked":$blocked,"title_b64":"$title_b64","excerpt_b64":"$excerpt_b64","path_b64":"$path_b64"}
JSON
  done
  echo "]"
}

ITEMS_JSON="$(emit_items_json)"

# Also gather conventions tag taxonomy if present.
TAGS_DOC=""
if [[ -f "$ROOT/.work/CONVENTIONS.md" ]]; then
  TAGS_DOC="$(printf '%s' "$(awk '
    /^## *Tag taxonomy/i { in_tags = 1; next }
    in_tags && /^##/ { exit }
    in_tags { print }
  ' "$ROOT/.work/CONVENTIONS.md")" | b64)"
fi

# ============================================================================
# Render: substitute placeholders in template
# ============================================================================

mkdir -p "$(dirname "$out_path")"

# Use awk for substitution — sed struggles with multi-line / large JSON.
# items / tags_b64 are passed via the environment (ENVIRON[]) rather than -v:
# awk's -v assignment cannot contain literal newlines (it errors with
# "newline in string"), and ITEMS_JSON is pretty-printed multi-line JSON.
ITEMS_JSON="$ITEMS_JSON" TAGS_DOC_B64="$TAGS_DOC" awk -v project="$PROJECT_NAME" \
    -v ts="$TIMESTAMP" '
  {
    line = $0
    gsub(/\{\{PROJECT_NAME\}\}/, project, line)
    gsub(/\{\{TIMESTAMP\}\}/, ts, line)
    gsub(/\{\{TAGS_DOC_B64\}\}/, ENVIRON["TAGS_DOC_B64"], line)
    if (line ~ /\{\{ITEMS_JSON\}\}/) {
      # Direct injection — items may contain backslashes/etc that gsub mangles.
      items = ENVIRON["ITEMS_JSON"]
      n = index(line, "{{ITEMS_JSON}}")
      before = substr(line, 1, n - 1)
      after = substr(line, n + length("{{ITEMS_JSON}}"))
      print before items after
    } else {
      print line
    }
  }
' "$TEMPLATE" > "$out_path"

# ============================================================================
# Open / print / serve
# ============================================================================

count=${#all_files[@]}

case "$mode" in
  open)
    opener=""
    if command -v xdg-open >/dev/null 2>&1; then opener="xdg-open"
    elif command -v open >/dev/null 2>&1; then opener="open"
    elif command -v wslview >/dev/null 2>&1; then opener="wslview"
    elif command -v start >/dev/null 2>&1; then opener="start"
    fi
    if [[ -n "$opener" ]]; then
      "$opener" "$out_path" >/dev/null 2>&1 &
      disown 2>/dev/null || true
    fi
    echo "work-board: rendered $count items"
    echo "  $out_path"
    if [[ -z "$opener" ]]; then
      echo "  (no browser launcher found — open the file manually)"
    fi
    ;;
  print)
    echo "$out_path"
    ;;
  serve)
    if ! command -v python3 >/dev/null 2>&1; then
      echo "work-board: --serve requires python3 (got $count items rendered to $out_path)" >&2
      exit 1
    fi
    echo "work-board: rendered $count items, serving on http://localhost:$serve_port"
    echo "            (Ctrl-C to stop)"
    cd "$(dirname "$out_path")"
    exec python3 -m http.server "$serve_port"
    ;;
esac

exit 0
