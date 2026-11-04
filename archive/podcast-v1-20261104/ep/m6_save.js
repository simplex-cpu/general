
/* ---------- saving: the episode window is the input layer ----------
   svModel turns the window's state into the Airtable rows it stands for. Opening an episode takes a snapshot of that;
   each change is compared with the snapshot and only the fields that moved are sent (debounced).
   Hosted page: POST <page>/w (the sign-in token rides along). Claude copy: the viewer's Airtable and Slack connectors. */
const TEAMN=["Karen","Kash","CJ","Jade","Dakshaya","Cristiana","Stephen","Jean","Johan","Alex","Marc","Sarah","Shay","VA"];
const EDITORS=["Alex","Johan"];
const SV={st:"idle",timer:null,busy:false,again:false,id:null,notify:[],extra:[],err:"",at:null};
const FT=k2=>EPSPEC.f[k2],TB=k2=>EPSPEC.t[k2];
const pctIn=v=>{if(v==null||v==="")return null;const n=parseFloat(String(v).replace(/[^\d.]/g,""));return isNaN(n)?null:Math.round(n*10)/1000};
const teamIdOf=(D,n)=>{if(!n)return [];const t=(D.team||[]).find(z=>firstName(z.name)===n);return t?[t.id]:[]};
const stIn=v=>!v||v==="No status"?null:v;
function svModel(x,s,D){const R={},E={},e=FT("episodes"),ep=x.rid;
  const row=(key,t,obj,f,base,ready)=>{if(obj&&(obj.rid||obj.fid&&key.startsWith("fmt:")))R[key]={t,id:obj.rid||obj.fid,f,obj};else if(ready!==false)R[key]={t,f:Object.assign({},base||{},f),obj,create:true}};
  /* the episode itself */
  for(const [i,m] of Object.entries(TL_F)){const v=s.tl[i];if(!v)continue;if(m.st&&v.status!==undefined)for(const k2 of m.st)E[e[k2]]=stIn(v.status);if(v.date!==undefined)E[e[m.date]]=v.date||null}
  E[e.ideas]=s.text.ideas||null;E[e.ideasLink]=s.text.ideasLink||null;E[e.cbrief]=s.text.brief||null;E[e.cbriefLink]=s.text.briefLink||null;E[e.textSent]=s.sent||null;
  E[e.pB]=+s.split.broll||0;E[e.pT]=+s.split.talk||0;E[e.pC]=+s.split.carousel||0;
  E[e.check]=[...s.check].sort();E[e.signed]=s.signed||null;E[e.top3]=s.top3At||null;
  TR_F.forEach(([o,l,p2,sk],i)=>{const v=s.tr[i]||{};if(v.owner!==undefined)E[e[o]]=teamIdOf(D,v.owner);if(v.link!==undefined)E[e[l]]=v.link||null;if(v.date!==undefined)E[e[p2]]=v.date||null;
    if(v.status!==undefined)E[e[sk]]=v.status==="Delivered"?"Done":stIn(v.status)});
  for(const l of ["prod","guest"])for(const z of (s.lanes&&s.lanes[l]||[]))if(z.pf)E[e[z.pf]]=z.d?"Done":z.st0==="Done"?"Not started":z.st0||null;
  E[e.fit]=s.fit||null;E[e.offer]=s.offer||null;if(s.stage)E["fld0cRVyWmcMjy0cq"]=s.stage;if(s.clipSt)E["fldIrcw9I8EGWvxUB"]=s.clipSt;if(s.thumbSt)E["fldwbHzXGYhBtYRiY"]=s.thumbSt;if(s.perfPlan)E["fldO0TfbhkGRKOaDf"]=s.perfPlan;
  const g=s.game;E[e.goal]=unN(g.goal)||null;E[e.goalDay]=+g.goalDay||null;E[e.firstDay]=+g.first||null;E[e.rhythm]=g.rhythm||null;
  for(const d of [1,3,7,14,30])E[e["cp"+d]]=unN(g.cps[d])||null;
  E[e.cpExtra]=g.extra.filter(z=>+z.day&&String(z.v).trim()).map(z=>`${+z.day}:${String(z.v).trim()}`).join("; ")||null;E[e.letgo]=!!g.letgo;
  R.ep={t:TB("episodes"),id:ep,f:E};
  /* formats the team added, and this episode's clipping split */
  const fo=FT("formats"),pl=FT("plan");
  s.extraF.forEach((f,i)=>{const nmF=String(f.n||"").trim();
    row("fmt:"+f.u,TB("formats"),f,{[fo.name]:nmF,[fo.postType]:f.pt||null},{[fo.active]:true,[fo.usedFor]:"Clips",[fo.legacy]:"Other",[fo.order]:10+i},!!(nmF&&f.pt));
    if(f.fid&&(f.cp||+f.v>0)){const o={get rid(){return f.cp},set rid(v){f.cp=v}};row("plan:"+f.u,TB("plan"),o,{[pl.planned]:+f.v||0},{[pl.name]:`${x.name} – ${nmF}`,[pl.episode]:[ep],[pl.format]:[f.fid]})}});
  for(const f of FM){const v=+s.split[f.k]||0;if(!s.planRid[f.k]&&!v)continue;const o={get rid(){return s.planRid[f.k]},set rid(v2){s.planRid[f.k]=v2}};
    row("plan:"+f.k,TB("plan"),o,{[pl.planned]:v},{[pl.name]:`${x.name} – ${f.n}`,[pl.episode]:[ep],[pl.format]:[f.id]})}
  /* drops logged in the window */
  const dr=FT("drops");
  for(const [k2,L] of Object.entries(s.added.drops))L.forEach((r,i)=>{const fm=k2==="thumb"?{id:FM_THUMB.id,lg:FM_THUMB.lg,n:"Thumbnail"}:k2[0]==="x"?(()=>{const z=s.extraF[+k2.slice(1)];return z&&{id:z.fid,lg:"Other",n:z.n}})():FM.find(f=>f.k===k2);
    if(!fm||!fm.id)return;
    row("drop:"+r.u,TB("drops"),r,{[dr.many]:+r.many||0,[dr.link]:r.link||null,[dr.dropBy]:teamIdOf(D,r.who),[dr.deliveredOn]:r.on||null,[dr.planFormat]:[fm.id],[dr.type]:fm.lg},
      {[dr.n]:`${x.name} – ${fm.n} drop`,[EPSPEC.link.drops]:[ep]},+r.many>0)});
  /* picks, post formats and waiting-row statuses on existing Clips rows */
  const cl=FT("clips");
  for(const c of [...D.clips,...(D.waiting||[])]){const f={};
    if(c.fmt==="Thumbnail"){if(c.top3||s.picks.thumb.includes(c.rid))f[cl.top3]=s.picks.thumb.includes(c.rid)}
    else if(c.tp||s.picks.clip.includes(c.rid))f[cl.trailerPick]=s.picks.clip.includes(c.rid);
    const fk=s.fmtSet[c.rid];if(fk!==undefined){const fid=fk[0]==="x"?(s.extraF[+fk.slice(1)]||{}).fid:(FM.find(z=>z.k===fk)||{}).id;if(fid){f[cl.planFormat]=[fid];if(fk==="broll")f[cl.type]="B-roll";if(fk==="talk")f[cl.type]="Talking point"}}
    if(s.pst[c.rid]!==undefined)f[cl.postStatus]=s.pst[c.rid];
    if(s.psd[c.rid]!==undefined)f[cl.schedFor]=s.psd[c.rid]||null;
    if(Object.keys(f).length)R["clip:"+c.rid]={t:TB("clips"),id:c.rid,f}}
  for(const p of s.added.posts.clip){const fid=p.fmt?(p.fmt[0]==="x"?(s.extraF[+p.fmt.slice(1)]||{}).fid:(FM.find(z=>z.k===p.fmt)||{}).id):null;
    row("post:"+p.u,TB("clips"),p,{[cl.name]:String(p.name||"").trim(),[cl.plat]:p.plat,[cl.planFormat]:fid?[fid]:[],[cl.postStatus]:p.status||"Posted",[cl.on]:p.date||null,[cl.link]:p.link||null},
      {[EPSPEC.link.clips]:[ep]},!!(String(p.name||"").trim()&&HAND_PLATS.includes(p.plat)))}
  /* steps: owner and date on the default steps, the steps the team adds, sales steps and to-dos */
  const sp=FT("steps"),step=(z,lane,ord,withDone)=>{if(!z.u)z.u=uid();if(lane==="Sales"&&!z.o)z.o="Jade";const nmS=String(z.n||"").trim(),o={get rid(){return z.srid},set rid(v){z.srid=v}};
    const f={[sp.step]:nmS,[sp.lane]:lane,[sp.owner]:teamIdOf(D,z.o),[sp.date]:z.date||null,[sp.order]:ord};if(withDone)f[sp.done]=!!z.d;
    row("step:"+z.u,TB("steps"),o,f,{[sp.episode]:[ep]},!!nmS)};
  for(const l of ["prod","guest"])(s.lanes&&s.lanes[l]||[]).forEach((z,i)=>{if(z.pf&&!z.srid&&z.o===z.o0&&!z.date)return;step(z,LANE[l],i+1,!z.pf)});
  s.sales.forEach((z,i)=>step(z,"Sales",i+1,true));
  s.todos.forEach((z,i)=>step(z,"To-do",i+1,true));
  /* promotion plan */
  const pr=FT("promo");
  s.promo.forEach(p=>row("promo:"+p.u,TB("promo"),p,{[pr.piece]:`${p.type}${p.date?" · "+p.date:""}`,[pr.type]:p.type,[pr.link]:p.link||null,[pr.date]:p.date||null,[pr.needs]:!!p.needs,[pr.status]:p.status||"Planned"},{[pr.episode]:[ep]}));
  /* tests and their variations */
  const ts=FT("tests"),va=FT("vars"),LT="ABCDEFGHIJ";
  s.tests.forEach((T,i)=>{const t=D.tests.find(z=>z.rid===T.rid)||{combos:[]},tName=String(t.n||T.name||(T.name=`${x.name} – Test ${i+1}`));
    row("test:"+T.u,TB("tests"),T,{[ts.brief]:T.brief||null,[ts.nvar]:+T.nvar||null,[ts.start]:T.start||null,[ts.end]:T.end||null,[ts.tool]:T.tool||null,[ts.win]:T.win||null,[ts.origCtr]:pctIn(T.ctrB)},
      {[ts.n]:tName,[EPSPEC.link.tests]:[ep]});
    if(!T.rid)return;
    const n=Math.max(1,Math.min(10,+T.nvar||1));
    for(let vi=0;vi<n;vi++){const V=T.vars[vi];if(!V)continue;const L=LT[vi],cb=t.combos.find(z=>z.L===L)||{};if(!V.u)V.u=uid();
      const stat=V.status||(T.win?(T.win===L?"Winner":"Discarded"):T.end?"Discarded":"Testing");
      const f={[va.name]:`${tName} – ${L}`,[va.letter]:L,[va.title]:(V.title!==undefined?V.title:cb.title)||null,[va.tested]:[...(V.tested||defTested(i,x.id||""))].sort(),
        [va.ctr]:pctIn(V.ctr!==undefined?V.ctr:cb.ctr!=null?f1(cb.ctr*100):null),[va.status]:stat};
      if(V.img)f[va.thumb]=[{url:V.img}];
      row("var:"+V.u,TB("vars"),V,f,{[va.test]:[T.rid]})}});
  return R}
const svNorm=v=>v===undefined||v===""?null:Array.isArray(v)?JSON.stringify(v.map(z=>typeof z==="object"&&z?(z.url||z.id||JSON.stringify(z)):z)):typeof v==="object"&&v?JSON.stringify(v):v;
const svEq=(a,b)=>svNorm(a)===svNorm(b);
function svSnap(x,s,D){const m=svModel(x,s,D),o={};for(const k2 in m)o[k2]={f:Object.assign({},m[k2].f)};return o}
function svLabel(){return SV.st==="saving"?`<span class="m2-svs-i">Saving…</span>`:SV.st==="error"?`<span class="m2-svs-i bad">Couldn't save${SV.err?": "+esc(SV.err):""}</span><button type="button" class="m2-svr" data-act="svretry">Try again</button>`:SV.st==="saved"?`<span class="m2-svs-i ok">${ic("check",14,"currentColor",null,2.6)}Saved</span>`:""}
function svShow(){const el=$("m2Svs");if(el)el.innerHTML=svLabel()}
function svMark(){if(!M.id)return;SV.id=M.id;clearTimeout(SV.timer);SV.timer=setTimeout(svFlush,650)}
async function svFlush(){clearTimeout(SV.timer);if(SV.busy){SV.again=true;return}
  const id=SV.id;if(!id)return;const x=Object.assign({id},EPREC[id]),s=st(x.rid),D=EPC[x.rid];if(!s.saved||!D||D.err)return;
  const want=svModel(x,s,D),ops=[],map=[];
  for(const [key,r] of Object.entries(want)){const old=s.saved[key];
    if(!r.create){const f={};for(const k2 in r.f)if(!old||!svEq(old.f[k2],r.f[k2]))f[k2]=r.f[k2];if(Object.keys(f).length){ops.push({t:r.t,a:"update",id:r.id,f});map.push({key,r})}}
    else if(!old||Object.keys(r.f).some(k2=>!svEq(old.f[k2],r.f[k2]))){ops.push({t:r.t,a:"create",f:r.f});map.push({key,r})}}
  /* a new row can't be linked before the row it points at exists: those wait for the next round */
  const dels=s.del.splice(0);for(const d of dels){ops.push({t:d.t,a:"delete",id:d.id});map.push({del:d})}
  const extra=SV.extra.splice(0);for(const e2 of extra){ops.push(e2.op);map.push({extra:e2})}
  const notify=SV.notify.splice(0);
  if(!ops.length&&!notify.length)return;
  SV.busy=true;SV.st="saving";svShow();
  let res;try{res=await svSend(x,s,ops.slice(0,50),notify)}catch(err){res={results:[],error:String(err&&err.message||err)}}
  SV.busy=false;let bad=0,made=0;
  ops.forEach((op,i)=>{const r=(res.results||[]).find(z=>z.i===i),m=map[i],ok=!!(r&&r.ok);
    if(m.extra){m.extra.done&&m.extra.done(ok);if(!ok)bad++;return}
    if(m.del){if(!ok){bad++;s.del.push(m.del)}return}
    if(!ok){bad++;return}
    if(op.a==="create"&&r.id&&m.r.obj){if(m.key.startsWith("fmt:"))m.r.obj.fid=r.id;else m.r.obj.rid=r.id;made++}
    s.saved[m.key]={f:Object.assign({},(s.saved[m.key]||{}).f,op.f)};mpApply(op,r.id)});
  if(ops.length>50)SV.again=true;
  SV.st=bad?"error":"saved";SV.err=bad?(res.error||((res.results||[]).find(z=>!z.ok)||{}).error||""):"";SV.err=String(SV.err).slice(0,80);SV.at=new Date();
  if(M.id&&(made||extra.length))mRender();else svShow();
  if(SV.again||made){SV.again=false;svMark();if(!M.id)svFlush()}}
async function svSend(x,s,ops,notify){
  if(!window.claude?.use){const r=await fetch(location.pathname.replace(/\/$/,"")+"/w",{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({episode:x.rid,epName:x.name,epKey:x.id,tab:s.tab,ops,notify})});
    if(!r.ok)throw new Error(r.status===401?"signed out":"server "+r.status);return await r.json()}
  /* Claude copy: write as the viewer through their connectors */
  const mcp=await window.claude.use("mcp");if(!mcp)throw new Error("Airtable isn't connected");const B0=EPSPEC.base,out=[];
  for(const [i,op] of ops.entries()){try{let r,id=op.id;
      if(op.a==="update")r=await mcp.callTool("Airtable","update_records_for_table",{baseId:B0,tableId:op.t,records:[{id:op.id,fields:op.f}],typecast:true});
      else if(op.a==="create"){r=await mcp.callTool("Airtable","create_records_for_table",{baseId:B0,tableId:op.t,records:[{fields:op.f}],typecast:true});const p=r&&r.payload||{};id=(p.records&&p.records[0]&&p.records[0].id)||p.id||null}
      else if(op.a==="delete")r=await mcp.callTool("Airtable","delete_records_for_table",{baseId:B0,tableId:op.t,recordIds:[op.id]});
      else if(op.a==="comment")r=await mcp.callTool("Airtable","create_record_comment",{baseId:B0,tableId:op.t,recordId:x.rid,text:op.text});
      out.push({i,ok:!(r&&r.isError)&&(op.a!=="create"||!!id),id})}catch(err){out.push({i,ok:false,error:String(err&&err.message||err)})}}
  if(notify.length&&typeof SLACK_IDS!=="undefined"){const me=window.__rlViewer||"Kash";
    for(const n of notify){const sid=SLACK_IDS[n.to];if(!sid||n.to===me)continue;
      const head=n.kind==="send"?`**${me}** sent you ${n.what||"an update"} for **${x.name}**`:`**${me}** tagged you on **${x.name}** in the ReLearn dashboard`;
      mcp.callTool("Slack","slack_send_message",{channel_id:sid,message:head+(n.text?`:\n> ${String(n.text).slice(0,1500).replace(/\n/g,"\n> ")}`:"")}).catch(()=>{})}}
  return {ok:out.every(z=>z.ok),results:out}}
/* the main tabs summarise these rows: reflect a save there straight away instead of waiting for the next data copy */
function mpApply(op,id){if(typeof MP==="undefined"||!MP.D)return;try{
  if(op.t===TB("episodes")){if(op.a==="update")Object.assign(MP.F[op.id]||(MP.F[op.id]={}),op.f);return}
  const key={[TB("drops")]:"drops",[TB("plan")]:"plan",[TB("steps")]:"steps",[TB("promo")]:"promo"}[op.t];if(!key)return;const L=MP.D[key]||(MP.D[key]=[]);
  if(op.a==="create")L.push({id,fields:Object.assign({},op.f)});else if(op.a==="update"){const r=L.find(z=>z.id===op.id);if(r)Object.assign(r.fields,op.f)}else if(op.a==="delete"){const i=L.findIndex(z=>z.id===op.id);if(i>=0)L.splice(i,1)}}catch(e){}}
/* comments and hand-offs go out straight away, not on the debounce */
function svComment(text,tags,c){SV.id=M.id;SV.extra.push({op:{t:TB("episodes"),a:"comment",text},done:ok=>{c.pending=false;c.failed=!ok}});
  for(const t of tags)SV.notify.push({to:t,kind:"tag",text});svFlush()}
function svHandOff(to,what,text){SV.id=M.id;for(const t of to)SV.notify.push({to:t,kind:"send",what,text});svMark()}
