<script>
/* ---------- Project Management: every task in Rise Voice's and ReLearn's Task Managers, as a table, gallery or kanban ---------- */
const PM={view:"table",grp:"status",co:"all",q:"",done:false,added:[],st:{},msg:"",drag:null,form:{co:"Rise Voice"}};
const PMST=["To Do","In Progress","Review","Blocked","Done"],PMPRI=["High","Medium","Low"];
const PMAREA=["⚙️ Correct System","📈 Design | Improve Systems","🔁 Automate Systems","🤖 AI-Systems","💰 New Offer Development"];
const PMGRPS=[["status","Status"],["co","Company"],["people","People"],["pri","Priority"],["area","Area"],["month","Due month"],["week","Due week"]];
const pmCls=s=>({"To Do":"todo","In Progress":"prog","Review":"rev","Blocked":"blk","Done":"done"})[s]||"none";
function pmItems(){const M=RVX.M;if(!M)return [];
  const ep=Object.fromEntries((M.rlEps||[]).map(x=>[x.id,x.n]));
  const rt=Object.fromEntries(M.rlTeam.map(x=>[x.id,x.n]));
  const rv=M.allTasks.map(t=>({id:t.id,base:"rv",co:"Rise Voice",n:t.n,status:PM.st[t.id]||t.status||"No status",people:[...new Set(t.whoU.map(u=>first(u.name)))],due:t.due,pri:t.pri||"",area:t.area||"",link:t.cids.map(i=>RVN[i]).filter(Boolean).join(", ")}));
  const rl=M.rlTasks.map(t=>({id:t.id,base:"rl",co:"Podcast",n:t.n,status:PM.st[t.id]||t.status||"No status",people:t.owner.map(i=>first(rt[i]||"")).filter(Boolean),due:t.due,pri:t.pri||"",area:t.area||"",link:t.eps.map(i=>ep[i]).filter(Boolean).join(", ")}));
  /* Karen, 13 Nov: only tasks with someone from the podcast team, Sarah, Jennifer or Karen on them; tasks for anyone else, and unassigned ones, are left out */
  const all=[...rv,...rl].filter(x=>x.people.some(kteamOK));return [...all,...PM.added.filter(a=>!all.some(x=>x.id===a.id)).map(a=>({...a,status:PM.st[a.id]||a.status}))]}
const pmMon=d=>{const t=Date.parse(d+"T00:00:00Z"),w=(new Date(t).getUTCDay()+6)%7;return new Date(t-w*864e5).toISOString().slice(0,10)};
function pmKeys(x){switch(PM.grp){
  case "status":return [x.status];case "co":return [x.co];case "people":{const P=x.people.filter(kteamOK);return P.length?P:["Unassigned"]}
  case "pri":return [x.pri||"No priority"];case "area":return [rvClean(x.area)||"No area"];
  case "month":return [x.due?x.due.slice(0,7):"~"];case "week":return [x.due?pmMon(x.due):"~"];}return ["All"]}
function pmLabel(k){if(k==="~")return "No due date";if(PM.grp==="month")return MON[+k.slice(5,7)-1]+" "+k.slice(0,4);if(PM.grp==="week")return "Week of "+fmtD(k)+(k.slice(0,4)!==TODAY.slice(0,4)?" "+k.slice(0,4):"");return k}
function pmOrder(a,b){const O=PM.grp==="status"?[...PMST,"No status"]:PM.grp==="pri"?[...PMPRI,"No priority"]:null;
  if(O)return (O.indexOf(a)+1||99)-(O.indexOf(b)+1||99);if(a==="~")return 1;if(b==="~")return -1;if(/^(Unassigned|No area)$/.test(a))return 1;if(/^(Unassigned|No area)$/.test(b))return -1;return a.localeCompare(b)}
function pmList(){const q=PM.q.trim().toLowerCase();
  return pmItems().filter(x=>(PM.co==="all"||x.co===PM.co)&&(PM.done||x.status!=="Done")&&(!q||[x.n,x.people.join(" "),x.link,x.area].join(" ").toLowerCase().includes(q)))
    .sort((a,b)=>String(a.due||"9").localeCompare(String(b.due||"9"))||a.n.localeCompare(b.n))}
function pmGroups(L){const G={};L.forEach(x=>pmKeys(x).forEach(k=>{(G[k]=G[k]||[]).push(x)}));
  if(PM.grp==="status"&&PM.view==="kanban")PMST.filter(s=>PM.done||s!=="Done").forEach(s=>{G[s]=G[s]||[]});
  return Object.keys(G).sort(pmOrder).map(k=>[k,G[k]])}
const pmStSel=x=>`<label class="vh" for="pms-${x.id}">Status</label><select id="pms-${x.id}" class="pmst ${pmCls(x.status)}" data-pmst="${x.id}" data-base="${x.base}"${x.saving?" disabled":""}>${(x.status==="No status"?["No status",...PMST]:PMST).map(s=>`<option${s===x.status?" selected":""}>${s}</option>`).join("")}</select>`;
const pmDue=x=>x.due?`<span class="${x.due<TODAY&&x.status!=="Done"?"late":""}">${fmtDY(x.due)}</span>`:`<span class="pm">–</span>`;
const pmChip=x=>`<span class="cochip ${x.co==="Podcast"?"pod":"rvs"}">${x.co}</span>`;
const pmPri=x=>x.pri?`<span class="pri p-${x.pri.toLowerCase()}">${esc(x.pri)}</span>`:`<span class="pm">–</span>`;
function pmTable(G){return G.map(([k,L])=>`<div class="pmg"><h3>${esc(pmLabel(k))} <span>${L.length}</span></h3><div class="pmtw"><table class="pmt"><thead><tr><th>Task</th><th>Company</th><th>People</th><th>Status</th><th>Priority</th><th>Area</th><th>Due</th><th>Client / episode</th></tr></thead><tbody>${L.map(x=>`<tr><td class="tn">${esc(x.n)}</td><td>${pmChip(x)}</td><td>${esc(x.people.join(", ")||"–")}</td><td>${pmStSel(x)}</td><td>${pmPri(x)}</td><td>${esc(rvClean(x.area)||"–")}</td><td>${pmDue(x)}</td><td>${esc(x.link||"–")}</td></tr>`).join("")}</tbody></table></div></div>`).join("")}
const pmCard=(x,drag)=>`<div class="pmc"${drag?` draggable="true" data-pmdrag="${x.id}" data-base="${x.base}"`:""}><div class="pmch">${pmChip(x)}${x.pri?pmPri(x):""}</div><b>${esc(x.n)}</b>${x.link?`<span class="pm">${esc(x.link)}</span>`:""}<div class="pmcf"><span>${esc(x.people.join(", ")||"Unassigned")}</span>${pmDue(x)}</div>${pmStSel(x)}</div>`;
function pmGallery(G){return G.map(([k,L])=>`<div class="pmg"><h3>${esc(pmLabel(k))} <span>${L.length}</span></h3><div class="pmcards">${L.map(x=>pmCard(x,false)).join("")}</div></div>`).join("")}
function pmKanban(G){const drag=PM.grp==="status";return `<div class="pmkb">${G.map(([k,L])=>`<div class="pmcol" data-pmcol="${esc(k)}"><h3><span class="dot ${PM.grp==="status"?pmCls(k):""}"></span>${esc(pmLabel(k))} <span>${L.length}</span></h3><div class="pmcolb">${L.map(x=>pmCard(x,drag)).join("")||`<p class="pm" style="margin:6px 4px">Nothing here.</p>`}</div></div>`).join("")}</div>${drag?`<p class="pm" style="font-size:12.5px;margin-top:8px">Drag a card to another column, or use its status menu, to change its status.</p>`:""}`}
function pmRender(){const bar=$("pmBar"),body=$("pmBody");if(!bar||!body)return;
  if(!RVX.M){body.innerHTML=`<p class="pm">${esc(RVX.err||"Loading tasks…")}</p>`;return}
  const sel=(id,lab,v,opts)=>`<label class="vh" for="${id}">${lab}</label><select id="${id}" class="mini">${opts.map(([a,b])=>`<option value="${a}"${a===v?" selected":""}>${b}</option>`).join("")}</select>`;
  bar.innerHTML=`<div class="seg" role="group" aria-label="View">${[["table","Table"],["gallery","Gallery"],["kanban","Kanban"]].map(([v,l])=>`<button type="button" data-pmview="${v}" aria-pressed="${PM.view===v}">${l}</button>`).join("")}</div>
    <span class="pm">Group by</span>${sel("pmGrp","Group by",PM.grp,PMGRPS)}
    ${sel("pmCo","Company",PM.co,[["all","Both companies"],["Rise Voice","Rise Voice"],["Podcast","Podcast"]])}
    <label class="pmchk"><input type="checkbox" id="pmDone"${PM.done?" checked":""}> Show done</label>
    <label class="vh" for="pmQ">Search tasks</label><input id="pmQ" class="mini" type="search" placeholder="Search tasks, people, clients" value="${esc(PM.q)}">
    <button type="button" class="pmadd" id="pmAdd">+ Add task</button>`;
  const L=pmList(),G=pmGroups(L);
  body.innerHTML=(PM.msg?`<p class="pmmsg" role="status">${esc(PM.msg)}</p>`:"")+(L.length||PM.view==="kanban"?(PM.view==="table"?pmTable(G):PM.view==="gallery"?pmGallery(G):pmKanban(G)):`<p class="pm">No tasks match.</p>`);
  const n=pmItems(),open=n.filter(x=>x.status!=="Done");
  $("pmMeta").innerHTML=`${open.length} open · ${open.filter(x=>x.co==="Rise Voice").length} Rise Voice, ${open.filter(x=>x.co==="Podcast").length} Podcast · ${open.filter(x=>x.due&&x.due<TODAY).length} past due`;
  $("pmGrp").onchange=e=>{PM.grp=e.target.value;pmRender()};$("pmCo").onchange=e=>{PM.co=e.target.value;pmRender()};$("pmDone").onchange=e=>{PM.done=e.target.checked;pmRender()};
  const q=$("pmQ");q.oninput=()=>{PM.q=q.value;clearTimeout(pmRender.t);pmRender.t=setTimeout(()=>{pmRender();const z=$("pmQ");z.focus();z.setSelectionRange(z.value.length,z.value.length)},250)};
  $("pmAdd").onclick=()=>openPeek("rvpm");
  bar.querySelectorAll("[data-pmview]").forEach(b=>b.onclick=()=>{PM.view=b.dataset.pmview;pmRender()});
  body.querySelectorAll("[data-pmst]").forEach(s=>s.onchange=()=>pmSetStatus(s.dataset.pmst,s.dataset.base,s.value));
  body.querySelectorAll("[data-pmdrag]").forEach(c=>{c.ondragstart=e=>{PM.drag={id:c.dataset.pmdrag,base:c.dataset.base};e.dataTransfer.effectAllowed="move";c.classList.add("dragging")};c.ondragend=()=>c.classList.remove("dragging")});
  body.querySelectorAll("[data-pmcol]").forEach(col=>{col.ondragover=e=>{if(PM.drag){e.preventDefault();col.classList.add("over")}};col.ondragleave=()=>col.classList.remove("over");
    col.ondrop=e=>{e.preventDefault();col.classList.remove("over");const d=PM.drag;PM.drag=null;if(d&&PMST.includes(col.dataset.pmcol))pmSetStatus(d.id,d.base,col.dataset.pmcol)}});
}
async function pmSetStatus(id,base,v){const was=PM.st[id];PM.st[id]=v;PM.msg="";pmRender();
  try{if(window.claude?.use){const mcp=await window.claude.use("mcp");await mcp.callTool("Airtable","update_records_for_table",base==="rl"?{baseId:"appaT1sh6XB9ubqTF",tableId:"tblo67QERNSmGzVaJ",records:[{id,fields:{fld54iDcRB5PIU4Tp:v}}],typecast:true}:{baseId:RVBASE,tableId:"tbl7gVj7Owmn5WBEW",records:[{id,fields:{fldEzDPoSmPt87LOB:v}}],typecast:true},{cache:false})}
    else{const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"pmstatus",base,id,status:v}),cache:"no-store"});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw 0}
    PM.msg=`Saved: status is now ${v}.`}
  catch(e){if(was===undefined)delete PM.st[id];else PM.st[id]=was;PM.msg="Couldn't change that status. Try again."}
  pmRender()}
/* add a task: Rise Voice tasks go to Rise Voice's Task Manager, Podcast tasks to ReLearn's */
function pmPeople(co){const M=RVX.M;if(co==="Podcast")return M.rlTeam.map(x=>({id:x.id,n:x.n})).filter(p=>kteamOK(p.n));
  const seen={};RVLEADS.forEach(L=>{seen[L.usr[0]]=L.full});M.allTasks.forEach(t=>t.whoU.forEach(u=>{if(u.id&&u.name&&!Object.values(seen).includes(u.name))seen[u.id]=seen[u.id]||u.name}));
  return Object.entries(seen).map(([id,n])=>({id,n})).filter(p=>kteamOK(p.n))}
function pmAddHTML(){const M=RVX.M;if(!M)return `<p class="pm">Tasks haven't loaded yet.</p>`;const f=PM.form,co=f.co||"Rise Voice",P=pmPeople(co);
  const opt=(L,v)=>L.map(([a,b])=>`<option value="${esc(a)}"${a===v?" selected":""}>${esc(b)}</option>`).join("");
  const links=co==="Podcast"?(M.rlEps||[]).map(x=>[x.id,x.n]):M.ext.map(c=>[c.id,c.n]);
  return `<div class="ph"><h2>Add a task</h2><span class="pm">Saved in ${co==="Podcast"?"ReLearn's":"Rise Voice's"} Task Manager. The person gets a Slack message when we have their Slack ID.</span></div>
   <form class="pmform" id="pmForm"><label>Task<input name="n" maxlength="200" required autocomplete="off" value="${esc(f.n||"")}"></label>
    <label>Company<select name="co" id="pmFormCo">${opt([["Rise Voice","Rise Voice"],["Podcast","Podcast"]],co)}</select></label>
    <label>Assign to<select name="to" required><option value="" disabled${f.to?"":" selected"}>Choose a person</option>${opt(P.map(p=>[p.id,p.n]),f.to||"")}</select></label>
    <label>Due date<input type="date" name="due" value="${esc(f.due||plusDays(7))}"></label>
    <label>Status<select name="status">${opt(PMST.map(s=>[s,s]),f.status||"To Do")}</select></label>
    <label>Priority<select name="pri"><option value="">None</option>${opt(PMPRI.map(s=>[s,s]),f.pri||"")}</select></label>
    <label>Area<select name="area"><option value="">None</option>${opt(PMAREA.map(s=>[s,rvClean(s)]),f.area||"")}</select></label>
    <label>${co==="Podcast"?"Episode":"Client"}<select name="link"><option value="">None</option>${opt(links,f.link||"")}</select></label>
    <div class="pmfb"><button class="coach" type="submit" style="margin-top:0">Add task</button><span class="pm" id="pmFormMsg">${esc(f.msg||"")}</span></div></form>`}
function pmWire(){const fm=$("pmForm");if(!fm)return;
  const keep=()=>{PM.form={co:fm.co.value,n:fm.n.value,to:fm.to.value,due:fm.due.value,status:fm.status.value,pri:fm.pri.value,area:fm.area.value,link:fm.link.value}};
  $("pmFormCo").onchange=()=>{keep();PM.form.to="";PM.form.link="";renderPeek()};
  fm.onsubmit=async e=>{e.preventDefault();keep();const f=PM.form;if(!f.n.trim())return;if(!f.to){$("pmFormMsg").textContent="Choose who the task is for.";fm.to.focus();return}const b=fm.querySelector("button[type=submit]");b.disabled=true;$("pmFormMsg").textContent="Saving…";
    const base=f.co==="Podcast"?"rl":"rv";
    try{let id;
      if(window.claude?.use){const mcp=await window.claude.use("mcp");
        const fields=base==="rl"?{fldypaV3pfGFUwUV2:f.n.trim(),fld54iDcRB5PIU4Tp:f.status,...(f.to?{fldnFWw9MtpsrUD6A:[f.to]}:{}),...(f.due?{fldBf1bXOOwnzmZ0J:f.due}:{}),...(f.pri?{fld5ZB32kORU6EhkD:f.pri}:{}),...(f.area?{fldEQ3AMDWDY0Il1u:f.area}:{}),...(f.link?{fldeQQ12J1kfXXs9C:[f.link]}:{}),fldcWWR8KvT1XH6eM:"Added from the CEO dashboard."}
          :{fldffOVMyhrlvRBgZ:f.n.trim(),fldEzDPoSmPt87LOB:f.status,...(f.to?{fldvasDBd2huhGhO7:[{id:f.to}]}:{}),...(f.due?{fldsGUdBFJH5kL2iI:f.due}:{}),...(f.pri?{fldmwcd0McGsxXDUr:f.pri}:{}),...(f.area?{fldxiWGI1vOjnBSSV:f.area}:{}),...(f.link?{flddWIYoBLbOIacl8:[f.link]}:{}),fldGm01KMjpTIR7Ht:"Added from the CEO dashboard."};
        const r=await mcp.callTool("Airtable","create_records_for_table",{baseId:base==="rl"?"appaT1sh6XB9ubqTF":RVBASE,tableId:base==="rl"?"tblo67QERNSmGzVaJ":"tbl7gVj7Owmn5WBEW",records:[{fields}],typecast:true},{cache:false});
        id=(((r.payload||r||{}).records||[])[0]||{}).id;if(!id)throw 0}
      else{const r=await fetch(location.pathname.replace(/\/$/,"")+"/rvw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({a:"pm",base,n:f.n.trim(),to:f.to||"",due:f.due||null,status:f.status,pri:f.pri||"",area:f.area||"",link:f.link||""}),cache:"no-store"});
        const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok||!j.id)throw 0;id=j.id}
      const P=pmPeople(f.co),M=RVX.M,lk=f.link?(base==="rl"?((M.rlEps||[]).find(x=>x.id===f.link)||{}).n:RVN[f.link]):"";
      PM.added.push({id,base,co:f.co,n:f.n.trim(),status:f.status,people:f.to?[first((P.find(p=>p.id===f.to)||{}).n||"")]:[],due:f.due||null,pri:f.pri,area:f.area,link:lk||""});
      PM.form={co:f.co};PM.msg=`Added "${f.n.trim()}" to ${f.co}.`;closePeek();pmRender()}
    catch(x){b.disabled=false;$("pmFormMsg").textContent="Couldn't save that task. Try again."}}}
/* the tab itself */
{const st0=showTab;showTab=function(t){st0(t);$("v-pm").hidden=t!=="pm";if(t==="pm"){$("asof").hidden=true;$("rvAsof").hidden=false;pmRender()}}}
if(location.hash==="#pm")showTab("pm");
</script>
