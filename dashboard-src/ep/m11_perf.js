/* ---------- v37 (Karen, 4 Nov 2026): the Podcast tab is Performance only ----------
   The old process view (To-do, Overview, Thumbnails, Clips, Content Drops, Files, Release, Post Release and the full
   episode window) was built on the old tables and is paused. Its code is untouched: PODCAST_FULL=true brings it back.
   With the switch off (now):
   - the side menu shows one section, "Performance" (the Testing & Recovery view, renamed), data only: no Ask AI, no
     filters, no "+ Add a test", no briefs, no next steps;
   - opening an episode (row click, "See clips", any old link) shows only its posted Instagram posts from the IG inbox
     (what Meta reports: views, likes, comments, topic, cover). No comments, no buttons that change anything. */
const PODCAST_FULL=false;
if(!PODCAST_FULL){
  MPT.splice(0,MPT.length,["testing","Performance"]);MP.tab="testing";MP.status="all";MP.sel=null;MP.ask=false;MP.open=null;
  if(window.RL_AUTH)try{document.title="ReLearn · Podcast"}catch(e){}
  /* IG inbox fields (tblnNRs2KWFIxPFOu), as sent by /ep?only=inbox */
  const IBF={link:"fldVr7kzmewW1a4xl",at:"fld11oEIQuPQy7ZMG",media:"fldk1mLk4kfdxPmw7",fmt:"fldF65U8V4qJMrCaY",cover:"fldBbjiftOLPVOGQq",views:"fldLanw7y0FEHgPFV",
    likes:"fldLK2o55C4Ls7mWN",comm:"fldaPUh2yLuoCjH4t",shares:"fldFyCI9S6dO4qPqx",saves:"fldD8MYFgEqdsjIxh",asof:"fld7heZS17CgmRBLQ",topic:"fldSjTDt2lQUEoRjW"};
  const PF={id:null,rid:null,name:"",rel:null,posts:null,err:null,sort:"new",kind:null,shown:60,last:null,req:0,cache:{}};
  const pfNum=v=>{const n=Number(plain(v));return isFinite(n)?n:0};
  const pfKind=m=>/IMAGE/i.test(m)?"images":/CAROUSEL/i.test(m)?"carousels":"clips";
  const PFK=[["clips","Clips"],["images","Thumbnails & graphics"],["carousels","Carousels"],["all","All posts"]];
  const PFS=[["new","Newest"],["views","Views"],["eng","Likes + comments"]];
  const pfPost=r=>{const f=r.fields||{},c=(Array.isArray(f[IBF.cover])?f[IBF.cover]:[])[0]||null,media=String(plain(f[IBF.media])||"");
    const ln=String(plain(f[IBF.link])||"");
    return {id:r.id,link:/^https:\/\//i.test(ln)?ln:"",at:String(plain(f[IBF.at])||""),media,kind:pfKind(media),fmt:String(plain(f[IBF.fmt])||""),img:c&&c.url||"",
      views:pfNum(f[IBF.views]),likes:pfNum(f[IBF.likes]),comm:pfNum(f[IBF.comm]),shares:pfNum(f[IBF.shares]),saves:pfNum(f[IBF.saves]),
      asof:d10(plain(f[IBF.asof])),topic:String(plain(f[IBF.topic])||"").trim()}};
  const pfSorted=L=>{const a=[...L];if(PF.sort==="views")a.sort((x,y)=>y.views-x.views||y.at.localeCompare(x.at));
    else if(PF.sort==="eng")a.sort((x,y)=>(y.likes+y.comm)-(x.likes+x.comm)||y.views-x.views);else a.sort((x,y)=>y.at.localeCompare(x.at));return a};
  const pfIcon=(n,s)=>{try{return ic(n,s||14,"currentColor",null,2)}catch(e){return ""}};
  const pfCss=`.pf{position:fixed;inset:0;z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;background:rgba(17,20,24,.55);overflow-y:auto;
  --t1:#1D2329;--t2:#3A424B;--tm:#5A626C;--bc:#E3E6EA;--sb:#F6F7F9;--ind:#4338CA;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--t1)}
.pf-d{background:#fff;border-radius:16px;width:min(1240px,100%);box-shadow:0 20px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;min-height:240px}
.pf-h{display:flex;align-items:flex-start;gap:16px;padding:24px 28px 16px;border-bottom:1px solid var(--bc)}
.pf-h h2{margin:0;font-size:24px;font-weight:700;line-height:1.25}.pf-h p{margin:4px 0 0;color:var(--tm);font-size:14px}
.pf-x{margin-left:auto;flex:none;width:40px;height:40px;border-radius:999px;border:1px solid var(--bc);background:#fff;color:var(--t2);font-size:22px;line-height:1;cursor:pointer}
.pf-x:hover{background:var(--sb)}.pf-x:focus-visible,.pf-seg button:focus-visible,.pf-c:focus-visible,.pf-more:focus-visible{outline:2px solid var(--ind);outline-offset:2px}
.pf-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;padding:16px 28px}
.pf-lab{font-size:13px;font-weight:600;color:var(--tm);margin-right:8px}
.pf-seg{display:inline-flex;flex-wrap:wrap;gap:4px;padding:3px;border-radius:10px;background:var(--sb);border:1px solid var(--bc)}
.pf-seg button{all:unset;cursor:pointer;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;color:var(--t2)}
.pf-seg button[aria-pressed="true"]{background:#fff;color:var(--t1);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.pf-seg button span{color:var(--tm);font-weight:500;margin-left:4px}
.pf-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;padding:4px 28px 8px}
.pf-c{display:flex;flex-direction:column;border:1px solid var(--bc);border-radius:12px;overflow:hidden;background:#fff;color:inherit;text-decoration:none}
.pf-c:hover{border-color:#C9CED5;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.pf-im{position:relative;aspect-ratio:4/5;background:#2B3138;overflow:hidden}
.pf-im img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pf-im .nf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#AEB5BE;font-size:12px}
.pf-rk{position:absolute;top:8px;left:8px;padding:2px 8px;border-radius:999px;background:#fff;font-size:12px;font-weight:700}
.pf-ft{position:absolute;bottom:8px;left:8px;padding:2px 8px;border-radius:999px;background:rgba(17,20,24,.72);color:#fff;font-size:11px;font-weight:600}
.pf-st{display:flex;gap:10px;padding:8px 10px;border-bottom:1px solid var(--bc);font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden}
.pf-st span{display:inline-flex;align-items:center;gap:4px}
.pf-tx{padding:8px 10px 10px;display:flex;flex-direction:column;gap:2px}
.pf-tx small{color:var(--tm);font-size:12px}
.pf-tx b{font-size:13px;font-weight:500;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pf-f{display:flex;align-items:center;gap:12px;padding:12px 28px 24px;color:var(--tm);font-size:13px}
.pf-more{all:unset;cursor:pointer;padding:8px 14px;border-radius:8px;border:1px solid var(--bc);font-weight:600;color:var(--t1)}
.pf-msg{padding:32px 28px;color:var(--tm);font-size:15px}
@media (max-width:640px){.pf{padding:0}.pf-d{border-radius:0;min-height:100vh}.pf-h,.pf-ctl{padding-left:16px;padding-right:16px}.pf-g{padding:4px 16px 8px;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pf-f{padding:12px 16px 24px}}`;
  {const st=document.createElement("style");st.textContent=pfCss;document.head.appendChild(st)}
  function pfCard(p,i){const date=p.at?fmtD(p.at.slice(0,10)):"";
    const img=p.img?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`:"";
    return `<a class="pf-c" href="${esc(p.link||"#")}" target="_blank" rel="noopener" aria-label="${esc((p.fmt||"Post")+", "+date+": "+k(p.views)+" views, "+k(p.likes)+" likes, "+k(p.comm)+" comments. Opens on Instagram")}">
      <div class="pf-im"><span class="nf">No cover</span>${img}<span class="pf-rk">#${i+1}</span>${p.fmt?`<span class="pf-ft">${esc(p.fmt)}</span>`:""}</div>
      <div class="pf-st"><span title="Views">${pfIcon("eye",13)}${k(p.views)}</span><span title="Likes">${pfIcon("heart",13)}${k(p.likes)}</span><span title="Comments">${pfIcon("chat",13)}${k(p.comm)}</span></div>
      <div class="pf-tx"><small>${esc(date)}</small><b>${esc(p.topic||"No topic")}</b></div></a>`}
  function pfBody(){if(PF.err)return `<p class="pf-msg" role="alert">${esc(PF.err)} <button type="button" class="pf-more" data-pf="retry">Try again</button></p>`;
    if(!PF.posts)return `<p class="pf-msg" role="status">Loading the Instagram posts…</p>`;
    if(!PF.posts.length)return `<p class="pf-msg">No Instagram posts are linked to this episode in the inbox yet.</p>`;
    const n=Object.fromEntries(PFK.map(([v])=>[v,v==="all"?PF.posts.length:PF.posts.filter(p=>p.kind===v).length]));
    const kinds=PFK.filter(([v])=>v==="all"?PFK.filter(([w])=>w!=="all"&&n[w]).length>1:n[v]);
    if(!PF.kind||!n[PF.kind])PF.kind=(kinds[0]||["all"])[0];
    const L=pfSorted(PF.kind==="all"?PF.posts:PF.posts.filter(p=>p.kind===PF.kind)),show=L.slice(0,PF.shown);
    const seg=(lab,key,opts,cnt)=>`<div><span class="pf-lab">${lab}</span><div class="pf-seg" role="group" aria-label="${lab}">${opts.map(([v,l])=>`<button type="button" data-pf="${key}" data-v="${v}" aria-pressed="${PF[key]===v}">${l}${cnt?`<span>${n[v]}</span>`:""}</button>`).join("")}</div></div>`;
    return `<div class="pf-ctl">${kinds.length>1?seg("Show","kind",kinds,true):""}${seg("Sort by","sort",PFS,false)}</div>
      <div class="pf-g">${show.map(pfCard).join("")}</div>
      <div class="pf-f"><span>Showing ${show.length} of ${L.length}</span>${L.length>show.length?`<button type="button" class="pf-more" data-pf="more">Show more</button>`:""}</div>`}
  function pfHead(){const P=PF.posts||[],asof=P.map(p=>p.asof).filter(Boolean).sort().pop(),views=P.reduce((t,p)=>t+p.views,0);
    const bits=[PF.rel?(PF.rel<=TODAY?"Released ":"Releases ")+fmtD(PF.rel):null,PF.posts?pl(P.length,"post")+" on Instagram":null,P.length?k(views)+" views in total":null,asof?"Instagram numbers as of "+fmtD(asof):null].filter(Boolean);
    return `<div class="pf-h"><div><h2 id="pfTitle">${esc(PF.name)}</h2><p>${esc(bits.join(" · "))}</p></div><button type="button" class="pf-x" data-pf="close" aria-label="Close">×</button></div>`}
  function pfRender(){let el=document.getElementById("pf");if(!PF.id){if(el)el.remove();return}
    if(!el){el=document.createElement("div");el.id="pf";el.className="pf";el.innerHTML=`<div class="pf-d" role="dialog" aria-modal="true" aria-labelledby="pfTitle"></div>`;document.body.appendChild(el)}
    const d=el.firstElementChild,y=el.scrollTop;d.innerHTML=pfHead()+pfBody();el.scrollTop=y}
  async function pfLoad(){const my=++PF.req,rid=PF.rid,hit=PF.cache[rid];
    if(hit&&Date.now()-hit.t<30*60e3){PF.posts=hit.posts;PF.err=null;pfRender();return}
    PF.posts=null;PF.err=null;pfRender();
    try{const r=await fetch(location.pathname.replace(/\/$/,"")+"/ep?id="+encodeURIComponent(rid)+"&name="+encodeURIComponent(PF.name)+"&only=inbox",{cache:"no-store"});
      if(!r.ok)throw new Error("http "+r.status);const j=await r.json();if(my!==PF.req)return;
      if(!Array.isArray(j.inbox))throw new Error("old feed");
      PF.posts=j.inbox.map(pfPost);PF.cache[rid]={t:Date.now(),posts:PF.posts};
      const rel=j.episode&&j.episode.fields&&d10(plain(j.episode.fields.fldlWnJQipytEIMsZ));if(rel)PF.rel=rel}
    catch(e){if(my!==PF.req)return;console.error(e);PF.err=/old feed/.test(e&&e.message)?"This view needs the latest data feed, which isn't live yet.":"Couldn't load the Instagram posts."}
    pfRender()}
  function pfOpen(id){const x=EPREC[id];if(!x||!x.rid)return;
    PF.last=PF.id?PF.last:document.activeElement;Object.assign(PF,{id,rid:x.rid,name:x.name||"",rel:x.rel||null,kind:null,sort:"new",shown:60});
    document.documentElement.style.overflow="hidden";pfLoad();const b=document.querySelector("#pf .pf-x");if(b)b.focus()}
  function pfClose(){PF.id=null;PF.req++;document.documentElement.style.overflow="";pfRender();try{if(PF.last&&PF.last.focus)PF.last.focus()}catch(e){}PF.last=null}
  /* every way of opening an episode now opens this window (rows, "See clips", old #ep= links) */
  mOpen=function(id){pfOpen(id)};
  document.addEventListener("click",ev=>{const pf=document.getElementById("pf");
    if(pf&&pf.contains(ev.target)){if(ev.target===pf){pfClose();return}const b=ev.target.closest("[data-pf]");if(!b)return;const a=b.dataset.pf;
      if(a==="close")pfClose();else if(a==="retry"){delete PF.cache[PF.rid];pfLoad()}else if(a==="more"){PF.shown+=60;pfRender()}
      else if(a==="sort"||a==="kind"){PF[a]=b.dataset.v;PF.shown=60;pfRender();const nb=document.querySelector(`#pf [data-pf="${a}"][data-v="${b.dataset.v}"]`);if(nb)nb.focus()}return}
    const root=$("mpRoot");if(!root||!root.contains(ev.target))return;
    const row=ev.target.closest("[data-mptest]");if(row&&!ev.target.closest("select,button,input")){ev.preventDefault();ev.stopPropagation();pfOpen(row.dataset.mptest)}},true);
  document.addEventListener("keydown",ev=>{const pf=document.getElementById("pf");
    if(pf&&PF.id){if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();pfClose();return}
      if(ev.key==="Tab"){const f=[...pf.querySelectorAll("button,a[href]")].filter(z=>z.offsetParent);if(f.length){const a=f[0],z=f[f.length-1];
        if(ev.shiftKey&&document.activeElement===a){ev.preventDefault();z.focus()}else if(!ev.shiftKey&&document.activeElement===z){ev.preventDefault();a.focus()}}}return}
    const t=ev.target;if((ev.key==="Enter"||ev.key===" ")&&t&&t.matches&&t.matches("[data-mptest]")){ev.preventDefault();ev.stopPropagation();pfOpen(t.dataset.mptest)}},true);
  /* Performance view, data only: strip the actions and process steps from the shared render */
  function pfTrim(){const root=$("mpRoot");if(!root)return;
    root.querySelectorAll(".mp-askw,.mp-filters,[data-mpact='addtest'],.mp-ob").forEach(e=>{const p=e.previousSibling;if(e.classList.contains("mp-ob")&&p&&p.nodeName==="BR")p.remove();e.remove()});
    root.querySelectorAll(".mp-sgl").forEach(g=>{if(/coming soon/i.test(g.textContent)){const n=g.nextElementSibling;if(n&&n.classList.contains("mp-sl"))n.remove();g.remove()}});
    const h=root.querySelector(".mp-trh");if(h){const tg=h.querySelector(".mp-tag");if(tg&&!tg.previousElementSibling?.matches?.(".mp-tag"))tg.remove(); /* the stage, not the root cause */
      const mu=h.querySelector(".mu");if(mu){const m=/day\s+(\d+)/i.exec(mu.textContent);mu.textContent=m?`Day ${m[1]} since release`:""}
      const o=h.querySelector(".mp-open");if(o){o.textContent="See clips";o.removeAttribute("data-mptab")}}
    root.querySelectorAll("[data-mptest]").forEach(r=>{r.setAttribute("aria-label",`See the Instagram posts for ${(r.querySelector("b")||{}).textContent||"this episode"}`)})}
  const mpRenderFull=mpRender;
  mpRender=function(){if(!MPT.some(z=>z[0]===MP.tab))MP.tab="testing";MP.ask=false;MP.open=null;mpRenderFull();pfTrim()};
  try{mpRender()}catch(e){console.error(e)}
}
