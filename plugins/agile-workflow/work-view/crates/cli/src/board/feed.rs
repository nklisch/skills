//! JSON substrate feed for the local board host.

use std::fmt;
use std::path::Path;

use serde::Serialize;
use work_view_core::error::LoadError;
use work_view_core::index::{Diagnostic, LoadReport, Substrate};
use work_view_core::model::{Item, Tier};

use crate::actionable::dependency_status;
use crate::args::WORK_VIEW_VERSION;

#[derive(Debug)]
pub(crate) enum FeedError {
    Load(LoadError),
    Json(serde_json::Error),
}

impl fmt::Display for FeedError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FeedError::Load(e) => write!(f, "could not load substrate: {e}"),
            FeedError::Json(e) => write!(f, "could not serialize substrate feed: {e}"),
        }
    }
}

#[derive(Serialize)]
struct FeedSnapshot {
    work_view_version: &'static str,
    project: String,
    root_rel: &'static str,
    items: Vec<FeedItem>,
    diagnostics: FeedDiagnostics,
}

#[derive(Serialize)]
struct FeedItem {
    id: String,
    kind: Option<String>,
    stage: Option<String>,
    tags: Vec<String>,
    parent: Option<String>,
    depends_on: Vec<String>,
    release_binding: Option<String>,
    gate_origin: Option<String>,
    research_origin: Option<String>,
    scan_origin: Option<String>,
    research_refs: Vec<String>,
    created: Option<String>,
    updated: Option<String>,
    tier: &'static str,
    rel_path: String,
    body: String,
    is_terminal: bool,
    ready: bool,
    blocked: bool,
    unmet_deps: Vec<String>,
    dependents: Vec<String>,
    children: Vec<String>,
}

#[derive(Serialize)]
struct FeedDiagnostics {
    parse_errors: Vec<ParseDiagnostic>,
    validation_warnings: Vec<ItemDiagnostic>,
    duplicate_ids: Vec<ItemDiagnostic>,
}

#[derive(Serialize)]
struct ParseDiagnostic {
    rel_path: String,
    reason: String,
}

#[derive(Serialize)]
struct ItemDiagnostic {
    rel_path: String,
    tier: &'static str,
    id: Option<String>,
    field: Option<String>,
    reason: String,
}

pub(crate) fn build_feed(root: &Path) -> Result<String, FeedError> {
    let (sub, report) = Substrate::load(root).map_err(FeedError::Load)?;
    let snapshot = FeedSnapshot {
        work_view_version: WORK_VIEW_VERSION,
        project: project_name(root),
        root_rel: ".",
        items: sub
            .items()
            .iter()
            .map(|item| feed_item(&sub, item))
            .collect(),
        diagnostics: feed_diagnostics(root, report),
    };

    serde_json::to_string(&snapshot).map_err(FeedError::Json)
}

fn feed_item(sub: &Substrate, item: &Item) -> FeedItem {
    let (ready, blocked) = dependency_status(sub, item);
    FeedItem {
        id: item.id.clone(),
        kind: item.kind.clone(),
        stage: item.stage.clone(),
        tags: item.tags.clone(),
        parent: item.parent.clone(),
        depends_on: item.depends_on.clone(),
        release_binding: item.release_binding.clone(),
        gate_origin: item.gate_origin.clone(),
        research_origin: item.research_origin.clone(),
        scan_origin: item.scan_origin.clone(),
        research_refs: item.research_refs.clone(),
        created: item.created.clone(),
        updated: item.updated.clone(),
        tier: tier_name(item.tier),
        rel_path: path_string(&item.rel_path),
        body: item.body.clone(),
        is_terminal: item.is_terminal(),
        ready,
        blocked,
        unmet_deps: sub
            .unmet_deps(item)
            .into_iter()
            .map(str::to_string)
            .collect(),
        dependents: sub
            .dependents_of(&item.id)
            .into_iter()
            .map(|dependent| dependent.id.clone())
            .collect(),
        children: sub
            .children_of(&item.id)
            .into_iter()
            .map(|child| child.id.clone())
            .collect(),
    }
}

fn feed_diagnostics(root: &Path, report: LoadReport) -> FeedDiagnostics {
    FeedDiagnostics {
        parse_errors: report
            .parse_errors
            .into_iter()
            .map(|error| ParseDiagnostic {
                rel_path: rel_path(root, &error.path),
                reason: error.reason,
            })
            .collect(),
        validation_warnings: report
            .validation_warnings
            .into_iter()
            .map(|diagnostic| item_diagnostic(root, diagnostic))
            .collect(),
        duplicate_ids: report
            .duplicate_ids
            .into_iter()
            .map(|diagnostic| item_diagnostic(root, diagnostic))
            .collect(),
    }
}

fn item_diagnostic(root: &Path, diagnostic: Diagnostic) -> ItemDiagnostic {
    ItemDiagnostic {
        rel_path: rel_path(root, &diagnostic.path),
        tier: tier_name(diagnostic.tier),
        id: diagnostic.id,
        field: diagnostic.field,
        reason: diagnostic.reason,
    }
}

fn rel_path(root: &Path, path: &Path) -> String {
    match path.strip_prefix(root) {
        Ok(path) => path_string(path),
        Err(_) => path_string(path),
    }
}

fn path_string(path: &Path) -> String {
    path.components()
        .map(|component| component.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

fn tier_name(tier: Tier) -> &'static str {
    match tier {
        Tier::Active => "active",
        Tier::Backlog => "backlog",
        Tier::Releases => "releases",
        Tier::Archive => "archive",
    }
}

fn project_name(root: &Path) -> String {
    root.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "substrate".to_string())
}
