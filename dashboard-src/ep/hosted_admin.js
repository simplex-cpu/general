/* team link only: Karen and Sarah can make sign-in codes and turn people on or off */
(()=>{if(!["Karen","Sarah"].includes((window.RL_AUTH||{}).name))return;
const ME=window.RL_AUTH.name,URL_=location.pathname.replace(/\/$/,"")+"/admin";
const CSS=`.rl-ma-bg{position:fixed;inset:0;background:rgba(29,35,41,.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:48px 16px;overflow-y:auto;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.rl-ma{background:#fff;color:#1D2329;border-radius:16px;width:100%;max-width:600px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.2);font-size:14px;line-height:1.45}
.rl-ma *{box-sizing:border-box}.rl-ma h2{font-size:20px;margin:0;font-weight:700}
.rl-ma-hd{display:flex;align-items:center;justify-content:space-between;gap:12px}
.rl-ma-x{all:unset;cursor:pointer;width:40px;height:40px;border-radius:50%;border:1px solid #C9CED5;display:flex;align-items:center;justify-content:center;font-size:20px;color:#3A424B}
.rl-ma-x:focus-visible,.rl-ma button:focus-visible,.rl-ma input:focus-visible{outline:2px solid #4338CA;outline-offset:2px}
.rl-ma-help{color:#5A626C;margin:8px 0 18px}
.rl-ma-add{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.rl-ma-add input{flex:1 1 200px;min-height:40px;border:1px solid #C9CED5;border-radius:8px;padding:0 12px;font:inherit;color:#1D2329}
.rl-ma-b1,.rl-ma-b2{min-height:40px;padding:0 16px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;border:1px solid #4338CA;white-space:nowrap}
.rl-ma-b1{background:#4338CA;color:#fff}.rl-ma-b2{background:#fff;color:#4338CA}.rl-ma-b2.sm{min-height:34px;padding:0 12px;font-size:13px}
.rl-ma-b2.warn{border-color:#B42318;color:#B42318}.rl-ma button[disabled]{opacity:.55;cursor:default}
.rl-ma-err{color:#B42318;min-height:20px;font-size:13px}
.rl-ma-new{background:#EEF2FF;border:1px solid #C7D2FE;border-radius:12px;padding:14px 16px;margin:10px 0 16px}
.rl-ma-new b.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;letter-spacing:.06em;margin:0 10px 0 0}
.rl-ma-new p{margin:6px 0 0;color:#3A424B;font-size:13px}
.rl-ma-list{border-top:1px solid #EEF0F3;margin-top:8px}
.rl-ma-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #EEF0F3;flex-wrap:wrap}
.rl-ma-nm{font-weight:600;min-width:110px;flex:1 1 110px}
.rl-ma-tag{font-size:12px;padding:2px 8px;border-radius:999px;background:#ECFDF3;color:#067647;white-space:nowrap}
.rl-ma-tag.off{background:#F2F4F7;color:#5A626C}.rl-ma-tag.ns{background:#FFFAEB;color:#B54708}
.rl-ma-acts{display:flex;gap:6px;margin-left:auto}
.rl-ma-you{color:#8A919A;font-size:13px;margin-left:auto}`;
let st,bg,box,last=null,list=[],busy=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
async function call(body){const r=await fetch(URL_,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
  if(r.status===403)throw new Error("Only Karen and Sarah can manage access.");if(!r.ok)throw new Error("Couldn't reach the server. Try again.");return r.json()}
function draw(){const add=box.querySelector("#rlMaName");const v=add?add.value:"";
  box.innerHTML=`<div class="rl-ma-hd"><h2 id="rlMaT">Manage access</h2><button type="button" class="rl-ma-x" data-a="close" aria-label="Close">×</button></div>
  <p class="rl-ma-help">Everyone signs in on this link with their first name and their own code. A new code replaces the old one straight away and signs that person out.</p>
  ${last?`<div class="rl-ma-new" role="status"><div><b class="code">${esc(last.code)}</b><button type="button" class="rl-ma-b2 sm" data-a="copy">Copy</button></div>
    <p>${last.isNew?"Added":"New code for"} <b>${esc(last.name)}</b>. Send it to them now: it isn't shown again. They sign in with the name <b>${esc(last.name)}</b> and this code.</p></div>`:""}
  <form class="rl-ma-add" data-a="add"><label for="rlMaName" style="position:absolute;left:-9999px">New person's first name</label>
    <input id="rlMaName" placeholder="Add a person: first name" autocomplete="off" maxlength="40" value="${esc(v)}"><button class="rl-ma-b1" type="submit">Add and make code</button></form>
  <div class="rl-ma-err" id="rlMaErr" role="alert"></div>
  <div class="rl-ma-list">${list.length?list.map(u=>`<div class="rl-ma-row"><span class="rl-ma-nm">${esc(u.name)}</span>
    <span class="rl-ma-tag${u.active?"":" off"}">${u.active?"Can sign in":"Turned off"}</span>${u.slack?"":'<span class="rl-ma-tag ns" title="Tags in comments won\'t reach them on Slack">No Slack</span>'}
    ${u.name===ME?'<span class="rl-ma-you">You</span>':`<span class="rl-ma-acts"><button type="button" class="rl-ma-b2 sm" data-a="code" data-n="${esc(u.name)}">New code</button>
    <button type="button" class="rl-ma-b2 sm${u.active?" warn":""}" data-a="${u.active?"off":"on"}" data-n="${esc(u.name)}">${u.active?"Turn off":"Turn on"}</button></span>`}</div>`).join(""):'<p class="rl-ma-help">Loading…</p>'}</div>`}
function err(m){const e=box.querySelector("#rlMaErr");if(e)e.textContent=m||""}
async function run(body,btn){if(busy)return;busy=true;err("");const t=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent="Working…"}
  try{const j=await call(body);if(j.list)list=j.list;
    if(j.code){last={name:j.name,code:j.code,isNew:j.isNew};const i=box.querySelector("#rlMaName");if(i&&body.action==="code"&&i.value.trim().toLowerCase()===String(j.name).toLowerCase())i.value=""}
    if(!j.list){const k=await call({action:"list"});list=k.list||list}
    draw();if(j.error)err(j.error)}
  catch(e){if(btn){btn.disabled=false;btn.textContent=t}err(e.message)}finally{busy=false}}
function confirmBtn(btn,label){if(btn.dataset.sure)return true;btn.dataset.sure="1";const t=btn.textContent;btn.textContent=label;
  setTimeout(()=>{if(btn.isConnected){delete btn.dataset.sure;btn.textContent=t}},4000);return false}
function open(from){if(!st){st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st)}
  bg=document.createElement("div");bg.className="rl-ma-bg";box=document.createElement("div");box.className="rl-ma";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-labelledby","rlMaT");
  bg.appendChild(box);document.body.appendChild(bg);last=null;draw();box.querySelector(".rl-ma-x").focus();
  const close=()=>{bg.remove();document.removeEventListener("keydown",key);if(from)from.focus()};
  const key=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",key);
  bg.addEventListener("mousedown",e=>{if(e.target===bg)close()});
  box.addEventListener("submit",e=>{e.preventDefault();const n=box.querySelector("#rlMaName").value.trim();if(!n){err("Type their first name first.");return}
    if(list.some(u=>u.name.toLowerCase()===n.toLowerCase())){err(n+" is already on the list. Use New code on their row.");return}
    run({action:"code",name:n},box.querySelector(".rl-ma-add .rl-ma-b1"))});
  box.addEventListener("click",e=>{const b=e.target.closest("button[data-a]");if(!b)return;const a=b.dataset.a,n=b.dataset.n;
    if(a==="close")return close();
    if(a==="copy"){const c=last&&last.code;const done=()=>{b.textContent="Copied"};
      (navigator.clipboard?navigator.clipboard.writeText(c).then(done):Promise.reject()).catch(()=>{const s=getSelection(),r=document.createRange();r.selectNodeContents(box.querySelector(".rl-ma-new .code"));s.removeAllRanges();s.addRange(r);
        let ok=false;try{ok=document.execCommand("copy")}catch(e){}b.textContent=ok?"Copied":"Press Ctrl+C"});return}
    if(a==="code"&&!confirmBtn(b,"Replace "+n+"'s code?"))return;
    if(a==="off"&&!confirmBtn(b,"Sure? Turn off"))return;
    run({action:a,name:n},b)});
  run({action:"list"})}
document.addEventListener("DOMContentLoaded",()=>{const who=document.querySelector(".rl-who");if(!who)return;
  const b=document.createElement("button");b.type="button";b.textContent="Manage access";b.onclick=()=>open(b);
  const out=who.querySelector("button");who.insertBefore(b,out);who.insertBefore(document.createTextNode(" · "),out)});})();
