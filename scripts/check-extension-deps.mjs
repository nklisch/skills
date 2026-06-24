#!/usr/bin/env node
// Guard: every external package imported by a pi extension under
// plugins/*/extensions/ must be declared in the root package.json
// "dependencies". Pi installs npm deps from the root manifest only — it does
// NOT crawl per-plugin package.json files — so an undeclared import resolves at
// install time to "Cannot find module" and takes the whole extension down.
//
// Exit 0 when every import is covered; exit 1 and list the gaps otherwise.

import { readFileSync, readdirSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const builtins = new Set(builtinModules);

// Reduce a module specifier to its installable package name:
//   "@scope/name/sub/path.js" -> "@scope/name"
//   "pkg/sub" -> "pkg"
function packageName(spec) {
  const parts = spec.split("/");
  if (spec.startsWith("@")) return parts.slice(0, 2).join("/");
  return parts[0];
}

function isExternal(spec) {
  if (spec.startsWith(".") || spec.startsWith("/")) return false; // relative/absolute
  if (spec.startsWith("node:")) return false;
  if (builtins.has(packageName(spec))) return false; // bare node builtin
  return true;
}

// Match the module specifier in `from "x"`, `import "x"`, `require("x")`,
// and dynamic `import("x")`.
const SPEC_RE =
  /(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g;

function extensionFiles() {
  const out = [];
  const pluginsDir = join(repoRoot, "plugins");
  for (const plugin of readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!plugin.isDirectory()) continue;
    const extDir = join(pluginsDir, plugin.name, "extensions");
    let entries;
    try {
      entries = readdirSync(extDir, { withFileTypes: true });
    } catch {
      continue; // plugin has no extensions
    }
    for (const e of entries) {
      // Skip test files — their dev-only imports aren't shipped/run by pi.
      if (e.isFile() && e.name.endsWith(".ts") && !e.name.includes(".test.")) {
        out.push(join(extDir, e.name));
      }
    }
  }
  return out;
}

const declared = new Set(
  Object.keys(
    JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
      .dependencies ?? {},
  ),
);

// package -> sorted list of files that import it
const imported = new Map();
for (const file of extensionFiles()) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(SPEC_RE)) {
    const spec = m[1];
    if (!isExternal(spec)) continue;
    const pkg = packageName(spec);
    if (!imported.has(pkg)) imported.set(pkg, new Set());
    imported.get(pkg).add(file.slice(repoRoot.length + 1));
  }
}

const missing = [...imported.keys()].filter((p) => !declared.has(p)).sort();

if (missing.length === 0) {
  console.log(
    `OK: all ${imported.size} external extension imports are declared in root package.json dependencies.`,
  );
  process.exit(0);
}

console.error("Missing from root package.json \"dependencies\":\n");
for (const pkg of missing) {
  console.error(`  ${pkg}`);
  for (const f of [...imported.get(pkg)].sort()) console.error(`      imported by ${f}`);
}
console.error(
  "\nPi installs npm deps from the root manifest only. Add the package(s) above to" +
    "\nthe root package.json \"dependencies\" (mirroring the per-plugin package.json),\nthen run npm install.",
);
process.exit(1);
