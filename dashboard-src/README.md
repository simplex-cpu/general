# Dashboard source as live from 5 Nov 2026 (Podcast = Performance only)

Builds both pages that n8n serves:
- Kash's link: version `20261105T145547` (sha256 `b52903a8…`)
- Team link: version `team-20261105T145550` (sha256 `6a692d8a…`)

```sh
mkdir -p podcast-ceo
python3 rv/build.py      # podcast-ceo/index.html (Kash) + podcast-ceo/team.html (team)
python3 buildhosted.py   # hosted.html + hosted_team.html, the pages n8n serves
./install.sh             # Kash's link   (needs install_token.txt, never committed)
./install.sh team        # team link
```

`ep/m11_perf.js` holds the one switch `PODCAST_FULL` (false now): the Podcast tab shows only Performance and an
episode opens a clips-only window from the IG inbox (`/ep?only=inbox`). Set it to true to bring back the full,
archived Podcast tab (see `/archive/podcast-v1-20261104`). Why: see `/CLAUDE.md`.

The Sales blocks in `rv/sales/` are copied verbatim from the Sales chat's install `20261104T150833` (Sales v4.2).
