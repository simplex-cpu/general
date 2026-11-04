/* ---------- v35: "Next step owner" + Send / Notify owner (Karen's spec).
   Owners are saved per episode per section in ONE Episodes long-text JSON field "Next step owners"
   ({"thumbIdeas":"Jade","clipBrief":"Marc","thumbDrops":"Cristiana","clipDrops":"Cristiana"}).
   Until the field exists (NSO_FIELD below is a placeholder) the choice lives in page state; sending always works. ---------- */
/* ===== placeholders: drop the real IDs in here (one place) ===== */
const NSO_FIELD="fld0xaXuQ2C6kv4pB";        /* Episodes long text "Next step owners" (JSON: owners + "<section>Notified" ISO times) */
const DROP_MODIFIED="fldvNUKsCXNBhwLTd"; /* Content Drops "Last modified" (last-modified time) */
const DROP_CREATED="fldfsmlIL0NzAXKOs";       /* Content Drops "Dropped on" (created time, already in the feed) */
const NOTE_KIND="note";                      /* notify v2: the server posts the page's text verbatim (+ an Open in dashboard link) */
/* ================================================================ */
const NSO_SECS={thumbIdeas:"Thumbnail text ideas",clipBrief:"Clip brief",thumbDrops:"Thumbnail drops",clipDrops:"Clip drops"};
const NSO_DEF={thumbIdeas:"Jade",clipBrief:"Editors",thumbDrops:"",clipDrops:""};
const NSO={ov:{},sent:{},chg:{},sentU:{},msg:{},busy:{}};
const nsoK=(rid,sec)=>rid+"|"+sec;
const nsoReal=()=>!/^fldNSO/.test(NSO_FIELD);
const nsoInFeed=()=>nsoReal()&&Object.values(MP.F||{}).some(f=>f&&NSO_FIELD in f);
function nsoSaved(rid){if(!nsoReal())return {};try{const v=plain((MP.F[rid]||{})[NSO_FIELD]);return v?JSON.parse(v)||{}:{}}catch(e){return {}}}
const nsoGet=(rid,sec)=>{const k=nsoK(rid,sec);return k in NSO.ov?NSO.ov[k]:(nsoSaved(rid)[sec]||NSO_DEF[sec]||"")};
/* the dashboard's people list (Shay / VA folded into Dakshaya / Jade, as in the To-do), plus Editors as a group */
/* v36: only people who can get a Slack DM (caps.slackPeople, else the known list), sent exactly as listed */
const nsoPeople=()=>{const L=typeof tdSlackNames==="function"?tdSlackNames():["Karen","Kash","CJ","Jade","Dakshaya","Cristiana","Stephen","Jean","Johan","Alex","Marc","Sarah"];for(const e of EDITORS)if(!L.includes(e))L.push(e);return L.sort((a,b)=>a.localeCompare(b))};
const nsoTo=v=>v==="Editors"?EDITORS.slice():v?[v]:[];
const nsoLabel=v=>v==="Editors"?"the editors ("+EDITORS.join(" and ")+")":v;
const nsoEp=rid=>{const m=mpAll().find(z=>z.rid===rid);return {rid,name:m?m.name:(typeof tdEpName==="function"?tdEpName(rid):""),id:m?m.id:""}};
const nsoRefresh=()=>{try{if(typeof M!=="undefined"&&M.id)mRender()}catch(e){}if(typeof MP!=="undefined"&&(MP.tab==="drops"))mpRender()};
async function nsoSetOwner(rid,sec,v){const k=nsoK(rid,sec);NSO.ov[k]=v;NSO.msg[k]=null;nsoRefresh();
  if(!nsoInFeed())return; /* field not there yet: keep it in page state */
  const json=JSON.stringify(Object.assign({},nsoSaved(rid),{[sec]:v}));
  try{const res=await svSend(nsoEp(rid),{tab:"owners"},[{t:"tblx8C7czyAikbbVp",a:"update",id:rid,f:{[NSO_FIELD]:json}}],[]);
    if(res&&res.ok)MP.F[rid]=Object.assign(MP.F[rid]||{},{[NSO_FIELD]:json});else NSO.msg[k]={bad:1,t:"Owner kept for now (couldn't save it yet)."}}
  catch(e){NSO.msg[k]={bad:1,t:"Owner kept for now (couldn't save it yet)."}}nsoRefresh()}
/* v36 (notify v2): the page writes the DM text and sends {to, kind:"note", text}; the server posts it as is and adds the
   "Open in dashboard" link from epKey + tab in the save body. The reply lists notified:[names] and skipped:[{to,why}].
   A reply without those lists is the old back end: later sends use kind "send" (nothing is sent twice). */
const nsoMe=()=>(typeof tdMeName==="function"&&tdMeName())||window.__rlViewer||"the dashboard";
const nsoUseNote=()=>!NSO.noNote;
const nsoKindBad=res=>!!res&&res.ok===false&&(res.unknownKind||/unknown kind/i.test(String(res.error||"")));
const NSO_TAB={thumbIdeas:"thumbs",thumbDrops:"thumbs",clipBrief:"clips",clipDrops:"clips"}; /* window tab the DM link opens */
const nsoSelf=n=>{const me=nsoMe();return !!me&&String(n).toLowerCase()===String(me).toLowerCase()};
async function nsoNotify(rid,sec,what,text){const k=nsoK(rid,sec),all=nsoTo(nsoGet(rid,sec)),to=all.filter(n=>!nsoSelf(n));
  if(!all.length){NSO.msg[k]={bad:1,t:"Pick the next step owner first."};nsoRefresh();return null}
  if(!to.length){NSO.msg[k]={bad:1,t:"You can't message yourself. Pick someone else."};nsoRefresh();return null}
  NSO.busy[k]=1;nsoRefresh();let res=null;const tab=NSO_TAB[sec]||"overview";
  const list=note=>{const body=String(text||"").trim().slice(0,note?3000:1500);return to.slice(0,20).map(n=>note?{to:n,kind:NOTE_KIND,text:body}:{to:n,kind:"send",what,text:body})};
  try{const note=nsoUseNote();res=await svSend(nsoEp(rid),{tab},[],list(note));
    if(note&&nsoKindBad(res)){NSO.noNote=true;res=await svSend(nsoEp(rid),{tab},[],list(false))}
    else if(note&&res&&!Array.isArray(res.notified)&&!Array.isArray(res.skipped))NSO.noNote=true;
    if(res&&res.ok===false&&!(res.results||[]).length&&!(res.rejected||[]).length&&!Array.isArray(res.notified))throw new Error("not sent");
    const sk=[].concat(res&&(res.skipped||res.undelivered||res.notSent||res.noSlack)||[]).map(z=>typeof z==="string"?{to:z}:{to:(z&&(z.to||z.name))||"",why:z&&z.why}).filter(z=>z.to);
    const got=Array.isArray(res&&res.notified)?res.notified.slice():to.filter(n=>!sk.some(z=>z.to===n));
    if(got.length)NSO.sent[k]={to:got.join(", "),at:TODAY};
    const parts=[];if(got.length)parts.push(`Sent to ${got.join(", ")}.`);if(sk.length)parts.push(sk.map(z=>`Not sent to ${z.to}${z.why?` (${z.why})`:""}.`).join(" "));
    NSO.msg[k]={bad:!!sk.length,t:parts.join(" ")||"Nothing was sent."}}
  catch(e){NSO.msg[k]={bad:1,t:"Couldn't send that. Try again."};res=null}
  delete NSO.busy[k];nsoRefresh();return res}
const nsoPick=(rid,sec)=>`<label class="nso-pk"><span>Next step owner</span><select class="m2-in nso-sel" data-nsok="${rid}|${sec}" aria-label="Next step owner for ${NSO_SECS[sec]}">${nsoGet(rid,sec)?"":`<option value="">Choose…</option>`}
  ${["Editors",...nsoPeople().filter(n=>!nsoSelf(n))].map(n=>`<option value="${esc(n)}"${n===nsoGet(rid,sec)?" selected":""}>${esc(n==="Editors"?"Editors ("+EDITORS.join(", ")+")":n)}</option>`).join("")}</select></label>`;
const nsoMsg=k=>{const m=NSO.msg[k];return m?`<span class="nso-msg${m.bad?" bad":""}" role="status">${esc(m.t)}</span>`:""};
/* 1. hand-offs in the episode window: thumbnail text ideas, clip brief */
function nsoHandoff(rid,sec,savedAt,hasText){const k=nsoK(rid,sec),v=nsoGet(rid,sec),last=NSO.sent[k]||(savedAt?{to:nsoLabel(v),at:savedAt}:null);
  return `<div class="m2-row nso-row">${nsoPick(rid,sec)}<span class="m2-r">${v?esc(nsoLabel(v)):"No owner yet"}${last?` · sent to ${esc(last.to)} ${fmtD(last.at)}`:""}</span>${nsoMsg(k)}
    <button type="button" class="m2-btn" data-nsoact="handoff" data-rid="${rid}" data-sec="${sec}"${!v||NSO.busy[k]?" disabled":""}>${NSO.busy[k]?"Sending…":last?"Send to owner again":"Send to owner"}</button></div>`}
async function nsoHandoffSend(rid,sec){const s=MS[rid];if(!s)return;const text=sec==="thumbIdeas"?(s.text.ideas||s.text.ideasLink):(s.text.brief||s.text.briefLink);
  if(!String(text||"").trim()){NSO.msg[nsoK(rid,sec)]={bad:1,t:sec==="thumbIdeas"?"Write the ideas (or paste the link) first.":"Write the brief (or paste the link) first."};nsoRefresh();return}
  const msg=`*${nsoEp(rid).name||"This episode"}* · ${sec==="thumbIdeas"?"Thumbnail text ideas are":"Clip brief is"} ready for you. From ${nsoMe()}.\n`+String(text).trim().split("\n").map(l=>">"+l).join("\n");
  const res=await nsoNotify(rid,sec,sec==="thumbIdeas"?"the thumbnail text ideas":"the clipping brief",msg);
  if(res&&NSO.sent[nsoK(rid,sec)]){if(sec==="thumbIdeas")s.sent=TODAY;else s.sentTo.editors=TODAY;if(M.id){SV.id=M.id;svMark()}}}
/* 2. drop sections: what changed since the last notify, summarised in one Slack message */
const NSO_KN={thumb:["thumbnail drop","design"],broll:["B-roll drop","clip"],talk:["talking-point drop","clip"],carousel:["carousel drop","carousel"],single:["single-graphic drop","graphic"],trailer:["trailer drop","trailer"],other:["drop","piece"]};
const nsoSecOf=k=>k==="thumb"?"thumbDrops":"clipDrops";
function nsoRecord(rid,sec,e){(NSO.chg[nsoK(rid,sec)]=NSO.chg[nsoK(rid,sec)]||[]).push(e);nsoRefresh()}
/* rows added in the episode window count once they are saved (they have a record id) */
function nsoWinAdds(rid,sec){const s=MS[rid];if(!s)return [];const out=[];const sent=NSO.sentU[rid]||new Set();
  for(const [k2,L] of Object.entries(s.added.drops||{})){if(nsoSecOf(k2)!==sec)continue;for(const r of L)if(r.rid&&+r.many>0&&!sent.has(r.u))out.push({t:"add",k:k2[0]==="x"?"other":k2,many:+r.many,u:r.u})}
  return out}
const nsoSession=(rid,sec)=>[...(NSO.chg[nsoK(rid,sec)]||[]),...nsoWinAdds(rid,sec)];
/* v36: persisted path. "<section>Notified" (ISO) lives in the owners JSON; changes since then come from the drops' own times
   (Dropped on = created, DROP_MODIFIED = last modified), so they survive a reload and are the same for everyone */
const nsoDropsLive=()=>((MP.D&&MP.D.drops)||[]).some(r=>r.fields&&DROP_CREATED in r.fields);
const nsoModLive=()=>!/PLACEHOLDER/.test(DROP_MODIFIED)&&((MP.D&&MP.D.drops)||[]).some(r=>r.fields&&DROP_MODIFIED in r.fields);
const nsoPersist=()=>nsoInFeed()&&nsoDropsLive();
const nsoSince=(rid,sec)=>{const v=nsoSaved(rid)[sec+"Notified"];return v?String(v):new Date(Date.now()-7*864e5).toISOString()}; /* never notified: the last 7 days */
const nsoUnit=(sec,n)=>sec==="thumbDrops"?(n===1?"design":"designs"):(n===1?"clip":"clips");
function nsoChanges(rid,sec){const out=new Map(),since=Date.parse(nsoSince(rid,sec));
  if(nsoPersist()&&typeof drRow==="function")for(const r of MP.D.drops){const d=drRow(r);if(d.ep!==rid||nsoSecOf(d.k)!==sec)continue;
    const cr=Date.parse(plain(r.fields[DROP_CREATED])||""),md=nsoModLive()?Date.parse(plain(r.fields[DROP_MODIFIED])||""):NaN;
    if(cr>since)out.set(d.id,{t:"add",many:d.many,k:d.k});else if(md>since)out.set(d.id,{t:"upd",many:d.many,k:d.k})}
  for(const e of nsoSession(rid,sec)){const id=e.id||e.u;if(e.t==="add")out.set(id,{t:"add",many:e.many||0,k:e.k});
    else if(!out.has(id)){const r=((MP.D&&MP.D.drops)||[]).find(z=>z.id===id),d=r&&drRow(r);out.set(id,{t:"upd",many:d?d.many:0,k:d?d.k:"other"})}}
  return [...out.values()]}
function nsoSummary(rid,sec){const L=nsoChanges(rid,sec);if(!L.length)return "";const name=nsoEp(rid).name||"This episode",parts=[];
  const A=L.filter(z=>z.t==="add"),U=L.filter(z=>z.t==="upd");
  if(A.length){const n=A.reduce((t,z)=>t+(z.many||0),0);parts.push(`added ${pl(A.length,"drop")}${n?` (${n} ${nsoUnit(sec,n)})`:""}`)}
  if(U.length)parts.push(`updated ${pl(U.length,"drop")} (now ${U.map(z=>z.many).join(", ")} ${nsoUnit(sec,U.length===1?U[0].many:2)})`);
  /* this session's own edits add the old → new detail */
  const eds=(NSO.chg[nsoK(rid,sec)]||[]).filter(z=>z.t==="edit");
  const det=eds.length?` Details: ${eds.map(e=>`${e.label} ${e.from===""||e.from==null?"–":e.from}→${e.to===""||e.to==null?"–":e.to}`).join(", ")}.`:"";
  return `${name} · ${NSO_SECS[sec]}: ${parts.join(", ")}.${det}`}
const nsoSlackText=t=>t.replace(/^([^·]+) · /,"*$1* · "); /* Slack bold for the episode name; the page shows it plain */
const nsoLastN=(rid,sec)=>{const k=nsoK(rid,sec);if(NSO.sent[k])return NSO.sent[k];const v=nsoSaved(rid)[sec+"Notified"];return v?{to:nsoLabel(nsoGet(rid,sec))||"the owner",at:d10(v)}:null};
function nsoBar(rid,sec){if(!rid)return "";const k=nsoK(rid,sec),sum=nsoSummary(rid,sec),last=nsoLastN(rid,sec),v=nsoGet(rid,sec);
  return `<div class="nso-bar" data-nsobar="${k}">${nsoPick(rid,sec)}<span class="nso-sum">${sum?`<b>Not sent yet:</b> ${esc(sum)}`:`No new changes${last?"":" to send"}`}${last?` · <span class="nso-ok">Notified ${esc(last.to)} ${fmtD(last.at)}</span>`:""}</span>${nsoMsg(k)}
    <button type="button" class="m2-btn nso-btn" data-nsoact="notify" data-rid="${rid}" data-sec="${sec}"${!sum||!v||NSO.busy[k]?" disabled":""}>${NSO.busy[k]?"Sending…":"Notify owner"}</button></div>`}
async function nsoNotifySend(rid,sec){const sum=nsoSummary(rid,sec);if(!sum)return;const win=nsoWinAdds(rid,sec),at=new Date().toISOString();
  const res=await nsoNotify(rid,sec,sec==="thumbDrops"?"thumbnail drop updates":"clip drop updates",nsoSlackText(`${sum} From ${nsoMe()}.`));
  if(!(res&&NSO.sent[nsoK(rid,sec)]))return;
  delete NSO.chg[nsoK(rid,sec)];const S2=NSO.sentU[rid]||(NSO.sentU[rid]=new Set());win.forEach(e=>S2.add(e.u));NSO.msg[nsoK(rid,sec)]=null;
  if(nsoInFeed()){const json=JSON.stringify(Object.assign({},nsoSaved(rid),{[sec]:nsoGet(rid,sec),[sec+"Notified"]:at}));MP.F[rid]=Object.assign(MP.F[rid]||{},{[NSO_FIELD]:json});
    try{const r2=await svSend(nsoEp(rid),{tab:"owners"},[{t:"tblx8C7czyAikbbVp",a:"update",id:rid,f:{[NSO_FIELD]:json}}],[]);if(!r2||!r2.ok)NSO.msg[nsoK(rid,sec)]={bad:1,t:"Sent, but couldn't save the time it was sent."}}
    catch(e){NSO.msg[nsoK(rid,sec)]={bad:1,t:"Sent, but couldn't save the time it was sent."}}}
  nsoRefresh()}
/* wiring (works in the episode window and the Content Drops tab) */
document.addEventListener("change",ev=>{const t=ev.target;if(!t.dataset||!t.dataset.nsok)return;const [rid,sec]=t.dataset.nsok.split("|");nsoSetOwner(rid,sec,t.value)});
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-nsoact]");if(!b||b.disabled)return;ev.stopPropagation();
  if(b.dataset.nsoact==="handoff")nsoHandoffSend(b.dataset.rid,b.dataset.sec);else nsoNotifySend(b.dataset.rid,b.dataset.sec)},true);
