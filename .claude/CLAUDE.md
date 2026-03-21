# Skills Repo

This repo contains agent skills distributed via skilltap. Skills are defined as tap entries in `tap.json` and stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Important

- Workflow plugin skills live in `plugins/workflow/skills/<skill-name>/`.
- Skill authoring plugin skills live in `plugins/skill-authoring/skills/<skill-name>/`.
- Reference and principle skills live in `.agents/skills/<skill-name>/`.
- Skilltap resolves from `plugins/*/skills/`, `.agents/skills/`, and `skills/`.
