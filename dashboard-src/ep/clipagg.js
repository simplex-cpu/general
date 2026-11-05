/* one summary per episode from every Clips row (posted, waiting, scheduled, picks, best views, posts per format) and the posts around this week.
   v26: a clip goes out on several platforms, and the plan counts clips, not posts. So "posted" counts each clip once: only rows marked Posted
   (or with a posted date and no status), and the count on the platform with the most posts (every clip goes to every platform). */
function clipAgg(rows,today){
  const nmv=v=>v&&typeof v==="object"&&!Array.isArray(v)?v.name:v;
  const idv=v=>(Array.isArray(v)?v:[]).map(x=>typeof x==="object"&&x?x.id:x)[0]||null;
  const FMID={recAnp033Xxor6YNC:"broll",recoxzL7ZO4twKWQa:"talk",recxx2Fa9fQPEorRz:"carousel",recXdTiSM2yLIK36o:"single",recPpZvzSzS013qkx:"trailer",recEjynpCfcBkKa14:"thumb"};
  const kind=f=>{const pf=idv(f.fld0R7YV5RmhZLQ0R);if(pf)return FMID[pf]||"x:"+pf;const fm=String(nmv(f.fld8DT5hjs31ZRqcX)||""),t=String(nmv(f.flddzQ28WDQjAQUgT)||"");
    if(/short|reel/i.test(fm))return /talking/i.test(t)?"talk":/b-?roll/i.test(t)?"broll":/trailer/i.test(t)?"trailer":"none";
    if(/carousel/i.test(fm))return "carousel";if(/image|thumbnail/i.test(fm))return "thumb";if(/trailer/i.test(fm))return "trailer";return "none"};
  const add=(d,n)=>new Date(Date.parse(d+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
  const lo=add(today,-21),hi=add(today,14),E={},W=[];
  for(const f of rows){const ep=idv(f.fldhAaaiSM9Dqmg4D);if(!ep)continue;
    const a=E[ep]||(E[ep]={p:0,pt:0,r:0,rt:0,s:0,st:0,t3:0,tp:0,best:0,k:{},rows:0,pp:{},ptp:{}});
    const k=kind(f),thumb=k==="thumb",st=String(nmv(f.fld7wfnxpx1vjGUbB)||""),wait=/^(ready to post|scheduled)$/i.test(st),sch=/^scheduled$/i.test(st),v=+nmv(f.fldmxU9iggjM3lNKy)||0,on=String(nmv(sch&&f.fldliD2BZ8hqcB6Ts?f.fldliD2BZ8hqcB6Ts:f.fldnizqALqzDJnT6Q)||"").slice(0,10);
    const posted=/^posted$/i.test(st)||(!st&&!!on),pl=String(nmv(f.fldl6MYUm95XZtM4l)||"other");
    if(wait){if(thumb)a.rt++;else a.r++;if(sch){if(thumb)a.st++;else a.s++}}
    else if(!posted){}
    else if(thumb){a.ptp[pl]=(a.ptp[pl]||0)+1;if(nmv(f.fldVmhQ6oDMB14sc8))a.t3++}
    else{a.pp[pl]=(a.pp[pl]||0)+1;a.rows++;a.k[k]=(a.k[k]||0)+1;if(nmv(f.fldkvEVccJSihgTf0))a.tp++;if(v>a.best)a.best=v}
    if((wait||posted)&&on&&on>=lo&&on<=hi)W.push([ep,on,k,wait?(sch?"s":"r"):"p"])}
  for(const a of Object.values(E)){a.p=Math.max(0,...Object.values(a.pp));a.pt=Math.max(0,...Object.values(a.ptp));delete a.pp;delete a.ptp}
  return {e:E,w:W,today}}
