/* ---------- v19: Podcast sub-tabs, Team management tab, computed status, episode modal ---------- */
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const addD=(s,n)=>new Date(Date.parse(String(s).slice(0,10)+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
const d10=v=>v?String(v).slice(0,10):null;
const nm=v=>v==null?null:typeof v==="object"&&!Array.isArray(v)?(v.name??null):v;
const names=v=>v==null?[]:(Array.isArray(v)?v:[v]).map(x=>typeof x==="object"&&x?(x.name??x.id??""):x).filter(Boolean);
const isDone=v=>/^done$/i.test(nm(v)||"");
const pl=(n,w)=>`${n} ${w}${n===1?"":"s"}`;

/* sub-tabs inside Podcast */
const SUBS=["overview","release","post"];
function showSub(s){document.querySelectorAll(".subtabs .sub[data-sub]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.sub===s)));
  for(const v of SUBS)$("s-"+v).hidden=v!==s}
document.querySelector(".subtabs").addEventListener("click",e=>{const b=e.target.closest(".sub[data-sub]");if(b){showSub(b.dataset.sub);window.scrollTo({top:0});if(b.dataset.sub==="overview")race()}});
/* Team management: the team brief as its own tab */
const showTab0=showTab;
showTab=function(t){showTab0(t);$("v-team").hidden=t!=="team";if(t==="podcast")requestAnimationFrame(race)};
if(location.hash==="#team")showTab("team");

/* ---------- status worked out from the data (released: pace and tests; upcoming: production) ---------- */
const EPREC={},TT={};
/* v30: the brief and Health saved on the episode (written by the brief automation). When a field is filled it wins; empty ones keep the live calculation */
const BRF={going:"fld34wot28UTvuvyO",step:"fldhqtTGfsZkB2e2X",owner:"fld3uCtgVsFEA8703",when:"fldOJXdorjcUTNe4C",them:"fldrMGTdP8uhTkXuO",st:"fldvniRq20MweSA1a",at:"fldtvyl0Fag0rL5sK"};
const briefOf=f=>{const o={};for(const [k,id] of Object.entries(BRF)){const v=plain(f[id]);if(v!=null&&String(v).trim())o[k]=String(v).trim()}return Object.keys(o).length?o:null};
function briefApply(){for(const [id,x] of Object.entries(EPREC)){const s=x.brief,b=B[id];if(!s||!b)continue;
  for(const k of ["going","step","owner","when"])if(s[k])b[k]=s[k];
  if(s.them)b.them=s.them.split(/\n+|\s*;\s*/).map(z=>z.replace(/^[-•*\s]+/,"").trim()).filter(Boolean);
  const h=/^act/i.test(s.st||"")?"act":/^watch/i.test(s.st||"")?"watch":/leave|^ok/i.test(s.st||"")?"ok":null;if(h)b.st=h;
  b.saved=Object.keys(s).filter(k=>k!=="at");if(s.at)b.briefAt=s.at}}
function epIndex(D){
  for(const f of D.episodes||[]){const n=plain(f.fldhFqJB0E9XM6plr),id=idOf(n);if(!id||!f._rid)continue;
    /* a blank duplicate (same name, no release date) never replaces the real episode */
    if(EPREC[id]&&EPREC[id].rel&&EPREC[id].rid!==f._rid&&!f.fldlWnJQipytEIMsZ)continue;
    EPREC[id]={rid:f._rid,name:n,rel:d10(plain(f.fldlWnJQipytEIMsZ)),letgo:!!f.fld4A6Q39p87zE3ui,late:plain(f.fldAfMxmj6MDGovng),
      step:plain(f.fldIPMtzysfLWQJVt),due:d10(plain(f.fldmILqKYSVDIltu1)),track:plain(f.fldAL86prtg5dBO17),brief:briefOf(f)}}
  for(const k in TT)delete TT[k];
  for(const f of D.tests||[]){const n=plain(f.fldXguHAV8zXDgYPD)||"",m=/^(.*?)\s+[–-]\s+/.exec(n);if(!m)continue;const id=idOf(m[1]);if(!id)continue;
    (TT[id]=TT[id]||[]).push({n,start:d10(plain(f.fldeNfGG1cPxEECyq)),end:d10(plain(f.fldkTdD0vDDhkD0wm)),win:plain(f.fldwFkKL7yIh533NL),res:plain(f.fldJVBAcb6vglU2xK)})}
  for(const id in TT)TT[id].sort((a,b)=>String(a.start).localeCompare(String(b.start)))}
function epStatus(){
  for(const e of EP){const id=e.id,rel=DATE[id];if(!rel||rel>TODAY)continue;
    const b=B[id]||(B[id]={n:e.n,rel:e.rel,you:["Nothing"]}),x=EPREC[id]||{},tests=TT[id]||[];
    const age=dayDiff(TODAY,rel)+1,last=tests[tests.length-1],open=[...tests].reverse().find(t=>t.start&&!t.end&&!t.win);
    const dv=DAILY[id]&&DAILY[id].length?DAILY[id][DAILY[id].length-1]:null;
    let st,need,step,when,going,them,owner="CJ";
    const testLine=tests.length?` ${pl(tests.length,"test")} logged; the last started ${fmtD(last.start)}${last.end?` and ended ${fmtD(last.end)}`:", with no result logged yet"}.`:" No test logged yet.";
    const runOpen=()=>{const d=dayDiff(TODAY,open.start);st="watch";
      if(d>5){need="Log the test result";step="Log the test result";when=`${d} days running`;them=["Log the winner and the end date","Add what you learnt","No lift? Start the next test"]}
      else{need="Test running";step="Let the test run";when=`Started ${fmtD(open.start)}`;them=["Let it run 3 to 5 days, then log the winner"]}};
    if(x.letgo){st="ok";need="Let go";step="No more tests";owner="–";when="–";going=`Let go: no more tests. ${k(e.wk)} views last week.`;them=["Nothing"]}
    else if(age<=30){
      if(!dv){st="watch";need="First numbers due";step="Wait for day-1 numbers";when="YouTube data is 2 to 3 days behind";going=`Released ${fmtD(rel)}. YouTube numbers arrive 2 to 3 days late.`;them=["Nothing yet"]}
      else{const p=paceAt(dv[0]),pct=Math.round(dv[1]/p*100);
        going=`Day ${dv[0]}: ${k(dv[1])} views, ${pct}% of the pace for that day (${k(Math.round(p))}).`+testLine;
        if(dv[1]>=p){st="ok";need="On pace";step=age<7?"Day-7 check":"Let it run";when=age<7?"By "+fmtD(addD(rel,6)):"–";them=["Nothing. Let it run"]}
        else if(open)runOpen();
        else if(age<=7){st="watch";need="Decide by day 7";step="Keep the launch winner or start a new test";when="By "+fmtD(addD(rel,6));them=["Check which launch version YouTube picked","Still below pace on day 7? Start a new thumbnail and title test"]}
        else{st="act";need="Start a test";step="Start a thumbnail and title test";when=`Below pace on day ${dv[0]}`;them=["Start a new test: new thumbnails and titles together","Log it here when it starts"]}}}
    else{const wk=e.wk||0;
      going=`${k(e.now)} views in total, ${k(wk)} last week (${wk>=PACE.stalled?"above":"under"} the 10K a week line).`+testLine;
      if(open){runOpen();if(wk>=PACE.stalled&&step==="Let the test run")st="ok"}
      else if(wk>=PACE.stalled){st="ok";need="Growing";step="Weekly check";when="Mondays";them=["Nothing. Flag it if weekly views halve"]}
      else if(last&&last.end&&dayDiff(TODAY,last.end)<4){st="watch";need="Next test by "+fmtD(addD(last.end,4));step="Plan the next test";when="By "+fmtD(addD(last.end,4));them=["Start the next test, or let it go"]}
      else{st="act";need=tests.length?"Start a new test":"Start a test or let go";step=tests.length?"Start a new thumbnail and title test":"Start a test, or let it go";when="Stalled";
        them=[tests.length?"Start a new test: new thumbnails and titles together":"Start a first test, or tick 'Let go' if it stays as it is","Log it here when it starts"]}}
    Object.assign(b,{st,step,owner,when,going,them});NEED[id]=need}
  for(const [id,x] of Object.entries(EPREC)){if(!x.rel||x.rel<=TODAY||!B[id])continue;
    const b=B[id];if(/ready to release/i.test(x.step||"")){Object.assign(b,{st:"ok",step:"Ready to release",owner:"–",when:"–",going:`Releases ${fmtD(x.rel)}. Every production step is done.`,them:["Nothing"]});NEED[id]="Nothing";continue}
    const m=/^(\w+)\.\s*(.*?)\s*\(([^)]+)\)(?:\s*[–-]\s*(.*))?$/.exec(x.step||"");if(!m)continue;
    const owner=m[3],step=m[2],prog=m[4],late=x.due&&x.due<TODAY,today=x.due===TODAY,n=dayDiff(x.rel,TODAY);
    const when=!x.due?"–":today?"Due today":late?`${dayDiff(TODAY,x.due)}d late`:"Due "+fmtD(x.due);
    const st=/behind/i.test(x.track||"")||late?"act":today||n<=2?"watch":"ok";
    Object.assign(b,{st,step,owner,when,
      going:`Releases ${fmtD(x.rel)}, in ${pl(n,"day")}. Next: ${step.toLowerCase()} (${owner})${prog?", "+prog:""}, ${when.toLowerCase()}.${x.late?` ${pl(x.late,"step")} finished late so far.`:""}`,
      them:[`${step} by ${x.due?fmtD(x.due):"–"}`]});
    NEED[id]=late?`Chase ${owner.split(/\s*\/\s*/)[0]}`:today?`${step} due today`:"Nothing"}
  briefApply()}
const applyLive0=applyLive;
applyLive=function(D){const r=applyLive0(D);try{epIndex(D)}catch(e){console.error(e)}return r};
const renderAll0=renderAll;
renderAll=function(){try{epStatus()}catch(e){console.error(e)}renderAll0()};
try{epIndex(fromRest(SNAP));renderAll()}catch(e){console.error(e)}

