# Rebuild podcast-ceo/index.html = index.v20.bak (podcast tab) + Rise Voice tab parts in rv/
# RV=False publishes the podcast page alone (Rise Voice tab shown disabled, as before it was built)
import os
RV=True
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
s=open('index.v20.bak').read()
# v19: Podcast sub-tabs, Team management, episode modal (ep/)
MODAL=['ep/m1_core.js','ep/m2_overview.js','ep/m3_clips.js','ep/m4_release.js','ep/m5_testing.js','ep/m6_save.js','ep/clipagg.js','ep/main.js','ep/m8_drops.js','ep/m9_files.js','ep/m10_owners.js','ep/m7_todo.js','ep/m11_perf.js']
FONT='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap">'
def ep_parts(s):
    s=s.replace('</style>',open('ep/ep.css').read()+open('ep/modal.css').read()+open('ep/main.css').read()+'</style>',1)
    assert s.count(FONT)==1
    s=s.replace(FONT,FONT+'\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">')
    js='\n'.join(open(f).read() for f in ['ep/spec.js','ep/ep.js']+MODAL)
    return s.rstrip()+'\n<script>\n(()=>{\n'+js+'\n})();\n</script>\n'
import json,re
def team_page(s):
    """The team's copy: Podcast tab only. No Rise Voice, no Home, no Team management, none of Kash's own notes."""
    def r1(a,b):
        assert s.count(a)==1,a[:80]
        return s.replace(a,b)
    s=r1('ReLearn · CEO view</div>','ReLearn · Podcast</div>')
    a=s.index('<nav class="tabs"');b=s.index('</nav>',a)+6
    s=s[:a]+'<nav class="tabs" role="tablist" aria-label="Dashboard tabs" hidden><button class="tab" role="tab" aria-selected="true" data-tab="podcast">Podcast</button></nav>'+s[b:]
    a=s.index('<div id="v-home" hidden>');b=s.index('<div id="v-podcast">',a)
    s=s[:a]+'<div id="v-home" hidden><div id="homeLine"></div></div>\n\n  '+s[b:]
    a=s.index('\nconst TEAM=[');b=s.index('\n];',a)+3
    s=s[:a]+'\nconst TEAM=[];'+s[b:]
    a=s.index('\nconst SNAP=')+len('\nconst SNAP=');snap,end=json.JSONDecoder().raw_decode(s[a:])
    snap['reviews']=[];s=s[:a]+json.dumps(snap,separators=(',',':'))+s[a+end:]
    s,n=re.subn(r'\byou:\[(?:"(?:[^"\\]|\\.)*"\s*,?\s*)*\]','you:[]',s)
    assert n>5,n
    s=r1('showTab(location.hash==="#home"?"home":"podcast");','showTab("podcast");')
    s=r1('if(location.hash==="#team")showTab("team");','')
    return s
if not RV:
    s=ep_parts(s)
    open('podcast-ceo/index.html','w').write(s)
    print('built without Rise Voice',len(s))
    raise SystemExit
open('podcast-ceo/team.html','w').write(team_page(ep_parts(s)))
css=open('rv/rv.css').read()+open('rv/requests.css').read();html=open('rv/rv.html').read();js=open('rv/rv.js').read()
# Requests from Team (Karen, 13 Nov): its own tab after Project Management, on Kash's page only (never the team page)
REQ=('<div id="v-requests" hidden>\n'
     '    <section id="rq" class="rq">\n'
     '      <div class="sh"><h2>Requests from Team</h2><span class="r rq-r"><span class="rq-count" id="rqCount"></span>'
     '<label class="rq-donelab" id="rqDoneLab" hidden><input type="checkbox" id="rqDone"> Show done</label></span></div>\n'
     '      <div class="rq-msg" id="rqMsg" role="status" aria-live="polite" tabindex="-1"></div>\n'
     '      <div id="rqList"></div>\n'
     '    </section>\n  </div>')
rep=[
('<button class="tab" role="tab" aria-selected="false" data-tab="team">Team management</button>','<button class="tab" role="tab" aria-selected="false" data-tab="team">Team management</button>\n    <button class="tab" role="tab" aria-selected="false" data-tab="pm">Project Management</button>'),
('<div class="team" id="teamcols"></div>','<div class="tbsec pod"><div class="tbh"><span class="tbdot" aria-hidden="true"></span><div><h3>Podcast</h3><p>ReLearn podcast team · scores from the Monday review</p></div></div><div class="team" id="teamcols"></div></div><div class="tbsec rvs"><div class="tbh"><span class="tbdot" aria-hidden="true"></span><div><h3>Rise Voice</h3><p>Management team and strategists · grouped by Kash</p></div></div><div id="rvTeamBrief"><p class="pm">Loading Rise Voice…</p></div></div>'),
('    <button class="tab" role="tab" disabled>Finance</button>\n',''),
('</style>',css+'</style>'),
('<button class="refresh" id="refreshBtn" type="button">Refresh</button>','<span class="asof" id="rvAsof" hidden></span><button class="refresh" id="refreshBtn" type="button">Refresh</button>'),
('<button class="tab" role="tab" disabled>Rise Voice</button>','<button class="tab" role="tab" aria-selected="false" data-tab="risevoice">Rise Voice</button>'),
('<div class="hubrow ghost"><b>Rise Voice</b><div>Next tab</div><span></span></div>','<div class="hubrow"><b>Rise Voice</b><div id="rvHomeLine">Loading…</div><button class="linkbtn" type="button" data-tab="risevoice">Open →</button></div>'),
('  </div>\n</div>\n\n<div class="scrim"','  </div>\n'+html+'</div>\n\n<div class="scrim"'),
('$("v-home").hidden=t!=="home";$("v-podcast").hidden=t!=="podcast"}','$("v-home").hidden=t!=="home";$("v-podcast").hidden=t!=="podcast";$("v-risevoice").hidden=t!=="risevoice";$("asof").hidden=t==="risevoice";$("rvAsof").hidden=t!=="risevoice"}'),
('showTab(location.hash==="#home"?"home":"podcast");','showTab(location.hash==="#home"?"home":location.hash==="#risevoice"?"risevoice":"podcast");'),
('peekKind==="works"?worksHTML():"";','peekKind==="works"?worksHTML():/^rv/.test(peekKind||"")?rvPeekHTML(peekKind,peekId):"";'),
('cp.textContent="Selected. Press copy"})};\n}','cp.textContent="Selected. Press copy"})};\n  if(/^rv/.test(peekKind||""))rvWire();\n}'),
('peekKind=null;openBrief=null;strip();if(lastFocus)lastFocus.focus()}','peekKind=null;openBrief=null;strip();rvClosed();if(lastFocus)lastFocus.focus()}'),
('u.then(f=>{SAMPLE=f;if(peekKind==="works")renderPeek()})','u.then(f=>{SAMPLE=f;if(peekKind==="works"||peekKind==="rvask")renderPeek()})'),
# Sales tab (Sales chat, v1, 3 Nov): CEO view only, never the team page. Pieces in rv/sales/.
('<button class="tab" role="tab" disabled>Sales</button>','<button class="tab" role="tab" aria-selected="false" data-tab="leads">Leads</button>\n    <button class="tab" role="tab" aria-selected="false" data-tab="sales">Sales</button>'),
('<div id="v-pm" hidden>','<div id="v-leads" hidden></div>\n  '+open('rv/sales/block.html').read().strip()+'\n  <div id="v-pm" hidden>'),
# Requests from Team tab (Karen, 13 Nov): after Project Management
('<button class="tab" role="tab" aria-selected="false" data-tab="pm">Project Management</button>','<button class="tab" role="tab" aria-selected="false" data-tab="pm">Project Management</button>\n    <button class="tab" role="tab" aria-selected="false" data-tab="requests">Requests from Team</button>'),
('<div id="v-pm" hidden>',REQ+'\n  <div id="v-pm" hidden>'),
]
for a,b in rep:
    assert s.count(a)==1,a[:80]
    s=s.replace(a,b)
s=s.rstrip()+'\n'+js+'\n'+open('rv/pm.js').read()+'\n'+open('rv/requests.js').read()
s=ep_parts(s)
# Sales last, as in the published v37: its script wraps showTab after every other part has
# Leads tab (Karen, 12 Nov): its script runs inside the Sales script (same data and helpers), just before that script's last line
sj=open('rv/sales/sales.js').read().strip();LAST='if(location.hash==="#sales")showTab("sales");\n})();'
assert sj.count(LAST)==1;sj=sj.replace(LAST,'/* ---------- Leads tab (rv/sales/leads.js) ---------- */\n'+open('rv/sales/leads.js').read().strip()+'\n'+LAST)
s=s.rstrip()+'\n'+open('rv/sales/sales.css').read().strip()+'\n'+open('rv/sales/leads.css').read().strip()+'\n'+sj+'\n'
# Karen, 10 Nov: reopen the tab Kash was last on (after Sales, so every part's showTab runs)
s=s.rstrip()+'\n'+open('rv/lasttab.js').read().strip()+'\n'
open('podcast-ceo/index.html','w').write(s)
print('built',len(s))
