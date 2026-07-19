---
source_handle: git-auth-exec-vscode-devcontainers
fetched: 2026-07-10
source_url: https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Visual Studio Code Dev Containers documents two mechanisms for using host Git authentication inside a container. For HTTPS, a host-configured credential helper is reused from within the container, bidirectionally. For SSH, the extension forwards the host SSH agent. The extension also copies the host `.gitconfig` into the container at startup. The page presents these as developer-convenience features and does not claim that credentials are hidden from arbitrary container processes or restricted by repository, endpoint, ref, or operation.

## Key passages

1. The Dev Containers extension supports using local Git credentials from inside a container.
   - *Source anchor: page introduction.*
2. The extension automatically copies the local `.gitconfig` into the container at startup.
   - *Source anchor: introductory setup paragraph before `Using a credential helper`.*
3. With an HTTPS credential helper configured on the host, credentials entered locally are reused in the container and vice versa without additional setup.
   - *Source anchor: `Using a credential helper`.*
4. For SSH, the extension automatically forwards the local SSH agent when one is running.
   - *Source anchor: `Using SSH keys`.*

## Structural metadata

- **Publisher:** Microsoft
- **Product:** Visual Studio Code Dev Containers
- **Document:** Sharing Git credentials with your container
- **Source class:** public product documentation
- **Stated audience:** interactive developer container users
