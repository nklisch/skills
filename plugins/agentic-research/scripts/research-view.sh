#!/usr/bin/env bash
# research-view — query artifacts in the agentic-research substrate.
#
# Pure bash + a single awk pass. Zero external dependencies beyond awk, find,
# sort, and xargs (all POSIX). Designed as the installer's fallback when no
# prebuilt research-view binary is available.
#
# Exit codes:
#   0  success
#   1  usage error (bad flag, unknown flag, unexpected argument)
#   2  no substrate found (no .research/CONVENTIONS.md in CWD or ancestor)

set -euo pipefail

# Kept in lockstep with plugin.json by scripts/bump-version.sh. Do not hand-edit.
RESEARCH_VIEW_VERSION="0.6.2"

# ============================================================================
# Version prelude (POSIX / bash 3.2 safe — runs BEFORE the Bash-4 guard)
# ============================================================================
#
# `--version` must answer correctly even on a host whose only bash is the
# macOS system 3.2 with no modern bash to re-exec into.  Output is
# byte-identical to the Rust binary: `research-view <semver>\n`, exit 0.
case "${1:-}" in
  --version|-V) printf 'research-view %s\n' "$RESEARCH_VIEW_VERSION"; exit 0 ;;
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
    echo "research-view: requires bash 4 or newer (current: ${BASH_VERSION:-unknown})"
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
research-view — query artifacts in the agentic-research substrate

Usage: research-view [FILTERS...] [OUTPUT]

Filters (compose with AND semantics):
  --tier <tier>                  Artifacts at the given tier
                                 (attestation|precis|position|brief|campaign|hypothesis|reference)
  --handle <h>                   Artifacts with the given source_handle
  --status <s>                   Artifacts with the given status (or 'null' for absent)
  --temporal-contract <tc>       Artifacts with the given temporal_contract (or 'null')
  --provenance <p>               Artifacts with the given provenance (or 'null')
  --corpus <c>                   Reference artifacts from the given corpus (or 'null')
  --tag <t>                      Reference artifacts whose theme set contains tag <t>

Tier sugar (sets --tier):
  --attestations                 Shorthand for --tier attestation
  --positions                    Shorthand for --tier position
  --precis                       Shorthand for --tier precis
  --briefs                       Shorthand for --tier brief
  --campaigns                    Shorthand for --tier campaign
  --hypotheses                   Shorthand for --tier hypothesis
  --reference                    Shorthand for --tier reference

Output (default tabular):
  --paths                        One file path per line
  --cat                          Full artifact bodies (separated by ---)
  --count                        Match count only
  --tags                         Tag-vocabulary projection: one line per tag with entry
                                 count and corpus list (composes with filters)

Other:
  --version, -V                  Print the research-view version and exit
  --help, -h                     Show this help and exit
USAGE
}

# ============================================================================
# Substrate root detection
# ============================================================================

find_substrate_root() {
  local dir
  dir="$(pwd)"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/.research/CONVENTIONS.md" ]]; then
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
# Reads every artifact file once and emits one Unit-Separator-delimited record:
#   path \037 source_handle \037 slug \037 status \037 temporal_contract \037
#        provenance
#
# tier and corpus are NOT stored here — they're derived from the path after
# sorting (see build_index). The Unit Separator (0x1F) never appears in YAML
# frontmatter, so empty fields survive the round trip.
#
# Normalization: missing / null / "null" / empty → empty string (None in Rust).
# Whitespace-stripped. Single-layer quote-stripped.

read -r -d '' AWK_INDEX <<'AWK' || true
function strip(v) {
  sub(/^[[:space:]]+/, "", v)
  sub(/[[:space:]]+$/, "", v)
  sub(/^"/, "", v); sub(/"$/, "", v)
  sub(/^'/, "", v); sub(/'$/, "", v)
  sub(/^[[:space:]]+/, "", v)
  sub(/[[:space:]]+$/, "", v)
  if (v == "null") return ""
  return v
}
function field(line, key,   p) {
  p = "^" key ":"
  if (match(line, p)) return strip(substr(line, RLENGTH + 1))
  return "\001NOMATCH\001"
}
# Strip a trailing [NEW] marker (with surrounding whitespace) from a tag.
function strip_new(tag) {
  sub(/[[:space:]]*\[NEW\][[:space:]]*$/, "", tag)
  sub(/[[:space:]]+$/, "", tag)
  return tag
}
# Parse a **Themes:** body line, accumulating per-tag entry counts and the
# ordered unique tag list for the current file.
# tag_counts[tag] = entry-count; tag_order[] = ordered unique list; tag_order_n = length.
function parse_themes_line(line,   rest, n, parts, i, tag, trimmed) {
  # Match: optional leading whitespace, then "-" or "*" (but not "**"), then
  # optional whitespace, then "**Themes:**", then the tag list.
  if (match(line, /^[[:space:]]*[-*][[:space:]]+\*\*Themes:\*\*/)) {
    rest = substr(line, RSTART + RLENGTH)
    n = split(rest, parts, ",")
    # Deduplicate within this entry before counting
    delete seen_this
    for (i = 1; i <= n; i++) {
      trimmed = parts[i]
      sub(/^[[:space:]]+/, "", trimmed)
      sub(/[[:space:]]+$/, "", trimmed)
      trimmed = strip_new(trimmed)
      if (trimmed == "") continue
      if (trimmed in seen_this) continue
      seen_this[trimmed] = 1
      # Accumulate entry count
      tag_counts[trimmed]++
      # Track first-seen order
      if (!(trimmed in tag_seen_global)) {
        tag_seen_global[trimmed] = 1
        tag_order[++tag_order_n] = trimmed
      }
    }
  }
}
function emit(   i, tag, first, themes_enc) {
  if (cf == "") return
  # Encode themes as "tag:count|tag:count|..." in first-seen order.
  # Limitation: tags containing ":" or "|" break this encoding (undefined behavior
  # shared by both impls); slug-like tags assumed. Redesigning the encoding is
  # out of scope here.
  # If no themes, emit empty field.
  themes_enc = ""
  first = 1
  for (i = 1; i <= tag_order_n; i++) {
    tag = tag_order[i]
    if (!first) themes_enc = themes_enc "|"
    themes_enc = themes_enc tag ":" tag_counts[tag]
    first = 0
  }
  printf "%s\037%s\037%s\037%s\037%s\037%s\037%s\n", \
    cf, handle, slug, status, temporal, provenance, themes_enc
}
function reset(fname) {
  cf = fname; in_fm = 0; fm_done = 0
  handle = ""; slug = ""; status = ""; temporal = ""; provenance = ""
  delete have
  # Reset theme state
  delete tag_counts
  delete tag_seen_global
  delete tag_order
  tag_order_n = 0
  # Detect reference tier by path: contains "/.research/reference/"
  is_reference = (fname ~ /\/\.research\/reference\//)
}
BEGIN { v = "" }
FNR == 1 { emit(); reset(FILENAME) }
{
  if (fm_done) {
    # After frontmatter: parse body for themes (reference tier only)
    if (is_reference) parse_themes_line($0)
    next
  }
  if ($0 ~ /^---[[:space:]]*$/) {
    # Frontmatter can only open at the very first line (FNR==1).
    # A "---" anywhere else in a file that never opened frontmatter is body
    # content (e.g. a markdown horizontal rule) and must not be treated as an
    # opener; doing so would silently drop all body lines that follow it.
    if (in_fm == 0 && FNR == 1) {
      in_fm = 1
    } else if (in_fm == 1) {
      fm_done = 1
    }
    # else: mid-body "---" with no open frontmatter block — fall through to
    # the body-line branch below (is_reference parse_themes_line call).
    next
  }
  if (in_fm != 1) {
    # Body line before any frontmatter (lenient file — no opening ---)
    if (is_reference) parse_themes_line($0)
    next
  }
  if (!("handle" in have))    { v = field($0, "source_handle");     if (v != "\001NOMATCH\001") { handle = v;     have["handle"] = 1;     next } }
  if (!("slug" in have))      { v = field($0, "slug");              if (v != "\001NOMATCH\001") { slug = v;       have["slug"] = 1;       next } }
  if (!("status" in have))    { v = field($0, "status");            if (v != "\001NOMATCH\001") { status = v;     have["status"] = 1;     next } }
  if (!("temporal" in have))  { v = field($0, "temporal_contract"); if (v != "\001NOMATCH\001") { temporal = v;   have["temporal"] = 1;   next } }
  if (!("provenance" in have)){ v = field($0, "provenance");        if (v != "\001NOMATCH\001") { provenance = v; have["provenance"] = 1; next } }
}
END { emit() }
AWK

# ============================================================================
# Tier + corpus derivation from path
# ============================================================================
#
# Derives tier and corpus from the artifact's absolute path, matching the
# binary's collect_sorted_paths logic exactly:
#   .research/attestation/*.md                   → attestation
#   .research/precis/*.md                        → precis
#   .research/analysis/positions/*.md            → position
#   .research/analysis/briefs/*.md               → brief
#   .research/analysis/campaigns/**/*.md         → campaign
#   .research/analysis/hypothesis/*.md           → hypothesis
#   .research/reference/<corpus>/**/*.md         → reference, corpus=<corpus>
#
# Sets globals DERIVED_TIER and DERIVED_CORPUS.

derive_tier_corpus() {
  local path="$1" root="$2"
  # Strip the root prefix to get a path relative to root
  local rel="${path#"$root/"}"
  # rel is now e.g. ".research/attestation/foo.md"

  DERIVED_TIER=""
  DERIVED_CORPUS=""

  case "$rel" in
    .research/attestation/*)
      DERIVED_TIER="attestation"
      ;;
    .research/precis/*)
      DERIVED_TIER="precis"
      ;;
    .research/analysis/positions/*)
      DERIVED_TIER="position"
      ;;
    .research/analysis/briefs/*)
      DERIVED_TIER="brief"
      ;;
    .research/analysis/campaigns/*)
      DERIVED_TIER="campaign"
      ;;
    .research/analysis/hypothesis/*)
      DERIVED_TIER="hypothesis"
      ;;
    .research/reference/*)
      DERIVED_TIER="reference"
      # corpus = the directory component immediately after "reference/"
      local after_ref="${rel#.research/reference/}"
      DERIVED_CORPUS="${after_ref%%/*}"
      ;;
    *)
      DERIVED_TIER=""
      ;;
  esac
}

# ============================================================================
# Artifact index
# ============================================================================
#
# Globals populated by build_index (all keyed by file path):
#   ALL_FILES       — array of artifact file paths, in LC_ALL=C byte-sort order
#   IDX_HANDLE      — source_handle (empty if absent)
#   IDX_SLUG        — slug (empty if absent)
#   IDX_STATUS      — status (empty if absent / null)
#   IDX_TEMPORAL    — temporal_contract (empty if absent / null)
#   IDX_PROVENANCE  — provenance (empty if absent / null)
#   IDX_TIER        — derived tier label
#   IDX_CORPUS      — derived corpus (empty for non-reference tiers)
#   IDX_IDENTITY    — source_handle ∥ slug ∥ file-stem

declare -a ALL_FILES=()
declare -A IDX_HANDLE IDX_SLUG IDX_STATUS IDX_TEMPORAL IDX_PROVENANCE
declare -A IDX_TIER IDX_CORPUS IDX_IDENTITY
# IDX_THEMES[path] — "tag:count|tag:count|..." for reference-tier artifacts (empty otherwise)
declare -A IDX_THEMES

# SKIP_FILE — returns 0 (true) if the file should be skipped.
# Skips: reference/**/raw/**, README.md, CONVENTIONS.md, references.md
skip_file() {
  local path="$1" root="$2"
  local rel="${path#"$root/"}"
  local fname
  fname="$(basename "$path")"

  # Skip tier-root README/CONVENTIONS/references.md at any level
  case "$fname" in
    README.md|CONVENTIONS.md|references.md) return 0 ;;
  esac

  # Skip reference/**/raw/** subtrees
  case "$rel" in
    .research/reference/*/raw/*) return 0 ;;
  esac

  return 1
}

build_index() {
  local root="$1"
  local research="$root/.research"
  local path handle slug status temporal provenance

  ALL_FILES=()

  # Collect all .md files from the relevant tier directories, byte-sorted.
  # NOTE: this find is recursive for every tier dir, whereas the binary indexes
  # the flat tiers (attestation/precis/positions/briefs/hypothesis) NON-recursively
  # (only campaigns/ and reference/ are recursive). Flat tiers carry no subdirs by
  # convention, so the two sets match in practice; exact -maxdepth parity is a
  # tracked follow-up (see backlog idea-research-view-fallback-flat-maxdepth).
  # We feed all dirs to one sort for global byte-sort order.
  local find_dirs=()
  [[ -d "$research/attestation" ]]              && find_dirs+=("$research/attestation")
  [[ -d "$research/precis" ]]                   && find_dirs+=("$research/precis")
  [[ -d "$research/analysis/positions" ]]       && find_dirs+=("$research/analysis/positions")
  [[ -d "$research/analysis/briefs" ]]          && find_dirs+=("$research/analysis/briefs")
  [[ -d "$research/analysis/campaigns" ]]       && find_dirs+=("$research/analysis/campaigns")
  [[ -d "$research/analysis/hypothesis" ]]      && find_dirs+=("$research/analysis/hypothesis")
  [[ -d "$research/reference" ]]                && find_dirs+=("$research/reference")

  if (( ${#find_dirs[@]} == 0 )); then
    return 0
  fi

  # Parse awk output into index arrays.
  # awk is run over all files in byte-sorted order so the awk index order
  # matches the binary's load order.
  while IFS=$'\037' read -r path handle slug status temporal provenance themes_enc; do
    [[ -n "$path" ]] || continue

    # Apply skip rules
    skip_file "$path" "$root" && continue

    # Derive tier and corpus from the path
    derive_tier_corpus "$path" "$root"
    [[ -n "$DERIVED_TIER" ]] || continue

    # Compute identity: source_handle ∥ slug ∥ file-stem
    local identity=""
    if [[ -n "$handle" ]]; then
      identity="$handle"
    elif [[ -n "$slug" ]]; then
      identity="$slug"
    else
      local stem
      stem="$(basename "$path" .md)"
      identity="$stem"
    fi

    ALL_FILES+=("$path")
    IDX_HANDLE["$path"]="$handle"
    IDX_SLUG["$path"]="$slug"
    IDX_STATUS["$path"]="$status"
    IDX_TEMPORAL["$path"]="$temporal"
    IDX_PROVENANCE["$path"]="$provenance"
    IDX_TIER["$path"]="$DERIVED_TIER"
    IDX_CORPUS["$path"]="$DERIVED_CORPUS"
    IDX_IDENTITY["$path"]="$identity"
    IDX_THEMES["$path"]="${themes_enc:-}"

  done < <(
    find "${find_dirs[@]}" -type f -name '*.md' -print0 2>/dev/null \
    | LC_ALL=C sort -z \
    | xargs -0 awk "$AWK_INDEX" 2>/dev/null || true
  )
}

# ============================================================================
# Argument parsing
# ============================================================================

want_tier=""
want_handle=""
want_status=""
want_status_null=0
want_temporal=""
want_temporal_null=0
want_provenance=""
want_provenance_null=0
want_corpus=""
want_corpus_null=0
want_tag=""
output_mode="table"
flags_done=0

while [[ $# -gt 0 ]]; do
  if [[ $flags_done -eq 1 ]]; then
    echo "research-view: unexpected argument: $1" >&2
    exit 1
  fi
  case "$1" in
    --help|-h)
      usage; exit 0 ;;
    # Short-circuits before substrate detection so --version works outside a
    # substrate. -V is the short form. The POSIX prelude already handles
    # --version as the first arg for bash 3.2; this arm covers it in any
    # position once running under bash 4+.
    --version|-V)
      printf 'research-view %s\n' "$RESEARCH_VIEW_VERSION"; exit 0 ;;
    --)
      flags_done=1; shift ;;
    --tier)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --tier" >&2; exit 1
      fi
      case "$2" in
        attestation|precis|position|brief|campaign|hypothesis|reference)
          want_tier="$2" ;;
        *)
          echo "research-view: unknown tier: \"$2\" (expected attestation|precis|position|brief|campaign|hypothesis|reference)" >&2; exit 1 ;;
      esac
      shift 2 ;;
    # Tier sugar
    --attestations)  want_tier="attestation"; shift ;;
    --positions)     want_tier="position";    shift ;;
    --precis)        want_tier="precis";      shift ;;
    --briefs)        want_tier="brief";       shift ;;
    --campaigns)     want_tier="campaign";    shift ;;
    --hypotheses)    want_tier="hypothesis";  shift ;;
    --reference)     want_tier="reference";   shift ;;
    --handle)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --handle" >&2; exit 1
      fi
      want_handle="$2"; shift 2 ;;
    --status)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --status" >&2; exit 1
      fi
      if [[ "$2" == "null" ]]; then
        want_status_null=1; want_status=""
      else
        want_status="$2"; want_status_null=0
      fi
      shift 2 ;;
    --temporal-contract)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --temporal-contract" >&2; exit 1
      fi
      if [[ "$2" == "null" ]]; then
        want_temporal_null=1; want_temporal=""
      else
        want_temporal="$2"; want_temporal_null=0
      fi
      shift 2 ;;
    --provenance)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --provenance" >&2; exit 1
      fi
      if [[ "$2" == "null" ]]; then
        want_provenance_null=1; want_provenance=""
      else
        want_provenance="$2"; want_provenance_null=0
      fi
      shift 2 ;;
    --corpus)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --corpus" >&2; exit 1
      fi
      if [[ "$2" == "null" ]]; then
        want_corpus_null=1; want_corpus=""
      else
        want_corpus="$2"; want_corpus_null=0
      fi
      shift 2 ;;
    --tag)
      if [[ $# -lt 2 || "$2" == -* ]]; then
        echo "research-view: missing value for --tag" >&2; exit 1
      fi
      if [[ "$2" == "null" ]]; then
        echo "research-view: --tag does not accept 'null': themes is a set membership filter; use --tier reference to find reference artifacts" >&2; exit 1
      fi
      want_tag="$2"; shift 2 ;;
    --paths)   output_mode="paths"; shift ;;
    --cat)     output_mode="cat";   shift ;;
    --count)   output_mode="count"; shift ;;
    --tags)    output_mode="tags";  shift ;;
    -*)
      echo "research-view: unknown flag: $1" >&2; exit 1 ;;
    *)
      echo "research-view: unexpected argument: $1" >&2; exit 1 ;;
  esac
done

# ============================================================================
# Main
# ============================================================================

ROOT="$(find_substrate_root || true)"
if [[ -z "$ROOT" ]]; then
  echo "research-view: no substrate found (no .research/CONVENTIONS.md in CWD or ancestor)" >&2
  exit 2
fi

build_index "$ROOT"

declare -a matches=()

for f in "${ALL_FILES[@]}"; do
  # --tier
  if [[ -n "$want_tier" ]]; then
    [[ "${IDX_TIER[$f]}" == "$want_tier" ]] || continue
  fi

  # --handle (Equals match only — no null sugar for handle)
  if [[ -n "$want_handle" ]]; then
    [[ "${IDX_HANDLE[$f]}" == "$want_handle" ]] || continue
  fi

  # --status (Equals or IsNull)
  if [[ $want_status_null -eq 1 ]]; then
    [[ -z "${IDX_STATUS[$f]}" ]] || continue
  elif [[ -n "$want_status" ]]; then
    [[ "${IDX_STATUS[$f]}" == "$want_status" ]] || continue
  fi

  # --temporal-contract (Equals or IsNull)
  if [[ $want_temporal_null -eq 1 ]]; then
    [[ -z "${IDX_TEMPORAL[$f]}" ]] || continue
  elif [[ -n "$want_temporal" ]]; then
    [[ "${IDX_TEMPORAL[$f]}" == "$want_temporal" ]] || continue
  fi

  # --provenance (Equals or IsNull)
  if [[ $want_provenance_null -eq 1 ]]; then
    [[ -z "${IDX_PROVENANCE[$f]}" ]] || continue
  elif [[ -n "$want_provenance" ]]; then
    [[ "${IDX_PROVENANCE[$f]}" == "$want_provenance" ]] || continue
  fi

  # --corpus (Equals or IsNull)
  if [[ $want_corpus_null -eq 1 ]]; then
    [[ -z "${IDX_CORPUS[$f]}" ]] || continue
  elif [[ -n "$want_corpus" ]]; then
    [[ "${IDX_CORPUS[$f]}" == "$want_corpus" ]] || continue
  fi

  # --tag (set membership: artifact's themes must contain the tag exactly)
  if [[ -n "$want_tag" ]]; then
    themes_enc_f="${IDX_THEMES[$f]:-}"
    if [[ -z "$themes_enc_f" ]]; then
      continue  # no themes → never matches
    fi
    # themes_enc = "tag:count|tag:count|..."
    # Check if any segment starts with "want_tag:"
    found_tag_f=0
    IFS_save_f="$IFS"
    IFS='|'
    set -f  # disable glob expansion while word-splitting themes_enc_f
    for seg_f in $themes_enc_f; do
      seg_tag_f="${seg_f%%:*}"
      if [[ "$seg_tag_f" == "$want_tag" ]]; then
        found_tag_f=1
        break
      fi
    done
    set +f
    IFS="$IFS_save_f"
    [[ $found_tag_f -eq 1 ]] || continue
  fi

  matches+=("$f")
done

# ============================================================================
# Output
# ============================================================================
#
# Table column widths (must match render.rs exactly):
#   W_IDENTITY = 30, W_TIER = 12, W_STATUS = 10, W_TEMPORAL = 26
#   Two-space column separators. PROVENANCE is the last column (no width limit).

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
    local_first=1
    for f in "${matches[@]}"; do
      if [[ $local_first -eq 0 ]]; then
        printf '\n---\n\n'
      fi
      cat "$f"
      local_first=0
    done
    ;;
  tags)
    # Tag-vocabulary projection: aggregate per-tag entry counts and corpora
    # across matched artifacts, then print lexically sorted (LC_ALL=C byte order).
    #
    # Accumulate into TAG_COUNT[tag]=total_entries and TAG_CORPORA[tag]=set.
    # We use bash associative arrays for counts and a parallel sorted-insert
    # for corpora. Final sort is handled by LC_ALL=C sort.
    declare -A TAG_COUNT=()
    declare -A TAG_CORPORA=()  # value: "corpus1\ncorpus2\n..." (one per line, deduped by sort -u)

    for f in "${matches[@]}"; do
      themes_enc_t="${IDX_THEMES[$f]:-}"
      [[ -n "$themes_enc_t" ]] || continue
      corpus_t="${IDX_CORPUS[$f]:-}"
      # Parse "tag:count|tag:count|..."
      IFS_save_t="$IFS"
      IFS='|'
      set -f  # disable glob expansion while word-splitting themes_enc_t
      for seg_t in $themes_enc_t; do
        seg_tag_t="${seg_t%%:*}"
        seg_count_t="${seg_t#*:}"
        [[ -n "$seg_tag_t" ]] || continue
        TAG_COUNT["$seg_tag_t"]=$(( ${TAG_COUNT["$seg_tag_t"]:-0} + ${seg_count_t:-0} ))
        if [[ -n "$corpus_t" ]]; then
          # Append corpus to set (we'll deduplicate with sort -u at render time)
          TAG_CORPORA["$seg_tag_t"]+="${corpus_t}"$'\n'
        fi
      done
      set +f
      IFS="$IFS_save_t"
    done

    if (( ${#TAG_COUNT[@]} == 0 )); then
      exit 0
    fi

    # Build sorted output: one line per tag, LC_ALL=C byte-sorted.
    tag_lines_t=()
    for tag_t in "${!TAG_COUNT[@]}"; do
      tag_lines_t+=("$tag_t")
    done

    # Sort tags in LC_ALL=C byte order
    sorted_tags_t="$(printf '%s\n' "${tag_lines_t[@]}" | LC_ALL=C sort)"

    # Print header + separator + rows
    printf '%-30s  %5s  CORPORA\n' "TAG" "COUNT"
    printf '%-30s  %5s  -------\n' "------------------------------" "-----"

    while IFS= read -r tag_t; do
      [[ -n "$tag_t" ]] || continue
      count_t="${TAG_COUNT[$tag_t]:-0}"
      # Build comma-separated corpora list, sorted and deduplicated
      corpora_raw_t="${TAG_CORPORA[$tag_t]:-}"
      corpora_list_t=""
      if [[ -n "$corpora_raw_t" ]]; then
        corpora_list_t="$(printf '%s' "$corpora_raw_t" | LC_ALL=C sort -u | tr '\n' ',' | sed 's/,$//')"
      fi
      printf '%-30s  %5d  %s\n' "$tag_t" "$count_t" "$corpora_list_t"
    done <<< "$sorted_tags_t"
    ;;
  table|*)
    if (( ${#matches[@]} == 0 )); then
      exit 0
    fi
    # Header — widths match render.rs: 30 / 12 / 10 / 26
    printf '%-30s  %-12s  %-10s  %-26s  %s\n' \
      "IDENTITY" "TIER" "STATUS" "TEMPORAL_CONTRACT" "PROVENANCE"
    # Separator — fixed-length dash strings matching render.rs exactly
    printf '%-30s  %-12s  %-10s  %-26s  %s\n' \
      "------------------------------" \
      "------------" \
      "----------" \
      "--------------------------" \
      "------------------"
    for f in "${matches[@]}"; do
      printf '%-30s  %-12s  %-10s  %-26s  %s\n' \
        "${IDX_IDENTITY[$f]}" \
        "${IDX_TIER[$f]}" \
        "${IDX_STATUS[$f]}" \
        "${IDX_TEMPORAL[$f]}" \
        "${IDX_PROVENANCE[$f]}"
    done
    ;;
esac

exit 0
