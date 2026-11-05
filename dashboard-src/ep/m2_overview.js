
/* ---------- Overview ---------- */
const STG=[["Pre-recording","research",null,null],["Recording","recDate",null,null],["Editing (V1)","dV1",["s2"],null],["Clipping","dReady",["s5a","s5b"],"clips"],["Thumbnails","dReady",["s4"],"thumbs"],["Posting","dStart",["s6"],"clips"],["Release QA","dFinal",["s7","s8"],"release"],["Release","rel",null,"release"],["Day-30 check","+30",null,"testing"]];
function stageStatus(ep,sk){if(!sk)return "No status";const v=sk.map(z=>stOf(ep[z]));if(v.every(z=>z==="Done"))return "Done";if(v.some(z=>z==="Problem"))return "Problem";if(v.some(z=>z==="In progress"||z==="Done"))return "In progress";if(v.every(z=>z==="Not started"))return "Not started";return v.find(z=>z!=="No status")||"No status"}
function headline(id,x,b,e){const rel=x.rel;if(!rel||rel>TODAY)return /chase/i.test(NEED[id]||"")||/behind/i.test(x.track||"")?"Production is running late":"In production";
  if(x.letgo)return "Let go: no more tests";const age=dayDiff(TODAY,rel)+1,dv=DAILY[id]&&DAILY[id].length?DAILY[id][DAILY[id].length-1]:null;
  if(age<=30)return dv&&dv[1]>=paceAt(dv[0])?"On pace":"Behind the pace";return (e&&e.wk||0)>=PACE.stalled?"Still growing":"Growing slower than planned"}
const tabFor=s=>/test/i.test(s)?"testing":/trailer|release|qc|final cut|sign/i.test(s)?"release":/thumbnail/i.test(s)?"thumbs":/clip|b-?roll|tp|carousel|posting/i.test(s)?"clips":null;
function tOverview(id,x,b,e,D,s){
  const rel=x.rel,released=rel&&rel<=TODAY,step=b.step||"–",to=tabFor(step);
  const lbl=/log the test result/i.test(step)?"Log result":/start/i.test(step)&&/test/i.test(step)?"Add a test":to?"Open "+TABS.find(t=>t[0]===to)[1]:null;
  const when=String(b.when||"").replace(/^(\d+) days running$/,"Test running for $1 days");
  const owner=!b.owner||b.owner==="–"?"the team":b.owner;
  /* the brief's own asks first, then the team's to-dos; ticks and new ones are saved as To-do steps */
  const comp=(b.them||[]).filter(t=>!/^nothing/i.test(t));
  const todos=[...comp.map(n=>{const z=s.todos.find(q=>q.n===n);return {n,d:!!(z&&z.d),comp:true}}),...s.todos.filter(z=>!comp.includes(z.n)).map(z=>({n:z.n,d:z.d,i:s.todos.indexOf(z)}))];
  const three=`<div class="m2-three">
    <section class="m2-ov"><p class="k">What's going on</p><p class="hl">${esc(headline(id,x,b,e))}</p><p class="tx">${esc(b.going||"–")}</p></section>
    <section class="m2-ov${b.st&&b.st!=="ok"?" amb":""}"><p class="k">Next step</p><p class="hl">${esc(step)}</p><div class="mt"><span>${ic("person",16,"currentColor",null,2)}Owner: ${esc(owner)}</span>${when&&when!=="–"?`<span>${ic("wait",16,"currentColor",null,2)}${esc(when)}</span>`:""}</div>
      ${lbl?`<div style="margin-top:auto;padding-top:4px"><button type="button" class="m2-btn" data-act="goto" data-to="${to}">${lbl}</button></div>`:""}</section>
    <section class="m2-ov"><p class="k">Needed from ${esc(owner)}</p><div style="display:flex;flex-direction:column;gap:4px">${todos.length?todos.map(t=>`<label class="m2-chk"><input type="checkbox" ${t.comp?`data-tick="${esc(t.n)}" data-o="${esc(owner)}"`:`data-k="todos.${t.i}.d"`} ${t.d?"checked":""}>${esc(t.n)}</label>`).join(""):`<p class="tx" style="color:var(--tm)">Nothing right now.</p>`}
      ${s.addTodo?`<label class="m2-chk"><input type="text" data-todo data-o="${esc(owner)}" aria-label="New to-do" placeholder="What's needed?" autofocus></label>`:""}</div>
      <button type="button" class="m2-add" style="align-self:flex-start" data-act="todo">+ Add a to-do</button></section></div>`;
  /* timeline */
  let tl="";
  {const ep=D?D.ep:{},rec=d10(nm(ep.recDate));
    const sts=STG.map(([l,dk,sk,tab],i)=>{const v=s.tl[i]||{};const due=v.date!==undefined?v.date:dk==="+30"?(rel?addD(rel,29):null):dk==="rel"?rel:d10(nm(ep[dk]));
      let status=v.status||(sk?stageStatus(ep,sk):"No status");
      let done=status==="Done"||(i===1&&rec&&rec<=TODAY)||((i===7||i===8)&&due&&due<=TODAY&&released);
      return {l,tab,due,status,done,fixed:i===7||i===8}});
    /* once released, every step before release counts as done; before that, pre-recording and recording are done once a later step is */
    if(released)sts.forEach((z,i)=>{if(i<7)z.done=true});
    const lastD=sts.map(z=>z.done).lastIndexOf(true);sts.forEach((z,i)=>{if(i<2&&i<lastD)z.done=true});
    let nextSet=false;
    sts.forEach((z,i)=>{if(z.done)z.c="done";else if(z.status==="Problem"||(z.due&&z.due<TODAY&&z.status!=="No status"))z.c="late";else if(!nextSet&&i>lastD&&z.status!=="No status"){z.c="next";nextSet=true}else if(z.status==="No status"&&released)z.c="nt";else z.c="up"});
    if(!nextSet&&!released){const z=sts.find((q,i)=>i>lastD&&q.c==="up");if(z)z.c="next"}
    const nDone=sts.filter(z=>z.done).length,nNo=sts.filter(z=>!z.done&&z.status==="No status"&&!z.fixed).length;
    tl=`<section class="m2-s" style="gap:28px"><div class="m2-sh" style="align-items:center"><div class="m2-ttl"><h2>Timeline</h2><p>${nDone} of ${sts.length} done${nNo?` · ${nNo} with no status`:""}</p></div>
      <div class="m2-legend"><span><i style="background:var(--g)"></i>Done</span><span><i style="background:var(--r)"></i>Late</span><span><i style="background:var(--ad)"></i>Next</span><span><i class="u"></i>Upcoming</span><span><i class="t"></i>Not tracked</span></div></div>
      <ol class="m2-tl" style="--n:${sts.length}">${sts.map((z,i)=>{const nx=sts[i+1],pv=sts[i-1];
        const lnL=pv?`<div class="ln l${pv.done&&z.done?"":" d"}" aria-hidden="true"></div>`:"",lnR=nx?`<div class="ln r${z.done&&nx.done?"":" d"}" aria-hidden="true"></div>`:"";
        const dot=z.c==="done"?`<div class="dot done">${ic("check",18,"currentColor",null,3)}</div>`:z.c==="late"?`<div class="dot late">${ic("alert",18,"currentColor",null,2.4)}</div>`:z.c==="next"?`<div class="dot next"><i></i></div>`:`<div class="dot ${z.c}"></div>`;
        const name=z.tab?`<a href="#" class="nm" data-mtab="${z.tab}">${esc(z.l)}</a>`:`<span class="nm">${esc(z.l)}</span>`;
        const m=TL_F[i],below=z.done||z.fixed?`<span class="dn">${z.fixed&&z.due?fmtD(z.due)+(z.done?" · Done":""):"Done"}</span>`:
          `<div class="ed">${m&&m.date?`<input type="date" aria-label="Date for ${esc(z.l)}" value="${z.due||""}" data-k="tl.${i}.date" data-rr ${z.c==="late"?'class="late"':""}>`:`<span class="dn" style="color:var(--tm)">${z.due?fmtD(z.due):""}</span>`}${m&&m.st?`<select class="m2-sel pill" aria-label="Status for ${esc(z.l)}" data-k="tl.${i}.status" data-rr>${selOpts(STATUSES,z.status)}</select>`:""}</div>`;
        return `<li>${lnL}${lnR}${dot}${name}${below}</li>`}).join("")}</ol></section>`}
  /* performance */
  const cp=s.game.cps,tgt={7:unN(cp[7])||PACE.d7,14:unN(cp[14])||PACE.d14,30:unN(cp[30])||PACE.d30,goal:unN(s.game.goal)||PACE.d30};
  const pr=(lab,key,n)=>{const v=e?e[key]:null,T=tgt[n];if(v==null){const due=e&&(key==="now"?(x.rel?fmtD(addD(x.rel,1)):null):e[key+"due"]);return `<div class="m2-perf"><b>${lab}</b><div class="m2-bar na"></div><span class="v"><span>${due?"Lands "+due:"No data yet"}</span></span><span></span><span class="rk"></span></div>`}
    const pct=Math.round(v/T*100),r=rank(key,id),ok=v>=T;
    return `<div class="m2-perf"><b>${lab}</b><div class="m2-bar${ok?" ok":""}"><i style="width:${Math.min(100,pct)}%"></i></div><span class="v"><strong>${k(v)}</strong> <span>of ${k(T)}</span></span><span class="m2-pill ${ok?"g":"o"}" style="justify-self:start">${ok?`${pct}% · On track`:`${pct}% · Behind`}</span><span class="rk">${r?ord(r.r)+" of "+r.of:""}</span></div>`};
  const d=DIAG[id],t=TESTS[id],tests=D?D.tests:[],open=[...tests].reverse().find(z=>z.start&&!z.end&&!z.win);
  const planned=D?winPlanned(s):null;
  const ctrT=d?(()=>{const L=Object.keys(DIAG),r=1+L.filter(z=>DIAG[z].ctr>d.ctr).length,diff=d.ctr-MED.ctr;const c=Math.abs(diff)<0.05?["g","On par"]:diff>0?["g","Above"]:["r","Below"];
    return tile("Click-through rate",f1(d.ctr)+"%",`<span class="m2-pill ${c[0]}">${c[1]} · median ${f1(MED.ctr)}%</span>`,{icon:c[0]==="g"?ICO.ok():ICO.bad(),sm:1,extra:`<span class="sub">${ord(r)} of ${L.length}</span>`})})():tile("Click-through rate",DASH,"After 48 hours",{sm:1,vc:"na"});
  const perf=`<section class="m2-s" style="gap:24px"><div class="m2-sh base"><h2 style="margin:0;font-size:20px;font-weight:700">How it's performing</h2><span class="m2-r">Ranked against other episodes</span></div>
    <div style="display:flex;flex-direction:column;gap:4px"><p style="margin:0 0 8px;font-size:15px;font-weight:600;color:var(--t2)">Early views vs. target</p>${pr("First 7 days","d7",7)}${pr("First 14 days","d14",14)}${pr("First 30 days","d30",30)}${pr("Up to date","now","goal")}</div>
    ${tiles([tile("Total views",e&&e.now!=null?k(e.now):DASH,e&&e.now!=null?(r=>r?ord(r.r)+" of "+r.of:"")(rank("now",id)):"After release",{sm:1,vc:e&&e.now!=null?"":"na"}),ctrT,
      tile("Thumbnail tests",String(tests.length||(t?t[0]:0)),open?`Running for ${pl(dayDiff(TODAY,open.start),"day")}`:tests.length?"None running":"None yet",{sm:1,icon:open?ICO.wait():""}),
      tile("Best clip",e&&e.clip!=null?`${k(e.clip)}<small>views</small>`:DASH,e&&e.clip!=null?(r=>r?ord(r.r)+" of "+r.of:"")(rank("clip",id)):"No clips yet",{sm:1,vc:e&&e.clip!=null?"":"na"}),
      planned?tile("Planned clips",String(planned),"In the clipping split",{sm:1,icon:ICO.ok()}):tile("Planned clips",DASH,D?"No plan in Airtable yet":"Loading…",{sm:1,dash:1,vc:"na",icon:ICO.wait()})])}</section>`;
  return three+tl+perf}

/* ---------- Thumbnails ---------- */
function thumbModel(x,D,s){const ig=D.clips.filter(c=>c.fmt==="Thumbnail");const tdrops=D.drops.filter(d=>d.k==="thumb");
  const delivered=tdrops.reduce((a,d)=>a+d.many,0)||(+nm(D.ep.thumbs)||0);
  return {ig,tdrops,delivered}}
function tThumbs(id,x,b,e,D,s,wait){if(!D)return wait;
  const {ig,tdrops,delivered}=thumbModel(x,D,s),rel=x.rel,released=rel&&rel<=TODAY;
  const target=delivered||30,notPosted=Math.max(0,target-ig.length),behind=notPosted>0&&released;
  const ranked=[...ig].sort((a,c)=>s.rankThumb==="views"?c.views-a.views:(c.likes+c.comm)-(a.likes+a.comm)||c.views-a.views);
  const picks=s.picks.thumb,best=[...ig].sort((a,c)=>(c.likes+c.comm)-(a.likes+a.comm))[0];
  const launch=D.tests.find(t=>/launch|test 1\b/i.test(t.n||"")),ctrs=launch?launch.combos.map(c=>c.ctr).filter(v=>v!=null):[];
  const ideas=s.text.ideas,sent=s.sent;
  const row1=tiles([
    tile("Text ideas",ideas?String(ideas.split("\n").filter(z=>z.trim()).length):DASH,sent?`Sent to Jean ${fmtD(sent)}`:ideas?"Not sent yet":"Not added yet",{vc:ideas?"":"na",icon:sent?ICO.ok():""}),
    tile("Designs delivered",delivered?`${delivered}<small>of ${target}</small>`:DASH,tdrops.length?`In ${pl(tdrops.length,"drop")}`:delivered?"Count from Airtable":"No drops yet",{vc:delivered?"":"na",icon:delivered>=target&&delivered?ICO.ok():ICO.wait()}),
    tile("Posted on Instagram",`${ig.length}<small>of ${target}</small>`,notPosted?`<span class="m2-pill ${behind?"r":"a"}">${notPosted} not posted</span>`:"All posted",{red:behind,vc:behind?"red":"",icon:behind?ICO.bad():notPosted?ICO.wait():ICO.ok()}),
    tile("Top performers",`${picks.length}<small>of 3 picked</small>`,best?`Best: ${best.likes+best.comm} reactions`:"No posts yet",{icon:picks.length===3?ICO.ok():ICO.wait()}),
    tile("Launch CTR",ctrs.length?f1(Math.max(...ctrs)*100)+"%":DASH,"From Testing &amp; Recovery",{vc:ctrs.length?"":"na",icon:ctrs.length?ICO.ok():ICO.wait()})]);
  const wk=weekDays(),week=`<section class="m2-s tight"><div class="m2-sh base"><h2 class="sm" style="margin:0;font-size:18px;font-weight:700">Posted this week</h2><span class="m2-r">${fmtD(wk[0])} – ${fmtD(wk[6])}</span></div>
    <div class="m2-week">${wk.map((dt,i)=>dt>TODAY?`<div class="m2-day fut"><b>${DN[i]} ${+dt.slice(8)}</b><em>Not in yet</em></div>`:`<div class="m2-day"><b>${DN[i]} ${+dt.slice(8)}</b><strong>${ig.filter(c=>c.on===dt).length}</strong></div>`).join("")}</div></section>`;
  const st1=sec(1,"Thumbnail text ideas","What Jean designs from.",seg("mode.ideas",s.mode.ideas,[["write","Write"],["file","Attach a file"]],"How to add ideas"),"",
    (s.mode.ideas==="write"?`<label class="m2-lbl">Ideas, one per line<textarea class="m2-ta" rows="6" data-k="text.ideas" placeholder="She manifested $100M&#10;The 3am habit&#10;Why most people stay stuck">${esc(ideas)}</textarea></label>`:
      `<div class="m2-drop">${ic("file",22,"currentColor",null,1.8)}<b style="color:var(--t1)">Link to the ideas</b><span>Paste the Google Doc or Drive file link</span><input class="m2-in" type="url" aria-label="Link to the ideas" data-k="text.ideasLink" placeholder="https://docs.google.com/…" value="${esc(s.text.ideasLink||"")}" style="max-width:420px"></div>`)+
    nsoHandoff(x.rid,"thumbIdeas",sent,!!String(s.text.ideas||s.text.ideasLink||"").trim()));
  const cols="110px 140px 90px 130px minmax(0,1fr) 230px 48px",ad=s.added.drops.thumb||[];
  const dropRows=tdrops.map(d=>{const p=d.posted||0;return trow(cols,[{h:esc(d.n||"Drop"),c:"b"},d.on?fmtD(d.on):DASH,{h:String(d.many||0),c:"b"},esc(d.who||"—"),d.link?`<a href="${esc(d.link)}" target="_blank" rel="noopener" style="font-weight:600">Drive folder</a>`:DASH,`<b>${p} of ${d.many}</b> ${p>=d.many&&d.many?pill("All posted","g"):d.many-p>0?pill(`${d.many-p} ready to post`,"a"):""}`,""])}).join("")+
    ad.map((r,i)=>trow(cols,[{h:`Drop ${tdrops.length+i+1}`,c:"b"},{h:`<input class="m2-in" type="date" aria-label="Delivered on" data-k="added.drops.thumb.${i}.on" value="${r.on||""}">`,c:"in"},{h:`<input class="m2-in" type="number" min="0" aria-label="Designs" data-k="added.drops.thumb.${i}.many" value="${r.many}">`,c:"in"},{h:`<select class="m2-in" aria-label="Delivered by" data-k="added.drops.thumb.${i}.who">${selOpts(["",...owners(D)],r.who)}</select>`,c:"in"},{h:`<input class="m2-in" type="url" aria-label="Drive link" placeholder="Paste the Drive folder link" data-k="added.drops.thumb.${i}.link" value="${esc(r.link)}">`,c:"in"},{h:"—",c:"na"},{h:r.rid?`<span class="m2-ok" title="Saved">${ic("check",16,"#1E7B4A",null,2.6)}</span>`:`<button type="button" class="m2-rm" aria-label="Remove this drop" data-act="rmdrop" data-f="thumb" data-i="${i}">${ic("x",16)}</button>`,c:"in"}],"new")).join("");
  const st2=sec(2,"Thumbnail design drops","One row per batch Jean hands over.","","",tbl("Thumbnail design drops",cols,["Drop","Delivered on","Designs","Delivered by","Files","Posted from this drop",""],dropRows||`<div class="m2-empty">No drops logged yet.</div>`,`<button type="button" class="m2-add" data-act="adddrop" data-f="thumb">+ Add drop</button>`)+nsoBar(x.rid,"thumbDrops"));
  const show=s.more.thumbs?ranked:ranked.slice(0,6),full=picks.length>=3;
  const cards=show.map((c,i)=>{const on=picks.includes(c.rid),off=full&&!on;return `<label class="m2-pk${on?" on":""}${off?" off":""}"><div class="im" style="background:${dc[i%6]}">${ic("image",22,"currentColor",null,1.8)}${imgTag(c,"Design "+(i+1))}<span class="rk">#${i+1}</span><input type="checkbox" aria-label="Select design ${i+1} for the top 3" data-act="pick" data-g="thumb" data-i="${c.rid}" ${on?"checked":""} ${off?"disabled":""}>${c.link?`<a class="op" href="${esc(c.link)}" target="_blank" rel="noopener">Open</a>`:""}</div>
    <div class="ft"><span title="Likes">${ic("heart",13)}${c.likes}</span><span title="Comments">${ic("chat",13)}${c.comm}</span>${s.rankThumb==="views"?`<span title="Views">${ic("eye",13)}${k(c.views)}</span>`:""}</div></label>`}).join("");
  const st3=sec(3,"Pick the top 3","Tick 3 for the launch test.",`<span class="m2-cnt ${picks.length===3?"g":"a"}">${picks.length} of 3 selected</span>`,"",
    seg("rankThumb",s.rankThumb,[["eng","Likes + comments"],["views","Views"]],"Rank by")+(ranked.length?`<div class="m2-picks">${cards}</div>${ranked.length>6?`<button type="button" class="m2-btn2" style="align-self:flex-start" data-act="more" data-k="thumbs">${s.more.thumbs?"Show fewer":`Show all ${ranked.length} posted designs`}</button>`:""}`:`<p class="m2-st">No thumbnail posts in the Clips table yet.</p>`));
  /* all thumbnail posts */
  const wt=(D.waiting||[]).filter(c=>c.fmt==="Thumbnail"),ready=Math.max(0,delivered-ig.length);
  const readyRows=wt.length?wt.map((c,i)=>({ready:true,c,name:c.name||`Design ${ig.length+i+1}`,drop:(tdrops.find(d=>d.rid===c.drop)||{}).n||"—"})):[...Array(Math.min(ready,50))].map((_,i)=>({ready:true,name:`Design ${ig.length+i+1}`,drop:tdrops.length?tdrops[tdrops.length-1].n:"—"}));
  const posted=[...ig].sort((a,c)=>c.views-a.views).map((c,i)=>({c,name:c.name||`Design ${i+1}`}));
  const all=[...readyRows,...posted],tab=s.postTab.thumb,list=tab==="ready"?readyRows:tab==="posted"?posted:all;
  const pc="160px 76px 132px 140px minmax(0,1fr) 64px 52px 52px 52px 56px";
  const wSel=c=>`<select class="m2-in" aria-label="Status of ${esc(c.name||"this design")}" data-k="pst.${c.rid}" data-rr>${selOpts(["Ready to post","Scheduled"],s.pst[c.rid]||c.pst)}</select>`;
  const rows=list.slice(0,s.shown.thumb).map((r,i)=>r.ready?trow(pc,[`<span class="m2-thumb"><i style="background:${dc[(i+3)%6]}"></i><b>${esc(r.name)}</b></span>`,{h:esc(r.drop),c:"mu"},r.c?{h:wSel(r.c),c:"in"}:pill("Ready to post","a"),r.c?schedCell(s,r.c):{h:"—",c:"na"},{h:"Shows once posted",c:"mu"},{h:"—",c:"bb"},"—","—","—","—"]):
    trow(pc,[`<span class="m2-thumb" title="${esc(r.name)}"><i style="background:${dc[i%6]}">${imgTag(r.c,"")}</i><b>Design ${i+1}</b></span>`,{h:"—",c:"mu"},pill("Posted","g"),r.c.on?fmtD(r.c.on):DASH,r.c.link?`<a href="${esc(r.c.link)}" target="_blank" rel="noopener" style="font-weight:600">Open</a>`:DASH,{h:k(r.c.views),c:"bb s"},{h:k(r.c.likes),c:"s"},{h:k(r.c.comm),c:"s"},{h:k(r.c.shares),c:"s"},{h:k(r.c.saves),c:"s"}])).join("")+
    "";
  const st4=sec(4,"All thumbnail posts","One row per post, each with its own link.","","",
    `<div class="m2-stabs" role="tablist" aria-label="Posts by status" style="border-bottom:1px solid var(--bc)">${[["all","All",all.length],["ready","Ready to post",readyRows.length],["posted","Posted",posted.length]].map(([v,l,n])=>`<button type="button" role="tab" data-act="set" data-k="postTab.thumb" data-v="${v}" aria-selected="${tab===v}">${l} <span>${n}</span></button>`).join("")}</div>`+
    tbl("All thumbnail posts",pc,["Design","Drop","Status","Date","Post link",...statIcons],rows||`<div class="m2-empty">No posts here yet.</div>`,`<span class="m2-r">Instagram posts arrive here by themselves once they're live.</span>`)+
    `<div class="m2-row"><span class="m2-r">Showing ${Math.min(list.length,s.shown.thumb)} of ${list.length}</span>${list.length>s.shown.thumb?`<button type="button" class="m2-btn2" data-act="shown" data-g="thumb">Show more</button>`:""}</div>`);
  return row1+week+st1+st2+st3+st4}
