/* hosted page only: send the sign-in token with every request to this page's own endpoints, show who is signed in */
(()=>{const K="rlDashToken";let T=null,N="";try{T=localStorage.getItem(K);N=localStorage.getItem("rlDashName")||""}catch(e){}
const w=/^rl1:([0-9a-f]{20,}):(.*)$/.exec(window.name||"");T=T||window.__rlTok||(w&&w[1])||null;N=N||window.__rlName||(w?decodeURIComponent(w[2]):"");
const forget=()=>{try{localStorage.removeItem(K)}catch(e){}window.name="";window.__rlTok=null};
window.RL_AUTH={token:T,name:N,signOut(){forget();location.reload()}};
const f0=window.fetch.bind(window),base=location.pathname.replace(/\/$/,""),mine=url=>url.startsWith(base)&&!/\/rv(\?|$)/.test(url);
window.fetch=(u,o)=>{const url=typeof u==="string"?u:(u&&u.url)||"";if(T&&mine(url)){o=Object.assign({},o||{});o.headers=Object.assign({},o.headers||{},{"x-dash-token":T})}
  return f0(u,o).then(r=>{if(r.status===401&&mine(url)){forget();location.reload()}return r})};
document.addEventListener("DOMContentLoaded",()=>{const rb=document.getElementById("refreshBtn");if(!rb||!N)return;const s=document.createElement("span");s.className="rl-who";
  s.innerHTML='Signed in as <b></b> · <button type="button">Sign out</button>';s.querySelector("b").textContent=N;s.querySelector("button").onclick=()=>window.RL_AUTH.signOut();rb.parentNode.insertBefore(s,rb)});})();
