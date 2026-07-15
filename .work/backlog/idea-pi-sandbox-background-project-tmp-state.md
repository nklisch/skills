---
id: idea-pi-sandbox-background-project-tmp-state
created: 2026-07-14
updated: 2026-07-14
tags: [bug, sandbox, background-tasks]
---

The live v0.1.0 review-fix session could run ordinary sandboxed `bash`, but both `background` invocations failed before spawning with:

> Sandbox refused to start background command: Sandbox tmpBackend=session-disk requires projectTmpDir (the pinned per-project disk temp dir). The session_start hook must derive and thread it through; never silently fall back to host /tmp.

This occurred from the repository root after the disk-backed temp work had landed and prevented the required detached test runs. Investigate lifecycle/version-skew behavior between the loaded pi-sandbox extension, its exported `sandbox-spawn` helper, and background-tasks' cached bridge. A reload or a session that began before the new session-init state existed may expose `tmpBackend=session-disk` while `getProjectTmpDir()` is still null. The integration must remain fail-closed, but a healthy live session should publish and consume one coherent initialized spawn contract rather than becoming permanently unusable.
