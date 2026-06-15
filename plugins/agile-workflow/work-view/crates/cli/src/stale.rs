//! Backlog staleness filter for `--stale`.
//!
//! Reads `backlog_staleness_days` from `.work/CONVENTIONS.md`, then filters
//! the loaded items to those in the backlog tier whose last-touched date is
//! more than that many days before today (local time).
//!
//! Design decisions:
//! - Last-touched date: `updated` if `Some`, else `created`; if both `None`,
//!   the item is treated as infinitely stale and surfaces unconditionally. A
//!   dateless backlog item has no evidence of recency — surfacing it is
//!   correct and conservative.
//! - Absent `backlog_staleness_days` key → `StalenessThreshold::NotConfigured`
//!   (caller prints a one-line notice and exits 0 — politely inert, same
//!   pattern as opt-in gates).
//! - Date comparison is done in local time, matching the PostToolUse hook that
//!   writes `datetime.now().strftime("%Y-%m-%d")`.
//! - No `chrono` or other time dependency is added — `std::time::SystemTime`
//!   suffices for local-date arithmetic (see `today_local_days`). The crate is
//!   intentionally dependency-light; confirm Cargo.toml before adding anything.
//!
//! NOTE: `--stale` is Rust-only; do NOT back-port to `work-view.sh` (the bash
//! script is a frozen degraded fallback; `--scope` is also Rust-only, same
//! rationale).

use std::path::Path;

use work_view_core::model::{Item, Tier};

// ── Public types ──────────────────────────────────────────────────────────────

/// The result of reading `backlog_staleness_days` from CONVENTIONS.md.
pub enum StalenessThreshold {
    /// The key `backlog_staleness_days: N` was found and parsed.
    Days(u64),
    /// The key is absent from CONVENTIONS.md.  `--stale` should be inert.
    NotConfigured,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Read `backlog_staleness_days` from `<root>/.work/CONVENTIONS.md`.
///
/// The file is scanned line by line; the first line matching
/// `backlog_staleness_days: <integer>` wins.  Lines with leading whitespace,
/// YAML comments, or surrounding blank values are skipped.
///
/// Returns `StalenessThreshold::NotConfigured` when:
/// - the file cannot be read (non-fatal; same graceful-skip contract as the
///   absent-key case), or
/// - no matching line is found.
///
/// Returns `StalenessThreshold::Days(0)` if the value parses as zero (every
/// backlog item would be stale — unusual but valid).
pub fn read_staleness_threshold(root: &Path) -> StalenessThreshold {
    let conventions_path = root.join(".work").join("CONVENTIONS.md");
    let text = match std::fs::read_to_string(&conventions_path) {
        Ok(t) => t,
        Err(_) => return StalenessThreshold::NotConfigured,
    };
    parse_staleness_days(&text)
}

/// Apply the staleness filter to a slice of items.
///
/// Keeps only `Tier::Backlog` items whose last-touched date (see module doc)
/// is more than `threshold_days` days before `today_days`.
///
/// `today_days` should be produced by `today_as_days()`.
pub fn apply_stale(
    items: Vec<&Item>,
    threshold_days: u64,
    today_days: u64,
) -> Vec<&Item> {
    items
        .into_iter()
        .filter(|item| {
            if item.tier != Tier::Backlog {
                return false;
            }
            is_stale(item, threshold_days, today_days)
        })
        .collect()
}

/// Return today's date as a count of days since the Unix epoch, in local time.
///
/// Local-time date: matches `datetime.now().strftime("%Y-%m-%d")` from Python,
/// which the PostToolUse hook uses to stamp `updated` / `created` fields.
///
/// Uses `SystemTime::now()` + UTC offset detection via `/etc/localtime` parsing
/// is complex and not worth the complexity for a "days ago" comparison, so we
/// use a UTC-adjusted approximation: read the UTC timestamp and add the local
/// UTC offset in seconds obtained via `time(2)` libc call.
///
/// # Simpler approach used here
///
/// We read `SystemTime::now()` (UTC epoch seconds), then apply the local-time
/// offset by calling the C `localtime_r` (POSIX) to get the local calendar
/// date — using `std::time` primitives only. On platforms without `libc`, we
/// fall back to UTC, which differs by at most one calendar day; the staleness
/// threshold is days, not hours, so a one-day error on the boundary is
/// acceptable for this use case.
///
/// Since this is not a cryptographic primitive and the crate forbids adding
/// new dependencies, we use `std::time::SystemTime` and compute the local date
/// via the POSIX `time_t` + `localtime` approach using `extern "C"` declarations
/// (available on all POSIX targets where the crate runs: Linux + macOS).
pub fn today_as_days() -> u64 {
    // SAFETY: localtime_r is thread-safe (re-entrant) and widely available on
    // all Linux/macOS targets.  We call it with a valid stack-allocated tm.
    #[cfg(unix)]
    {
        use std::time::{SystemTime, UNIX_EPOCH};

        #[repr(C)]
        #[allow(non_camel_case_types)]
        struct tm {
            tm_sec: i32,
            tm_min: i32,
            tm_hour: i32,
            tm_mday: i32,
            tm_mon: i32,
            tm_year: i32,
            tm_wday: i32,
            tm_yday: i32,
            tm_isdst: i32,
            // glibc adds two more longs for timezone info; include them so the
            // struct is large enough on any libc without ABI mismatch.
            _tm_gmtoff: i64,
            _tm_zone: *const u8,
        }

        extern "C" {
            fn localtime_r(timep: *const i64, result: *mut tm) -> *mut tm;
        }

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let mut local_tm: tm = unsafe { std::mem::zeroed() };
        unsafe { localtime_r(&now, &mut local_tm) };

        let year = local_tm.tm_year + 1900;
        let month = local_tm.tm_mon + 1; // 1..=12
        let day = local_tm.tm_mday; // 1..=31

        date_to_days(year, month as u32, day as u32)
    }

    #[cfg(not(unix))]
    {
        // Non-POSIX fallback: use UTC. Off by at most one calendar day.
        use std::time::{SystemTime, UNIX_EPOCH};
        let secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        // days since epoch (UTC)
        secs / 86400
    }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Parse `backlog_staleness_days` from CONVENTIONS.md text.
fn parse_staleness_days(text: &str) -> StalenessThreshold {
    for line in text.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("backlog_staleness_days:") {
            let value = rest.trim();
            if let Ok(n) = value.parse::<u64>() {
                return StalenessThreshold::Days(n);
            }
        }
    }
    StalenessThreshold::NotConfigured
}

/// Return `true` if `item` is stale: its last-touched date is more than
/// `threshold_days` before `today_days`.
///
/// Last-touched: `updated` if `Some`, else `created`; if both `None`, the
/// item is treated as infinitely stale (always surfaces). See module doc.
fn is_stale(item: &Item, threshold_days: u64, today_days: u64) -> bool {
    let date_str = item
        .updated
        .as_deref()
        .or(item.created.as_deref());

    match date_str {
        None => {
            // No date at all: treat as infinitely stale — surface it.
            // A dateless backlog item is at least as suspect as an old one.
            true
        }
        Some(date) => match parse_date(date) {
            Some(item_days) => {
                // Stale if: today_days - item_days > threshold_days
                // Guard against underflow: if item_days > today_days (clock
                // skew or future date), the item is not stale.
                today_days
                    .saturating_sub(item_days)
                    .gt(&threshold_days)
            }
            None => {
                // Unparseable date: treat as stale (conservative).
                true
            }
        },
    }
}

/// Parse a `YYYY-MM-DD` string into a day count (days since the proleptic
/// Gregorian epoch 0000-01-01, a stable internal unit).
///
/// Returns `None` if the string is not in `YYYY-MM-DD` format or if any
/// component is out of range.
fn parse_date(s: &str) -> Option<u64> {
    // Expect exactly "YYYY-MM-DD": 10 chars, '-' at positions 4 and 7.
    if s.len() != 10 {
        return None;
    }
    let bytes = s.as_bytes();
    if bytes[4] != b'-' || bytes[7] != b'-' {
        return None;
    }
    let year: i32 = s[..4].parse().ok()?;
    let month: u32 = s[5..7].parse().ok()?;
    let day: u32 = s[8..10].parse().ok()?;
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return None;
    }
    Some(date_to_days(year, month, day))
}

/// Convert a proleptic Gregorian calendar date to a day number.
///
/// Uses the algorithm from the C Standard (ISO 8601 / RFC 3339) for Gregorian
/// date arithmetic. The epoch (day 0) is 0000-03-01 (an internal reference
/// point chosen so the leap-day boundary falls at month start).
///
/// This is a pure integer calculation with no dependencies.
fn date_to_days(year: i32, month: u32, day: u32) -> u64 {
    // Shift the epoch so March = month 1; this puts the leap day at end of year.
    let (y, m) = if month <= 2 {
        (year - 1, month + 9)
    } else {
        (year, month - 3)
    };

    let era = y.div_euclid(400);
    let yoe = y.rem_euclid(400) as u64; // year-of-era [0, 399]
    let doy = (153 * m as u64 + 2) / 5 + day as u64 - 1; // day-of-year [0, 365]
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy; // day-of-era [0, 146096]

    // Add a large offset so the result fits in u64 even for years near 0000.
    const EPOCH_OFFSET: u64 = 146097 * 10; // 10 full 400-year cycles
    (era as u64)
        .wrapping_add(10) // same 10-cycle offset
        .wrapping_mul(146097)
        .wrapping_add(doe)
        .wrapping_add(EPOCH_OFFSET)
        .wrapping_sub((10u64).wrapping_mul(146097))
}

// ── Unit tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use work_view_core::model::Tier;

    fn make_backlog_item(id: &str, created: Option<&str>, updated: Option<&str>) -> Item {
        Item {
            id: id.to_string(),
            kind: None,
            stage: None,
            tags: vec![],
            parent: None,
            depends_on: vec![],
            release_binding: None,
            gate_origin: None,
            research_refs: vec![],
            research_origin: None,
            scan_origin: None,
            created: created.map(str::to_string),
            updated: updated.map(str::to_string),
            tier: Tier::Backlog,
            path: PathBuf::from("/fake/backlog/item.md"),
            rel_path: PathBuf::from(".work/backlog/item.md"),
            raw_text: String::new(),
            body: String::new(),
        }
    }

    fn make_active_item(id: &str, created: Option<&str>) -> Item {
        Item {
            id: id.to_string(),
            kind: Some("feature".to_string()),
            stage: Some("implementing".to_string()),
            tags: vec![],
            parent: None,
            depends_on: vec![],
            release_binding: None,
            gate_origin: None,
            research_refs: vec![],
            research_origin: None,
            scan_origin: None,
            created: created.map(str::to_string),
            updated: None,
            tier: Tier::Active,
            path: PathBuf::from("/fake/active/item.md"),
            rel_path: PathBuf::from(".work/active/features/item.md"),
            raw_text: String::new(),
            body: String::new(),
        }
    }

    // ── parse_staleness_days ──────────────────────────────────────────────────

    #[test]
    fn parse_key_present_returns_days() {
        let text = "# Conventions\nbacklog_staleness_days: 90\n";
        assert!(matches!(
            parse_staleness_days(text),
            StalenessThreshold::Days(90)
        ));
    }

    #[test]
    fn parse_key_absent_returns_not_configured() {
        let text = "# Conventions\nsome_other_key: 30\n";
        assert!(matches!(
            parse_staleness_days(text),
            StalenessThreshold::NotConfigured
        ));
    }

    #[test]
    fn parse_key_with_leading_whitespace_on_line_is_found() {
        // The key may appear under a heading with indentation stripped.
        let text = "  backlog_staleness_days: 45\n";
        assert!(matches!(
            parse_staleness_days(text),
            StalenessThreshold::Days(45)
        ));
    }

    #[test]
    fn parse_key_zero_returns_days_zero() {
        let text = "backlog_staleness_days: 0\n";
        assert!(matches!(
            parse_staleness_days(text),
            StalenessThreshold::Days(0)
        ));
    }

    #[test]
    fn parse_key_non_integer_value_skips() {
        let text = "backlog_staleness_days: auto\n";
        assert!(matches!(
            parse_staleness_days(text),
            StalenessThreshold::NotConfigured
        ));
    }

    // ── parse_date ────────────────────────────────────────────────────────────

    #[test]
    fn parse_date_valid_returns_some() {
        assert!(parse_date("2026-01-01").is_some());
        assert!(parse_date("2000-02-29").is_some()); // valid leap year
        assert!(parse_date("1970-01-01").is_some());
    }

    #[test]
    fn parse_date_invalid_format_returns_none() {
        assert!(parse_date("26-01-01").is_none()); // too short
        assert!(parse_date("2026/01/01").is_none()); // wrong separator
        assert!(parse_date("2026-1-1").is_none()); // no zero-padding
        assert!(parse_date("").is_none());
    }

    #[test]
    fn parse_date_monotonically_increasing() {
        let d1 = parse_date("2026-01-01").unwrap();
        let d2 = parse_date("2026-01-02").unwrap();
        let d3 = parse_date("2026-02-01").unwrap();
        let d4 = parse_date("2027-01-01").unwrap();
        assert!(d1 < d2, "next day should be later");
        assert!(d2 < d3, "next month should be later");
        assert!(d3 < d4, "next year should be later");
    }

    #[test]
    fn parse_date_exactly_365_day_difference() {
        // 2026 is not a leap year; 2025-01-01 to 2026-01-01 = 365 days.
        let d_start = parse_date("2025-01-01").unwrap();
        let d_end = parse_date("2026-01-01").unwrap();
        assert_eq!(d_end - d_start, 365, "365 days in a non-leap year");
    }

    // ── is_stale ─────────────────────────────────────────────────────────────

    #[test]
    fn item_older_than_threshold_is_stale() {
        // today = 2026-06-15 (day N), item created 2025-01-01 (> 90 days ago)
        let today = parse_date("2026-06-15").unwrap();
        let item = make_backlog_item("old", Some("2025-01-01"), None);
        assert!(is_stale(&item, 90, today));
    }

    #[test]
    fn item_newer_than_threshold_is_not_stale() {
        let today = parse_date("2026-06-15").unwrap();
        // created yesterday
        let item = make_backlog_item("fresh", Some("2026-06-14"), None);
        assert!(!is_stale(&item, 90, today));
    }

    #[test]
    fn item_exactly_at_threshold_is_not_stale() {
        // "more than N days" — exact boundary is not stale.
        let today = parse_date("2026-04-15").unwrap();
        // 90 days before 2026-04-15 is 2026-01-15
        let item = make_backlog_item("boundary", Some("2026-01-15"), None);
        let diff = today - parse_date("2026-01-15").unwrap();
        // diff must equal exactly the threshold for this to be the boundary case.
        assert_eq!(diff, 90);
        // Not stale: "more than" 90, not "90 or more".
        assert!(!is_stale(&item, 90, today));
    }

    #[test]
    fn item_one_day_past_threshold_is_stale() {
        let today = parse_date("2026-04-16").unwrap();
        // 91 days before 2026-04-16 is 2026-01-15
        let item = make_backlog_item("just-over", Some("2026-01-15"), None);
        let diff = today - parse_date("2026-01-15").unwrap();
        assert_eq!(diff, 91);
        assert!(is_stale(&item, 90, today));
    }

    #[test]
    fn updated_takes_precedence_over_created() {
        // created is old, updated is recent → not stale
        let today = parse_date("2026-06-15").unwrap();
        let item = make_backlog_item("updated-recently", Some("2020-01-01"), Some("2026-06-14"));
        assert!(!is_stale(&item, 90, today));
    }

    #[test]
    fn updated_old_created_recent_is_judged_by_updated() {
        // updated is the deciding date; if updated is old, stale regardless of created.
        let today = parse_date("2026-06-15").unwrap();
        let item = make_backlog_item("stale-updated", Some("2026-06-14"), Some("2020-01-01"));
        assert!(is_stale(&item, 90, today));
    }

    #[test]
    fn dateless_item_is_stale() {
        // Both created and updated are None → treated as infinitely stale.
        let today = parse_date("2026-06-15").unwrap();
        let item = make_backlog_item("dateless", None, None);
        assert!(is_stale(&item, 90, today));
    }

    // ── apply_stale ───────────────────────────────────────────────────────────

    #[test]
    fn apply_stale_excludes_non_backlog_items() {
        let today = parse_date("2026-06-15").unwrap();
        let active = make_active_item("active-old", Some("2020-01-01"));
        let backlog_old = make_backlog_item("backlog-old", Some("2020-01-01"), None);

        let items: Vec<&Item> = vec![&active, &backlog_old];
        let stale = apply_stale(items, 90, today);

        let ids: Vec<&str> = stale.iter().map(|i| i.id.as_str()).collect();
        assert!(!ids.contains(&"active-old"), "active items must be excluded");
        assert!(ids.contains(&"backlog-old"), "old backlog item must be included");
    }

    #[test]
    fn apply_stale_excludes_fresh_backlog_items() {
        let today = parse_date("2026-06-15").unwrap();
        let fresh = make_backlog_item("fresh", Some("2026-06-14"), None);
        let old = make_backlog_item("old", Some("2020-01-01"), None);

        let items: Vec<&Item> = vec![&fresh, &old];
        let stale = apply_stale(items, 90, today);

        let ids: Vec<&str> = stale.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"old"));
        assert!(!ids.contains(&"fresh"));
    }

    #[test]
    fn apply_stale_includes_dateless_backlog_item() {
        let today = parse_date("2026-06-15").unwrap();
        let dateless = make_backlog_item("dateless", None, None);
        let items: Vec<&Item> = vec![&dateless];
        let stale = apply_stale(items, 90, today);
        assert_eq!(stale.len(), 1);
    }

    // ── today_as_days ─────────────────────────────────────────────────────────

    #[test]
    fn today_as_days_returns_plausible_value() {
        // Sanity check: today should be after 2020-01-01 and before 2100-01-01.
        let today = today_as_days();
        let lower = parse_date("2020-01-01").unwrap();
        let upper = parse_date("2100-01-01").unwrap();
        assert!(
            today >= lower,
            "today ({today}) should be after 2020-01-01 ({lower})"
        );
        assert!(
            today < upper,
            "today ({today}) should be before 2100-01-01 ({upper})"
        );
    }
}
