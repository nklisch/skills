# Skills Repo

This repo contains agent skills distributed via skilltap. Skills are defined as tap entries in `tap.json` and stored in `.agents/skills/<skill-name>/`.

## Important

- All skills MUST be placed in `.agents/skills/<skill-name>/`, not at the repo root. Skilltap resolves skills from `.agents/skills/` and will fail to find skills placed elsewhere.
