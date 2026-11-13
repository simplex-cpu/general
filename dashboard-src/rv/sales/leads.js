/* ===================== Leads tab (Karen, 12 Nov: the v4 mockup she approved) =====================
   Where Kash's leads come from and where they are now: one row per source, with Kash's own funnel names (4 Nov Ops
   meeting, 6 Nov call), never grouped. View only: nothing on this tab writes anywhere.
   Data: Company Leads come from {page}/leads, a saved copy that n8n refreshes at most every 10 minutes. Jade's Leads, Sarah's
   Upsell list and Kash's board come from the Sales feed this tab shares with Sales. So "Sent to Sales" is exactly the open
   deals on his board, counted by their source tag, and the two tabs always agree.
   The team side of a source (New / In progress / Parked) follows that team's own stage. "Review" in Kash board (Kash gave
   the lead back) counts as In progress. Hot / warm / cold come from the stage: New is cold, In progress is warm, and the
   "talking now" stages (Pre-qual In Conversation, Upsell list Ready) are hot. Built into the Sales script (build.py puts it
   just before the script's last line), so it shares its data and helpers. */
const LD={rows:null,at:"",refreshing:false,loading:false,err:"",open:null,hl:"",tries:0,timer:null,shell:false,lastFocus:null,items:[]};
/* the sources, in the mockup's order (rows are ranked by size; this order breaks ties). k = the standard source name (stdO). */
const LD_SRC=[
  {k:"Old funnels / GHL",name:"Previous databases",owner:"Gretta",sub:"GoHighLevel",ico:"db"},
  {k:"Referrals",name:"Referrals",owner:"Gretta",ico:"ref"},
  {k:"Upsells",name:"Upsells",owner:"Sarah",ico:"up"},
  {k:"Podcast guest",name:"Podcast guests",owner:"Jade",ico:"mic"},
  {k:"Network",name:"Network",owner:"Kash",ico:"net"},
  {k:"IG organic",name:"Instagram",owner:"Gretta",ico:"ig"},
  {k:"Upwork",name:"Upwork",owner:"Danica",ico:"uw"},
  {k:"ReLearn community leads",name:"ReLearn community",owner:"Gretta",ico:"mail"},
  {k:"Episode keyword",name:"Episode keyword",owner:"Gretta",ico:"key"},
  {k:"Kash brand community",name:"Kash brand community",owner:"Gretta",ico:"star"},
  {k:"Events",name:"Events",owner:"Gretta",ico:"ev"},
  {k:"Other",name:"Other",owner:"",ico:"other",onlyIfAny:true}];
const LD_IC={
  db:{c:"#475569",p:"M4 5a8 3 0 1 0 16 0a8 3 0 1 0-16 0M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"},
  ref:{c:"#0D9488",p:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"},
  up:{c:"#059669",p:"M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"},
  mic:{c:"#7C3AED",p:"M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"},
  net:{c:"#4F46E5",p:"M18 2a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM6 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM18 16a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"},
  ig:{c:"#E1306C",p:"M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM17.5 6.5h.01"},
  uw:{raw:'<rect x="2" y="2" width="20" height="20" rx="5" fill="#14A800"/><path d="M6.5 8v3.5a2.6 2.6 0 0 0 5.2 0V8M11.7 10.5c.9 2.4 2.1 3.8 3.6 3.8a2.4 2.4 0 0 0 0-4.8c-1.7 0-2.6 1.9-3.4 4.2L11 17" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'},
  mail:{c:"#0891B2",p:"M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6"},
  key:{c:"#DB2777",p:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM9 7.5l-1 6M13 7.5l-1 6M7.5 9.5h6M7 11.5h6"},
  star:{c:"#CA8A04",p:"M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"},
  ev:{c:"#EA580C",p:"M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4zM13 5v2M13 11v2M13 17v2"},
  other:{c:"#64748B",p:"M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zM8 12h.01M12 12h.01M16 12h.01"}};
const ldIco=(k,s)=>{const o=LD_IC[k]||LD_IC.other;return o.raw?`<svg class="ld-i" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${o.raw}</svg>`
  :`<svg class="ld-i ld-i-${k}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${o.c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${o.p}"/></svg>`};
const LD_I={cold:"M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4",warm:"M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  hot:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",sent:"M5 12h14M13 6l6 6-6 6",chev:"M9 18l6-6-6-6",search:"M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-4.3-4.3",user:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z"};
/* Kash's closed deals: not "with Sales" any more, so not counted */
const LD_DONE=new Set(["Won","Onboarded","Lost","Not worthy"]);
/* each team stage field -> new / ip (in progress) / hot / sent (handed to Sales) / park */
const LD_MAP={
  pq:{"New":"new","First Outreach":"ip","Pre-qual":"ip","In Conversation":"hot","Follow-up":"ip","Email sequence":"park","Podcast Pipeline":"park","Sales Pipeline":"sent","No Reply":"park","Archive":"park"},
  uw:{"New":"new","Proposal Sent":"ip","Sales Pipeline":"sent","Won":"sent","No Reply":"park","Lost":"park","Not Applicable":"park"},
  up:{"New":"new","Build Proposal":"ip","Send Proposal":"ip","Proposal Sent":"ip","Sales Pipeline":"sent","Won":"sent","Lost":"park","Archive":"park"},
  rf:{"Contact info provided by client":"new","First outreach":"ip","Following up":"ip","Call booked":"sent","Post call follow-up":"sent","Offer accepted (Closed)":"sent","Offer declined (Rejected)":"park","No response (Rejected)":"park","Sales Pipeline":"sent"},
  so:{"New":"new","Growth Plan Booking":"park","Sales Pipeline":"sent","Won":"sent","No Reply":"park","Lost":"park","Not Applicable":"park"}};
LD_MAP.ai=LD_MAP.up;LD_MAP.ev=LD_MAP.so;LD_MAP.ep=LD_MAP.so;
/* the stage a Company Leads row is in: the same order of fields the Sales tab uses (kbCl) */
function ldClStage(x){const s=x.s||"";
  if(s==="Upwork"&&x.uw)return ["uw",x.uw];
  if((s==="Upsell"||s==="Old client")&&x.up)return ["up",x.up];
  if(s==="AI consulting"&&x.ai)return ["ai",x.ai];
  if(x.pq)return ["pq",x.pq];
  for(const f of ["uw","up","ai","rf","so","ev","ep"])if(x[f])return [f,x[f]];
  return null}
/* stage names as Kash reads them */
const LD_LBL={"Podcast Pipeline":"Sent to Podcast","Growth Plan Booking":"Sent to Podcast","Sales Pipeline":"Sent to Sales"};
const ldLbl=s=>LD_LBL[s]||String(s||"").replace(/^\d+\s*[–-]\s*/,"");
/* process order of the stage groups inside a source's window */
const LD_ORDER=["New","Contact info provided by client","Lead in","First Outreach","First outreach","Contacted","Pre-qual","Proposal Sent","Build Proposal","Send Proposal","Ready","In Conversation","Following up","Follow-up","In progress","Back from Kash",
  "Audit Booked","Audit Held","Follow-up Call","Sent to Sales","Email sequence","Nurture Sequence","Sent to Podcast","Not now","No Reply","No response (Rejected)","Offer declined (Rejected)","Not a Fit","Unqualified","Lost","Re-approach (60–90 days)","Archive","Not Applicable"];
const ldRank=s=>{const i=LD_ORDER.indexOf(s);return i<0?(KB_STAGES.indexOf(s)>=0?40+KB_STAGES.indexOf(s):99):i};
const ldNum=n=>Number(n||0).toLocaleString("en-GB");
const ldNorm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const ldUl=r=>{const v=r[UL.name];return String(Array.isArray(v)?sv(v[0]):sv(v)||"").trim()};

/* every lead once: Kash's open deals (Sent to Sales), then whatever each team still holds */
function ldItems(){
  const P=derive().P,on=new Set(),out=[];
  P.forEach(p=>{on.add(p.id);if(p.jadeId)on.add(p.jadeId);if(p.rvId)on.add(p.rvId)});
  P.forEach(p=>{if(LD_DONE.has(p.stage))return;out.push({src:p.origin||"Other",col:"sent",hot:false,name:p.name,co:p.co||"",stage:p.stage,where:"On your board"})});
  (S.leads||[]).forEach(r=>{if(on.has(r._id))return;const name=String(r[L.name]||"").trim();if(!name)return;
    const st=sv(r[L.stage]),back=kbNorm(r[KBF.jade])==="Review";
    let col=back?"ip":/^10\b/.test(st)?"ip":/^(79|80)\b/.test(st)?"park":"ip";
    out.push({src:JADE_SRC[sv(r[L.source])]||stdO(sv(r[L.source]))||"Podcast guest",col,hot:false,name,co:r[L.co]||"",stage:back?"Back from Kash":(ldLbl(st)||"Lead in"),where:"Jade's Leads"})});
  (S.ul||[]).forEach(r=>{if(on.has(r._id))return;const name=ldUl(r);if(!name)return;
    const st=String(sv(r[UL.stage])).replace(/^[^A-Za-z]+/,"").trim();const m={"Ready":"hot","In progress":"ip","Not now":"park","Unqualified":"park","Won":"won"}[st]||"new";
    out.push({src:"Upsells",col:m==="hot"?"ip":m,hot:m==="hot",name,co:"",stage:st||"New",where:"Sarah's Upsell list"})});
  (LD.rows||[]).forEach(x=>{if(on.has(x.i))return;const t=ldClStage(x),back=x.k==="Review";
    if(!t&&!(x.k&&KB_TEAM.has(x.k)))return; /* no stage anywhere: in nobody's pipeline */
    let m=back?"ip":t?((LD_MAP[t[0]]||{})[t[1]]||"ip"):({"New":"new","No Reply":"park","Not a Fit":"park","Nurture Sequence":"park","Sent to Podcast":"park"}[x.k]||"ip");
    /* handed to Sales but not on Kash's board (yet): still with the team */
    if(m==="sent")m="ip";
    out.push({src:stdO(x.o)||stdO(x.s)||"Other",col:m==="hot"?"ip":m,hot:m==="hot",name:x.n,co:x.c||"",stage:back?"Back from Kash":ldLbl(t?t[1]:x.k),where:"Company Leads"})});
  return out}
/* per source: counts and the leads, biggest first; sources with nothing logged go last */
function ldAgg(items){
  const A={};LD_SRC.forEach((s,i)=>A[s.k]={s,i,new:0,ip:0,hot:0,sent:0,park:0,won:0,items:[]});
  items.forEach(it=>{const a=A[it.src]||A.Other;a[it.col]=(a[it.col]||0)+1;if(it.hot)a.hot++;a.items.push(it)});
  const all=LD_SRC.map(s=>A[s.k]).map(a=>Object.assign(a,{total:a.new+a.ip+a.sent+a.park}));
  const full=all.filter(a=>a.total||a.won).sort((x,y)=>y.total-x.total||x.i-y.i),empty=all.filter(a=>!a.total&&!a.s.onlyIfAny&&!a.won);
  return {full,empty,all:full.concat(empty)}}

/* ---------- drawing ---------- */
const ldAv=n=>n?`<span class="ld-av">${svg(LD_I.user,12)}</span>${esc(n)}`:"";
function ldAsof(){if(!LD.at)return "";const d=new Date(LD.at);if(isNaN(d))return "";const t=d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  return d.toDateString()===new Date().toDateString()?"Updated "+t:"Updated "+d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})+", "+t}
function ldBarsH(G){
  const F=G.full.filter(a=>a.total),v=F.map(a=>a.total),max=v[0]||1,second=v[1]||0,brk=G.full.length>1&&max>4*second&&second>0;
  const scale=brk?second*1.11:max,part=brk?74:86;
  const rows=F.map((a,i)=>{const b=brk&&i===0,w=b?100:Math.max(.6,a.total/scale*part);
    return `<div class="ld-br"><span class="ld-bl">${ldIco(a.s.ico,15)}${esc(a.s.name)}</span><span class="ld-bt"><i class="ld-bar${b?" brk":""}" style="width:calc(${w}% - ${b?58:0}px)"></i><b>${ldNum(a.total)}</b></span></div>`}).join("");
  const none=G.empty.map(a=>esc(a.s.name)).join(" · ");
  return `<div class="ld-panel ld-bars">${rows||'<p class="pm">No leads yet.</p>'}${none?`<p class="ld-bnote">Nothing logged yet: ${none}</p>`:""}</div>`}
const ldN=(v,cls)=>`<span class="ld-n${v?"":" z"}${cls?" "+cls:""}">${ldNum(v)}</span>`;
const ldSay=a=>`${a.s.name}${a.s.owner?", "+a.s.owner:""}: ${ldNum(a.new)} new, ${ldNum(a.ip)} in progress${a.hot?" ("+a.hot+" hot)":""}, ${ldNum(a.sent)} sent to Sales, ${ldNum(a.park)} parked. Open the list`;
function ldTableH(G){
  const row=a=>{const nm=`<span class="ld-pn">${ldIco(a.s.ico,17)}<span><b>${esc(a.s.name)}</b><small>${ldAv(a.s.owner)}${a.s.sub?`<em class="ld-sub">· ${esc(a.s.sub)}</em>`:""}</small></span></span>`;
    if(!a.total&&!a.won)return `<div class="ld-tr ld-empty">${nm}<span class="ld-none">Nothing logged yet</span></div>`;
    return `<button type="button" class="ld-tr" data-ld="open" data-k="${esc(a.s.k)}" aria-label="${esc(ldSay(a))}">${nm}${ldN(a.new)}<span class="ld-ip">${ldN(a.ip)}${a.hot?`<small class="ld-hot">${svg(LD_I.hot,12)}${a.hot} hot</small>`:""}</span>${ldN(a.sent,"g")}${ldN(a.park,"m")}<span class="ld-chev">${svg(LD_I.chev,17)}</span></button>`};
  return `<div class="ld-panel ld-tbl"><div class="ld-tr ld-th" aria-hidden="true"><span></span><span>New</span><span>In progress</span><span class="ld-sh">${svg(LD_I.sent,13)}Sent to Sales</span><span>Parked</span><span></span></div>${G.all.map(row).join("")}</div>`}
function ldBodyH(){
  if(S.err||(LD.err&&!LD.rows))return `<div class="sl-msg"><b>Couldn't load the leads.</b><br><span class="pm">Press Refresh to try again.</span></div>`;
  if(!S.loaded||!LD.rows)return '<p class="pm ld-wait">Loading leads…</p>';
  LD.items=ldItems();const G=ldAgg(LD.items);LD.G=G;
  const t=G.all.reduce((o,a)=>{o.nw+=a.new;o.ip+=a.ip;o.hot+=a.hot;o.sent+=a.sent;return o},{nw:0,ip:0,hot:0,sent:0});
  const k=(cls,lab,v)=>`<div class="ld-k"><span>${cls?`<i class="ld-ki ${cls}">${svg(LD_I[cls],14)}</i>`:""}${lab}</span><b>${ldNum(v)}</b></div>`;
  return `<div class="ld-kpis">${k("","Leads in play",t.nw+t.ip)}${k("hot","Hot",t.hot)}${k("warm","Warm",t.ip-t.hot)}${k("cold","Cold",t.nw)}${k("sent","Sent to Sales",t.sent)}</div>
  <h3 class="ld-h">Where leads come from</h3>${ldBarsH(G)}
  <h3 class="ld-h">Where they are now</h3>${ldTableH(G)}`}
/* one source's window: its leads under the four standard steps, grouped by their own stage. View only. */
const LD_COLS=[["new","New"],["ip","In progress"],["sent","Sent to Sales"],["park","Parked"],["won","Won"]];
const LD_CAP=60;
function ldDlgH(){
  const a=(LD.G&&LD.G.all||[]).find(x=>x.s.k===LD.open);if(!a)return "";
  const stat=(lab,v,cls,extra)=>`<div class="ld-ms${cls?" "+cls:""}"><span>${lab}</span><b>${ldNum(v)}</b>${extra||""}</div>`;
  const secs=LD_COLS.filter(([c])=>a.items.some(it=>it.col===c)).map(([c,lab])=>{
    const its=a.items.filter(it=>it.col===c),by={};its.forEach(it=>(by[it.stage]=by[it.stage]||[]).push(it));
    const groups=Object.keys(by).sort((x,y)=>ldRank(x)-ldRank(y)||by[y].length-by[x].length).map(st=>{
      const list=by[st].slice().sort((x,y)=>x.name.localeCompare(y.name));const hl=LD.hl&&list.findIndex(it=>it.name===LD.hl);
      /* a long list shows its first names; a searched name is always shown */
      let shown=list.slice(0,LD_CAP);if(hl>=LD_CAP)shown=shown.concat([list[hl]]);const more=list.length-shown.length;
      const hot=list.some(it=>it.hot);
      return `<div class="ld-st"><div class="ld-sth"><b>${esc(st)}</b>${hot?`<span class="ld-sthot">${svg(LD_I.hot,12)}hot</span>`:""}<span class="ld-stn">${ldNum(list.length)}</span></div>
        <ul class="ld-names">${shown.map(it=>`<li${it.name===LD.hl?' class="ld-hl"':""}><span>${esc(it.name)}</span>${it.co&&it.co!==it.name?`<small>${esc(it.co)}</small>`:""}</li>`).join("")}${more>0?`<li class="ld-more">and ${ldNum(more)} more · search to find someone</li>`:""}</ul></div>`}).join("");
    return `<section class="ld-sec ld-sec-${c}"><h3>${c==="sent"?svg(LD_I.sent,14):""}${lab}<span>${ldNum(its.length)}</span></h3>${groups}</section>`}).join("");
  return `<div class="sl-ov" data-ld="closebg"><div class="sl-dlg ld-dlg" role="dialog" aria-modal="true" aria-labelledby="ldMh">
    <div class="sl-db">
      <div class="sl-dh"><div class="ld-mt">${ldIco(a.s.ico,22)}<div><h2 id="ldMh">${esc(a.s.name)}</h2><p class="ld-own">${ldAv(a.s.owner)}${a.s.sub?`<em class="ld-sub">· ${esc(a.s.sub)}</em>`:""}</p></div></div>
        <button type="button" class="sl-x" data-ld="close" aria-label="Close">${svg(XI,16)}</button></div>
      <div class="ld-mstats">${stat("New",a.new)}${stat("In progress",a.ip,"",a.hot?`<small class="ld-hot">${svg(LD_I.hot,12)}${a.hot} hot</small>`:"")}${stat("Sent to Sales",a.sent,"g")}${stat("Parked",a.park,"m")}</div>
      ${secs||'<p class="pm">Nothing logged yet.</p>'}
    </div></div></div>`}
function ldShell(){const v=el("v-leads");if(!v||LD.shell)return;LD.shell=true;
  v.innerHTML=`<div class="ld"><div class="ld-top"><div><h2>Leads</h2><p class="ld-asof" id="ldAsof"></p></div>
    <div class="ld-srch"><label class="ld-q">${svg(LD_I.search,15)}<input id="ldQ" type="search" placeholder="Search a lead…" autocomplete="off" spellcheck="false" aria-label="Search a lead" aria-controls="ldRes" aria-expanded="false"></label><div class="ld-res" id="ldRes" hidden></div></div></div>
    <div id="ldBody"><p class="pm ld-wait">Loading leads…</p></div><div id="ldModal"></div></div>`;
  v.addEventListener("click",ldClick);v.addEventListener("input",e=>{if(e.target.id==="ldQ")ldResults()});
  document.addEventListener("keydown",e=>{const w=el("v-leads");if(w&&!w.hidden)ldKey(e)})}
function ldRender(){if(!LD.shell)return;const b=el("ldBody");if(b)b.innerHTML=ldBodyH();const a=el("ldAsof");if(a)a.textContent=LD.rows?ldAsof():"";
  ldModalDraw();if(el("ldQ")&&el("ldQ").value)ldResults()}
/* the window: focus goes to its close button when it opens (and stays there when fresh data redraws it) */
function ldModalDraw(){
  const m=el("ldModal");if(m){const was=!!m.firstChild,inside=was&&m.contains(document.activeElement),top=was&&m.querySelector(".sl-db")?m.querySelector(".sl-db").scrollTop:0;
    m.innerHTML=LD.open?ldDlgH():"";const x=m.querySelector(".sl-x");
    if(LD.open&&(!was||inside)&&x)x.focus({preventScroll:true});
    if(LD.open&&was){const db=m.querySelector(".sl-db");if(db)db.scrollTop=top}
    else if(LD.open){const h=m.querySelector(".ld-hl");if(h)h.scrollIntoView({block:"center"})}}}
/* ---------- search: any lead by name or company ---------- */
function ldResults(){const q=el("ldQ"),box=el("ldRes");if(!q||!box)return;const t=ldNorm(q.value);
  if(t.length<2||!LD.rows||!S.loaded){box.hidden=true;box.innerHTML="";q.setAttribute("aria-expanded","false");return}
  const hits=(LD.items||[]).filter(it=>ldNorm(it.name).includes(t)||ldNorm(it.co).includes(t)).sort((x,y)=>(ldNorm(y.name).startsWith(t)-ldNorm(x.name).startsWith(t))||x.name.localeCompare(y.name));
  const src=k=>LD_SRC.find(s=>s.k===k)||LD_SRC[LD_SRC.length-1];const colL={new:"New",ip:"In progress",sent:"Sent to Sales",park:"Parked",won:"Won"};
  box.innerHTML=hits.length?hits.slice(0,12).map(it=>{const s=src(it.src);return `<button type="button" class="ld-ri" data-ld="pick" data-k="${esc(s.k)}" data-n="${esc(it.name)}"><span class="ld-rn"><b>${esc(it.name)}</b>${it.co&&it.co!==it.name?`<small>${esc(it.co)}</small>`:""}</span><span class="ld-rs">${ldIco(s.ico,14)}${esc(s.name)} · ${esc(colL[it.col]||"")}${it.stage&&it.stage!==colL[it.col]?" · "+esc(it.stage):""}</span></button>`}).join("")+(hits.length>12?`<p class="ld-rx">${ldNum(hits.length-12)} more. Keep typing to narrow it down.</p>`:"")
    :`<p class="ld-rx">No lead matches “${esc(q.value.trim())}”.</p>`;
  box.hidden=false;q.setAttribute("aria-expanded","true")}
function ldCloseRes(clear){const box=el("ldRes"),q=el("ldQ");if(box){box.hidden=true;box.innerHTML=""}if(q){q.setAttribute("aria-expanded","false");if(clear)q.value=""}}
/* ---------- actions ---------- */
function ldShow(k,hl,fromSearch){LD.open=k;LD.hl=hl||"";LD.lastFocus=fromSearch?"search":k;ldModalDraw()}
function ldHide(){if(!LD.open)return;LD.open=null;LD.hl="";const m=el("ldModal");if(m)m.innerHTML="";const f=LD.lastFocus;LD.lastFocus=null;
  const t=f==="search"?el("ldQ"):[...document.querySelectorAll("#ldBody button.ld-tr")].find(b=>b.dataset.k===f);if(t)t.focus({preventScroll:true})}
function ldClick(e){const t=e.target.closest("[data-ld]");
  if(!t){if(!e.target.closest(".ld-srch"))ldCloseRes(false);return}
  const a=t.dataset.ld;
  if(a==="closebg"){if(e.target===t)ldHide();return}
  if(a==="close"){ldHide();return}
  if(a==="open"){ldShow(t.dataset.k,"",false);return}
  if(a==="pick"){const k=t.dataset.k,n=t.dataset.n;ldCloseRes(false);ldShow(k,n,true);return}}
function ldKey(e){
  if(e.key==="Escape"){if(LD.open){e.preventDefault();ldHide();return}const box=el("ldRes");if(box&&!box.hidden){e.preventDefault();ldCloseRes(true);return}}
  if(e.key==="Enter"&&e.target.id==="ldQ"){const f=document.querySelector("#ldRes .ld-ri");if(f){e.preventDefault();f.click()}return}
  if(e.key==="ArrowDown"&&e.target.id==="ldQ"){const f=document.querySelector("#ldRes .ld-ri");if(f){e.preventDefault();f.focus()}return}
  if((e.key==="ArrowDown"||e.key==="ArrowUp")&&e.target.classList&&e.target.classList.contains("ld-ri")){e.preventDefault();const all=[...document.querySelectorAll("#ldRes .ld-ri")],i=all.indexOf(e.target),n=all[i+(e.key==="ArrowDown"?1:-1)];if(n)n.focus();else if(e.key==="ArrowUp")el("ldQ").focus();return}
  /* keep keyboard focus inside the open window */
  if(e.key==="Tab"&&LD.open){const d=document.querySelector("#ldModal .sl-dlg");if(!d)return;const f=[...d.querySelectorAll("button,[href],input,[tabindex]:not([tabindex='-1'])")];if(!f.length)return;
    if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}}}
/* ---------- data ---------- */
async function ldFetch(){
  if(LD.loading)return;LD.loading=true;
  try{
    if(!window.claude?.use){
      const res=await fetch(location.pathname.replace(/\/$/,"")+"/leads",{cache:"no-store"});if(!res.ok)throw new Error("leads feed "+res.status);
      const j=await res.json();if(!j||j.ok!==true||!Array.isArray(j.rows))throw new Error("leads feed");
      Object.assign(LD,{rows:j.rows,at:j.at||"",refreshing:!!j.refreshing,err:""});
    }else{
      /* the Claude copy: the same fields, read through the Airtable connector */
      const F={c:CL.co,o:CL.pqo,s:CL.src,k:KBF.cl,pq:CL.pq,uw:CL.uw,up:CL.up,ai:CL.ai,rf:CL.ref,so:CL.so,ev:CL.ev,ep:CL.ep};
      const recs=await list(RB,T.cl,[CL.name].concat(Object.values(F)));
      const rows=recs.map(r=>{const n=String(r[CL.name]||"").trim();if(!n)return null;const x={i:r._id,n};Object.keys(F).forEach(k=>{const v=String(sv(r[F[k]])||"").trim();if(v)x[k]=v});return x}).filter(Boolean);
      Object.assign(LD,{rows,at:new Date().toISOString(),refreshing:false,err:""});
    }
  }catch(e){LD.err=String(e&&e.message||e)}
  LD.loading=false;ldRender();
  /* the copy was older than 10 minutes: n8n is refreshing it now, so ask again shortly (a few times at most) */
  clearTimeout(LD.timer);if(LD.refreshing&&LD.tries<3){LD.tries++;LD.timer=setTimeout(()=>{const v=el("v-leads");if(v&&!v.hidden)ldFetch()},25000)}else if(!LD.refreshing)LD.tries=0}
/* the Sales feed is shared with the Sales tab: wait for it, then draw */
function ldAfterSales(){if(S.loading){setTimeout(ldAfterSales,150);return}ldRender()}
function ldOpen(){ldShell();if(!S.loaded&&!S.loading)load();if(!LD.rows&&!LD.loading)ldFetch();ldRender();ldAfterSales()}
/* hook into the page's tabs (after the Sales tab's own hook) */
if(typeof showTab==="function"){const prevLd=showTab;showTab=function(t){prevLd(t);const v=el("v-leads");if(v)v.hidden=t!=="leads";
  if(t==="leads"){if(el("asof"))el("asof").hidden=true;if(el("rvAsof"))el("rvAsof").hidden=true;ldOpen()}else{ldHide();ldCloseRes(false)}}}
{const hb=el("refreshBtn");if(hb)hb.addEventListener("click",()=>{const v=el("v-leads");if(!v||v.hidden)return;if(!S.loading)load(true);LD.tries=0;ldFetch();ldAfterSales()})}
if(location.hash==="#leads")showTab("leads");
