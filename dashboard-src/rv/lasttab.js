<script>
/* Karen, 10 Nov (Kash): a refresh reopens the tab he was on; opening the link fresh opens Home (it always opened on Podcast).
   n8n serves this page sandboxed (no localStorage), so the tab is kept in the address: #sales, #pm, #team, #home, #risevoice,
   #podcast (the Podcast tab's own #tab=… and #ep=… links still open Podcast). The other parts already open the tab their hash
   names; this runs after all of them (it wraps showTab last), so a tab it opens loads as if it were clicked. Kash's page only. */
(()=>{
  if(typeof showTab!=="function")return;
  const OWN=/^#(home|podcast|risevoice|sales|team|pm)$/;
  const setHash=h=>{try{history.replaceState(history.state,"",location.pathname+location.search+h)}catch(e){}};
  const prev=showTab;
  showTab=function(t){prev(t);
    /* the Podcast tab writes its own #tab=… / #ep=… when used: leave those; otherwise name the tab */
    if(t==="podcast"){if(!/^#(tab=|ep=)/.test(location.hash))setHash("#podcast")}
    else if(OWN.test("#"+t))setHash("#"+t)};
  /* nothing in the address (the link opened fresh): Home */
  const h=location.hash||"";
  if(!h||h==="#"){const b=document.querySelector('.tabs .tab[data-tab="home"]');if(b&&!b.disabled)showTab("home")}
})();
</script>
