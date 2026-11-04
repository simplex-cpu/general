/* ---------- v32: Content Drops. Every drop across episodes (ReLearn -> Content Drops tblrYPJbjvL8FZzic), in the To-do look.
   Add and edit in place; no delete. Status is worked out here from the Clips summary (clipAgg), never the Airtable Status formula. ---------- */
const DRT="tblrYPJbjvL8FZzic";
const DRF={n:"fldcwjpTJSJ6Hph0n",ep:"fldya9NZJA4Up7ijX",type:"fldW3uULfZGrud6vv",many:"fldZUOykd9zjc1ACW",pf:"fldtstRB2WlIkmWZ4",on:"fldFK9jHYM4mxgmf8",
  link:"fld5Egjl15qzBzdQ1",by:"fldJSmTXdBQd25tn2",note:"fldfhyjIkfK35RPgK",postBy:"fldQl24lcd8o5fEuH",vista:"fldtEFhCOjaUVFufP",allPosted:"fld1zDPKXuaRPtu6I"};
/* fields the feed and the save whitelist have today; the rest arrive with the Dashboard chat's draft */
const DR_LIVE=[DRF.n,DRF.ep,DRF.type,DRF.many,DRF.pf,DRF.on],DR_DRAFT=[DRF.link,DRF.by,DRF.note,DRF.postBy,DRF.vista,DRF.allPosted];
const DRTYPES=["B-roll","TP clip-up","Carousel","Thumbnail","Trailer","Other"];
const DRPF=[["recAnp033Xxor6YNC","B-roll","broll"],["recoxzL7ZO4twKWQa","Talking point","talk"],["recxx2Fa9fQPEorRz","Carousel","carousel"],["recXdTiSM2yLIK36o","Single graphic","single"],
  ["recPpZvzSzS013qkx","Trailer","trailer"],["recEjynpCfcBkKa14","Thumbnail","thumb"]];
const DRTK={"b-roll":"broll","tp clip-up":"talk",carousel:"carousel",thumbnail:"thumb",trailer:"trailer",other:"other"};
const DRKN={broll:"B-roll",talk:"Talking point",carousel:"Carousel",single:"Single graphic",trailer:"Trailer",thumb:"Thumbnail",other:"Other"};
const DRPLAN={broll:"fldzaj1hoB5NsfNQM",talk:"fldxkJkXe4sOm5j0z",carousel:"fldx1hizhzO8UuBHl"};
const DR={ep:"all",type:"all",q:"",draft:null,msg:"",bad:false,busy:{}};
const drRaw=()=>(MP.D&&MP.D.drops)||[];
const drLive=()=>!!tdCap().dropsDraft||drRaw().some(r=>r.fields&&DRF.link in r.fields);
const drW=()=>new Set([...DR_LIVE,...(drLive()?DR_DRAFT:[])]);
const drKey=f=>{const pf=ids(f[DRF.pf])[0],x=pf&&DRPF.find(z=>z[0]===pf);if(x)return x[2];return DRTK[String(nm(f[DRF.type])||"").toLowerCase()]||"other"};
const drEps=()=>{const seen=new Map();for(const m of mpAll())if(m.rid)seen.set(m.rid,{rid:m.rid,n:m.name,rel:m.rel});
  for(const r of drRaw()){const e=ids(r.fields[DRF.ep])[0];if(e&&!seen.has(e))seen.set(e,{rid:e,n:tdEpName(e)||"Episode",rel:""})}
  return [...seen.values()].sort((a,b)=>String(b.rel).localeCompare(String(a.rel))||a.n.localeCompare(b.n))};
function drRow(r){const f=r.fields||{},ep=ids(f[DRF.ep])[0]||"",by=ids(f[DRF.by]).map(tdCanonId)[0]||"",t=tdTeam().find(x=>x.id===by);
  return {id:r.id,r,n:String(plain(f[DRF.n])||""),ep,epN:tdEpName(ep),type:String(nm(f[DRF.type])||""),pf:ids(f[DRF.pf])[0]||"",k:drKey(f),many:+plain(f[DRF.many])||0,
    on:d10(plain(f[DRF.on]))||"",link:String(plain(f[DRF.link])||""),by,byN:t?tdCanonN(tdTeamName(t)):"",note:String(plain(f[DRF.note])||""),postBy:d10(plain(f[DRF.postBy]))||"",
    vista:!!f[DRF.vista],all:!!f[DRF.allPosted]}}
/* one status per episode + format: posted (Clips summary) against delivered (sum of How many) */
function drStatus(d,rows){const a=(MP.D&&MP.D.clipAgg&&MP.D.clipAgg.e&&MP.D.clipAgg.e[d.ep])||null;
  const same=rows.filter(x=>x.ep===d.ep&&x.k===d.k),dl=same.reduce((s,x)=>s+x.many,0),thumb=d.k==="thumb";
  const posted=!a?0:thumb?(+a.pt||0):(+(a.k||{})[d.k]||0),wait=a?(thumb?+a.rt||0:+a.r||0):0,sch=a?(thumb?+a.st||0:+a.s||0):0;
  const pid=DRPLAN[d.k],plan=pid&&d.ep&&MP.F[d.ep]?+plain(MP.F[d.ep][pid])||0:0,over=plan>0&&dl>plan;
  let txt,cls;if(d.k==="other"){txt="Not tracked";cls="nd"}
  else if(same.some(x=>x.all)||(dl>0&&posted>=dl)){txt="✅ All posted";cls="ok"}
  else{txt=`${posted} of ${dl} posted`+(wait?` · ${wait} waiting`:"")+(sch?` · ${sch} scheduled`:"");cls=posted?"pt":"no"}
  return {txt,cls,over,plan,dl,posted}}
function drList(){const all=drRaw().map(drRow).filter(d=>d.n.trim()),q=DR.q.trim().toLowerCase();
  const L=all.filter(d=>(DR.ep==="all"||d.ep===DR.ep)&&(DR.type==="all"||d.type===DR.type)&&(!q||(d.n+" "+d.epN+" "+d.note+" "+d.byN).toLowerCase().includes(q)));
  L.sort((a,b)=>(!a.on)-(!b.on)||String(b.on).localeCompare(String(a.on))||a.n.localeCompare(b.n));return {all,L}}
/* ---------- saving ---------- */
async function drSave(ops,name){const res=await svSend({rid:"",name:String(name||"").slice(0,120),id:""},{tab:"drops"},ops,[]);
  if(!res||!res.ok){const r=((res&&res.results)||[]).find(z=>!z.ok);throw new Error((r&&r.error)||"not saved")}return res}
async function drUpdate(id,f,label){const W=drW();for(const k of Object.keys(f))if(!W.has(k)){DR.msg="That field can't be saved from the dashboard yet.";DR.bad=true;mpRender();return}
  const r=drRaw().find(z=>z.id===id);if(!r)return;const old=Object.assign({},r.fields);
  Object.assign(r.fields,f);for(const [k,v] of Object.entries(f))if(v==null||v==="")delete r.fields[k];DR.busy[id]=1;mpRender();
  try{await drSave([{t:DRT,a:"update",id,f}],plain(r.fields[DRF.n]));DR.msg=label||"Saved.";DR.bad=false;try{drTrack(id,old,r.fields)}catch(e){console.error(e)}}
  catch(e){r.fields=old;DR.msg="Couldn't save that. Try again.";DR.bad=true}delete DR.busy[id];mpRender()}
async function drCreate(){const d=DR.draft;if(!d)return;const name=String(d.n||"").trim();if(!name){DR.msg="A drop needs a name.";DR.bad=true;mpRender();const i=$("drNewN");if(i)i.focus();return}
  const W=drW(),f={[DRF.n]:name};
  if(d.ep)f[DRF.ep]=[d.ep];if(d.type)f[DRF.type]=d.type;if(d.pf)f[DRF.pf]=[d.pf];if(+d.many>0)f[DRF.many]=+d.many;if(d.on)f[DRF.on]=d.on;
  if(d.link)f[DRF.link]=d.link;if(d.by)f[DRF.by]=[d.by];if(d.note)f[DRF.note]=d.note;
  for(const k of Object.keys(f))if(!W.has(k))delete f[k];
  DR.busy.add=1;mpRender();
  try{const res=await drSave([{t:DRT,a:"create",f}],name),id=((res.results||[])[0]||{}).id;if(!id)throw new Error("no id");
    if(MP.D){MP.D.drops=MP.D.drops||[];MP.D.drops.push({id,fields:Object.assign({},f)})}if(MP.raw&&Array.isArray(MP.raw.drops)&&MP.raw.drops!==MP.D.drops)MP.raw.drops.push({id,fields:Object.assign({},f)});
    DR.draft=null;DR.msg=`Added "${name}".`;DR.bad=false;try{const d=drRow({id,fields:f});if(d.ep&&typeof nsoRecord==="function")nsoRecord(d.ep,nsoSecOf(d.k),{t:"add",k:d.k,many:d.many,id})}catch(e){}}
  catch(e){DR.msg="Couldn't add that drop. Try again.";DR.bad=true}delete DR.busy.add;mpRender()}
/* v35: remember what changed, for the section's "Notify owner" summary */
const DRLAB={n:"Name",ep:"Episode",type:"Type",pf:"Plan format",many:"How many",on:"Delivered on",byN:"Dropped by",link:"Link",note:"Notes",postBy:"Post by",vista:"Vista",all:"All posted"};
function drTrack(id,oldF,newF){if(typeof nsoRecord!=="function")return;const a=drRow({id,fields:oldF}),b=drRow({id,fields:newF});
  const show=(k,v)=>k==="ep"?(tdEpName(v)||"–"):k==="pf"?((DRPF.find(z=>z[0]===v)||[,v])[1]||"–"):typeof v==="boolean"?(v?"yes":"no"):v;
  for(const k of Object.keys(DRLAB))if(String(a[k])!==String(b[k]))nsoRecord(b.ep||a.ep,nsoSecOf(b.k),{t:"edit",id,label:DRLAB[k],from:show(k,a[k]),to:show(k,b[k])})}
/* the per-episode / per-section "Notify owner" bars: any section with unsent changes, plus both sections of the episode picked in the filter */
function drNotifyBars(){if(typeof nsoBar!=="function")return "";const keys=new Set(Object.keys(NSO.chg).filter(k=>NSO.chg[k].length));
  if(DR.ep!=="all"){keys.add(DR.ep+"|thumbDrops");keys.add(DR.ep+"|clipDrops")}
  const L=[...keys].map(k=>k.split("|")).filter(([r,s2])=>r&&/Drops$/.test(s2));if(!L.length)return "";
  return `<section class="td2-card dr-nso" aria-label="Notify the next step owner">${L.map(([r,s2])=>`<div class="dr-nsoh"><b>${esc(tdEpName(r)||"Episode")}</b> · ${NSO_SECS[s2]}</div>${nsoBar(r,s2)}`).join("")}</section>`}
/* ---------- drawing ---------- */
const drOpts=(L,v,blank)=>(blank!=null?`<option value="">${esc(blank)}</option>`:"")+L.map(([k,l])=>`<option value="${esc(k)}"${String(k)===String(v)?" selected":""}>${esc(l)}</option>`).join("");
const drPeople=()=>tdPeople().filter(p=>p.id).map(p=>[p.id,p.n]);
const DRCOLS="minmax(180px,1.4fr) 150px 118px 128px 64px 136px 110px 110px 180px minmax(160px,1fr) 136px 64px 72px";
const DRHEAD=["Drop","Episode","Type","Plan format","How many","Delivered on","Dropped by","Link","Status","Notes","Post by","Vista","All posted"];
function drRowH(d,rows,live){const b=DR.busy[d.id]?" disabled":"",S=drStatus(d,rows),A=(f,extra)=>`data-tdf="dr_${f}" data-id="${d.id}"${b}${extra||""}`,na=`<span class="dr-na">–</span>`;
  const sel=(f,L,v,blank,lab)=>`<select class="td2-c dr-s" ${A(f)} aria-label="${lab}">${drOpts(L,v,blank)}</select>`;
  return `<div class="td2-r" role="row" data-id="${d.id}">
    <span role="cell"><input class="td2-c nm" ${A("n")} value="${esc(d.n)}" aria-label="Drop name" title="${esc(d.n)}"></span>
    <span role="cell">${sel("ep",drEps().map(e=>[e.rid,e.n]),d.ep,"No episode","Episode")}</span>
    <span role="cell">${sel("type",DRTYPES.map(t=>[t,t]),d.type,"Choose…","Type")}</span>
    <span role="cell">${sel("pf",DRPF.map(z=>[z[0],z[1]]),d.pf,"None","Plan format")}</span>
    <span role="cell"><input class="td2-c" type="number" min="0" ${A("many")} value="${d.many||""}" aria-label="How many"></span>
    <span role="cell"><input class="td2-c" type="date" ${A("on")} value="${d.on}" aria-label="Delivered on"></span>
    <span role="cell">${live?sel("by",drPeople(),d.by,"–","Dropped by"):na}</span>
    <span role="cell" class="dr-lk">${live?`<input class="td2-c" type="url" ${A("link")} value="${esc(d.link)}" placeholder="Paste link" aria-label="Files link">${d.link&&/^https?:\/\//.test(d.link)?`<a href="${esc(d.link)}" target="_blank" rel="noopener" class="dr-open">Open</a>`:""}`:na}</span>
    <span role="cell" class="dr-st"><span class="dr-pill ${S.cls}" title="${S.posted} posted of ${S.dl} delivered (all drops of this format for the episode)">${esc(S.txt)}</span>${S.over?`<span class="dr-over" title="Planned ${S.plan}, delivered ${S.dl}">⚠️ Delivered more than planned</span>`:""}</span>
    <span role="cell">${live?`<input class="td2-c ds" ${A("note")} value="${esc(d.note)}" placeholder="Add a note" aria-label="Notes" title="${esc(d.note)}">`:na}</span>
    <span role="cell">${live?`<input class="td2-c" type="date" ${A("postBy")} value="${d.postBy}" aria-label="Post by">`:na}</span>
    <span role="cell" class="dr-cb">${live?`<input type="checkbox" ${A("vista")}${d.vista?" checked":""} aria-label="Scheduled in Vista">`:na}</span>
    <span role="cell" class="dr-cb">${live?`<input type="checkbox" ${A("allPosted")}${d.all?" checked":""} aria-label="All posted">`:na}</span></div>`}
function drNewH(live){const d=DR.draft,D=(f,ex)=>`data-drn="${f}"${ex||""}`,na=`<span class="dr-na">–</span>`;
  return `<div class="td2-r new dr-new" role="row">
    <span role="cell"><input class="td2-c nm" id="drNewN" ${D("n")} value="${esc(d.n||"")}" placeholder="Drop name (required)" aria-label="New drop name" aria-required="true"></span>
    <span role="cell"><select class="td2-c dr-s" ${D("ep")} aria-label="Episode">${drOpts(drEps().map(e=>[e.rid,e.n]),d.ep,"Episode…")}</select></span>
    <span role="cell"><select class="td2-c dr-s" ${D("type")} aria-label="Type">${drOpts(DRTYPES.map(t=>[t,t]),d.type,"Type…")}</select></span>
    <span role="cell"><select class="td2-c dr-s" ${D("pf")} aria-label="Plan format">${drOpts(DRPF.map(z=>[z[0],z[1]]),d.pf,"None")}</select></span>
    <span role="cell"><input class="td2-c" type="number" min="0" ${D("many")} value="${esc(d.many||"")}" aria-label="How many"></span>
    <span role="cell"><input class="td2-c" type="date" ${D("on")} value="${esc(d.on||"")}" aria-label="Delivered on"></span>
    <span role="cell">${live?`<select class="td2-c dr-s" ${D("by")} aria-label="Dropped by">${drOpts(drPeople(),d.by,"–")}</select>`:na}</span>
    <span role="cell">${live?`<input class="td2-c" type="url" ${D("link")} value="${esc(d.link||"")}" placeholder="Paste link" aria-label="Files link">`:na}</span>
    <span role="cell" class="dr-acts"><button type="button" class="td2-pri sm" data-dract="save"${DR.busy.add?" disabled":""}>${DR.busy.add?"Adding…":"Add drop"}</button><button type="button" class="td2-ghost sm" data-dract="cancel">Cancel</button></span>
    <span role="cell">${live?`<input class="td2-c ds" ${D("note")} value="${esc(d.note||"")}" placeholder="Add a note" aria-label="Notes">`:na}</span><span></span><span></span><span></span></div>`}
function mpDrops(){const live=drLive(),{all,L}=drList();const eps=drEps().filter(e=>all.some(d=>d.ep===e.rid));
  const ctl=`<div class="td2-ctl"><label class="td2-lab">Episode${tdSelW('data-drk="ep" aria-label="Episode"',[["all","All episodes"],...eps.map(e=>[e.rid,e.n])],DR.ep)}</label>
    <label class="td2-lab">Type${tdSelW('data-drk="type" aria-label="Type"',[["all","All types"],...DRTYPES.map(t=>[t,t])],DR.type)}</label>
    <label class="td2-lab dr-q">Search<input class="td2-in" type="search" id="drQ" value="${esc(DR.q)}" placeholder="Drop, episode, note…" aria-label="Search drops"></label>
    <span class="td2-sp"></span><span class="td2-nsel">${pl(L.length,"drop")}${L.length!==all.length?` of ${all.length}`:""}</span></div>`;
  const msg=DR.msg?`<p class="td2-msg${DR.bad?" bad":""}" role="status">${esc(DR.msg)}</p>`:"";
  const note=live?"":`<p class="dr-note">Link, Dropped by, Notes, Post by, Vista and All posted switch on with the next back-end update.</p>`;
  const body=L.map(d=>drRowH(d,all,live)).join("");
  return `<div class="td2 dr"><h1 class="td2-h1">Content Drops</h1>${ctl}${msg}${note}${drNotifyBars()}<section class="td2-card" aria-label="Content drops"><div class="td2-scroll"><div class="td2-t" role="table" aria-label="Content drops" style="--cols:${DRCOLS}">
    <div class="td2-r hd" role="row">${DRHEAD.map(h=>`<span role="columnheader">${h}</span>`).join("")}</div>
    ${body||(DR.draft?"":`<div class="td2-empty">${all.length?"No drops match these filters.":"No drops yet."}</div>`)}${DR.draft?drNewH(live):""}
    <button type="button" class="td2-add" data-dract="add">${TDI.plus}Add a drop</button></div></div></section></div>`}
/* ---------- wiring ---------- */
MP_SCOPE0.drops="all";
ASKQ.drops=["Which drops still have pieces to post?","Which episode got more than planned?","What was delivered this week?"];
const drIn=t=>{const r=$("mpRoot");return r&&r.contains(t)&&MP.tab==="drops"};
document.addEventListener("click",ev=>{const t=ev.target;if(!drIn(t))return;const b=t.closest("[data-dract]");if(!b)return;const a=b.dataset.dract;
  if(a==="add"){DR.draft={n:"",ep:DR.ep!=="all"?DR.ep:"",type:DR.type!=="all"?DR.type:"",pf:"",many:"",on:TODAY,by:tdMeV()&&tdPerson(tdMeV())&&tdPerson(tdMeV()).id||""};DR.msg="";mpRender();requestAnimationFrame(()=>{const i=$("drNewN");if(i)i.focus()})}
  else if(a==="cancel"){DR.draft=null;mpRender()}else if(a==="save")drCreate()});
document.addEventListener("input",ev=>{const t=ev.target;if(!drIn(t))return;
  if(t.dataset.drn&&DR.draft){DR.draft[t.dataset.drn]=t.value;return}
  if(t.id==="drQ"){DR.q=t.value;mpRender()}});
document.addEventListener("change",ev=>{const t=ev.target;if(!drIn(t))return;
  if(t.dataset.drk){DR[t.dataset.drk]=t.value;DR.msg="";mpRender();return}
  if(t.dataset.drn&&DR.draft){DR.draft[t.dataset.drn]=t.value;return}
  const m=/^dr_(\w+)$/.exec(t.dataset.tdf||"");if(!m)return;const k=m[1],id=t.dataset.id,r=drRaw().find(z=>z.id===id);if(!r)return;const d=drRow(r),fid=DRF[k];
  if(k==="n"){const v=t.value.trim();if(!v){t.value=d.n;DR.msg="A drop needs a name.";DR.bad=true;mpRender();return}if(v!==d.n)drUpdate(id,{[fid]:v},"Name saved.");return}
  if(k==="ep"||k==="pf"||k==="by"){drUpdate(id,{[fid]:t.value?[t.value]:null},"Saved.");return}
  if(k==="type"){drUpdate(id,{[fid]:t.value||null},"Type saved.");return}
  if(k==="many"){const v=t.value===""?null:Math.max(0,Math.round(+t.value||0));drUpdate(id,{[fid]:v},"Count saved.");return}
  if(k==="on"||k==="postBy"){const v=t.value||null;if(v&&!/^20\d\d-\d\d-\d\d$/.test(v))return;drUpdate(id,{[fid]:v},"Date saved.");return}
  if(k==="vista"||k==="allPosted"){drUpdate(id,{[fid]:t.checked},"Saved.");return}
  if(k==="link"||k==="note"){const v=t.value.trim();if(v!==(k==="link"?d.link:d.note))drUpdate(id,{[fid]:v||null},k==="link"?"Link saved.":"Note saved.")}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(!drIn(t))return;
  if(ev.key==="Escape"&&DR.draft){DR.draft=null;mpRender();return}
  if(ev.key==="Enter"&&t.matches("input.td2-c")&&t.type!=="checkbox"){ev.preventDefault();if(t.dataset.drn){DR.draft[t.dataset.drn]=t.value;drCreate()}else t.blur()}});
