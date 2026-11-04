
/* ---------- Release ---------- */
const CHK=[["Uploads",[["Top 3 thumbnails uploaded"],["3 test titles set"],["Description and chapters added"],["Spotify upload done"],["Apple upload done"]]],
  ["Links & collabs",[["Collab link sent to Kash"],["YouTube collab accepted"],["CTA switched to episode link"],["Pre-release Shorts updated with link"],["Guest sent the links"]]],
  ["Promotion",[["Vertical trailer posted"],["YouTube community post sent"],["Release email sent to the list"],["Top clips reposted (IG + Shorts)","Top clips reposted (IG + YouTube Shorts)"]]]];
const CHK_N=CHK.reduce((a,g)=>a+g[1].length,0);
function tRelease(id,x,b,e,D,s,wait){if(!D)return wait;
  const ep=D.ep,rel=x.rel,released=rel&&rel<=TODAY,ck=s.check,done=CHK.reduce((a,g)=>a+g[1].filter(([l,v])=>ck.includes(v||l)).length,0),signed=s.signed;
  const TR=[["Teaser trailer","dTeaser","s7b"],["Final cut","dFinal","s7"],["Pre-release trailer","dPre","s7c"],["Release-day trailer","rel","s7d"]];
  const own=owners(D),trs=TR.map(([l,dk,sk],i)=>{const v=s.tr[i]||{};const st0=stOf(ep[sk]);return {l,i,owner:v.owner||(own.includes("Stephen")?"Stephen":own[0]),link:v.link||"",date:v.date!==undefined?v.date:(dk==="rel"?rel:d10(nm(ep[dk]))),status:v.status||(st0==="Done"?"Delivered":st0)}});
  const trDone=trs.filter(t=>t.status==="Delivered").length,trailersN=trs.filter(t=>t.i!==1).filter(t=>t.status==="Delivered").length;
  const allDone=done>=CHK_N&&signed;
  const ban=`<div class="m2-ban${allDone?" g":""}"><div class="bi" aria-hidden="true">${ic(allDone?"ok":"alert",20,"currentColor",null,2)}</div><div><b>${released?`Live since ${fmtD(rel)} · `:rel?`Releases ${fmtD(rel)} · `:""}${allDone?"all done and signed off":done?`${done} of ${CHK_N} ticked off`:"nothing ticked off yet"}</b></div></div>`;
  const t1=released?tile("Released",fmtD(rel),`<span class="m2-pill g">Live · ${pl(dayDiff(TODAY,rel),"day")} ago</span>`,{icon:ICO.ok()}):tile("Release date",rel?fmtD(rel):DASH,rel?`In ${pl(dayDiff(rel,TODAY),"day")}`:"Not set yet",{icon:ICO.wait(),vc:rel?"":"na"});
  const row=tiles([t1,tile("Trailers ready",`${trailersN}<small>of 3</small>`,"From trailer statuses",{icon:trailersN>=3?ICO.ok():ICO.wait(),dash:trailersN<3}),
    tile("Release checklist",`${done}<small>of ${CHK_N}</small>`,done>=CHK_N?"All ticked off":"Tick items off below",{icon:done>=CHK_N?ICO.ok():ICO.wait(),dash:done<CHK_N}),
    tile("Signed off by CJ",signed?fmtD(signed):"Not yet",signed?"Release QA done":"CJ signs off below",{icon:signed?ICO.ok():ICO.wait(),dash:!signed})]);
  /* trailers timeline */
  const nodes=[...trs.map(t=>({t,done:t.status==="Delivered",late:t.status==="Problem"||(t.date&&t.date<TODAY&&t.status!=="Delivered"&&t.status!=="No status")})),{rel:true,done:released}];
  let nx=false;
  const tl=`<section class="m2-s" style="gap:24px"><div class="m2-sh" style="align-items:center"><div class="m2-ttl"><h2>Trailers</h2><p>Owner, date, link and status for each trailer</p></div>
    <div class="m2-legend"><span><i style="background:var(--g)"></i>Done</span><span><i style="background:var(--r)"></i>Late</span><span><i style="background:var(--ad)"></i>Next</span><span><i class="u"></i>Upcoming</span><span><i class="t"></i>Not tracked</span></div></div>
    <ol class="m2-tl big" style="--n:5">${nodes.map((z,i)=>{const pv=nodes[i-1],nxt=nodes[i+1];
      const lnL=pv?`<div class="ln l${pv.done&&z.done?"":" d"}" aria-hidden="true"></div>`:"",lnR=nxt?`<div class="ln r${z.done&&nxt.done?"":" d"}" aria-hidden="true"></div>`:"";
      let c=z.done?"done":z.late?"late":"";if(!c){if(!nx&&!released&&!z.rel){c="next";nx=true}else c=z.rel||z.t.status!=="No status"?"up":released?"nt":"up"}
      const dot=c==="done"?`<div class="dot done">${ic("check",18,"currentColor",null,3)}</div>`:c==="late"?`<div class="dot late">${ic("alert",18,"currentColor",null,2.4)}</div>`:c==="next"?`<div class="dot next"><i></i></div>`:`<div class="dot ${c}"></div>`;
      if(z.rel)return `<li>${lnL}${dot}<span class="nm">Release</span><span class="gl">Episode goes live</span>${rel?`<span class="dn" style="${released?"":"color:var(--tm)"}">${fmtD(rel)}${released?" · Done":""}</span>`:""}</li>`;
      const t=z.t;return `<li>${lnL}${lnR}${dot}<span class="nm">${esc(t.l)}</span><div class="tr"><select class="m2-sel" aria-label="Who's making the ${esc(t.l.toLowerCase())}" data-k="tr.${t.i}.owner">${selOpts(own,t.owner)}</select>
        <input class="m2-in" type="url" aria-label="${esc(t.l)} link" placeholder="Paste trailer link" data-k="tr.${t.i}.link" value="${esc(t.link)}">
        <div class="ed"><input type="date" aria-label="Date for the ${esc(t.l.toLowerCase())}" value="${t.date||""}" data-k="tr.${t.i}.date" data-rr ${c==="late"?'class="late"':""}></div>
        <select class="m2-sel pill" style="min-height:32px;font-size:13px;padding:0 8px" aria-label="Status for the ${esc(t.l.toLowerCase())}" data-k="tr.${t.i}.status" data-rr>${selOpts(TRST,t.status)}</select></div></li>`}).join("")}</ol></section>`;
  /* checklist */
  const cl=`<section class="m2-s" style="gap:20px"><div class="m2-sh" style="align-items:flex-end"><h2 style="margin:0;font-size:20px;font-weight:700">Release-day checklist</h2><div class="m2-prog"><b>${done} of ${CHK_N} done</b><div class="m2-bar"><i style="width:${Math.round(done/CHK_N*100)}%"></i></div></div></div>
    <div class="m2-grp">${CHK.map(([g,items])=>{const n=items.filter(([l,v])=>ck.includes(v||l)).length;return `<div class="m2-gb"><div class="gh"><b>${esc(g)}</b><span>${n} of ${items.length}</span></div><div class="gl">${items.map(([l,v])=>`<label class="m2-chk"><input type="checkbox" data-ck="${esc(v||l)}" ${ck.includes(v||l)?"checked":""}>${esc(l)}</label>`).join("")}</div></div>`}).join("")}</div>
    <div class="m2-sign"><div><span class="si" aria-hidden="true">${ic("shield",18,"currentColor",null,2)}</span><div><b>CJ's sign-off</b><span>${signed?`Signed off on ${fmtD(signed)}`:"Not signed off yet"}</span></div></div>${signed?pill("Signed off","g"):`<button type="button" class="m2-btn" data-act="sign">Sign off</button>`}</div></section>`;
  return ban+row+tl+cl}

/* ---------- Post Release ---------- */
function tPost(id,x,b,e,D,s,wait){if(!D)return wait;
  const L=s.lanes,all=[...L.prod,...L.guest],nDone=all.filter(z=>z.d).length,guest=b.n||x.name,first=firstName(String(guest).replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i,""));
  const thanked=L.guest[0]&&L.guest[0].d,own=owners(D);
  const ban=`<div class="m2-ban${nDone===all.length&&all.length?" g":""}"><div class="bi" aria-hidden="true">${ic(nDone===all.length&&all.length?"ok":"alert",20,"currentColor",null,2)}</div><div><b>${nDone?`${nDone} of ${all.length} after-release steps done`:"No after-release steps have been ticked off yet"}</b><span>${nDone===all.length?"Everything after release is done.":"Tick steps off below as they're done."}</span></div></div>`;
  const row=tiles([tile("After-release steps",`${nDone}<small>of ${all.length} done</small>`,nDone?"Keep going below":"Tick them off below",{icon:nDone===all.length?ICO.ok():ICO.wait()}),
    tile("Guest thanked",thanked?"Done":"Not yet","Jade",{icon:thanked?ICO.ok():ICO.wait()}),
    tile("Promotion pieces planned",String(s.promo.length),"Stories, extra posts, collabs",{icon:s.promo.length?ICO.ok():ICO.wait()}),
    tile("Fit for our services?",esc(s.fit),"Jade decides",{icon:s.fit==="Yes"?ICO.ok():""})]);
  const step=(l,z,i)=>`<li><input type="checkbox" aria-label="Done: ${esc(z.n||"new step")}" data-k="lanes.${l}.${i}.d" data-rr ${z.d?"checked":""}><div style="display:flex;flex-direction:column;gap:6px;min-width:0">
    <div class="sn">${z.pf?`<span class="fx${z.d?" done":""}">${esc(z.n)}</span>`:`<input type="text" aria-label="Step name" placeholder="Name this step" value="${esc(z.n)}" data-k="lanes.${l}.${i}.n" class="${z.d?"done":""}"><button type="button" class="m2-rm" aria-label="Remove step: ${esc(z.n||"new step")}" title="Remove step" data-act="rmstep" data-l="${l}" data-i="${i}">${ic("x",16)}</button>`}</div>
    <div class="so"><select aria-label="Owner" data-k="lanes.${l}.${i}.o">${selOpts(own,z.o)}</select><input type="date" aria-label="Date" value="${z.date||""}" data-k="lanes.${l}.${i}.date"></div></div></li>`;
  const lane=(l,title,sub)=>`<div class="m2-lane"><div class="lh"><h3>${title}</h3><span>${sub}</span></div><ul>${L[l].map((z,i)=>step(l,z,i)).join("")}</ul><div class="lf" style="padding-top:12px"><button type="button" class="m2-add full" data-act="addstep" data-l="${l}">+ Add a step</button></div></div>`;
  const sales=`<div class="m2-lane"><div class="lh"><h3>Sales opportunity</h3><span>Only when there's a fit</span></div><div class="lb">
    <fieldset style="margin:0;padding:0;border:none;display:flex;flex-direction:column;gap:8px"><legend style="padding:0;margin-bottom:8px;font-size:15px;font-weight:600">Could ${esc(first)} use our services?</legend>
      <div class="m2-radios">${["Yes","No","Not decided"].map(v=>`<label class="${s.fit===v?"on":""}"><input type="radio" name="m2fit" value="${v}" data-k="fit" data-rr ${s.fit===v?"checked":""}>${v}</label>`).join("")}</div></fieldset>
    <label class="m2-lbl">What could we offer ${esc(first)}?<textarea class="m2-ta" rows="2" style="font-size:14px;padding:10px" data-k="offer" placeholder="e.g. Short-form clipping for their channel">${esc(s.offer)}</textarea></label>
    <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:600;color:var(--t2)">Sales steps</span>
      ${(s.sales.length?s.sales:[null]).map((z,i)=>z?`<div class="m2-ss"><input type="checkbox" aria-label="Done: ${esc(z.n||"sales step")}" data-k="sales.${i}.d" ${z.d?"checked":""}><div class="ssb"><input type="text" aria-label="Sales step name" placeholder="e.g. Send proposal" value="${esc(z.n)}" data-k="sales.${i}.n"><div class="so"><select aria-label="Owner" data-k="sales.${i}.o">${selOpts(own,z.o)}</select><input type="date" aria-label="Date" value="${z.date||""}" data-k="sales.${i}.date"></div></div></div>`:
        `<div class="m2-ss"><input type="checkbox" aria-label="Done: new sales step" disabled><div class="ssb"><input type="text" aria-label="Sales step name" placeholder="e.g. Send proposal" data-k="sales.0.n" data-rr><div class="so"><select aria-label="Owner" data-k="sales.0.o" data-rr>${selOpts(own,"Jade")}</select><input type="date" aria-label="Date" data-k="sales.0.date" data-rr></div></div></div>`).join("")}</div>
    <button type="button" class="m2-add full" data-act="addsales">+ Add a sales step</button></div></div>`;
  const lanes=`<section class="m2-s" style="gap:20px;padding:24px"><div class="m2-sh"><div class="m2-ttl"><h2>Release checklist</h2><p>Default steps for every episode, plus any you add.</p></div></div><div class="m2-lanes">${lane("prod","Production","Keep promoting the episode")}${lane("guest","Guest relations","Look after "+esc(first))}${sales}</div></section>`;
  const pc="140px minmax(0,1fr) 140px 150px 120px";
  const prow=s.promo.map((p,i)=>trow(pc,[esc(p.type),p.link?`<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link.replace(/^https?:\/\//,"").slice(0,48))}</a>`:DASH,p.date?fmtD(p.date):DASH,p.needs?pill("Needs "+esc(first),"a"):"No",{h:`<select class="m2-in" aria-label="Status" data-k="promo.${i}.status" data-rr>${selOpts(["Planned","Posted","Cancelled"],p.status)}</select>`,c:"in"}],"new")).join("");
  const promo=`<section class="m2-s" style="gap:20px"><div class="m2-ttl"><h2>Promotion plan</h2><p>Mark pieces that need ${esc(first)} so Jade can coordinate.</p></div>
    <div class="m2-tbl" role="table" aria-label="Promotion plan"><div class="m2-tr hd" role="row" style="--cols:${pc}">${["Type","Clip","Planned for","Needs "+esc(first)+"?","Status"].map(h=>`<span role="columnheader">${h}</span>`).join("")}</div>
      ${prow||`<div class="m2-pe"><b>Nothing planned yet</b><span>Add stories, extra posts or collab posts below.</span></div>`}
      <div class="m2-pf"><label>Type<select class="m2-sel" data-k="pf.type">${selOpts(["Story","Extra post","Collab post"],s.pf.type)}</select></label><label>Clip<input class="m2-in" type="url" placeholder="Paste the clip link" data-k="pf.link" value="${esc(s.pf.link)}"></label><label>Planned for<input class="m2-in" type="date" data-k="pf.date" value="${s.pf.date}"></label><span class="nr"><input type="checkbox" id="m2needs" data-k="pf.needs" ${s.pf.needs?"checked":""}><label for="m2needs" style="font-size:14px;font-weight:500;color:var(--t1)">Needs ${esc(first)}</label></span><button type="button" class="m2-btn" data-act="promo">Add to plan</button></div></div></section>`;
  return ban+row+lanes+promo}
