---
source_handle: git-auth-policy-codex-internet-access
fetched: 2026-07-10
source_url: https://developers.openai.com/codex/cloud/internet-access
provenance: source-direct
substrate_confidence: source-direct
---

# Codex cloud: Agent internet access

## Summary

Codex cloud blocks internet access during the agent phase by default and permits per-environment enablement with domain and HTTP-method restrictions. OpenAI explicitly identifies prompt injection, code/secret exfiltration, malware, vulnerable dependencies, and licensing risks, and recommends minimal domains/methods plus review of output and work logs.

## Key passages

1. **Agent internet access.** Agent-phase internet is blocked by default; setup scripts retain internet access for dependency installation.
2. **Configuration.** Internet can be fully off or on with a domain allowlist and allowed HTTP methods.
3. **Risks of agent internet access.** Listed risks include prompt injection from untrusted web content, code or secret exfiltration, malware or vulnerable dependencies, and license-restricted content.
4. **Risks of agent internet access.** The mitigation guidance is to allow only necessary domains and HTTP methods and review agent output and work logs.
5. **Prompt-injection example.** An issue body can include an instruction that pipes `git show HEAD` into `curl`, demonstrating that allowing a trusted hosting domain alone does not make fetched content trustworthy.
