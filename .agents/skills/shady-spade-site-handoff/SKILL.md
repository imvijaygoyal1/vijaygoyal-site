---
name: shady-spade-site-handoff
description: Resume, audit, or hand off work on the vijaygoyal.org site using the latest checkpoint, verified tests, and deployment state.
---

# Shady Spade Site Handoff

Use this skill when another agent needs to continue work on the Vijay Goyal site or when the user asks for a progress/handoff update.

## Resume

1. Read `/Users/vijaygoyal/APP_STATE.md` and use the `vijaygoyal-site` entry as the source of truth for the last handoff.
2. Work from `/Users/vijaygoyal/vijaygoyal-site`; inspect `git status --short --branch` and the latest commit before editing.
3. Read the relevant source and any BMAD spec under `_bmad-output/implementation-artifacts/`. If the user asks for BMAD, use the project-local BMAD installation under `_bmad/` and `.agents/skills/`.

## Site-specific invariants

- The production site is `https://vijaygoyal.org` and is deployed with the configured project-local Wrangler command `npm run deploy`.
- The site uses a screen-only iPhone presentation and a screen-only Apple Watch companion; do not reintroduce phone hardware/model assets unless the user explicitly requests it.
- The Shady Spade Watch chapter ID is `shady-spade` (with a hyphen). Keep this exact identifier aligned with `src/chapters/registry.ts`.
- Visual WebGL changes require rendered-frame inspection. DOM tests alone do not establish that a canvas object is visible.

## Verification

Before handoff or deployment, run:

```text
npm test -- --run
npm run build
npm run e2e
```

For visual changes, inspect the Shady Spade frame in a production preview or live browser viewport. After deployment, verify `https://vijaygoyal.org` returns HTTP 200 and inspect the live frame again when the change is visual.

Report failed checks and unresolved caveats separately from completed work. Never include credentials or tokens in the checkpoint.

## Handoff update

Update the single global checkpoint with the app-state-checkpoint skill/script. Record the repository path, branch/upstream, latest commit, working-tree state, completed work, exact verification results, deployment URL/version only if non-secret, known caveats, and the next recommended command or action.
