
/* ---------- Testing & Recovery ---------- */
const TESTED=["Design","Text","Title","Description","Something else"];
function defTested(ti,id){const D=EPC[EPREC[id].rid],t=D&&D.tests[ti];const w=String(t&&t.what||"");const o=[];if(/thumb|design/i.test(w))o.push("Design");if(/text/i.test(w))o.push("Text");if(/title/i.test(w))o.push("Title");if(/both|thumbnail \+ title|thumbnail and title/i.test(w)){if(!o.includes("Design"))o.push("Design");if(!o.includes("Title"))o.push("Title")}return o}
/* the goal pace, read from this episode's own checkpoint targets */
function cpList(s){const c=s.game.cps,L=[[0,0]];for(const d of [1,3,7,14,30])if(unN(c[d]))L.push([d,unN(c[d])]);for(const z of s.game.extra)if(+z.day&&unN(z.v))L.push([+z.day,unN(z.v)]);return L.sort((a,b)=>a[0]-b[0])}
function paceG(s,d){const L=cpList(s);for(let i=1;i<L.length;i++)if(d<=L[i][0]){const [d0,v0]=L[i-1],[d1,v1]=L[i];return v0+(v1-v0)*(d-d0)/(d1-d0)}const [dl,vl]=L[L.length-1];return vl+(d-dl)*PACE.stalled/7}
function tTesting(id,x,b,e,D,s,wait){if(!D)return wait;
  const rel=x.rel,released=rel&&rel<=TODAY,c=s.game.cps,dv=n=>e&&e["d"+n]!=null?e["d"+n]:toAt(D,n);
  const dt=(n)=>{const v=dv(n),T=unN(c[n])||paceG(s,n);if(v==null)return tile("Day "+n,DASH,e&&e["d"+n+"due"]?"Lands "+e["d"+n+"due"]:"Not in yet",{vc:"na",sm:1});const ok=v>=T;return tile("Day "+n,k(v),`${Math.round(v/T*100)}% of ${k(T)}`,{icon:ok?ICO.ok():ICO.bad(),vc:ok?"grn":"red",v24:1,sm:1,sc:"s13"})};
  const last=D.days.length?D.days[D.days.length-1]:null,lw=last?wkGain(D,last.day):null,pw=last?wkGain(D,last.day-7):null,wk=e&&e.wk!=null?e.wk:lw;
  const tr=lw!=null&&pw?Math.round((lw/pw-1)*100):null;
  const tests=D.tests,allT=s.tests,open=[...tests].reverse().find(t=>t.start&&!t.end&&!t.win);
  const row=tiles([dt(7),dt(14),dt(30),tile("Lifetime",last||e&&e.now?k(e&&e.now||last.to):DASH,"views",{v24:1,sm:1,sc:"s13"}),
    tile("Last week",wk!=null?k(wk):DASH,tr==null?"views":`${tr>=0?"+":""}${tr}% vs week before`,{icon:tr==null?"":tr>=0?ICO.up():ICO.down(),vc:tr==null?"":tr>=0?"grn":"red",v24:1,sm:1,sc:tr==null?"s13":tr>=0?"grn s13":"s13"}),
    tile("Tests",String(allT.length),open?"Running · no result yet":tests.length?"None running":"None yet",{icon:open?ICO.wait():"",vc:open?"amb":"",v24:1,sm:1,sc:"s13"})]);
  const chart=`<section class="m2-s" style="gap:14px"><div class="m2-sh" style="align-items:center"><h2 class="sm" style="margin:0;font-size:18px;font-weight:700">Views vs. pace</h2>${seg("life",s.life?"true":"false",[["false","First 60 days"],["true","Lifetime"]],"Chart range")}</div>
    <div class="m2-chl"><span><i style="border-top:3px solid #2457C5"></i>Real views</span><span><i style="border-top:2px dashed #1D2329"></i>Goal pace</span><span><i style="border-top:2px dashed #B42318"></i>Checkpoints</span><span><i style="width:10px;height:12px;border:0;border-left:2px solid #1E7B4A;background:#E6F4EC"></i>Test running</span></div>
    <div class="m2-chart" id="m2Chart">${chart2(D,x,s)}<div class="m2-tip" id="m2Tip" hidden></div></div></section>`;
  const gp=s.game,firstDate=rel?fmtD(addD(rel,(+gp.first||1)-1)):"";
  const game=sec(1,"Improvement Plan","CJ · targets for this episode","","",`<div class="m2-gp">
    <div class="m2-gpt"><b>Goal</b><div class="gi"><input type="text" aria-label="Goal views" style="width:104px" value="${fmtN(unN(gp.goal))}" data-k="game.goal" data-rr><span>by day</span><input type="number" aria-label="Goal day" style="width:64px" value="${gp.goalDay}" data-k="game.goalDay" data-rr></div></div>
    <div class="m2-gpt"><b>First decision</b><div class="gi"><span>Day</span><input type="number" aria-label="First decision day" style="width:64px" value="${gp.first}" data-k="game.first" data-rr><span>${firstDate?"· "+firstDate:""}</span></div></div>
    <div class="m2-gpt"><b>Test rhythm</b><div class="gi"><span>Every</span><input type="text" aria-label="Days between tests" style="width:64px" value="${esc(gp.rhythm)}" data-k="game.rhythm"><span>days</span></div></div>
    <div class="m2-gpt"><b>Let go</b><label class="gi" style="min-height:44px;cursor:pointer"><input type="checkbox" data-k="game.letgo" ${gp.letgo?"checked":""}>Stop testing</label></div></div>
    <div class="m2-cps" style="--n:${5+gp.extra.length}">${[1,3,7,14,30].map(n=>`<label>Day ${n} target<input type="text" value="${fmtN(unN(c[n]))}" data-k="game.cps.${n}" data-rr></label>`).join("")}
      ${gp.extra.map((z,i)=>`<label><span class="cpd">Day <input type="number" min="1" aria-label="Checkpoint day" value="${z.day}" data-k="game.extra.${i}.day" data-rr> target</span><input type="text" aria-label="Checkpoint target" value="${esc(z.v)}" data-k="game.extra.${i}.v" data-rr></label>`).join("")}
      <button type="button" class="m2-add" data-act="addcp">+ Checkpoint</button><button type="button" class="m2-btn2" data-act="reset">Reset to baseline</button></div>`);
  /* tests table */
  const cols="40px minmax(0,1fr) 68px 132px 132px 120px 76px 76px 88px 96px 128px";
  const trs=allT.map((T,i)=>{const t=tests[i]||{n:`Test ${i+1}`,start:T.start,end:T.end,tool:T.tool,combos:[],added:true},on=!!s.openT[i];
    const start=T.start!==undefined&&!t.added?T.start:t.start,end=T.end!==undefined&&!t.added?T.end:t.end;
    const sd=start&&rel?dayDiff(start,rel)+1:null,ed=end&&rel?dayDiff(end,rel)+1:null;
    const before=sd?wkGain(D,sd-1):(t.before!=null?+t.before:null);
    const aft=ed?(()=>{const z=wkGain(D,ed+7);return z})():last&&sd&&last.day>sd?wkGain(D,last.day):null;
    const win0=t.win?String(t.win).replace(/^.*\b([A-J])$/,"$1"):null,win=T.win!==undefined?T.win||null:win0,wc=win?(t.combos.find(z=>z.L===win)||{}):{};
    /* CTR after is the winning variation's CTR */
    const wi=win?"ABCDEFGHIJ".indexOf(win):-1,WV=wi>=0?T.vars[wi]||{}:{};
    const ctrB=T.ctrB!==undefined?T.ctrB:t.origCtr!=null?f1(t.origCtr*100)+"%":"",ctrA=WV.ctr!==undefined?WV.ctr:wc.ctr!=null?f1(wc.ctr*100)+"%":"";
    const nv=Math.max(1,Math.min(10,+T.nvar||1)),letters=[..."ABCDEFGHIJ"].slice(0,nv);
    const name=t.added?`Test ${i+1}`:String(t.n||`Test ${i+1}`).replace(/^.*?[–-]\s*/,"").replace(/^t/,"T");
    const head=trow(cols,[{h:`<button type="button" class="m2-chev" aria-label="${on?"Hide":"Show"} ${esc(name)} variations" aria-expanded="${on}" data-act="test" data-i="${i}">${ic(on?"chevd":"chevr",16,"currentColor",null,2.4)}</button>`,c:"in"},
      {h:`<b>${esc(name)}</b><input type="text" aria-label="${esc(name)} brief" placeholder="Add a brief" value="${esc(T.brief)}" data-k="tests.${i}.brief">`,c:"bf"},
      {h:`<input class="m2-in" type="number" min="1" max="10" aria-label="How many variations in ${esc(name)}" value="${T.nvar}" data-k="tests.${i}.nvar" data-rr style="font-weight:600">`,c:"in"},
      {h:`<input class="m2-in" type="date" aria-label="${esc(name)} start" value="${start||""}" data-k="tests.${i}.start" data-rr>`,c:"in"},
      {h:end||T.endOpen?`<input class="m2-in" type="date" aria-label="${esc(name)} end" value="${end||""}" data-k="tests.${i}.end" data-rr>`:`<button type="button" class="m2-chip2" style="cursor:pointer" title="Add an end date" data-act="set" data-k="tests.${i}.endOpen" data-v="true">${ic("wait",13,"currentColor",null,2.2)}Running</button>`,c:"in"},
      {h:`<input class="m2-in" type="text" aria-label="${esc(name)} tool" placeholder="Tool" value="${esc(T.tool!==undefined?T.tool:t.tool||"")}" data-k="tests.${i}.tool">`,c:"in"},
      {h:`<input class="m2-in" type="text" aria-label="${esc(name)} CTR before" placeholder="%" value="${esc(ctrB)}" data-k="tests.${i}.ctrB">`,c:"in"},
      {h:wi>=0?`<input class="m2-in" type="text" aria-label="${esc(name)} CTR after (variation ${win})" placeholder="%" value="${esc(ctrA)}" data-k="tests.${i}.vars.${wi}.ctr">`:`<input class="m2-in" type="text" aria-label="${esc(name)} CTR after" placeholder="Pick a winner" disabled>`,c:"in"},
      before!=null?k(before)+"/wk":DASH,
      aft!=null&&before!=null?`<span class="${aft>=before?"up":"dn"}">${aft>=before?"▲":"▼"} ${k(aft)}/wk</span>`:aft!=null?k(aft)+"/wk":DASH,
      {h:`<select class="m2-in" aria-label="${esc(name)} winner" data-k="tests.${i}.win" data-rr><option value="">Not picked</option>${letters.map(L=>`<option${win===L?" selected":""}>${L}</option>`).join("")}</select>`,c:"in"}],"tst"+(on?" on":""));
    if(!on)return head;
    const vc="84px 120px minmax(0,1fr) 220px 90px 150px",n=Math.max(1,Math.min(10,+T.nvar||1));
    const vrows=[...Array(n)].map((_,vi)=>{const L="ABCDEFGHIJ"[vi],cb=t.combos.find(z=>z.L===L)||{},V=T.vars[vi]||{};
      const tested=V.tested||defTested(i,id),stat=V.status||(win?(win===L?"Winner":"Discarded"):end?"Discarded":"Testing"),ms=`${i}-${vi}`;
      const im=V.img||V.th||cb.th;
      return trow(vc,[{h:`<b>${L}</b>`,c:""},{h:im?`<span class="m2-vimg"><img src="${esc(im)}" alt="Thumbnail ${L}" style="width:72px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block"><input class="m2-in" type="url" aria-label="Image link for ${L}" placeholder="New image link" data-k="tests.${i}.vars.${vi}.img" data-rr></span>`:`<input class="m2-in" type="url" aria-label="Image link for ${L}" placeholder="Image link" data-k="tests.${i}.vars.${vi}.img" data-rr>`,c:"in"},
        {h:`<input class="m2-in" type="text" aria-label="Title ${L}" placeholder="Title" value="${esc(V.title!==undefined?V.title:cb.title||"")}" data-k="tests.${i}.vars.${vi}.title">`,c:"in"},
        {h:`<div class="m2-ms"><button type="button" class="${tested.length?"":"ph"}" aria-haspopup="true" aria-expanded="${s.ms===ms}" data-act="ms" data-m="${ms}">${tested.length?esc(tested.join(", ")):"Choose…"}${ic("chevd",14,"currentColor",null,2.2)}</button>${s.ms===ms?`<div class="m2-msp" role="group" aria-label="What's tested in ${L}">${TESTED.map(o=>`<label><input type="checkbox" data-tested="${i}|${vi}|${o}" ${tested.includes(o)?"checked":""}>${o}</label>`).join("")}</div>`:""}</div>`,c:"in"},
        {h:`<input class="m2-in" type="text" aria-label="CTR ${L}" placeholder="%" value="${esc(V.ctr!==undefined?V.ctr:cb.ctr!=null?f1(cb.ctr*100)+"%":"")}" data-k="tests.${i}.vars.${vi}.ctr">`,c:"in"},
        {h:`<select class="m2-st2 ${stat}" aria-label="Status of ${L}" data-k="tests.${i}.vars.${vi}.status" data-rr>${selOpts(["Testing","Discarded","Winner"],stat)}</select>`,c:"in"}])}).join("");
    return head+`<div class="m2-vars">${tbl(`${name} variations`,vc,["Variation","Thumbnail","Title","What's tested","CTR","Status"],vrows,`<button type="button" class="m2-add" data-act="addvar" data-i="${i}"${n>=10?" disabled":""}>+ Add variation</button>`,"open")}</div>`}).join("");
  const testsSec=sec(2,"Tests","Open a test to see its variations.","","tests",`<div class="m2-tbl m2-tt open" role="table" aria-label="Tests"><div class="m2-tr hd" role="row" style="--cols:${cols};border-radius:12px 12px 0 0">${["<span style=\"position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)\">Open</span>","Test brief","Variations","Start","End","Tool","CTR before","CTR after","Views before","Views after","Winner"].map(h=>`<span role="columnheader">${h}</span>`).join("")}</div>${trs||`<div class="m2-empty">No tests logged yet.</div>`}<div class="m2-tf" style="border-radius:0 0 12px 12px"><button type="button" class="m2-add" data-act="addtest">+ Add test</button></div></div>`);
  return row+chart+game+testsSec}
/* views vs pace chart, drawn at its real width */
function chart2(D,x,s){
  const W=Math.max(320,(($("m2B")&&$("m2B").clientWidth)||1200)-160),H=W<640?240:300,L=56,R=24,Tp=36,Bt=28,maxD=D.days.length?D.days[D.days.length-1].day:1;
  const X=Math.max(30,s.life?maxD:Math.min(60,Math.max(maxD,30))),pts=D.days.filter(z=>z.day<=X);
  if(!pts.length)return `<p class="m2-st" style="padding:24px 12px">Daily views start the day after release.</p>`;
  const raw=Math.max(...pts.map(z=>z.to),paceG(s,X))*1.05,mag=10**Math.floor(Math.log10(raw/6)),stp=[1,2,2.5,5,10].map(m=>m*mag).find(z=>Math.ceil(raw/z)<=6),nL=Math.ceil(raw/stp),ymax=stp*nL;
  const xs=n=>L+n/X*(W-L-R),ys=v=>Tp+(1-v/ymax)*(H-Tp-Bt),F='font-family="Inter, system-ui, sans-serif"';
  let g="";
  for(let i=0;i<=nL;i++){const v=stp*i;g+=`<line x1="${L}" x2="${W-R}" y1="${ys(v)}" y2="${ys(v)}" stroke="#EEF0F3"/><text x="${L-8}" y="${ys(v)+4}" text-anchor="end" font-size="11" fill="#5A626C" ${F}>${v?k(v):"0"}</text>`}
  const step=X<=60?(X<=30?7:15):30,ticks=[0];for(let t=step;t<=X;t+=step)ticks.push(t);
  g+=ticks.map(t=>`<text x="${xs(t)}" y="${H-8}" text-anchor="middle" font-size="11" fill="#5A626C" ${F}>${t===0?"Day 0":t}</text>`).join("");
  for(const t of D.tests.filter(t=>t.start)){const n=dayDiff(t.start,x.rel)+1,m=t.end?dayDiff(t.end,x.rel)+1:maxD;if(n<1||n>X)continue;const w=Math.max(3,xs(Math.min(m,X))-xs(n));
    g+=`<rect x="${xs(n)}" y="${Tp}" width="${w}" height="${H-Tp-Bt}" fill="#E6F4EC"/><line x1="${xs(n)}" x2="${xs(n)}" y1="${Tp}" y2="${H-Bt}" stroke="#1E7B4A" stroke-width="2"/><text x="${Math.min(xs(n)-4,W-R-4)}" y="${Tp-10}" text-anchor="end" font-size="11" font-weight="700" fill="#1A6B40" ${F}>${esc(String(t.n||"Test").replace(/^.*?[–-]\s*/,"").replace(/^t/,"T"))} · ${fmtD(t.start)}</text>`}
  let lastX=-99,row=0;
  for(const n of [7,14,30].filter(n=>n<=X)){const xx=xs(n);row=xx-lastX<40?(row+1)%2:0;lastX=xx;g+=`<line x1="${xx}" x2="${xx}" y1="${Tp-4+row*12}" y2="${H-Bt}" stroke="#B42318" stroke-width="1.4" stroke-dasharray="4 4"/><text x="${xx}" y="${Tp-10+row*12}" text-anchor="middle" font-size="11" font-weight="700" fill="#B42318" ${F}>D${n}</text>`}
  const pp=[];for(let n=0;n<=X;n++)pp.push(`${xs(n).toFixed(1)},${ys(paceG(s,n)).toFixed(1)}`);
  g+=`<polyline points="${pp.join(" ")}" fill="none" stroke="#1D2329" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  const gd=+s.game.goalDay||30,gv=unN(s.game.goal)||100000;if(gd<=X)g+=`<circle cx="${xs(gd)}" cy="${ys(gv)}" r="3.5" fill="#1D2329"/><text x="${xs(gd)+6}" y="${ys(gv)+16}" font-size="11" fill="#1D2329" ${F}>${k(gv)} goal</text>`;
  g+=`<polyline points="${[[0,0],...pts.map(z=>[z.day,z.to])].map(([d,v])=>`${xs(d).toFixed(1)},${ys(v).toFixed(1)}`).join(" ")}" fill="none" stroke="#2457C5" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  const lp=pts[pts.length-1];g+=`<circle cx="${xs(lp.day)}" cy="${ys(lp.to)}" r="4.5" fill="#2457C5" stroke="#fff" stroke-width="2"/><text x="${Math.min(xs(lp.day),W-R-30)}" y="${ys(lp.to)-10}" text-anchor="middle" font-size="12" font-weight="700" fill="#2457C5" stroke="#fff" stroke-width="3" paint-order="stroke" ${F}>${k(lp.to)}</text>`;
  g+=`<line id="m2Cur" x1="0" x2="0" y1="${Tp}" y2="${H-Bt}" stroke="#C9CED5" visibility="hidden"/>`;
  chart2.geo={X,L,R,W};
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Views to date against the goal pace, with checkpoints and tests">${g}</svg>`}
function wireChart2(D,x,s){const box=$("m2Chart");if(!box)return;const svg=box.querySelector("svg"),tip=$("m2Tip"),cur=$("m2Cur");if(!svg||!chart2.geo)return;const {X,L,R,W}=chart2.geo;
  svg.addEventListener("mousemove",ev=>{const r=svg.getBoundingClientRect(),sx=(ev.clientX-r.left)/r.width*W,n=Math.max(1,Math.min(X,Math.round((sx-L)/(W-L-R)*X)));
    const z=D.days.find(q=>q.day===n),xx=L+n/X*(W-L-R),p=paceG(s,n);cur.setAttribute("x1",xx);cur.setAttribute("x2",xx);cur.setAttribute("visibility","visible");
    tip.innerHTML=`<b>Day ${n}${x.rel?" · "+fmtD(addD(x.rel,n-1)):""}</b><div><span>Views</span><span>${z?k(z.to):"–"}</span></div><div><span>Goal pace</span><span>${k(Math.round(p))}</span></div><div><span>Of pace</span><span>${z?Math.round(z.to/p*100)+"%":"–"}</span></div>`;
    tip.hidden=false;const bw=box.clientWidth,tw=tip.offsetWidth,px=xx/W*r.width;tip.style.left=Math.max(6,Math.min(bw-tw-6,px-tw/2))+"px"});
  svg.addEventListener("mouseleave",()=>{tip.hidden=true;cur.setAttribute("visibility","hidden")})}
addEventListener("resize",()=>{clearTimeout(wireChart2.t);wireChart2.t=setTimeout(()=>{if(M.id&&st(EPREC[M.id].rid).tab==="testing")mRender()},200)});

/* ---------- comments footer (Airtable record comments on the episode) ---------- */
function tFoot(D,s){const cs=[...(D&&D.comments||[]),...s.cm.local],n=cs.length,loading=!D;
  const panel=s.cm.open?`<div class="m2-fp"><div class="m2-fph"><button type="button" aria-haspopup="true">All comments ${ic("chevd",14,"currentColor",null,2.2)}</button><div class="ic"><button type="button" aria-label="Search comments">${ic("search",16)}</button><button type="button" aria-label="Notifications">${ic("bell",16)}</button><button type="button" aria-label="Close comments" data-act="cm">${ic("x",16)}</button></div></div>
    <div class="m2-fpl">${n?cs.map(c=>`<div class="m2-cm${c.mine?" local":""}"><span class="m2-fav" aria-hidden="true">${esc((c.by||"?").trim().slice(0,1).toUpperCase())}</span><div><span class="w"><b>${esc(c.by||"Someone")}</b> · ${c.at?fmtD(String(c.at).slice(0,10)):""}${c.pending?" · <em>sending…</em>":c.failed?" · <em class=\"bad\">couldn't send</em>":""}</span><p>${c.html}</p></div></div>`).join(""):
      `<div class="m2-fpe"><span class="ci">${ic("chat",20,"currentColor",null,2)}</span><b>Start a conversation</b><span>Ask questions and work it out with your team, right here.</span></div>`}</div></div>`:"";
  return panel+`<div class="m2-fb"><span class="m2-fav" aria-hidden="true">${ic("person",15,"currentColor",null,2)}</span><input type="text" id="m2Cm" aria-label="Add a comment" placeholder="Add a comment… type @ to tag someone" value="${esc(s.cm.draft)}" data-k="cm.draft">
    <button type="button" class="m2-fbt" aria-expanded="${s.cm.open}" data-act="cm">${ic("chat",15,"currentColor",null,2)}${s.cm.open?"Hide comments":loading?"Comments":n?pl(n,"comment"):"No comments yet"}</button></div>`}
/* deep links from Slack: #ep=<episode>&tab=<tab> (Slack can turn the & into &amp;) */
if(/^#ep=/.test(location.hash)){const p=new URLSearchParams(location.hash.slice(1).replace(/&amp;/g,"&"));const id=p.get("ep"),tb=p.get("tab");setTimeout(()=>{if(EPREC[id])mOpen(id,TABS.some(z=>z[0]===tb)?tb:undefined)},800)}
