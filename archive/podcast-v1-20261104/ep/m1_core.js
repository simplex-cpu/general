/* ---------- v21: episode modal, Karen's redesign ---------- */
/* icons (16px, stroke 2.2 unless set) */
const IP={
  ok:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  wait:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/>',
  trend:'<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
  down:'<path d="M3 7l6 6 4-4 7 7"/><path d="M14 16h6v-6"/>',
  person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevd:'<path d="M6 9l6 6 6-6"/>',chevr:'<path d="M9 6l6 6-6 6"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
  broll:'<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
  talk:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  carousel:'<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  share:'<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/>',
  save:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21h4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'};
const ic=(n,sz,col,lab,sw)=>`<svg ${lab?`role="img" aria-label="${lab}"`:'aria-hidden="true"'} width="${sz||16}" height="${sz||16}" viewBox="0 0 24 24" fill="none" stroke="${col||"currentColor"}" stroke-width="${sw||2.2}" stroke-linecap="round" stroke-linejoin="round">${IP[n]}</svg>`;
const ICO={ok:()=>ic("ok",16,"#1E7B4A","On track"),wait:()=>ic("wait",16,"#A15C00","Waiting"),bad:()=>ic("alert",16,"#B42318","Behind"),up:()=>ic("trend",16,"#1E7B4A","Improving"),down:()=>ic("down",16,"#B42318","Dropping")};
const DASH='<span class="na">—</span>';
const ord=n=>n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
const fmtN=n=>n==null||n===""?"":Number(n).toLocaleString("en-GB");
const unN=v=>{const n=Number(String(v).replace(/[^\d.]/g,""));return isNaN(n)?0:n};
const firstName=n=>String(n||"").replace(/\s*\(.*\)\s*/,"").split(/\s+/)[0]||"";

/* formats: one name across the split, drops and posts. id = the row in the Formats table, lg = the old Content Drops "Type" */
const FM=[{k:"broll",n:"B-roll video",p:"B-roll videos",i:"broll",id:"recAnp033Xxor6YNC",lg:"B-roll"},{k:"talk",n:"Talking clips",p:"talking clips",i:"talk",id:"recoxzL7ZO4twKWQa",lg:"TP clip-up"},{k:"carousel",n:"Carousel",p:"carousels",i:"carousel",id:"recxx2Fa9fQPEorRz",lg:"Carousel"},{k:"single",n:"Single graphic",p:"single graphics",i:"image",id:"recXdTiSM2yLIK36o",lg:"Other"},{k:"trailer",n:"Trailer",p:"trailers",i:"play",id:"recPpZvzSzS013qkx",lg:"Trailer"}];
const FM_THUMB={id:"recEjynpCfcBkKa14",lg:"Thumbnail"};
const POST_TYPES=["Reel","Carousel","Image"];
/* platforms the team adds posts for by hand; Instagram, Facebook and YouTube rows come from the imports */
const HAND_PLATS=["TikTok","Threads","Snapchat"];
let UID=0;const uid=()=>"u"+(++UID);
const ids=v=>v==null?[]:(Array.isArray(v)?v:[v]).map(x=>typeof x==="object"&&x?x.id:x).filter(z=>/^rec/.test(z||""));
const fmName=k=>(FM.find(f=>f.k===k)||{n:k}).n;
const fmIcon=(k,sz)=>{const f=FM.find(z=>z.k===k);return ic(f?f.i:"file",sz||16,"#2457C5",f?f.n:k,2)};
/* v34: ONE planned figure for the main tabs and the episode window. Every Content Plan row counts (extra formats too);
   B-roll / TP / carousel without a row of their own add the episode's pB / pT / pC. No default trailers. */
const PLAN_BASE={recAnp033Xxor6YNC:"pB",recoxzL7ZO4twKWQa:"pT",recxx2Fa9fQPEorRz:"pC"};
function clipPlan(base,rows){let t=0;const have=new Set();for(const r of rows||[]){if(r.fid)have.add(r.fid);t+=+r.v||0}
  for(const [fid,k2] of Object.entries(PLAN_BASE))if(!have.has(fid))t+=+base[k2]||0;return t}
/* the window's own figure: the split it shows (FM formats + extra formats), so unsaved edits count too */
const winPlanned=s=>FM.reduce((a,f)=>a+(+s.split[f.k]||0),0)+s.extraF.reduce((a,f)=>a+(+f.v||0),0)+(+s.planOther||0);
const DROPK=t=>{t=String(t||"");return /thumb/i.test(t)?"thumb":/b-?roll/i.test(t)?"broll":/tp|talk/i.test(t)?"talk":/carousel/i.test(t)?"carousel":/trailer/i.test(t)?"trailer":/graphic|image|single/i.test(t)?"single":"other"};
const POSTK=c=>c.fmt==="Thumbnail"?"thumb":c.fmt==="Carousel"?"carousel":c.fmt==="B-roll"?"broll":c.fmt==="TP clip-up"?"talk":c.fmt==="Trailer"?"trailer":"none";
const PLATS=["YouTube","Instagram","Facebook","TikTok","LinkedIn","X"];
/* a picture for a post: the import's saved preview when there is one, else YouTube's own thumbnail from the link */
const ytId=u=>{const m=/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/.exec(String(u||""));return m?m[1]:null};
const thumbOf=c=>c.preview||(ytId(c.link)?`https://i.ytimg.com/vi/${ytId(c.link)}/hqdefault.jpg`:null);
const imgTag=(c,alt)=>{const u=thumbOf(c);return u?`<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">`:""};
const platOf=p=>{p=String(p||"");return /youtube/i.test(p)?"YouTube":/insta/i.test(p)?"Instagram":/face/i.test(p)?"Facebook":/tiktok/i.test(p)?"TikTok":/linkedin/i.test(p)?"LinkedIn":/^x$|twitter/i.test(p)?"X":p||"—"};
const STATUSES=["No status","Not started","In progress","Done","Problem"];
const TRST=["No status","Not started","In progress","Delivered","Problem"];
const stOf=v=>{const s=nm(v)||"";return /^done$/i.test(s)?"Done":/progress/i.test(s)?"In progress":/problem|block|stuck/i.test(s)?"Problem":/not started/i.test(s)?"Not started":/n\/?a/i.test(s)?"Done":"No status"};
const OWNERS0=["Stephen","Marc","Alex","Johan","CJ","Dakshaya","Jade","Kash","Cristiana","Jean"];
const TABS=[["overview","Overview"],["thumbs","Thumbnails"],["clips","Clips"],["release","Release"],["post","Post Release"],["testing","Testing & Recovery"]];

/* ---------- data: one episode, read live (Airtable connector in Claude, n8n /ep on the hosted page) ---------- */
const EPC={};
const att=v=>{const a=Array.isArray(v)?v[0]:null;return a?(a.thumbnails?.large?.url||a.thumbnails?.small?.url||a.url||null):null};
function fmtOf(f,t){f=f||"";t=t||"";if(/short|reel/i.test(f))return /talking/i.test(t)?"TP clip-up":/b-?roll/i.test(t)?"B-roll":/trailer/i.test(t)?"Trailer":"Short";
  if(/carousel/i.test(f))return "Carousel";if(/image|thumbnail/i.test(f))return "Thumbnail";if(/trailer/i.test(f))return "Trailer";return "Other"}
function mentions(text,m){let h=esc(text);if(m)for(const [uid,u] of Object.entries(m))h=h.split(esc("@["+uid+"]")).join(`<span class="tag">@${esc(u.displayName||u.name||u.email||"someone")}</span>`);return h.replace(/@\[[a-z0-9]+\]/gi,'<span class="tag">@someone</span>')}
async function epLoad(id){
  const x=EPREC[id],S=EPSPEC,F=k2=>Object.values(S.f[k2]);let D;
  if(window.claude?.use){
    const mcp=await window.claude.use("mcp");if(!mcp)throw {code:"unavailable"};
    const q=async(tbl,fields,extra)=>{let recs=[],cursor=null;do{const r=await mcp.callTool("Airtable","list_records_for_table",{baseId:S.base,tableId:tbl,fieldIds:fields,pageSize:1000,...extra,...(cursor?{cursor}:{})},{cache:false});
      const p=r.payload||{};recs=recs.concat(p.records||[]);cursor=p.nextCursor||null}while(cursor);return recs.map(r=>Object.assign({_rid:r.id},r.cellValuesByFieldId||{}))};
    const L=k2=>({filters:{operands:[{operator:"hasAnyOf",operands:[S.link[k2],[x.rid]]}]}});
    const opt=p=>p.catch(()=>[]);
    const [ep,clips,days,tests,drops,team,formats,plan,steps,promo,vars]=await Promise.all([q(S.t.episodes,F("episodes"),{recordIds:[x.rid]}),q(S.t.clips,F("clips"),L("clips")),q(S.t.days,F("days"),L("days")),q(S.t.tests,F("tests"),L("tests")),q(S.t.drops,F("drops"),L("drops")),opt(q(S.t.team,F("team"),{})),
      opt(q(S.t.formats,F("formats"),{})),opt(q(S.t.plan,F("plan"),L("plan"))),opt(q(S.t.steps,F("steps"),L("steps"))),opt(q(S.t.promo,F("promo"),L("promo"))),opt(q(S.t.vars,F("vars"),{}))]);
    let comments=null;try{const r=await mcp.callTool("Airtable","list_record_comments",{baseId:S.base,tableId:S.t.episodes,recordId:x.rid},{cache:false});comments=((r.payload||{}).comments||[]).map(c=>({by:c.author?.name||c.author?.email||"",at:c.createdTime,text:c.text||"",mentioned:c.mentioned||null}))}catch(e){}
    D={episode:ep[0]||{},clips,days,tests,drops,team,formats,plan,steps,promo,vars,comments}}
  else{const r=await fetch(location.pathname.replace(/\/$/,"")+"/ep?id="+encodeURIComponent(x.rid)+"&name="+encodeURIComponent(x.name),{cache:"no-store"});
    if(!r.ok)throw {code:"http_"+r.status};const j=await r.json(),fr=a=>(a||[]).map(z=>Object.assign({_rid:z.id},z.fields||{}));
    D={episode:j.episode?Object.assign({_rid:j.episode.id},j.episode.fields):{},clips:fr(j.clips),days:fr(j.days),tests:fr(j.tests),drops:fr(j.drops),team:fr(j.team),
      formats:fr(j.formats),plan:fr(j.plan),steps:fr(j.steps),promo:fr(j.promo),vars:fr(j.vars),comments:j.comments||[]}}
  const R=(key,f)=>{const m=S.f[key],o={};for(const k2 in m)o[k2]=f[m[k2]];return o};
  const team=(D.team||[]).map(f=>{const t=R("team",f);return {id:f._rid,name:nm(t.name)||"",role:nm(t.role)}}).filter(t=>t.name);
  const who=v=>names(v).map(n=>{const t=team.find(z=>z.id===n);return firstName(t?t.name:n)}).filter(n=>!/^rec/.test(n));
  const ep=R("episodes",D.episode);
  /* rows the drop automation made but nobody has posted yet ("Ready to post", "Scheduled") stay out of the posted numbers */
  const allClips=D.clips.map(f=>{const c=R("clips",f);return {rid:f._rid,name:nm(c.name),plat:platOf(nm(c.plat)),fmt:fmtOf(nm(c.fmt),nm(c.type)),topic:nm(c.topic),hook:nm(c.hook),on:d10(nm(c.on)),views:+nm(c.views)||0,likes:+nm(c.likes)||0,comm:+nm(c.comm)||0,shares:+nm(c.shares)||0,saves:+nm(c.saves)||0,link:nm(c.link),preview:att(c.preview),
    top3:!!nm(c.top3),tp:!!nm(c.trailerPick),pst:nm(c.postStatus)||"",sf:d10(nm(c.schedFor))||"",pf:ids(c.planFormat)[0]||null,drop:ids(c.drop)[0]||null}});
  const waiting=allClips.filter(c=>/^(ready to post|scheduled)$/i.test(c.pst)),clips=allClips.filter(c=>!waiting.includes(c));
  const days=D.days.map(f=>{const d=R("days",f);return {day:+nm(d.day),to:+nm(d.to),gain:nm(d.gain)==null?null:+nm(d.gain),date:d10(nm(d.date))}}).filter(d=>d.day>0&&!isNaN(d.to)).sort((a,b)=>a.day-b.day);
  const tests=D.tests.map(f=>{const t=R("tests",f);return {rid:f._rid,n:nm(t.n),what:nm(t.what),start:d10(nm(t.start)),end:d10(nm(t.end)),win:nm(t.win),share:nm(t.share),tool:nm(t.tool),learnt:nm(t.learnt),before:nm(t.before),after:nm(t.after),res:nm(t.res),origCtr:nm(t.origCtr),brief:nm(t.brief)||"",nvar:+nm(t.nvar)||0,
    combos:["A","B","C"].map(L2=>({L:L2,th:att(t["th"+L2]),title:nm(t["ti"+L2]),ctr:nm(t["ctr"+L2]),fw:nm(t["fw"+L2]),text:nm(t["tx"+L2])})).filter(c=>c.th||c.title||c.ctr!=null||c.fw||c.text)}}).sort((a,b)=>String(a.start).localeCompare(String(b.start)));
  const drops=D.drops.map(f=>{const d=R("drops",f);return {rid:f._rid,n:nm(d.n),type:nm(d.type),k:DROPK(nm(d.type)),many:+nm(d.many)||0,made:+nm(d.made)||0,sched:+nm(d.sched)||0,posted:+nm(d.posted)||0,wont:+nm(d.wont)||0,by:d10(nm(d.by)),status:nm(d.status),link:nm(d.link),who:who(d.dropBy).join(", "),on:d10(nm(d.deliveredOn))||d10(nm(d.dropOn)),allPosted:!!nm(d.allPosted),pf:ids(d.planFormat)[0]||null}}).sort((a,b)=>String(a.on).localeCompare(String(b.on)));
  const comments=D.comments==null?null:D.comments.map(c=>({by:c.by,at:c.at,html:mentions(c.text,c.mentioned)})).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
  const tname=v=>ids(v).map(z=>{const t=team.find(q2=>q2.id===z);return t?firstName(t.name):null}).filter(Boolean)[0]||"";
  const formats=(D.formats||[]).map(f=>{const o=R("formats",f);return {rid:f._rid,n:nm(o.name)||"",active:!!nm(o.active),order:+nm(o.order)||0,lg:nm(o.legacy)||"",used:nm(o.usedFor)||"",pt:nm(o.postType)||""}});
  const plan=(D.plan||[]).map(f=>{const o=R("plan",f);return {rid:f._rid,fid:ids(o.format)[0]||null,v:+nm(o.planned)||0}});
  const steps=(D.steps||[]).map(f=>{const o=R("steps",f);return {rid:f._rid,n:nm(o.step)||"",lane:nm(o.lane)||"",o:tname(o.owner),date:d10(nm(o.date))||"",d:!!nm(o.done),ord:+nm(o.order)||0}}).sort((a,b)=>a.ord-b.ord);
  const promo=(D.promo||[]).map(f=>{const o=R("promo",f);return {rid:f._rid,n:nm(o.piece)||"",type:nm(o.type)||"Story",link:nm(o.link)||"",date:d10(nm(o.date))||"",needs:!!nm(o.needs),status:nm(o.status)||"Planned"}});
  const vars=(D.vars||[]).map(f=>{const o=R("vars",f);return {rid:f._rid,test:ids(o.test)[0]||null,L:nm(o.letter)||"",title:nm(o.title)||"",tested:names(o.tested),ctr:nm(o.ctr),status:nm(o.status)||"",th:att(o.thumb)}}).filter(v=>tests.some(t=>t.rid===v.test));
  EPC[x.rid]={ep,clips,waiting,days,tests,drops,team,formats,plan,steps,promo,vars,comments,at:new Date()};return EPC[x.rid]}
function gainsBetween(D,a,b2){let s=0,n=0;for(const z of D.days){if(z.day>=a&&z.day<=b2){if(z.gain!=null){s+=z.gain;n++}}}return n?s:null}
const toAt=(D,n)=>{const z=D.days.find(q=>q.day===n);return z?z.to:null};
const wkGain=(D,end)=>{const a=toAt(D,end),b=toAt(D,end-7);return a!=null&&b!=null?a-b:gainsBetween(D,end-6,end)};

/* ---------- per-episode working state: filled from Airtable when the episode opens, saved back as it changes (m6_save.js) ---------- */
const MS={};
const BASE_CP={1:8000,3:24000,7:55000,14:77000,30:100000};
function st(rid){return MS[rid]||(MS[rid]={tab:"overview",init:false,rankThumb:"eng",rankClip:"views",picks:{thumb:[],clip:[]},more:{},postTab:{thumb:"all",clip:"all"},plat:"all",shown:{thumb:8,clip:10},
  mode:{ideas:"write",brief:"write"},text:{ideas:"",brief:"",ideasLink:"",briefLink:""},sent:null,sentTo:{},todos:[],addTodo:false,tl:{},split:{},planRid:{},extraF:[],openF:null,added:{drops:{},posts:{clip:[]}},fmtSet:{},pst:{},psd:{},
  tr:{},check:[],signed:null,top3At:null,lanes:null,fit:"Not decided",offer:"",sales:[],promo:[],pf:{type:"Story",link:"",date:"",needs:false},
  game:{goal:100000,goalDay:30,first:7,rhythm:"3–4",letgo:false,cps:Object.assign({},BASE_CP),extra:[]},tests:[],openT:{},ms:null,life:null,cm:{open:false,draft:"",local:[]},del:[],saved:null})}
/* where each editable piece lives in Airtable */
const TL_F={1:{date:"recDate"},2:{st:["s2"],date:"plV1"},3:{st:["s5a","s5b"],date:"plClip"},4:{st:["s4"],date:"plThumb"},5:{st:["s6"],date:"plPost"},6:{st:["s8"],date:"plQA"}};
const TR_F=[["ownTeaser","lnkTeaser","plTeaser","s7b"],["ownFinal","lnkFinal","plFinal","s7"],["ownPre","lnkPre","plPre","s7c"],["ownRelDay","lnkRelDay","plRelDay","s7d"]];
/* the default after-release steps are the P1–P6 statuses on the episode; steps the team adds go to Episode Steps */
const PDEF={prod:[["Episode live","p1","Dakshaya"],["Post-release trailer","p3","Stephen"],["Collab posts with the guest","p4","Dakshaya"],["Repost the best clips","p5","Dakshaya"],["Performance check","p6","CJ"]],guest:[["Thank the guest and share assets","p2","Jade"]]};
const LANE={prod:"Production",guest:"Guest relations"};
const fmtKeyOf=(s,fid)=>{const f=FM.find(z=>z.id===fid);if(f)return f.k;const i=s.extraF.findIndex(z=>z.fid===fid);return i>=0?"x"+i:null};
function initState(id){const x=EPREC[id],s=st(x.rid),D=EPC[x.rid];if(!D||D.err||s.init)return;s.init=true;const ep=D.ep;
  s.text.ideas=nm(ep.ideas)||nm(ep.brief)||"";s.text.ideasLink=nm(ep.ideasLink)||"";s.text.brief=nm(ep.cbrief)||"";s.text.briefLink=nm(ep.cbriefLink)||"";
  if(s.text.ideasLink&&!s.text.ideas)s.mode.ideas="file";if(s.text.briefLink&&!s.text.brief)s.mode.brief="file";
  s.sent=d10(nm(ep.textSent));s.stage=typeof MP!=="undefined"?nm((MP.F[x.rid]||{})["fld0cRVyWmcMjy0cq"])||"":"";
  if(typeof MP!=="undefined"){const F3=MP.F[x.rid]||{};s.clipSt=nm(F3.fldIrcw9I8EGWvxUB)||"";s.thumbSt=nm(F3.fldwbHzXGYhBtYRiY)||"";s.perfPlan=nm(F3.fldO0TfbhkGRKOaDf)||""}
  /* split: this episode's Clip Plan rows, else Jade's planned counts */
  for(const f of FM){const r=D.plan.find(p=>p.fid===f.id);if(r){s.split[f.k]=r.v;s.planRid[f.k]=r.rid}}
  /* v34: no invented trailers. A format with no plan row takes the episode's B-roll / TP / carousel target, else 0 */
  const dflt={broll:+nm(ep.pB)||0,talk:+nm(ep.pT)||0,carousel:+nm(ep.pC)||0,single:0,trailer:0};
  for(const k2 in dflt)if(s.split[k2]==null)s.split[k2]=dflt[k2];
  s.extraF=D.formats.filter(f=>f.active&&f.n&&f.used!=="Thumbnails"&&f.rid!==FM_THUMB.id&&!FM.some(z=>z.id===f.rid)).sort((a,b)=>a.order-b.order)
    .map(f=>{const r=D.plan.find(p=>p.fid===f.rid);return {n:f.n,v:r?r.v:0,pt:f.pt,fid:f.rid,cp:r?r.rid:null,u:uid()}});
  /* plan rows for a format the window doesn't list (e.g. an inactive one) still count in the total */
  s.planOther=D.plan.filter(p=>!FM.some(f=>f.id===p.fid)&&!s.extraF.some(f=>f.fid===p.fid)).reduce((t,p)=>t+(+p.v||0),0);
  s.check=names(ep.check);s.signed=d10(nm(ep.signed));s.top3At=d10(nm(ep.top3));
  /* planned dates the team typed win over the schedule's own dates */
  for(const [i,m] of Object.entries(TL_F)){const v=m.date!=="recDate"&&d10(nm(ep[m.date]));if(v)(s.tl[i]=s.tl[i]||{}).date=v}
  const tn=v=>ids(v).map(z=>{const t=D.team.find(q2=>q2.id===z);return t?firstName(t.name):null}).filter(Boolean)[0];
  TR_F.forEach(([o,l,p2],i)=>{const v=s.tr[i]=s.tr[i]||{},ow=tn(ep[o]),ln=nm(ep[l]),pd=d10(nm(ep[p2]));if(ow)v.owner=ow;if(ln)v.link=ln;if(pd)v.date=pd});
  s.picks={thumb:D.clips.filter(c=>c.top3&&c.fmt==="Thumbnail").map(c=>c.rid).slice(0,3),clip:D.clips.filter(c=>c.tp&&c.fmt!=="Thumbnail").map(c=>c.rid).slice(0,3)};
  for(const c of D.clips)if(c.pf){const k2=fmtKeyOf(s,c.pf);if(k2)s.fmtSet[c.rid]=k2}
  s.lanes={};
  for(const l of ["prod","guest"]){const rows=D.steps.filter(z=>z.lane===LANE[l]);
    s.lanes[l]=PDEF[l].map(([n,pf,o])=>{const r=rows.find(z=>z.n===n),raw=nm(ep[pf]);return {n,pf,o0:o,o:r&&r.o||o,date:r?r.date:"",d:/^done$/i.test(raw||""),st0:raw||null,srid:r?r.rid:null,u:uid()}});
    for(const r of rows.filter(z=>!PDEF[l].some(([n])=>n===z.n)))s.lanes[l].push({n:r.n,o:r.o,d:r.d,date:r.date,added:true,srid:r.rid,u:uid()})}
  s.sales=D.steps.filter(z=>z.lane==="Sales").map(r=>({n:r.n,o:r.o||"Jade",d:r.d,date:r.date,srid:r.rid,u:uid()}));
  s.todos=D.steps.filter(z=>z.lane==="To-do").map(r=>({n:r.n,d:r.d,o:r.o,srid:r.rid,u:uid()}));
  s.fit=nm(ep.fit)||"Not decided";s.offer=nm(ep.offer)||"";
  s.promo=D.promo.map(p=>Object.assign({u:uid()},p));
  /* Improvement Plan: this episode's own targets, else the baseline */
  const g=s.game,num=k2=>{const v=nm(ep[k2]);return v==null||v===""?null:+v};
  if(num("goal")!=null)g.goal=num("goal");if(num("goalDay")!=null)g.goalDay=num("goalDay");if(num("firstDay")!=null)g.first=num("firstDay");if(nm(ep.rhythm))g.rhythm=nm(ep.rhythm);
  for(const d of [1,3,7,14,30]){const v=num("cp"+d);if(v!=null)g.cps[d]=v}
  g.extra=String(nm(ep.cpExtra)||"").split(/[;,]/).map(z=>/^\s*(\d+)\s*[:=]\s*(\S+)\s*$/.exec(z)).filter(Boolean).map(m=>({day:+m[1],v:m[2]}));
  g.letgo=!!nm(ep.letgo);
  const LT="ABCDEFGHIJ";
  s.tests=D.tests.map(t=>{const vs=D.vars.filter(v=>v.test===t.rid),vars={};
    for(const v of vs){const vi=LT.indexOf(v.L);if(vi>=0)vars[vi]={title:v.title,tested:v.tested,ctr:v.ctr!=null?f1(v.ctr*100)+"%":"",status:v.status||undefined,img:"",th:v.th,rid:v.rid,u:uid()}}
    const w=t.win?String(t.win).replace(/^.*\b([A-J])$/,"$1"):"",most=vs.reduce((a,v)=>Math.max(a,LT.indexOf(v.L)+1),0);
    return {rid:t.rid,u:uid(),brief:t.brief||"",nvar:t.nvar||Math.max(3,t.combos.length,most),vars,added:false,start:t.start||"",end:t.end||"",tool:t.tool||"",win:/^[A-J]$/.test(w)?w:"",ctrB:t.origCtr!=null?f1(t.origCtr*100)+"%":""}});
  if(D.tests.length)s.openT[D.tests.length-1]=true;
  const first=FM.find(f=>(s.split[f.k]||0)>0);s.openF=first?first.k:null;
  const rel=x.rel;s.life=rel&&rel<=TODAY&&dayDiff(TODAY,rel)>60;
  s.saved=svSnap(Object.assign({id},x),s,D)}
/* a waiting post gets a "Scheduled for" date once its status is Scheduled */
function schedCell(s,c){return (s.pst[c.rid]||c.pst)==="Scheduled"?{h:`<input class="m2-in" type="date" aria-label="Scheduled for" data-k="psd.${c.rid}" value="${esc(s.psd[c.rid]!==undefined?s.psd[c.rid]:c.sf||"")}">`,c:"in"}:{h:"Not booked",c:"mu"}}
function setPath(o,path,v){const ks=path.split(".");let t=o;for(let i=0;i<ks.length-1;i++){const k2=ks[i];if(t[k2]==null)t[k2]=/^\d+$/.test(ks[i+1])?[]:{};t=t[k2]}t[ks[ks.length-1]]=v}
function getPath(o,path){return path.split(".").reduce((t,k2)=>t==null?t:t[k2],o)}
const owners=D=>{const t=(D&&D.team||[]).map(z=>firstName(z.name)).filter(n=>n&&n!=="VA");return [...new Set(t.length?t:OWNERS0)]};
const selOpts=(list,v)=>list.map(o=>`<option${o===v?" selected":""}>${esc(o)}</option>`).join("");

/* ---------- shell ---------- */
const M={id:null,last:null};
document.body.insertAdjacentHTML("beforeend",`<div class="m2-scrim" id="m2Scrim" hidden></div><div class="m2" id="m2" hidden><div class="m2-card" role="dialog" aria-modal="true" aria-labelledby="m2Name"><div class="m2-h" id="m2H"></div><div class="m2-b" id="m2B"></div><div class="m2-f" id="m2F"></div></div></div>`);
const openPeek0=openPeek;
openPeek=function(kind,id){if(kind==="ep"&&EPREC[id])return mOpen(id);return openPeek0(kind,id)};
function mOpen(id,tab){M.id=id;M.last=document.activeElement;const x=EPREC[id],s=st(x.rid);s.tab=tab||"overview";
  $("m2").hidden=false;$("m2Scrim").hidden=false;document.body.style.overflow="hidden";mRender(true);const xb=$("m2X");if(xb)xb.focus();
  if(!EPC[x.rid])epLoad(id).then(()=>{if(M.id===id){initState(id);mRender()}}).catch(err=>{console.error(err);EPC[x.rid]={err};if(M.id===id)mRender()});else initState(id)}
function mClose(){if(SV.id)svFlush();$("m2").hidden=true;$("m2Scrim").hidden=true;document.body.style.overflow="";M.id=null;if(M.last&&M.last.focus)M.last.focus()}
const initials=n=>String(n||"").replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i,"").replace(/[:(].*$/,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
const SCX={act:"Act · needs you now",watch:"Watch · needs a closer look",ok:"Leave alone"};
function mRender(top){const id=M.id;if(!id)return;const x=EPREC[id],s=st(x.rid),b=B[id]||{},e=EP.find(z=>z.id===id),D0=EPC[x.rid],D=D0&&!D0.err?D0:null;
  const rel=x.rel,released=rel&&rel<=TODAY;
  $("m2H").innerHTML=`<div class="m2-top"><div class="m2-who"><div class="m2-av" aria-hidden="true">${esc(initials(b.n||x.name))}</div><div class="m2-nm"><div class="m2-nmr"><h1 id="m2Name">${esc(b.n||x.name)}</h1>${b.st?`<span class="m2-sc ${b.st}"><i aria-hidden="true"></i>${SCX[b.st]}</span>`:""}${D&&typeof stageOf==="function"?(()=>{const m=mpAll().find(z=>z.id===id),sug=m?stageOf(m):"";return `<select class="m2-stage" aria-label="Stage" data-k="stage" data-rr>${STAGES.map(o=>`<option${(s.stage||sug)===o?" selected":""}>${o}</option>`).join("")}</select>`})():""}</div>
    <p class="m2-sub">${rel?(released?`Released ${fmtD(rel)} · out for ${pl(dayDiff(TODAY,rel)+1,"day")}`:`Releases ${fmtD(rel)} · in ${pl(dayDiff(rel,TODAY),"day")}`):"No release date yet"}</p>${D&&typeof ST3!=="undefined"&&typeof mpAll==="function"?(()=>{const m=mpAll().find(z=>z.id===id);
      return `<div class="m2-st3">${ST3.map(([k,l,sh,opts])=>{const cur=s[k]||"";let sug="";if(m&&!cur)try{sug=st3Sug(m,k)}catch(e){}
        return `<label class="m2-st3l"><span>${l}</span><select class="m2-stage${!cur&&sug?" au":""}" aria-label="${l}" data-k="${k}" data-rr title="${!cur&&sug?"Suggested from the timeline. Pick a status to save it.":""}"><option value=""${!cur&&!sug?" selected":""}>Not set</option>${opts.map(o=>`<option${(cur||sug)===o?" selected":""}>${o}</option>`).join("")}</select></label>`}).join("")}</div>`})():""}</div></div>
    <div class="m2-hr"><span class="m2-svs" id="m2Svs" role="status" aria-live="polite">${svLabel()}</span><button class="m2-x" id="m2X" type="button" aria-label="Close">${ic("x",18)}</button></div></div>
    <nav class="m2-tabs" role="tablist" aria-label="Episode sections">${TABS.map(([k2,l])=>`<button type="button" role="tab" data-mtab="${k2}" aria-selected="${s.tab===k2}">${esc(l)}</button>`).join("")}</nav>`;
  const wait=!D0?`<p class="m2-load">Loading this episode from Airtable…</p>`:D0.err?`<p class="m2-err">Couldn't load this episode. Close it and open it again.</p>`:null;
  const body=$("m2B"),keep=top?0:body.scrollTop;
  const fn={overview:tOverview,thumbs:tThumbs,clips:tClips,release:tRelease,post:tPost,testing:tTesting,files:tFiles}[s.tab];
  body.innerHTML=fn(id,x,b,e,D,s,wait)||wait||"";
  body.scrollTop=keep;
  $("m2F").innerHTML=tFoot(D,s);
  if(s.tab==="testing"&&D)wireChart2(D,x,s)}

/* ---------- events (one set, delegated) ---------- */
const m2=$("m2");
m2.addEventListener("click",ev=>{
  if(ev.target===m2){mClose();return}
  const t=ev.target.closest("[data-mtab],[data-act],#m2X");if(!t)return;
  if(t.id==="m2X"){mClose();return}
  const x=EPREC[M.id],s=st(x.rid),D=EPC[x.rid];
  if(t.dataset.mtab){ev.preventDefault();s.tab=t.dataset.mtab;s.ms=null;mRender(true);return}
  const a=t.dataset.act,d=t.dataset;
  if(a==="set"){setPath(s,d.k,d.v==="true"?true:d.v==="false"?false:d.v)}
  else if(a==="pick"){const L=s.picks[d.g],i=L.indexOf(d.i);if(i>=0)L.splice(i,1);else if(L.length<3)L.push(d.i);else return;if(d.g==="thumb"&&L.length===3)s.top3At=TODAY}
  else if(a==="more"){s.more[d.k]=!s.more[d.k]}
  else if(a==="shown"){s.shown[d.g]+=d.g==="thumb"?8:10}
  else if(a==="fmt"){s.openF=s.openF===d.f?null:d.f}
  else if(a==="test"){s.openT[d.i]=!s.openT[d.i];s.ms=null}
  else if(a==="ms"){s.ms=s.ms===d.m?null:d.m}
  else if(a==="addvar"){const T=s.tests[d.i];T.nvar=Math.min(10,(+T.nvar||1)+1)}
  else if(a==="addtest"){s.tests.push({u:uid(),brief:"",nvar:3,vars:{},added:true,start:TODAY,end:"",tool:"",win:"",ctrB:""});s.openT[s.tests.length-1]=true}
  else if(a==="rmtest"){const i=+d.i;if(s.tests[i]&&!s.tests[i].rid)s.tests.splice(i,1)}
  else if(a==="addfmt"){s.extraF.push({n:"",v:0,pt:"",fid:null,cp:null,u:uid()})}
  else if(a==="adddrop"){const L=s.added.drops[d.f]||(s.added.drops[d.f]=[]);L.push({on:TODAY,many:"",who:"",link:"",u:uid()});if(d.f!=="thumb")s.openF=d.f}
  else if(a==="rmdrop"){const L=s.added.drops[d.f];if(L[+d.i]&&!L[+d.i].rid)L.splice(+d.i,1)}
  else if(a==="addpost"){s.added.posts.clip.push({name:"",fmt:"",plat:HAND_PLATS[0],status:"Posted",date:TODAY,link:"",u:uid()})}
  else if(a==="rmpost"){const L=s.added.posts.clip;if(L[+d.i]&&!L[+d.i].rid)L.splice(+d.i,1)}
  else if(a==="todo"){s.addTodo=true}
  else if(a==="addstep"){s.lanes[d.l].push({n:"",o:d.l==="guest"?"Jade":"Dakshaya",d:false,date:"",added:true,u:uid()})}
  else if(a==="rmstep"){const z=s.lanes[d.l][+d.i];if(!z||z.pf)return;if(z.srid)s.del.push({t:EPSPEC.t.steps,id:z.srid});s.lanes[d.l].splice(+d.i,1)}
  else if(a==="addsales"){s.sales.push({n:"",o:"Jade",d:false,date:"",u:uid()})}
  else if(a==="promo"){if(!s.pf.link&&!s.pf.date)return;s.promo.push(Object.assign({status:"Planned",u:uid()},s.pf));s.pf={type:"Story",link:"",date:"",needs:false}}
  else if(a==="send"){const text=d.to==="Jean"?(s.text.ideas||s.text.ideasLink):(s.text.brief||s.text.briefLink);if(!String(text||"").trim())return;
    if(d.to==="Jean"){s.sent=TODAY;svHandOff(["Jean"],"the thumbnail text ideas",text)}else{s.sentTo.editors=TODAY;svHandOff(EDITORS,"the clipping brief",text)}}
  else if(a==="svretry"){SV.id=M.id;svFlush();return}
  else if(a==="addcp"){s.game.extra.push({day:"",v:""})}
  else if(a==="reset"){s.game.cps=Object.assign({},BASE_CP);s.game.extra=[];s.game.goal=100000;s.game.goalDay=30;s.game.first=7;s.game.rhythm="3–4"}
  else if(a==="sign"){s.signed=TODAY}
  else if(a==="cm"){s.cm.open=!s.cm.open}
  else if(a==="cmsend"){postComment(s)}
  else if(a==="goto"){s.tab=d.to;if(d.to==="testing"&&D&&D.tests.length)s.openT[D.tests.length-1]=true;mRender(true);return}
  else return;
  mRender();svMark()});
m2.addEventListener("change",ev=>{const t=ev.target;if(!M.id||t.id==="m2Cm")return;const x=EPREC[M.id],s=st(x.rid);
  if(t.dataset.k){const v=t.type==="checkbox"?t.checked:t.type==="number"?(t.value===""?"":+t.value):t.value;setPath(s,t.dataset.k,v);if(t.dataset.rr!==undefined)mRender();svMark();return}
  if(t.dataset.ck){const L=s.check,i=L.indexOf(t.dataset.ck);if(t.checked&&i<0)L.push(t.dataset.ck);if(!t.checked&&i>=0)L.splice(i,1);mRender();svMark();return}
  if(t.dataset.tested){const [ti,vi,opt]=t.dataset.tested.split("|"),T=s.tests[+ti],V=T.vars[vi]||(T.vars[vi]={u:uid()});const cur=V.tested||defTested(+ti,M.id);const set=new Set(cur);t.checked?set.add(opt):set.delete(opt);V.tested=[...set];mRender();svMark();return}
  if(t.dataset.tick!==undefined){const n=t.dataset.tick,z=s.todos.find(q2=>q2.n===n);if(z)z.d=t.checked;else s.todos.push({n,d:t.checked,o:t.dataset.o||"",u:uid()});mRender();svMark();return}
  if(t.dataset.todo!==undefined){if(t.dataset.used)return;t.dataset.used="1";const v=t.value.trim();if(v)s.todos.push({n:v,d:false,o:t.dataset.o||"",u:uid()});s.addTodo=false;mRender();svMark()}});
m2.addEventListener("input",ev=>{const t=ev.target;if(!M.id||!t.dataset.k||t.dataset.rr!==undefined)return;if(t.type==="text"||t.type==="url"||t.tagName==="TEXTAREA"){const s=st(EPREC[M.id].rid);setPath(s,t.dataset.k,t.value);if(t.id!=="m2Cm")svMark()}});
m2.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.id==="m2Cm"){ev.preventDefault();postComment(st(EPREC[M.id].rid))}});
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!M.id)return;const s=st(EPREC[M.id].rid);if(s.ms){s.ms=null;mRender();return}mClose()});
document.addEventListener("click",e=>{if(!M.id)return;const s=st(EPREC[M.id].rid);if(s.ms&&!e.target.closest(".m2-ms")){s.ms=null;mRender()}},true);
function postComment(s){const inp=$("m2Cm");const v=(inp&&inp.value||"").trim();if(!v)return;
  const tags=[...new Set([...v.matchAll(/@(\w+)/g)].map(m=>TEAMN.find(n=>n.toLowerCase()===m[1].toLowerCase())).filter(Boolean))];
  const c={by:(window.RL_AUTH&&window.RL_AUTH.name)||window.__rlViewer||"You",at:new Date().toISOString(),html:esc(v).replace(/@(\w+)/g,'<span class="tag">@$1</span>'),pending:true,mine:true};
  s.cm.local.push(c);s.cm.open=true;s.cm.draft="";inp.value="";svComment(v,tags,c);mRender()}

/* shared bits */
const sec=(n,title,sub,right,cls,body)=>`<section class="m2-s ${cls||""}"><div class="m2-sh"><div class="m2-shl">${n?`<span class="m2-num" aria-hidden="true">${n}</span>`:""}<div class="m2-ttl"><h2>${title}</h2>${sub?`<p>${sub}</p>`:""}</div></div>${right||""}</div>${body}</section>`;
const tile=(lab,val,sub,o)=>{o=o||{};return `<div class="m2-tile${o.red?" red":""}${o.dash?" dash":""}${o.sm?" sm":""}"><span class="lab">${o.icon||""}${lab}</span><span class="val${o.vc?" "+o.vc:""}${o.v24?" s24":""}">${val}</span>${sub==null?"":String(sub).startsWith("<span class=\"m2-pill")?sub:`<span class="sub${o.sc?" "+o.sc:""}">${sub}</span>`}${o.extra||""}</div>`};
const tiles=a=>`<div class="m2-tiles" style="--n:${a.length}">${a.join("")}</div>`;
const seg=(k2,v,opts,lab)=>`<div class="m2-seg" role="group" aria-label="${lab}">${opts.map(([val,l])=>`<button type="button" data-act="set" data-k="${k2}" data-v="${val}" aria-pressed="${v===val}">${l}</button>`).join("")}</div>`;
const tbl=(lab,cols,head,rows,foot,cls)=>`<div class="m2-tbl ${cls||""}" role="table" aria-label="${lab}"><div class="m2-tr hd" role="row" style="--cols:${cols}">${head.map(h=>`<span role="columnheader">${h}</span>`).join("")}</div>${rows}${foot?`<div class="m2-tf">${foot}</div>`:""}</div>`;
const trow=(cols,cells,cls)=>`<div class="m2-tr ${cls||""}" role="row" style="--cols:${cols}">${cells.map(c=>typeof c==="object"?`<span role="cell" class="${c.c||""}">${c.h}</span>`:`<span role="cell">${c}</span>`).join("")}</div>`;
const pill=(t,c)=>`<span class="m2-pill sm ${c}">${t}</span>`;
const statIcons=[["eye","Views"],["heart","Likes"],["chat","Comments"],["share","Shares"],["save","Saves"]].map(([n,l])=>ic(n,15,"currentColor",l));
const dc=["#2B3138","#32303D","#2D3833","#3A3F46","#403B44","#363C35"];
const weekDays=()=>{const mon=addD(TODAY,-((new Date(TODAY+"T00:00:00Z").getUTCDay()+6)%7));return [...Array(7)].map((_,i)=>addD(mon,i))};
const DN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
