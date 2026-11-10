<script>
/* Karen, 10 Nov (Kash): the dashboard opens on the tab it was last on (it always opened on Podcast), in this browser.
   A link to a tab or an episode (#sales, #pm, #team, #home, #risevoice, #ep=…) still opens that. Runs after every other part has
   wrapped showTab, so the tab it opens loads as if it were clicked. Kash's page only (the team page has one tab). */
(()=>{
  if(typeof showTab!=="function")return;
  const KEY="rlLastTab";
  const usable=t=>{const b=document.querySelector('.tabs .tab[data-tab="'+t+'"]');return !!b&&!b.disabled&&!b.hidden&&!b.closest("[hidden]")};
  const prev=showTab;showTab=function(t){prev(t);try{localStorage.setItem(KEY,t)}catch(e){}};
  const h=location.hash||"";if(/^#(home|risevoice|pm|team|sales)$/.test(h)||/^#ep=/.test(h))return;
  let t="";try{t=localStorage.getItem(KEY)||""}catch(e){}
  if(t&&t!=="podcast"&&usable(t))showTab(t);
})();
</script>
