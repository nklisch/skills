---
source_handle: git-auth-cred-vscode-devcontainers
fetched: 2026-07-10
source_url: https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials
provenance: source-direct
substrate_confidence: source-direct
---

# VS Code Dev Containers Git credential sharing

## Summary

Microsoft documents two host-to-container Git authentication patterns in Dev Containers. For HTTPS, a host credential helper is reused from inside the container, with credentials usable in both directions. For SSH, the extension forwards a running local SSH agent rather than instructing the user to copy private key files. The extension also copies the host `.gitconfig` into the container at startup.

## Key passages

{1} The page says Dev Containers supports using local Git credentials from inside a container without additional setup.

{2} The extension automatically copies the local `.gitconfig` into the container at startup.

{3} Under “Using a credential helper,” an HTTPS credential helper configured on the local operating system is reused inside the container, and credentials entered locally are reused in the container and vice versa. The phrase “credential helper configured” links to GitHub’s credential-caching documentation at `https://docs.github.com/get-started/getting-started-with-git/caching-your-github-credentials-in-git`.

{4} Under “Using SSH keys,” the extension automatically forwards the local SSH agent when one is running.

{5} The setup instructions add private keys to the host agent with `ssh-add`; they do not instruct copying those private key files into the container.

{6} The page points readers to Dev Containers “known limitations” at `https://code.visualstudio.com/docs/devcontainers/containers#_known-limitations` for issues with these mechanisms.

## Structural metadata

- Publisher: Microsoft
- Artifact type: public VS Code product documentation
- Subject: host credential-helper reuse and SSH-agent forwarding into containers
