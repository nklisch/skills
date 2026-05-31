//! Actionable / dependency-view post-filter.
//!
//! This module is a STUB for the adapter item (epic-substrate-cli-adapter).
//! `epic-substrate-cli-next-actionable` replaces it with the full stage-aware
//! predicate + `Ready`/`Blocked` logic.

use work_view_core::index::Substrate;
use work_view_core::model::Item;

use crate::args::DependencyView;

/// Post-filter over `query()` results; preserves input (load) order.
///
/// Currently only `All` is exercised (adapter stub).  `next-actionable`
/// adds `Ready` and `Blocked`.
pub fn apply_dependency_view<'a>(
    _sub: &Substrate,
    items: Vec<&'a Item>,
    view: DependencyView,
) -> Vec<&'a Item> {
    match view {
        DependencyView::All => items,
        // next-actionable fills these in; unreachable via parse_args today
        // because DependencyView::Ready/Blocked are only set by --ready/--blocked
        // which exist in parse_args but produce the stub path here.
        DependencyView::Ready | DependencyView::Blocked => items,
    }
}
