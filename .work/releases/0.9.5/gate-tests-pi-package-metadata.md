---
id: gate-tests-pi-package-metadata
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi package metadata coverage

## Priority
Critical

## Spec reference
Item: `epic-three-channel-distribution-package-metadata-pi-manifests`
Acceptance criterion: each supported plugin has a Pi package manifest with the
expected package name, version, `pi-package` keyword, and `pi.skills: ["./skills"]`.

## Gap type
missing test for valid partition

## Suggested test
Add a metadata test that reads the real supported plugin `package.json` files,
asserts package name/version/keywords/Pi skills, and asserts deprecated
`plugins/workflow/package.json` is absent.

## Test location
`plugins/agile-workflow/scripts/tests/pi-package-metadata.test.sh`

## Implementation notes
- Files changed: `plugins/agile-workflow/scripts/tests/pi-package-metadata.test.sh`, `.github/workflows/build-work-view.yml`
- Tests added: Pi package metadata shell guard for supported plugin package manifests.
- Discrepancies from design: none.
- Adjacent issues parked: none.
