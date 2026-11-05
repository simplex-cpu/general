
/* ---------- v23: Podcast pipeline main tabs (Karen's design, podcast-pipeline-main-tabs.zip) ----------
   Summarises what people enter in the episode window. Every episode row, card or name opens the window at the matching tab. */
const MPT=[["overview","Overview"],["thumbs","Thumbnails"],["clips","Clips"],["drops","Content Drops"],["files","Files"],["release","Release"],["post","Post Release"],["testing","Testing & Recovery"]];
const MP={tab:"overview",sel:null,status:"all",scope:{},open:null,ask:false,test:null,D:null,F:{}};
const MP_SCOPE0={overview:"all",thumbs:"all",clips:"all",release:"all",post:"released",testing:"released"};
const MPF={stage:"fld0cRVyWmcMjy0cq",clipSt:"fldIrcw9I8EGWvxUB",thumbSt:"fldwbHzXGYhBtYRiY",perfPlan:"fldO0TfbhkGRKOaDf",ideas:"fldvj6YJ5p3cR858k",ideasLink:"fldR7tJUVPt1mbBIj",textSent:"fldogKRkmVKhk2epY",cbrief:"fldcnWFxiiQQe4XfQ",cbriefLink:"fldJeeQos7hEIIf97",
  pB:"fldzaj1hoB5NsfNQM",pT:"fldxkJkXe4sOm5j0z",pC:"fldx1hizhzO8UuBHl",check:"fldYpZhfknAUyIpw7",signed:"fldgDUPKpAoja7sc3",fit:"fldoTxGKMiel06LfD",
  s7:"fld3SQtnGAahNVTgu",s7b:"fldO9EldQ4easLprX",s7c:"fld7Y9oxvS12kHDXy",s7d:"fldAyeqdHq49VM8IV",p1:"fld29QSctPa02aHAs",p2:"fldRNO4vxpTpQwVQW",p3:"fldKeGqCKyNO2InbY",p4:"fld7wWO4LFgFLUL2X",p5:"fldlaedsqgndcVCpP",p6:"fldJVGg0Nz9koWB1P",
  rec:"fldqLVEG3bUns7XmM",cp7:"fldiDgOd4MZE8SWhT",cp14:"fldBXSuvgQrhLoHBk",cp30:"fld1xWbsoEMwj9Xrq",thumbs:"fldUx74YD8PTXX2IW",dFinal:"fldscZCvyUZM0Ht0z",plFinal:"fldjhBTkAcsdt7VAf"};
const STAGES=["Pre-recording","Pre-release","Clipping","First 30 days","Growing","Stalled"];
const PROD_P=["p1","p3","p4","p5","p6"],GUEST_P=["p2"];
const fv=(m,k2)=>m.f?m.f[MPF[k2]]:undefined;
const MPI=ic;
/* ---------- data: the /data copy (hosted) or the connector (Claude copy) ---------- */
/* the page keeps only the tables it already knew (fromRest); the pipeline also needs drops, plans, steps, promotion and the Clips summary */
const fromRestM=fromRest;fromRest=function(j){MP.raw=j;const out=fromRestM(j);setTimeout(()=>{try{mpIndex(out);mpRender()}catch(e){console.error(e)}},0);return out};
function mpIndex(D){MP.D=Object.assign({},MP.extra||{},MP.raw||{});
  for(const r of (D&&D.episodes)||[]){const rid=r._rid||r.id;if(rid)MP.F[rid]=Object.assign(MP.F[rid]||{},r.fields||r)}}
const applyLiveM=applyLive;
applyLive=function(D){const r=applyLiveM(D);try{mpIndex(D);if(window.claude?.use&&!MP.D.clipAgg)mpLoadMcp().then(()=>mpRender());mpRender()}catch(e){console.error(e)}return r};
async function mpLoadMcp(){if(MP.mcpBusy||MP.extra)return;MP.mcpBusy=true;
  try{const mcp=await window.claude.use("mcp");if(!mcp)return;const S=EPSPEC;
    const q=async(t,f)=>{let out=[],c=null;do{const r=await mcp.callTool("Airtable","list_records_for_table",{baseId:S.base,tableId:t,fieldIds:f,pageSize:1000,...(c?{cursor:c}:{})},{cache:false});const p=r.payload||{};out=out.concat((p.records||[]).map(z=>({id:z.id,fields:z.cellValuesByFieldId||{}})));c=p.nextCursor||null}while(c);return out};
    const [eps,drops,plan,steps,promo,todo,team,clips]=await Promise.all([q(S.t.episodes,["fldhFqJB0E9XM6plr",...Object.values(MPF)]),q(S.t.drops,["fldcwjpTJSJ6Hph0n","fldya9NZJA4Up7ijX","fldW3uULfZGrud6vv","fldZUOykd9zjc1ACW","fldtstRB2WlIkmWZ4"]),
      q(S.t.plan,["fldzRyaWVGuRkFpFP","fldEZ6HfvwSrC5oNW","fldCDlM3VG8HSmulF","fld2v0Rl67sbxbFUd"]).catch(()=>[]),q(S.t.steps,["fldGQOtQlC7GEqoiL","fldZm5XfnMBGmNcFR","fldCBWTUjlMX43SFG","fldPl1XbgxtJ9lE8I"]).catch(()=>[]),
      q(S.t.promo,["fldKVLEqCrxthYeW3","fldMY53GRjyEDoyLl"]).catch(()=>[]),q("tblo67QERNSmGzVaJ",["fldypaV3pfGFUwUV2","fld54iDcRB5PIU4Tp","fldnFWw9MtpsrUD6A","fldBf1bXOOwnzmZ0J","fldeQQ12J1kfXXs9C","fldcWWR8KvT1XH6eM","fld6jZiM5KtFKnFvi"]).catch(()=>[]),q(S.t.team,["fld2G3e9kvvIeeLsz","fldz3bu5bA5keFmmO"]).catch(()=>[]),q(S.t.clips,["fldhAaaiSM9Dqmg4D","fldl6MYUm95XZtM4l","fld8DT5hjs31ZRqcX","flddzQ28WDQjAQUgT","fld7wfnxpx1vjGUbB","fldliD2BZ8hqcB6Ts","fld0R7YV5RmhZLQ0R","fldnizqALqzDJnT6Q","fldmxU9iggjM3lNKy","fldVmhQ6oDMB14sc8","fldkvEVccJSihgTf0"])]);
    for(const r of eps)MP.F[r.id]=Object.assign(MP.F[r.id]||{},r.fields);
    MP.extra={drops,plan,steps,promo,todo,team,clipAgg:clipAgg(clips.map(r=>r.fields),TODAY)};Object.assign(MP.D,MP.extra)}
  catch(e){console.error(e)}finally{MP.mcpBusy=false}}
/* ---------- the episodes in the pipeline ---------- */
const linkTo=(v,rid)=>ids(v).includes(rid);
function mpAll(){const first=EP.map(e=>DATE[e.id]).filter(Boolean).sort()[0]||"2026-01-01",last=addD(TODAY,120),seen=new Set(),out=[];
  const add=id=>{if(seen.has(id))return;const x=EPREC[id],rel=(x&&x.rel)||DATE[id];if(!rel||rel<first||rel>last)return;seen.add(id);
    const e=EP.find(z=>z.id===id),b=B[id]||{},rid=x&&x.rid;
    out.push({id,rid,name:(x&&x.name)||b.n||(e&&e.n)||id,rel,released:rel<=TODAY,e,b,x,f:rid?MP.F[rid]||{}:{},st:b.st||"ok",solo:!!(e&&e.solo)||/solo/i.test((x&&x.name)||"")})};
  for(const e of EP)add(e.id);for(const id of Object.keys(EPREC))add(id);
  return out.sort((a,c)=>a.rel.localeCompare(c.rel))}
function mpList(tab){const scope=MP.scope[tab]||MP_SCOPE0[tab];
  return mpAll().filter(m=>(!MP.sel||MP.sel.includes(m.id))&&(MP.status==="all"||m.st===MP.status)&&(scope==="all"||m.released))}
const agg=m=>(MP.D&&MP.D.clipAgg&&MP.D.clipAgg.e&&m.rid&&MP.D.clipAgg.e[m.rid])||null;
const rowsFor=(key,link,m)=>((MP.D&&MP.D[key])||[]).filter(r=>m.rid&&linkTo(r.fields[link],m.rid));
const dropsOf=(m,thumb)=>rowsFor("drops","fldya9NZJA4Up7ijX",m).filter(r=>{const pf=ids(r.fields.fldtstRB2WlIkmWZ4)[0],t=String(nm(r.fields.fldW3uULfZGrud6vv)||"");const isT=pf?pf===FM_THUMB.id:/thumb/i.test(t);return thumb?isT:!isT});
const delivered=(m,thumb)=>{const d=dropsOf(m,thumb).reduce((a,r)=>a+(+nm(r.fields.fldZUOykd9zjc1ACW)||0),0);return d||(thumb?+nm(fv(m,"thumbs"))||0:0)};
/* clips planned: the episode window's plan rows (one per format), and the episode's B-roll / TP / carousel targets for any of those three without a row.
   (Before v26 one extra row, e.g. Vivek's 10 trial reels, replaced the whole plan.) Counts clips, not posts per platform. */
const PLANBASE={recAnp033Xxor6YNC:"pB",recoxzL7ZO4twKWQa:"pT",recxx2Fa9fQPEorRz:"pC"};
const planned=m=>clipPlan({pB:nm(fv(m,"pB")),pT:nm(fv(m,"pT")),pC:nm(fv(m,"pC"))},rowsFor("plan","fldEZ6HfvwSrC5oNW",m).map(r=>({fid:ids(r.fields.fldCDlM3VG8HSmulF)[0]||null,v:nm(r.fields.fld2v0Rl67sbxbFUd)})));
const stepRows=(m,lane)=>rowsFor("steps","fldZm5XfnMBGmNcFR",m).filter(r=>nm(r.fields.fldCBWTUjlMX43SFG)===lane);
const isDoneV=v=>/^done$/i.test(nm(v)||"");
function stageOf(m){const s=nm(fv(m,"stage"));if(s)return s;
  if(!m.released){const rec=d10(nm(fv(m,"rec")));if(rec&&rec>TODAY)return "Pre-recording";return dayDiff(m.rel,TODAY)<=7?"Clipping":"Pre-release"}
  if(dayDiff(TODAY,m.rel)+1<=30)return "First 30 days";return ((m.e&&m.e.wk)||0)>=PACE.stalled?"Growing":"Stalled"}
/* v28: the four statuses. Health (Act / Watch / Leave alone) is worked out live; these three are saved on the episode.
   With nothing saved yet, a suggestion is shown from the timeline boxes and the tests (in grey, marked "suggested"). */
const ST3=[["clipSt","Clipping","Clips",["Brief Topics","Plan Clips","In Production","Posting On Track","Posting Behind","Top for Trailer","Top Selected"]],
  ["thumbSt","Thumbnails prep","Thumbs",["Plan Variations","In Production","Posting On Track","Posting Behind","Select Top 3","Top 3 Selected"]],
  ["perfPlan","Performance plan","Perf",["Not Needed","Plan Tests","Testing","Collect Data","Closed"]]];
function st3Sug(m,k){const S=k2=>typeof tdSt==="function"?tdSt(m,k2):"Not started",D=v=>/^done$/i.test(v),N=v=>/^not started$/i.test(v);
  if(k==="perfPlan"){if(!m.released)return "";const x=EPREC[m.id]||{},T=(typeof TT!=="undefined"&&TT[m.id])||[],o=[...T].reverse().find(t=>t.start&&!t.end&&!t.win);
    if(x.letgo)return "Closed";if(o)return dayDiff(TODAY,o.start)>5?"Collect Data":"Testing";return m.st==="act"?"Plan Tests":"Not Needed"}
  /* v33 QA: picks and posting come from the Clips summary (tp trailer picks, t3 thumbnail top 3, p posted), so a step ticked late doesn't hold the status back */
  const a=agg(m)||{},tp=+a.tp||0,t3=+a.t3||0,posted=+a.p||0;
  if(k==="clipSt"){if(m.released||D(S("6")))return tp>=3?"Top Selected":"Top for Trailer";
    if(!D(S("3a"))||!D(S("3b")))return posted?"Posting On Track":"Brief Topics";
    const p=S("6"),due=typeof tdv==="function"?d10(nm(tdv(m,"dPostDone")))||"":"";
    if(!N(p)||posted)return /problem/i.test(p)||(due&&due<TODAY)?"Posting Behind":"Posting On Track";
    if(N(S("5a"))&&N(S("5b")))return "Plan Clips";return "In Production"}
  if(k==="thumbSt"){if(t3>=3)return "Top 3 Selected";if(m.released)return "Select Top 3";if(!D(S("3d")))return "Plan Variations";if(!D(S("4")))return "In Production";
    return m.rel&&dayDiff(m.rel,TODAY)<=7?"Select Top 3":"Posting On Track"}
  return ""}
function st3Of(m,k){const v=nm(fv(m,k));if(v)return {v:String(v),auto:false};let g="";try{g=st3Sug(m,k)}catch(e){}return {v:g,auto:!!g}}
const st3Line=m=>{const a=ST3.map(([k,l,sh])=>{const o=st3Of(m,k);return o.v?`<em class="${o.auto?"au":""}" title="${esc(l+": "+o.v+(o.auto?" (suggested from the timeline, not saved yet)":""))}"><b>${sh}</b>${esc(o.v)}</em>`:""}).filter(Boolean);
  return a.length?`<span class="mp-st3">${a.join("")}</span>`:""};
const tgt=(m,n)=>+nm(fv(m,"cp"+n))||PACE["d"+n];
/* ---------- small parts (design system §4) ---------- */
const SCL={act:["r","Act"],watch:["a","Watch"],ok:["g","Leave alone"]};
const stChip=st=>{const [c,l]=SCL[st]||SCL.ok;return `<span class="mp-chip ${c}"><i></i>${l}</span>`};
const step=(kind,txt)=>kind==="done"?`<span class="mp-step done">${MPI("check",12,"currentColor",null,3)}${esc(txt||"Done")}</span>`:kind==="amber"?`<span class="mp-step amber">${MPI("wait",12,"currentColor",null,2.4)}${esc(txt)}</span>`:kind==="late"?`<span class="mp-step late"><b>!</b>${esc(txt)}</span>`:kind==="ns"?`<span class="mp-step ns">Not started</span>`:`<span class="mp-step no">${esc(txt||"No status")}</span>`;
const none=(m,txt)=>m.released?step("no",txt):step("ns");
const tileM=(lab,val,sub,c,icon)=>`<div class="mp-tile"><span class="lab">${icon||""}${lab}</span><span class="val ${c||""}">${val}</span><span class="sub">${sub||""}</span></div>`;
const IC={bad:()=>MPI("alert",16,"#B42318","Behind"),wait:()=>MPI("wait",16,"#A15C00","Waiting"),ok:()=>MPI("ok",16,"#1E7B4A","On track")};
const dash=`<span class="mp-na">—</span>`;
const cardS=(title,sub,right,body)=>`<section class="mp-card"><div class="mp-ch"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:""}</div>${right||""}</div>${body}</section>`;
const tblM=(cols,head,rows,foot)=>`<div class="mp-tbl" role="table"><div class="mp-tr hd" role="row" style="--c:${cols}">${head.map(h=>`<span role="columnheader">${h}</span>`).join("")}</div>${rows||`<div class="mp-empty">No episodes match the filters.</div>`}${foot?`<div class="mp-tf">${foot}</div>`:""}</div>`;
const trM=(cols,cells,m,tab,cls)=>`<div class="mp-tr ${cls||""}" role="row" style="--c:${cols}" ${m?`data-mpep="${m.id}" data-mptab="${tab}" tabindex="0"`:""}>${cells.map(c=>`<span role="cell">${c}</span>`).join("")}</div>`;
const num=n=>`<span class="mp-n">${n}</span>`;
const epCell=(m,sub)=>`<span class="mp-ep"><b>${esc(m.name)}</b><small>${sub!=null?sub:m.rel===TODAY?fmtD(m.rel)+" · today":m.released?"Released "+fmtD(m.rel):fmtD(m.rel)}</small></span>`;
const circ=n=>`<span class="mp-circ">${n}</span>`;
const weekDaysM=()=>{const mon=addD(TODAY,-((new Date(TODAY+"T00:00:00Z").getUTCDay()+6)%7));return [...Array(7)].map((_,i)=>addD(mon,i))};
const DNM=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function weekPosts(list,thumb){const rids=new Set(list.map(m=>m.rid)),W=(MP.D&&MP.D.clipAgg&&MP.D.clipAgg.w)||[];
  return W.filter(([ep,on,k2])=>rids.has(ep)&&(thumb?k2==="thumb":k2!=="thumb"))}
/* ---------- shell ---------- */
function mpShell(){const host=$("v-podcast");if(!host||$("mpRoot"))return;
  const old=document.createElement("div");old.id="mpOld";old.hidden=true;while(host.firstChild)old.appendChild(host.firstChild);host.appendChild(old);
  const root=document.createElement("div");root.id="mpRoot";root.className="mp";host.insertBefore(root,old);
  try{const p=new URLSearchParams(location.hash.slice(1));if(MPT.some(t=>t[0]===p.get("tab")))MP.tab=p.get("tab");if(p.get("episodes"))MP.sel=p.get("episodes").split(",");if(/^(act|watch|ok)$/.test(p.get("status")||""))MP.status=p.get("status");if(/^(all|released)$/.test(p.get("scope")||""))MP.scope[MP.tab]=p.get("scope")}catch(e){}}
function mpUrl(){try{if(/^#ep=/.test(location.hash))return;const p=new URLSearchParams({tab:MP.tab});if(MP.sel)p.set("episodes",MP.sel.join(","));if(MP.status!=="all")p.set("status",MP.status);const sc=MP.scope[MP.tab];if(sc)p.set("scope",sc);history.replaceState(null,"","#"+p)}catch(e){}}
const ASKQ={overview:["Which episodes need me this week?","Why is growth up on week-1 views?","Which empty release slot is most urgent?"],
  thumbs:["Which episodes are behind on thumbnail posts?","Which thumbnail designs performed best?","What should Jean work on next?"],
  clips:["Which formats get the most views?","Which episode is furthest behind its clip plan?","What should we clip more of?"],
  release:["Is the next release on track?","What's still missing for the next 4 releases?","Which releases weren't fully checked off?"],
  post:["Which guests haven't been thanked?","Which episodes have a sales fit?","What promotion is planned this week?"],
  testing:["Which stalled episode should we test next?","What has worked best in our tests?","Where are we slowest to react?"]};
function mpRender(){mpShell();const root=$("mpRoot");if(!root)return;const tab=MP.tab,all=mpAll(),scope=MP.scope[tab]||MP_SCOPE0[tab];
  const upto=UPTO?fmtD(String(UPTO).slice(0,10)):"";
  const fn={todo:mpTodo,drops:mpDrops,files:mpFiles,overview:mpOverview,thumbs:mpThumbs,clips:mpClips,release:mpRelease,post:mpPost,testing:mpTesting}[tab];
  let body="";try{body=fn(mpList(tab))}catch(e){console.error(e);body=`<p class="mp-err">This tab couldn't load. Refresh the page.</p>`}
  const selN=MP.sel?MP.sel.length:0;
  /* v31: Sales-style shell. White top bar with a breadcrumb, a left sidebar for the sections (stacks on a phone), no page title */
  const tl=(MPT.find(z=>z[0]===tab)||[,""])[1],dash=window.RL_AUTH?"ReLearn Team Dashboard":"ReLearn CEO Dashboard";
  root.innerHTML=`<div class="mp-crumb"><div class="mp-bcr"><span>${dash}</span><span aria-hidden="true">/</span><span>Podcast</span><span aria-hidden="true">/</span><b>${esc(tl)}</b></div><div class="mp-tr2">${upto?`<span class="mp-upto">YouTube data up to ${upto}</span>`:""}
      <div class="mp-askw"><button type="button" class="mp-b2" data-mpact="ask" aria-expanded="${MP.ask}">${MPI("spark",16,"currentColor",null,2)}Ask AI</button>${MP.ask?mpAsk(tab):""}</div></div></div>
    <div class="mp-shell"><nav class="mp-side" aria-label="Podcast sections"><div class="mp-sgl">Podcast</div><div class="mp-sl" role="tablist" aria-orientation="vertical">${MPT.map(([k2,l])=>`<button type="button" role="tab" data-mpt="${k2}" aria-selected="${tab===k2}">${l}</button>`).join("")}</div>
      <div class="mp-sgl">Coming soon</div><div class="mp-sl"><span class="mp-soon">Guest booking <i>Soon</i></span></div></nav>
    <div class="mp-main">    <div class="mp-body">${tab==="todo"||tab==="drops"||tab==="files"?"":`<h1 class="mp-h1">${esc(tl)}</h1><div class="mp-filters"><div class="mp-epw"><button type="button" class="mp-sel mp-epb" data-mpact="eps" aria-expanded="${MP.open==="eps"}">${MPI("file",16,"currentColor",null,2)}Episodes: ${selN?selN+" selected":"All ("+all.length+")"}</button>${MP.open==="eps"?mpEpPop(all):""}</div>
      <select class="mp-sel" aria-label="Status" data-mpk="status">${[["all","All statuses"],["act","Act"],["watch","Watch"],["ok","Leave alone"]].map(([v,l])=>`<option value="${v}"${MP.status===v?" selected":""}>${l}</option>`).join("")}</select>
      <div class="mp-seg" role="group" aria-label="Which episodes">${[["all","All"],["released","Released"]].map(([v,l])=>`<button type="button" data-mpscope="${v}" aria-pressed="${scope===v}">${l}</button>`).join("")}</div></div>`}${body}</div></div></div>`;
  if(tab==="testing")mpWireChart()}
function mpEpPop(all){const on=new Set(MP.draft||MP.sel||[]);return `<div class="mp-pop" role="dialog" aria-label="Pick episodes"><div class="mp-poph"><b>Pick one or more</b><button type="button" class="mp-link" data-mpact="epclear">Clear</button></div>
  <div class="mp-popl">${all.map(m=>`<label><input type="checkbox" data-mpchk="${m.id}" ${on.has(m.id)?"checked":""}>${esc(m.name)}<small>${fmtD(m.rel)}</small></label>`).join("")}</div>
  <div class="mp-popf"><button type="button" class="mp-b1 sm" data-mpact="epdone">Done</button></div></div>`}
function mpAsk(tab){const t=MPT.find(z=>z[0]===tab)[1];return `<div class="mp-ask" role="dialog" aria-label="Ask AI"><div class="mp-askh"><b>Ask AI</b><button type="button" class="mp-x" aria-label="Close" data-mpact="ask">${MPI("x",16)}</button></div>
  <p class="mp-askl">Looking at: ${MP.sel?MP.sel.length+" episodes":"All episodes"} · ${t}</p><div class="mp-asks">${ASKQ[tab].map(q=>`<button type="button" data-mpq="${esc(q)}">${esc(q)}</button>`).join("")}</div>
  <div class="mp-askf"><input type="text" id="mpAskIn" aria-label="Your question" placeholder="Ask about these episodes" value="${esc(MP.q||"")}"><button type="button" class="mp-b1 sm" data-mpact="asksend">Ask</button></div>
  ${MP.ans!=null?`<div class="mp-ans">${esc(MP.ans)}</div>`:""}</div>`}
async function mpAskSend(){const inp=$("mpAskIn"),q=(inp&&inp.value||"").trim();if(!q)return;MP.q=q;
  let s=null;try{s=window.claude?.use?await window.claude.use("sample"):null}catch(e){}
  if(!s){MP.ans="Ask AI answers in the Claude version of the dashboard for now.";mpRender();return}
  const list=mpList(MP.tab).map(m=>({name:m.name,release:m.rel,status:SCL[m.st][1],stage:stageOf(m),task:m.b.step||null,owner:m.b.owner||null,views:m.e?{d7:m.e.d7,d14:m.e.d14,d30:m.e.d30,total:m.e.now,lastWeek:m.e.wk}:null,clips:agg(m)}));
  MP.ans="Thinking…";mpRender();
  try{await s(`You answer questions about the ReLearn podcast pipeline dashboard (tab: ${MP.tab}). Be brief and direct, plain sentences, no markdown. Data (JSON): ${JSON.stringify(list).slice(0,60000)}\n\nQuestion: ${q}`,{onText:({text})=>{MP.ans=text;const a=document.querySelector(".mp-ans");if(a)a.textContent=text}});mpRender()}
  catch(e){MP.ans=e&&e.code==="not_granted"?"Ask AI needs permission to run here.":"Couldn't get an answer. Try again.";mpRender()}}
/* ---------- Overview ---------- */
function mpOverview(L){const act=L.filter(m=>m.st==="act"),watch=L.filter(m=>m.st==="watch"),up=L.filter(m=>!m.released&&m.rel>=TODAY),next=up[0];
  const slots=mpSlots(),empty=slots.filter(z=>!z.m);
  /* growth: average first-week views of the last 4 releases vs every release before them. Only episodes whose whole first week is in the YouTube data.
     (Comparing with just the 4 before swung wildly: a run of quiet July launches made it read +1600%.) */
  const upto=String(UPTO||TODAY).slice(0,10),full=m=>m.released&&m.e&&m.e.d7!=null&&addD(m.rel,6)<=upto;
  const rel=L.filter(full).sort((a,c)=>c.rel.localeCompare(a.rel)),l4=rel.slice(0,4),pb=rel.slice(4),avg=a=>a.reduce((s,m)=>s+m.e.d7,0)/a.length;
  const A4=l4.length?avg(l4):null,AB=pb.length?avg(pb):null,gr=l4.length>=2&&pb.length>=2?Math.round(A4/AB*100-100):null;
  const rail=`<div class="mp-rail" style="--n:5">${tileM("Need you",String(act.length),"Act now",act.length?"r":"g",act.length?IC.bad():IC.ok())}${tileM("To watch",String(watch.length),"Check this week",watch.length?"a":"g",IC.wait())}
    ${tileM("Next release",next?(next.rel===TODAY?"Today":fmtD(next.rel)):"—",next?esc(next.name):"Nothing scheduled","a",IC.wait())}${tileM("Empty release slots",String(empty.length),empty.length?fmtD(empty[0].d):"Next 12 weeks filled",empty.length?"r":"g",empty.length?IC.bad():IC.ok())}
    ${tileM("Growth",gr==null?"—":(gr>=0?"+":"")+gr+"%",gr==null?"Needs 6 released episodes":`First-week views: last ${l4.length} avg ${k(Math.round(A4))} vs ${k(Math.round(AB))} for the ${pb.length} before`,gr==null?"":gr>=0?"g":"r",gr==null?"":gr>=0?IC.ok():IC.bad())}</div>`;
  const by={};for(const s of STAGES)by[s]=[];for(const m of L)(by[stageOf(m)]||by["Pre-release"]).push(m);
  const due=w=>{w=String(w||"");if(!w||w==="–")return "";return `<span class="due ${/late|overdue/i.test(w)?"r":/today|running/i.test(w)?"a":""}">${esc(w)}</span>`};
  const card=m=>`<button type="button" class="mp-kc${m.st==="act"?" act":""}" data-mpep="${m.id}" data-mptab="overview"><b>${esc(m.name)}</b><span class="r1">${stChip(m.st)}<span>${fmtD(m.rel)}</span></span><span>${esc(m.b.step||"—")}</span><span class="mu">${esc(m.b.owner&&m.b.owner!=="–"?m.b.owner:"")}</span>${due(m.b.when)}${tdAlso(m)}${st3Line(m)}</button>`;
  const board=cardS("Where every episode is","Click a card to open the episode.",`<div class="mp-leg"><span><i class="r"></i>Act</span><span><i class="a"></i>Watch</span><span><i class="g"></i>Leave alone</span></div>`,
    `<div class="mp-board">${STAGES.map(s=>`<div class="mp-col"><div class="mp-colh"><b>${s}</b><span>${by[s].length}</span></div>${by[s].length?by[s].map(card).join(""):`<div class="mp-none">No episodes here</div>`}</div>`).join("")}</div>`);
  const cols="minmax(0,1.6fr) 150px 96px 96px 96px 66px 70px 92px 80px 130px";
  const pill=(m,n)=>{const v=m.e&&m.e["d"+n];if(v==null){const dd=m.e&&m.e["d"+n+"due"];return dd?`<span class="mu">${esc(dd)}</span>`:dash}const ok=v>=tgt(m,n),r=rank("d"+n,m.id);return `<span class="mp-pill ${ok?"g":"r"}">${k(v)}</span>${r?`<small class="rk">${ord(r.r)}</small>`:""}`};
  const perfRows=[...L].filter(m=>m.e).sort((a,c)=>c.rel.localeCompare(a.rel)).map(m=>{const a=agg(m),pl=planned(m),p=a?a.p:0,V=VERD[verdict(m.id)],r=rank("clip",m.id);
    const ppl=pl?`<span class="mp-bar"><i style="width:${Math.min(100,Math.round(p/pl*100))}%" class="${p>=pl?"g":"r"}"></i></span><span>${Math.round(p/pl*100)}%</span>`:`<span class="mu">No plan yet</span>`;
    return trM(cols,[`<span class="mp-ep in"><b>${esc(m.name)}</b><small>${fmtD(m.rel)}</small></span>`,`<span class="mp-tag ${V[0]==="s-act"?"r":V[0]==="s-watch"?"a":V[0]==="s-ok"?"g":""}">${V[1]}</span>`,pill(m,7),pill(m,14),pill(m,30),
      m.e.now!=null?k(m.e.now):dash,m.e.wk!=null?"+"+k(m.e.wk):dash,m.e.clip!=null?`${k(m.e.clip)}${r?` <small class="rk">${ord(r.r)}</small>`:""}`:dash,a?String(a.p):dash,ppl],m,"overview")}).join("");
  const perf=cardS("How episodes are performing","Click an episode to open it","",tblM(cols,["Episode","Main issue","First 7 days","First 14 days","First 30 days","Total","Last week","Best clip","Clips posted","Posted vs. planned"],perfRows,`<span class="mu">Clips posted counts each clip once, whatever number of platforms it went out on. Planned is the episode's clip plan (B-rolls, talking points, carousels and any extra formats).</span>`));
  return rail+board+perf}
function mpSlots(){const all=mpAll(),d0=new Date(TODAY+"T00:00:00Z"),dow=d0.getUTCDay(),thu=addD(TODAY,(4-dow+7)%7);
  return [...Array(12)].map((_,i)=>{const d=addD(thu,i*7);return {d,m:all.find(m=>m.rel===d)||all.find(m=>Math.abs(dayDiff(m.rel,d))<=1&&!m.released)}})}
/* ---------- week cards ---------- */
function weekCards(list,thumb){const wd=weekDaysM(),P=weekPosts(list,thumb),FK=["broll","talk","carousel","single","trailer"];
  return `<div class="mp-week">${wd.map((d,i)=>{const fut=d>=TODAY,ps=P.filter(z=>z[1]===d&&(fut?z[3]==="s":z[3]==="p"));
    const inner=thumb?`<strong>${ps.length}</strong>`:`<div class="mp-fg">${FK.map(f=>`<span title="${fmName(f)}">${fmIcon(f,14)}${ps.filter(z=>z[2]===f).length}</span>`).join("")}</div>`;
    return `<div class="mp-day${fut?" fut":""}"><div class="dh"><b>${DNM[i]} ${+d.slice(8)}</b><i>${fut?"Scheduled":"Posted"}</i></div>${inner}</div>`}).join("")}</div>`}
const weekLabel=()=>{const wd=weekDaysM();return `${fmtD(wd[0])} – ${fmtD(wd[6])}`};
/* ---------- Thumbnails ---------- */
function mpThumbs(L){const rows=[...L.filter(m=>!m.released),...L.filter(m=>m.released).reverse()];
  const info=m=>{const a=agg(m)||{pt:0,t3:0,rt:0,st:0},dl=delivered(m,true),ideas=nm(fv(m,"ideas"))||nm(fv(m,"ideasLink")),sent=d10(nm(fv(m,"textSent")));return {a,dl,ideas,sent}};
  const I=rows.map(m=>({m,...info(m)})),wk=weekPosts(L,true),wd=weekDaysM();
  const noIdeas=I.filter(z=>!z.m.released&&!z.ideas&&!z.sent).length,dl=I.reduce((s,z)=>s+z.dl,0),top=[...I].sort((a,c)=>c.dl-a.dl)[0];
  const ready=I.reduce((s,z)=>s+Math.max(0,z.dl-z.a.pt,z.a.rt),0), /* v33: designs not posted, or rows waiting, whichever is larger (was both added up) */postedW=wk.filter(z=>z[3]==="p"&&z[1]>=wd[0]&&z[1]<TODAY).length,schedW=wk.filter(z=>z[3]==="s").length;
  const relI=I.filter(z=>z.m.released&&z.a.pt),picked=relI.filter(z=>z.a.t3>=3).length;
  const rail=`<div class="mp-rail" style="--n:5">${tileM("Text ideas to write",noIdeas?String(noIdeas):"—",noIdeas?"Upcoming, no ideas yet":"All upcoming have ideas",noIdeas?"a":"",IC.wait())}
    ${tileM("Designs delivered",dl?String(dl):"—",dl&&top?`${esc(top.m.name.split(" ")[0])} · ${top.dl}`:"No drops logged yet",dl?"g":"",dl?IC.ok():IC.wait())}
    ${tileM("Ready to post",String(ready),"Delivered, not posted",ready?"a":"",IC.wait())}
    ${tileM("Posted / scheduled",`${postedW} / ${schedW}`,weekLabel(),postedW?"g":"r",postedW?IC.ok():IC.bad())}
    ${tileM("Top 3 picked",relI.length?`${picked} of ${relI.length}`:"—","Released episodes",picked===relI.length&&relI.length?"g":"a",IC.wait())}</div>`;
  const week=cardS("Posted / scheduled this week","",`<span class="mp-r">Thumbnail posts per day</span>`,weekCards(L,true));
  const cols="minmax(0,1.5fr) 128px 130px 130px 120px 130px 120px";
  const body=I.map(({m,a,dl,ideas,sent})=>{const target=dl||30;
    const s1=sent?step("done","Sent "+fmtD(sent)):ideas?step("amber","Written"):none(m);
    const s2=!dl?none(m):m.released?step(a.pt>=dl?"done":"amber",`${dl} · ${Math.min(a.pt,dl)} posted`):step(dl>=30?"done":"amber",`${dl} of 30`); /* v33: released episodes compare designs with posted */
    const s3=a.t3?step(a.t3>=3?"done":"amber",`${Math.min(3,a.t3)} of 3`):none(m);
    const s4=a.pt?step(a.pt>=target?"done":m.released?"late":"amber",`${a.pt} of ${target}`):none(m);
    const need=m.released&&dl&&dl-a.pt>0?`<span class="mp-tag r"><b>!</b> ${dl-a.pt} to post</span>`:dash;
    return trM(cols,[epCell(m),stChip(m.st),s1,s2,s3,s4,need],m,"thumbs")}).join("");
  return rail+week+cardS("Thumbnails by episode","One row per episode · columns follow the steps in the episode window","",tblM(cols,["Episode","Status",circ(1)+"Text ideas",circ(2)+"Designs",circ(3)+"Top 3",circ(4)+"Posted","Needs"],body,`<span class="mu">Click an episode to open its Thumbnails tab.</span>`))}
/* ---------- Clips ---------- */
function mpClips(L){const rows=L.filter(m=>!m.released||dayDiff(TODAY,m.rel)<30).sort((a,c)=>(a.released?1:0)-(c.released?1:0)||(a.released?c.rel.localeCompare(a.rel):a.rel.localeCompare(c.rel)));
  const I=rows.map(m=>({m,a:agg(m)||{p:0,r:0,s:0,tp:0,best:0},pl:planned(m),dl:delivered(m,false),brief:nm(fv(m,"cbrief"))||nm(fv(m,"cbriefLink"))}));
  const wk=weekPosts(L,false),wd=weekDaysM(),withPlan=I.filter(z=>z.pl);
  const pl=withPlan.reduce((s,z)=>s+z.pl,0),dl=I.reduce((s,z)=>s+z.dl,0),ready=I.reduce((s,z)=>s+Math.max(0,z.dl-z.a.p,z.a.r),0); /* v34: not both added up */
  const postedW=wk.filter(z=>z[3]==="p"&&z[1]>=wd[0]&&z[1]<TODAY).length,schedW=wk.filter(z=>z[3]==="s").length,best=[...I].sort((a,c)=>c.a.best-a.a.best)[0];
  const rail=`<div class="mp-rail" style="--n:5">${tileM("Clips planned",pl?String(pl):"—",withPlan.length?`${withPlan.length===1?"Only "+esc(withPlan[0].m.name.split(" ")[0])+" has":withPlan.length+" episodes have"} a plan`:"No plans yet",pl?"":"",IC.wait())}
    ${tileM("Delivered",dl?String(dl):"—",dl?`In ${I.filter(z=>z.dl).length} episodes`:"No drops logged yet","",IC.wait())}
    ${tileM("Ready to post",String(ready),"Delivered, not posted")}
    ${tileM("Posted / scheduled",`${postedW} / ${schedW}`,weekLabel(),postedW?"g":"r",postedW?IC.ok():IC.bad())}
    ${tileM("Best clip, active episodes",best&&best.a.best?k(best.a.best):"—",best&&best.a.best?esc(best.m.name):"No posts yet",best&&best.a.best?"g":"",best&&best.a.best?IC.ok():"")}</div>`;
  const leg=`<div class="mp-leg f">${FM.map(f=>`<span>${fmIcon(f.k,14)}${f.n}</span>`).join("")}</div>`;
  const week=cardS("Posted / scheduled this week","",leg,weekCards(L,false));
  const cols="minmax(0,1.4fr) 190px 128px 112px 112px 120px 120px 90px";
  const body=I.map(({m,a,pl,dl,brief})=>{const pct=pl?Math.round(a.p/pl*100):null;
    const s5=pl&&pct<50&&!m.released?`<span class="mp-tag r"><b>!</b> ${pct}% of plan</span>`:String(a.p);
    return trM(cols,[epCell(m),tdNextClip(m),tdGuide(m,brief),pl?step("amber",`${pl} planned`):m.released?step("no","No plan"):step("ns"),
      dl?step(pl&&dl>=pl?"done":"amber",pl?`${dl} of ${pl}`:String(dl)):none(m),a.tp?step(a.tp>=3?"done":"amber",`${Math.min(3,a.tp)} of 3`):none(m),s5,a.best?k(a.best):dash],m,"clips")}).join("");
  return rail+week+cardS("Clips by episode","One row per episode · columns follow the steps in the episode window","",tblM(cols,["Episode","Next clip step",circ(1)+"Clip guidelines",circ(2)+"Split",circ(3)+"Delivered",circ(4)+"Trailer picks",circ(5)+"Posted","Best clip"],body,`<span class="mu">Upcoming episodes and those in their first 30 days. Click one to open its Clips tab.</span>`))}
/* ---------- Release ---------- */
const chkN=m=>names(fv(m,"check")).length;
function trailerLine(m){const v=[["s7b","Teaser"],["s7c","Pre-release"],["s7d","Release-day"]].map(([k2,l])=>[l,nm(fv(m,k2))]).filter(z=>z[1]);
  if(!v.length)return `<span class="mu">Not tracked</span>`;const ip=v.find(z=>/progress|problem/i.test(z[1]));if(ip)return esc(ip[0]+" "+ip[1].toLowerCase());
  const nd=v.filter(z=>isDoneV(z[1])).length;return nd===v.length?"All done":nd?`${nd} of ${v.length} done`:"Not started"}
function mpRelease(L){const up=L.filter(m=>!m.released||m.rel===TODAY).filter(m=>m.rel>=TODAY),next=up[0];
  const late=up.filter(m=>dayDiff(m.rel,TODAY)<=14&&!isDoneV(fv(m,"s7"))&&(d10(nm(fv(m,"plFinal")))||d10(nm(fv(m,"dFinal"))))<TODAY&&(d10(nm(fv(m,"plFinal")))||d10(nm(fv(m,"dFinal")))));
  const last3=L.filter(m=>m.released&&m.rel<TODAY).sort((a,c)=>c.rel.localeCompare(a.rel)).slice(0,3),done3=last3.filter(m=>chkN(m)>=14).length,any3=last3.some(m=>chkN(m));
  const slots=mpSlots(),empty=slots.filter(z=>!z.m);
  const lateDays=m=>{const d=d10(nm(fv(m,"plFinal")))||d10(nm(fv(m,"dFinal")));return d?dayDiff(TODAY,d):0};
  const rail=`<div class="mp-rail" style="--n:4">${tileM("Next release",next?(next.rel===TODAY?"Today":fmtD(next.rel)):"—",next?esc(next.name):"Nothing scheduled","a",IC.wait())}
    ${tileM("Final cut late",String(late.length),late.length?`${esc(late[0].name)} · ${pl(lateDays(late[0]),"day")}`:"None late",late.length?"r":"g",late.length?IC.bad():IC.ok())}
    ${tileM("Release checklists done",any3?`${done3} of ${last3.length}`:"—",`Last 3 releases${any3?"":" · not ticked"}`,any3&&done3===last3.length?"g":"a",IC.wait())}
    ${tileM("Empty release slots",String(empty.length),empty.length?fmtD(empty[0].d):"Next 12 weeks filled",empty.length?"r":"g",empty.length?IC.bad():IC.ok())}</div>`;
  const cal=`<div class="mp-calh"><h2>Release calendar</h2><span class="mp-r">One episode every Thursday</span></div><div class="mp-cal">${slots.slice(0,11).map(z=>{const m=z.m;
    const today=z.d===TODAY||(m&&m.rel===TODAY),bad=!m||m.st==="act",cls=today?"today":bad?"bad":"ok";
    return `<button type="button" class="mp-slot ${cls}" ${m?`data-mpep="${m.id}" data-mptab="release"`:"disabled"}><small>${today?"Today":fmtD(z.d)}</small><b>${m?esc(shortN(m.name)):"No episode"}</b><span>${!m?"Empty slot":today?esc(m.b.step||"Release day"):bad?esc(m.b.step||"Needs you"):"In production"}</span></button>`}).join("")}</div>`;
  const cols="minmax(0,1.3fr) 110px minmax(0,1.6fr) 150px 170px 100px";
  const rows=up.slice(0,4).map(m=>{const w=String(m.b.when||"");const n=chkN(m);
    return trM(cols,[`<span class="mp-ep"><b>${esc(m.name)}</b>${stChip(m.st)}</span>`,m.rel===TODAY?`<b>Today</b> <small class="mu">${fmtD(m.rel)}</small>`:fmtD(m.rel),
      `<span class="mp-ep"><span>${esc(m.b.step||"—")}${m.b.owner&&m.b.owner!=="–"?" · "+esc(m.b.owner):""}</span>${w&&w!=="–"?`<small class="${/late/i.test(w)?"rt":/today/i.test(w)?"at":"mu"}">${esc(w)}</small>`:""}</span>`,
      trailerLine(m),m.rel<=TODAY?`<span class="mp-ep"><b>${n} of 14</b><span class="mp-bar w"><i style="width:${Math.round(n/14*100)}%" class="${n>=14?"g":"a"}"></i></span></span>`:`<span class="mu">Starts on release day</span>`,
      d10(nm(fv(m,"signed")))?step("done",fmtD(d10(nm(fv(m,"signed"))))):m.rel<=TODAY?`<span class="mp-tag">Not yet</span>`:dash],m,"release",m.rel===TODAY?"hl":"")}).join("");
  const ready=cardS("Getting ready to release","Next 4 releases · same steps as the episode Release tab","",tblM(cols,["Episode","Release","Working on now","Trailers","Release-day checklist","Signed off"],rows));
  const recent=L.filter(m=>m.released&&m.rel<TODAY&&dayDiff(TODAY,m.rel)<=45&&(chkN(m)<14||!d10(nm(fv(m,"signed"))))).sort((a,c)=>c.rel.localeCompare(a.rel));
  const just=cardS("Just released: was everything done?","Checklists still to tick off","",recent.length?`<div class="mp-just">${recent.map(m=>{const n=chkN(m);return `<div class="mp-jc"><div><b>${esc(m.name)}</b><span>Released ${fmtD(m.rel)} · ${n?`${n} of 14 ticked`:"checklist not tracked"} · ${d10(nm(fv(m,"signed")))?"signed off":"not signed off"}</span></div><a href="#" data-mpep="${m.id}" data-mptab="release">Open</a></div>`}).join("")}</div>`:`<p class="mu" style="margin:0">Every recent release is checked off.</p>`);
  return rail+cal+ready+just}
/* ---------- Post Release ---------- */
function mpPost(L){const rows=L.filter(m=>m.released).sort((a,c)=>c.rel.localeCompare(a.rel));
  const I=rows.map(m=>{const pa=stepRows(m,"Production"),ga=stepRows(m,"Guest relations"),dn=r=>!!nm(r.fields.fldPl1XbgxtJ9lE8I);
    const extraP=pa.filter(r=>!PDEF.prod.some(([n])=>n===nm(r.fields.fldGQOtQlC7GEqoiL))),extraG=ga.filter(r=>!PDEF.guest.some(([n])=>n===nm(r.fields.fldGQOtQlC7GEqoiL)));
    const pd=PROD_P.filter(k2=>isDoneV(fv(m,k2))).length+extraP.filter(dn).length,pn=PROD_P.length+extraP.length;
    const gd=GUEST_P.filter(k2=>isDoneV(fv(m,k2))).length+extraG.filter(dn).length,gn=GUEST_P.length+extraG.length;
    return {m,pd,pn,gd,gn,fit:nm(fv(m,"fit")),promo:rowsFor("promo","fldMY53GRjyEDoyLl",m).length,thanked:isDoneV(fv(m,"p2")),p2:nm(fv(m,"p2"))}});
  const done=I.reduce((s,z)=>s+z.pd+z.gd,0),th=I.filter(z=>z.thanked).length,anyP2=I.some(z=>z.p2),fits=I.filter(z=>z.fit==="Yes").length,anyFit=I.some(z=>z.fit&&z.fit!=="Not decided"),promo=I.reduce((s,z)=>s+z.promo,0);
  const rail=`<div class="mp-rail" style="--n:4">${tileM("Checklist steps done",String(done),`Across ${pl(I.length,"released episode")}`,done?"g":"a",IC.wait())}
    ${tileM("Guests thanked",anyP2?String(th):"—",anyP2?`Of ${I.filter(z=>!z.m.solo).length} guests`:"Not tracked yet",anyP2?"g":"a",IC.wait())}
    ${tileM("Sales fits",anyFit?String(fits):"—",anyFit?"Marked Yes":"None decided",anyFit?"g":"a",IC.wait())}
    ${tileM("Promotion pieces planned",String(promo),"Stories, posts, collabs",promo?"g":"a",IC.wait())}</div>`;
  const cols="minmax(0,1.6fr) 130px 120px 140px 130px 100px 130px";
  const frac=(d,n)=>d?step(d>=n?"done":"amber",`${d} of ${n}`):step("no",`0 of ${n}`);
  const body=I.map(z=>trM(cols,[epCell(z.m,"Released "+fmtD(z.m.rel)),stChip(z.m.st),frac(z.pd,z.pn),z.m.solo?`<span class="mu">No guest</span>`:frac(z.gd,z.gn),
    z.m.solo?dash:z.fit==="Yes"?step("done","Yes"):z.fit==="No"?`<span class="mp-tag">No</span>`:step("no","Not decided"),String(z.promo),
    z.m.solo?dash:z.thanked?step("done","Done"):z.p2?step("amber",z.p2):step("no","Not tracked")],z.m,"post")).join("");
  return rail+cardS("Post release by episode","Each lane shows steps done of the steps for that episode","",tblM(cols,["Episode","Status","Production","Guest relations","Sales fit","Promotion","Guest thanked"],body,`<span class="mu">Released episodes, newest first. Click one to open its Post Release tab.</span>`))}
/* ---------- Testing & Recovery ---------- */
const testsOf=m=>TT[m.id]||[];
function mpTesting(L){const rel=L.filter(m=>m.released&&m.e).sort((a,c)=>{const ra=REC[a.id],rc=REC[c.id];return (rc?1:0)-(ra?1:0)||(rc&&ra?rc.days-ra.days:0)||c.rel.localeCompare(a.rel)});
  if(!rel.length)return cardS("Episode trend","","",`<p class="mu">No released episodes match the filters.</p>`);
  const sel=rel.find(m=>m.id===MP.test)||rel.find(m=>REC[m.id])||rel[0];MP.test=sel.id;
  const e=sel.e,V=VERD[verdict(sel.id)],age=dayDiff(TODAY,sel.rel)+1,T=testsOf(sel),open=[...T].reverse().find(t=>t.start&&!t.end&&!t.win),R=REC[sel.id];
  const tt=(lab,val,sub,c)=>`<div class="mp-tt ${c||""}"><span>${lab}</span><b>${val}</b><small>${sub}</small></div>`;
  const dt=n=>{const v=e["d"+n];if(v==null)return tt("Day "+n,"—",e["d"+n+"due"]?"Lands "+e["d"+n+"due"]:"Not in yet","n");return tt("Day "+n,k(v),"Target <b>"+k(tgt(sel,n))+"</b>",v>=tgt(sel,n)?"g":"r")};
  const d=DIAG[sel.id],lift=LIFT();
  const tiles=`<div class="mp-tts">${dt(7)}${dt(14)}${dt(30)}${tt("Total now",e.now!=null?k(e.now):"—",e.wk!=null?k(e.wk)+" last week":"","n")}
    ${tt("CTR lifetime",d?f1(d.ctr)+"%":"—","Median <b>"+f1(MED.ctr)+"%</b>",d?(d.ctr>=MED.ctr?"g":"r"):"n")}
    ${tt("Tests",String(T.length),open?`Running, day ${dayDiff(TODAY,open.start)+1}`:R&&R.step?`Step ${R.step}`:"None yet",open?"a":"n")}
    ${tt("Days to react",R?R.days+(R.first?"":"+"):"—","Target <b>3</b>",R?(R.days<=3?"g":"r"):"n")}
    ${tt("Best lift so far",lift?lift.x+"×":"—",lift?"Lalitaa, thumbnail":"No lift measured yet",lift?"g":"n")}</div>`;
  const head=`<div class="mp-trh"><select class="mp-sel" aria-label="Episode" data-mpk="test">${rel.map(m=>`<option value="${m.id}"${m.id===sel.id?" selected":""}>${esc(m.name)}</option>`).join("")}</select>
    <span class="mp-tag a"><i></i>${esc(stageOf(sel))}</span>${V[1]?`<span class="mp-tag ${V[0]==="s-act"?"r":V[0]==="s-watch"?"a":V[0]==="s-ok"?"g":""}"><i></i>${V[1]}</span>`:""}<span class="mu">day ${age} · <b style="color:var(--mp-t1)">${esc(sel.b.step||"—")}</b></span>
    <a href="#" class="mp-open" data-mpep="${sel.id}" data-mptab="testing">Open episode</a></div>`;
  const chart=`<div class="mp-chart" id="mpChart">${mpChartSvg(sel)}</div>`;
  const trend=`<section class="mp-card">${head}${tiles}${chart}</section>`;
  const cols="minmax(150px,1.5fr) 138px 66px 66px 66px 58px 64px 62px 88px 84px 92px 108px";
  const pill=(v,ok)=>v==null?dash:`<span class="mp-pill ${ok?"g":"r"}">${k(v)}</span>`;
  const rows=rel.map(m=>{const e2=m.e,V2=VERD[verdict(m.id)],R2=REC[m.id],d2=DIAG[m.id],T2=testsOf(m),run=T2.some(t=>t.start&&!t.end&&!t.win);
    const g=R2?gains(R2.s).slice(-12):e2.s&&e2.s.length>1?gains(e2.s).slice(-12):null,mx=g?Math.max(...g,1):1;
    const spark=g&&g.length>1?`<span class="mp-spark">${g.map((v,i)=>`<i style="height:${Math.max(2,v/mx*18)}px"${i===g.length-1?' class="l"':""}></i>`).join("")}</span>`:dash;
    return trM(cols,[`<span class="mp-ep in2">${MPI("chevr",14,"#5A626C",null,2.4)}<span><b>${esc(m.name)}</b>${run?MPI("alert",14,"#A15C00","In a test right now",2.2):""}<br><a href="#" class="mp-ob" data-mpep="${m.id}" data-mptab="overview">Open brief</a></span></span>`,
      V2[1]?`<span class="mp-tag ${V2[0]==="s-act"?"r":V2[0]==="s-watch"?"a":V2[0]==="s-ok"?"g":""}">${V2[0]?"<i></i>":""}${V2[1]}</span>`:dash,
      pill(e2.d7,e2.d7>=tgt(m,7)),pill(e2.d14,e2.d14>=tgt(m,14)),pill(e2.d30,e2.d30>=tgt(m,30)),e2.now!=null?k(e2.now):dash,e2.wk!=null?"+"+k(e2.wk):dash,
      d2?`<span class="mp-pill ${d2.ctr>=MED.ctr?"g":"r"}">${f1(d2.ctr)}%</span>`:dash,spark,R2?esc(R2.since):dash,R2?`<b class="rt">${R2.days}${R2.first?"":"+"}</b>`:dash,
      R2?(R2.first?`${esc(R2.first)} · step ${R2.step||1}`:`<b class="rt">None</b>`):dash],null,null,m.id===sel.id?"sel":"").replace('role="row"',`role="row" data-mptest="${m.id}" tabindex="0"`)}).join("");
  const table=cardS("All released episodes","",`<span class="mp-r">${MPI("alert",14,"#A15C00",null,2.2)} In a test right now</span>`,tblM(cols,["Episode","Root cause","Day 7","Day 14","Day 30","Total","Last week","CTR","12 weeks","Behind since","Days to react","First action"],rows,`<button type="button" class="mp-add" data-mpact="addtest">+ Add a test</button>`));
  return trend+table}
function mpChartSvg(m){const pts=(DAILY[m.id]||[]).filter(z=>z[0]>=1);if(!pts.length)return `<p class="mu" style="padding:24px">Daily views start the day after release.</p>`;
  const W=1100,H=300,L0=56,R0=24,Tp=40,Bt=28,X=Math.max(30,pts[pts.length-1][0]+5),R=REC[m.id];
  const ymax=Math.max(...pts.map(z=>z[1]),paceAt(X))*1.1,xs=d=>L0+d/X*(W-L0-R0),ys=v=>Tp+(1-v/ymax)*(H-Tp-Bt),F='font-family="Inter, system-ui, sans-serif"';
  const stp=[1,2,2.5,5].map(z=>z*10**Math.floor(Math.log10(ymax/4))).find(z=>ymax/z<=6)||ymax/5;let g="";
  for(let v=0;v<=ymax;v+=stp)g+=`<line x1="${L0}" x2="${W-R0}" y1="${ys(v)}" y2="${ys(v)}" stroke="#EEF0F3"/><text x="${L0-8}" y="${ys(v)+4}" text-anchor="end" font-size="11" fill="#5A626C" ${F}>${v?k(v):"0"}</text>`;
  const tick=X<=60?(X<=30?7:15):30;for(let t=0;t<=X;t+=tick)g+=`<text x="${xs(t)}" y="${H-8}" text-anchor="middle" font-size="11" fill="#5A626C" ${F}>${t===0?"Day 1":t}</text>`;
  const pp=[];for(let d=0;d<=X;d++)pp.push(`${xs(d).toFixed(1)},${ys(paceAt(d)).toFixed(1)}`);
  g+=`<polyline points="${pp.join(" ")}" fill="none" stroke="#1D2329" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  for(const n of [7,14,30])if(n<=X){const v=tgt(m,n);g+=`<circle cx="${xs(n)}" cy="${ys(v)}" r="3.5" fill="#1D2329"/><text x="${xs(n)+6}" y="${ys(v)-6}" font-size="11" fill="#1D2329" ${F}>${k(v)}</text>`}
  /* behind: the first day under pace */
  const b=pts.find(z=>z[0]>=3&&z[1]<paceAt(z[0]));if(b&&b[0]<=X)g+=`<line x1="${xs(b[0])}" x2="${xs(b[0])}" y1="${Tp-6}" y2="${H-Bt}" stroke="#B42318" stroke-width="1.3" stroke-dasharray="3 3"/><text x="${xs(b[0])+4}" y="${Tp-10}" font-size="11" font-weight="700" fill="#B42318" ${F}>Behind</text>`;
  for(const t of testsOf(m).filter(t=>t.start)){const n=dayDiff(t.start,m.rel)+1;if(n<1||n>X)continue;g+=`<line x1="${xs(n)}" x2="${xs(n)}" y1="${Tp-6}" y2="${H-Bt}" stroke="#1E7B4A" stroke-width="2"/><text x="${xs(n)-4}" y="${Tp-10}" text-anchor="end" font-size="11" font-weight="700" fill="#1A6B40" ${F}>${esc(String(t.n||"Test").replace(/^.*?[–-]\s*/,"").replace(/^t/,"T"))}</text>`}
  g+=`<polyline points="${[[0,0],...pts].map(([d,v])=>`${xs(d).toFixed(1)},${ys(v).toFixed(1)}`).join(" ")}" fill="none" stroke="#2457C5" stroke-width="2.4" stroke-linejoin="round"/>`;
  const lp=pts[pts.length-1];g+=`<circle cx="${xs(lp[0])}" cy="${ys(lp[1])}" r="4.5" fill="#2457C5" stroke="#fff" stroke-width="2"/><text x="${Math.min(xs(lp[0]),W-R0-24)}" y="${ys(lp[1])-10}" text-anchor="middle" font-size="12" font-weight="700" fill="#2457C5" ${F}>${k(lp[1])}</text>`;
  return `<div class="mp-chl"><span><i class="b"></i>Real views</span><span><i class="p"></i>Pace</span><span><i class="r"></i>Behind</span><span><i class="t"></i>Test started</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Views to date against the pace, with tests">${g}</svg>`}
function mpWireChart(){}
/* ---------- events ---------- */
document.addEventListener("click",ev=>{const root=$("mpRoot");if(!root)return;
  if(MP.open==="eps"&&!ev.target.closest(".mp-epw")&&root.contains(document.querySelector(".mp-pop"))){MP.open=null;MP.draft=null;mpRender();return}
  if(MP.ask&&!ev.target.closest(".mp-askw")&&root.contains(document.querySelector(".mp-ask"))){MP.ask=false;mpRender();return}
  if(!root.contains(ev.target))return;const t=ev.target.closest("[data-mpt],[data-mpscope],[data-mpact],[data-mpq],[data-mptest],[data-mpep]");if(!t)return;
  if(t.dataset.mpt){MP.tab=t.dataset.mpt;MP.ask=false;MP.ans=null;mpUrl();mpRender();return}
  if(t.dataset.mpscope){MP.scope[MP.tab]=t.dataset.mpscope;mpUrl();mpRender();return}
  if(t.dataset.mpq){MP.q=t.dataset.mpq;mpRender();const i=$("mpAskIn");if(i)i.focus();return}
  if(t.dataset.mpact){const a=t.dataset.mpact;
    if(a==="ask"){MP.ask=!MP.ask;MP.ans=null}
    else if(a==="asksend"){mpAskSend();return}
    else if(a==="eps"){MP.open=MP.open==="eps"?null:"eps";MP.draft=MP.sel?[...MP.sel]:[]}
    else if(a==="epclear"){MP.draft=[]}
    else if(a==="epdone"){MP.sel=MP.draft&&MP.draft.length?MP.draft:null;MP.open=null;MP.draft=null;mpUrl()}
    else if(a==="addtest"){const m=mpAll().find(z=>z.id===MP.test);if(m&&EPREC[m.id]){mOpen(m.id,"testing");setTimeout(()=>{const b=document.querySelector('#m2 [data-act="addtest"]');if(b)b.click()},1600)}return}
    mpRender();return}
  if(t.dataset.mptest&&!ev.target.closest("[data-mpep]")){MP.test=t.dataset.mptest;mpRender();const c=$("mpChart");if(c)c.scrollIntoView({block:"nearest",behavior:"smooth"});return}
  if(t.dataset.mpep){ev.preventDefault();if(EPREC[t.dataset.mpep])mOpen(t.dataset.mpep,t.dataset.mptab||"overview")}});
document.addEventListener("change",ev=>{const t=ev.target;if(!$("mpRoot")||!$("mpRoot").contains(t))return;
  if(t.dataset.mpchk){const L=MP.draft||(MP.draft=[]),i=L.indexOf(t.dataset.mpchk);if(t.checked&&i<0)L.push(t.dataset.mpchk);if(!t.checked&&i>=0)L.splice(i,1);return}
  if(t.dataset.mpk==="status"){MP.status=t.value;mpUrl();mpRender()}else if(t.dataset.mpk==="test"){MP.test=t.value;mpRender()}});
document.addEventListener("keydown",ev=>{if(!$("mpRoot"))return;
  if(ev.key==="Escape"&&(MP.open||MP.ask)&&!M.id){MP.open=null;MP.ask=false;MP.draft=null;mpRender();return}
  if(ev.key==="Enter"&&ev.target.id==="mpAskIn"){ev.preventDefault();mpAskSend();return}
  if(ev.key==="Enter"&&ev.target.matches&&ev.target.matches(".mp-tr[data-mpep]")){mOpen(ev.target.dataset.mpep,ev.target.dataset.mptab||"overview")}});
/* the modal's saves change what the tabs summarise: refresh the tabs when it closes */
const mCloseMP=mClose;mClose=function(){mCloseMP();try{mpRender()}catch(e){}};
/* the first render happens in m7_todo.js, once the To-do tab is registered */
