<script>
/* ---------- Inbox, first called "Requests from Team" (Karen, 13 Nov 2026): its own tab, on Kash's link only.
   Tasks assigned to Kash in Rise Voice's Task Manager (the "All Projects" interface page): still open, or Done in the last 30 days.
   Read live from /requests (Kash's link) or through Airtable in the Claude copy. Status changes use the same route as the
   Project Management tab. Nothing else is written. ---------- */
(()=>{
const RQ={items:null,err:"",loading:false,at:0,done:false,open:new Set(),busy:new Set(),msg:""};
const RQBASE="appOttHso6hYjBXhw",RQTBL="tbl7gVj7Owmn5WBEW",KASH="usrHUnNBAYxPTPuaw";
const RQST=["To Do","In Progress","Review","Blocked","Done"];
const RQF={n:"fldffOVMyhrlvRBgZ",desc:"fldGm01KMjpTIR7Ht",brand:"flddWIYoBLbOIacl8",st:"fldEzDPoSmPt87LOB",who:"fldvasDBd2huhGhO7",due:"fldsGUdBFJH5kL2iI",
  by:"fldCakdv1KCw1vZzo",at:"fldrffvjIV1LybagZ",pri:"fldmwcd0McGsxXDUr",att:"fldDJ20MYOmu9y3fg",blk:"fldRaVK0HihpSYsrC",chg:"fldTSkFkSeNrnVZ49",start:"fldzhgL5PuYeYZrW9"};
const q=id=>document.getElementById(id);
const h=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const today=()=>new Date(Date.now()+4*36e5).toISOString().slice(0,10); /* Dubai date, as the rest of the page */
const dubaiDay=iso=>{const t=Date.parse(iso||"");return isFinite(t)?new Date(t+4*36e5).toISOString().slice(0,10):null};
const fmt=d=>{if(!d)return "";const [y,m,dd]=d.split("-");return (+dd)+" "+MO[+m-1]+(y!==today().slice(0,4)?" "+y:"")};
const days=(a,b)=>Math.round((Date.parse(a+"T00:00:00Z")-Date.parse(b+"T00:00:00Z"))/864e5);
const cls=s=>({"To Do":"todo","In Progress":"prog","Review":"rev","Blocked":"blk","Done":"done","On Hold":"hold"})[s]||"none";

/* the same shape the /requests feed returns, built from Airtable rows (Claude copy) */
function rqSlim(records){const cutoff=new Date(Date.now()-30*864e5).toISOString(),txt=v=>(v&&typeof v==="object"?v.name:v)||"",out=[],seen=new Set();
  const day=v=>/^\d{4}-\d{2}-\d{2}/.test(String(v||""))?String(v).slice(0,10):null;
  for(const r of records||[]){if(!r||seen.has(r.id))continue;const f=r.fields||r.cellValuesByFieldId||{},who=Array.isArray(f[RQF.who])?f[RQF.who].filter(u=>u&&u.id):[];
    if(!who.some(u=>u.id===KASH))continue;const st=txt(f[RQF.st]),chg=f[RQF.chg]||f[RQF.at]||r.createdTime||"";if(st==="Done"&&chg<cutoff)continue;seen.add(r.id);
    out.push({id:r.id,n:String(f[RQF.n]||"").trim()||"Untitled task",desc:String(f[RQF.desc]||"").trim().slice(0,4000),st,due:day(f[RQF.due]),start:day(f[RQF.start]),pri:txt(f[RQF.pri]),
      by:f[RQF.by]&&f[RQF.by].name?String(f[RQF.by].name):"",at:f[RQF.at]||r.createdTime||null,chg:f[RQF.chg]||null,also:who.filter(u=>u.id!==KASH).map(u=>String(u.name||"")).filter(Boolean),
      brand:(Array.isArray(f[RQF.brand])?f[RQF.brand]:[]).map(x=>typeof x==="object"&&x?x.id:x).filter(x=>/^rec[A-Za-z0-9]{14}$/.test(String(x))),blk:String(f[RQF.blk]||"").trim().slice(0,1000),
      att:(Array.isArray(f[RQF.att])?f[RQF.att]:[]).filter(a=>a&&/^https:\/\//.test(String(a.url||""))).slice(0,10).map(a=>({name:String(a.filename||"Attachment").slice(0,120),url:a.url}))})}
  return out}

async function rqLoad(){if(RQ.loading)return;RQ.loading=true;RQ.err="";if(!RQ.items)rqRender();
  try{let items;
    if(window.claude?.use){const mcp=await window.claude.use("mcp");
      const r=await mcp.callTool("Airtable","list_records_for_table",{baseId:RQBASE,tableId:RQTBL,fieldIds:Object.values(RQF),pageSize:500,
        filters:{operands:[{operator:"contains",operands:["fldJYAC0q9DWO19E7","Kash"]}]}},{cache:false});
      items=rqSlim(((r&&r.payload)||r||{}).records||[])}
    else if(/^https?:$/.test(location.protocol)){const res=await fetch(location.pathname.replace(/\/$/,"")+"/requests",{cache:"no-store"});
      const j=await res.json().catch(()=>({}));if(!res.ok||!j.ok||!Array.isArray(j.items))throw new Error("requests");items=j.items}
    else throw new Error("offline");
    RQ.items=items;RQ.at=Date.now()}
  catch(e){RQ.err="Couldn't load the team's requests."}
  RQ.loading=false;rqRender()}

/* plain text with line breaks; [text](https://…) and bare https links become links; **bold** stays bold */
function rqText(s){let t=h(s);
  t=t.replace(/\[([^\]\n]{1,200})\]\((https:\/\/[^\s)]+)\)/g,(m,a,u)=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${a}</a>`);
  t=t.replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g,(m,p,u)=>`${p}<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
  return t.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/(^|\n)#{1,6} /g,"$1")}
function rqDue(x){if(!x.due)return "";const d=days(x.due,today());
  if(x.st==="Done")return `<span>Due ${fmt(x.due)}</span>`;
  if(d<0)return `<span class="rq-late">${-d===1?"1 day":-d+" days"} late (due ${fmt(x.due)})</span>`;
  return `<span${d<=1?' class="rq-soon"':""}>${d===0?"Due today":d===1?"Due tomorrow":"Due "+fmt(x.due)}</span>`}
function rqClient(x){const N=typeof RVN!=="undefined"&&RVN?RVN:{};return x.brand.map(i=>N[i]).filter(Boolean).join(", ")}
function rqDetail(x){const rows=[];
  if(x.desc)rows.push(`<div class="rq-desc">${rqText(x.desc)}</div>`);else rows.push(`<p class="rq-none">No description.</p>`);
  const facts=[];
  facts.push(["Asked by",x.by?`${h(x.by)}${x.at?" on "+fmt(dubaiDay(x.at)):""}`:(x.at?"Added "+fmt(dubaiDay(x.at)):"")]);
  if(x.also.length)facts.push(["Also assigned",h(x.also.join(", "))]);
  const c=rqClient(x);if(c)facts.push(["Client",h(c)]);
  if(x.start)facts.push(["Starts",fmt(x.start)]);
  if(x.blk)facts.push(["Blocked by",h(x.blk)]);
  if(x.att.length)facts.push(["Files",x.att.map(a=>`<a href="${h(a.url)}" target="_blank" rel="noopener noreferrer">${h(a.name)}</a>`).join(", ")]);
  rows.push(`<dl class="rq-facts">${facts.filter(f=>f[1]).map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`);
  return rows.join("")}
function rqSel(x){const opts=RQST.includes(x.st)?RQST:[x.st||"No status",...RQST];
  return `<select class="rq-st rq-s-${cls(x.st)}" data-rqst="${h(x.id)}" aria-label="Status of ${h(x.n)}"${RQ.busy.has(x.id)?" disabled":""}>${opts.map(s=>`<option value="${h(s)}"${s===(x.st||"No status")?" selected":""}${RQST.includes(s)?"":" disabled"}>${h(s)}</option>`).join("")}</select>`}
function rqSorted(L){const t=today(),open=L.filter(x=>x.st!=="Done"),done=L.filter(x=>x.st==="Done");
  open.sort((a,b)=>{const la=a.due&&a.due<t?0:1,lb=b.due&&b.due<t?0:1;return la-lb||String(a.due||"9").localeCompare(String(b.due||"9"))||String(b.at||"").localeCompare(String(a.at||""))});
  done.sort((a,b)=>String(b.chg||b.at||"").localeCompare(String(a.chg||a.at||"")));
  return RQ.done?[...open,...done]:open}

function rqRender(){const list=q("rqList"),cnt=q("rqCount"),msg=q("rqMsg");if(!list)return;
  if(msg)msg.textContent=RQ.msg||"";
  if(!RQ.items){cnt.textContent="";list.innerHTML=RQ.err?`<div class="rq-empty"><p>${h(RQ.err)}</p><button type="button" class="rq-retry" id="rqRetry">Try again</button></div>`:`<p class="rq-empty">Loading requests…</p>`;
    const b=q("rqRetry");if(b)b.onclick=rqLoad;return}
  const t=today(),open=RQ.items.filter(x=>x.st!=="Done"),late=open.filter(x=>x.due&&x.due<t).length,nDone=RQ.items.length-open.length;
  const upd=RQ.at?"updated "+new Date(RQ.at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"";
  cnt.innerHTML=[open.length?`${open.length} open${late?` · <span class="rq-late">${late} late</span>`:""}`:"",upd].filter(Boolean).join(" · ");
  const dl=q("rqDoneLab");if(dl)dl.hidden=!nDone&&!RQ.done;
  const L=rqSorted(RQ.items);
  if(!L.length){list.innerHTML=`<div class="rq-empty"><p><b>Nothing waiting on you from the team.</b></p><p>When someone assigns you a task in Task Manager, it shows up here.</p></div>`;return}
  list.innerHTML=`<ul class="rq-list">${L.map(x=>{const op=RQ.open.has(x.id),late=x.st!=="Done"&&x.due&&x.due<t,meta=[x.by?"From "+h(x.by):"",x.at?"asked "+fmt(dubaiDay(x.at)):"",rqDue(x),x.pri?`<span class="rq-pri rq-p-${h(x.pri.toLowerCase())}">${h(x.pri)}</span>`:""].filter(Boolean);
    return `<li class="rq-i${late?" rq-lrow":""}${x.st==="Done"?" rq-drow":""}"><div class="rq-row">
      <button type="button" class="rq-t" data-rq="${h(x.id)}" aria-expanded="${op}" aria-controls="rqd-${h(x.id)}"><span class="rq-chev" aria-hidden="true"></span><span class="rq-name">${h(x.n)}</span></button>
      ${rqSel(x)}
      <div class="rq-meta">${meta.join('<span class="rq-dot" aria-hidden="true">·</span>')}</div></div>
      <div class="rq-d" id="rqd-${h(x.id)}"${op?"":" hidden"}>${op?rqDetail(x):""}</div></li>`}).join("")}</ul>`;
  list.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>{const id=b.dataset.rq;RQ.open.has(id)?RQ.open.delete(id):RQ.open.add(id);RQ.msg="";rqRender();const nb=list.querySelector(`[data-rq="${CSS.escape(id)}"]`);if(nb)nb.focus()});
  list.querySelectorAll("[data-rqst]").forEach(s=>s.onchange=()=>rqSetStatus(s.dataset.rqst,s.value))}

async function rqSetStatus(id,v){const x=(RQ.items||[]).find(i=>i.id===id);if(!x||!RQST.includes(v)||x.st===v)return;
  const was=x.st,wasChg=x.chg;x.st=v;x.chg=new Date().toISOString();RQ.busy.add(id);RQ.msg="";rqRender();
  try{if(window.claude?.use){const mcp=await window.claude.use("mcp");await mcp.callTool("Airtable","update_records_for_table",{baseId:RQBASE,tableId:RQTBL,records:[{id,fields:{[RQF.st]:v}}],typecast:true},{cache:false})}
    else{const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"pmstatus",base:"rv",id,status:v}),cache:"no-store"});
      const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error("save")}
    if(typeof PM!=="undefined"&&PM&&PM.st)PM.st[id]=v; /* keep the Project Management tab in step */
    RQ.msg=v==="Done"&&!RQ.done?`Done: "${x.n}" moved out of the list.`:`Saved: "${x.n}" is now ${v}.`}
  catch(e){x.st=was;x.chg=wasChg;RQ.msg=`Couldn't change that status. Try again.`}
  RQ.busy.delete(id);rqRender();const s=q("rqList")&&q("rqList").querySelector(`[data-rqst="${CSS.escape(id)}"]`);if(s)s.focus();else{const m=q("rqMsg");if(m)m.focus()}}

/* the tab: loads when first opened, again on Refresh, and when reopened after 5 minutes */
const dn=q("rqDone");if(dn)dn.onchange=()=>{RQ.done=dn.checked;RQ.msg="";rqRender()};
{const rb=q("refreshBtn");if(rb)rb.addEventListener("click",()=>{const v=q("v-requests");if(v&&!v.hidden)rqLoad()})}
{const st0=showTab;showTab=function(t){st0(t);const v=q("v-requests");if(!v)return;v.hidden=t!=="requests";
  if(t==="requests"){["asof","rvAsof"].forEach(i=>{const e=q(i);if(e)e.hidden=true});if(!RQ.at||Date.now()-RQ.at>5*6e4)rqLoad();else rqRender()}}}
if(location.hash==="#requests")showTab("requests");
})();
</script>
