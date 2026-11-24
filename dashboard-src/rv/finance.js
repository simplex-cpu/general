<script>
/* ---------- Finance (Karen, 24 Nov 2026; mockup first, Kash's link only): Rise Voice P&L and Podcast P&L in their own tab ----------
   Revenue per month as bars. Picking a month (its bar or its row) shows that month's numbers and only the invoices behind its
   revenue: the part of each invoice counted in that month. A retainer is split by the days left in the month it is due, and the
   rest rolls into the next month (the Revenue tracker's own formulas), so the list adds up to the month's revenue. Uncollectible
   invoices don't count, as in the Revenue tracker. Data: window.FIN_DATA (the mockup's snapshot) until a feed exists.
   The Rise Voice tab loses its finance pieces (profit KPIs, past-due count, PNL Overview, Late invoices): they live here now. ---------- */
(()=>{
const D=window.FIN_DATA;if(!D)return;
const q=id=>document.getElementById(id);
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],ML=["January","February","March","April","May","June","July","August","September","October","November","December"];
const mS=k=>MS[+k.slice(5,7)-1],mL=k=>ML[+k.slice(5,7)-1]+" "+k.slice(0,4),prevKey=k=>{const y=+k.slice(0,4),m=+k.slice(5,7);return m===1?(y-1)+"-12":y+"-"+String(m-1).padStart(2,"0")};
const gbp=n=>(n<0?"−":"")+"£"+Math.round(Math.abs(n)).toLocaleString("en-GB");
const kgbp=n=>{const a=Math.abs(n),s=n<0?"−":"";return a>=1e6?s+"£"+(a/1e6).toFixed(1)+"M":a>=1e3?s+"£"+(a>=1e5?Math.round(a/1e3):(a/1e3).toFixed(1).replace(/\.0$/,""))+"K":s+"£"+Math.round(a)};
const pct=x=>(x>0?"+":x<0?"−":"")+Math.abs(Math.round(x*100))+"%";
const dmy=d=>d?(+d.slice(8,10))+" "+MS[+d.slice(5,7)-1]+(d.slice(0,4)!==D.at.slice(0,4)?" "+d.slice(0,4):""):"no date";
const ST={"Collected":"ok","To Collect":"watch","Past Due":"act","Refunded":"mute","Uncollectible":"mute"};
const BIZ=[["rv","Rise Voice P&L","From the Revenue tracker and Invoices in Airtable. All amounts in £."],["pod","Podcast P&L","ReLearn podcast."]];
const F={};BIZ.forEach(([k])=>{const B=D[k];if(!B)return;const cur=B.months.find(m=>m.key===D.at.slice(0,7));F[k]={sel:(cur||B.months[B.months.length-1]).key}});
const monthOf=(k,key)=>D[k].months.find(m=>m.key===key);
/* the chart: one bar per month (revenue), on one axis; profit is in the table and the month's numbers, never a second scale */
function chartH(k){const B=D[k],max=Math.max(1,...B.months.map(m=>m.rev)),step=[1e3,2e3,5e3,1e4,2e4,25e3,5e4,1e5,2e5,5e5].find(s=>max/s<=5)||1e6,top=Math.ceil(max/step)*step;
  const grid=[];for(let v=0;v<=top;v+=step)grid.push(v);
  return `<div class="fin-chart"><div class="fin-legend" aria-hidden="true"><span><i class="fin-sw"></i>Actual</span><span><i class="fin-sw fc"></i>Forecast</span></div>
   <div class="fin-plot"><div class="fin-grid" aria-hidden="true">${grid.map(v=>`<div style="bottom:${v/top*100}%"><span>${kgbp(v)}</span></div>`).join("")}</div>
   <div class="fin-cols" role="group" aria-label="${e(BIZ.find(b=>b[0]===k)[1])}: revenue by month">${B.months.map(m=>{const on=m.key===F[k].sel,fc=m.status!=="Actual";
     return `<button type="button" class="fin-b${on?" on":""}${fc?" fc":""}" data-fin="${k}" data-m="${m.key}" aria-pressed="${on}" aria-label="${e(mL(m.key))}${fc?", forecast":""}: revenue ${e(gbp(m.rev))}, profit ${e(gbp(m.profit))}">
       <span class="fin-bw"><span class="fin-bv">${on?e(kgbp(m.rev)):""}</span><span class="fin-bar" style="height:${Math.max(.5,m.rev/top*100)}%"></span></span><span class="fin-bl">${mS(m.key)}</span></button>`}).join("")}</div></div>
   <div class="fin-tip" id="finTip-${k}" role="tooltip" hidden></div></div>`}
/* the selected month's numbers */
function kpisH(k){const m=monthOf(k,F[k].sel),p=monthOf(k,prevKey(m.key)),fc=m.status!=="Actual",ch=p&&p.rev?(m.rev-p.rev)/p.rev:null,mg=m.rev?m.profit/m.rev:null;
  return `<div class="fin-kpis">
   <div class="kpi"><span class="lab">Revenue · ${e(mL(m.key))}</span><span class="val big">${e(gbp(m.rev))}</span><span class="sub">${fc?"Forecast · ":""}${p?`${e(mS(p.key))} ${e(gbp(p.rev))}${ch!=null?` (${pct(ch)})`:""}`:"No earlier month"}</span></div>
   <div class="kpi"><span class="lab">Costs</span><span class="val big">${e(gbp(m.costs))}</span><span class="sub">${p?`${e(mS(p.key))} ${e(gbp(p.costs))}`:"&nbsp;"}</span></div>
   <div class="kpi"><span class="lab">Profit</span><span class="val big" style="color:${m.profit<0?"var(--act)":"var(--ok)"}">${e(gbp(m.profit))}</span><span class="sub">${mg!=null?`${Math.round(mg*100)}% margin`:""}${p?` · ${e(mS(p.key))} ${e(gbp(p.profit))}`:""}</span></div>
   <div class="kpi"><span class="lab">Collected</span><span class="val big">${e(gbp(m.col))}</span><span class="sub">To collect ${e(gbp(m.tocol))}${m.pastdue?` · <b style="color:var(--act)">${e(gbp(m.pastdue))} past due</b>`:""}</span></div></div>`}
/* every month in a table: the chart's table view, and another way to pick a month */
function tableH(k){const B=D[k];return `<div class="fin-tw"><table class="fin-t"><caption class="vh">${e(BIZ.find(b=>b[0]===k)[1])} by month</caption>
   <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th><th scope="col">Costs</th><th scope="col">Profit</th></tr></thead><tbody>
   ${B.months.slice().reverse().map(m=>{const on=m.key===F[k].sel;return `<tr class="${on?"on":""}"><th scope="row"><button type="button" class="fin-mb" data-fin="${k}" data-m="${m.key}" aria-pressed="${on}">${e(mS(m.key))} ${m.key.slice(0,4)}${m.status!=="Actual"?` <small>forecast</small>`:""}</button></th>
     <td>${e(gbp(m.rev))}</td><td>${e(gbp(m.costs))}</td><td class="${m.profit<0?"neg":""}">${e(gbp(m.profit))}</td></tr>`}).join("")}</tbody></table></div>`}
/* the invoices behind the selected month's revenue: invoiced that month, then carried over from the month before */
function invH(k){const B=D[k],m=monthOf(k,F[k].sel),I=B.invoices,pk=prevKey(m.key);
  const row=x=>{const v=I[x.id]||{},st=v.status||"",tone=ST[st]||"mute",split=v.amt&&Math.abs(v.amt-x.part)>0.5;
    return `<li class="fin-ir"><div class="fin-ic"><b>${e(v.payer||v.n||"Invoice")}</b><small>${e(v.type||"Invoice")} · due ${e(dmy(v.due))}${split?` · ${x.kind==="roll"?"rest of a":"part of a"} ${e(gbp(v.amt))} invoice`:""}</small></div>
      <span class="fin-st st-${tone}">${e(st||"No status")}</span><b class="fin-amt">${e(gbp(x.part))}</b></li>`};
  const grp=(t,L)=>L.length?`<div class="fin-g"><h5>${t}<span>${e(gbp(L.reduce((a,x)=>a+x.part,0)))} · ${L.length} invoice${L.length===1?"":"s"}</span></h5><ul class="fin-il">${L.slice().sort((a,b)=>b.part-a.part).map(row).join("")}</ul></div>`:"";
  const a=m.items.filter(x=>x.kind!=="roll"),b=m.items.filter(x=>x.kind==="roll"),tot=m.items.reduce((s,x)=>s+x.part,0);
  return `<div class="fin-inv" aria-live="polite"><div class="fin-ih"><h4>Invoices behind ${e(mL(m.key))} revenue</h4><p>${e(gbp(m.rev))} from ${m.items.length} invoice${m.items.length===1?"":"s"}${m.status!=="Actual"?" · forecast month":""}</p></div>
   ${grp("Invoiced in "+ML[+m.key.slice(5,7)-1],a)}${grp("Carried over from "+ML[+pk.slice(5,7)-1],b)}
   ${m.items.length?"":`<p class="fin-none">No invoices count in this month.</p>`}
   <div class="fin-tot"><span>Total</span><b>${e(gbp(tot))}</b></div>${m.uncollectible?`<p class="fin-note">${m.uncollectible} uncollectible invoice${m.uncollectible===1?" is":"s are"} left out, as in the Revenue tracker.</p>`:""}</div>`}
/* moved from the Rise Voice tab: invoices past due, or still to collect after their due date (this year's) */
function lateH(k){const B=D[k];if(!B.late)return "";const L=B.late.map(id=>Object.assign({id},B.invoices[id]||{}));const days=d=>Math.round((Date.parse(D.at)-Date.parse(d))/864e5);
  return `<div class="fin-late"><div class="fin-lh"><h4>Late invoices</h4><span>${L.length} · ${e(gbp(L.reduce((a,x)=>a+(x.amt||0),0)))}</span></div>
   ${L.length?`<ul class="fin-il">${L.map(v=>`<li class="fin-ir"><div class="fin-ic"><b>${e(v.payer||v.n)}</b><small>Due ${e(dmy(v.due))} · ${days(v.due)} days ago</small></div><span class="fin-st st-${ST[v.status]||"mute"}">${e(v.status)}</span><b class="fin-amt">${e(gbp(v.amt||0))}</b></li>`).join("")}</ul>`:`<p class="fin-none">Nothing late.</p>`}</div>`}
function secH([k,title,sub]){const B=D[k];if(!B)return "";
  return `<section class="fin-sec fin-${k}${B.example?" fin-example":""}" id="finSec-${k}"><div class="fin-h"><span class="fin-dot" aria-hidden="true"></span><div><h3>${e(title)}</h3><p>${e(B.sub||sub)}</p></div>${B.example?`<span class="fin-ex">Example numbers</span>`:""}</div>
   ${B.example?`<p class="fin-exnote">${e(B.example)}</p>`:""}
   <div id="finK-${k}">${kpisH(k)}</div>${chartH(k)}<div class="fin-two"><div>${tableH(k)}</div><div id="finI-${k}">${invH(k)}</div></div>${lateH(k)}</section>`}
function render(){const v=q("finBody");if(!v)return;v.innerHTML=BIZ.map(secH).join("")}
/* picking a month redraws only that business's numbers, bars, table and invoices; focus stays on what was pressed */
function pick(k,key,from){if(!F[k]||!monthOf(k,key))return;F[k].sel=key;const s=q("finSec-"+k);if(!s)return;const tmp=document.createElement("div");tmp.innerHTML=secH(BIZ.find(b=>b[0]===k));s.replaceWith(tmp.firstElementChild);
  const b=document.querySelector(`#finSec-${k} [data-m="${key}"]${from==="t"?".fin-mb":".fin-b"}`);if(b)b.focus({preventScroll:true})}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-fin][data-m]");if(!b||!q("v-finance")||q("v-finance").hidden)return;pick(b.dataset.fin,b.dataset.m,b.classList.contains("fin-mb")?"t":"b")});
/* hover or focus on a bar: its month in a tooltip (the value lives on the mark for the selected month only) */
function tip(b,show){const k=b.dataset.fin,t=q("finTip-"+k);if(!t)return;if(!show){t.hidden=true;return}const m=monthOf(k,b.dataset.m);if(!m)return;
  t.innerHTML=`<b>${e(mL(m.key))}</b>${m.status!=="Actual"?" · forecast":""}<br>Revenue ${e(gbp(m.rev))}<br>Costs ${e(gbp(m.costs))}<br>Profit <span style="color:${m.profit<0?"var(--act)":"inherit"}">${e(gbp(m.profit))}</span>`;
  t.hidden=false;const c=t.parentElement.getBoundingClientRect(),r=b.getBoundingClientRect();let x=r.left+r.width/2-c.left-t.offsetWidth/2;x=Math.max(0,Math.min(x,c.width-t.offsetWidth));t.style.left=x+"px";t.style.top=Math.max(0,r.top-c.top-t.offsetHeight-6)+"px"}
document.addEventListener("mouseover",ev=>{const b=ev.target.closest&&ev.target.closest(".fin-b");document.querySelectorAll(".fin-tip").forEach(t=>{if(!b||t.id!=="finTip-"+b.dataset.fin)t.hidden=true});if(b)tip(b,true)});
document.addEventListener("focusin",ev=>{const b=ev.target.closest&&ev.target.closest(".fin-b");if(b)tip(b,true)});
document.addEventListener("focusout",ev=>{const b=ev.target.closest&&ev.target.closest(".fin-b");if(b)tip(b,false)});
/* the Rise Voice tab without its finance pieces */
window.RV_FIN_TAB=true;{const f=q("rvFin");if(f)f.hidden=true}
/* the tab */
{const st0=showTab;showTab=function(t){st0(t);const v=q("v-finance");if(!v)return;v.hidden=t!=="finance";if(t==="finance"){["asof","rvAsof"].forEach(i=>{const x=q(i);if(x)x.hidden=true});if(!q("finBody").firstChild)render()}}}
if(location.hash==="#finance")showTab("finance");
})();
</script>
