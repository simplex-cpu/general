# The Finance tab as a page of its own, for Karen to click through before it goes on Kash's link (Karen, 24 Nov 2026).
# Same CSS and script as the real tab (rv/finance.css, rv/finance.js) inside the dashboard's frame; the data is a snapshot.
#   python3 rv/finance_mockup.py <fin_data.json> <out.html>
# The data file holds revenue and client names: keep it and the page out of the repo.
import os, sys, json
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
data_path, out = sys.argv[1], sys.argv[2]
base = open('index.v20.bak').read()
a = base.index('<style>') + 7; b = base.index('</style>', a)
css = base[a:b] + open('rv/finance.css').read()
D = json.load(open(data_path))
TABS = [('home', '🏠', 'Home'), ('podcast', '🎙️', 'Podcast'), ('risevoice', '🚀', 'Rise Voice'), ('leads', '🎯', 'Leads'), ('sales', '🤝', 'Sales'),
        ('finance', '💷', 'Finance'), ('team', '👥', 'Team coaching'), ('pm', '📋', 'Projects'), ('requests', '📥', 'Inbox'), ('vip', '⭐', 'VIP onboarding')]
tabs = ''.join(f'<button class="tab" role="tab" data-tab="{t}" aria-selected="{"true" if t == "finance" else "false"}"'
               + ('' if t == 'finance' else ' aria-disabled="true" title="Not part of this mockup"')
               + f'><span class="temo" aria-hidden="true">{e}</span>{n}</button>' for t, e, n in TABS)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Finance tab mockup</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap">
<style>{css}
[hidden]{{display:none!important}}
.tab .temo{{margin-right:6px}}
.tab[aria-disabled="true"]{{cursor:default;opacity:.5}}
.mock{{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px;color:var(--watch);background:var(--watch-soft);border-radius:10px;padding:8px 12px;margin:0 0 14px}}
.mock b{{font-weight:700}}
</style>
</head>
<body>
<div class="wrap">
  <div class="mock" role="note"><b>Mockup</b><span>The Finance tab for Kash's link, with real numbers as of {int(D["at"][8:10])} Nov {D["at"][:4]}. Click anything; nothing here is live or saved.</span></div>
  <div class="top"><div class="brand"><span class="onair" aria-hidden="true"></span>ReLearn · CEO view</div><span class="topr"></span></div>
  <nav class="tabs" role="tablist" aria-label="Dashboard tabs">{tabs}</nav>
  <div id="v-finance" hidden><section class="fin"><h2 class="fx-vh">Finance</h2><div id="finBody"></div></section></div>
</div>
<script>function showTab(t){{document.querySelectorAll(".tab[data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===t)))}}</script>
<script>window.FIN_DATA={json.dumps(D, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")}</script>
{open("rv/finance.js").read()}
<script>showTab("finance")</script>
</body>
</html>
'''
open(out, 'w').write(page)
print('mockup', out, len(page))
