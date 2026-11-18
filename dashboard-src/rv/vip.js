<script>
/* ---------- VIP onboarding (Karen, 18 Nov 2026): Kash's link only, never the team page ----------
   The team's onboarding board as the admin code sees it: the clients in onboarding and each client's full card, with Sales input
   the only part Kash can change. The page and its backend are their own workflow ("VIP onboarding for Kash", YnsXWgyhb5OM3VUa),
   built and tested by the board chat; this tab only shows that page. n8n won't let it be framed (X-Frame-Options: SAMEORIGIN),
   so it is fetched and shown through srcdoc, as the handoff describes. allow-forms is added to the handoff's sandbox list: the
   Sales input editor saves through a form's submit event, which a frame without it never fires. ---------- */
(()=>{
const VIP="https://simplexmedia.app.n8n.cloud/webhook/vip-onboarding-i9rhn6wzklspbfvr1g5mn4mvvv";
const V={state:"idle",frame:null};
const q=id=>document.getElementById(id);
/* the board has its own scrolling: give the frame the rest of the window below the tab bar */
function vipFit(){const f=V.frame,v=q("v-vip");if(!f||!v||v.hidden)return;
  f.style.height=Math.max(480,Math.round(window.innerHeight-Math.max(0,f.getBoundingClientRect().top)-12))+"px"}
async function vipLoad(){const box=q("vipBox");if(!box||V.state==="busy")return;V.state="busy";
  if(!V.frame)box.innerHTML=`<p class="vip-msg" role="status">Loading VIP onboarding…</p>`;
  try{const r=await fetch(VIP,{cache:"no-store"});if(!r.ok)throw new Error("http "+r.status);
    const html=await r.text();if(!/<body|<div/i.test(html))throw new Error("empty page");
    const f=document.createElement("iframe");f.title="VIP onboarding";f.className="vip-frame";
    f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads");
    f.srcdoc=html;box.replaceChildren(f);V.frame=f;V.state="ok";vipFit()}
  catch(e){console.error(e);V.state="err";V.frame=null;
    box.innerHTML=`<div class="vip-err" role="alert"><p>Couldn't load VIP onboarding. Try again.</p><button type="button" class="coach" id="vipRetry">Try again</button></div>`;
    const b=q("vipRetry");if(b)b.onclick=()=>vipLoad()}}
/* the tab: load once, keep the frame for later visits; Refresh on this tab reloads the board */
{const st0=showTab;showTab=function(t){st0(t);const v=q("v-vip");if(!v)return;v.hidden=t!=="vip";
  if(t==="vip"){["asof","rvAsof"].forEach(i=>{const e=q(i);if(e)e.hidden=true});if(V.state==="idle"||V.state==="err")vipLoad();else requestAnimationFrame(vipFit)}}}
window.addEventListener("resize",vipFit);
{const rb=q("refreshBtn");if(rb)rb.addEventListener("click",()=>{const v=q("v-vip");if(v&&!v.hidden&&V.state!=="busy"){V.state="idle";vipLoad()}})}
if(location.hash==="#vip")showTab("vip");
})();
</script>
