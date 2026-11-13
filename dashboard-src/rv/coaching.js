<script>
/* ---------- Team coaching (Karen, 13 Nov 2026), Kash's link only: a Coach button on every card in the Team coaching tab.
   It opens a form with three parts: what you're doing right, areas of improvement, action plan. Saving adds one row to the
   Coaching table (Rise Voice base) through POST /coach; n8n reads the person's Slack ID from their team row and sends them the
   coaching on Slack, so Slack IDs never reach this page. The Claude copy saves through Airtable and sends nothing on Slack. ---------- */
(()=>{
const CO={drafts:{},busy:false,done:null,msg:"",fresh:false};
const CPARTS=[["right","What you're doing right","What's going well. Name a specific example."],["improve","Areas of improvement","What to work on, and why it matters."],["plan","Action plan","Next steps, with dates."]];
const q=id=>document.getElementById(id);
/* who a card is: Podcast cards carry the Team brief slug (dakshaya…), Rise Voice cards the Team Roster record ID */
function coWho(key){const i=key.indexOf(":"),team=key.slice(0,i),id=key.slice(i+1),M=RVX.M;
  if(team==="pod"){const p=TEAM.find(x=>x.id===id);if(!p)return null;
    const r=M&&(M.rlTeam||[]).find(x=>kteamKey(x.n)===kteamKey(p.n));
    return {team:"pod",label:"Podcast",name:p.n,role:p.r||"",rec:r?r.id:null}}
  if(team!=="rv"||!M)return null;
  const L=M.leads.find(x=>x.id===id),s=M.strats.find(x=>x.id===id),p=s||L;if(!p)return null;
  return {team:"rv",label:"Rise Voice",name:(L&&L.full)||p.n,role:p.role||"",rec:id}}
const coRead=()=>Object.fromEntries(CPARTS.map(([k])=>{const t=q("co-"+k);return [k,t?t.value.trim():""]}));
function coHTML(key){const w=coWho(key);
  if(!w)return `<div class="ph"><h2>Coach</h2></div><div class="pblock"><p class="pm">This person isn't in the latest data. Close this, press Refresh and try again.</p></div>`;
  const fn=first(w.name),d=CO.drafts[key]||{},head=`${w.name!==fn?esc(w.name)+" · ":""}${w.label}${w.role?" · "+esc(w.role):""}`;
  if(CO.done&&CO.done.key===key)return `<div class="ph"><h2>Coaching saved</h2><span class="pm">${head}</span></div>
   <div class="pblock"><p class="co-ok">${esc(CO.done.text)}</p><div class="co-fb"><button class="coach" type="button" id="coClose" style="margin-top:0">Close</button><button class="coach alt" type="button" id="coAgain" style="margin-top:0">Write another</button></div></div>`;
  const send=RVX.hosted;
  return `<div class="ph"><h2>Coach ${esc(fn)}</h2><span class="pm">${head}</span></div>
   <form class="co-form" id="coForm" data-key="${esc(key)}" novalidate>
    ${CPARTS.map(([k,l,h])=>`<div class="co-f"><label for="co-${k}">${l}</label><textarea id="co-${k}" rows="5" maxlength="3000" placeholder="${esc(h)}">${esc(d[k]||"")}</textarea></div>`).join("")}
    <p class="pm co-note">${send?`Saved in the Coaching table in Airtable, then sent to ${esc(fn)} on Slack.`:`Saved in the Coaching table in Airtable. Slack messages go out from Kash's link only.`} Fill in at least one part.</p>
    <div class="co-fb"><button class="coach" type="button" id="coSave" style="margin-top:0">${send?"Save and send":"Save"}</button><span class="co-msg" id="coMsg" role="status" aria-live="polite">${esc(CO.msg)}</span></div>
   </form>`}
function coRender(){if(peekKind!=="coach")return;q("peekBody").innerHTML=coHTML(peekId);coWire()}
function coWire(){
  const f=q("coForm");if(f){const key=f.dataset.key;f.addEventListener("input",()=>{CO.drafts[key]=coRead();const m=q("coMsg");if(m&&!CO.busy)m.textContent=""});f.addEventListener("submit",e=>e.preventDefault());q("coSave").onclick=coSave}
  const c=q("coClose");if(c)c.onclick=()=>closePeek();
  const a=q("coAgain");if(a)a.onclick=()=>{CO.done=null;CO.msg="";coRender();const t=q("co-right");if(t)t.focus()}}
async function coSave(){const f=q("coForm");if(!f||CO.busy)return;
  const key=f.dataset.key,w=coWho(key),d=coRead(),m=q("coMsg"),b=q("coSave");
  if(!w){m.textContent="This person isn't in the latest data. Press Refresh and try again.";return}
  if(!d.right&&!d.improve&&!d.plan){m.textContent="Write at least one of the three parts.";q("co-right").focus();return}
  if(!w.rec){m.textContent="The team list is still loading. Try again in a moment.";return}
  CO.busy=true;b.disabled=true;m.textContent="Saving…";
  try{let slack;
    if(window.claude?.use){const mcp=await window.claude.use("mcp"),now=new Date();
      const day=now.toLocaleDateString("en-CA",{timeZone:"Europe/London"}),lab=now.toLocaleDateString("en-GB",{timeZone:"Europe/London",day:"numeric",month:"short",year:"numeric"});
      const fields={fldv4GXLWEBduOkqF:w.name+" · "+lab,flddN7lUHISumHGUY:w.name,fldLR0gmlmwcniviZ:w.label,fldIJSyajiE4Z3jMm:"Kash",fldSmHBAU9p6b7FQm:day,fld10lFm1hRUGqR7i:w.rec,
        ...(d.right?{fldu4B3R1xecrQjMZ:d.right}:{}),...(d.improve?{fldOz9q4W55ndKZMh:d.improve}:{}),...(d.plan?{fldzBHamTwE6PCaYx:d.plan}:{})};
      const r=await mcp.callTool("Airtable","create_records_for_table",{baseId:RVBASE,tableId:"tblRA0qoyCdf2SKJk",records:[{fields}],typecast:true},{cache:false});
      if(!((((r&&(r.payload||r))||{}).records||[])[0]||{}).id)throw new Error("not saved");slack="claude"}
    else if(RVX.hosted){const r=await fetch(location.pathname.replace(/\/$/,"")+"/coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({team:w.team,id:w.rec,...d}),cache:"no-store"});
      const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok){const e=new Error("not saved");e.why=typeof j.error==="string"?j.error:"";throw e}slack=j.slack}
    else throw new Error("offline");
    const fn=first(w.name);
    CO.done={key,text:slack==="sent"?`Saved, and sent to ${fn} on Slack.`
      :slack==="failed"?`Saved in the Coaching table, but the Slack message to ${fn} didn't go through.`
      :slack==="claude"?`Saved in the Coaching table. Slack messages go out from Kash's link only.`
      :`Saved in the Coaching table. ${fn} has no Slack ID in the team list, so nothing was sent on Slack.`};
    delete CO.drafts[key];CO.msg="";CO.busy=false;coRender();const c=q("coClose");if(c)c.focus()}
  catch(e){CO.busy=false;b.disabled=false;m.textContent=(e&&e.why?e.why+" ":"Couldn't save the coaching. ")+"Your text is still here. Try again."}}
/* the peek is shared with every other window: only "coach" is handled here, and a background refresh never wipes what Kash is typing */
{const rp=renderPeek;renderPeek=function(){if(peekKind!=="coach")return rp.apply(this,arguments);
  const f=q("coForm");if(f&&f.dataset.key===peekId&&!CO.fresh)return;CO.fresh=false;coRender()}}
/* a Coach button under every card; the card itself still opens the person as before */
function coDecorate(root,team){if(!root)return;
  root.querySelectorAll(".pc[data-p],.pc[data-rvp],.pc[data-rvs]").forEach(card=>{
    if(card.parentElement&&card.parentElement.classList.contains("co-w"))return;
    const id=card.dataset.p||card.dataset.rvp||card.dataset.rvs,nm=((card.querySelector(".nm b")||{}).textContent||"").trim();
    const w=document.createElement("div");w.className="co-w";card.before(w);w.appendChild(card);
    const b=document.createElement("button");b.type="button";b.className="co-btn";b.dataset.coach=team+":"+id;b.textContent="Coach";b.setAttribute("aria-label","Coach "+nm);w.appendChild(b)})}
{const t0=team;team=function(){const r=t0.apply(this,arguments);coDecorate(q("teamcols"),"pod");return r}}
{const r0=rvTeamBrief;rvTeamBrief=function(){const r=r0.apply(this,arguments);coDecorate(q("rvTeamBrief"),"rv");return r}}
coDecorate(q("teamcols"),"pod");coDecorate(q("rvTeamBrief"),"rv");
document.addEventListener("click",ev=>{const c=ev.target.closest("[data-coach]");if(!c)return;
  CO.done=null;CO.msg="";CO.fresh=true;openPeek("coach",c.dataset.coach);const t=q("co-right");if(t)t.focus()});
})();
</script>
