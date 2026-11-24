<script>
/* ---------- Finance tab v2 (Karen, 24 Nov 2026; Kash's link only; a mockup until Karen approves it) ----------
   From Karen's Airtable "PNL Overview" (Finance interface): the same numbers, cleaner, and one click from any month to its details.
   - Two P&Ls, one at a time (the two cards at the top switch): Rise Voice (Airtable: Revenue tracker + Invoices, in £) and the
     Podcast (the accountant's monthly workbook in Drive, in US$ as the accountant keeps it; £ at the workbook's own 0.75 rate).
   - The numbers that matter: this month and the whole year (Rise Voice), the latest month and the year so far (Podcast).
   - One chart: revenue and profit/loss for every month, the amount on every bar; profit in traffic-light colours (green: a
     profit with a 10%+ margin, amber: a thinner profit, red: a loss); forecast months hatched.
   - Every month in a table, with the year's totals.
   - Clicking a month (its bars or its row) opens it on the side: the month's P&L, collection, clients and churn, biggest
     clients, the tracker's finance notes (PNL Notes), admin notes and sales target, and only the invoices behind that month's
     revenue (the part of each invoice counted that month; they add up to the month's revenue). Podcast: where the money went
     and every transaction behind the month.
   Numbers are the tracker's own (they match the Airtable dashboard to the penny). Data: window.FIN_DATA (a snapshot for the
   mockup; a feed when it goes live). ---------- */
(()=>{
const D=window.FIN_DATA;if(!D)return;
const q=id=>document.getElementById(id);
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],ML=["January","February","March","April","May","June","July","August","September","October","November","December"];
const mi=k=>+k.slice(5,7)-1,mS=k=>MS[mi(k)],mN=k=>ML[mi(k)],mL=k=>mN(k)+" "+k.slice(0,4);
const prevKey=k=>{const y=+k.slice(0,4),m=+k.slice(5,7);return m===1?(y-1)+"-12":y+"-"+String(m-1).padStart(2,"0")};
const SYM={rv:"£",pod:"$"};
/* money: whole units ("£42,415"); {k:1} compact ("£42.4k"); {c:1} with pence (podcast transactions); {sym:"£"} another currency */
function fmt(n,b,o){o=o||{};n=+n||0;const s=o.sym||SYM[b],a=Math.abs(n),sg=n<=-0.005&&(o.c||n<=-0.5)?"−":(o.plus&&n>=0.5?"+":"");
  if(o.c)return sg+s+a.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
  if(o.k){if(a>=1e6)return sg+s+(a/1e6).toFixed(1).replace(/\.0$/,"")+"M";if(a>=1e4)return sg+s+Math.round(a/1e3)+"k";if(a>=1e3)return sg+s+(a/1e3).toFixed(1).replace(/\.0$/,"")+"k";return sg+s+Math.round(a)}
  return sg+s+Math.round(a).toLocaleString("en-GB")}
const inGBP=n=>fmt(n*D.pod.rate,"pod",{sym:"£"});
const pct=x=>x==null||!isFinite(x)?"":(Math.round(x*100)<0?"−":"")+Math.abs(Math.round(x*100))+"%";
const chg=(a,b)=>b?(a-b)/Math.abs(b):null;
const chgS=x=>x==null||!isFinite(x)?"":(x>=0.005?"▲ ":x<=-0.005?"▼ ":"")+Math.abs(Math.round(x*100))+"%";
const day=d=>d?(+d.slice(8,10))+" "+MS[+d.slice(5,7)-1]+(d.slice(0,4)!==D.at.slice(0,4)?" "+d.slice(0,4):""):"no date";
const sum=(L,f)=>L.reduce((a,x)=>a+(+(f?f(x):x)||0),0);
/* traffic lights: green = a profit with a 10%+ margin, amber = a thinner profit (or breaking even), red = a loss */
const tone=(p,r)=>Math.abs(p)<0.5&&Math.abs(r)<0.5?"none":p<=-0.5?"loss":(r>0?p/r:0)<0.10?"thin":"good";
const mgn=(p,r)=>r>0&&Math.abs(p/r)<=1?`${pct(p/r)} margin`:"";
const TT={good:"profit, 10%+ margin",thin:"profit under 10% margin",loss:"loss",none:"no activity"};
const ST={"Collected":"good","To Collect":"thin","Past Due":"loss","Refunded":"none","Uncollectible":"none"};
const BIZ={rv:{name:"Rise Voice"},pod:{name:"Podcast"}};
const ALL=b=>b==="rv"?D.rv.months:D.pod.months;
const YEARS=[...new Set(D.rv.months.map(m=>m.key.slice(0,4)))].sort().reverse();
const NOWK=D.at.slice(0,7);
const CY=YEARS.includes(NOWK.slice(0,4))?NOWK.slice(0,4):YEARS[0];
const S={biz:"rv",year:CY,open:null,only:false,more:{},back:null};
const MO=b=>b==="rv"?D.rv.months.filter(m=>m.key.slice(0,4)===S.year):D.pod.months;
const DM=(b,k)=>b==="rv"?D.rv.months.filter(m=>m.key.slice(0,4)===k.slice(0,4)):D.pod.months;  /* the months a side panel steps through: the opened month's year */
const find=(b,k)=>ALL(b).find(m=>m.key===k);
const prevM=(b,k)=>{const L=ALL(b),i=L.findIndex(m=>m.key===k);return i>0?L[i-1]:null};
const isFc=m=>m.status!=="Actual";
const tot=L=>({rev:sum(L,m=>m.rev),col:sum(L,m=>m.col),tocol:sum(L,m=>m.tocol),pastdue:sum(L,m=>m.pastdue),costs:sum(L,m=>m.costs),profit:sum(L,m=>m.profit),cprofit:sum(L,m=>m.cprofit),churn:sum(L,m=>m.churn)});

/* ---- one row: two tabs, Rise Voice and Podcast ---- */
function tabsH(){return `<div class="fx-tabs" role="tablist" aria-label="P&L">${["rv","pod"].map(b=>`<button type="button" role="tab" class="fx-tab" id="fxTab-${b}" data-fx="biz" data-v="${b}" aria-selected="${S.biz===b}" aria-controls="fxPanel" tabindex="${S.biz===b?0:-1}">${e(BIZ[b].name)}</button>`).join("")}</div>`}

/* ---- the numbers that matter ---- */
const kpi=(lab,val,sub,cls,act)=>`<div class="fx-k">${act?`<button type="button" ${act}>`:""}<span class="fx-kl">${lab}</span><span class="fx-kv ${cls||""}">${val}</span><span class="fx-ks">${sub||"&nbsp;"}</span>${act?"</button>":""}</div>`;
const grp=(title,right,inner)=>`<div class="fx-kg"><div class="fx-kgh"><h4>${title}</h4>${right||""}</div><div class="fx-kr">${inner}</div></div>`;
function kpisH(b){
  if(b==="rv"){const L=D.rv.months.filter(m=>m.key.slice(0,4)===CY),cur=find("rv",NOWK),T=tot(L),late=D.rv.late.filter(x=>x.m.slice(0,4)===CY);let h="";
    if(cur){const p=prevM("rv",cur.key),t=tone(cur.profit,cur.rev);
      h+=grp(`This month · ${e(mL(cur.key))}`,`<button type="button" class="fx-link" data-fx="open" data-m="${cur.key}">Open ${e(mN(cur.key))} →</button>`,
        kpi("Revenue",e(fmt(cur.rev,b)),p?`${e(mS(p.key))} ${e(fmt(p.rev,b))} · ${e(chgS(chg(cur.rev,p.rev)))}`:"")+
        kpi("Profit",e(fmt(cur.profit,b)),[mgn(cur.profit,cur.rev),p?`${e(mS(p.key))} ${e(fmt(p.profit,b))}`:""].filter(Boolean).join(" · "),"tl-"+t)+
        kpi("Collected profit",e(fmt(cur.cprofit,b)),`Collected ${e(fmt(cur.col,b))}`,cur.cprofit<=-0.5?"neg":"")+
        kpi("Past due",e(fmt(cur.pastdue,b)),"",cur.pastdue>=0.5?"neg":""))}
    h+=grp(`${CY} · all months`,"",
      kpi("Collected revenue",e(fmt(T.col,b)),`Revenue ${e(fmt(T.rev,b))}`)+
      kpi("Collected profit",e(fmt(T.cprofit,b)),[`Profit ${e(fmt(T.profit,b))}`,mgn(T.profit,T.rev)].filter(Boolean).join(" · "),T.cprofit<=-0.5?"neg":"")+
      kpi("Past due",e(fmt(T.pastdue,b)),late.length?`${late.length} invoice${late.length===1?"":"s"} · See which →`:"",T.pastdue>=0.5?"neg":"",late.length?`data-fx="late" data-v="${CY}" aria-label="Past due ${e(fmt(T.pastdue,b))}: see the ${late.length} invoices"`:""));
    return `<div class="fx-kpis${cur?"":" one"}">${h}</div>`}
  const L=D.pod.months,cur=L[L.length-1],p=prevM("pod",cur.key),T=tot(L),cs=D.pod.cats.filter(c=>c.kind==="cost").map(c=>[c,sum(L,m=>m.cat[c.k])]).sort((a,c)=>c[1]-a[1])[0];
  return `<div class="fx-kpis">${grp(`Latest month · ${e(mL(cur.key))}`,`<button type="button" class="fx-link" data-fx="open" data-m="${cur.key}">Open ${e(mN(cur.key))} →</button>`,
      kpi("Revenue",e(fmt(cur.rev,b)),p?`${e(mS(p.key))} ${e(fmt(p.rev,b))} · ${e(chgS(chg(cur.rev,p.rev)))}`:"")+
      kpi("Costs",e(fmt(cur.costs,b)),p?`${e(mS(p.key))} ${e(fmt(p.costs,b))} · ${e(chgS(chg(cur.costs,p.costs)))}`:"")+
      kpi("Profit / loss",e(fmt(cur.profit,b)),`≈ ${e(inGBP(cur.profit))}`,"tl-"+tone(cur.profit,cur.rev)))+
    grp(`2026 so far · ${e(mS(L[0].key))}–${e(mS(cur.key))}`,"",
      kpi("Revenue",e(fmt(T.rev,b)),`YouTube ${e(fmt(sum(L,m=>m.cat.yt),b))} · other ${e(fmt(sum(L,m=>m.cat.share),b))}`)+
      kpi("Costs",e(fmt(T.costs,b)),cs?`Biggest: ${e(cs[0].name.replace(/ \(.*\)$/,"").toLowerCase())} ${e(fmt(cs[1],b))}`:"")+
      kpi("Profit / loss",e(fmt(T.profit,b)),`≈ ${e(inGBP(T.profit))}`,"tl-"+tone(T.profit,T.rev)))}</div>`}

/* ---- the chart: revenue (top) and profit/loss (below) for the same months; a month is one button ---- */
const G=58,T1=26,H1=150,T2=34,H2=150,XL=26,PT=18,PB=18;
function niceStep(r){const raw=(r||1)/3,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
const two=(v,b)=>`<span class="f">${e(fmt(v,b))}</span><span class="c">${e(fmt(v,b,{k:1}))}</span>`;
const ariaM=(b,m)=>`${mL(m.key)}${isFc(m)?", forecast":""}: revenue ${fmt(m.rev,b)}, costs ${fmt(m.costs,b)}, ${m.profit<=-0.5?"loss":"profit"} ${fmt(m.profit,b)}${mgn(m.profit,m.rev)?` (${mgn(m.profit,m.rev)})`:""}. Open the month.`;
function chartH(b){const L=MO(b);if(!L.length)return "";
  const rtop=Math.max(1,...L.map(m=>m.rev)),rs=niceStep(rtop);
  const pmx=Math.max(0,...L.map(m=>m.profit)),pmn=Math.min(0,...L.map(m=>m.profit)),ps=niceStep(pmx-pmn);
  let ptop=pmx,pbot=pmn;if(ptop-pbot<1)ptop=1;
  const y1=v=>v/rtop*(H1-PT),y2=v=>PB+(v-pbot)/(ptop-pbot)*(H2-PT-PB),O2=H1+T2,z=y2(0);
  const ticks=(lo,hi,st)=>{const t=[];for(let v=Math.ceil(lo/st-1e-9)*st,i=0;v<=hi+st/1e6&&i<12;i++,v+=st)t.push(Math.abs(v)<st/1e6?0:v);return t};
  const grid=ticks(0,rtop,rs).map(v=>`<div class="fx-gl" style="top:${(T1+H1-y1(v)).toFixed(1)}px"><span>${e(fmt(v,b,{k:1}))}</span></div>`).join("")
    +ticks(pbot,ptop,ps).map(v=>`<div class="fx-gl${Math.abs(v)<1e-9?" z":""}" style="top:${(T1+O2+H2-y2(v)).toFixed(1)}px"><span>${e(fmt(v,b,{k:1}))}</span></div>`).join("");
  const cols=L.map(m=>{const fc=isFc(m),t=tone(m.profit,m.rev),hr=m.rev>=0.5?Math.max(2,y1(m.rev)):0,yp=y2(m.profit),up=m.profit>=0,on=!!(S.open&&!S.open.late&&S.open.b===b&&S.open.k===m.key);
    const pt=up?O2+H2-yp:O2+H2-z,ph=Math.abs(m.profit)>=0.5?Math.max(2,Math.abs(yp-z)):0;
    return `<button type="button" class="fx-col${fc?" fc":""}${on?" on":""}${b==="rv"&&m.key===NOWK?" now":""}" data-fx="open" data-m="${m.key}" aria-label="${e(ariaM(b,m))}">
      ${hr?`<span class="fx-bar rev" style="top:${(H1-hr).toFixed(1)}px;height:${hr.toFixed(1)}px"></span>`:""}<span class="fx-v${m.rev<0.5?" zero":""}" style="top:${(H1-hr-17).toFixed(1)}px">${two(m.rev,b)}</span>
      ${ph?`<span class="fx-bar tl-${t}${up?"":" dn"}" style="top:${pt.toFixed(1)}px;height:${ph.toFixed(1)}px"></span>`:""}<span class="fx-v${m.profit<=-0.5?" neg":""}" style="top:${(up?O2+H2-yp-17:O2+H2-yp+3).toFixed(1)}px">${two(m.profit,b)}</span>
      <span class="fx-xl" style="top:${O2+H2}px">${e(mS(m.key))}</span></button>`}).join("");
  const yrs=b==="rv"?YEARS:[D.pod.months[0].key.slice(0,4)];
  return `<div class="fx-card"><div class="fx-ch"><h4>By month</h4><div class="fx-seg" role="group" aria-label="Year">${yrs.map(y=>`<button type="button" data-fx="year" data-v="${y}" aria-pressed="${b!=="rv"||y===S.year}">${y}</button>`).join("")}</div></div>
   <div class="fx-cw"><div class="fx-pl" id="fxPlot" style="height:${T1+H1+T2+H2+XL}px">
    <div class="fx-lh" style="top:0;height:${T1}px"><b>Revenue</b><span class="fx-lg">${L.some(isFc)?`<span><i class="fx-sw fc"></i>Forecast</span>`:""}</span></div>
    <div class="fx-lh" style="top:${T1+H1+4}px;height:${T2-4}px"><b>Profit / loss</b><span class="fx-lg"><span><i class="fx-sw tl-good"></i>Profit, 10%+ margin</span><span><i class="fx-sw tl-thin"></i>Profit under 10%</span><span><i class="fx-sw tl-loss"></i>Loss</span></span></div>
    ${grid}<div class="fx-cols" role="group" aria-label="Months" style="top:${T1}px">${cols}</div><div class="fx-tip" id="fxTip" role="tooltip" hidden></div>
   </div></div></div>`}

/* ---- every month in a table (the chart's table view, and another way in) ---- */
function tableH(b){const L=MO(b),T=tot(L),rv=b==="rv";
  const pf=(v,r)=>{const t=tone(v,r);return `<span class="fx-pf tl-${t}"><i aria-hidden="true"></i>${e(fmt(v,b))}<span class="fx-vh"> (${TT[t]})</span></span>`};
  const nv=(v,o)=>`<span class="${v<=-0.5?"neg":""}">${e(fmt(v,b,o))}</span>`;
  const head=rv?["Month","Revenue","Collected","To collect","Costs","Profit","Collected profit","Clients lost"]:["Month","Revenue","Costs","Profit / loss","Profit / loss in £"];
  const cells=m=>rv?[e(fmt(m.rev,b)),e(fmt(m.col,b)),e(fmt(m.tocol,b)),e(fmt(m.costs,b)),pf(m.profit,m.rev),nv(m.cprofit),String(m.churn||0)]:[e(fmt(m.rev,b)),e(fmt(m.costs,b)),pf(m.profit,m.rev),nv(m.profit*D.pod.rate,{sym:"£"})];
  const rows=L.map(m=>{const fc=isFc(m),now=rv&&m.key===NOWK,on=!!(S.open&&!S.open.late&&S.open.b===b&&S.open.k===m.key);
    return `<tr class="${fc?"fc":""}${on?" on":""}" data-fx="open" data-m="${m.key}"><th scope="row"><button type="button" class="fx-mb" data-fx="open" data-m="${m.key}">${e(mN(m.key))}</button>${now?`<span class="fx-tag now">This month</span>`:""}${fc?`<span class="fx-tag">Forecast</span>`:""}</th>${cells(m).map(c=>`<td>${c}</td>`).join("")}</tr>`}).join("");
  const foot=rv?[e(fmt(T.rev,b)),e(fmt(T.col,b)),e(fmt(T.tocol,b)),e(fmt(T.costs,b)),pf(T.profit,T.rev),nv(T.cprofit),String(T.churn)]:[e(fmt(T.rev,b)),e(fmt(T.costs,b)),pf(T.profit,T.rev),nv(T.profit*D.pod.rate,{sym:"£"})];
  return `<div class="fx-card fx-tc"><div class="fx-tw"><table class="fx-t${rv?"":" pod"}"><caption class="fx-vh">${e(BIZ[b].name)} P&amp;L by month</caption>
   <thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody>
   <tfoot><tr><th scope="row">${rv?S.year+" total":"Total so far"}</th>${foot.map(c=>`<td>${c}</td>`).join("")}</tr></tfoot></table></div></div>`}

function panelH(){const b=S.biz;return kpisH(b)+chartH(b)+tableH(b)}
function render(){const v=q("finBody");if(!v)return;
  v.innerHTML=tabsH()+`<div id="fxPanel" role="tabpanel" aria-labelledby="fxTab-${S.biz}">${panelH()}</div><div class="fx-scrim" id="fxScrim" data-fx="close" hidden></div><div class="fx-dr" id="fxDr" role="dialog" aria-modal="true" aria-labelledby="fxDT" hidden></div>`}

/* ---- a month, on the side ---- */
const md=s=>{const bold=t=>t.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");let h="",li=false;
  for(const ln of e(s).replace(/\\-/g,"-").split("\n")){const t=ln.trim();
    if(/^[-•]\s*\S/.test(t)){if(!li){h+="<ul>";li=true}h+=`<li>${bold(t.replace(/^[-•]\s*/,""))}</li>`}
    else{if(li){h+="</ul>";li=false}if(t)h+=`<p>${bold(t)}</p>`}}
  return h+(li?"</ul>":"")};
function noteH(title,text,id,none){if(!text)return `<div class="fx-nb"><h5>${title}</h5><p class="fx-none">${none}</p></div>`;
  const long=text.length>520||text.split("\n").length>9;
  return `<div class="fx-nb"><h5>${title}</h5><div class="fx-nt${long&&!S.more[id]?" clamp":""}">${md(text)}</div>${long?`<button type="button" class="fx-link" data-fx="more" data-v="${id}" aria-expanded="${!!S.more[id]}">${S.more[id]?"Show less":"Show all"}</button>`:""}</div>`}
const srow=(lab,val,cls,small)=>`<div class="fx-sr ${cls||""}"><span>${lab}</span><b>${val}</b>${small?`<small>${small}</small>`:""}</div>`;
function hdrH(b,m){const L=DM(b,m.key),i=L.findIndex(x=>x.key===m.key);
  return `<div class="fx-dh"><div class="fx-dnav"><button type="button" data-fx="step" data-v="-1" aria-label="Previous month"${i>0?"":" disabled"}>‹</button><button type="button" data-fx="step" data-v="1" aria-label="Next month"${i>=0&&i<L.length-1?"":" disabled"}>›</button></div>
   <div class="fx-dt"><h3 id="fxDT" tabindex="-1">${e(mL(m.key))}</h3><p>${e(BIZ[b].name)} · ${isFc(m)?`<span class="fx-tag">Forecast</span>`:"Actual"}</p></div>
   <button type="button" class="fx-x" data-fx="close" aria-label="Close">✕</button></div>`}
function rvMonthH(m){const b="rv",p=prevM(b,m.key),t=tone(m.profit,m.rev),I=D.rv.invoices,its=m.items.map(x=>Object.assign({},I[x.id]||{},x));
  const np=its.filter(x=>x.status==="To Collect"||x.status==="Past Due"),still=Math.max(0,m.tocol-m.pastdue),whole=Math.max(1,m.col+m.tocol);
  const nNotes=[m.pnl,m.admin,m.target,m.why,m.ap].filter(Boolean).length;
  const seg=(v,c,l)=>v>=0.5?`<i class="tl-${c}" style="width:${(v/whole*100).toFixed(2)}%" title="${e(l)}: ${e(fmt(v,b))}"></i>`:"";
  const by={};its.forEach(x=>{const k=x.payer||x.n||"Invoice";by[k]=(by[k]||0)+x.part});const top=Object.entries(by).sort((a,c)=>c[1]-a[1]).slice(0,5),tmax=top.length?top[0][1]:1;
  const rs=Object.entries(m.reasons||{}).sort((a,c)=>c[1]-a[1]);
  const row=x=>{const split=x.amt&&Math.abs(x.amt-x.part)>0.5,st=x.status||"No status";
    return `<li class="fx-ir"><div class="fx-ic"><b>${e(x.payer||x.n||"Invoice")}</b><small>${e([x.type||"Invoice","due "+day(x.due),x.sw&&x.sw!=="Not Paying"?x.sw:"",split?`${x.kind==="roll"?"the rest of a":"part of a"} ${fmt(x.amt,b)} invoice`:""].filter(Boolean).join(" · "))}</small></div><span class="fx-is tl-${ST[st]||"none"}"><i aria-hidden="true"></i>${e(st)}</span><b class="fx-ia">${e(fmt(x.part,b))}</b></li>`};
  const L=S.only?np:its,A=L.filter(x=>x.kind!=="roll"),R=L.filter(x=>x.kind==="roll");
  const ig=(title,G)=>G.length?`<div class="fx-ig"><h5>${title}<span>${e(fmt(sum(G,x=>x.part),b))} · ${G.length} invoice${G.length===1?"":"s"}</span></h5><ul class="fx-il">${G.slice().sort((a,c)=>c.part-a.part).map(row).join("")}</ul></div>`:"";
  return hdrH(b,m)+`<div class="fx-db" id="fxDB">
   <nav class="fx-jump" aria-label="In this month"><button type="button" data-fx="jump" data-v="fxS1">Summary</button><button type="button" data-fx="jump" data-v="fxS2">Notes${nNotes?`<b>${nNotes}</b>`:""}</button><button type="button" data-fx="jump" data-v="fxS3">Invoices<b>${its.length}</b></button></nav>
   <div class="fx-ds" id="fxS1"><div class="fx-st">
     ${srow("Revenue",e(fmt(m.rev,b)),"",p?`${e(mN(p.key))}: ${e(fmt(p.rev,b))} · ${e(chgS(chg(m.rev,p.rev)))}`:"")}
     ${srow("Costs",e(fmt(-m.costs,b)),"",p?`${e(mN(p.key))}: ${e(fmt(-p.costs,b))}`:"")}
     ${srow("Profit",e(fmt(m.profit,b)),"tot tl-"+t,[mgn(m.profit,m.rev)||TT[t],p?`${e(mN(p.key))}: ${e(fmt(p.profit,b))}`:""].filter(Boolean).join(" · "))}
     ${srow("Collected profit",e(fmt(m.cprofit,b)),m.cprofit<=-0.5?"vneg":"","Collected revenue minus costs")}</div>
    <div class="fx-sub"><h5>Collection</h5><span>${pct(m.rev?m.col/m.rev:0)} of the revenue collected</span></div>
    <div class="fx-cb" role="img" aria-label="Collected ${e(fmt(m.col,b))}, still to collect ${e(fmt(still,b))}, past due ${e(fmt(m.pastdue,b))}">${seg(m.col,"good","Collected")}${seg(still,"thin","Still to collect")}${seg(m.pastdue,"loss","Past due")}</div>
    <ul class="fx-cl"><li class="tl-good"><i></i>Collected <b>${e(fmt(m.col,b))}</b></li><li class="tl-thin"><i></i>Still to collect <b>${e(fmt(still,b))}</b></li><li class="tl-loss"><i></i>Past due <b>${e(fmt(m.pastdue,b))}</b></li></ul>
    <div class="fx-sub"><h5>Clients</h5></div>
    <div class="fx-cli"><div><b>${e(String(Math.round((m.paying||0)*10)/10))}</b><span>paying clients</span></div><div><b>${m.churn||0}</b><span>lost this month</span></div></div>
    ${m.lost&&m.lost.length?`<p class="fx-lost"><span class="fx-kl">Lost</span>${m.lost.map(e).join(", ")}</p>`:""}${rs.length?`<div class="fx-rs" aria-label="Why they left">${rs.map(([r,n])=>`<span>${e(r)}${n>1?` ×${n}`:""}</span>`).join("")}</div>`:""}
    <div class="fx-sub"><h5>Biggest clients this month</h5><span>${top.length?pct(sum(top,x=>x[1])/(m.rev||1))+" of the revenue":""}</span></div>
    ${top.length?`<ul class="fx-hb">${top.map(([n,v])=>`<li><span class="n">${e(n)}</span><span class="t"><i style="width:${(v/tmax*100).toFixed(1)}%"></i></span><b>${e(fmt(v,b))}</b><small>${pct(v/(m.rev||1))}</small></li>`).join("")}</ul>`:`<p class="fx-none">No invoices count in this month.</p>`}
   </div>
   <div class="fx-ds" id="fxS2"><h4>Notes</h4>
    ${noteH("Finance notes",m.pnl,"pnl","No finance notes for this month.")}
    ${noteH("Admin notes",m.admin,"admin","No admin notes for this month.")}
    ${m.target?noteH("Sales target",m.target,"target",""):""}${m.why?noteH("Why this churn?",m.why,"why",""):""}${m.ap?noteH("Churn action plan for next month",m.ap,"ap",""):""}
   </div>
   <div class="fx-ds" id="fxS3"><h4>Invoices behind ${e(mN(m.key))}'s revenue</h4>
    <p class="fx-hint">Each invoice counts for the part of it that falls in ${e(mN(m.key))}: a retainer is spread over the days it covers, and the rest moves into the next month. Together they make the month's revenue.</p>
    <div class="fx-chips" role="group" aria-label="Show"><button type="button" data-fx="only" data-v="0" aria-pressed="${!S.only}">All<b>${its.length}</b></button><button type="button" data-fx="only" data-v="1" aria-pressed="${S.only}">Not paid yet<b>${np.length}</b></button></div>
    ${ig("Invoiced in "+e(mN(m.key)),A)}${ig("Carried over from "+e(mN(prevKey(m.key))),R)}
    ${L.length?"":`<p class="fx-none">${S.only?"Every invoice behind this month is paid.":"No invoices count in this month."}</p>`}
    <div class="fx-tot"><span>${S.only?"Not paid yet":"Total: "+e(mN(m.key))+"'s revenue"}</span><b>${e(fmt(S.only?sum(np,x=>x.part):m.rev,b))}</b></div>
   </div></div>`}
function podMonthH(m){const b="pod",p=prevM(b,m.key),t=tone(m.profit,m.rev),C=D.pod.cats,tx=D.pod.tx.filter(x=>x.d.slice(0,7)===m.key),notes=(D.pod.notes||{})[m.key]||[];
  const costs=C.filter(c=>c.kind==="cost"&&m.cat[c.k]>=0.005).sort((a,c)=>m.cat[c.k]-m.cat[a.k]),revs=C.filter(c=>c.kind==="rev"&&m.cat[c.k]>=0.005),cmax=costs.length?m.cat[costs[0].k]:1;
  const bars=(L,mx,den)=>`<ul class="fx-hb">${L.map(c=>`<li><span class="n">${e(c.name)}</span><span class="t"><i style="width:${(m.cat[c.k]/mx*100).toFixed(1)}%"></i></span><b>${e(fmt(m.cat[c.k],b))}</b><small>${pct(m.cat[c.k]/(den||1))}</small></li>`).join("")}</ul>`;
  const row=x=>`<li class="fx-ir"><div class="fx-ic"><b>${e(x.who)}</b><small>${e([day(x.d),x.what].filter(Boolean).join(" · "))}</small></div><span></span><b class="fx-ia${x.amt<0?" neg":""}">${e(fmt(x.amt,b,{c:1}))}</b></li>`;
  const groups=[...revs,...costs].map(c=>{const T=tx.filter(x=>x.cat===c.k),rev=c.kind==="rev",amt=m.cat[c.k];
    const L=c.k==="yt"&&!T.length?`<li class="fx-ir"><div class="fx-ic"><b>YouTube payout</b><small>From the workbook's P&L summary; it has no line items for YouTube</small></div><span></span><b class="fx-ia">${e(fmt(amt,b,{c:1}))}</b></li>`:T.map(row).join("");
    return `<div class="fx-ig"><h5>${e(c.name)}<span>${e(fmt(rev?amt:-amt,b,{c:1}))}${T.length?` · ${T.length}`:""}</span></h5><ul class="fx-il">${L}</ul></div>`}).join("");
  const n=tx.length+(m.cat.yt>=0.005?1:0);
  return hdrH(b,m)+`<div class="fx-db" id="fxDB">
   <nav class="fx-jump" aria-label="In this month"><button type="button" data-fx="jump" data-v="fxS1">Summary</button><button type="button" data-fx="jump" data-v="fxS2">Notes${notes.length?`<b>${notes.length}</b>`:""}</button><button type="button" data-fx="jump" data-v="fxS3">Transactions<b>${n}</b></button></nav>
   <div class="fx-ds" id="fxS1"><div class="fx-st">
     ${srow("Revenue",e(fmt(m.rev,b)),"",p?`${e(mN(p.key))}: ${e(fmt(p.rev,b))} · ${e(chgS(chg(m.rev,p.rev)))}`:"")}
     ${srow("Costs",e(fmt(-m.costs,b)),"",p?`${e(mN(p.key))}: ${e(fmt(-p.costs,b))} · ${e(chgS(chg(m.costs,p.costs)))}`:"")}
     ${srow("Profit / loss",e(fmt(m.profit,b)),"tot tl-"+t,[`≈ ${e(inGBP(m.profit))} at the workbook's rate (0.75)`,mgn(m.profit,m.rev),p?`${e(mN(p.key))}: ${e(fmt(p.profit,b))}`:""].filter(Boolean).join(" · "))}</div>
    <div class="fx-sub"><h5>Where the money went</h5><span>${e(fmt(m.costs,b))}</span></div>${costs.length?bars(costs,cmax,m.costs):`<p class="fx-none">No costs this month.</p>`}
    <div class="fx-sub"><h5>Where the money came from</h5><span>${e(fmt(m.rev,b))}</span></div>${revs.length?bars(revs,Math.max(...revs.map(c=>m.cat[c.k])),m.rev):`<p class="fx-none">No revenue this month.</p>`}
   </div>
   <div class="fx-ds" id="fxS2"><h4>Notes</h4>${notes.length?`<div class="fx-nb"><h5>In the accountant's workbook</h5><div class="fx-nt"><ul>${notes.map(x=>`<li>${e(x)}</li>`).join("")}</ul></div></div>`:`<p class="fx-none">No notes from the accountant for this month.</p>`}</div>
   <div class="fx-ds" id="fxS3"><h4>Transactions</h4><p class="fx-hint">Every line in the accountant's workbook for ${e(mN(m.key))}, by category. They add up to the month's revenue and costs.</p>
    ${groups||`<p class="fx-none">Nothing booked this month.</p>`}
    <div class="fx-tot"><span>Profit / loss</span><b class="${m.profit<=-0.5?"neg":""}">${e(fmt(m.profit,b,{c:1}))}</b></div></div></div>`}
function lateH(y){const b="rv",I=D.rv.invoices,L=D.rv.late.filter(x=>x.m.slice(0,4)===y).map(x=>Object.assign({},I[x.id]||{},x)),T=sum(L,x=>x.amt);
  const ago=d=>{const n=Math.round((Date.parse(D.at)-Date.parse(d))/864e5);return n>0?`${n} days late`:"due"};
  const ms=[...new Set(L.map(x=>x.m))];
  return `<div class="fx-dh"><div class="fx-dt"><h3 id="fxDT" tabindex="-1">Past due · ${e(y)}</h3><p>Rise Voice · ${L.length} invoice${L.length===1?"":"s"}</p></div><button type="button" class="fx-x" data-fx="close" aria-label="Close">✕</button></div>
   <div class="fx-db" id="fxDB"><div class="fx-ds"><p class="fx-hint">Invoices still marked Past Due, under the month they were due. Each counts in full, as in the Revenue tracker's past due.</p>
   ${ms.map(k=>{const G=L.filter(x=>x.m===k);return `<div class="fx-ig"><h5>Due in ${e(mN(k))}<span>${e(fmt(sum(G,x=>x.amt),b))} · ${G.length}</span></h5><ul class="fx-il">${G.map(x=>`<li class="fx-ir"><div class="fx-ic"><b>${e(x.payer||x.n)}</b><small>${e([x.type,"due "+day(x.due),ago(x.due)].filter(Boolean).join(" · "))}</small></div><span class="fx-is tl-loss"><i aria-hidden="true"></i>Past Due</span><b class="fx-ia">${e(fmt(x.amt,b))}</b></li>`).join("")}</ul></div>`}).join("")||`<p class="fx-none">Nothing past due.</p>`}
   <div class="fx-tot"><span>Total past due</span><b class="neg">${e(fmt(T,b))}</b></div></div></div>`}
function drawD(keep){const d=q("fxDr");if(!d||!S.open)return;const o=S.open,db=q("fxDB"),top=keep&&db?db.scrollTop:0,fa=keep&&document.activeElement&&d.contains(document.activeElement)?document.activeElement:null;
  const sel=fa&&fa.dataset.fx?`[data-fx="${fa.dataset.fx}"][data-v="${fa.dataset.v||""}"]`:null;
  d.innerHTML=o.late?lateH(o.late):(()=>{const m=find(o.b,o.k);return m?(o.b==="rv"?rvMonthH(m):podMonthH(m)):""})();
  const nb=q("fxDB");if(nb&&keep)nb.scrollTop=top;if(sel){const x=d.querySelector(sel);if(x)x.focus({preventScroll:true})}}
function markOn(){const o=S.open;document.querySelectorAll("#fxPanel .fx-col,#fxPanel .fx-t tbody tr").forEach(el=>el.classList.toggle("on",!!(o&&!o.late&&o.b===S.biz&&el.dataset.m===o.k)))}
function openD(o,from){const d=q("fxDr");if(!d)return;const was=!!S.open;S.open=o;S.only=false;S.more={};if(!was)S.back=from||document.activeElement;drawD();
  q("fxScrim").hidden=false;d.hidden=false;requestAnimationFrame(()=>d.classList.add("in"));document.documentElement.classList.add("fx-lock");markOn();tip(null);
  const h=q("fxDT");if(h)h.focus({preventScroll:true})}
function closeD(){if(!S.open)return;S.open=null;const d=q("fxDr"),s=q("fxScrim");if(d){d.classList.remove("in");d.hidden=true;d.innerHTML=""}if(s)s.hidden=true;document.documentElement.classList.remove("fx-lock");markOn();
  const bk=S.back;S.back=null;if(bk&&document.contains(bk))bk.focus({preventScroll:true})}
function step(dir){const o=S.open;if(!o||o.late)return;const L=DM(o.b,o.k),i=L.findIndex(m=>m.key===o.k),j=i+dir;if(i<0||j<0||j>=L.length)return;
  o.k=L[j].key;S.only=false;S.more={};drawD();markOn();const x=document.querySelector(`#fxDr [data-fx="step"][data-v="${dir}"]`);(x&&!x.disabled?x:q("fxDT")).focus({preventScroll:true})}

/* ---- clicks, keys, hover ---- */
document.addEventListener("click",ev=>{const v=q("v-finance");if(!v||v.hidden)return;const a=ev.target.closest&&ev.target.closest("[data-fx]");if(!a||!v.contains(a))return;
  const k=a.dataset.fx,val=a.dataset.v;
  if(k==="biz")pickBiz(val,false);
  else if(k==="year"){if(S.biz==="rv"&&S.year!==val){closeD();S.year=val;q("fxPanel").innerHTML=panelH();const n=document.querySelector(`.fx-seg [data-v="${val}"]`);if(n)n.focus({preventScroll:true})}}
  else if(k==="open"){const tr=a.closest("tr");openD({b:S.biz,k:a.dataset.m},tr?tr.querySelector(".fx-mb"):a)}
  else if(k==="late")openD({b:"rv",late:val||CY},a);
  else if(k==="close")closeD();
  else if(k==="step")step(+val);
  else if(k==="only"){S.only=val==="1";drawD(true)}
  else if(k==="more"){S.more[val]=!S.more[val];drawD(true)}
  else if(k==="jump"){const t=q(val);if(t)t.scrollIntoView({behavior:"smooth",block:"start"})}});
function pickBiz(b,kb){if(S.biz!==b){closeD();S.biz=b;render()}const n=q("fxTab-"+b);if(n&&kb!==null)n.focus({preventScroll:true})}
document.addEventListener("keydown",ev=>{const t=ev.target;if(!S.open&&t&&t.classList&&t.classList.contains("fx-tab")&&/^(ArrowLeft|ArrowRight|Home|End)$/.test(ev.key)){ev.preventDefault();
    const o=["rv","pod"],i=o.indexOf(t.dataset.v),j=ev.key==="Home"?0:ev.key==="End"?o.length-1:(i+(ev.key==="ArrowRight"?1:-1)+o.length)%o.length;pickBiz(o[j],true);return}
  if(!S.open)return;const d=q("fxDr");if(!d||d.hidden)return;
  if(ev.key==="Escape"){ev.preventDefault();closeD();return}
  if((ev.key==="ArrowLeft"||ev.key==="ArrowRight")&&!S.open.late&&!ev.altKey&&!ev.metaKey&&!ev.ctrlKey){ev.preventDefault();step(ev.key==="ArrowLeft"?-1:1);return}
  if(ev.key==="Tab"){const f=[...d.querySelectorAll('button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);if(!f.length)return;
    const a=f[0],z=f[f.length-1];if(ev.shiftKey&&(document.activeElement===a||!d.contains(document.activeElement))){ev.preventDefault();z.focus()}else if(!ev.shiftKey&&document.activeElement===z){ev.preventDefault();a.focus()}}});
/* hover or focus on a month: its numbers in a tooltip (costs and margin aren't on the bars) */
function tip(col){const t=q("fxTip");if(!t)return;if(!col){t.hidden=true;return}const b=S.biz,m=find(b,col.dataset.m);if(!m){t.hidden=true;return}const tn=tone(m.profit,m.rev);
  t.innerHTML=`<b>${e(mL(m.key))}</b>${isFc(m)?" · forecast":""}<br>Revenue ${e(fmt(m.rev,b))}<br>Costs ${e(fmt(m.costs,b))}<br>${m.profit<=-0.5?"Loss":"Profit"} ${e(fmt(m.profit,b))}${mgn(m.profit,m.rev)?` <small>(${mgn(m.profit,m.rev)})</small>`:""}${b==="pod"?`<br><small>≈ ${e(inGBP(m.profit))}</small>`:""}<br><small>${TT[tn][0].toUpperCase()+TT[tn].slice(1)} · click to open</small>`;
  t.hidden=false;const P=q("fxPlot").getBoundingClientRect(),r=col.getBoundingClientRect();let x=r.left+r.width/2-P.left>P.width/2?r.left-P.left-t.offsetWidth-8:r.right-P.left+8;
  t.style.left=Math.max(0,Math.min(x,P.width-t.offsetWidth))+"px";t.style.top=(T1+6)+"px"}
document.addEventListener("mouseover",ev=>{const c=ev.target.closest&&ev.target.closest(".fx-col");if(!c){if(!(ev.target.closest&&ev.target.closest("#fxTip")))tip(null);return}tip(c)});
document.addEventListener("focusin",ev=>{const c=ev.target.closest&&ev.target.closest(".fx-col");tip(c&&!S.open?c:null)});

/* the Rise Voice tab without its finance parts (they live here now) */
window.RV_FIN_TAB=true;{const f=q("rvFin");if(f)f.hidden=true}
/* the tab */
{const st0=showTab;showTab=function(t){st0(t);const v=q("v-finance");if(!v)return;v.hidden=t!=="finance";if(t!=="finance")closeD();
  if(t==="finance"){["asof","rvAsof"].forEach(i=>{const x=q(i);if(x)x.hidden=true});if(!q("finBody").firstChild)render()}}}
if(location.hash==="#finance")showTab("finance");
})();
</script>
