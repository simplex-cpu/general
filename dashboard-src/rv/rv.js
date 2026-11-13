<script>
/* ---------- Rise Voice: read live from Airtable through Claude, or from the hosted page's /rv (only on Kash's own link). No Rise Voice data is saved in this page. ---------- */
const RVBASE="appOttHso6hYjBXhw";
const RVF={
 clients:["tblPm4VFwe6nTaYj4",{n:"fld8bJt7l0VdcWzOA",status:"fldAvM7HZCgZi6wD1",ig:"fldRkPa0mVBgBBcqM",strat:"fldgrHcAwxLu8VEc9",am:"fldNJdkx7rbSTCO25",contract:"fldRn2OT9XLrd50TX",months:"fld8qJL6JL3MEcp8d",dsat:"fldUsCOXLb0XwQ7Bk",tier:"fldSoHti5hWhJ6JJy",term:"fldiiO6yG8QJ9e8Tp",vlpd:"fldlovNNxG8lNkZl9",glpd:"fld2LaTgEwQEs5lmn",health:"fldZ7VHv0YpxQm8ZT",res:"fldNIxy7HPm2rBuhm",sent:"fldXsQn9JJeIUfxon",script:"fldluISmVFeQS0MGM",note:"fld7DD0pXAEc5t6DN",rol:"fldpwhIjVpywoQWJ1",ctype:"fldmiBj4ijYvS6ALq",lastPr:"fldBPqegkoXTzOHv3"},{operands:[{operator:"=",operands:["fldAvM7HZCgZi6wD1","selwngSpg0Q8Ivp7N"]}]}],
 stats:["tblT6aT8LbtR3WEie",{n:"fld7uECxNa1F2CnEF",client:"fldHqX4XayIIsg2dR",fol:"fldMVrQWvkyF4ESwY",newf:"fldMGSwoZPVgJVY78",fg:"fldK5XXXj9pY8oLua",views:"fldF6csgRHMtBHCPz",prev:"fldkJKZlG3RvWw3T4",reach:"fldcfD4IKqy0rPG6f",eng:"fldovRjZHakcKLt5A",er:"fldYJX7hERaeG5STV",visits:"fldiDjVvgqTBrYp6g",posts:"fldNXMd3QDKwhxch0",vchg:"fldQoLGJhduQFVDaY",upd:"fldZo6eivna09W6sP",month:"fldprdajh8LVsZtfH"}],
 need:["tblYlLgTHmlfN5dYu",{item:"fldj2EBCRMe77Acj5",type:"fldtXTEBw9hkjx1ib",strat:"fld5heVGvrydlFUB2",client:"fldGAV4Kny0jJNmfp",done:"fldxqsU0CZYbas9Zo",due:"fldzPDKp6esNUle3R",det:"fldDHO66GXlBwydQR",from:"fldBxCZufk2zkIcAr",flagged:"fld6IOX96NfWpb8BP"},{operator:"or",operands:[{operator:"=",operands:["fldxqsU0CZYbas9Zo",false]},{operator:"isWithin",operands:["fld6IOX96NfWpb8BP",{mode:"pastNumberOfDays",numberOfDays:60,timeZone:"Europe/London"}]}]}],
 audits:["tblnOX9sp6klBbxtA",{n:"fldbMgOAE0lgNpZlY",client:"fld5wu1PmMq9rZFIZ",why:"fldrje1wq4Tgfz6aL",stage:"fldHPUn34Pa4ygswq",date:"fldyDKDsqB5dqea2y",by:"fldOplflaMN4wk6AO",sent:"fldjALgpihKSaFmjt"}],
 pr:["tblhTbCnyHQYSo5Hh",{client:"fld0GrUJnhUjhlXXg",date:"fldX2eIG79eq56isG",actions:"fldEC6TKCbgrt6Jlp",pending:"fldGtBvLPRHXXa05g",agreed:"fldDcjz6oN8HRBEcY"},{operands:[{operator:"isWithin",operands:["fldX2eIG79eq56isG",{mode:"pastNumberOfDays",numberOfDays:120,timeZone:"Europe/London"}]}]}],
 tasks:["tbl7gVj7Owmn5WBEW",{n:"fldffOVMyhrlvRBgZ",status:"fldEzDPoSmPt87LOB",who:"fldvasDBd2huhGhO7",due:"fldsGUdBFJH5kL2iI",brand:"flddWIYoBLbOIacl8",pri:"fldmwcd0McGsxXDUr",area:"fldxiWGI1vOjnBSSV",dept:"flds5LPgZpYdu4Y6b",created:"fldrffvjIV1LybagZ"},{operator:"or",operands:[{operator:"isAnyOf",operands:["fldEzDPoSmPt87LOB",["selgGW4goemG2QkDo","selRqCy6ASRuGYRqB","sel50sLqiW2mG2fll","seluJ80Eqr1cAwYPj"]]},{operator:"and",operands:[{operator:"=",operands:["fldEzDPoSmPt87LOB","sel8LIEaCURU1ofc6"]},{operator:"isWithin",operands:["fldsGUdBFJH5kL2iI",{mode:"pastNumberOfDays",numberOfDays:30,timeZone:"Europe/London"}]}]},{operator:"and",operands:[{operator:"isEmpty",operands:["fldEzDPoSmPt87LOB"]},{operator:"isWithin",operands:["fldrffvjIV1LybagZ",{mode:"pastNumberOfDays",numberOfDays:60,timeZone:"Europe/London"}]}]}]}],
 rltasks:["tblo67QERNSmGzVaJ",{n:"fldypaV3pfGFUwUV2",status:"fld54iDcRB5PIU4Tp",owner:"fldnFWw9MtpsrUD6A",due:"fldBf1bXOOwnzmZ0J",pri:"fld5ZB32kORU6EhkD",area:"fldEQ3AMDWDY0Il1u",ep:"fldeQQ12J1kfXXs9C"},null,"appaT1sh6XB9ubqTF"],
 rlteam:["tblNH6iSlbp4K9NFd",{n:"fld2G3e9kvvIeeLsz",role:"fldz3bu5bA5keFmmO"},null,"appaT1sh6XB9ubqTF"],
 rleps:["tblx8C7czyAikbbVp",{n:"fldhFqJB0E9XM6plr",rel:"fldlWnJQipytEIMsZ"},null,"appaT1sh6XB9ubqTF"],
 renew:["tblmNoXpjeEjEwSvJ",{client:"fldGXfW4ibG4hF4Eo",status:"fldsOqGXOD8pdhPQz",contract:"fldYCygXdTeJOWSHY",end:"fld15eNgC45YyDMFo"}],
 team:["tblu7ZGCkLPA9x1cp",{n:"fldpYKOf0BRmV5QzM",role:"fldwuSoyLdzCbf3gn",cs:"fldTajBv52CGF5xsi",perf:"fldj2fLxNnbDsc6m6",occ:"fld8Brimget4d5O3m",csat:"fldWuPUqQxcthv7TT",pr:"fld79Q7yo2ssAVzcm",coach:"fld0x57gDCgR1CQEz",tb:"fldUT5RDbCt2yuMSN"},{operands:[{operator:"=",operands:["fldTajBv52CGF5xsi","selp9jRyqr6K9w3t0"]}]}],
 poa:["tblJG0j1MeStY0hNC",{n:"fldM14fRGpW24gbNK",strat:"fldAprkAeuqKPxLDf",wk:"fldWbRdpbfK4ilAky",stage:"fldsuiIpNkpfb9MIF",plan:"fld0IUfcZF5pCKO8p",done:"fldkgCfwWKmC4wS6V",help:"fldU20QClfzxq1ptw"},{operands:[{operator:"isWithin",operands:["fldWbRdpbfK4ilAky",{mode:"pastNumberOfDays",numberOfDays:21,timeZone:"Asia/Dubai"}]}]}],
 fb:["tbleK8G6UBlu4nUQJ",{n:"fldi3NMjZ68mtBVhr",who:"fld1W0V3hbAfJUOxq",date:"fldYxcuuDfL8aMXt2",stage:"fldyWQeARLKaoeDE9",avg:"fldBCxv7DkXppv2js"}],
 proj:["tblL2Z7dGg0N9bPa6",{n:"fld1OBrXP5seuETrf",sec:"fldWVjcK67ScifCBu",status:"fldN56LYIWclRW8y4",due:"fld7ka1CN3cJISRnB",owner:"fldrNacHbjQjPH4pY"}],
 ai:["tblkArCwRHig7VYYK",{n:"fldSXlXgWjfKuIy8Q",owner:"fld9vRVS4POXW1N2H",cat:"fldogx07b2Nywti6G",status:"fldMC8cLxAwbLWkAz",due:"fldUGepUS6DJVYkA2"}],
 rev:["tblfpkyNY5P3S25hf",{month:"fldX44X7jvZpJemTN",end:"fldHHhnUphptuBj98",status:"fldfoFn4nhI7TpeOp",rev:"fldi7nYWk1SYnGkns",col:"fldCHdQqQmk7IbkKe",profit:"fldH0CjRi8kWRGT8U",costs:"flddKcqahztVRes99",churn:"fldgqyZ70s09TwzCA",churned:"fld1vscvx1S76wFou",paying:"fldiJFjV539xGfYyT",tocol:"fldoazRDdgxZvfbdf",pastdue:"fldPZT6xa63wO5uNA",pnl:"fldZjDQvCWsG2CwuC",admin:"fld9natS3ccUgJuta",actions:"fldaejZtX2IksH6OI",why:"fldkHmU5PgzLuxSPy",ap:"fldQoKnhPKUEztsNH",leave:"fldsDwD8WbIrlmFuN"}],
 acct:["tblym2KkyWaK9wymW",{client:"fldtLW8qUsLJyGJAZ",type:"fld4dJ2RyiwM1XotK",plat:"fldLXGKGhWVb9baTR",start:"fldEiTwUMiSuNwRW5",fol:"fldeiCVn8qAAeQMf7"},{operands:[{operator:"=",operands:["fld4dJ2RyiwM1XotK","sel8byOuDXX4tenbs"]},{operator:"=",operands:["fldLXGKGhWVb9baTR","selXeIk6BjivwzJTk"]},{operator:"isWithin",operands:["fldEiTwUMiSuNwRW5",{mode:"pastNumberOfDays",numberOfDays:63,timeZone:"Europe/London"}]}]}],
 posts:["tblGhnReEhEm6Gxcd",{client:"fldSc9zfRfWMTLp9E",at:"fld64b1gZoIsCNXb5",views:"fldPbUpe6DUMM2UOb",com:"fldpAt7tNKlU1PRRn"},{operands:[{operator:"=",operands:["fldS160nRRRj5slZN","selhGOvLk1xYtuEEM"]},{operator:"isWithin",operands:["fld64b1gZoIsCNXb5",{mode:"pastNumberOfDays",numberOfDays:190,timeZone:"Asia/Dubai"}]}]}],
 inv:["tbl2dhNsKimCVEaRr",{n:"fldwqNzS8DMBSezPT",payer:"fldwl0YanjUzF97A1",status:"fld0pvur3GhRLf1Dw",due:"fldNPNANA2FZaJVss",amt:"fldBHod53Rsmrxfie",cur:"fld1c3vYgVOwEO8iL"},{operands:[{operator:"isAnyOf",operands:["fld0pvur3GhRLf1Dw",["selkOpLqj24RXnf0e","selzNgquvHFIWtGhY"]]}]}]
};
const RVMONEY=["rev","inv"];
const RVLEADS=[
 {n:"Sarah",full:"Sarah Dart",usr:["usrp4AnYeYSXoSo9P"],slack:"U048YEJPQ2F",roster:"recXGG3rCBtuFoCP4"},
 {n:"Karen",full:"Karen Cedeno",usr:["usrjMRtIMW9TfkUTy"],slack:"U068KHRF03D",roster:"recgruhqfGM9G8719"},
 {n:"Gretta",full:"Gretta Ulloa",usr:["usrcL3Dl4gtmffEV8","usrdoFnRhkT0SYBcF"],slack:"U06D0UPV5PB",roster:"recs8R8myBMpnk0Ie"},
 {n:"Dom",full:"Dominique Kotzenberg",usr:["usrWo117QgBovJwe8"],slack:"U098KVAKTK2",roster:"recujFOIyuLvhEdYo"},
 {n:"Jennifer",full:"Jennifer Fuentes",usr:["usrAmyfkbAsYm686H"],slack:"U09QR3VSNRL",roster:"recMJjXjUQKYcS9W2"}];
/* Needs Attention items people write (calls, Slack, requests, scripts), as opposed to automatic alerts */
const RVHUMAN=/^(?!.*editing)(?:.*(?:from calls|slack|requests?|scripts|client meeting|performance review|audit|revision))/i;
const RVINV_FROM="2026-01-01"; /* invoices due before this are left out of the dashboard (Karen asked to drop the old ones) */
const RVALLOW=["karenc@simplexmedia.co.uk","sarahd@simplexmedia.co.uk","jenniferf@simplexmedia.co.uk"];
const RVOWN=/^(kash personal|relearn|rise voice( 1)?)$/i;
const RVGROW=/sales|launch|offer|podcast|conference|vip|lead|course|bundle/i;
const RVX={state:"idle",money:false,M:null,hosted:!window.claude?.use&&/^https?:$/.test(location.protocol)};
let rvAll8={g:false,o:false},RVN={},rvOpen=null,rvMsg=null,rvMsgFor=null,rvInvMsg=false,rvSort="views",rvDir="desc";

/* ---------- values: the same code reads Claude's connector shape and Airtable's REST shape ---------- */
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rvS=v=>v==null?null:typeof v!=="object"?v:Array.isArray(v)?(v.length?rvS(v[0]):null):("error" in v||"specialValue" in v)?null:("state" in v&&"value" in v)?v.value:v.name!=null?v.name:v.valuesByLinkedRecordId?rvS(Object.values(v.valuesByLinkedRecordId).flat()):null;
const rvNum=v=>{v=rvS(v);return typeof v==="number"&&isFinite(v)?v:null};
const rvDate=v=>{v=rvS(v);return typeof v==="string"&&/^\d{4}-\d\d-\d\d/.test(v)?v.slice(0,10):null};
const rvAll=v=>v==null?[]:Array.isArray(v)?v.map(x=>x&&typeof x==="object"?x.name??null:x).filter(x=>x!=null):v.valuesByLinkedRecordId?Object.values(v.valuesByLinkedRecordId).flat().map(x=>x&&typeof x==="object"?x.name:x).filter(x=>x!=null):[rvS(v)].filter(x=>x!=null);
const rvIds=v=>Array.isArray(v)?v.map(x=>typeof x==="string"?x:x&&x.id).filter(Boolean):[];
const rvNames=v=>Array.isArray(v)?v.map(x=>typeof x==="string"?RVN[x]||null:x&&(x.name||RVN[x.id])||null).filter(Boolean):[];
const rvClean=s=>String(s??"").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,"").trim();
const rvText=v=>{v=rvS(v);if(typeof v!=="string")return null;const t=v.replace(/\*\*/g,"").replace(/\\-/g,"-").replace(/\n{3,}/g,"\n\n").trim();return t||null};
const rvNote=s=>{if(typeof s!=="string"||!s.trim()||/#ERROR/.test(s))return null;const m=/Reason[^:*]*:\*{0,2}\s*([\s\S]+)$/i.exec(s);return (m?m[1]:s).replace(/\*\*/g,"").replace(/^•\s*/gm,"").trim()};
const first=n=>String(n||"").split(" ")[0];
/* Karen, 13 Nov: Projects and Team coaching show only the podcast team (ReLearn's Team table) plus Sarah, Jennifer and Karen.
   Matched on first name, since Rise Voice's Task Manager and Team Roster hold full names and ReLearn's Team table mostly first names. */
const KTEAM={m:null,set:null};
const kteamKey=n=>String(n||"").trim().split(/[\s(]+/)[0].toLowerCase();
function kteamOK(n){const M=RVX.M;if(KTEAM.m!==M){KTEAM.m=M;KTEAM.set=new Set(["sarah","jennifer","karen",...((M&&M.rlTeam)||[]).map(x=>kteamKey(x.n))].filter(Boolean))}return KTEAM.set.has(kteamKey(n))}
const lc1=s=>s.charAt(0).toLowerCase()+s.slice(1);
const gbp=n=>n==null?"–":(n<0?"−":"")+"£"+k(Math.round(Math.abs(n)));
const pc1=x=>x==null?"–":f1(x*100)+"%";
const spc=x=>x==null?"–":(x>0?"+":x<0?"−":"")+Math.abs(Math.round(x*100))+"%";
const fmtDY=s=>s?fmtD(s)+(s.slice(0,4)!==TODAY.slice(0,4)?" "+s.slice(0,4):""):"–";
const mshort=s=>s?MON[+s.slice(5,7)-1]:"–";
const rvRows=(D,key)=>{const m=RVF[key][1];return (D[key]||[]).map(r=>{const o={id:r.id};for(const x in m)o[x]=r.f[m[x]];return o})};

/* ---------- fetch ---------- */
async function rvCanSeeMoney(){try{const u=await window.claude.use("user");if(!u)return false;const me=await u.me();return !!me.isOwner||RVALLOW.includes(String(me.email||"").toLowerCase())}catch(e){return false}}
async function rvFetch(){
  if(window.claude?.use){
    const mcp=await window.claude.use("mcp");if(!mcp)throw {code:"unavailable"};
    RVX.money=await rvCanSeeMoney();
    const out={};
    await Promise.all(Object.keys(RVF).filter(x=>RVX.money||!RVMONEY.includes(x)).map(async key=>{
      const [tbl,f,flt,base]=RVF[key];let recs=[],cursor=null;
      do{const r=await mcp.callTool("Airtable","list_records_for_table",{baseId:base||RVBASE,tableId:tbl,fieldIds:Object.values(f),pageSize:1000,...(flt?{filters:flt}:{}),...(cursor?{cursor}:{})},{cache:false});
        const p=r.payload||{};recs=recs.concat(p.records||[]);cursor=p.nextCursor||null}while(cursor);
      out[key]=recs.map(x=>({id:x.id,f:x.cellValuesByFieldId||{}}))}));
    return out}
  const j=await rvGet("main");
  RVX.money=true;const out={};for(const x in RVF)out[x]=(j[x]||[]).map(y=>({id:y.id,f:y.fields||{}}));
  /* the 2,000+ Instagram posts come in a second request so the rest of the tab shows first */
  RVX.postsLater=true;return out}
async function rvGet(part){
  const r=await fetch(location.pathname.replace(/\/$/,"")+"/rv",{cache:"no-store",headers:{"X-RV-Part":part}});
  if(!r.ok)throw {code:"http_"+r.status};
  const j=await r.json();if(!j||j.ok===false)throw {code:"http_bad"};return j}
async function rvLoadPosts(D){
  if(!RVX.postsLater)return;RVX.postsLater=false;RVX.postsLoading=true;
  try{const j=await rvGet("posts");D.posts=(j.posts||[]).map(y=>({id:y.id,f:y.fields||{}}));D.acct=(j.acct||[]).map(y=>({id:y.id,f:y.fields||{}}));RVX.postsLoading=false;RVX.M=rvModel(D);rvRender()}
  catch(e){RVX.postsLoading=false;const n=$("rvCmpNote");if(n)n.textContent="Couldn't load the Instagram posts for the comparison. Try Refresh."}}

/* ---------- model ---------- */
function rvModel(D){
  RVN={};
  const team=rvRows(D,"team").map(r=>({id:r.id,n:String(rvS(r.n)||"").trim(),role:rvS(r.role)||"",cs:rvS(r.cs),perf:rvS(r.perf),occ:rvNum(r.occ),csat:rvNum(r.csat),pr:rvNum(r.pr),coach:rvNum(r.coach),tb:rvS(r.tb)})).filter(t=>t.n&&t.cs!=="Inactive");
  team.forEach(t=>RVN[t.id]=t.n);
  const clients=rvRows(D,"clients").filter(r=>rvS(r.status)==="Active"&&rvS(r.n)).map(r=>({id:r.id,n:String(rvS(r.n)).trim(),ig:rvS(r.ig),sids:rvIds(r.strat),strat:rvNames(r.strat),am:rvNames(r.am),contract:rvS(r.contract),months:rvNum(r.months),dsat:rvAll(r.dsat).map(rvClean),tier:rvAll(r.tier)[0]||null,term:rvAll(r.term)[0]||null,vlpd:rvDate(r.vlpd),glpd:rvDate(r.glpd),health:rvS(r.health),res:rvS(r.res),sent:rvS(r.sent),script:rvS(r.script),note:rvNote(rvS(r.note)),rol:rvS(r.rol),ctype:rvS(r.ctype),s:null,pm:null,need:[],audit:null,renew:null,inv:[]}));
  clients.forEach(c=>{c.own=RVOWN.test(c.n);RVN[c.id]=c.n;if(c.ig&&!/^https?:\/\//i.test(c.ig))c.ig="https://"+c.ig.replace(/^\/+/,"");if(c.ig&&!/^https:\/\/(www\.)?instagram\.com\//i.test(c.ig))c.ig=null});
  const byId=Object.fromEntries(clients.map(c=>[c.id,c])),byName=Object.fromEntries(clients.map(c=>[c.n.toLowerCase(),c]));
  const find=(ids,name)=>{for(const i of ids)if(byId[i])return byId[i];return name?byName[String(name).trim().toLowerCase()]||null:null};
  let statsMonth=null,statsUpd=null;
  for(const r of rvRows(D,"stats")){const c=find(rvIds(r.client),rvS(r.n));if(!c)continue;
    const s={fol:rvNum(r.fol),newf:rvNum(r.newf),fg:rvNum(r.fg),views:rvNum(r.views),prev:rvNum(r.prev),reach:rvNum(r.reach),eng:rvNum(r.eng),er:rvNum(r.er),visits:rvNum(r.visits),posts:rvNum(r.posts),vchg:rvNum(r.vchg)};
    if(s.views==null&&s.fol==null)continue;c.s=s;statsMonth=statsMonth||rvS(r.month);const u=rvDate(r.upd);if(u&&(!statsUpd||u>statsUpd))statsUpd=u}
  const need=rvRows(D,"need").filter(r=>rvS(r.done)!==true).map(r=>({item:String(rvS(r.item)||"").trim(),type:rvClean(rvS(r.type)),sids:rvIds(r.strat),cids:rvIds(r.client),due:rvDate(r.due),det:String(rvS(r.det)||"").trim()})).filter(x=>x.item);
  need.forEach(x=>{const c=find(x.cids);x.client=c?c.n:rvNames(x.cids.map(i=>({id:i})))[0]||null;if(c)c.need.push(x)});
  for(const r of rvRows(D,"audits")){const stage=rvS(r.stage);if(!stage||stage==="Reassessed")continue;const c=find(rvIds(r.client));if(!c)continue;
    const a={why:rvS(r.why),stage,date:rvDate(r.date),by:rvDate(r.by),sent:rvDate(r.sent)};if(!c.audit||String(a.date)>String(c.audit.date))c.audit=a}
  for(const r of rvRows(D,"renew")){const c=find(rvIds(r.client));const end=rvDate(r.end);if(!c||!end)continue;if(!c.renew||end>c.renew.end)c.renew={end,status:rvS(r.status),contract:rvS(r.contract)}}
  const inv=RVX.money?rvRows(D,"inv").map(r=>({n:String(rvS(r.n)||"").trim(),pids:rvIds(r.payer),status:rvS(r.status),due:rvDate(r.due),amt:rvNum(r.amt)||0})).filter(i=>i.status==="To Collect"||i.status==="Past Due"):[];
  const invOld=inv.filter(i=>i.due&&i.due<RVINV_FROM);inv.splice(0,inv.length,...inv.filter(i=>!invOld.includes(i)));
  inv.forEach(i=>{const c=find(i.pids);i.client=c?c.n:(rvNames(r0(i.pids))[0]||i.n||"Unknown");if(c)c.inv.push(i)});
  const rev=RVX.money?rvRows(D,"rev").map(r=>({month:rvS(r.month),end:rvDate(r.end),status:rvS(r.status),rev:rvNum(r.rev),col:rvNum(r.col),profit:rvNum(r.profit),costs:rvNum(r.costs),churn:rvNum(r.churn),churned:rvNames(r.churned),paying:rvNum(r.paying),tocol:rvNum(r.tocol),pastdue:rvNum(r.pastdue),pnl:rvText(r.pnl),admin:rvText(r.admin),actions:rvText(r.actions),why:rvText(r.why),ap:rvText(r.ap),leave:[...new Set(rvAll(r.leave).flatMap(x=>String(x).split(",")).map(rvClean).filter(Boolean))]})).filter(m=>m.end).sort((a,b)=>a.end.localeCompare(b.end)):[];
  const ci=rev.findIndex(m=>m.end.slice(0,7)===TODAY.slice(0,7)),cur=ci>=0?rev[ci]:null,prev=ci>0?rev[ci-1]:null,last6=ci>=0?rev.slice(Math.max(0,ci-5),ci+1):rev.slice(-6);
  /* Instagram posts by month: average views and comments per post */
  for(const r of rvRows(D,"posts")){const c=find(rvIds(r.client));const at=rvS(r.at);if(!c||typeof at!=="string")continue;const m=at.slice(0,7);
    const o=((c.pm=c.pm||{})[m]=c.pm[m]||{n:0,vs:0,vn:0,cs:0,cn:0});o.n++;const v=rvNum(r.views),cm=rvNum(r.com);if(v!=null){o.vs+=v;o.vn++}if(cm!=null){o.cs+=cm;o.cn++}
    const w=rvMon(at.slice(0,10)),q=((c.pw=c.pw||{})[w]=c.pw[w]||{n:0,cs:0,cn:0});q.n++;if(cm!=null){q.cs+=cm;q.cn++}}
  const pmonths=[...new Set(clients.flatMap(c=>Object.keys(c.pm||{})))].filter(m=>m<=TODAY.slice(0,7)&&clients.filter(c=>!c.own&&c.pm&&c.pm[m]&&c.pm[m].vn>=3).length>=3).sort().slice(-6); /* months where at least 3 clients have 3+ posts with views */
  for(const c of clients)if(c.pm)for(const m in c.pm){const o=c.pm[m];o.v=o.vn?o.vs/o.vn:null;o.c=o.cn?o.cs/o.cn:null}
  const pmFull=pmonths.filter(m=>m<TODAY.slice(0,7)).pop()||null;
  for(const c of clients){c.R=rvReasons(c);c.st=c.R.some(r=>r.lvl==="act")?"act":c.R.some(r=>r.lvl==="watch")?"watch":"ok";c.askSarah=c.R.some(r=>r.sarah)}
  const poa=rvRows(D,"poa").map(r=>({sids:rvIds(r.strat),wk:rvDate(r.wk),stage:rvS(r.stage),plan:rvNum(r.plan),done:rvNum(r.done),help:String(rvS(r.help)||"").trim()}));
  const fb=rvRows(D,"fb").map(r=>({n:rvS(r.n),sids:rvIds(r.who),date:rvDate(r.date),stage:rvS(r.stage),avg:rvNum(r.avg)})).filter(x=>x.n&&x.sids.length);
  const strats=team.filter(t=>/strategist/i.test(t.role)).map(t=>{const acc=clients.filter(c=>c.sids.includes(t.id));
    const items=need.filter(x=>x.sids.includes(t.id)),slack=items.filter(x=>x.type==="Slack"),late=items.filter(x=>x.due&&x.due<TODAY);
    const p=poa.filter(x=>x.sids.includes(t.id)).sort((a,b)=>String(b.wk).localeCompare(String(a.wk)))[0]||null;
    const next=fb.filter(x=>x.sids.includes(t.id)&&x.stage!=="Done"&&x.date&&x.date>=TODAY).sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
    const lastRev=fb.filter(x=>x.sids.includes(t.id)&&x.stage==="Done"&&x.avg!=null).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
    return {...t,acc,items,slack,late,poa:p,next,lastRev,cnt:{act:acc.filter(c=>c.st==="act").length,watch:acc.filter(c=>c.st==="watch").length,ok:acc.filter(c=>c.st==="ok").length}}}).filter(s=>s.acc.length);
  const hidden=team.filter(t=>/strategist/i.test(t.role)&&!strats.find(s=>s.id===t.id)).map(t=>t.n);
  const ai=rvRows(D,"ai").map(r=>({n:String(rvS(r.n)||"").trim(),owner:rvAll(r.owner),cat:rvS(r.cat),status:rvS(r.status)||"Not started",due:rvDate(r.due),src:"ai"})).filter(x=>x.n&&!/^done$/i.test(x.status));
  const proj=rvRows(D,"proj").map(r=>({n:String(rvS(r.n)||"").trim(),sec:rvS(r.sec)||"Other",status:rvS(r.status)||"Not started",due:rvDate(r.due),owner:rvAll(r.owner),src:"tool"})).filter(x=>x.n&&!/^done$/i.test(x.status));
  ai.forEach(x=>x.grow=x.cat==="Sales"||RVGROW.test(x.n));proj.forEach(x=>x.grow=x.sec==="Course and offer");
  /* the client window: Needs Attention items (open and from the last 60 days), the last performance review, tasks, weekly followers */
  const needAll=rvRows(D,"need").map(r=>({item:String(rvS(r.item)||"").trim(),type:rvClean(rvS(r.type)),cids:rvIds(r.client),sids:rvIds(r.strat),done:rvS(r.done)===true,due:rvDate(r.due),flagged:rvDate(r.flagged),from:rvS(r.from),det:String(rvS(r.det)||"").trim()})).filter(x=>x.item);
  for(const c of clients){c.needAll=needAll.filter(x=>x.cids.includes(c.id));c.tasks=[];c.fw={}}
  const lines=v=>String(rvText(v)||"").split(/\n+/).map(x=>x.replace(/^\s*(?:[-•*]|\d+[.)])\s*/,"").trim()).filter(x=>x.length>3);
  for(const r of rvRows(D,"pr")){const c=find(rvIds(r.client)),d=rvDate(r.date);if(!c||!d||d>TODAY)continue;
    const p={date:d,actions:lines(r.actions),pending:lines(r.pending),agreed:lines(r.agreed)};if(!c.pr||d>c.pr.date)c.pr=p}
  const allTasks=rvRows(D,"tasks").map(r=>{const who=(Array.isArray(r.who)?r.who:[]).filter(u=>u&&u.id);return {id:r.id,n:String(rvS(r.n)||"").trim(),status:rvS(r.status)||"",who:who.map(u=>u.id),whoU:who,whoN:[...new Set(who.map(u=>first(u.name)))],due:rvDate(r.due),cids:rvIds(r.brand),pri:rvS(r.pri),area:rvClean(rvS(r.area)||""),dept:rvS(r.dept),created:rvDate(r.created)}}).filter(t=>t.n);
  const tasks=allTasks.filter(t=>!/^(done|locked)$/i.test(t.status));
  tasks.forEach(t=>{t.lead=RVLEADS.filter(L=>L.usr.some(u=>t.who.includes(u))).map(L=>L.n);t.cids.forEach(id=>{const c=byId[id];if(c)c.tasks.push(t)})});
  let fwUpto=null;
  for(const r of rvRows(D,"acct")){const c=find(rvIds(r.client)),d=rvDate(r.start),f=rvNum(r.fol);if(!c||!d||!f)continue;const w=rvMon(d),o=c.fwd||(c.fwd={});if(!o[w]||d>o[w].d)o[w]={d,f};if(!fwUpto||d>fwUpto)fwUpto=d}
  for(const c of clients){for(const w in c.fwd||{})c.fw[w]=c.fwd[w].f;
    /* last action plan: the audit sent to the strategist, else the last performance review */
    c.plan=c.audit&&c.audit.sent?{date:c.audit.sent,src:"Audit sent to "+(first(c.strat[0])||"the strategist")}:c.lastPr?{date:c.lastPr,src:"Last performance review"}:null;
    const sc=c.needAll.filter(x=>x.done&&/scripts/i.test(x.type)&&x.due&&x.due<=TODAY).sort((a,b)=>b.due.localeCompare(a.due))[0];
    c.scripts=sc?{date:sc.due,item:sc.item}:null;
    c.expect=c.audit&&c.audit.by&&c.audit.by>=dayMinus(14)?{date:c.audit.by,src:"From the audit"}:c.scripts?{date:new Date(Date.parse(c.scripts.date+"T00:00:00Z")+28*864e5).toISOString().slice(0,10),src:"Estimate: 28 days after the scripts",est:true}:null}
  allTasks.forEach(t=>{if(!t.lead)t.lead=RVLEADS.filter(L=>L.usr.some(u=>t.who.includes(u))).map(L=>L.n)});
  const leads=RVLEADS.map(L=>{const r=team.find(t=>t.id===L.roster)||{};const T=tasks.filter(t=>t.lead.includes(L.n));return {...L,role:r.role||"",perf:r.perf||null,tb:r.tb||null,id:L.roster,tasks:T,late:T.filter(t=>t.due&&t.due<TODAY)}});
  /* ReLearn: the podcast's own Task Manager and who is on the team */
  const rlEps=rvRows(D,"rleps").map(r=>({id:r.id,n:String(rvS(r.n)||"").trim(),rel:rvDate(r.rel)})).filter(x=>x.n).sort((a,b)=>String(b.rel||"9").localeCompare(String(a.rel||"9")));
  const rlTeam=rvRows(D,"rlteam").map(r=>({id:r.id,n:String(rvS(r.n)||"").trim(),role:rvS(r.role)||""})).filter(x=>x.n);
  const rlTasks=rvRows(D,"rltasks").map(r=>({id:r.id,n:String(rvS(r.n)||"").trim(),status:rvS(r.status)||"",owner:rvIds(r.owner),due:rvDate(r.due),pri:rvS(r.pri),area:rvClean(rvS(r.area)||""),eps:rvIds(r.ep)})).filter(t=>t.n);
  return {needAll,tasks,allTasks,rlTasks,rlTeam,rlEps,leads,fwUpto,clients,team,strats,hidden,need,inv,invOld,rev,cur,prev,last6,ai,proj,statsMonth,statsUpd,pmonths,pmFull,ext:clients.filter(c=>!c.own)};
}
const r0=ids=>ids.map(i=>({id:i}));
/* Monday of the week a date falls in, and the last n Mondays up to this week */
const rvMon=d=>{const t=Date.parse(d+"T00:00:00Z"),w=(new Date(t).getUTCDay()+6)%7;return new Date(t-w*864e5).toISOString().slice(0,10)};
const rvWeeks=n=>{const m=Date.parse(rvMon(TODAY)+"T00:00:00Z");return [...Array(n)].map((_,i)=>new Date(m-(n-1-i)*7*864e5).toISOString().slice(0,10))};
/* one small week-by-week chart: columns, or a line for running totals like followers */
function rvMini(title,sub,W8,vals,fmt,line){
  const have=vals.filter(v=>v!=null);
  if(!have.length)return `<div class="wow"><h4>${title}</h4><div class="emptychart sm">${sub}</div></div>`;
  const Wd=230,Ht=128,L=4,R=4,T=18,B=20,n=W8.length,step=(Wd-L-R)/n;
  let lo=line?Math.min(...have):0,hi=Math.max(...have);if(line){const pad=(hi-lo)*.25||Math.max(1,hi*.02);lo=Math.max(0,lo-pad);hi=hi+pad}if(hi<=lo)hi=lo+1;
  const y=v=>T+(hi-v)/(hi-lo)*(Ht-T-B),cx=i=>L+step*i+step/2;
  let g=W8.map((w,i)=>`<text x="${cx(i)}" y="${Ht-6}" text-anchor="middle" font-size="9.5" fill="${css("--muted")}">${+w.slice(8,10)}${i===0||w.slice(5,7)!==W8[i-1].slice(5,7)?" "+MON[+w.slice(5,7)-1]:""}</text>`).join("");
  if(line){const P=vals.map((v,i)=>v==null?null:[cx(i),y(v)]).filter(Boolean);g+=`<polyline points="${P.map(p=>p.map(z=>z.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${css("--accent")}" stroke-width="2.5" stroke-linejoin="round"/>`+P.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${css("--accent")}" stroke="${css("--panel")}" stroke-width="1.5"/>`).join("")}
  else g+=vals.map((v,i)=>v==null?"":`<rect x="${cx(i)-step*.3}" y="${y(v)}" width="${step*.6}" height="${Math.max(1,y(lo)-y(v))}" rx="3" fill="${css("--accent")}" opacity="${i===n-1?1:.75}"/>`).join("");
  const idx=vals.map((v,i)=>v==null?-1:i).filter(i=>i>=0),lab=line?[idx[0],idx[idx.length-1]]:idx;
  g+=vals.map((v,i)=>v==null||!lab.includes(i)?"":`<text x="${cx(i)}" y="${y(v)-7}" text-anchor="${line&&i===idx[0]&&idx.length>1?"start":line&&i===idx[idx.length-1]&&idx.length>1?"end":"middle"}" font-size="9.5" font-weight="${i===idx[idx.length-1]?700:500}" fill="${css("--ink")}">${fmt(v)}</text>`).join("");
  return `<div class="wow"><h4>${title}</h4><svg viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="${title}: ${W8.map((w,i)=>`week of ${w} ${vals[i]==null?"no data":fmt(vals[i])}`).join(", ")}">${g}</svg><p class="pm">${sub}</p></div>`}
function rvWoW(c){
  const W8=rvWeeks(8),cm=W8.map(w=>c.pw&&c.pw[w]&&c.pw[w].cn?c.pw[w].cs/c.pw[w].cn:null),fo=W8.map(w=>c.fw&&c.fw[w]!=null?c.fw[w]:null);
  const loading=RVX.postsLater||RVX.postsLoading;
  return `<div class="pblock"><h3>Week over week</h3><div class="wow2">${rvMini("Followers",loading?"Loading follower numbers…":fo.some(v=>v!=null)?`Account Stats, last daily number each week${RVX.M.fwUpto?`, up to ${fmtD(RVX.M.fwUpto)}`:""}.`:"No daily follower numbers in Account Stats for this account.",W8,fo,v=>k(Math.round(v)),true)}${rvMini("Average comments per post",loading?"Loading Instagram posts…":cm.some(v=>v!=null)?"Instagram posts in Posts Stats, by the week they went out.":"No Instagram posts collected for this account in the last 8 weeks.",W8,cm,v=>f1(v).replace(/\.0$/,""),false)}</div></div>`}

/* why each client is Act / Watch / Leave alone: each reason says who acts (the strategist through Sarah, or Karen for finance and renewals) */
/* Act = Kash needs to step in: a clear risk of losing the client or a clearly mishandled account. Watch = the team or finance has it (performance, invoices, renewals, open audits). Leave alone = nothing beyond routine (content running low, a quiet client). Each reason says who acts: the strategist through Sarah, Gretta for invoices, Karen for renewals. "sarah" marks the reasons that justify asking Sarah: risk of leaving, a clear drop month on month, or mishandling. */
function rvReasons(c){
  const R=[],add=(lvl,short,t,ask,to="team",sarah=false)=>R.push({lvl,short,t,ask,to,sarah});
  const days=d=>dayDiff(d,TODAY);
  if(c.rol==="High")add("act","High risk of leaving",`Risk of leaving is High (set by the strategist)${c.ctype?`; churn type: ${c.ctype}`:""}.`,"Call the client this week and agree a plan to keep them","sarah",true);
  if(c.sent==="Very Bad")add("act","Client unhappy",`Client sentiment is Very Bad.`,"Find out what went wrong and fix it with the client this week","sarah",true);
  if(c.audit){const a=c.audit,late=a.by?days(a.by):null;
    if(late!=null&&late<-7)add("act",`Audit ignored ${-late} days`,`Sarah audited this account on ${fmtD(a.date)} (${String(a.why||"").toLowerCase()}). Results were due ${fmtD(a.by)} and it's still at "${a.stage}".`,"Put the audit's action points live and log what changed","sarah",true);
    else if(late!=null&&late<0)add("watch","Audit results overdue",`Sarah audited this account on ${fmtD(a.date)} (${String(a.why||"").toLowerCase()}). Results were due ${fmtD(a.by)}; still at "${a.stage}".`,"Log what changed since the audit so Sarah can reassess");
    else add("watch",late===0?"Audit results due today":"In an audit",`Sarah audited this account on ${fmtD(a.date)} (${String(a.why||"").toLowerCase()}). Results due ${a.by?fmtD(a.by):"–"}.`,`Make sure the audit's action points are live${a.by?" by "+fmtD(a.by):""}`)}
  /* content: running low is routine; already out for over a week is mishandling. Graphics only count when the Needs Attention automation flags them (some clients have old graphics dates for a format they no longer use) */
  const outs=[];
  if(c.vlpd)outs.push({fmt:"videos",d:c.vlpd});
  for(const x of c.need.filter(x=>x.type==="Running out of content")){const m=/(videos?|reels?|graphics?)\s+(?:ran|run)s?\s+out\s+(\d{1,2}\s+[A-Z][a-z]{2})/i.exec(x.item);if(!m)continue;
    const fmt=/graphic/i.test(m[1])?"graphics":"videos";if(outs.some(o=>o.fmt===fmt))continue;const dt=fmt==="graphics"&&c.glpd?c.glpd:rvParseDay(m[2]);if(dt)outs.push({fmt,d:dt})}
  for(const o of outs){const d=days(o.d),F=o.fmt.charAt(0).toUpperCase()+o.fmt.slice(1);
    if(d<-7)add("act",`No new ${o.fmt} for ${-d} days`,`${F} ran out on ${fmtD(o.d)}, ${-d} days ago, and nothing new is scheduled.`,`Get new ${o.fmt} scheduled today`,"sarah",true);
    else if(d<0)add("watch",`${F} ran out ${fmtD(o.d)}`,`${F} ran out on ${fmtD(o.d)}.`,`Get new ${o.fmt} scheduled this week`);
    else if(d<=7)add("info",`${F} run out ${fmtD(o.d)}`,`${F} run out on ${fmtD(o.d)}.`,`Script the next ${o.fmt} before ${fmtD(o.d)}`)}
  /* performance */
  if(c.s&&c.s.vchg!=null&&c.s.vchg<=-0.25)add("watch",`Views down ${Math.abs(Math.round(c.s.vchg*100))}%`,`Instagram views fell ${Math.abs(Math.round(c.s.vchg*100))}% vs the month before (${k(c.s.views)} vs ${k(c.s.prev)}).`,"Find out why views fell and change the next batch","sarah",true);
  if(c.res==="Critical")add("watch","Results critical","Performance status (results) is Critical.","Change the content plan to lift results");
  if(c.health==="Critical")add("watch","Health critical","Health is Critical in Client Admin.","Explain what is behind the Critical health and the fix");
  else if(c.health==="Fragile")add("watch","Health fragile","Health is Fragile in Client Admin.","Check in with the client before it slips");
  if(c.rol==="Medium")add("watch","Medium risk of leaving","Risk of leaving is Medium.","Keep the client close this month");
  /* money */
  const pd=c.inv.filter(i=>i.status==="Past Due");
  if(pd.length){const o=pd.map(i=>i.due).filter(Boolean).sort()[0],amt=gbp(pd.reduce((a,i)=>a+i.amt,0));add("watch",`${pd.length} invoice${pd.length>1?"s":""} past due`,`${pd.length} invoice${pd.length>1?"s":""} past due (${amt})${o?`, oldest due ${fmtDY(o)}`:""}.`,`Chase the ${pd.length} past-due invoice${pd.length>1?"s":""} (${amt}) or agree a payment date`,"gretta")}
  if(c.renew){const r=c.renew,d=days(r.end),signed=r.contract==="Signed";
    if(d<0&&(r.status==="In Negotiation"||r.contract==="Sent"))add("watch",`Plan ended ${fmtD(r.end)}`,`Plan ended ${fmtD(r.end)} and the renewal isn't signed (${String(r.status||r.contract).toLowerCase()}).`,"Close the renewal or confirm the end date this week","karen");
    else if(d<0)add("watch","Renewal not logged",`Plan end date in Sales & Renewals was ${fmtDY(r.end)}.`,"Log the renewal (or the end) in Sales & Renewals","karen");
    else if(d<=30&&!signed)add("watch",`Plan ends ${fmtD(r.end)}`,`Plan ends ${fmtD(r.end)}; renewal ${r.contract?String(r.contract).toLowerCase():"not started"}.`,`Get the renewal signed before ${fmtD(r.end)}`,"karen")}
  /* communication */
  const sl=c.need.filter(x=>x.type==="Slack");
  if(sl.length){const fin=sl.filter(x=>/charg|bill|invoice|pay|refund|price/i.test(x.item+" "+x.det)),rest=sl.filter(x=>!fin.includes(x));
    if(rest.length)add("watch",`${rest.length} Slack message${rest.length>1?"s":""} waiting`,`Waiting for a reply on Slack: ${rest.map(x=>x.item).join("; ")}.`,`Reply on Slack today: ${rest.map(x=>x.item).join("; ")}`);
    if(fin.length)add("watch","Billing question on Slack",`Billing question waiting on Slack: ${fin.map(x=>x.item).join("; ")}.`,`Answer the billing question: ${fin.map(x=>x.item).join("; ")}`,"gretta")}
  if(c.sent==="Unresponsive"||c.sent==="Improve")add("info",c.sent==="Unresponsive"?"Client quiet":"Sentiment: improve",`Client sentiment is ${c.sent}.`,c.sent==="Unresponsive"?"Get a reply from the client this week":"Ask the client what would make it better");
  const o={act:0,watch:1,info:2};return R.sort((a,b)=>o[a.lvl]-o[b.lvl]);
}
const rvParseDay=s=>{const m=/(\d{1,2})\s+([A-Z][a-z]{2})/.exec(s||"");if(!m)return null;const mi=MON.indexOf(m[2]);if(mi<0)return null;let y=+TODAY.slice(0,4);const d=`${y}-${String(mi+1).padStart(2,"0")}-${m[1].padStart(2,"0")}`;return dayDiff(d,TODAY)>180?`${y-1}${d.slice(4)}`:d};
/* ---------- render ---------- */
function rvRestricted(what){return `<div class="restrict">🔒 Restricted: ${what}<span>Revenue, profit, costs and invoices are only shown to Karen, Sarah and Jennifer.</span></div>`}
function rvGate(html){$("rvGate").innerHTML=html;$("rvGate").hidden=!html;$("rvBody").hidden=!!html||!RVX.M}
function rvRender(){const M=RVX.M;if(!M)return;rvGate("");rvKpis(M);rvChart(M);rvInvoices(M);rvCompare();rvTable();rvTeamBrief(M);rvHome();if(typeof pmRender==="function"&&!$("v-pm").hidden)pmRender();if(peekKind&&/^rv/.test(peekKind))renderPeek()}

function rvKpis(M){
  const lock=lab=>`<div class="kpi lockd"><span class="lab">${lab}</span><span class="val">🔒 Restricted</span><span class="sub">Only shown to Karen, Sarah and Jennifer.</span></div>`;
  const E=M.ext,c=M.cur,p=M.prev,ms=c?mshort(c.end):"";
  const withS=E.filter(x=>x.s&&x.s.vchg!=null),up=withS.filter(x=>x.s.vchg>0);
  let h="";
  if(RVX.money&&c){
    h+=`<div class="kpi"><span class="lab">Projected profit MTD</span><span class="val big" style="color:${c.profit<0?"var(--act)":"var(--ok)"}">${gbp(c.profit)}</span><span class="sub">${c.status==="Actual"?"Actual":"Forecast"} for ${ms} · revenue <b>${gbp(c.rev)}</b>, costs <b>${gbp(c.costs)}</b></span></div>`;
    const g=p&&p.profit?(c.profit-p.profit)/Math.abs(p.profit):null;
    h+=`<div class="kpi"><span class="lab">Profit growth MoM</span><span class="val big" style="color:${g==null?"var(--ink)":g<0?"var(--act)":"var(--ok)"}">${g==null?"–":spc(g)}</span><span class="sub">${p?`vs ${mshort(p.end)} (<b>${gbp(p.profit)}</b>): ${c.profit<p.profit?"down":"up"} <b>${gbp(Math.abs(c.profit-p.profit))}</b>`:"No previous month"}</span></div>`;
  }else if(RVX.money)h+=`<div class="kpi"><span class="lab">Projected profit MTD</span><span class="val">–</span><span class="sub">No ${MON[+TODAY.slice(5,7)-1]} row in the Revenue tracker</span></div><div class="kpi"><span class="lab">Profit growth MoM</span><span class="val">–</span><span class="sub">Needs this month's row</span></div>`;
  else h+=lock("Projected profit MTD")+lock("Profit growth MoM");
  if(RVX.money){const pd=M.inv.filter(i=>i.status==="Past Due"),od=M.inv.filter(i=>i.status==="To Collect"&&i.due&&i.due<TODAY);
    h+=`<div class="kpi"><span class="lab">Past-due invoices</span><span class="val big" style="color:${pd.length?"var(--act)":"var(--ok)"}">${pd.length}</span><span class="sub"><b>${gbp(pd.reduce((a,i)=>a+i.amt,0))}</b>${od.length?` · plus <b>${od.length}</b> overdue still marked To Collect`:""}</span></div>`}
  else h+=lock("Past-due invoices");
  h+=`<div class="kpi"><span class="lab">Active clients</span><span class="val big">${E.length}</span><span class="sub">${RVX.money&&c&&c.paying!=null?`<b>${c.paying}</b> paying this month · `:""}not counting ${M.clients.length-E.length} own accounts</span></div>`;
  h+=`<div class="kpi"><span class="lab">Getting results</span><span class="val big" style="color:${up.length*2>=withS.length?"var(--ok)":"var(--act)"}">${up.length} <small>of ${withS.length}</small></span><span class="sub">Instagram views up vs the month before${M.statsMonth?` (${esc(M.statsMonth)})`:""}${E.length>withS.length?` · ${E.length-withS.length} without stats`:""}</span></div>`;
  if(RVX.money&&c)h+=`<div class="kpi"><span class="lab">Projected churn</span><span class="val big" style="color:${c.churn?"var(--act)":"var(--ok)"}">${c.churn??0}</span><span class="sub">${c.churned.length?esc(c.churned.join(", ")):"clients"} in ${ms}'s ${c.status==="Actual"?"actuals":"forecast"}</span></div>`;
  else if(RVX.money)h+=`<div class="kpi"><span class="lab">Projected churn</span><span class="val">–</span><span class="sub">Needs this month's row</span></div>`;
  else h+=lock("Projected churn");
  $("rvKpis").innerHTML=h;
  $("rvMeta").textContent=`${E.length} clients · ${M.strats.length} strategists · live from Airtable`;
}

const niceStep=x=>{const p=10**Math.floor(Math.log10(x||1)),m=x/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p};
function rvChart(M){
  const box=$("rvChartBox");
  if(!RVX.money){box.innerHTML=rvRestricted("profit, costs and revenue");return}
  const L6=M.last6;if(!L6.length){box.innerHTML=`<div class="emptychart">No months in the Revenue tracker yet.</div>`;return}
  const W=560,H=250,Lm=50,Rm=10,T=16,Bm=30,n=L6.length,bw=(W-Lm-Rm)/n,bar=Math.min(24,bw*.3);
  const vals=L6.flatMap(m=>[m.rev||0,m.costs||0,m.profit||0]);
  let lo=Math.min(0,...vals),hi=Math.max(1,...vals);const st=niceStep((hi-lo)/4);lo=Math.floor(lo/st)*st;hi=Math.ceil(hi*1.04/st)*st;
  const y=v=>T+(hi-v)/(hi-lo)*(H-T-Bm),y0=y(0),cx=i=>Lm+i*bw+bw/2;
  const top=(x,w,v)=>{const yy=y(v),r=Math.min(4,w/2,Math.max(0,y0-yy));return `M${x},${y0}V${yy+r}Q${x},${yy} ${x+r},${yy}H${x+w-r}Q${x+w},${yy} ${x+w},${yy+r}V${y0}Z`};
  let g="";
  for(let v=lo;v<=hi+1e-6;v+=st)g+=`<line x1="${Lm}" x2="${W-Rm}" y1="${y(v)}" y2="${y(v)}" stroke="${css("--line")}"/><text x="${Lm-7}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="${css("--muted")}">${v?gbp(v):"£0"}</text>`;
  L6.forEach((m,i)=>{const fc=m.status!=="Actual",op=fc?' opacity=".5"':"";
    g+=`<path d="${top(cx(i)-bar-1,bar,Math.max(0,m.rev||0))}" fill="${css("--s1")}"${op}/><path d="${top(cx(i)+1,bar,Math.max(0,m.costs||0))}" fill="${css("--s2")}"${op}/>`;
    g+=`<text x="${cx(i)}" y="${H-9}" text-anchor="middle" font-size="11" fill="${css("--muted")}">${mshort(m.end)}${fc?" forecast":""}</text>`});
  g+=`<line x1="${Lm}" x2="${W-Rm}" y1="${y0}" y2="${y0}" stroke="${css("--muted")}"/>`;
  g+=`<polyline points="${L6.map((m,i)=>`${cx(i)},${y(m.profit||0)}`).join(" ")}" fill="none" stroke="${css("--ink")}" stroke-width="2" stroke-linejoin="round"/>`;
  g+=L6.map((m,i)=>`<circle cx="${cx(i)}" cy="${y(m.profit||0)}" r="4.5" fill="${css("--ink")}" stroke="${css("--panel")}" stroke-width="2"/>`).join("");
  [0,n-1].filter((v,i,a)=>a.indexOf(v)===i).forEach(i=>{const m=L6[i],yy=y(m.profit||0);g+=`<text x="${Math.min(Math.max(cx(i),Lm+24),W-Rm-24)}" y="${(m.profit||0)<0?yy+17:yy-9}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${css("--ink")}" stroke="${css("--panel")}" stroke-width="3" paint-order="stroke">${gbp(m.profit)}</text>`});
  g+=L6.map((m,i)=>`<rect class="hit" data-i="${i}" data-rvm="${m.end}" x="${Lm+i*bw}" y="${T}" width="${bw}" height="${H-T-Bm}" fill="transparent" tabindex="0" aria-label="${esc(m.month)}: revenue ${gbp(m.rev)}, costs ${gbp(m.costs)}, profit ${gbp(m.profit)}"/>`).join("");
  const rows=L6.map(m=>`<tr class="click" data-rvm="${m.end}"><td>${mshort(m.end)} ${m.end.slice(2,4)}${m.status!=="Actual"?' <span class="pend">forecast</span>':""}</td><td class="num">${gbp(m.rev)}</td><td class="num">${gbp(m.costs)}</td><td><span class="v ${(m.profit||0)<0?"r":"g"}">${gbp(m.profit)}</span></td></tr>`).join("");
  box.innerHTML=`<div class="lg"><span><i style="background:var(--s1)"></i>Revenue</span><span><i style="background:var(--s2)"></i>Costs</span><span><i class="ln"></i>Profit</span><span>Paler bars: forecast</span><span>Click a month for comments and actions</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue, costs and profit by month">${g}</svg><div class="tip" id="rvTip" hidden></div><table class="mini"><thead><tr><th>Month</th><th>Revenue</th><th>Costs</th><th>Profit</th></tr></thead><tbody>${rows}</tbody></table>`;
  const tip=$("rvTip");
  box.querySelectorAll(".hit").forEach(r=>{const show=()=>{const m=L6[+r.dataset.i],bb=r.getBoundingClientRect(),pb=box.getBoundingClientRect();
      tip.innerHTML=`<b>${esc(m.month)}${m.status!=="Actual"?" · forecast":""}</b><div><span>Revenue</span><span>${gbp(m.rev)}</span></div><div><span>Costs</span><span>${gbp(m.costs)}</span></div><div><span>Profit</span><span>${gbp(m.profit)}</span></div>${m.col!=null?`<div><span>Collected so far</span><span>${gbp(m.col)}</span></div>`:""}`;
      tip.hidden=false;const x=bb.left-pb.left+bb.width/2,w=tip.offsetWidth;tip.style.left=Math.max(6,Math.min(pb.width-w-6,x-w/2))+"px"};
    r.onmouseenter=show;r.onfocus=show;r.onmouseleave=()=>{tip.hidden=true};r.onblur=()=>{tip.hidden=true}});
}

function rvInvoices(M){
  if(!RVX.money){$("rvInv").innerHTML=rvRestricted("invoices");$("rvInvMeta").textContent="";return}
  const by=(a,b)=>String(a.due).localeCompare(String(b.due)),sum=a=>a.reduce((s,i)=>s+i.amt,0);
  const pd=M.inv.filter(i=>i.status==="Past Due").sort(by),od=M.inv.filter(i=>i.status==="To Collect"&&i.due&&i.due<TODAY).sort(by);
  const row=(i,late)=>`<div class="ivr"><span class="nm">${esc(i.client)}</span><span class="dt ${late?"lt":""}">${late?`Due ${fmtDY(i.due)} · ${dayDiff(TODAY,i.due)}d late`:`Due ${fmtD(i.due)}`}</span><b>${gbp(i.amt)}</b></div>`;
  const grp=(t,a,late)=>a.length?`<div class="ivg"><span>${t} · ${a.length}</span><b>${gbp(sum(a))}</b></div>${a.map(i=>row(i,late)).join("")}`:"";
  const old=od.concat(pd).filter(i=>i.due&&dayDiff(TODAY,i.due)>365).length;
  const msg=`Hi Gretta, on past-due invoices:\n${pd.map(i=>`• ${i.client}: ${gbp(i.amt)}, due ${fmtDY(i.due)} (${dayDiff(TODAY,i.due)} days late)`).join("\n")}${od.length?`\n• Also ${od.length} past their due date but still marked To Collect (${gbp(sum(od))}): ${[...new Set(od.map(i=>i.client))].join(", ")}`:""}\nCan you chase these and let me know when each will be paid, or which to write off?\nThanks, Kash`;
  $("rvInv").innerHTML=`<div class="ivbox">${grp("Past due",pd,1)}${grp("Overdue, still marked To Collect",od,1)}${pd.length+od.length?"":`<div class="ivmore">Nothing late.</div>`}${M.invOld.length?`<div class="ivmore">${M.invOld.length} older invoices due before ${fmtDY(RVINV_FROM)} are hidden (${gbp(sum(M.invOld))}).</div>`:""}
    <div class="ivfoot">${pd.length||od.length?`<button class="coach" type="button" id="rvInvMsg">Message Gretta</button>`:""}${rvInvMsg?`<div class="note" id="rvInvText">${esc(msg)}</div><button class="copy" type="button" id="rvInvCopy">Copy message</button>`:""}</div></div>`;
  $("rvInvMeta").innerHTML=`<b>${gbp(sum(pd)+sum(od))}</b> across ${pd.length+od.length}`;
  if($("rvInvMsg"))$("rvInvMsg").onclick=()=>{rvInvMsg=!rvInvMsg;rvInvoices(M)};
  const cp=$("rvInvCopy");if(cp)cp.onclick=()=>rvCopy("rvInvText",cp);
}
function rvCopy(id,btn){const t=$(id).textContent;navigator.clipboard.writeText(t).then(()=>{btn.textContent="Copied"}).catch(()=>{const r=document.createRange();r.selectNodeContents($(id));const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent="Selected. Press copy"})}

const RVORD={act:0,watch:1,ok:2};
function rvRail(){
  const M=RVX.M;if(!M||!$("rvRail"))return;
  const L=[...M.ext].sort((a,b)=>RVORD[a.st]-RVORD[b.st]||b.R.length-a.R.length||a.n.localeCompare(b.n));
  $("rvRail").innerHTML=L.map(c=>`<button class="sc ${c.st}" type="button" data-rvc="${c.id}" aria-expanded="${rvOpen===c.id}"><span class="st ${SC[c.st]}" style="justify-self:start">${{act:"Act",watch:"Watch",ok:"Leave"}[c.st]}</span><span class="d">${esc(first(c.strat[0])||"–")}</span><span class="n">${esc(c.n)}</span><span class="w">${esc(c.R[0]?c.R[0].short:"Nothing flagged")}</span></button>`).join("");
  const n=s=>L.filter(c=>c.st===s).length;
  $("rvRailMeta").innerHTML=`<span class="st s-act">${n("act")} act</span> <span class="st s-watch">${n("watch")} watch</span> <span class="st s-ok">${n("ok")} leave alone</span>`;
}
function rvClosed(){if(rvOpen){rvOpen=null;rvRail()}}

let RVTF={st:"all",strat:"all",grp:"none"};
const RVGRP={none:null,st:c=>SL[c.st],strat:c=>c.strat[0]||"No strategist",tier:c=>c.tier||"No tier"};
const RVCOLS=[["n","Client"],["strat","Strategist"],["fol","Followers"],["newf","New"],["fg","Growth"],["views","Views"],["vchg","vs prior"],["reach","Reach"],["eng","Engagements"],["er","Eng. rate"],["visits","Visits"],["posts","Posts"]];
function rvTable(){
  const M=RVX.M;if(!M)return;
  const val=(c,key)=>key==="n"?c.n:key==="strat"?(c.strat[0]||""):c.s?c.s[key]:null;
  const strats=[...new Set(M.ext.map(c=>c.strat[0]).filter(Boolean))].sort();
  const sel=(id,lab,v,opts)=>`<label class="vh" for="${id}">${lab}</label><select id="${id}" class="mini">${opts.map(([k2,l])=>`<option value="${k2}"${k2===v?" selected":""}>${esc(l)}</option>`).join("")}</select>`;
  $("rvTblCtl").innerHTML=`<span class="pm">Show</span>${sel("rvFSt","Status",RVTF.st,[["all","All statuses"],["act","Act"],["watch","Watch"],["ok","Leave alone"]])}${sel("rvFStr","Strategist",RVTF.strat,[["all","All strategists"],...strats.map(x=>[x,x])])}<span class="pm" style="margin-left:8px">Group by</span>${sel("rvFGrp","Group by",RVTF.grp,[["none","Nothing"],["st","Status"],["strat","Strategist"],["tier","Tier"]])}`;
  $("rvFSt").onchange=e=>{RVTF.st=e.target.value;rvTable()};$("rvFStr").onchange=e=>{RVTF.strat=e.target.value;rvTable()};$("rvFGrp").onchange=e=>{RVTF.grp=e.target.value;rvTable()};
  const rows=[...M.ext].filter(c=>(RVTF.st==="all"||c.st===RVTF.st)&&(RVTF.strat==="all"||c.strat[0]===RVTF.strat)).sort((a,b)=>{const A=val(a,rvSort),B=val(b,rvSort);if(A==null&&B==null)return a.n.localeCompare(b.n);if(A==null)return 1;if(B==null)return -1;const x=typeof A==="string"?A.localeCompare(B):A-B;return rvDir==="asc"?x:-x});
  const num=(c,key)=>c.s&&c.s[key]!=null?k(c.s[key]):`<span class="pend">–</span>`;
  const chg=(v,f)=>v==null?`<span class="pend">–</span>`:`<span class="v ${v>0?"g":v<0?"r":"p"}">${f(v)}</span>`;
  const tr=c=>`<tr class="click" data-rvc="${c.id}" tabindex="0"><td><span class="st ${SC[c.st]}" style="margin-right:6px">${{act:"Act",watch:"Watch",ok:"Leave"}[c.st]}</span><b>${esc(c.n)}</b>${c.ig?` <a class="clink" style="margin-left:6px;font-size:12px" href="${esc(c.ig)}" target="_blank" rel="noopener">IG ↗</a>`:""}</td><td style="text-align:left">${esc(c.strat.map(first).join(", ")||"–")}</td><td class="num">${num(c,"fol")}</td><td class="num">${num(c,"newf")}</td><td>${chg(c.s&&c.s.fg,pc1)}</td><td class="num">${num(c,"views")}</td><td>${chg(c.s&&c.s.vchg,spc)}</td><td class="num">${num(c,"reach")}</td><td class="num">${num(c,"eng")}</td><td class="num">${c.s&&c.s.er!=null?pc1(c.s.er):`<span class="pend">–</span>`}</td><td class="num">${num(c,"visits")}</td><td class="num">${num(c,"posts")}</td></tr>`;
  const g=RVGRP[RVTF.grp];let body="";
  if(g){const G={};rows.forEach(c=>{(G[g(c)]=G[g(c)]||[]).push(c)});const keys=Object.keys(G).sort((a,b)=>RVTF.grp==="st"?["Act","Watch","Leave alone"].indexOf(a)-["Act","Watch","Leave alone"].indexOf(b):a.localeCompare(b));
    body=keys.map(key=>`<tr class="grp"><td colspan="${RVCOLS.length}">${esc(key)} <span>${G[key].length}</span></td></tr>${G[key].map(tr).join("")}`).join("")}
  else body=rows.map(tr).join("");
  $("rvTbl").innerHTML=`<thead><tr>${RVCOLS.map(([key,l])=>`<th ${rvSort===key?`aria-sort="${rvDir==="asc"?"ascending":"descending"}"`:""}><button type="button" data-rvsort="${key}">${l}</button></th>`).join("")}</tr></thead><tbody>${body||`<tr><td colspan="${RVCOLS.length}" class="pm" style="text-align:left">No clients match.</td></tr>`}</tbody>`;
  const n=s=>M.ext.filter(c=>c.st===s).length;
  $("rvTblMeta").innerHTML=`<span class="st s-act">${n("act")} act</span> <span class="st s-watch">${n("watch")} watch</span> <span class="st s-ok">${n("ok")} leave alone</span> <span>Instagram${M.statsMonth?", "+esc(M.statsMonth):""} · click a client to open it</span>`;
}

const RVGROUPS=[["Good","Recognise","s-ok","doing well"],["To Improve","Coach","s-watch","needs support"],["Critical","Watchlist","s-act","at risk"]];
const rvGroup=s=>RVGROUPS.find(g=>g[0]===s.perf)||RVGROUPS[1];
const rvTrend=p=>p==="Good"?"t-up":p==="Critical"?"t-down":"t-flat";


function rvHome(){const el=$("rvHomeLine");if(!el)return;const M=RVX.M;
  if(!M){el.textContent=RVX.state==="busy"?"Loading…":RVX.err||"Not loaded";return}
  const n=s=>M.ext.filter(c=>c.st===s).length,pd=M.inv.filter(i=>i.status==="Past Due").length;
  el.innerHTML=`<span class="st s-act">${n("act")} act</span> <span class="st s-watch">${n("watch")} watch</span>${RVX.money&&M.cur?` · ${mshort(M.cur.end)} profit ${gbp(M.cur.profit)}`:""}${RVX.money&&pd?` · ${pd} invoices past due`:""}`}

/* ---------- client comparison: picker, stat cards, and two charts (avg views and avg comments per Instagram post, by month) against every other client ---------- */
let rvSel=null;
const rvMed=a=>{const s=a.filter(x=>x!=null).sort((x,y)=>x-y);return s.length?(s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2):null};
const rvRank=(L,c,get)=>{const v=get(c);if(v==null)return null;const W=L.filter(x=>get(x)!=null);return {r:1+W.filter(x=>get(x)>v).length,of:W.length}};
function rvCompare(){
  const M=RVX.M;if(!M)return;
  const E=[...M.ext].sort((a,b)=>a.n.localeCompare(b.n));
  if(!rvSel||!E.find(c=>c.id===rvSel)){const pick=[...M.ext].sort((a,b)=>RVORD[a.st]-RVORD[b.st])[0];rvSel=pick?pick.id:null}
  const c=E.find(x=>x.id===rvSel);if(!c)return;
  $("rvPick").innerHTML=E.map(x=>`<option value="${x.id}" ${x.id===rvSel?"selected":""}>${esc(x.n)}</option>`).join("");
  $("rvPick").onchange=ev=>{rvSel=ev.target.value;rvCompare();rvTable()};
  $("rvBlink").className="blink "+c.st;$("rvBlink").title=SL[c.st];
  $("rvPickMeta").textContent=`${SL[c.st]} · ${c.strat.join(", ")||"No strategist"}${c.tier?" · "+c.tier:""}`;
  const pm=M.pmFull,pl=pm?MON[+pm.slice(5,7)-1]:"",P=x=>x.pm&&pm?x.pm[pm]:null;
  const card=(lab,val,sub,cls)=>`<div class="fk ${cls||""}"><span>${lab}</span><b>${val}</b><i>${sub}</i></div>`;
  const rk=(get)=>{const r=rvRank(E,c,get);return r?`Rank <em>#${r.r}</em> of ${r.of}`:"No data"};
  const vs=(get,hi=true)=>{const v=get(c),m=rvMed(E.map(get));return v==null||m==null?"":(hi?v>=m:v<=m)?"g":"r"};
  const s=c.s||{},S=x=>x.s||{};
  const ago=d=>{const n=dayDiff(TODAY,d);return n===0?"today":n===1?"yesterday":n>0?n+" days ago":"in "+(-n)+" days"};
  const kc=(lab,o,sub,cls)=>`<div class="kd ${cls||""}"><span>${lab}</span><b>${o?fmtDY(o.date):"–"}</b><i>${sub}</i></div>`;
  const ex=c.expect,exCls=!ex?"":ex.date<TODAY?"past":dayDiff(ex.date,TODAY)<=7?"soon":"";
  $("rvKey3").innerHTML=kc("Last action plan implemented",c.plan,c.plan?`${esc(c.plan.src)} · ${ago(c.plan.date)}`:"No audit or performance review logged")+
    kc("Last scripts delivered",c.scripts,c.scripts?`${ago(c.scripts.date)}${c.script?" · scripting: "+esc(c.script):""}`:`No scripts delivery logged in Needs Attention${c.script?" · scripting: "+esc(c.script):""}`)+
    kc("Expect results by",ex,ex?`${esc(ex.src)}${ex.date<TODAY?" · date has passed":""}`:"Needs an audit or a scripts delivery date",exCls);
  $("rvFive").innerHTML=
    card("Followers",k(s.fol),rk(x=>S(x).fol))+
    card(`New followers${M.statsMonth?", "+M.statsMonth.split(" ")[0].slice(0,3):""}`,k(s.newf),s.fg!=null?`<em>${pc1(s.fg)}</em> growth`:"–",vs(x=>S(x).fg))+
    card("Views vs month before",s.vchg!=null?spc(s.vchg):"–",s.views!=null?`${k(s.views)} vs ${k(s.prev)}`:"No stats",s.vchg==null?"":s.vchg>0?"g":"r")+
    card(`Avg views per post, ${pl}`,P(c)?k(Math.round(P(c).v)):"–",P(c)?`Median <em>${k(Math.round(rvMed(E.map(x=>P(x)&&P(x).v))||0))}</em> · ${P(c).n} posts`:"No posts collected",vs(x=>P(x)&&P(x).v))+
    card(`Avg comments per post, ${pl}`,P(c)&&P(c).c!=null?f1(P(c).c).replace(/\.0$/,""):"–",P(c)?`Median <em>${f1(rvMed(E.map(x=>P(x)&&P(x).c))||0).replace(/\.0$/,"")}</em>`:"No posts collected",vs(x=>P(x)&&P(x).c))+
    card(`Posts${M.statsMonth?", "+M.statsMonth.split(" ")[0].slice(0,3):""}`,s.posts!=null?k(s.posts):"–",rk(x=>S(x).posts));
  rvLine("rvCmpV",E,c,"v","views");rvLine("rvCmpC",E,c,"c","comments");
  const none=RVX.postsLater||RVX.postsLoading?[]:E.filter(x=>!x.pm||!Object.keys(x.pm).length).map(x=>x.n);
  $("rvCmpNote").textContent=RVX.postsLater||RVX.postsLoading?"Loading Instagram posts from Posts Stats…":`Instagram posts in Posts Stats, by the month they went out${M.pmonths.length?`, ${MON[+M.pmonths[0].slice(5,7)-1]} to ${MON[+M.pmonths[M.pmonths.length-1].slice(5,7)-1]}`:""}. Grey lines are the other clients, the dashed line is the median. ${none.length?`No posts collected yet for ${none.join(", ")}.`:""}`;
}
function rvLine(el,E,c,key,label){
  const M=RVX.M,box=$(el),mo=M.pmonths;
  if(!mo.length){box.innerHTML=`<div class="emptychart">${RVX.postsLater||RVX.postsLoading?"Loading Instagram posts…":"No posts collected yet."}</div>`;return}
  const W=440,H=230,L=46,R=64,T=14,B=26,n=mo.length;
  const val=(x,m)=>x.pm&&x.pm[m]&&x.pm[m][key]!=null?x.pm[m][key]:null;
  const all=E.flatMap(x=>mo.map(m=>val(x,m))).filter(v=>v!=null&&v>0);
  if(!all.length){box.innerHTML=`<div class="emptychart">No ${label} data yet.</div>`;return}
  let lo=10**Math.floor(Math.log10(Math.min(...all))),hi=10**Math.ceil(Math.log10(Math.max(...all)));if(hi<=lo)hi=lo*10;
  const x=i=>L+(n===1?(W-L-R)/2:i/(n-1)*(W-L-R)),y=v=>T+(Math.log10(hi)-Math.log10(Math.max(lo,v)))/(Math.log10(hi)-Math.log10(lo))*(H-T-B);
  let g="";
  for(let v=lo;v<=hi*1.0001;v*=10)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${css("--line")}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="${css("--muted")}">${v<1?v:k(v)}</text>`;
  g+=mo.map((m,i)=>`<text x="${x(i)}" y="${H-7}" text-anchor="middle" font-size="11" fill="${css("--muted")}">${MON[+m.slice(5,7)-1]}${m===TODAY.slice(0,7)?" so far":""}</text>`).join("");
  const line=(pts,st)=>{const P=pts.map((v,i)=>v==null?null:[x(i),y(v)]),segs=[];let cur=[];P.forEach(p=>{if(p)cur.push(p);else if(cur.length){segs.push(cur);cur=[]}});if(cur.length)segs.push(cur);return segs.map(sg=>`<polyline points="${sg.map(p=>p.map(z=>z.toFixed(1)).join(",")).join(" ")}" fill="none" ${st}/>`).join("")};
  for(const o of E)if(o.id!==c.id)g+=line(mo.map(m=>val(o,m)),`stroke="${css("--grey-line")}" stroke-width="1.3" stroke-linejoin="round"`);
  const med=mo.map(m=>rvMed(E.map(o=>val(o,m))));
  g+=line(med,`stroke="${css("--ink")}" stroke-width="1.4" stroke-dasharray="5 4"`);
  const li2=med.map((v,i)=>v!=null?i:-1).filter(i=>i>=0).pop();if(li2!=null)g+=`<text x="${x(li2)+8}" y="${y(med[li2])+4}" font-size="11" fill="${css("--muted")}">median</text>`;
  const me=mo.map(m=>val(c,m));
  g+=line(me,`stroke="${css("--accent")}" stroke-width="3" stroke-linejoin="round"`);
  g+=me.map((v,i)=>v==null?"":`<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${css("--accent")}" stroke="${css("--panel")}" stroke-width="2"/>`).join("");
  const lastI=me.map((v,i)=>v!=null?i:-1).filter(i=>i>=0).pop();
  if(lastI!=null)g+=`<text x="${x(lastI)+8}" y="${y(me[lastI])-8}" font-size="12" font-weight="600" fill="${css("--accent")}" stroke="${css("--panel")}" stroke-width="3" paint-order="stroke">${key==="c"?f1(me[lastI]).replace(/\.0$/,""):k(Math.round(me[lastI]))}</text>`;
  else g+=`<text x="${(L+W-R)/2}" y="${T+26}" text-anchor="middle" font-size="13" font-weight="600" fill="${css("--accent")}">No posts collected for ${esc(c.n)}</text>`;
  g+=mo.map((m,i)=>`<rect class="hit" data-i="${i}" x="${x(i)-(W-L-R)/(2*Math.max(1,n-1))}" y="${T}" width="${(W-L-R)/Math.max(1,n-1)}" height="${H-T-B}" fill="transparent" tabindex="0"/>`).join("");
  box.innerHTML=`<div class="lg"><span><i style="background:var(--accent)"></i>${esc(c.n)}</span><span><i class="ln" style="background:none;border-top:2px dashed var(--ink);height:0"></i>Median</span><span><i style="background:var(--grey-line)"></i>Other clients</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Average ${label} per post by month, ${esc(c.n)} against other clients">${g}</svg><div class="tip" hidden></div>`;
  const tip=box.querySelector(".tip");
  box.querySelectorAll(".hit").forEach(r=>{const show=()=>{const i=+r.dataset.i,m=mo[i],v=me[i],bb=r.getBoundingClientRect(),pb=box.getBoundingClientRect(),f=z=>z==null?"–":key==="c"?f1(z).replace(/\.0$/,""):k(Math.round(z));
      tip.innerHTML=`<b>${MON[+m.slice(5,7)-1]} ${m.slice(0,4)}</b><div><span>${esc(c.n)}</span><span>${f(v)}</span></div><div><span>Median client</span><span>${f(med[i])}</span></div><div><span>Posts</span><span>${c.pm&&c.pm[m]?c.pm[m].n:0}</span></div>`;
      tip.hidden=false;const xx=bb.left-pb.left+bb.width/2,w=tip.offsetWidth;tip.style.left=Math.max(6,Math.min(pb.width-w-6,xx-w/2))+"px"};
    r.onmouseenter=show;r.onfocus=show;r.onmouseleave=()=>{tip.hidden=true};r.onblur=()=>{tip.hidden=true}});
}

/* ---------- side panels ---------- */
const RVWHO={sarah:"Sarah",gretta:"Gretta",karen:"Karen"};
function rvMsgText(to,subject,lines){return `Hi ${to}, about ${subject}:\n${lines.map(x=>"• "+x).join("\n")}\nCan you send me the plan by Friday?\nThanks, Kash`}
/* L = {Sarah:[...], Gretta:[...], Karen:[...]}: one button per person who has something to do; the first is the dark button */
function rvBtns(subject,L){
  const who=Object.keys(L).filter(x=>L[x].length);if(!who.length)return "";
  return `<div class="rvbtns">${who.map((x,i)=>`<button class="coach${i?" alt":""}" type="button" data-rvmsg="${x}">Message ${x}</button>`).join("")}</div>${rvMsg&&L[rvMsg]&&L[rvMsg].length?`<div class="note" id="rvNote">${esc(rvMsgText(rvMsg,subject,L[rvMsg]))}</div><button class="copy" type="button" id="rvCopyBtn">Copy message</button>`:""}`}
function rvItem(x){return `<div class="oi"><span class="tagx">${esc(x.type||"Item")}</span><span>${esc(x.item)}${x.det&&x.det!==x.item?`<small>${esc(x.det)}</small>`:""}</span><span class="tagx ${x.due&&x.due<TODAY?"late":x.due===TODAY?"soon":""}">${x.due?(x.due===TODAY?"Today":fmtD(x.due)):"No date"}</span></div>`}
const rvCk=(lab,v,bad,good)=>`<div class="ck"><span>${lab}</span><b>${esc(v||"–")}</b><i class="${bad.includes(v)?"dn":good.includes(v)?"up":"eq"}">${bad.includes(v)?"Needs attention":good.includes(v)?"Fine":v?"Watch":"Not set"}</i></div>`;
function rvClientHTML(id){
  const M=RVX.M,c=M&&M.clients.find(x=>x.id===id);if(!c)return `<p class="pm">This client isn't in the latest data.</p>`;
  const who=first(c.strat[0])||"the strategist",real=c.R.filter(r=>r.lvl!=="info");
  const L={Sarah:c.askSarah?c.R.filter(r=>r.sarah).map(r=>r.ask):[],Gretta:real.filter(r=>r.to==="gretta").map(r=>r.ask),Karen:real.filter(r=>r.to==="karen").map(r=>r.ask)};
  const you=[];if(L.Sarah.length)you.push(`Ask Sarah for ${who}'s plan by Friday`);if(L.Gretta.length)you.push("Ask Gretta to chase the past-due invoices");if(L.Karen.length)you.push("Ask Karen where the renewal stands");if(!you.length)you.push(c.st==="ok"?"Nothing":"Nothing. The team has it");
  const s=c.s,ms=(lab,v,extra,cls="")=>`<div class="ms ${cls}"><span>${lab}</span><b>${v}</b>${extra?`<i>${extra}</i>`:""}</div>`,r=c.renew;
  return `<div class="ph"><h2>${esc(c.n)}</h2><span class="pm"><span class="st ${SC[c.st]}">${SL[c.st]}</span>&nbsp; ${esc(c.strat.join(", ")||"No strategist")} · AM ${esc(c.am.join(", ")||"–")}${c.tier?" · "+esc(c.tier):""}${c.term?" · "+esc(c.term):""}${c.months!=null?` · ${f1(c.months).replace(/\.0$/,"")} months`:""}</span>${c.ig?`<a class="clink" href="${esc(c.ig)}" target="_blank" rel="noopener">Instagram ↗</a>`:""}</div>
   <div class="pblock"><div class="checks four">${rvCk("Risk of leaving",c.rol,["High"],["Low"])}${rvCk("Sentiment",c.sent,["Very Bad"],["Good"])}${rvCk("Health",c.health,["Critical"],["Strong","Stable"])}${rvCk("Results",c.res,["Critical"],["Excellent","On Track"])}</div></div>
   <div class="pblock"><h3>Renewal${RVX.money?" and invoices":""}</h3><div class="kl"><div><span>Plan ends</span><b>${r?fmtDY(r.end):"–"}</b><em>${r?esc([r.contract,r.status].filter(Boolean).join(" · ")):"Not in Sales & Renewals"}</em></div>${c.ctype?`<div><span>Churn type</span><b>${esc(c.ctype)}</b><em></em></div>`:""}${c.dsat.length?`<div><span>Risk reasons</span><b>${esc(c.dsat.join(", "))}</b><em></em></div>`:""}${RVX.money?c.inv.sort((a,b)=>String(a.due).localeCompare(String(b.due))).map(i=>`<div><span>Invoice due ${fmtDY(i.due)}</span><b>${gbp(i.amt)}</b><em class="${i.status==="Past Due"?"need-act":""}">${esc(i.status)}</em></div>`).join(""):""}</div>${RVX.money&&!c.inv.length?`<p class="pm" style="margin-top:6px">No outstanding invoices.</p>`:""}</div>
   <div class="pblock"><h3>What's going on</h3>${c.R.length?`<ul>${c.R.map(x=>`<li${x.lvl==="info"?' class="pm"':""}>${esc(x.t)}</li>`).join("")}</ul>`:`<p>Nothing flagged in Airtable.</p>`}</div>
   <div class="pblock"><h3>Instagram${M.statsMonth?", "+esc(M.statsMonth):""}</h3>${s?`<div class="mstats">${ms("Followers",k(s.fol))}${ms("New followers",k(s.newf),s.fg!=null?pc1(s.fg)+" growth":"")}${ms("Views",k(s.views),s.prev!=null?"was "+k(s.prev):"",s.vchg==null?"":s.vchg>0?"g":"r")}${ms("vs month before",spc(s.vchg),"",s.vchg==null?"":s.vchg>0?"g":"r")}${ms("Reach",k(s.reach))}${ms("Engagement",k(s.eng),s.er!=null?pc1(s.er)+" rate":"")}${ms("Profile visits",k(s.visits))}${ms("Posts",k(s.posts))}</div>`:`<p class="pm">No Instagram stats in Client Stats for this account.</p>`}</div>
   ${rvWoW(c)}
   ${rvTasksHTML(c,L,who)}
   ${rvMotionHTML(c)}`;
}
/* ---------- tasks Kash gives the team, saved in Task Manager (Brand = the client) ---------- */
const RVT={added:[],done:{},busy:false,msg:{}};
const plusDays=n=>new Date(Date.parse(TODAY+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
function rvTaskRow(t){const late=t.due&&t.due<TODAY,lead=(t.lead&&t.lead[0])||(t.whoN||[])[0]||t.to||"";
  return `<div class="tk${t.state?" "+t.state:""}"><input type="checkbox" aria-label="Mark done: ${esc(t.n)}" ${t.id&&!t.state?`data-rvdone="${t.id}"`:"disabled"}><span class="tn">${esc(t.n)}${lead?`<small>${esc(lead)}</small>`:""}</span><span class="tagx ${late?"late":t.due===TODAY?"soon":""}">${t.state==="saving"?"Saving…":t.state==="failed"?"Couldn't save":t.due?(late?"Was due "+fmtD(t.due):"Due "+fmtD(t.due)):"No date"}</span></div>`}
function rvTasksHTML(c,L,who){
  const open=[...c.tasks.filter(t=>!RVT.done[t.id]),...RVT.added.filter(t=>t.cid===c.id&&!c.tasks.some(x=>x.id===t.id)&&!RVT.done[t.id])].sort((a,b)=>String(a.due||"9").localeCompare(String(b.due||"9")));
  const sug=[L.Sarah.length&&{n:`Send me ${who}'s plan for ${c.n} by Friday`,to:"Sarah"},L.Gretta.length&&{n:`Chase ${c.n}'s past-due invoices`,to:"Gretta"},L.Karen.length&&{n:`Update me on ${c.n}'s renewal`,to:"Karen"}].filter(x=>x&&!open.some(t=>t.n===x.n));
  const opt=v=>RVLEADS.map(L=>`<option value="${L.n}"${L.n===v?" selected":""}>${L.n}</option>`).join("");
  const m=RVT.msg[c.id];
  return `<div class="pblock"><h3>Tasks <span class="pm" style="font-weight:400">· assigned by Kash</span></h3>
    ${open.length?`<div class="tks">${open.map(rvTaskRow).join("")}</div>`:`<p class="pm">No open tasks for ${esc(c.n)}.</p>`}
    ${sug.length?`<div class="tsug"><span class="pm">Suggested</span>${sug.map((x,i)=>`<button type="button" class="chip" data-rvsug="${i}" data-n="${esc(x.n)}" data-to="${x.to}">+ ${esc(x.n)} <span class="pm">→ ${x.to}</span></button>`).join("")}</div>`:""}
    <form class="tform" data-rvtask="${c.id}"><label class="vh" for="rvTn">New task</label><input id="rvTn" name="n" maxlength="200" placeholder="Add a task for ${esc(first(c.n))}'s account" autocomplete="off" required>
      <label class="vh" for="rvTto">Assign to</label><select id="rvTto" name="to">${opt("Sarah")}</select><label class="vh" for="rvTdue">Due</label><input id="rvTdue" name="due" type="date" value="${plusDays(3)}"><button class="coach" type="submit" style="margin-top:0">Add task</button></form>
    <p class="pm tnote">${m?esc(m):"Saved in Task Manager, and the person gets a Slack message."}</p></div>`}
/* ---------- what the team is already doing for this client ---------- */
function rvMotionHTML(c){
  const nm=ids=>rvNames(ids.map(i=>({id:i}))).map(first).join(", ");
  const cut=s=>{s=rvClean(s);return s.length>150?s.slice(0,147).trim()+"…":s};
  const open=c.needAll.filter(x=>!x.done&&RVHUMAN.test(x.type)).sort((a,b)=>String(a.due||"9").localeCompare(String(b.due||"9"))).slice(0,6);
  const done=c.needAll.filter(x=>x.done&&RVHUMAN.test(x.type)&&(x.due||x.flagged||"")>=dayMinus(14)&&(x.due||x.flagged||"")<=TODAY).sort((a,b)=>String(b.due||b.flagged).localeCompare(String(a.due||a.flagged))).slice(0,4);
  const G=[];
  if(open.length)G.push(["Being worked on",open.map(x=>`${esc(cut(x.item))}<small>${esc([nm(x.sids)||"Team",x.type,x.due?(x.due<TODAY?"was due "+fmtD(x.due):"due "+fmtD(x.due)):""].filter(Boolean).join(" · "))}</small>`)]);
  if(done.length)G.push(["Done in the last 2 weeks",done.map(x=>`${esc(cut(x.item))}<small>${esc([nm(x.sids)||"Team",fmtD(x.due||x.flagged)].join(" · "))}</small>`)]);
  const pr=c.pr&&c.pr.date>=dayMinus(60)?c.pr:null;
  if(pr){const L=[...pr.agreed,...pr.actions,...pr.pending].filter((x,i,a)=>a.indexOf(x)===i).slice(0,5);if(L.length)G.push([`Agreed at the ${fmtD(pr.date)} performance review`,L.map(x=>esc(cut(x)))])}
  if(c.audit&&c.audit.stage!=="Reassessed")G.push(["Audit",[`${esc(c.audit.stage)}${c.audit.sent?" · sent to the strategist "+fmtD(c.audit.sent):""}${c.audit.by?` · results expected by ${fmtD(c.audit.by)}`:""}`]]);
  return `<div class="pblock"><h3>Already in motion</h3>${G.length?G.map(([h,L])=>`<h4 class="mh">${h}</h4><ul class="mot">${L.map(x=>`<li>${x}</li>`).join("")}</ul>`).join(""):`<p class="pm">Nothing logged for ${esc(c.n)} in the last 60 days.</p>`}
    <p class="pm" style="margin-top:8px;font-size:12px">From Airtable: Needs Attention items people logged (calls, Slack, requests, scripts), the last performance review and audits.</p></div>`}
/* save a task: Kash's link sends it to n8n; the Claude copy writes through the viewer's Airtable and Slack connectors */
async function rvTaskSave(t){
  const L=RVLEADS.find(x=>x.n===t.to)||RVLEADS[0],c=RVX.M.clients.find(x=>x.id===t.cid);
  if(window.claude?.use){const mcp=await window.claude.use("mcp");if(!mcp)throw new Error("no mcp");
    const r=await mcp.callTool("Airtable","create_records_for_table",{baseId:RVBASE,tableId:"tbl7gVj7Owmn5WBEW",records:[{fields:{fldffOVMyhrlvRBgZ:t.n,fldEzDPoSmPt87LOB:"To Do",fldvasDBd2huhGhO7:[{id:L.usr[0]}],flddWIYoBLbOIacl8:[t.cid],...(t.due?{fldsGUdBFJH5kL2iI:t.due}:{}),fldGm01KMjpTIR7Ht:"Added by Kash from the CEO dashboard."}}],typecast:true},{cache:false});
    const p=r.payload||r||{};const id=((p.records||[])[0]||{}).id;if(!id)throw new Error("not saved");
    mcp.callTool("Slack","slack_send_message",{channel_id:L.slack,message:`**Kash** added a task for you on **${c?c.n:"a client"}**: ${t.n}${t.due?` (due ${fmtD(t.due)})`:""}. It's in Task Manager.`}).catch(()=>{});return id}
  const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"task",client:t.cid,clientName:c?c.n:"",n:t.n,to:L.n,due:t.due||null}),cache:"no-store"});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok||!j.id)throw new Error(j.error||"not saved");return j.id}
async function rvTaskDone(id){
  if(window.claude?.use){const mcp=await window.claude.use("mcp");await mcp.callTool("Airtable","update_records_for_table",{baseId:RVBASE,tableId:"tbl7gVj7Owmn5WBEW",records:[{id,fields:{fldEzDPoSmPt87LOB:"Done"}}],typecast:true},{cache:false});return}
  const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"done",id}),cache:"no-store"});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error("not saved")}
/* ---------- the leads: Karen, Sarah, Gretta, Dom and Jennifer, with their open tasks ---------- */
function rvLeadCard(L){const t=L.tasks.length;return `<button class="pc lead" type="button" data-rvp="${L.id}"><div class="nm"><b>${esc(L.full)}</b><span>${esc(L.role||"")}</span></div><div class="score">${t}<small> open</small></div><div class="pcfoot"><span>${L.late.length?`<span class="need-act">${L.late.length} past due</span>`:"Nothing past due"}</span><span class="trend ${rvTrend(L.perf)}">${esc(L.perf||"Not rated")}</span></div></button>`}
function rvPersonHTML(id){
  const M=RVX.M,L=M&&M.leads.find(x=>x.id===id);if(!L)return `<p class="pm">Not in the latest data.</p>`;
  const T=[...L.tasks].sort((a,b)=>String(a.due||"9").localeCompare(String(b.due||"9"))),wk=plusDays(7);
  const grp=(h,a)=>a.length?`<h4 class="mh">${h} · ${a.length}</h4><div class="tks">${a.map(t=>`<div class="tk"><span class="tn">${esc(t.n)}${t.cids.length?`<small>${esc(t.cids.map(i=>RVN[i]).filter(Boolean).join(", "))}</small>`:""}</span><span class="tagx">${esc(t.status)}</span><span class="tagx ${t.due&&t.due<TODAY?"late":""}">${t.due?fmtD(t.due):"No date"}</span></div>`).join("")}</div>`:"";
  const st=M.strats.find(s=>/^dom/i.test(s.n)&&L.n==="Dom");
  return `<div class="ph"><h2>${esc(L.full)}</h2><span class="pm">${esc(L.role||"")} · ${T.length} open task${T.length===1?"":"s"} in Task Manager</span></div>
   <div class="pblock"><div class="checks four"><div class="ck"><span>Open tasks</span><b>${T.length}</b><i class="eq">Task Manager</i></div><div class="ck"><span>Past due</span><b>${L.late.length}</b><i class="${L.late.length?"dn":"up"}">${L.late.length?"Needs attention":"Fine"}</i></div><div class="ck"><span>Due this week</span><b>${T.filter(t=>t.due&&t.due>=TODAY&&t.due<=wk).length}</b><i class="eq">next 7 days</i></div><div class="ck"><span>No due date</span><b>${T.filter(t=>!t.due).length}</b><i class="eq">&nbsp;</i></div></div></div>
   ${rvTbHTML(L)}
   <div class="pblock">${T.length?grp("Past due",T.filter(t=>t.due&&t.due<TODAY))+grp("Next 7 days",T.filter(t=>t.due&&t.due>=TODAY&&t.due<=wk))+grp("Later",T.filter(t=>t.due&&t.due>wk))+grp("No date",T.filter(t=>!t.due)):`<p class="pm">No open tasks.</p>`}</div>
   ${st?`<div class="pblock"><button class="coach alt" type="button" data-rvs="${st.id}" style="margin-top:0">Open ${esc(first(st.n))}'s accounts</button></div>`:""}`}
/* ---------- Team management: the Rise Voice team in Kash's three groups ---------- */
const RVTB=[["Recognise","s-ok","doing well"],["Coach","s-watch","needs support"],["Watchlist","s-act","at risk"]];
const RVTBP={Good:"Recognise","To Improve":"Coach",Critical:"Watchlist"},RVTBSET={};
/* Kash's own tag (Team brief group) wins; without one, Performance Status suggests a group */
const rvTbOf=p=>{const v=RVTBSET[p.id]!==undefined?RVTBSET[p.id]:p.tb;return v?{g:v,set:true}:RVTBP[p.perf]?{g:RVTBP[p.perf],set:false}:null};
function rvStratCard(s){const t=s.acc.length,tb=rvTbOf(s);return `<button class="pc" type="button" data-rvs="${s.id}"><div class="nm"><b>${esc(s.n)}</b><span>${esc(s.role)} · ${t} account${t>1?"s":""}</span></div><div class="score">${s.occ!=null?Math.round(s.occ*100)+"%":`<span class="pend" style="font-size:13px;font-weight:500">–</span>`}<small> load</small></div><div class="split" aria-label="${s.cnt.act} act, ${s.cnt.watch} watch, ${s.cnt.ok} leave alone"><i style="width:${s.cnt.act/t*100}%;background:var(--act)"></i><i style="width:${s.cnt.watch/t*100}%;background:var(--watch)"></i><i style="width:${s.cnt.ok/t*100}%;background:var(--ok)"></i></div><div class="pcfoot"><span>${s.items.length} open item${s.items.length===1?"":"s"}${s.late.length?` · <span class="need-act">${s.late.length} late</span>`:""}</span><span class="pm" style="font-size:11.5px">${tb&&!tb.set?"Suggested":""}</span></div></button>`}
function rvTeamBrief(M){const el=$("rvTeamBrief");if(!el)return;
  const ppl=[...M.leads.filter(L=>!M.strats.some(s=>s.id===L.id)).map(L=>({p:L,card:rvLeadCard(L)})),...M.strats.map(s=>({p:s,card:rvStratCard(s)}))].filter(x=>kteamOK(x.p.full||x.p.n));
  const untag=ppl.filter(x=>!rvTbOf(x.p));
  el.innerHTML=`<div class="team">${RVTB.map(([g,c,sub])=>{const P=ppl.filter(x=>(rvTbOf(x.p)||{}).g===g);return `<div class="tcol"><h3><span class="st ${c}">${g}</span><small>${sub}</small></h3>${P.length?P.map(x=>x.card).join(""):`<p class="pm" style="margin:0 2px">Nobody here yet.</p>`}</div>`}).join("")}</div>${untag.length?`<h4 class="mh" style="margin-top:18px">Not tagged yet · open someone to put them in a group</h4><div class="leads">${untag.map(x=>x.card).join("")}</div>`:""}
    <p class="pm" style="margin:10px 2px 0;font-size:12.5px">Groups come from "Team brief group" in Team Roster. Where it's empty, Performance Status suggests one.</p>`}
function rvTbHTML(p){const tb=rvTbOf(p),v=RVTBSET[p.id]!==undefined?RVTBSET[p.id]:p.tb||"";
  return `<div class="pblock"><h3>Team brief</h3><div class="tbrow"><label for="rvTbSel" class="pm">Group</label><select id="rvTbSel" class="mini" data-rvtb="${p.id}"><option value=""${v?"":" selected"}>Not tagged${tb&&!tb.set?` (suggested: ${tb.g})`:""}</option>${RVTB.map(([g])=>`<option${v===g?" selected":""}>${g}</option>`).join("")}</select><span class="pm" id="rvTbMsg" style="font-size:12.5px"></span></div></div>`}
async function rvTbSave(id,v){
  if(window.claude?.use){const mcp=await window.claude.use("mcp");await mcp.callTool("Airtable","update_records_for_table",{baseId:RVBASE,tableId:"tblu7ZGCkLPA9x1cp",records:[{id,fields:{fldUT5RDbCt2yuMSN:v||null}}],typecast:true},{cache:false});return}
  const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"group",id,v:v||""}),cache:"no-store"});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error("not saved")}
function rvStratHTML(id){
  const M=RVX.M,s=M&&M.strats.find(x=>x.id===id);if(!s)return `<p class="pm">Not in the latest data.</p>`;
  const g=rvGroup(s),fn=first(s.n),t=s.acc.length,wk=s.poa;
  const L={Sarah:s.acc.filter(c=>c.askSarah).flatMap(c=>c.R.filter(r=>r.sarah).map(r=>`${c.n}: ${r.ask}`)),Gretta:s.acc.flatMap(c=>c.R.filter(r=>r.lvl!=="info"&&r.to==="gretta").map(r=>`${c.n}: ${r.ask}`)),Karen:s.acc.flatMap(c=>c.R.filter(r=>r.lvl!=="info"&&r.to==="karen").map(r=>`${c.n}: ${r.ask}`))};
  const open=[];
  if(s.slack.length)open.push(`${s.slack.length} Slack message${s.slack.length>1?"s":""} without a reply: ${s.slack.map(x=>x.item).join("; ")}`);
  if(s.late.length)open.push(`${s.late.length} item${s.late.length>1?"s":""} past due in Needs Attention: ${s.late.slice(0,3).map(x=>x.item).join("; ")}`);
  if(!wk||String(wk.wk||"")<dayMinus(6))open.push(`No POA logged for the week of ${fmtD(monday())}`);else if(wk.stage==="To submit"||(wk.plan&&!wk.done))open.push(`POA for the week of ${fmtD(wk.wk)}: ${wk.done??0} of ${wk.plan??0} done, stage "${wk.stage}"`);
  if(s.occ!=null&&s.occ>1.2)open.push(`Load is ${Math.round(s.occ*100)}%: more accounts than capacity`);
  const going=`${t} account${t>1?"s":""}: ${s.cnt.act} act, ${s.cnt.watch} watch, ${s.cnt.ok} leave alone. ${s.items.length} open item${s.items.length===1?"":"s"} in Airtable${s.slack.length?`, ${s.slack.length} waiting on Slack`:""}${s.late.length?`, ${s.late.length} past due`:""}.`;
  const kl=(a,b,c="")=>`<div><span>${a}</span><b>${b}</b><em>${c}</em></div>`,nl=v=>v==null?`<span class="pend">Not logged</span>`:v;
  const rel=s.items.filter(x=>x.type==="Slack"||/client meeting/i.test(x.type)),other=s.items.filter(x=>!rel.includes(x));
  const sent={};s.acc.forEach(c=>{if(c.sent)sent[c.sent]=(sent[c.sent]||0)+1});
  return `<div class="ph"><span class="st ${g[2]}">${g[1]}</span><h2>${esc(s.n)}</h2><span class="pm">${esc(s.role)} · ${t} account${t>1?"s":""} · load ${s.occ!=null?Math.round(s.occ*100)+"%":"–"}</span></div>
   <div class="pblock"><div class="checks four">${rvCk("Performance",s.perf,["Critical"],["Good"])}<div class="ck"><span>Accounts to act on</span><b>${s.cnt.act}</b><i class="${s.cnt.act?"dn":"up"}">of ${t}</i></div><div class="ck"><span>Load</span><b>${s.occ!=null?Math.round(s.occ*100)+"%":"–"}</b><i class="${s.occ!=null&&s.occ>1.2?"dn":"eq"}">Team Roster</i></div><div class="ck"><span>Open items</span><b>${s.items.length}</b><i class="${s.late.length?"dn":"eq"}">${s.late.length} late</i></div></div></div>
   ${rvTbHTML(s)}
   <div class="pblock"><h3>What's going on</h3><p>${esc(going)}</p>${open.length?li(open.map(esc)):""}</div>
   <div class="pblock"><h3>Needed from you</h3><div class="${L.Sarah.length?"need-act":"need-ok"}">${li(L.Sarah.length?[`Ask Sarah about ${fn}'s accounts that are at risk, dropping or mishandled`]:["Nothing. Sarah's team has it"])}</div>${L.Sarah.length?li(L.Sarah.map(esc)):""}${rvBtns(fn+"'s accounts",L)}</div>
   <div class="pblock"><h3>Accounts</h3>${s.acc.sort((a,b)=>RVORD[a.st]-RVORD[b.st]).map(c=>`<button class="acc" type="button" data-rvc="${c.id}"><span class="st ${SC[c.st]}">${{act:"Act",watch:"Watch",ok:"Leave"}[c.st]}</span><span><b>${esc(c.n)}</b>${c.own?' <span class="pm">own account</span>':""}</span><span class="pm">${esc(c.R[0]?c.R[0].short:"Nothing flagged")}</span></button>`).join("")}</div>
   <div class="pblock"><h3>Performance and reviews</h3><div class="kl">${kl("CSAT this month",nl(s.csat!=null?f1(s.csat):null))}${kl("Results presented",nl(s.pr||null))}${kl("Coaching rating",nl(s.coach!=null?f1(s.coach):null))}${kl("Next review",s.next?fmtD(s.next.date):"–",s.next?esc(s.next.stage):"")}${s.lastRev?kl("Last review",f1(s.lastRev.avg)+"/5",fmtD(s.lastRev.date)):""}${kl("POA this week",wk?`${wk.done??0} of ${wk.plan??0} done`:`<span class="need-act">Not logged</span>`,wk?esc(wk.stage||""):"")}${wk&&wk.help?kl("Support asked for",esc(wk.help)):""}</div></div>
   <div class="pblock"><h3>Slack and client relationships</h3>${rel.length?rel.map(rvItem).join(""):`<p class="pm">No Slack messages waiting and no client meetings logged.</p>`}${Object.keys(sent).length?`<p class="pm" style="margin-top:8px">Client sentiment: ${esc(Object.entries(sent).map(([a,b])=>`${b} ${a.toLowerCase()}`).join(", "))}</p>`:""}</div>
   <div class="pblock"><h3>Other open items</h3>${other.length?other.map(rvItem).join(""):`<p class="pm">None.</p>`}</div>`;
}
/* a month from the Revenue tracker: the numbers, then Actions, PNL Notes and Admin Notes */
function rvMonthHTML(end){
  const M=RVX.M,m=M&&M.rev.find(x=>x.end===end);if(!m||!RVX.money)return rvRestricted("this month");
  const ms=(lab,v,cls="")=>`<div class="ms ${cls}"><span>${lab}</span><b>${v}</b></div>`;
  const acts=String(m.actions||"").split(/\n+/).map(x=>x.replace(/^[-•*]\s*/,"").trim()).filter(Boolean);
  const txt=v=>v?`<p class="notes">${esc(v)}</p>`:`<p class="pm">Nothing written yet.</p>`;
  return `<div class="ph"><h2>${esc(m.month)}</h2><span class="pm"><span class="st ${m.status==="Actual"?"s-ok":"s-watch"}">${m.status==="Actual"?"Actual":"Forecast"}</span>&nbsp; Revenue tracker</span></div>
   <div class="pblock"><div class="mstats">${ms("Revenue",gbp(m.rev))}${ms("Collected",gbp(m.col))}${ms("To collect",gbp(m.tocol))}${ms("Past due",gbp(m.pastdue),m.pastdue?"r":"")}${ms("Costs",gbp(m.costs))}${ms("Profit",gbp(m.profit),(m.profit||0)<0?"r":"g")}${ms("Paying clients",m.paying!=null?f1(m.paying).replace(/\.0$/,""):"–")}${ms("Churned",m.churn??0,m.churn?"r":"")}</div></div>
   <div class="pblock"><h3>Actions</h3>${acts.length?li(acts.map(esc)):`<p class="pm">No actions logged yet. Add them in the Actions field of this month in the Revenue tracker.</p>`}</div>
   <div class="pblock"><h3>Finance comments</h3>${txt(m.pnl)}</div>
   <div class="pblock"><h3>Admin comments</h3>${txt(m.admin)}</div>
   ${m.churn||m.why||m.ap?`<div class="pblock"><h3>Churn</h3>${m.churned.length?`<p>${esc(m.churned.join(", "))}</p>`:""}${m.leave.length?`<p class="pm" style="margin-top:4px">Reasons: ${esc(m.leave.join(", "))}</p>`:""}${m.why?`<p class="notes" style="margin-top:8px">${esc(m.why)}</p>`:""}${m.ap?`<h3 style="margin-top:14px">Plan for next month</h3><p class="notes">${esc(m.ap)}</p>`:""}</div>`:""}`;
}
const monday=()=>{const d=new Date(TODAY+"T00:00:00Z"),w=(d.getUTCDay()+6)%7;return new Date(d-w*864e5).toISOString().slice(0,10)};
const dayMinus=n=>new Date(Date.parse(TODAY+"T00:00:00Z")-n*864e5).toISOString().slice(0,10);

function rvBrief(M){
  const B=[],E=M.ext;
  if(RVX.money&&M.last6.length>1){const L=M.last6;let fall=0;for(let i=L.length-1;i>0&&(L[i].rev||0)<(L[i-1].rev||0);i--)fall++;const a=L[0],z=L[L.length-1];
    B.push([fall>=2?`Revenue has fallen ${fall} months in a row`:"Revenue and profit",`${gbp(a.rev)} in ${mshort(a.end)} to ${gbp(z.rev)}${z.status!=="Actual"?" forecast":""} for ${mshort(z.end)}. Costs went from ${gbp(a.costs)} to ${gbp(z.costs)}, so ${mshort(z.end)}'s profit is ${gbp(z.profit)}${z.status!=="Actual"?" (forecast)":""}.`])}
  const act=E.filter(c=>c.st==="act");
  if(act.length)B.push([`${act.length} of ${E.length} clients need action`,act.slice(0,6).map(c=>`${c.n} (${lc1(c.R[0].short)})`).join(", ")+(act.length>6?`, and ${act.length-6} more`:"")+"."]);
  if(RVX.money){const pd=M.inv.filter(i=>i.status==="Past Due"),od=M.inv.filter(i=>i.status==="To Collect"&&i.due&&i.due<TODAY),old=pd.concat(od).filter(i=>dayDiff(TODAY,i.due)>365).length,sum=a=>a.reduce((s,i)=>s+i.amt,0);
    if(pd.length||od.length)B.push(["Cash is stuck in late invoices",`${pd.length} past due (${gbp(sum(pd))}). Another ${od.length} are past their due date but still marked To Collect (${gbp(sum(od))})${old?`; ${old} are over a year old`:""}. Karen owns this.`])}
  const run=E.filter(c=>c.R.some(r=>/run out|ran out|no new/i.test(r.short)));
  if(run.length)B.push([`${run.length} account${run.length>1?"s are":" is"} out of content or close`,run.map(c=>`${c.n} (${lc1(c.R.find(r=>/run out|ran out|no new/i.test(r.short)).short)})`).join(", ")+"."]);
  const top=[...M.strats].sort((a,b)=>(b.occ||0)-(a.occ||0))[0];
  if(top)B.push([`${first(top.n)} carries the most`,`${top.occ!=null?Math.round(top.occ*100)+"% load, ":""}${top.acc.length} accounts, ${top.items.length} open items${top.poa?`; POA ${top.poa.done??0} of ${top.poa.plan??0} done`:""}.`]);
  const all=M.ai,late=all.filter(x=>x.due&&x.due<TODAY).length,ns=all.concat(M.proj).filter(x=>/not started/i.test(x.status)).length;
  if(all.length+M.proj.length)B.push(["Initiatives are slow",`${late} of ${all.length} projects are past their due date and ${ns} of ${all.length+M.proj.length} items haven't started.`]);
  return B;
}
function rvAskHTML(){
  const M=RVX.M;if(!M)return `<p class="pm">Rise Voice hasn't loaded yet.</p>`;
  const sug=["Which clients are most likely to churn?","What should Sarah focus on this week?",RVX.money?"Where is cash stuck, and what should Karen chase first?":"Which accounts are running out of content?"];
  return `<div class="ph"><h2>Ask about Rise Voice</h2><span class="pm">Brief · ${fmtD(TODAY)} · written from the numbers in Airtable</span></div>
   ${rvBrief(M).map(([h,p])=>`<div class="pblock"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}
   <div class="pblock"><h3>Ask a follow-up</h3>${SAMPLE?`<div class="sugs">${sug.map(q=>`<button class="sug rvsug" type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
     <form class="askform" id="rvAskForm"><label for="rvAskIn" class="pm" style="position:absolute;left:-9999px">Your question</label><input id="rvAskIn" class="askin" placeholder="Ask about any client, strategist or project" autocomplete="off"><button class="coach" type="submit" style="margin-top:0" id="rvAskGo">Ask</button></form>
     <div class="answer" id="rvAnswer" hidden></div>${RVX.money?"":`<p class="pm" style="margin-top:8px">Finance numbers are left out of the assistant's data for this account.</p>`}`:`<p class="pm">The assistant answers when this page is opened in Claude.</p>`}</div>`;
}
function rvPeekHTML(kind,id){if(rvMsgFor!==kind+id){rvMsg=null;rvMsgFor=kind+id}return kind==="rvc"?rvClientHTML(id):kind==="rvs"?rvStratHTML(id):kind==="rvm"?rvMonthHTML(id):kind==="rvask"?rvAskHTML():kind==="rvp"?rvPersonHTML(id):kind==="rvpm"?pmAddHTML():""}
function rvWire(){
  if(typeof pmWire==="function")pmWire();
  const tbs=document.querySelector("#peekBody [data-rvtb]");
  if(tbs)tbs.onchange=async()=>{const id=tbs.dataset.rvtb,v=tbs.value,m=$("rvTbMsg");tbs.disabled=true;m.textContent="Saving…";
    try{await rvTbSave(id,v);RVTBSET[id]=v;m.textContent="Saved";rvTeamBrief(RVX.M)}catch(x){m.textContent="Couldn't save. Try again."}tbs.disabled=false};
  const tf=document.querySelector("#peekBody form[data-rvtask]");
  if(tf){tf.onsubmit=async e=>{e.preventDefault();const n=tf.n.value.trim();if(!n||RVT.busy)return;const cid=tf.dataset.rvtask;
      const t={tmp:Date.now(),cid,n,to:tf.to.value,due:tf.due.value||null,state:"saving"};RVT.added.push(t);RVT.busy=true;RVT.msg[cid]="";renderPeek();
      try{t.id=await rvTaskSave(t);t.state="";t.lead=[t.to];RVT.msg[cid]=`Saved. ${t.to} gets a Slack message.`}catch(x){t.state="failed";RVT.msg[cid]="Couldn't save that task. Check the connection and try again."}
      RVT.busy=false;if(peekKind==="rvc"&&peekId===cid)renderPeek()};
    document.querySelectorAll("#peekBody [data-rvsug]").forEach(b=>b.onclick=()=>{tf.n.value=b.dataset.n;tf.to.value=b.dataset.to;tf.n.focus()})}
  document.querySelectorAll("#peekBody [data-rvdone]").forEach(cb=>cb.onchange=async()=>{const id=cb.dataset.rvdone;cb.disabled=true;
    try{await rvTaskDone(id);RVT.done[id]=true;renderPeek()}catch(x){cb.checked=false;cb.disabled=false;const cid=peekId;RVT.msg[cid]="Couldn't mark that done. Try again.";renderPeek()}});
  document.querySelectorAll("#peekBody [data-rvmsg]").forEach(b=>b.onclick=()=>{rvMsg=rvMsg===b.dataset.rvmsg?null:b.dataset.rvmsg;renderPeek()});
  const cp=$("rvCopyBtn");if(cp)cp.onclick=()=>rvCopy("rvNote",cp);
  const f=$("rvAskForm");if(f){f.onsubmit=e=>{e.preventDefault();rvAsk($("rvAskIn").value)};document.querySelectorAll(".rvsug").forEach(b=>b.onclick=()=>{$("rvAskIn").value=b.dataset.q;rvAsk(b.dataset.q)})}
}
function rvSwitch(kind,id){peekKind=kind;peekId=id;$("peek").classList.toggle("rvmodal",RVMODAL.test(kind));renderPeek();$("peek").scrollTop=0;if(kind==="rvc"){rvOpen=id;rvRail()}}

/* ---------- assistant ---------- */
function rvAskData(){
  const M=RVX.M,m=RVX.money;
  return JSON.stringify({asOf:TODAY,business:"Rise Voice: done-for-you Instagram content agency",whoActs:{Sarah:"Director of Social Strategy: strategists, delivery, client results",Gretta:"finance admin: invoices and payments",Karen:"Director of Ops: renewals and finance decisions"},statusRules:"Act only when there is a clear risk of losing the client or a mishandled account; performance issues are Watch; content running low and quiet clients are Leave alone",
    clients:M.ext.map(c=>({name:c.n,status:SL[c.st],reasons:c.R.map(r=>r.t),strategist:c.strat.join(", "),accountManager:c.am.join(", "),planTier:c.tier,contractTerm:c.term,activeMonths:c.months,health:c.health,sentiment:c.sent,results:c.res,riskOfLeaving:c.rol,churnType:c.ctype,videosRunOut:c.vlpd,riskReasons:c.dsat,openItems:c.need.map(x=>`${x.type}: ${x.item}${x.due?" (due "+x.due+")":""}`),audit:c.audit,renewal:c.renew,instagramPostsByMonth:c.pm?Object.fromEntries(Object.entries(c.pm).map(([m,o])=>[m,{posts:o.n,avgViews:o.v!=null?Math.round(o.v):null,avgComments:o.c!=null?+o.c.toFixed(1):null}])):null,instagram:c.s?{month:M.statsMonth,followers:c.s.fol,newFollowers:c.s.newf,views:c.s.views,viewsMonthBefore:c.s.prev,engagementRatePct:c.s.er!=null?+(c.s.er*100).toFixed(1):null,posts:c.s.posts}:null,...(m?{outstandingInvoices:c.inv.map(i=>({due:i.due,status:i.status,amountGBP:Math.round(i.amt)}))}:{})})),
    strategists:M.strats.map(s=>({name:s.n,role:s.role,performanceStatus:s.perf,loadPct:s.occ!=null?Math.round(s.occ*100):null,accounts:s.acc.map(c=>c.n),openItems:s.items.length,slackWaiting:s.slack.map(x=>x.item),pastDueItems:s.late.map(x=>x.item),poaThisWeek:s.poa?{planned:s.poa.plan,done:s.poa.done,stage:s.poa.stage}:null,nextReview:s.next?s.next.date:null})),
    ...(m?{finance:{currency:"GBP",last6Months:M.last6.map(x=>({month:x.month,status:x.status,revenue:Math.round(x.rev||0),costs:Math.round(x.costs||0),profit:Math.round(x.profit||0),collected:Math.round(x.col||0),churnedClients:x.churn,actions:x.actions,financeNotes:x.pnl?x.pnl.slice(0,800):null,adminNotes:x.admin?x.admin.slice(0,800):null})),pastDueInvoices:M.inv.filter(i=>i.status==="Past Due").map(i=>({client:i.client,due:i.due,amount:Math.round(i.amt)})),overdueStillToCollect:M.inv.filter(i=>i.status==="To Collect"&&i.due&&i.due<TODAY).map(i=>({client:i.client,due:i.due,amount:Math.round(i.amt)}))}}:{finance:"restricted"}),
    initiatives:{growth:M.ai.filter(x=>x.grow).map(x=>({name:x.n,status:x.status,due:x.due,owner:x.owner})).concat(M.proj.filter(x=>x.grow).map(x=>({name:x.n,status:x.status}))),ops:M.ai.filter(x=>!x.grow).map(x=>({name:x.n,status:x.status,due:x.due,owner:x.owner})),riseVoiceTool:M.proj.filter(x=>!x.grow).map(x=>({name:x.n,section:x.sec,status:x.status}))}});
}
async function rvAsk(q){
  const out=$("rvAnswer"),go=$("rvAskGo");if(!SAMPLE||!q.trim())return;
  out.hidden=false;out.textContent="Thinking...";go.disabled=true;askCtl=new AbortController();
  const prompt=`You are Kash's analyst for Rise Voice, his Instagram content agency. Kash is the CEO and wants short, direct answers he can act on.
Answer the question using ONLY the data below. Rules: at most 5 short bullet points; cite the numbers you use; say who should act: strategist, delivery and client-result issues go to Sarah, invoices and payments go to Gretta, renewals go to Karen; if the data can't answer it, say exactly what data is missing. Plain text, no headings, no markdown bold.${RVX.money?"":`
Revenue, profit, costs, invoices and pricing are restricted for this person. Never estimate or discuss them. If asked about them, reply only: "Finance numbers are restricted to Karen, Sarah and Jennifer."`}

DATA:
${rvAskData()}

QUESTION: ${q}`;
  try{await SAMPLE(prompt,{signal:askCtl.signal,onText:({text})=>{out.textContent=text}})}
  catch(e){const msg={rate_limited:"Too many questions at once. Try again in a minute.",refused:"The assistant couldn't answer that. Try rephrasing.",cancelled:""}[e.code];
    if(e.code==="not_granted"||e.code==="sampling_disabled"){SAMPLE=null;renderPeek();return}
    out.textContent=(e.text?e.text+"\n\n":"")+(msg??"Something went wrong. Try again.")}
  finally{const g=$("rvAskGo");if(g)g.disabled=false}
}

/* ---------- events, refresh, lock ---------- */
document.addEventListener("click",ev=>{
  const c=ev.target.closest("[data-rvc]");if(c&&!ev.target.closest("a")){if(c.closest(".peek"))rvSwitch("rvc",c.dataset.rvc);else{rvOpen=c.dataset.rvc;openPeek("rvc",c.dataset.rvc);rvRail()}return}
  const s=ev.target.closest("[data-rvs]");if(s){if(s.closest(".peek"))rvSwitch("rvs",s.dataset.rvs);else openPeek("rvs",s.dataset.rvs);return}
  const pp=ev.target.closest("[data-rvp]");if(pp){if(pp.closest(".peek"))rvSwitch("rvp",pp.dataset.rvp);else openPeek("rvp",pp.dataset.rvp);return}
  const mo=ev.target.closest("[data-rvm]");if(mo){openPeek("rvm",mo.dataset.rvm);return}
  const se=ev.target.closest("[data-rvsel]");if(se&&!ev.target.closest("a")){rvSel=se.dataset.rvsel;rvCompare();rvTable();return}
  const so=ev.target.closest("[data-rvsort]");if(so){const key=so.dataset.rvsort;if(rvSort===key)rvDir=rvDir==="asc"?"desc":"asc";else{rvSort=key;rvDir=key==="n"||key==="strat"?"asc":"desc"}rvTable()}
});
$("rvAskOpen").onclick=()=>openPeek("rvask");
document.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.matches&&ev.target.matches("tr[data-rvc]")){ev.preventDefault();ev.target.click()}});
/* client, strategist, person and month details open as a centred window, not the side panel */
const RVMODAL=/^rv([csmp]|pm)$/;
{const op=openPeek,cp=closePeek;openPeek=function(kind,id){$("peek").classList.toggle("rvmodal",RVMODAL.test(kind));return op(kind,id)};closePeek=function(){const r=cp.apply(this,arguments);$("peek").classList.remove("rvmodal");return r};
 $("peekClose").onclick=closePeek;$("scrim").onclick=closePeek}
function rvLab(text,cls){const l=$("rvAsof");l.textContent=text;l.className="asof"+(cls?" "+cls:"")}
async function rvRefresh(){
  if(RVX.state==="busy")return;RVX.state="busy";RVX.err=null;rvLab("Rise Voice: loading…");rvHome();
  if(!RVX.M&&!RVX.hosted)rvGate(`<div class="lockcard"><h2>Loading Rise Voice</h2><p class="pm">Reading clients, team and finance from Airtable.</p></div>`);
  try{const D=await rvFetch();RVX.M=rvModel(D);RVX.state="idle";rvRender();rvLoadPosts(D);
    const t=new Date();rvLab(`Live · Airtable · refreshed ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,"live")}
  catch(e){const c=e&&e.code;RVX.state="idle";
    const msg=c==="needs_reauth"?"Reconnect Airtable in Settings → Connectors":c==="server_not_connected"?"Add the Airtable connector to see Rise Voice":c==="selection_required"?"Choose which Airtable connector to use, then refresh":c==="not_in_manifest"||c==="approval_required"?"Allow Airtable access to load Rise Voice":c==="blocked_by_policy"?"Airtable is blocked for your account":c==="unavailable"?"Rise Voice loads when this page is opened in Claude":"Couldn't load Rise Voice. Try Refresh.";
    RVX.err=msg;rvLab(msg,"warn");
    if(!RVX.M)rvGate(`<div class="lockcard"><h2>Rise Voice didn't load</h2><p class="pm">${esc(msg)}</p></div>`);
    rvHome()}
}
(()=>{const btn=$("refreshBtn");
  if(window.claude?.use||RVX.hosted){if(!btn.hidden){const p=btn.onclick;btn.onclick=()=>{if(p)p();rvRefresh()}}rvRefresh()}
  else{RVX.state="idle";RVX.err="Rise Voice loads when this page is opened in Claude";rvLab(RVX.err,"warn");rvGate(`<div class="lockcard"><h2>Rise Voice</h2><p class="pm">${RVX.err}.</p></div>`);rvHome()}})();
</script>
