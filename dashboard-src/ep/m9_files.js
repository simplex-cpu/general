/* ---------- v33: Files. The episode's Drive folders (Episode folder + every Content Drop link), read through n8n <page>/files?ep=<rec>.
   Fetched only when a Files view opens (the reply is ~230 KB). Nothing is uploaded through the dashboard: "Upload" opens the folder in Drive. ---------- */
const FL={c:{},open:new Set(),closed:new Set(),q:{},ep:null,edit:{},fm:{},busy:{}};
/* the episode's Drive folder (Episodes fld1wHPKvVeM7bIUp): pasted here, saved through the normal save call. Until the n8n whitelist has the field the save is refused: say so plainly */
const FLFOLD="fld1wHPKvVeM7bIUp",flIsFolder=u=>/^https:\/\/drive\.google\.com\/(drive\/(u\/\d+\/)?folders\/|open\?id=)[\w-]{10,}/.test(String(u||"").trim());
function flFoldForm(rid,cur){const m=FL.fm[rid];return `<span class="fl-ff"><input class="td2-in" type="url" data-flfold="${rid}" value="${esc(m&&m.v!=null?m.v:cur||"")}" placeholder="https://drive.google.com/drive/folders/…" aria-label="Drive folder link">
  <button type="button" class="td2-pri sm" data-flact="savefold" data-rid="${rid}"${FL.busy[rid]?" disabled":""}>${FL.busy[rid]?"Saving…":"Save"}</button></span>${m&&m.msg?`<span class="fl-fm ${m.bad?"bad":""}" role="status">${esc(m.msg)}</span>`:""}`}
async function flSaveFold(rid){const inp=document.querySelector(`[data-flfold="${rid}"]`),v=String(inp?inp.value:"").trim();FL.fm[rid]={v};
  if(!flIsFolder(v)){FL.fm[rid].msg="That isn't a Google Drive folder link. Open the folder in Drive and copy the address (it has /folders/ in it).";FL.fm[rid].bad=1;flPaint(rid);return}
  const m=mpAll().find(z=>z.rid===rid);FL.busy[rid]=1;flPaint(rid);
  try{const res=await svSend({rid,name:m?m.name:"",id:m?m.id:""},{tab:"files"},[{t:"tblx8C7czyAikbbVp",a:"update",id:rid,f:{[FLFOLD]:v}}],[]);
    if(!res||!res.ok){FL.fm[rid]={v,bad:1,msg:(res&&res.rejected&&res.rejected.length)?"Couldn't save yet: the dashboard isn't allowed to change this field until the next back-end update. Paste it in Airtable for now.":"Couldn't save that. Try again."}}
    else{FL.fm[rid]={};FL.edit[rid]=false;MP.F[rid]=Object.assign(MP.F[rid]||{},{[FLFOLD]:v});delete FL.busy[rid];flLoad(rid,true);return}}
  catch(e){FL.fm[rid]={v,bad:1,msg:"Couldn't save yet ("+String(e&&e.message||e).slice(0,80)+"). Try again later."}}
  delete FL.busy[rid];flPaint(rid)}
const flUrl=rid=>location.pathname.replace(/\/$/,"")+"/files?ep="+encodeURIComponent(rid);
async function flLoad(rid,force){const c=FL.c[rid];if(c&&(c.st==="loading"||(c.st==="ok"&&!force)))return;
  FL.c[rid]={st:"loading"};flPaint(rid);
  if(window.claude?.use){FL.c[rid]={st:"err",msg:"Files open on the hosted dashboard link."};flPaint(rid);return}
  try{const r=await fetch(flUrl(rid),{cache:"no-store"});let j=null;try{j=await r.json()}catch(e){}
    if(r.status===401||(j&&j.signin))FL.c[rid]={st:"401"};
    else if(!r.ok||!j||j.ok===false)FL.c[rid]={st:"err",msg:(j&&j.error)||("server "+r.status)};
    else FL.c[rid]={st:"ok",d:j,at:Date.now()}}
  catch(e){FL.c[rid]={st:"err",msg:String(e&&e.message||e)}}
  flPaint(rid)}
/* redraw every Files box showing this episode, keeping the search box as it is */
function flPaint(rid){document.querySelectorAll(`[data-flbox="${rid}"] .fl-res`).forEach(el=>{el.innerHTML=flBody(rid)});
  document.querySelectorAll(`[data-flbox="${rid}"] .fl-meta`).forEach(el=>{el.innerHTML=flMeta(rid)})}
const flSize=n=>n==null?"":n<1024?n+" B":n<1048576?Math.round(n/1024)+" KB":n<1073741824?(n/1048576).toFixed(1)+" MB":(n/1073741824).toFixed(2)+" GB";
const flWhen=s=>{const d=d10(s);return d?(d===TODAY?"Today":fmtD(d)+(d.slice(0,4)!==TODAY.slice(0,4)?" "+d.slice(0,4):"")):""};
const flSafe=u=>/^https:\/\/([a-z0-9-]+\.)*(google\.com|googleusercontent\.com)\//i.test(String(u||""))?String(u):"";
const flIcon=i=>{const u=flSafe(i.icon);return u?`<img class="fl-ic" src="${esc(u)}" alt="" width="16" height="16" loading="lazy">`:`<span class="fl-ic d" aria-hidden="true">${i.folder?"▸":"•"}</span>`};
const flOpen=(u,l,cls)=>{u=flSafe(u);return u?`<a class="${cls||"fl-open"}" href="${esc(u)}" target="_blank" rel="noopener">${l}</a>`:""};
const flThumb=i=>{const u=flSafe(i.thumb);return u&&/^(image|video)\//.test(i.mime||"")?`<img class="fl-th" src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:""};
function flMeta(rid){const c=FL.c[rid];if(!c||c.st!=="ok")return "";const d=c.d,n=d.counts||{};
  return `${pl(n.files||0,"file")} · ${pl(n.folders||0,"folder")}${d.fetchedAt?` · read ${esc(String(d.fetchedAt).slice(11,16))} UTC`:""} <button type="button" class="td2-lnk" data-flact="reload" data-rid="${rid}">Refresh</button>`}
function flRow(i,kids,depth){const isF=!!i.folder,open=isF&&(FL.open.has(i.id)),n=isF?(kids[i.id]||[]).length:0;
  const name=`<span class="fl-nm">${esc(i.name||"Untitled")}</span>`;
  return `<div class="fl-r${isF?" f":""}" style="--d:${depth}" role="treeitem"${isF?` aria-expanded="${open}"`:""}>
    <span class="fl-c1">${isF?`<button type="button" class="fl-tg" data-flact="tog" data-id="${esc(i.id)}" aria-label="${open?"Close":"Open"} ${esc(i.name)}">${open?"▾":"▸"}</button>`:`<span class="fl-sp"></span>`}${flIcon(i)}${flThumb(i)}${isF?name:flOpen(i.url,esc(i.name||"Untitled"),"fl-nm l")}
      ${isF&&n?`<span class="fl-n">${n}</span>`:""}${i.empty?`<span class="fl-n">Empty</span>`:""}</span>
    <span class="fl-mod">${esc(flWhen(i.modified))}</span><span class="fl-by">${esc(i.by||"")}</span><span class="fl-sz">${isF?"":esc(flSize(i.size))}</span>
    <span class="fl-act">${i.more?flOpen(i.url,"Open in Drive","fl-more"):""}${isF?flOpen(i.url,"Upload","fl-up"):""}${flOpen(i.url,"Open")}</span></div>`+
    (open?(kids[i.id]||[]).map(k=>flRow(k,kids,depth+1)).join(""):"")}
const flSort=(a,b)=>(!!b.folder-!!a.folder)||String(a.name).localeCompare(String(b.name),undefined,{numeric:true});
function flBody(rid){const c=FL.c[rid];
  if(!c||c.st==="loading")return `<p class="fl-msg" role="status">Loading the Drive folders…</p>`;
  if(c.st==="401")return `<p class="fl-msg bad" role="alert">You're signed out. Refresh the page and sign in again to see the files.</p>`;
  if(c.st==="err")return `<p class="fl-msg bad" role="alert">Couldn't load the files (${esc(c.msg)}). <button type="button" class="td2-lnk" data-flact="reload" data-rid="${rid}">Try again</button></p>`;
  const d=c.d,items=(d.items||[]).slice(),kids={};for(const i of items)(kids[i.parent]=kids[i.parent]||[]).push(i);for(const k in kids)kids[k].sort(flSort);
  const q=String(FL.q[rid]||"").trim().toLowerCase(),roots=d.roots||[],byId=Object.fromEntries(items.map(i=>[i.id,i]));
  const epRoot=roots.find(r=>r.kind==="episode");
  const noEp=!epRoot?`<div class="fl-msg fl-fold"><b>No Drive folder yet: paste its link.</b>${flFoldForm(rid,"")}</div>`:FL.edit[rid]?`<div class="fl-msg fl-fold"><b>Change the episode's Drive folder</b>${flFoldForm(rid,epRoot.url)}</div>`:"";
  const errs=(d.errors||[]).length?`<p class="fl-msg warn">Some folders couldn't be read: ${esc((d.errors||[]).map(e=>typeof e==="string"?e:(e.label||e.error||JSON.stringify(e))).join("; ").slice(0,300))}</p>`:"";
  const cap=d.capped?`<p class="fl-msg warn">Only the first ${items.length} files are listed. Open the folder in Drive for the rest.</p>`:"";
  const head=`<div class="fl-r hd"><span>Name</span><span>Modified</span><span>By</span><span>Size</span><span></span></div>`;
  if(q){const hits=items.filter(i=>String(i.name||"").toLowerCase().includes(q)).sort(flSort).slice(0,200);
    const path=i=>{const p=[];let x=byId[i.parent];while(x){p.unshift(x.name);x=byId[x.parent]}const r=roots.find(z=>z.folderId===(p.length?(()=>{let y=i;while(byId[y.parent])y=byId[y.parent];return y.parent})():i.parent));return [(r&&r.label)||"",...p].filter(Boolean).join(" / ")};
    return noEp+`<div class="fl-card"><div class="fl-rh"><b>${hits.length}${hits.length===200?"+":""} ${hits.length===1?"match":"matches"} for “${esc(q)}”</b></div><div class="fl-t" role="tree">${head}${hits.map(i=>flRow(Object.assign({},i,{folder:false}),{},0).replace('<span class="fl-mod">',`<span class="fl-path">${esc(path(i))}</span><span class="fl-mod">`)).join("")||`<p class="fl-msg">No file names match.</p>`}</div></div>`}
  const rootH=roots.map(r=>{const top=(kids[r.folderId]||[]),open=!FL.closed.has("root:"+r.folderId),u=flSafe(r.url);
    return `<section class="fl-card"><div class="fl-rh"><button type="button" class="fl-tg" data-flact="root" data-id="${esc(r.folderId)}" aria-expanded="${open}" aria-label="${open?"Close":"Open"} ${esc(r.label)}">${open?"▾":"▸"}</button>
      <b>${esc(r.label||"Folder")}</b><span class="fl-kind">${r.kind==="episode"?"Episode folder":"Drop"}</span>${r.kind==="episode"?`<button type="button" class="td2-lnk" data-flact="editfold" data-rid="${rid}">${FL.edit[rid]?"Cancel change":"Change folder"}</button>`:""}<span class="fl-n">${pl(top.length,"item")}</span><span class="td2-sp"></span>
      ${u?`<a class="td2-ghost sm fl-btn" href="${esc(u)}" target="_blank" rel="noopener">Upload to this folder</a><a class="fl-open" href="${esc(u)}" target="_blank" rel="noopener">Open in Drive</a>`:""}</div>
      ${open?(r.listed===false?`<p class="fl-msg">This folder is empty, or the dashboard can't see it (check it's shared with the team).</p>`:top.length?`<div class="fl-t" role="tree">${head}${top.map(i=>flRow(i,kids,0)).join("")}</div>`:`<p class="fl-msg">This folder is empty.</p>`):""}</section>`}).join("");
  const links=(d.links||[]).length?`<section class="fl-card"><div class="fl-rh"><b>Single files</b><span class="fl-n">${(d.links||[]).length}</span></div><div class="fl-t">${(d.links||[]).map(l=>`<div class="fl-r"><span class="fl-c1"><span class="fl-sp"></span><span class="fl-ic d">•</span>${flOpen(l.url,esc(l.name||"Link"),"fl-nm l")}<span class="fl-kind">${esc(l.kind||"")}</span></span><span></span><span></span><span></span><span class="fl-act">${flOpen(l.url,"Open")}</span></div>`).join("")}</div></section>`:"";
  return noEp+errs+cap+(rootH||links?rootH+links:`<p class="fl-msg">No Drive folders or links on this episode or its drops yet.</p>`)}
/* the box used by the Files tab and the episode window */
function flBox(rid,name){if(!rid)return `<p class="fl-msg">Pick an episode to see its files.</p>`;
  if(!FL.c[rid])setTimeout(()=>flLoad(rid),0);
  return `<div class="fl" data-flbox="${rid}"><div class="fl-bar"><label class="td2-lab fl-q">Search<input class="td2-in" type="search" data-flq="${rid}" value="${esc(FL.q[rid]||"")}" placeholder="File name in ${esc(name||"this episode")}" aria-label="Search files in this episode"></label><span class="td2-sp"></span><span class="fl-meta">${flMeta(rid)}</span></div><div class="fl-res">${flBody(rid)}</div></div>`}
/* Podcast sidebar: Files */
function mpFiles(){const eps=mpAll().filter(m=>m.rid).sort((a,c)=>(a.released-c.released)||(a.released?c.rel.localeCompare(a.rel):a.rel.localeCompare(c.rel)));
  if(FL.ep&&!eps.some(m=>m.rid===FL.ep))FL.ep=null;const m=FL.ep&&eps.find(z=>z.rid===FL.ep);
  const pick=`<div class="td2-ctl"><label class="td2-lab">Episode${tdSelW('data-flep aria-label="Episode"',[["","Pick an episode"],...eps.map(z=>[z.rid,z.name+(z.released?"":" · "+fmtD(z.rel))])],FL.ep||"")}</label>${m?`<button type="button" class="td2-lnk" data-mpep="${m.id}" data-mptab="overview">Open the episode window</button>`:""}</div>`;
  return `<div class="td2 flp"><h1 class="td2-h1">Files</h1>${pick}${flBox(FL.ep,m&&m.name)}</div>`}
/* episode window: Files tab */
TABS.push(["files","Files"]);
function tFiles(id,x){return `<div class="fl-m">${flBox(x.rid,x.name)}</div>`}
MP_SCOPE0.files="all";ASKQ.files=["Which episodes have no Drive folder yet?","Where are the raw files for the next release?","Which drop folders are empty?"];
document.addEventListener("click",ev=>{const t=ev.target.closest&&ev.target.closest("[data-flact]");if(!t)return;const a=t.dataset.flact,box=t.closest("[data-flbox]"),rid=t.dataset.rid||(box&&box.dataset.flbox);
  if(a==="reload"){flLoad(rid,true);return}
  if(a==="savefold"){flSaveFold(rid);return}
  if(a==="editfold"){FL.edit[rid]=!FL.edit[rid];FL.fm[rid]={};flPaint(rid);return}
  if(a==="tog"){const id=t.dataset.id;FL.open.has(id)?FL.open.delete(id):FL.open.add(id);flPaint(rid);return}
  if(a==="root"){const k="root:"+t.dataset.id;FL.closed.has(k)?FL.closed.delete(k):FL.closed.add(k);flPaint(rid)}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(ev.key==="Enter"&&t.dataset&&t.dataset.flfold){ev.preventDefault();flSaveFold(t.dataset.flfold)}});
document.addEventListener("input",ev=>{const t=ev.target;if(t.dataset&&t.dataset.flfold){FL.fm[t.dataset.flfold]=Object.assign(FL.fm[t.dataset.flfold]||{},{v:t.value});return}if(!t.dataset||!t.dataset.flq)return;FL.q[t.dataset.flq]=t.value;flPaint(t.dataset.flq)});
document.addEventListener("change",ev=>{const t=ev.target;if(!t.matches||!t.matches("[data-flep]"))return;FL.ep=t.value||null;mpRender()});
