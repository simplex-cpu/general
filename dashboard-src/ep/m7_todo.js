/* ---------- v30: To-do (Karen's "Sales" design, approved mockup Main.dc.html / Fields.dc.html).
   One Notion-like table (or Kanban) of ReLearn -> Task Manager (tblo67QERNSmGzVaJ). Every cell but Origin edits in place and saves on its own.
   Episode production steps are no longer listed here: the Episode Task AI turns them into tasks. The step helpers below stay because
   the Overview, Clips and status tags still read them. ---------- */
const TDF={s1:"fldQzMvdWCmKP3LDB",s2:"fldMVXLQCFc1YtaSS",s3a:"fldKFni7cTKRuaFVN",s3b:"fld5FZvh7OEocCHWF",s3c:"fldFWMQupia2flYl8",s3d:"fldlbPHJTbTFb3BX4",s4:"fldtXpBmPdWShVh4t",
  s5a:"fldp3D9TCJS43tIxW",s5b:"fld7rSGAXDkg6FRLI",s6:"fldhNE61IMEOZEWUK",s7:"fldO9EldQ4easLprX",s7b:"fld3SQtnGAahNVTgu",s7c:"fld7Y9oxvS12kHDXy",s7d:"fldAyeqdHq49VM8IV",s8:"fldvmkDOUmPvSPtmQ",
  dFoot:"fldpX5FWpAV8RPJ4L",dV1:"fldAe1mwtvQePjswM",dGuide:"flduq6JoM4OXHYONh",dReady:"fldwlQkfxlOnhOpNT",dStart:"fld1L75VqKN8NZeZN",dPostDone:"flduORMTFcBoLdFce",
  dTeaser:"fldyNzhwi7RSdDBBy",dFinal:"fldscZCvyUZM0Ht0z",dPre:"fldmoLTHO6H2R6uyL"};
for(const [k2,v] of Object.entries(TDF))MPF["td_"+k2]=v; /* the Claude copy reads these too */
/* the steps, in the order the episode table's "Current step" formula walks them */
const TDS=[
  {k:"1",f:"s1",n:"Footage",who:["Stephen"],lab:"Footage (sent by Kash / Jade, ticked by Stephen)",due:"dFoot",dep:[],hint:"Kash or Jade send it, Stephen ticks it"},
  {k:"2",f:"s2",n:"V1 & transcript",who:["Stephen"],due:"dV1",dep:["1"]},
  {k:"3a",f:"s3a",n:"B-roll + captions",who:["Dakshaya"],due:"dGuide",dep:["2"],hint:"Clip guidelines for the B-roll edits",clip:1},
  {k:"3b",f:"s3b",n:"TPs + captions",who:["Dakshaya"],due:"dGuide",dep:["2"],hint:"Talking points for the TP edits",clip:1},
  {k:"3c",f:"s3c",n:"Carousels",who:["Dakshaya"],due:"dGuide",dep:["2"],clip:1},
  {k:"3d",f:"s3d",n:"Thumbnail text",who:["CJ"],due:"dGuide",dep:["2"],hint:"Jean needs it for the thumbnails"},
  {k:"4",f:"s4",n:"Thumbnails",who:["Jean"],due:"dReady",dep:["3d"]},
  {k:"5a",f:"s5a",n:"B-rolls edited",who:["Alex"],due:"dReady",dep:["3a"],clip:1},
  {k:"5b",f:"s5b",n:"TPs edited",who:["Alex","Johan"],due:"dReady",dep:["3b"],clip:1},
  {k:"6",f:"s6",n:"Posting",who:["Dakshaya"],due:"dStart",due2:"dPostDone",dep:["5a","5b"],hint:"Start by the date shown; once started, finish 3 days before release",clip:1},
  {k:"7",f:"s7",n:"Teaser trailer",who:["Stephen"],due:"dTeaser",dep:["2"],na:1},
  {k:"7b",f:"s7b",n:"Final cut & trailer",who:["Stephen"],due:"dFinal",dep:["2"]},
  {k:"7c",f:"s7c",n:"Pre-release trailer",who:["Stephen"],due:"dPre",dep:["7b"],na:1},
  {k:"7d",f:"s7d",n:"Release-day trailer",who:["Stephen"],due:"rel",dep:["7b"],na:1},
  {k:"8",f:"s8",n:"QC",who:["CJ"],due:"dFinal",dep:["7b"],hint:"Final check before release"}];
const TDK=Object.fromEntries(TDS.map(s=>[s.k,s]));
const tdFirst=n=>String(n||"").trim().split(/\s+/)[0]||"";
const tdSame=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
const tdMe=()=>(window.RL_AUTH&&window.RL_AUTH.name)||window.__rlViewer||"";
const tdv=(m,k2)=>m.f?m.f[TDF[k2]]:undefined;
const tdSt=(m,k2)=>String(nm(tdv(m,TDK[k2].f))||"").trim()||"Not started";
const tdIsDone=v=>/^done$/i.test(v),tdIsNA=v=>/^n\/?a$/i.test(v);
const tdOpen=(s,v)=>!tdIsDone(v)&&!(s.na&&tdIsNA(v));
const tdDue=(m,s,v)=>s.due==="rel"?m.rel:(d10(nm(tdv(m,s.due2&&/progress/i.test(v)?s.due2:s.due)))||"");
const tdWhen=d=>!d?"No date":d<TODAY?`${dayDiff(TODAY,d)}d late`:d===TODAY?"Due today":"Due "+fmtD(d);
const tdPill=d=>`<span class="td-due ${!d?"nd":d<TODAY?"r":d===TODAY?"a":dayDiff(d,TODAY)<=6?"w":""}">${esc(tdWhen(d))}</span>`;
const tdTeam=()=>(MP.D&&MP.D.team)||[];
const tdTeamName=r=>tdFirst(nm(r.fields&&r.fields.fld2G3e9kvvIeeLsz));
const tdTeamId=n=>{const r=tdTeam().find(x=>tdSame(tdTeamName(x),n));return r?r.id:null};
function tdEpSteps(m){const v={};for(const s of TDS)v[s.k]=tdSt(m,s.k);
  return TDS.map(s=>({kind:"step",id:m.rid+":"+s.k,m,s,st:v[s.k],who:s.who,due:tdDue(m,s,v[s.k]),open:tdOpen(s,v[s.k]),
    wait:s.dep.filter(d=>tdOpen(TDK[d],v[d])).map(d=>TDK[d])}))}
/* the next open step, worked out the same way as the episode table's "Current step" and its due date */
function tdCurrent(m){const S=k2=>tdSt(m,k2),nd=k2=>!tdIsDone(S(k2)),op=k2=>tdOpen(TDK[k2],S(k2)),d=k2=>d10(nm(tdv(m,k2)))||"";
  let lab="✅ Ready to release";
  for(const s of TDS){if(s.na?op(s.k):nd(s.k)){const v=S(s.k);lab=`${s.k}. ${s.lab||s.n} (${s.who.join(" + ")})`+(/progress/i.test(v)?" – in progress":/problem/i.test(v)?" – ⚠️ problem":"");break}}
  const due=nd("1")?d("dFoot"):nd("2")?d("dV1"):["3a","3b","3c","3d"].some(nd)?d("dGuide"):["4","5a","5b"].some(nd)?d("dReady"):nd("6")?(/progress/i.test(S("6"))?d("dPostDone"):d("dStart")):
    op("7")?d("dTeaser"):(nd("7b")||nd("8"))?d("dFinal"):op("7c")?d("dPre"):op("7d")?m.rel:"";
  return {lab,due}}
function tdSyncEp(m){const x=EPREC[m.id];if(!x||!x.step)return;const c=tdCurrent(m);x.step=c.lab;x.due=c.due||null}
/* the Overview cards: what else on this episode can be worked on right now */
function tdAlso(m){if(m.released||!m.rid)return "";const L=tdEpSteps(m).filter(i=>i.open),cur=L[0];
  const ready=L.filter(i=>i!==cur&&!i.wait.length);if(!ready.length)return "";
  const t=ready.map(i=>`${i.s.n} (${i.who.join(" + ")})`);
  return `<small class="mp-also" title="${esc("Also ready: "+t.join(", "))}">Also ready: ${esc(t.slice(0,2).join(", "))}${t.length>2?` +${t.length-2}`:""}</small>`}
/* the Clips tab: clip guidelines and the next clip step */
function tdGuide(m,brief){if(!m.rid)return brief?step("done","Written"):none(m);const a=tdSt(m,"3a"),b=tdSt(m,"3b"),n=[a,b].filter(tdIsDone).length;
  if(n===2)return step("done","Done");if(/problem/i.test(a+b))return step("late","Problem");
  const due=d10(nm(tdv(m,"dGuide")));if(n||/progress/i.test(a+b))return step(due&&due<TODAY&&!m.released?"late":"amber",`${n} of 2${/progress/i.test(a+b)?" · in progress":""}`);
  if(brief)return step("done","Written");return due&&due<TODAY&&!m.released?step("late",tdWhen(due)):none(m)}
function tdNextClip(m){if(!m.rid)return dash;const i=tdEpSteps(m).find(z=>z.s.clip&&z.open);if(!i)return step("done","All clip steps done");
  return `<span class="mp-ep"><span>${esc(i.s.n)}</span><small class="${i.due&&i.due<TODAY?"rt":"mu"}">${esc(i.who.join(" + "))} · ${esc(tdWhen(i.due))}</small></span>`}
/* ---------- saving ---------- */
const TDP="rlTodoPending";
const tdPend=()=>{try{return JSON.parse(localStorage.getItem(TDP)||"[]")}catch(e){return []}};
function tdRemember(e){try{const L=tdPend().filter(z=>Date.now()-z.at<30*60e3);L.push(Object.assign({at:Date.now()},e));localStorage.setItem(TDP,JSON.stringify(L.slice(-80)))}catch(e2){}}
/* the data copy refreshes every 10 minutes: re-apply this browser's own saves that are newer than the copy */
function tdOverlay(){const fa=Date.parse((MP.raw&&MP.raw.fetchedAt)||"");if(!fa)return;const all=mpAll();
  for(const e of tdPend()){if(e.at<=fa||Date.now()-e.at>30*60e3)continue;
    if(e.t==="ep"){MP.F[e.id]=Object.assign(MP.F[e.id]||{},e.f);const m=all.find(z=>z.rid===e.id);if(m){m.f=MP.F[e.id];tdSyncEp(m)}}
    else if(e.t==="task"&&MP.raw){const L=MP.raw.todo||(MP.raw.todo=[]),r=L.find(z=>z.id===e.id);if(r)Object.assign(r.fields||(r.fields={}),e.f);else if(e.create)L.push({id:e.id,fields:Object.assign({},e.f)})}}}
const mpIndexTD=mpIndex;mpIndex=function(D){mpIndexTD(D);try{tdOverlay()}catch(e){console.error(e)}};
/* ---------- Task Manager: fields, statuses, what the back end allows ---------- */
const TDT="tblo67QERNSmGzVaJ",TDTF={n:"fldypaV3pfGFUwUV2",st:"fld54iDcRB5PIU4Tp",own:"fldnFWw9MtpsrUD6A",due:"fldBf1bXOOwnzmZ0J",pri:"fld5ZB32kORU6EhkD",ep:"fldeQQ12J1kfXXs9C",
  note:"fldcWWR8KvT1XH6eM",ppl:"fld6jZiM5KtFKnFvi",origin:"fldywhjIwpyLyXCfN",by:"fldhCfOeiBYTEXJ9J",sop:"fldZbSf9Ftu5Sitzx",why:"fldzSt84oNd0TiaZ7",area:"fldEQ3AMDWDY0Il1u",key:"fldzsVkWGqXCmou9p",created:"fld1snIZhQRklOHqD",upd:"fldsOpj3gUBOD063u"};
/* the five statuses. Old Airtable names are read as the new ones (To Do, In Progress, Review, Blocked); saves write the stored names via TDSTORE */
const TDST=[["todo","To do","#EEF0F3","#4A515C","#7C8490"],["progress","In progress","#FDF3D9","#8A5300","#E3A008"],["waiting","Waiting on someone","#FDEBDC","#9A4A00","#EA7A1F"],
  ["stuck","Stuck","#FCE9E7","#B3261E","#E0483B"],["done","Done","#E5F4EB","#1D6E40","#2FA35F"]];
const TDSK=Object.fromEntries(TDST.map(s=>[s[0],s]));
/* stored names stay the ones the rest of the system uses (Kash's PM tab, automations); the page only shows the friendly names */
const TDSTORE={todo:"To Do",progress:"In Progress",waiting:"Review",stuck:"Blocked",done:"Done"};
const tdStKey=v=>{v=String(nm(v)||"").trim();return /^done/i.test(v)?"done":/progress/i.test(v)?"progress":/review|waiting/i.test(v)?"waiting":/block|stuck/i.test(v)?"stuck":"todo"};
const tdPillH=k=>{const s=TDSK[k]||TDSK.todo;return `<span class="td2-pill" style="background:${s[2]};color:${s[3]}"><i style="background:${s[4]}"></i>${s[1]}</span>`};
/* what the save endpoint allows. The n8n update (Dashboard chat, draft on 3 Nov) adds origin, created by, why, SOP step and area to the
   Task Manager whitelist and the Task Updates table. Its feed key "taskUpdates" is the sign it is live; before that, only the older fields are sent. */
const tdCap=()=>(MP.D&&MP.D.caps)||{};
const tdNewBack=()=>Array.isArray(MP.D&&MP.D.taskUpdates);
const TD_WL0=[TDTF.n,TDTF.st,TDTF.own,TDTF.due,TDTF.pri,TDTF.ep,TDTF.note],TD_WL1=[TDTF.origin,TDTF.by,TDTF.why,TDTF.sop,TDTF.area];
const tdWritable=()=>new Set([...TD_WL0,...(tdNewBack()?TD_WL1:[]),...((tdCap().todoWrite)||[])]);
const tdCanDelete=()=>!!tdCap().todoDelete; /* not on the whitelist: shown as "(soon)" */
/* Task Updates tblRYCpMzpuDx2Jrb (create only): Update, Task (link), Author (first name), Posted at */
const TDU={t:"tblRYCpMzpuDx2Jrb",f:{text:"fldQKGxl1au3BFsZ3",task:"fldChv82CORjMyaXN",author:"fldu8GaW3FPkesPmv",at:"fld7JxA71qha38lMz"}};
const tdTU=()=>tdNewBack()?TDU:null;
/* Slack: the hosted page goes through the save endpoint's existing DM path; the Claude copy needs SLACK_IDS */
const tdCanNotify=()=>!window.claude?.use||typeof SLACK_IDS!=="undefined";
const TD={who:null,origin:"all",view:"table",group:"none",stat:null,sel:new Set(),menu:null,editDate:null,modal:null,draft:"",nTo:{},nType:"input",nMsg:"",msg:"",msgBad:false,busy:{},newRow:null,
  w:{n:280,d:300,w:130,s:190,a:160,o:220}};
try{const w=JSON.parse(localStorage.getItem("rlTodoW")||"null");if(w)Object.assign(TD.w,w);const v=localStorage.getItem("rlTodoView");if(v==="kanban")TD.view=v}catch(e){}
/* ---------- people ---------- */
const TDPAL=[["#E8E7FD","#3F37C9"],["#FCE7EF","#9D174D"],["#E0F2FE","#075985"],["#FEF3C7","#92400E"],["#DCFCE7","#166534"],["#F3E8FF","#6B21A8"],["#FFE4E6","#9F1239"],["#E5E7EB","#374151"]];
const tdCol=n=>{let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))>>>0;return TDPAL[h%TDPAL.length]};
const tdIni=n=>{n=String(n||"?");return n.length<=2?n.toUpperCase():n.slice(0,2).toUpperCase()};
const tdAv=(n,sz)=>{const [bg,fg]=tdCol(n||"?");return `<span class="td2-av${sz?" "+sz:""}" style="background:${bg};color:${fg}" aria-hidden="true">${esc(n?tdIni(n):"–")}</span>`};
/* Karen: "Shay" is the same person as Dakshaya, and the "VA" role is Jade. Those Team rows are hidden from every picker;
   tasks still linked to them show under Dakshaya / Jade */
const TDALIAS={shay:"Dakshaya",va:"Jade"};
const tdCanonN=n=>TDALIAS[String(n||"").toLowerCase()]||n;
const tdCanonId=id=>{const t=tdTeam().find(x=>x.id===id);if(!t)return id;const a=TDALIAS[tdTeamName(t).toLowerCase()];if(!a)return id;const r=tdTeam().find(x=>tdSame(tdTeamName(x),a));return r?r.id:id};
const tdMeName=()=>tdCanonN(tdFirst(tdMe()));
/* every team member (Team table), plus the signed-in person if they have no Team record yet */
function tdPeople(){const out=[],seen=new Set();
  for(const r of tdTeam()){const n=tdTeamName(r);if(!n||TDALIAS[n.toLowerCase()]||seen.has(n.toLowerCase()))continue;seen.add(n.toLowerCase());out.push({v:r.id,id:r.id,n})}
  const me=tdMeName();if(me&&!seen.has(me.toLowerCase()))out.push({v:"me:"+me,id:null,n:me});
  return out.sort((a,b)=>a.n.localeCompare(b.n))}
const tdPerson=v=>tdPeople().find(p=>p.v===v)||null;
/* v36: who can get a Slack DM: caps.slackPeople from /data, else the known list. Names are sent exactly as listed; Team rows match by first word */
const TD_SLACK0=["Karen","Kash","CJ","Jade","Dakshaya","Cristiana","Stephen","Jean","Johan","Alex","Marc","Sarah"];
const tdSlackNames=()=>{const c=tdCap().slackPeople;return Array.isArray(c)&&c.length?c.slice():TD_SLACK0.slice()};
const tdNotifyPeople=()=>tdSlackNames().sort((a,b)=>a.localeCompare(b)).map(n=>{const t=tdTeam().find(r=>tdSame(tdTeamName(r),n));return {v:"s:"+n,n,id:t?t.id:null}});
const tdMeV=()=>{const me=tdMeName();if(!me)return null;const p=tdPeople().find(z=>tdSame(z.n,me));return p?p.v:null};
/* ---------- the tasks ---------- */
const tdEpName=rid=>{if(!rid)return "";const f=MP.F[rid];let n=f&&plain(f.fldhFqJB0E9XM6plr);
  if(!n){const r=((MP.D&&MP.D.episodes)||[]).find(z=>z.id===rid||z._rid===rid);n=r&&plain((r.fields||r).fldhFqJB0E9XM6plr)}
  if(!n){const m=mpAll().find(z=>z.rid===rid);n=m&&m.name}return n||""};
const tdEpId=rid=>{const m=rid&&mpAll().find(z=>z.rid===rid);return m?m.id:null};
const TDMINE="rlTodoMine";
const tdMine=()=>{try{return JSON.parse(localStorage.getItem(TDMINE)||"{}")}catch(e){return {}}};
function tdTask(r){const f=r.fields||{},own=[...new Set(ids(f[TDTF.own]).map(tdCanonId))],team=tdTeam();
  let who=[...new Set(own.map(id=>{const t=team.find(x=>x.id===id);return t?tdCanonN(tdTeamName(t)):""}).filter(Boolean))];
  if(!who.length&&f[TDTF.ppl]&&!own.length)who=String(plain(f[TDTF.ppl])).split(/\s*,\s*/).map(n=>tdCanonN(tdFirst(n))).filter(Boolean);
  const ep=ids(f[TDTF.ep])[0]||"",og=String(nm(f[TDTF.origin])||""),by=String(nm(f[TDTF.by])||""),created=d10(plain(f[TDTF.created]))||"";
  const origin=/episode/i.test(og)?"episode":/meeting/i.test(og)?"meeting":/assign|someone|person/i.test(og)?"person":ep?"episode":"person";
  const me=tdMeName(),mineV=tdMine()[r.id];
  const ol=origin==="episode"?(tdEpName(ep)||"Episode"):origin==="meeting"?"Meeting"+(created?" · "+fmtD(created):""):
    mineV?(tdSame(mineV,me)?"From you":"From "+mineV):(!/ai/i.test(by)&&who.some(w=>tdSame(w,me))&&!og)?"From you":"From a teammate";
  return {id:r.id,r,n:String(plain(f[TDTF.n])||""),desc:String(plain(f[TDTF.note])||""),st:tdStKey(f[TDTF.st]),due:d10(plain(f[TDTF.due]))||"",own,who,ep,origin,ol,created}}
const tdRaw=()=>(MP.D&&MP.D.todo)||[];
const tdAllTasks=()=>tdRaw().map(tdTask).filter(t=>t.n.trim()||t.id===TD.focusNew);
const tdFor=(t,who)=>who==="all"||(who.startsWith("me:")?t.who.some(w=>tdSame(w,who.slice(3))):t.own.includes(who));
const tdB=t=>!t.due?"nodate":t.due<TODAY?"late":t.due===TODAY?"today":dayDiff(t.due,TODAY)<=6?"week":"later";
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const tdWhen2=d=>!d?"No date":d===TODAY?"Today":d===addD(TODAY,1)?"Tomorrow":d===addD(TODAY,-1)?"Yesterday":DOW[new Date(d+"T00:00:00Z").getUTCDay()]+" "+fmtD(d);
const tdWhenCls=t=>t.st==="done"?"dn":!t.due?"nd":t.due<TODAY?"late":t.due===TODAY?"today":"";
const TDSTATS=[["late","Late",t=>tdB(t)==="late","r"],["today","Due today",t=>tdB(t)==="today","a"],["week","This week",t=>tdB(t)==="today"||tdB(t)==="week",""],
  ["episode","Episode",t=>t.origin==="episode",""],["meeting","Meeting",t=>t.origin==="meeting",""],["waiting","Waiting on someone",t=>t.st==="waiting",""]];
const TDORIG={episode:["Episode","Episodes"],meeting:["Meeting","Meetings"],person:["Assigned","Assigned by someone"]};
function tdList(){const who=TD.who,all=tdAllTasks().filter(t=>tdFor(t,who));
  let L=all.filter(t=>TD.origin==="all"||t.origin===TD.origin);
  const st=TDSTATS.find(s=>s[0]===TD.stat);if(st)L=L.filter(t=>t.st!=="done"&&st[2](t));
  L.sort((a,c)=>(a.st==="done")-(c.st==="done")||String(a.due||"9999").localeCompare(String(c.due||"9999"))||a.n.localeCompare(c.n));
  return {all,L}}
/* ---------- saving (optimistic, put back if the save fails) ---------- */
async function tdPost(name,ops,notify){const res=await svSend({rid:"",name:String(name||"").slice(0,120),id:""},{tab:"todo"},ops,notify||[]);
  if(!res||!res.ok){const r=((res&&res.results)||[]).find(z=>!z.ok);throw new Error((r&&r.error)||((res&&res.rejected&&res.rejected.length)?"not allowed yet":"not saved"))}return res}
const tdRec=id=>tdRaw().find(z=>z.id===id);
const tdSay=(m,bad)=>{TD.msg=m;TD.msgBad=!!bad};
async function tdUpdate(idsL,f,label){const W=tdWritable();for(const k of Object.keys(f))if(!W.has(k)){tdSay("That change can't be saved from the dashboard yet.",1);mpRender();return}
  const recs=idsL.map(tdRec).filter(Boolean);if(!recs.length)return;const old=recs.map(r=>Object.assign({},r.fields));
  for(const r of recs){r.fields=Object.assign(r.fields||{},f);for(const [k,v] of Object.entries(f))if(v==null||v==="")delete r.fields[k];TD.busy[r.id]=1}
  mpRender();
  try{await tdPost(recs.length===1?plain(recs[0].fields[TDTF.n]):recs.length+" tasks",recs.map(r=>({t:TDT,a:"update",id:r.id,f})));
    for(const r of recs)tdRemember({t:"task",id:r.id,f});tdSay(label||"Saved.")}
  catch(e){recs.forEach((r,i)=>r.fields=old[i]);tdSay(/allowed/.test(e.message)?"That change can't be saved from the dashboard yet.":"Couldn't save that. Try again.",1)}
  for(const r of recs)delete TD.busy[r.id];mpRender()}
async function tdCreate(name,st,ownV,due){const p=ownV?tdPerson(ownV):null,W=tdWritable();
  const f={[TDTF.n]:name,[TDTF.st]:TDSTORE[st||"todo"]};if(p&&p.id)f[TDTF.own]=[p.id];if(due)f[TDTF.due]=due;
  if(W.has(TDTF.origin))f[TDTF.origin]="Assigned by someone";if(W.has(TDTF.by))f[TDTF.by]="Person";
  const tmp="new"+Date.now(),row={id:tmp,fields:Object.assign({},f),pending:true};
  if(MP.D){MP.D.todo=MP.D.todo||[];MP.D.todo.push(row)}if(MP.raw&&Array.isArray(MP.raw.todo)&&MP.raw.todo!==MP.D.todo)MP.raw.todo.push(row);
  TD.busy[tmp]=1;TD.newRow=null;mpRender();
  try{const res=await tdPost(name,[{t:TDT,a:"create",f}]),id=((res.results||[])[0]||{}).id;if(!id)throw new Error("no id");
    row.id=id;delete row.pending;try{const M=tdMine();M[id]=tdMeName()||"you";localStorage.setItem(TDMINE,JSON.stringify(M))}catch(e){}
    tdRemember({t:"task",id,f,create:1});
    tdSay(`Added "${name}"`+(p?(p.id?` for ${p.n}.`:`. ${p.n} isn't in the Team table yet, so it has no assignee.`):"."),p&&!p.id)}
  catch(e){for(const L of [MP.D&&MP.D.todo,MP.raw&&MP.raw.todo]){if(!L)continue;const i=L.indexOf(row);if(i>=0)L.splice(i,1)}tdSay("Couldn't add that task. Try again.",1)}
  delete TD.busy[tmp];mpRender()}
async function tdDelete(idsL){if(!tdCanDelete()){tdSay("Delete is coming soon: the dashboard can't remove tasks yet.",1);mpRender();return}
  if(!confirm(`Delete ${idsL.length===1?"this task":idsL.length+" tasks"}? This can't be undone.`))return;
  const L=MP.D.todo,keep=L.slice();
  for(const id of idsL){const i=L.findIndex(z=>z.id===id);if(i>=0)L.splice(i,1)}TD.sel.clear();mpRender();
  try{await tdPost(idsL.length+" tasks",idsL.map(id=>({t:TDT,a:"delete",id})));tdSay(`Deleted ${pl(idsL.length,"task")}.`)}
  catch(e){L.length=0;L.push(...keep);tdSay("Couldn't delete those. Try again.",1)}mpRender()}
/* ---------- updates and Slack ---------- */
function tdThread(id){const c=tdTU();if(!c)return [];const F=c.f,team=tdTeam();
  return (MP.D.taskUpdates||[]).filter(r=>ids((r.fields||{})[F.task]).includes(id)).map(r=>{const f=r.fields||{},text=String(plain(f[F.text])||"");
    return {who:tdFirst(plain(f[F.author]))||"Someone",text,kind:/^\S+ notified .+ · /.test(text)?"s":"c",
      at:String(plain(f[F.at])||r.createdTime||"").slice(0,16)}}).sort((a,b)=>String(a.at).localeCompare(String(b.at)))}
const tdAt=s=>{if(!s)return "";const d=s.slice(0,10),t=s.slice(11,16);return (d===TODAY?"Today":fmtD(d))+(t?", "+t:"")};
const TDN=[["fyi","FYI","Just so they know"],["input","Needs your input","They need to reply or add something"],["approval","Needs your approval","They need to sign it off"],["urgent","Urgent","Blocking work, look today"]];
async function tdLogUpdate(taskIds,text){const c=tdTU();if(!c)return;const F=c.f,at=new Date().toISOString();
  const ops=taskIds.map(id=>({t:c.t,a:"create",f:{[F.task]:[id],[F.text]:text,[F.author]:tdMeName()||"Someone",[F.at]:at}}));
  const res=await tdPost(text.slice(0,60),ops);
  (res.results||[]).forEach((x,i)=>{if(x.ok)MP.D.taskUpdates.unshift({id:x.id,fields:Object.assign({},ops[i].f,{[F.at]:at.slice(0,16)})})})}
async function tdPostUpdate(){const id=TD.modal&&TD.modal.ids[0],text=TD.draft.trim();if(!id||!text||!tdTU())return;const t=tdTask(tdRec(id));
  const tagged=tdNotifyPeople().filter(p=>new RegExp("@"+p.n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(text));
  TD.busy.post=1;mpRender();
  try{await tdLogUpdate([id],text);TD.draft="";
    if(tagged.length&&tdCanNotify()){const me=tdMeName()||"Someone",q=text.split("\n").map(l=>">"+l).join("\n");await tdPost(t.n,[],tagged.map(p=>({to:p.n,kind:"note",text:`*${t.n}* · ${me} tagged you in a task update:\n${q}\nFrom ${me}.`})));tdSay(`Posted. Slack message sent to ${tagged.map(p=>p.n).join(", ")}.`)}else tdSay("Update posted.")}
  catch(e){tdSay("Couldn't post that update. Try again.",1)}delete TD.busy.post;mpRender()}
async function tdSendNotify(){const M=TD.modal;if(!M)return;const to=tdNotifyPeople().filter(p=>TD.nTo[p.v]),ty=TDN.find(z=>z[0]===TD.nType)||TDN[0];if(!to.length)return;
  const tasks=M.ids.map(id=>tdRec(id)).filter(Boolean).map(tdTask),name=tasks.length===1?tasks[0].n:`${tasks.length} tasks`;
  const extra=tasks.length>1?tasks.map(t=>"• "+t.n).join("\n"):"";const text=[TD.nMsg.trim(),extra].filter(Boolean).join("\n");
  TD.busy.notify=1;mpRender();
  try{const me=tdMeName()||"Someone",MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dd=tasks.length===1&&tasks[0].due?String(tasks[0].due):"",due=dd?` Due ${+dd.slice(8,10)} ${MO[+dd.slice(5,7)-1]}.`:"",ep=tasks.length===1&&tasks[0].origin==="episode"&&tasks[0].ol?` (${tasks[0].ol})`:"";const body=`*${name}*${ep} · ${ty[1]}.${due}`+(TD.nMsg.trim()?`\n>${TD.nMsg.trim().split("\n").join("\n>")}`:"")+(extra?`\n${extra}`:"")+`\nFrom ${me}.`;await tdPost(name,[],to.map(p=>({to:p.n,kind:"note",text:body.slice(0,3000)})));
    try{await tdLogUpdate(M.ids,`${tdMeName()||"Someone"} notified ${to.map(p=>p.n).join(", ")} · ${ty[1]}`+(TD.nMsg.trim()?`: ${TD.nMsg.trim()}`:""))}catch(e){}
    TD.modal=null;TD.sel.clear();tdSay(`Slack message sent to ${to.map(p=>p.n).join(", ")}.`)}
  catch(e){tdSay("Couldn't send the Slack message. Try again.",1)}delete TD.busy.notify;mpRender()}
/* ---------- drawing ---------- */
const TDI={chev:'<svg class="td2-chev" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>',
  table:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6.5h12M2 10h12"/></svg>',
  kanban:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="3" width="3.5" height="10" rx="1"/><rect x="6.25" y="3" width="3.5" height="7" rx="1"/><rect x="10.5" y="3" width="3.5" height="5" rx="1"/></svg>',
  plus:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  bub:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" stroke-linejoin="round"/></svg>',
  bell:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3L4 11ZM6.5 14h3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  x:'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>'};
const tdSelW=(attrs,opts,val,dis)=>`<span class="td2-selw"><select class="td2-sel" ${attrs}${dis?" disabled":""}>${opts.map(([v,l,d])=>`<option value="${esc(v)}"${String(v)===String(val)?" selected":""}${d?" disabled":""}>${esc(l)}</option>`).join("")}</select>${TDI.chev}</span>`;
const tdCols=()=>`44px ${TD.w.n}px ${TD.w.d}px ${TD.w.w}px ${TD.w.s}px ${TD.w.a}px ${TD.w.o}px 132px`;
function tdRowH(t){const sel=TD.sel.has(t.id),busy=TD.busy[t.id]?" disabled":"",nU=tdThread(t.id),nc=nU.filter(m=>m.kind==="c").length,pend=String(t.id).startsWith("new");
  const who=t.who[0]||"",whoN=t.who.join(" + ")||"Unassigned";
  const when=TD.editDate===t.id?`<input class="td2-c" type="date" id="tdDateIn" data-tdf="due" data-id="${t.id}" value="${t.due}" aria-label="Due date">`:
    `<button type="button" class="td2-c btn ${tdWhenCls(t)}" data-tdact="date" data-id="${t.id}" aria-label="Change due date, now ${esc(tdWhen2(t.due))}"${busy}>${esc(tdWhen2(t.due))}</button>`;
  return `<div class="td2-r${sel?" sel":""}${t.st==="done"?" done":""}${pend?" pend":""}" role="row" data-id="${t.id}">
    <span class="td2-ck" role="cell"><input type="checkbox" data-tdsel="${t.id}" aria-label="Select ${esc(t.n)}"${sel?" checked":""}${pend?" disabled":""}></span>
    <span role="cell"><input class="td2-c nm" data-tdf="n" data-id="${t.id}" value="${esc(t.n)}" aria-label="Task name" placeholder="Task name" title="${esc(t.n)}"${busy}></span>
    <span role="cell"><input class="td2-c ds" data-tdf="desc" data-id="${t.id}" value="${esc(t.desc)}" aria-label="Description" placeholder="Add a description" title="${esc(t.desc)}"${busy}></span>
    <span role="cell">${when}</span>
    <span role="cell"><button type="button" class="td2-pb" data-tdmenu="status" data-id="${t.id}" aria-haspopup="menu" aria-label="Change status, now ${TDSK[t.st][1]}"${busy}>${tdPillH(t.st)}</button></span>
    <span role="cell"><button type="button" class="td2-pb" data-tdmenu="who" data-id="${t.id}" aria-haspopup="menu" aria-label="Change assignee, now ${esc(whoN)}"${busy}>${tdAv(who)}<span class="nmx">${esc(whoN)}</span></button></span>
    <span role="cell" class="og" title="Origin is set automatically"><i>${TDORIG[t.origin][0]}</i>${t.origin==="episode"&&tdEpId(t.ep)?`<button type="button" class="td2-ogl" data-mpep="${tdEpId(t.ep)}" data-mptab="overview">${esc(t.ol)}</button>`:`<span>${esc(t.ol)}</span>`}</span>
    <span role="cell" class="ac"><button type="button" class="td2-ib" data-tdact="upd" data-id="${t.id}" aria-label="Comments and updates for ${esc(t.n)}"${pend?" disabled":""}>${TDI.bub}${nc?nc:""}</button>${tdCanNotify()?`<button type="button" class="td2-ib${nU.some(m=>m.kind==="s")?" on":""}" data-tdact="ntf" data-id="${t.id}" aria-label="Notify someone about ${esc(t.n)}"${pend?" disabled":""}>${TDI.bell}Notify</button>`:""}</span></div>`}
function tdNewRowH(){const N=TD.newRow,p=N&&tdPerson(N.who);
  return `<div class="td2-r new" role="row"><span class="td2-ck" role="cell"></span><span role="cell" style="grid-column:span 3"><input class="td2-c nm" id="tdNewIn" data-tdf="new" aria-label="New task name" placeholder="Task name, then Enter"></span>
    <span role="cell">${tdPillH(N.st)}</span><span role="cell" class="pbx">${tdAv(p&&p.n)}<span class="nmx">${esc(p?p.n:"Unassigned")}</span></span><span role="cell" class="og"><i>Assigned</i><span>From you</span></span><span role="cell"></span></div>`}
function tdTable(L){const groups=TD.group==="none"?[[null,L]]:(()=>{const G={
    status:[t=>t.st,["stuck","waiting","progress","todo","done"],k=>TDSK[k][1]],
    assignee:[t=>t.who[0]||"",[...new Set(L.map(t=>t.who[0]||""))].sort((a,b)=>(!a)-(!b)||a.localeCompare(b)),k=>k||"Unassigned"],
    origin:[t=>t.origin,["episode","meeting","person"],k=>TDORIG[k][1]],
    when:[t=>t.st==="done"?"done":tdB(t),["late","today","week","later","nodate","done"],k=>({late:"Late",today:"Today",week:"This week",later:"Later",nodate:"No date",done:"Done"})[k]]}[TD.group];
    return G[1].map(k=>[G[2](k),L.filter(t=>G[0](t)===k)]).filter(g=>g[1].length)})();
  const allOn=L.length>0&&L.every(t=>TD.sel.has(t.id));
  const hd=[["n","Task"],["d","Description"],["w","When"],["s","Status"],["a","Assignee"],["o","Origin"]];
  const body=groups.map(([lab,rows])=>(lab!=null?`<div class="td2-gh" role="row"><span role="cell">${esc(lab)}<b>${rows.length}</b></span></div>`:"")+rows.map(tdRowH).join("")).join("");
  return `<section class="td2-card" aria-label="Tasks"><div class="td2-scroll"><div class="td2-t" role="table" aria-label="Tasks" style="--cols:${tdCols()}">
    <div class="td2-r hd" role="row"><span class="td2-ck" role="columnheader"><input type="checkbox" data-tdselall aria-label="Select all tasks"${allOn?" checked":""}></span>${hd.map(([k,l])=>`<span role="columnheader">${l}<button type="button" class="td2-rz" data-tdrz="${k}" aria-label="Resize ${l} column"></button></span>`).join("")}<span role="columnheader"></span></div>
    ${body||(TD.newRow?"":`<div class="td2-empty">${tdEmpty()}</div>`)}${TD.newRow&&TD.newRow.view==="table"?tdNewRowH():""}
    <button type="button" class="td2-add" data-tdact="add">${TDI.plus}Add a task</button></div></div></section>`}
function tdEmpty(){const p=TD.who==="all"?null:tdPerson(TD.who);
  return TD.stat||TD.origin!=="all"?"No tasks match these filters.":p?`Nothing assigned to ${esc(p.n)}. <button type="button" class="td2-lnk" data-tdact="everyone">Show everyone's tasks</button>`:"No tasks yet."}
function tdKanban(L){return `<div class="td2-kscroll"><div class="td2-kb">${TDST.map(([k])=>{const cards=L.filter(t=>t.st===k);
    return `<div class="td2-kc" aria-label="${TDSK[k][1]}"><div class="td2-kh">${tdPillH(k)}<span>${cards.length}</span></div>
      ${cards.map(t=>`<div class="td2-kcard${TD.sel.has(t.id)?" sel":""}"><div class="t"><input type="checkbox" data-tdsel="${t.id}" aria-label="Select ${esc(t.n)}"${TD.sel.has(t.id)?" checked":""}><button type="button" class="td2-ct" data-tdact="upd" data-id="${t.id}">${esc(t.n||"Untitled task")}</button></div>
        ${t.desc?`<span class="d">${esc(t.desc)}</span>`:""}<div class="f">${tdAv(t.who[0]||"","sm")}<span class="o">${esc(t.ol)}</span><span class="w ${tdWhenCls(t)}">${esc(tdWhen2(t.due))}</span></div></div>`).join("")}
      ${TD.newRow&&TD.newRow.view==="kanban"&&TD.newRow.st===k?`<input class="td2-kin" id="tdNewIn" data-tdf="new" aria-label="New task name" placeholder="Task name, then Enter">`:""}
      <button type="button" class="td2-add sm" data-tdact="add" data-st="${k}">${TDI.plus}Add a task</button></div>`}).join("")}</div></div>`}
function tdMenuH(){const M=TD.menu;if(!M)return "";let items="",title="";
  if(M.kind==="status"){const cur=M.id==="bulk"?null:(tdRec(M.id)&&tdTask(tdRec(M.id)).st);items=TDST.map(([k])=>`<button type="button" class="td2-mi" role="menuitem" data-tdpick="${k}">${tdPillH(k)}<span class="tk">${k===cur?"✓":""}</span></button>`).join("")}
  else if(M.kind==="who"){const t=M.id==="bulk"?null:tdTask(tdRec(M.id));title="Reassign to";
    items=tdPeople().map(p=>`<button type="button" class="td2-mi" role="menuitem" data-tdpick="${esc(p.v)}"${p.id?"":` disabled title="Not in the Team table yet"`}>${tdAv(p.n)}${esc(p.n)}<span class="tk">${t&&p.id&&t.own.includes(p.id)?"✓":""}</span></button>`).join("")}
  else if(M.kind==="date")items=`<label class="td2-ml">New date<input class="td2-in" type="date" id="tdBulkDate" aria-label="New date for the selected tasks"></label><div class="td2-mf"><button type="button" class="td2-ghost sm" data-tdact="bulkdateclear">No date</button><button type="button" class="td2-pri sm" data-tdact="bulkdate">Apply</button></div>`;
  return `<div class="td2-menu" role="menu" style="left:${M.x}px;top:${M.y}px">${title?`<span class="mt">${title}</span>`:""}${items}</div>`}
function tdModalH(){const M=TD.modal;if(!M)return "";const t0=tdRec(M.ids[0]);if(!t0)return "";const t=tdTask(t0),who=t.who.join(" + ")||"Unassigned";
  if(M.type==="upd"){const c=tdTU(),th=tdThread(t.id);
    return `<div class="td2-ov"><button type="button" class="td2-bd" data-tdact="close" aria-label="Close"></button><div class="td2-dlg" role="dialog" aria-modal="true" aria-label="Task updates">
      <div class="td2-dh"><div class="r1"><input class="td2-c big" data-tdf="n" data-id="${t.id}" value="${esc(t.n)}" aria-label="Task name"><button type="button" class="td2-ib" data-tdact="close" aria-label="Close">${TDI.x}</button></div>
        <div class="td2-kv"><span>Status</span><span>${tdPillH(t.st)}</span><span>Assignee</span><span class="pbx">${tdAv(t.who[0]||"")}${esc(who)}</span><span>When</span><span class="${tdWhenCls(t)} wtx">${esc(tdWhen2(t.due))}</span>
          <span>Origin</span><span>${TDORIG[t.origin][0]} · ${esc(t.ol)}</span><span>Description</span><textarea class="td2-c ta" rows="3" data-tdf="desc" data-id="${t.id}" aria-label="Description" placeholder="Add a description">${esc(t.desc)}</textarea></div></div>
      <div class="td2-th"><b>Updates</b>${c?(th.length?th.map(m=>m.kind==="s"?`<div class="sys">${TDI.bell}${esc(m.text)} · ${esc(tdAt(m.at))}</div>`:`<div class="cm">${tdAv(m.who)}<div><span class="h"><b>${esc(m.who)}</b> · ${esc(tdAt(m.at))}</span><span class="tx">${esc(m.text)}</span></div></div>`).join(""):`<span class="mu">No updates yet.</span>`):
        `<span class="mu soon">Comments are coming soon. They need the Task Updates table, which isn't connected yet.</span>`}</div>
      <div class="td2-df"><textarea class="td2-area" id="tdDraft" rows="3" aria-label="Write an update" placeholder="${c?"Write an update. Type @ and a name to tag someone.":"Coming soon"}"${c?"":" disabled"}>${esc(TD.draft)}</textarea>
        <div class="r"><span class="mu">Anyone you tag gets a Slack message with a link to this task.</span><button type="button" class="td2-pri" data-tdact="post"${!c||!TD.draft.trim()||TD.busy.post?" disabled":""}>${TD.busy.post?"Posting…":"Post update"}</button></div></div></div></div>`}
  const to=tdNotifyPeople().filter(p=>TD.nTo[p.v]),ty=TDN.find(z=>z[0]===TD.nType)||TDN[1],me=tdMeName()||"You",many=M.ids.length>1;
  return `<div class="td2-ov"><button type="button" class="td2-bd" data-tdact="close" aria-label="Close"></button><div class="td2-dlg sm" role="dialog" aria-modal="true" aria-label="Notify about ${many?"these tasks":"this task"}">
    <div class="r1"><div><b class="tt">Notify about ${many?`${M.ids.length} tasks`:"this task"}</b><span class="mu">${esc(many?M.ids.map(id=>tdTask(tdRec(id)).n).join(" · "):t.n)}</span></div><button type="button" class="td2-ib" data-tdact="close" aria-label="Close">${TDI.x}</button></div>
    <div class="fs"><b>Who</b><div class="chips">${tdNotifyPeople().filter(p=>!tdSame(p.n,me)).map(p=>`<button type="button" class="td2-chip" data-tdto="${esc(p.v)}" aria-pressed="${!!TD.nTo[p.v]}">${tdAv(p.n,"sm")}${esc(p.n)}</button>`).join("")}</div></div>
    <div class="fs"><b>Why</b><div class="opts">${TDN.map(([k,l,h])=>`<button type="button" class="td2-opt" data-tdwhy="${k}" aria-pressed="${TD.nType===k}"><b>${l}</b><span>${h}</span></button>`).join("")}</div></div>
    <div class="fs"><label for="tdNMsg"><b>Message</b> <span class="mu">(optional)</span></label><textarea id="tdNMsg" class="td2-area" rows="2" placeholder="Add context for them">${esc(TD.nMsg)}</textarea></div>
    <div class="td2-prev"><span class="mu">Slack preview</span><span><b>${esc(me)}</b> sent you a task (${esc(ty[1])}) for <b>${esc(many?M.ids.length+" tasks":t.n)}</b></span>
      <span class="meta">${many?"":`Due ${esc(tdWhen2(t.due))} · ${esc(t.ol)}`}</span><span class="q" id="tdPrevQ"${TD.nMsg.trim()?"":" hidden"}>“${esc(TD.nMsg.trim())}”</span><span class="lk">Open the dashboard</span></div>
    <div class="r2"><button type="button" class="td2-ghost" data-tdact="close">Cancel</button><button type="button" class="td2-pri" data-tdact="send"${!to.length||TD.busy.notify?" disabled":""}>${TD.busy.notify?"Sending…":to.length?`Send to ${pl(to.length,"person").replace("persons","people")}`:"Send"}</button></div></div></div>`}
function mpTodo(){const ppl=tdPeople();
  if(TD.who==null)TD.who=!window.RL_AUTH?"all":(tdMeV()||"all");
  if(TD.who!=="all"&&!ppl.some(p=>p.v===TD.who))TD.who=tdMeV()||"all";
  const {all,L}=tdList(),open=all.filter(t=>t.st!=="done");
  for(const id of [...TD.sel])if(!L.some(t=>t.id===id))TD.sel.delete(id);
  const stats=`<div class="td2-stats">${TDSTATS.map(([k,l,f,c])=>{const n=open.filter(f).length,on=TD.stat===k;return `<button type="button" class="td2-stat${on?" on":""}" data-tdstat="${k}" aria-pressed="${on}"><span class="l">${l}</span><span class="td2-sv ${n&&c?"c"+c:""}">${n}</span></button>`}).join("")}</div>`;
  const nSel=TD.sel.size;
  const ctl=`<div class="td2-ctl"><label class="td2-lab">Assignee${tdSelW('data-tdk="who" aria-label="Assignee"',[...ppl.map(p=>[p.v,p.n]),["all","Everyone"]],TD.who)}</label>
    <label class="td2-lab">Origin${tdSelW('data-tdk="origin" aria-label="Origin"',[["all","All origins"],["episode","Episodes"],["meeting","Meetings"],["person","Assigned by someone"]],TD.origin)}</label>
    <div class="td2-seg" role="group" aria-label="View"><button type="button" data-tdview="table" aria-pressed="${TD.view==="table"}">${TDI.table}Table</button><button type="button" data-tdview="kanban" aria-pressed="${TD.view==="kanban"}">${TDI.kanban}Kanban</button></div>
    <label class="td2-lab">Group by${tdSelW('data-tdk="group" aria-label="Group by"'+(TD.view==="kanban"?' title="Kanban is grouped by status"':""),[["none","None"],["status","Status"],["assignee","Assignee"],["origin","Origin"],["when","When"]],TD.group,TD.view==="kanban")}</label>
    <span class="td2-sp"></span><span class="td2-nsel" aria-live="polite">${nSel?nSel+" selected":""}</span>
    <span id="tdBulkAnchor">${tdSelW('data-tdbulk aria-label="Action on selected tasks"',[["","Select action"],["done","Mark as done"],["status","Change status"],["date","Change date"],["reassign","Reassign"],["notify","Notify in Slack"+(tdCanNotify()?"":" (soon)"),!tdCanNotify()],["delete","Delete"+(tdCanDelete()?"":" (soon)"),!tdCanDelete()]],"",nSel<2)}</span></div>`;
  const msg=TD.msg?`<p class="td2-msg${TD.msgBad?" bad":""}" role="status">${esc(TD.msg)}</p>`:"";
  return `<div class="td2"><h1 class="td2-h1">To-do</h1>${stats}${ctl}${msg}${TD.view==="kanban"?tdKanban(L):tdTable(L)}${tdMenuH()}${tdModalH()}</div>`}
/* keep what someone is typing when the page redraws (a save landing, the 10-minute refresh) */
const mpRenderTD0=mpRender;
mpRender=function(){const a=document.activeElement,root=$("mpRoot");let keep=null;
  if(a&&root&&root.contains(a)&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.type!=="checkbox")keep={f:a.dataset.tdf,id:a.dataset.id,elid:a.id,v:a.value,s:a.selectionStart,e:a.selectionEnd,dirty:a.value!==a.defaultValue};
  mpRenderTD0();if(!keep)return;
  const el=keep.elid?$(keep.elid):(keep.f&&root.querySelector(`[data-tdf="${keep.f}"][data-id="${keep.id}"]`));if(!el)return;
  if(keep.dirty)el.value=keep.v;el.focus();try{if(keep.s!=null)el.setSelectionRange(keep.s,keep.e)}catch(e){}};
/* ---------- tab wiring ---------- */
MPT.unshift(["todo","To-do"]);MP_SCOPE0.todo="all";
ASKQ.todo=["What's late this week, and who owns it?","What should I do first today?","Which episode has the most open tasks?"];
if(window.RL_AUTH&&!/(^|[#&])tab=/.test(location.hash))MP.tab="todo"; /* the team link opens on each person's own list */
const tdInTodo=t=>{const r=$("mpRoot");return r&&r.contains(t)&&MP.tab==="todo"};
const tdFocus=id=>requestAnimationFrame(()=>{const el=$(id);if(el){el.focus();if(el.showPicker&&el.type==="date"){try{el.showPicker()}catch(e){}}}});
function tdOpenMenu(kind,id,btn){const r=btn.getBoundingClientRect(),w=kind==="date"?250:220;
  TD.menu={kind,id,at:Date.now(),x:Math.max(8,Math.min(r.left,innerWidth-w-8)),y:Math.min(r.bottom+4,innerHeight-(kind==="who"?Math.min(420,tdPeople().length*36+40):kind==="date"?120:200))};TD.editDate=null;mpRender();if(kind==="date")tdFocus("tdBulkDate")}
function tdPick(v){const M=TD.menu;if(!M)return;const L=M.id==="bulk"?[...TD.sel]:[M.id];TD.menu=null;
  if(M.kind==="status")tdUpdate(L,{[TDTF.st]:TDSTORE[v]},L.length>1?`${pl(L.length,"task")} set to ${TDSK[v][1].toLowerCase()}.`:`Status set to ${TDSK[v][1].toLowerCase()}.`);
  else if(M.kind==="who"){const p=tdPerson(v);if(p&&p.id)tdUpdate(L,{[TDTF.own]:[p.id]},`${L.length>1?pl(L.length,"task")+" reassigned":"Reassigned"} to ${p.n}.`)}
  if(M.id==="bulk")TD.sel.clear()}
function tdOpenModal(type,idsL){TD.modal={type,ids:idsL};TD.menu=null;TD.editDate=null;if(type==="ntf"){TD.nTo={};TD.nType="input";TD.nMsg=""}else TD.draft="";TD.msg="";mpRender()}
function tdCommitNew(v){v=String(v||"").trim();const N=TD.newRow;if(!N)return;if(!v){TD.newRow=null;mpRender();return}tdCreate(v,N.st,N.who,N.due)}
document.addEventListener("click",ev=>{const root=$("mpRoot");if(!root||MP.tab!=="todo")return;const tgt=ev.target;
  if(TD.menu&&!tgt.closest(".td2-menu")&&!tgt.closest("[data-tdmenu]")&&!(tgt.closest("[data-tdbulk]"))){TD.menu=null;mpRender();if(!root.contains(tgt))return}
  if(!root.contains(tgt))return;
  const t=tgt.closest("[data-tdstat],[data-tdview],[data-tdmenu],[data-tdpick],[data-tdact],[data-tdto],[data-tdwhy]");if(!t)return;
  if(t.dataset.tdstat){TD.stat=TD.stat===t.dataset.tdstat?null:t.dataset.tdstat;TD.sel.clear();mpRender();return}
  if(t.dataset.tdview){TD.view=t.dataset.tdview;TD.menu=null;TD.newRow=null;try{localStorage.setItem("rlTodoView",TD.view)}catch(e){}mpRender();return}
  if(t.dataset.tdmenu){const same=TD.menu&&TD.menu.id===t.dataset.id&&TD.menu.kind===t.dataset.tdmenu;if(same){TD.menu=null;mpRender()}else tdOpenMenu(t.dataset.tdmenu,t.dataset.id,t);return}
  if(t.dataset.tdpick!=null){tdPick(t.dataset.tdpick);return}
  if(t.dataset.tdto){TD.nTo[t.dataset.tdto]=!TD.nTo[t.dataset.tdto];mpRender();return}
  if(t.dataset.tdwhy){TD.nType=t.dataset.tdwhy;mpRender();return}
  const a=t.dataset.tdact,id=t.dataset.id;
  if(a==="date"){TD.editDate=id;TD.menu=null;mpRender();tdFocus("tdDateIn")}
  else if(a==="add"){const st=t.dataset.st||"todo";TD.newRow={st,view:TD.view,who:TD.who!=="all"?TD.who:tdMeV(),due:TODAY};TD.stat=null;mpRender();tdFocus("tdNewIn")}
  else if(a==="upd")tdOpenModal("upd",[id]);
  else if(a==="ntf")tdOpenModal("ntf",[id]);
  else if(a==="close"){TD.modal=null;mpRender()}
  else if(a==="post")tdPostUpdate();
  else if(a==="send")tdSendNotify();
  else if(a==="everyone"){TD.who="all";mpRender()}
  else if(a==="bulkdate"||a==="bulkdateclear"){const v=a==="bulkdate"?(($("tdBulkDate")||{}).value||""):"";if(a==="bulkdate"&&!v)return;const L=[...TD.sel];TD.menu=null;TD.sel.clear();
    tdUpdate(L,{[TDTF.due]:v||null},v?`${pl(L.length,"task")} moved to ${tdWhen2(v)}.`:`${pl(L.length,"task")} now have no date.`)}});
document.addEventListener("change",ev=>{const t=ev.target;if(!tdInTodo(t))return;
  if(t.dataset.tdk){TD[t.dataset.tdk]=t.value;TD.sel.clear();TD.msg="";TD.newRow=null;mpRender();return}
  if(t.dataset.tdsel){t.checked?TD.sel.add(t.dataset.tdsel):TD.sel.delete(t.dataset.tdsel);mpRender();return}
  if(t.matches("[data-tdselall]")){const {L}=tdList();if(t.checked)L.forEach(x=>{if(!String(x.id).startsWith("new"))TD.sel.add(x.id)});else TD.sel.clear();mpRender();return}
  if(t.matches("[data-tdbulk]")){const v=t.value,L=[...TD.sel];t.value="";if(L.length<2)return;
    if(v==="done"){TD.sel.clear();tdUpdate(L,{[TDTF.st]:"Done"},`${pl(L.length,"task")} marked as done.`)}
    else if(v==="status")tdOpenMenu("status","bulk",$("tdBulkAnchor"));
    else if(v==="reassign")tdOpenMenu("who","bulk",$("tdBulkAnchor"));
    else if(v==="date")tdOpenMenu("date","bulk",$("tdBulkAnchor"));
    else if(v==="notify")tdOpenModal("ntf",L);
    else if(v==="delete")tdDelete(L);return}
  const f=t.dataset.tdf,id=t.dataset.id;if(!f)return;
  if(f==="new"){tdCommitNew(t.value);return}
  const r=tdRec(id);if(!r)return;
  if(f==="n"){const v=t.value.trim();if(!v){t.value=plain(r.fields[TDTF.n])||"";tdSay("A task needs a name.",1);return}if(v!==plain(r.fields[TDTF.n]))tdUpdate([id],{[TDTF.n]:v},"Name saved.")}
  else if(f==="desc"){const v=t.value.trim();if(v!==(plain(r.fields[TDTF.note])||""))tdUpdate([id],{[TDTF.note]:v||null},"Description saved.")}
  else if(f==="due"){const v=t.value||null;if(v&&!/^20\d\d-\d\d-\d\d$/.test(v))return;TD.editDate=null;if(v!==(d10(plain(r.fields[TDTF.due]))||null))tdUpdate([id],{[TDTF.due]:v},v?`Moved to ${tdWhen2(v)}.`:"Date cleared.");else mpRender()}});
document.addEventListener("input",ev=>{const t=ev.target;if(!tdInTodo(t))return;
  if(t.id==="tdDraft"){TD.draft=t.value;const b=document.querySelector('[data-tdact="post"]');if(b&&tdTU())b.disabled=!t.value.trim()||!!TD.busy.post}
  if(t.id==="tdNMsg"){TD.nMsg=t.value;const q=$("tdPrevQ");if(q){q.hidden=!t.value.trim();q.textContent="“"+t.value.trim()+"”"}}});
document.addEventListener("focusout",ev=>{const t=ev.target;if(!tdInTodo(t))return;
  if(t.id==="tdDateIn"&&TD.editDate)setTimeout(()=>{if(TD.editDate&&document.activeElement!==$("tdDateIn")){TD.editDate=null;mpRender()}},150);
  if(t.id==="tdNewIn"&&!t.value.trim())setTimeout(()=>{if(TD.newRow&&document.activeElement!==$("tdNewIn")){TD.newRow=null;mpRender()}},150)});
document.addEventListener("keydown",ev=>{const t=ev.target;if(!$("mpRoot")||MP.tab!=="todo")return;
  if(ev.key==="Escape"){if(TD.menu||TD.modal||TD.editDate||TD.newRow){TD.menu=null;TD.modal=null;TD.editDate=null;TD.newRow=null;mpRender();ev.preventDefault()}return}
  if(ev.key==="Enter"&&t.matches&&t.matches("input.td2-c,input.td2-kin")&&t.type!=="date"){ev.preventDefault();if(t.dataset.tdf==="new"){const v=t.value;t.value="";tdCommitNew(v)}else t.blur()}});
/* column resize: drag the edge of a header */
document.addEventListener("mousedown",ev=>{const h=ev.target.closest&&ev.target.closest("[data-tdrz]");if(!h)return;ev.preventDefault();
  const k=h.dataset.tdrz,x0=ev.clientX,w0=TD.w[k],tbl=h.closest(".td2-t");
  const mv=e=>{TD.w[k]=Math.max(90,Math.min(900,w0+e.clientX-x0));tbl.style.setProperty("--cols",tdCols())};
  const up=()=>{removeEventListener("mousemove",mv);removeEventListener("mouseup",up);try{localStorage.setItem("rlTodoW",JSON.stringify(TD.w))}catch(e){}};
  addEventListener("mousemove",mv);addEventListener("mouseup",up)});
addEventListener("scroll",ev=>{if(TD.menu&&MP.tab==="todo"&&Date.now()-TD.menu.at>400&&!(ev.target.closest&&ev.target.closest(".td2-menu"))){TD.menu=null;mpRender()}},{passive:true,capture:true});
mpRender();
