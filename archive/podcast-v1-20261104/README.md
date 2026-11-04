# Podcast tab as it was on 4 Nov 2026 (before the "Performance only" simplification)

Source of both live pages on 4 Nov 2026:
- Kash's link, installed version `20261104T150833` (sha256 `5ec765a0…`)
- Team link, installed version `team-20261104T061152` (sha256 `d9fca979…`)

Rebuilding from this folder reproduces both pages byte for byte:

```sh
python3 rv/build.py     # podcast-ceo/index.html (Kash) and podcast-ceo/team.html (team)
python3 buildhosted.py  # hosted.html and hosted_team.html, the pages n8n serves
```

(`mkdir podcast-ceo` first.) The n8n workflow "ReLearn CEO dashboard (hosted page)" (`od6n3mA59w9sYlVa`) was at
published version `de8816d7` at the time. Why this was archived: see `/CLAUDE.md`.
