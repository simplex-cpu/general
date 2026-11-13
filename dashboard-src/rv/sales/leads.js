/* ===================== Leads tab (Karen, 12–13 Nov: the v4 overview she approved, then each source's own pipeline) =====================
   Overview: where Kash's leads come from and where they are now, one row per source, with Kash's own funnel names (4 Nov Ops
   meeting, 6 Nov call), never grouped. A row opens that source's pipeline as a kanban: the stages of the team's own Airtable table
   (Gretta's Pre-qual stages for the Company Leads sources, Danica's Upwork stages, Sarah's Upsell list, Jade's Leads), plus a
   "Sent to Sales" column with the deals on Kash's board. Kash only opens leads here; the team moves them between stages.
   A team lead opens the lead window: its details, the notes of whoever handles it, "What's needed from you" with to-dos (saved
   with Save into that table's "What's needed (from Kash)" field) and comments (Airtable comments, "Kash: ..."). A deal on his
   board opens his own deal window, as on the Sales tab.
   Data: Company Leads and Sarah's Upsell list from {page}/leads (a copy n8n refreshes at most every 10 minutes); Jade's Leads and
   Kash's board from the Sales feed shared with Sales, so "Sent to Sales" is exactly the open deals on his board, by source tag.
   Saves go to {page}/leads-api, which allows only those What's needed fields and comments. Hot / warm / cold come from the stage:
   New is cold, In progress is warm, the "talking now" stages (Pre-qual In Conversation, Upsell list Ready) are hot.
   Built into the Sales script (build.py puts it just before the script's last line), so it shares its data, helpers and styles. */
const LD={rows:null,ul:null,at:"",refreshing:false,loading:false,err:"",view:null,lead:null,ed:null,cm:{},cmText:"",cmBusy:false,unsaved:false,more:{},
  dealFrom:null,tries:0,timer:null,shell:false,items:[],G:null};
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
  hot:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",sent:"M5 12h14M13 6l6 6-6 6",chev:"M9 18l6-6-6-6",back:"M15 18l-6-6 6-6",search:"M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-4.3-4.3",user:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z"};
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
const ldNum=n=>Number(n||0).toLocaleString("en-GB");
const ldNorm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const ldUl=r=>{const v=r[UL.name];return String(Array.isArray(v)?sv(v[0]):sv(v)||"").trim()};
const ldUlStage=v=>String(sv(v)||"").replace(/^[^A-Za-z]+/,"").trim();
/* Sarah's Upsell list: from the Leads feed (with her notes); the Sales feed's shorter copy if the Leads copy predates it */
const ldUlRows=()=>LD.ul&&LD.ul.length?LD.ul:(S.ul||[]).map(r=>({i:r._id,n:ldUl(r),st:sv(r[UL.stage]),ac:sv(r[UL.action]),nx:sv(r[UL.next])})).filter(x=>x.n);
/* where Kash's What's needed lives, per table (the only field the Leads tab writes, besides comments) */
const UL_NEED="fldCWeHQCvRQtxBsq";
const LD_TBL={cl:{base:RB,tbl:T.cl,f:CL_NEED,where:"Company Leads"},jade:{base:CB,tbl:T.leads,f:L.needed,where:"Jade's Leads"},ul:{base:RB,tbl:T.ul,f:UL_NEED,where:"Sarah's Upsell list"}};

/* every lead once: Kash's open deals (Sent to Sales), then whatever each team still holds. rs = the column on its pipeline. */
function ldItems(){
  const P=derive().P,on=new Set(),out=[];
  P.forEach(p=>{on.add(p.id);if(p.jadeId)on.add(p.jadeId);if(p.rvId)on.add(p.rvId)});
  P.forEach(p=>{if(LD_DONE.has(p.stage))return;out.push({kind:"deal",id:p.id,src:p.origin||"Other",col:"sent",hot:false,rs:"Sales Pipeline",name:p.name,co:p.co||"",stage:p.stage,need:p.needed||"",lc:p.lastC||""})});
  (S.leads||[]).forEach(r=>{if(on.has(r._id))return;const name=String(r[L.name]||"").trim();if(!name)return;
    const st=sv(r[L.stage])||JADE_STAGES[0],back=kbNorm(r[KBF.jade])==="Review";
    const col=back?"ip":/^10\b/.test(st)?"ip":/^(79|80)\b/.test(st)?"park":/^70\b/.test(st)?"won":"ip";
    out.push({kind:"jade",id:r._id,src:JADE_SRC[sv(r[L.source])]||stdO(sv(r[L.source]))||"Podcast guest",col,hot:false,rs:st,back,name,co:r[L.co]||"",stage:back?"Back from Kash":ldLbl(st),need:r[L.needed]||"",lc:r[L.lastC]||""})});
  ldUlRows().forEach(x=>{if(on.has(x.i))return;const st=ldUlStage(x.st);const m={"Ready":"hot","In progress":"ip","Not now":"park","Unqualified":"park","Won":"won"}[st]||"new";
    out.push({kind:"ul",id:x.i,src:"Upsells",col:m==="hot"?"ip":m,hot:m==="hot",rs:st||"New",name:x.n,co:"",stage:st||"New",need:x.nd||"",lc:""})});
  (LD.rows||[]).forEach(x=>{if(on.has(x.i))return;const t=ldClStage(x),back=x.k==="Review";
    if(!t&&!(x.k&&KB_TEAM.has(x.k)))return; /* no stage anywhere: in nobody's pipeline */
    let m=back?"ip":t?((LD_MAP[t[0]]||{})[t[1]]||"ip"):({"New":"new","No Reply":"park","Not a Fit":"park","Nurture Sequence":"park","Sent to Podcast":"park"}[x.k]||"ip");
    /* handed to Sales but not on Kash's board (yet): still with the team */
    if(m==="sent")m="ip";
    out.push({kind:"cl",id:x.i,src:stdO(x.o)||stdO(x.s)||"Other",col:m==="hot"?"ip":m,hot:m==="hot",rs:(t?t[1]:x.k)||"New",back,name:x.n,co:x.c||"",stage:back?"Back from Kash":ldLbl(t?t[1]:x.k),need:x.nd||"",lc:x.lc||""})});
  return out}
/* per source: counts and the leads, biggest first; sources with nothing logged go last */
function ldAgg(items){
  const A={};LD_SRC.forEach((s,i)=>A[s.k]={s,i,new:0,ip:0,hot:0,sent:0,park:0,won:0,items:[]});
  items.forEach(it=>{const a=A[it.src]||A.Other;a[it.col]=(a[it.col]||0)+1;if(it.hot)a.hot++;a.items.push(it)});
  const all=LD_SRC.map(s=>A[s.k]).map(a=>Object.assign(a,{total:a.new+a.ip+a.sent+a.park}));
  const full=all.filter(a=>a.total||a.won).sort((x,y)=>y.total-x.total||x.i-y.i),empty=all.filter(a=>!a.total&&!a.s.onlyIfAny&&!a.won);
  return {full,empty,all:full.concat(empty)}}

/* ---------- the overview ---------- */
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
const ldSay=a=>`${a.s.name}${a.s.owner?", "+a.s.owner:""}: ${ldNum(a.new)} new, ${ldNum(a.ip)} in progress${a.hot?" ("+a.hot+" hot)":""}, ${ldNum(a.sent)} sent to Sales, ${ldNum(a.park)} parked. Open the pipeline`;
function ldTableH(G){
  const row=a=>{const nm=`<span class="ld-pn">${ldIco(a.s.ico,17)}<span><b>${esc(a.s.name)}</b><small>${ldAv(a.s.owner)}${a.s.sub?`<em class="ld-sub">· ${esc(a.s.sub)}</em>`:""}</small></span></span>`;
    if(!a.total&&!a.won)return `<div class="ld-tr ld-empty">${nm}<span class="ld-none">Nothing logged yet</span></div>`;
    return `<button type="button" class="ld-tr" data-ld="open" data-k="${esc(a.s.k)}" aria-label="${esc(ldSay(a))}">${nm}${ldN(a.new)}<span class="ld-ip">${ldN(a.ip)}${a.hot?`<small class="ld-hot">${svg(LD_I.hot,12)}${a.hot} hot</small>`:""}</span>${ldN(a.sent,"g")}${ldN(a.park,"m")}<span class="ld-chev">${svg(LD_I.chev,17)}</span></button>`};
  return `<div class="ld-panel ld-tbl"><div class="ld-tr ld-th" aria-hidden="true"><span></span><span>New</span><span>In progress</span><span class="ld-sh">${svg(LD_I.sent,13)}Sent to Sales</span><span>Parked</span><span></span></div>${G.all.map(row).join("")}</div>`}
function ldOverviewH(G){
  const t=G.all.reduce((o,a)=>{o.nw+=a.new;o.ip+=a.ip;o.hot+=a.hot;o.sent+=a.sent;return o},{nw:0,ip:0,hot:0,sent:0});
  const k=(cls,lab,v)=>`<div class="ld-k"><span>${cls?`<i class="ld-ki ${cls}">${svg(LD_I[cls],14)}</i>`:""}${lab}</span><b>${ldNum(v)}</b></div>`;
  return `<div class="ld-kpis">${k("","Leads in play",t.nw+t.ip)}${k("hot","Hot",t.hot)}${k("warm","Warm",t.ip-t.hot)}${k("cold","Cold",t.nw)}${k("sent","Sent to Sales",t.sent)}</div>
  <h3 class="ld-h">Where leads come from</h3>${ldBarsH(G)}
  <h3 class="ld-h">Where they are now</h3>${ldTableH(G)}`}
function ldBodyH(){
  if(S.err||(LD.err&&!LD.rows))return `<div class="sl-msg"><b>Couldn't load the leads.</b><br><span class="pm">Press Refresh to try again.</span></div>`;
  if(!S.loaded||!LD.rows)return '<p class="pm ld-wait">Loading leads…</p>';
  LD.items=ldItems();const G=ldAgg(LD.items);LD.G=G;
  if(LD.view&&G.all.some(a=>a.s.k===LD.view))return ldBoardH(G.all.find(a=>a.s.k===LD.view));
  LD.view=null;return ldOverviewH(G)}

/* ---------- a source's pipeline: the team's own stages as columns (the board looks like Kash's own) ---------- */
const LD_CAP=40;
function ldStages(k){
  if(k==="Upwork")return ["New","Proposal Sent","Sales Pipeline","No Reply","Won","Lost","Not Applicable"];
  if(k==="Upsells")return ["Ready","In progress","Sales Pipeline","Won","Not now","Unqualified"];
  if(k==="Podcast guest")return JADE_STAGES.concat(["Sales Pipeline"]);
  return PQ_STAGES.slice()}
const ldFoldKey=k=>"ld:"+k;
/* a column, as on Kash's board (colour by position in the stages, fold arrow), without the stage notes under the title */
function ldColH(fk,stages,st,n,inner,lab){
  const tone=stageTone(stages,st),d=`data-board="${esc(fk)}" data-stage="${esc(st)}"`,mark='<i class="sl-dot"></i>',tip=STAGE_INFO["prequal|"+st]||STAGE_INFO[st]||"";
  if(isFolded(fk,st))return `<div class="sl-col sl-colc stx st-${tone}" ${d}><button type="button" class="sl-cexp" data-act="fold" ${d} aria-expanded="false" aria-label="Show ${esc(lab)}, ${n} ${n===1?"lead":"leads"}" title="${esc(tip)}">${mark}<small>${n}</small><span class="v">${esc(lab)}</span></button></div>`;
  return `<div class="sl-col" ${d}><div class="sl-colh stx st-${tone}"><div class="t"><span${tip?` title="${esc(tip)}"`:""}>${mark}${esc(lab)}</span><span class="r"><small>${n}</small><button type="button" class="sl-ccol" data-act="fold" ${d} aria-expanded="true" aria-label="Fold ${esc(lab)}" title="Fold this column">${svg(CHEV,15)}</button></span></div></div>${inner}</div>`}
/* a card: the whole card opens the lead (a deal on his board opens his deal window) */
function ldCardH(it){
  const open=tdParse(it.need).filter(x=>!x.d).length,act=it.kind==="deal"?"deal":"lead",d=`data-ld="${act}" data-kind="${it.kind}" data-id="${esc(it.id)}"`;
  const chip=it.kind==="deal"?`<span class="sl-kchip">Your board · ${esc(stL(it.stage))}</span>`:it.back?`<span class="sl-kchip ld-backc">Back from you</span>`:it.hot?`<span class="ld-hotc">${svg(LD_I.hot,12)}Hot</span>`:"";
  const when=it.lc?`<span class="sl-due">Last contact ${esc(short(it.lc))}</span>`:"";
  return `<article class="sl-card sl-kc ld-kc" ${d}><div class="sl-cn"><button type="button" class="sl-name" ${d} style="font-size:14px">${esc(it.name)}</button>${it.co&&it.co!==it.name?`<div class="sl-co" style="font-size:12.5px">${esc(it.co)}</div>`:""}</div>${chip||when?`<div class="sl-cm"><span class="sl-tags">${chip}</span>${when}</div>`:""}${open?`<div class="sl-box"><span class="sl-cl"><b class="pm">Needed from you</b> ${open} to-do${open>1?"s":""}</span></div>`:""}</article>`}
const ldStat=(lab,v,cls,extra)=>`<div class="ld-ms${cls?" "+cls:""}"><span>${lab}</span><b>${ldNum(v)}</b>${extra||""}</div>`;
function ldBoardH(a){
  const k=a.s.k,stages=ldStages(k),fk=ldFoldKey(k),by={};
  a.items.forEach(it=>{const st=it.kind==="deal"?"Sales Pipeline":(it.rs||"New");(by[st]=by[st]||[]).push(it)});
  const cols=stages.concat(Object.keys(by).filter(s=>!stages.includes(s)));
  const KO=s=>{const i=KB_STAGES.indexOf(s);return i<0?99:i};
  const colsH=cols.map(st=>{
    const list=(by[st]||[]).slice().sort((x,y)=>(x.kind==="deal"&&y.kind==="deal"?KO(x.stage)-KO(y.stage):0)||(y.hot-x.hot)||x.name.localeCompare(y.name));
    const cap=LD.more[k+"|"+st]||LD_CAP,shown=list.slice(0,cap),left=list.length-shown.length;
    const inner=(shown.map(ldCardH).join("")+(left>0?`<button type="button" class="sl-inadd ld-more" data-ld="more" data-st="${esc(st)}">Show ${ldNum(Math.min(left,LD_CAP))} more · ${ldNum(left)} not shown</button>`:""))||'<div class="sl-empty">Nobody here</div>';
    return ldColH(fk,cols,st,list.length,inner,stL(st)||st)}).join("");
  return `<div class="ld-bv"><button type="button" class="ld-backb" data-ld="back">${svg(LD_I.back,16)}All sources</button>
    <div class="ld-bvh"><div class="ld-mt">${ldIco(a.s.ico,24)}<div><h2>${esc(a.s.name)}</h2><p class="ld-own">${ldAv(a.s.owner)}${a.s.sub?`<em class="ld-sub">· ${esc(a.s.sub)}</em>`:""}</p></div></div>
      <div class="ld-mstats ld-bvs">${ldStat("New",a.new)}${ldStat("In progress",a.ip,"",a.hot?`<small class="ld-hot">${svg(LD_I.hot,12)}${a.hot} hot</small>`:"")}${ldStat("Sent to Sales",a.sent,"g")}${ldStat("Parked",a.park,"m")}</div></div>
    <div class="sl-board ld-board">${colsH}</div>
    <p class="sl-foot">Open a lead to see its details and notes, add what you need, or leave a comment. The team moves leads between stages in Airtable. Fold any column with its arrow.</p></div>`}

/* ---------- the lead window (a team lead) ---------- */
const ldRec=(kind,id)=>kind==="cl"?(LD.rows||[]).find(x=>x.i===id):kind==="jade"?(S.leads||[]).find(r=>r._id===id):kind==="ul"?ldUlRows().find(x=>x.i===id):null;
/* the same view of any team lead: name, stage, source, handler, dates, value, contact, the handler's notes, What's needed */
function ldInfo(kind,id){
  const r=ldRec(kind,id);if(!r)return null;const it=(LD.items||[]).find(x=>x.kind===kind&&x.id===id)||{};
  const src=LD_SRC.find(s=>s.k===(it.src||(kind==="ul"?"Upsells":kind==="jade"?"Podcast guest":"")))||LD_SRC[LD_SRC.length-1];
  if(kind==="cl")return {name:r.n,co:r.c||"",src,owner:ownerN(r.ow||"")||src.owner,stage:it.stage||ldLbl((ldClStage(r)||[])[1]||r.k||""),lc:r.lc||"",ch:r.ch||"",va:+r.va||0,need:r.nd||"",
    contact:[r.em&&mailH(r.em),r.ph&&telH(r.ph),r.ig&&igLinkH(r.ig),r.li&&linkH(r.li)].filter(Boolean),notes:[["Notes",r.no],["Next step",r.nx],["What they want",r.wa]]};
  if(kind==="jade"){const ct=(S.contacts||[]).find(c=>ids(r[L.contacts]).includes(c._id));const cv=f=>ct?String(sv(ct[f])||"").trim():"";
    return {name:String(r[L.name]||"").trim(),co:r[L.co]||"",src,owner:sv(r[L.owner])||"Jade",stage:it.stage||ldLbl(sv(r[L.stage])),lc:r[L.lastC]||"",ch:r[L.chase]||"",va:+r[L.value]||0,need:r[L.needed]||"",
      contact:[cv(CT.email)&&mailH(cv(CT.email)),cv(CT.phone)&&telH(cv(CT.phone)),cv(CT.ig)&&igLinkH(cv(CT.ig)),cv(CT.li)&&linkH(cv(CT.li))].filter(Boolean),
      notes:[["Latest update",r[L.latest]],["Next step",r[L.next]],["What they want",r[L.want]]]}}
  return {name:r.n,co:"",src,owner:r.ow||"Sarah",stage:it.stage||ldUlStage(r.st)||"New",lc:"",ch:r.nxd||"",chL:"Next step on",va:+String(r.va||"").replace(/[^\d.]/g,"")||0,need:r.nd||"",contact:[],
    notes:[["Notes",r.no],["Next step",r.nx],["Next action",r.ac],["Why now",r.why]]}}
/* Kash's edits (his to-dos) wait for Save; one window at a time */
function ldEdOpen(kind,id){const key=kind+":"+id;if(LD.ed&&LD.ed.key===key)return;const inf=ldInfo(kind,id),td=tdParse(inf?inf.need:"");
  LD.ed={key,kind,id,td,orig:tdSer(td),dirty:false,busy:false}}
const ldNewTd=()=>{const i=el("ldTdNew");return i?i.value.trim():""};
function ldMark(){const e=LD.ed;if(!e)return;e.dirty=tdSer(e.td)!==e.orig||!!ldNewTd();
  const b=el("ldSave");if(b){b.disabled=!e.dirty||e.busy;b.lastChild.textContent=e.busy?"Saving…":"Save"}const d=el("ldDirty");if(d)d.hidden=!e.dirty}
const ldUnsH=inf=>`<div class="sl-ov sl-ov2" data-ld="unsbg"><div class="sl-dlg sl-cfm" role="alertdialog" aria-modal="true" aria-labelledby="ldUnsH" aria-describedby="ldUnsT">
  <div class="sl-cfmb"><span class="sl-cfmi save">${svg(PEN_I,21)}</span><div style="min-width:0"><h2 id="ldUnsH">Save your changes?</h2><p id="ldUnsT">You changed what's needed for <b>${esc(inf.name)}</b> and haven't saved yet.</p></div></div>
  <div class="sl-fbtns"><button type="button" class="sl-ghost sl-cfmc" id="ldUnsC" data-ld="unskeep">Keep editing</button><button type="button" class="sl-ghost sl-dghost" data-ld="unsdiscard">Discard</button><button type="button" class="sl-solid" id="ldUnsGo" data-ld="unssave"${LD.ed&&LD.ed.busy?" disabled":""}>${svg(CHECK_I,15)}${LD.ed&&LD.ed.busy?"Saving…":"Save"}</button></div></div></div>`;
function ldLeadH(){
  const l=LD.lead;if(!l)return "";const inf=ldInfo(l.kind,l.id);if(!inf)return "";ldEdOpen(l.kind,l.id);const e=LD.ed,T2=LD_TBL[l.kind];
  const fact=(lab,x)=>`<div class="sl-fact"><span class="l">${lab}</span><div class="sl-fv">${x||'<small>–</small>'}</div></div>`;
  const sec=(cls,icon,title,count,body)=>`<section class="sl-sec sl-sec-${icon}${cls?" "+cls:""}"><h3 class="sl-sech"><span class="sl-sect ld-sect"><span class="ic">${svg(SEC_I[icon]||SEC_I.notes,18)}</span><span class="tt">${esc(title)}</span>${count!=null?`<span class="sl-cnt${count?"":" zero"}">${count}</span>`:""}</span></h3><div class="sl-secb">${body}</div></section>`;
  const tds=e.td.map((x,i)=>`<div class="sl-tdr${x.d?" done":""}"><input type="checkbox" id="ldTd-${i}" data-ld="tdtog" data-i="${i}"${x.d?" checked":""} aria-label="${x.d?"Done":"Mark as done"}: ${esc(x.t)}"><textarea class="sl-tdt" data-ld="tdtext" data-i="${i}" rows="1" aria-label="To-do ${i+1}">${esc(x.t)}</textarea><button type="button" class="sl-tdx" data-ld="tdrm" data-i="${i}" aria-label="Remove: ${esc(x.t)}" title="Remove">${svg(XI,14)}</button></div>`).join("");
  const add=`<div class="sl-tda"><span class="pl" aria-hidden="true">${svg(PLUS,15)}</span><input id="ldTdNew" maxlength="300" placeholder="${e.td.length?"Add a to-do":"What do you need?"}" autocomplete="off" aria-label="Add a to-do"><button type="button" class="sl-tdadd" data-ld="tdadd">Add</button></div>`;
  const notes=inf.notes.filter(n=>String(n[1]||"").trim());
  const notesH=notes.length?notes.map(([k,v])=>`<div class="sl-secbox ld-note"><span class="ld-nl">${esc(k)}</span><p>${esc(String(v).trim())}</p></div>`).join(""):`<div class="sl-secbox"><p class="pm">${esc(inf.owner)} hasn't written anything here yet.</p></div>`;
  const cm=LD.cm[l.kind+":"+l.id]||{loading:true,list:[]};
  const cms=cm.loading?'<p class="pm sl-cve">Loading comments…</p>':cm.err?'<p class="pm sl-cve">The comments couldn\'t load.</p>':cm.list.length?cm.list.map(c=>`<div class="sl-cv"><span class="ch">${esc(c.who)}</span><p>${esc(c.text)}</p><span class="d">${esc(c.when)}</span></div>`).join(""):'<p class="pm sl-cve">No comments yet.</p>';
  return `<div class="sl-ov" data-ld="lbg"><div class="sl-dlg sl-dlg-sp ld-ldlg" role="dialog" aria-modal="true" aria-labelledby="ldLh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="ldLh">${esc(inf.name)}</h2>${inf.co&&inf.co!==inf.name?`<div class="sl-co" style="margin-top:2px">${esc(inf.co)}</div>`:""}</div>
      <div class="sl-dhb"><button type="button" class="sl-x" data-ld="lclose" aria-label="Close">${svg(XI,16)}</button></div></div>
    <div class="sl-facts sl-kfacts ld-lfacts">${fact("Stage",esc(inf.stage))}${fact("Source",otagH(inf.src.k))}${fact("Handled by",ldAv(inf.owner))}${inf.lc?fact("Last contact",esc(short(inf.lc))):""}${inf.ch?fact(inf.chL||"Chase on",esc(short(inf.ch))):""}${inf.va?fact("Value / month",esc(full(inf.va))):""}</div>
    ${inf.contact.length?`<p class="ld-contact">${inf.contact.join('<span aria-hidden="true"> · </span>')}</p>`:""}
    <div class="sl-secs">
      ${sec("need","need","What's needed from you",e.td.filter(x=>!x.d).length,`<div class="sl-secbox need sl-td">${tds}${add}</div>`)}
      ${sec("","notes","Notes from "+inf.owner,null,notesH)}
      ${sec("","conv","Comments",cm.list.length,`<div class="sl-cvl">${cms}</div><div class="ld-cmadd"><label class="vh" for="ldCm">Write a comment</label><textarea id="ldCm" rows="2" maxlength="4000" placeholder="Write a comment for ${esc(inf.owner)}">${esc(LD.cmText)}</textarea><button type="button" class="sl-ghost" data-ld="cmpost"${LD.cmBusy?" disabled":""}>${LD.cmBusy?"Posting…":"Post comment"}</button></div>`)}
    </div>
  </div>
  <div class="sl-dfoot ld-lfoot"><span class="pm ld-lwhere">Saved in ${esc(T2.where)}: ${esc(inf.owner)} sees your to-dos and comments in Airtable.</span><span class="ld-lfb"><span class="ld-dirty" id="ldDirty"${e.dirty?"":" hidden"}>Not saved yet</span><button type="button" class="sl-solid" id="ldSave" data-ld="lsave"${!e.dirty||e.busy?" disabled":""}>${svg(CHECK_I,15)}<span>${e.busy?"Saving…":"Save"}</span></button></span></div>
  </div></div>${LD.unsaved?ldUnsH(inf):""}`}

/* ---------- drawing ---------- */
function ldShell(){const v=el("v-leads");if(!v||LD.shell)return;LD.shell=true;
  /* Kash's deal window (the Sales tab's) opens over this tab too: its box moves out of the Sales view, its clicks work anywhere */
  const sm=el("slModal");if(sm&&sm.parentNode!==document.body)document.body.appendChild(sm);
  v.innerHTML=`<div class="ld"><div class="ld-top"><div><h2>Leads</h2><p class="ld-asof" id="ldAsof"></p></div>
    <div class="ld-srch"><label class="ld-q">${svg(LD_I.search,15)}<input id="ldQ" type="search" placeholder="Search a lead…" autocomplete="off" spellcheck="false" aria-label="Search a lead" aria-controls="ldRes" aria-expanded="false"></label><div class="ld-res" id="ldRes" hidden></div></div></div>
    <div id="ldBody"><p class="pm ld-wait">Loading leads…</p></div><div id="ldModal"></div></div>`;
  v.addEventListener("click",ldClick);v.addEventListener("input",ldInput);
  document.addEventListener("keydown",e=>{const w=el("v-leads");if(w&&!w.hidden)ldKey(e)})}
function ldRenderBody(){if(!LD.shell)return;const b=el("ldBody");if(!b)return;
  /* a redraw keeps the board's sideways scroll and the focused card */
  const bd=b.querySelector(".ld-board"),sx=bd?bd.scrollLeft:0,sy=bd?bd.scrollTop:0,f=document.activeElement&&b.contains(document.activeElement)?document.activeElement:null;
  const fk=f?[f.dataset.ld,f.dataset.kind,f.dataset.id,f.dataset.k,f.dataset.st].join("|"):"";
  b.innerHTML=ldBodyH();const a=el("ldAsof");if(a)a.textContent=LD.rows?ldAsof():"";
  const nb=b.querySelector(".ld-board");if(nb){nb.scrollLeft=sx;nb.scrollTop=sy}
  if(fk){const g=[...b.querySelectorAll("button")].find(x=>[x.dataset.ld,x.dataset.kind,x.dataset.id,x.dataset.k,x.dataset.st].join("|")===fk);if(g)g.focus({preventScroll:true})}}
/* the window: focus goes to its close button when it opens; a redraw keeps focus, scroll and anything half-typed */
function ldModalDraw(){const m=el("ldModal");if(!m)return;
  const was=!!m.firstChild,ae=document.activeElement,inside=was&&m.contains(ae),db=m.querySelector(".sl-dlg .sl-db"),top=db?db.scrollTop:0;
  const fid=inside?(ae.id||(ae.dataset&&ae.dataset.ld?"ld:"+ae.dataset.ld+":"+(ae.dataset.i||"")+":"+ae.className:"")):"",nt=ldNewTd()||(el("ldTdNew")?el("ldTdNew").value:"");
  m.innerHTML=LD.lead?ldLeadH():"";if(!LD.lead)return;
  const ndb=m.querySelector(".sl-dlg .sl-db");if(ndb&&was)ndb.scrollTop=top;const ni=el("ldTdNew");if(ni&&nt)ni.value=nt;
  m.querySelectorAll("textarea").forEach(ldGrow);
  if(LD.unsaved){const c=el("ldUnsC");if(c)c.focus();return}
  let t=null;if(fid)t=fid.startsWith("ld:")?[...m.querySelectorAll("[data-ld]")].find(x=>"ld:"+x.dataset.ld+":"+(x.dataset.i||"")+":"+x.className===fid):el(fid);
  if(!t&&!was)t=m.querySelector(".sl-x");if(t)t.focus({preventScroll:true});ldMark()}
function ldRender(){ldRenderBody();ldModalDraw();if(el("ldQ")&&el("ldQ").value)ldResults()}
const ldGrow=t=>{if(!t)return;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,400)+"px"};

/* ---------- search: any lead by name or company ---------- */
function ldResults(){const q=el("ldQ"),box=el("ldRes");if(!q||!box)return;const t=ldNorm(q.value);
  if(t.length<2||!LD.rows||!S.loaded){box.hidden=true;box.innerHTML="";q.setAttribute("aria-expanded","false");return}
  const hits=(LD.items||[]).filter(it=>ldNorm(it.name).includes(t)||ldNorm(it.co).includes(t)).sort((x,y)=>(ldNorm(y.name).startsWith(t)-ldNorm(x.name).startsWith(t))||x.name.localeCompare(y.name));
  const src=k=>LD_SRC.find(s=>s.k===k)||LD_SRC[LD_SRC.length-1];
  box.innerHTML=hits.length?hits.slice(0,12).map(it=>{const s=src(it.src);return `<button type="button" class="ld-ri" data-ld="pick" data-kind="${it.kind}" data-id="${esc(it.id)}"><span class="ld-rn"><b>${esc(it.name)}</b>${it.co&&it.co!==it.name?`<small>${esc(it.co)}</small>`:""}</span><span class="ld-rs">${ldIco(s.ico,14)}${esc(s.name)} · ${it.kind==="deal"?"On your board · "+esc(stL(it.stage)):esc(it.stage||"")}</span></button>`}).join("")+(hits.length>12?`<p class="ld-rx">${ldNum(hits.length-12)} more. Keep typing to narrow it down.</p>`:"")
    :`<p class="ld-rx">No lead matches “${esc(q.value.trim())}”.</p>`;
  box.hidden=false;q.setAttribute("aria-expanded","true")}
function ldCloseRes(clear){const box=el("ldRes"),q=el("ldQ");if(box){box.hidden=true;box.innerHTML=""}if(q){q.setAttribute("aria-expanded","false");if(clear)q.value=""}}

/* ---------- opening and closing ---------- */
function ldOpenLead(kind,id){LD.lead={kind,id};LD.unsaved=false;LD.cmText="";LD.cmBusy=false;ldEdOpen(kind,id);ldModalDraw();ldLoadComments(kind,id)}
function ldCloseLead(force){const l=LD.lead;if(!l)return;
  if(!force&&LD.ed&&LD.ed.dirty){LD.unsaved=true;ldModalDraw();return}
  LD.lead=null;LD.ed=null;LD.unsaved=false;LD.cmText="";ldModalDraw();
  const t=[...document.querySelectorAll("#ldBody .sl-name")].find(b=>b.dataset.kind===l.kind&&b.dataset.id===l.id)||el("ldQ");if(t)t.focus({preventScroll:true})}
/* a deal on Kash's board: his own deal window (the Sales tab's), over this tab */
function ldOpenDeal(id){LD.dealFrom=id;
  /* what the Sales tab does before opening a deal (its closeAll and hideQ live inside its click handler) */
  S.openId=S.openCl=S.openSp=S.openCt=S.openG=null;S.ctEdit=null;S.ctDraft=null;S.ctBusy=false;S.del=null;S.back=null;S.hand=null;S.unsaved=null;S.draft=null;menuClose(false);
  if(el("slQr"))el("slQr").hidden=true;S.openSp=id;render()}
function ldShowSource(k){LD.view=k;ldRenderBody();scrollTo(0,0);const b=document.querySelector("#ldBody .ld-backb");if(b)b.focus({preventScroll:true})}
function ldShowAll(){const k=LD.view;LD.view=null;ldRenderBody();const r=[...document.querySelectorAll("#ldBody button.ld-tr")].find(b=>b.dataset.k===k);if(r)r.focus({preventScroll:true})}

/* ---------- saving: What's needed (with Save), comments (at once) ---------- */
async function ldApi(tool,args){
  if(window.claude?.use)return call(tool,args); /* the Claude copy: straight to the Airtable connector */
  const res=await fetch(location.pathname.replace(/\/$/,"")+"/leads-api",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tool,args})});
  let j={};try{j=await res.json()}catch(e){}if(!res.ok||j.isError)throw new Error("airtable");return j.payload||{}}
function ldSetNeed(kind,id,text){const r=ldRec(kind,id);if(!r)return;if(kind==="jade")r[L.needed]=text;else r.nd=text}
async function ldSave(thenClose){const e=LD.ed;if(!e||e.busy)return;const n=ldNewTd();if(n){e.td.push({t:n,d:false});const i=el("ldTdNew");if(i)i.value=""}
  e.td=e.td.filter(x=>String(x.t||"").trim());const T2=LD_TBL[e.kind],text=tdSer(e.td);e.busy=true;ldModalDraw();
  try{await ldApi("update_records_for_table",{baseId:T2.base,tableId:T2.tbl,records:[{id:e.id,fields:{[T2.f]:text||null}}]});
    ldSetNeed(e.kind,e.id,text);e.orig=text;e.dirty=false;e.busy=false;toast("Saved");
    if(thenClose)ldCloseLead(true);else ldModalDraw();ldRenderBody()}
  catch(err){e.busy=false;LD.unsaved=false;ldModalDraw();toast("Couldn't save. Try again.")}}
async function ldLoadComments(kind,id){const key=kind+":"+id,T2=LD_TBL[kind];if(!T2)return;LD.cm[key]={loading:true,list:[]};
  try{const p=await ldApi("list_record_comments",{baseId:T2.base,tableId:T2.tbl,recordId:id,pageSize:100});
    const list=(p.comments||[]).map(c=>{const users=Object.assign({},p.mentioned||{},c.mentioned||{});let t=String(c.text||"");t=t.replace(/@\[([A-Za-z0-9]+)\]/g,(m,u)=>"@"+((users[u]&&(users[u].displayName||users[u].name||users[u].email))||"someone"));
      const a=c.author||{};return {who:a.name||a.email||"Someone",when:c.createdTime?short(String(c.createdTime).slice(0,10)):"",text:t}}).reverse();
    LD.cm[key]={list}}catch(e){LD.cm[key]={list:[],err:true}}
  if(LD.lead&&LD.lead.kind===kind&&LD.lead.id===id)ldModalDraw()}
async function ldPostComment(){const l=LD.lead;if(!l||LD.cmBusy)return;const box=el("ldCm"),t=(box?box.value:LD.cmText).trim();if(!t){if(box)box.focus();return}
  const T2=LD_TBL[l.kind];LD.cmText=t;LD.cmBusy=true;ldModalDraw();
  try{await ldApi("create_record_comment",{baseId:T2.base,tableId:T2.tbl,recordId:l.id,text:t});LD.cmText="";LD.cmBusy=false;toast("Comment posted");await ldLoadComments(l.kind,l.id)}
  catch(e){LD.cmBusy=false;ldModalDraw();toast("Couldn't post the comment.")}}
/* to-do changes: into the window's draft, then redraw (focus where it makes sense) */
function ldTd(fn,focus){const e=LD.ed;if(!e)return;fn(e.td);ldMark();ldModalDraw();const f=focus&&el(focus);if(f)f.focus({preventScroll:true})}
function ldTdAdd(){const t=ldNewTd();if(!t){const i=el("ldTdNew");if(i)i.focus();return}el("ldTdNew").value="";ldTd(L2=>L2.push({t,d:false}),"ldTdNew")}

/* ---------- events ---------- */
function ldClick(e){
  const fold=e.target.closest('[data-act="fold"]');if(fold&&fold.closest("#ldBody")){toggleFold(fold.dataset.board,fold.dataset.stage);ldRenderBody();
    const b=[...document.querySelectorAll('#ldBody [data-act="fold"]')].find(x=>x.dataset.stage===fold.dataset.stage);if(b)b.focus({preventScroll:true});return}
  const t=e.target.closest("[data-ld]");
  if(!t){if(!e.target.closest(".ld-srch"))ldCloseRes(false);return}
  const a=t.dataset.ld;
  if(a==="lbg"){if(e.target===t)ldCloseLead();return}
  if(a==="unsbg"){if(e.target===t){LD.unsaved=false;ldModalDraw()}return}
  if(a==="open"){ldShowSource(t.dataset.k);return}
  if(a==="back"){ldShowAll();return}
  if(a==="more"){const k=LD.view+"|"+t.dataset.st;LD.more[k]=(LD.more[k]||LD_CAP)+LD_CAP;ldRenderBody();return}
  if(a==="lead"){ldOpenLead(t.dataset.kind,t.dataset.id);return}
  if(a==="deal"){ldOpenDeal(t.dataset.id);return}
  if(a==="pick"){ldCloseRes(false);if(t.dataset.kind==="deal")ldOpenDeal(t.dataset.id);else ldOpenLead(t.dataset.kind,t.dataset.id);return}
  if(a==="lclose"){ldCloseLead();return}
  if(a==="tdtog"){const i=+t.dataset.i;ldTd(L2=>{if(L2[i])L2[i].d=!L2[i].d},"ldTd-"+i);return}
  if(a==="tdrm"){const i=+t.dataset.i;ldTd(L2=>L2.splice(i,1),"ldTdNew");return}
  if(a==="tdadd"){ldTdAdd();return}
  if(a==="lsave"){ldSave(false);return}
  if(a==="cmpost"){ldPostComment();return}
  if(a==="unskeep"){LD.unsaved=false;ldModalDraw();const s=el("ldSave");if(s)s.focus();return}
  if(a==="unsdiscard"){LD.ed=null;ldCloseLead(true);return}
  if(a==="unssave"){ldSave(true);return}}
function ldInput(e){const t=e.target;
  if(t.id==="ldQ"){ldResults();return}
  if(t.id==="ldCm"){LD.cmText=t.value;ldGrow(t);return}
  if(t.id==="ldTdNew"){ldMark();return}
  if(t.dataset&&t.dataset.ld==="tdtext"&&LD.ed){const i=+t.dataset.i;if(LD.ed.td[i])LD.ed.td[i].t=t.value.replace(/\s*\n\s*/g," ");ldGrow(t);ldMark()}}
function ldKey(e){
  /* the Sales tab's deal window is open over this tab: its own keys handle it */
  const sm=el("slModal");if(sm&&sm.firstChild)return;
  if(e.key==="Escape"){if(LD.unsaved){e.preventDefault();LD.unsaved=false;ldModalDraw();return}if(LD.lead){e.preventDefault();ldCloseLead();return}
    const box=el("ldRes");if(box&&!box.hidden){e.preventDefault();ldCloseRes(true);return}return}
  if(e.key==="Enter"&&!e.isComposing&&e.target.id==="ldTdNew"){e.preventDefault();ldTdAdd();return}
  if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.ld==="tdtext"){e.preventDefault();e.target.blur();return}
  if(e.key==="Enter"&&e.target.id==="ldQ"){const f=document.querySelector("#ldRes .ld-ri");if(f){e.preventDefault();f.click()}return}
  if(e.key==="ArrowDown"&&e.target.id==="ldQ"){const f=document.querySelector("#ldRes .ld-ri");if(f){e.preventDefault();f.focus()}return}
  if((e.key==="ArrowDown"||e.key==="ArrowUp")&&e.target.classList&&e.target.classList.contains("ld-ri")){e.preventDefault();const all=[...document.querySelectorAll("#ldRes .ld-ri")],i=all.indexOf(e.target),n=all[i+(e.key==="ArrowDown"?1:-1)];if(n)n.focus();else if(e.key==="ArrowUp")el("ldQ").focus();return}
  /* keep keyboard focus inside the open window (or its Save question) */
  if(e.key==="Tab"&&LD.lead){const d=document.querySelector(LD.unsaved?"#ldModal .sl-cfm":"#ldModal .ld-ldlg");if(!d)return;const f=[...d.querySelectorAll("button:not([disabled]),[href],input,textarea,[tabindex]:not([tabindex='-1'])")];if(!f.length)return;
    if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}else if(!d.contains(document.activeElement)){e.preventDefault();f[0].focus()}}}

/* ---------- data ---------- */
async function ldFetch(){
  if(LD.loading)return;LD.loading=true;
  try{
    if(!window.claude?.use){
      const res=await fetch(location.pathname.replace(/\/$/,"")+"/leads",{cache:"no-store"});if(!res.ok)throw new Error("leads feed "+res.status);
      const j=await res.json();if(!j||j.ok!==true||!Array.isArray(j.rows))throw new Error("leads feed");
      Object.assign(LD,{rows:j.rows,ul:Array.isArray(j.ul)?j.ul:null,at:j.at||"",refreshing:!!j.refreshing,err:""});
    }else{
      /* the Claude copy: the same fields, read through the Airtable connector */
      const F={c:CL.co,o:CL.pqo,s:CL.src,k:KBF.cl,pq:CL.pq,uw:CL.uw,up:CL.up,ai:CL.ai,rf:CL.ref,so:CL.so,ev:CL.ev,ep:CL.ep,em:CL.email,ph:CL.phone,ig:CL.ig,li:CL.li,no:CL.notes,nx:CL.next,wa:CL.want,nd:CL_NEED,ow:CL.owner,lc:CL.lastc,ch:CL.chase,va:CL.val};
      const recs=await list(RB,T.cl,[CL.name].concat(Object.values(F)));
      const rows=recs.map(r=>{const n=String(r[CL.name]||"").trim();if(!n)return null;const x={i:r._id,n};Object.keys(F).forEach(k=>{const v=String(sv(r[F[k]])||"").trim();if(v)x[k]=v});return x}).filter(Boolean);
      Object.assign(LD,{rows,ul:null,at:new Date().toISOString(),refreshing:false,err:""});
    }
  }catch(e){LD.err=String(e&&e.message||e)}
  LD.loading=false;ldRender();
  /* the copy was older than 10 minutes: n8n is refreshing it now, so ask again shortly (a few times at most) */
  clearTimeout(LD.timer);if(LD.refreshing&&LD.tries<3){LD.tries++;LD.timer=setTimeout(()=>{const v=el("v-leads");if(v&&!v.hidden)ldFetch()},25000)}else if(!LD.refreshing)LD.tries=0}
/* the Sales feed is shared with the Sales tab: wait for it, then draw */
function ldAfterSales(){if(S.loading){setTimeout(ldAfterSales,150);return}ldRender()}
function ldOpen(){ldShell();if(!S.loaded&&!S.loading)load();if(!LD.rows&&!LD.loading)ldFetch();ldRender();ldAfterSales()}
/* whenever the Sales tab redraws (its data loaded, Kash saved in his deal window), the Leads tab follows if it is showing */
{const prevRender=render;render=function(){prevRender.apply(this,arguments);const v=el("v-leads");if(!v||v.hidden||!LD.shell)return;ldRenderBody();
  if(LD.dealFrom&&!S.openSp){const id=LD.dealFrom;LD.dealFrom=null;const b=[...document.querySelectorAll('#ldBody .sl-name')].find(x=>x.dataset.kind==="deal"&&x.dataset.id===id)||el("ldQ");if(b)b.focus({preventScroll:true})}}}
/* hook into the page's tabs (after the Sales tab's own hook). Leaving the tab keeps where Kash was (a pipeline, an open lead). */
if(typeof showTab==="function"){const prevLd=showTab;showTab=function(t){prevLd(t);const v=el("v-leads");if(v)v.hidden=t!=="leads";
  if(t==="leads"){if(el("asof"))el("asof").hidden=true;if(el("rvAsof"))el("rvAsof").hidden=true;ldOpen()}else{ldCloseRes(false)}}}
{const hb=el("refreshBtn");if(hb)hb.addEventListener("click",()=>{const v=el("v-leads");if(!v||v.hidden)return;if(!S.loading)load(true);LD.tries=0;ldFetch();ldAfterSales()})}
window.addEventListener("beforeunload",e=>{if(LD.ed&&LD.ed.dirty){e.preventDefault();e.returnValue=""}});
if(location.hash==="#leads")showTab("leads");
