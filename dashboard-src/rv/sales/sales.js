<script>
/* Sales tab v4 (4.2): Kash's board IS his Sales pipeline (ReLearn Commercials → Sales pipeline, one row per deal, his own stages).
   A deal is there only when something needs Kash; Pre-qual mirrors what the teams are still working on, with their live stage.
   Team boards (Jade's Podcast board + the Rise Voice Company Leads boards) stay where the teams work. Contacts = everyone.
   "Drop a note": Claude reads a typed or dictated note, recaps it, Kash confirms, then it is saved. */
(function(){
const CB="appaP7Y1SxMmv6Odb", RB="appOttHso6hYjBXhw", GB="appaT1sh6XB9ubqTF";
const T={leads:"tbl1Jf2BPuSrwT5v0",conv:"tblcar4mqDssSccvO",calls:"tblcYUQVjRo3nTQrE",money:"tblq9C4niOCPh2hcx",contacts:"tblIHKdSJO8IGIMRi",cl:"tblbPp30ethheEOW0",sp:"tblmuA1NxDhGDlKqQ",ul:"tbl8xDFVwfdMS7v3v",pipes:"tblQ91MducoPDdmII",guests:"tblw02pY0M4jP9aag",team:"tblNH6iSlbp4K9NFd"};
/* v5: ReLearn Commercials → Pipelines (one row per pipeline; Health is set by hand) */
const PL={name:"fldRLEVACYTk6xVkF",health:"fldRMi8timPbuj1vJ",who:"fldq3jjYVpSTX4IQh",fall:"fldR9zdHeHmTY0yke",next:"fldgPhWZHByEnYjdT",order:"fldYhSgVHZMVcYnNR",key:"fldW07AoiCbSAIKOv"};
/* v5: ReLearn Operating System → Guests (read only here) and Team (names for "Handled by") */
const G={name:"fldNY5M1pm5Ou81m2",stage:"fldHC3y4JoQ2WrH74",by:"fldpIctEolGxEXaUl",src:"fld3UZHYgyWTM07S4",first:"fldqq3T2VQvzkrahz",last:"fldgEkh72k5l3PTMI",pre:"fldomKSjQMs9hbiBm",latest:"fldE4o0Qd74ULCY64",next:"fldpNuRPhiUihpeeq",ig:"fldxdL2tg8kTRiZ5q",email:"fldiGymTA05AQCAGv",phone:"fldx4MfXr6vKoignd",web:"fld0yvck84cpDCN6l",based:"fldos0LZw3u9oxLc1",ga:"fldw7Wrey5aLHXmtH",lead:"fld8qPIstXN20yPhr"};
const TM={name:"fld2G3e9kvvIeeLsz"};
const L={name:"fldaM6EiV2pt5heTL",co:"fldfUHhb1q9iGWIxc",what:"fldv95btbIfu3TM7P",stage:"fld9dYK6yVeu2idCE",source:"fldu5vfxkaBLk723O",owner:"fld9yLxt4YBGOPzPk",next:"fldTT0PDsKMBIBnoH",chase:"fldQOtcsa4ikswwtZ",value:"fldosD7IyxCu3VJz8",est:"fldWzQ4sSjCP5Q5lM",leadIn:"fldYW8VEl9A8iVcwZ",latest:"fldobTBT56hssM99t",want:"fldZplPINUodf5pGL",services:"fldOHJnhJbAU1bs1w",wonOn:"fld2zs6twTbc4l2Ji",needed:"fld1IdWPYigBrKp4I",likely:"fldVoItstzuylyzZq",confirmed:"fldB7ysIGhuCtpFb9",lastC:"fldpxYod50hGHPVfY",contacts:"fldjqxAlAsTI3xrVQ"};
const C={sum:"fldy9VdOSuTN5819v",lead:"fld05QLqJZhwtxzMq",date:"fldz5qOHXOrhq037h",ch:"fldHQQt9pmyZUJTBD",who:"fld3KOzHRUd4qFzhO",dir:"fld0JWVKtB3eKuXXx",contact:"fld6Vwp4QraPTuWJJ"};
const CA={lead:"fldtoe4kLoNVwm4hS",type:"fld3gvsFJuUVC4bIn",status:"fldU735Vhbu2kOhiV",date:"fldvMLlzyJFU0AAk8"};
const MI={amount:"fldh8970GdUQofMEf",month:"fld3yVQA1cloQHbo2",lead:"fldTOXIrWHfZFo2sY"};
const CT={name:"fldxdMB2aMlWKX6G4",email:"fldiPtMjxByqKJPRH",phone:"fldPDFnISiBzuchX5",ig:"flduwosPPXV5jZ1vv",li:"fldIiFQTDk5HxcxYQ",co:"fldkWeZQMNc8CsHAI",what:"fldUKdhoOFCPspBAb",src:"flddsl0GLnhfxfKV3",rvurl:"fld3BMwUIxQ0sQQ5T",rvboard:"fldEbEJBd5y25KztX",notes:"fldBibxFYIMoGMBmG",leads:"fldzRCC15WKfqWXiZ",conv:"fldh1cOW0hjHnubtS",sp:"fldDzmICl1rEB5VNM",loc:"fldfVws9tAVH7VhZ9",web:"fldAPJqGo7OmQNJ1O"};
const CL={name:"fldfgTWP4kmqOR1PM",email:"fldXsdyYDy09CcKft",ref:"fldtlKxMyMdBlONii",notes:"fldKi8vnk815RHNxM",lastc:"fldLkXtqOOKtbJSff",src:"fldu45Iq06QRDYHmc",owner:"fldna9HW8iuYhrXzj",co:"fldVkJuveVd3o91Kv",phone:"fldRluwhfTEqLDrbU",ig:"fldseQq7L4SacNSO9",li:"fldNG7PV5C3yvbqDU",ev:"fld4RreDcpnu5pSZD",so:"fldW8WGwM5e9dTskw",ep:"fld7kQlKeqq6il0Wg",up:"fldp2KaEPCKwycmJS",ai:"fldhvLroYlyhnXUS5",uw:"fldtRg57RoPoh7T9j",val:"fldlg9bBoEQQUZgfL",est:"fldBKJzfVlaej4m3n",want:"fldxZnwp2GHOGkFbA",next:"fld7imdDjKHyDL0me",chase:"fldnZhBh3bxyaVPfc",leadin:"fld6Lai2X2cUERUZd",contact:"fldznYfazZWZks5qu",services:"fldLroATHcoTf8xYQ",pq:"fldK90NzcExOUvCon",pqo:"fldUkfb8qwLfr1197"};
/* Kash's Sales pipeline */
const SP={deal:"fldS0mVHd5XBFbkv3",co:"fldFJFoJwhYtDOuu6",what:"fldy66nPclJfzI03z",how:"fldDvMxQZw3LPQi41",owner:"fldQ9OtRGQLD9tunG",needed:"fldldfgRJjTIkoBVl",chase:"fldi1dhednSIQtHYA",value:"fldqazE03Ixy8lgoF",est:"fld8ODmb9sQZwj62E",lastc:"fld11hvR7CaAYoyVm",leadin:"fldhS0rtzifQvJ84r",notes:"fldqjfFQZMtHGZMoW",contacts:"fldBOwUAyyjBbI2OR",stage:"fldEqvnLp1cy4v3lV",origin:"fldhUFKjSU9rMsZUK",from:"fldpDX0gQ99r2Zbs7",jade:"fldnh7z4LMVxfDXZn",rv:"fld3CJAfP6rXjS2K0",offer:"fldQGjMa4mznxYBZB",services:"fld3KVRttv4AfQ7Hu"};
/* Sarah's upsell list (Rise Voice), read only for the live Pre-qual status */
const UL={name:"fldlPqobCpeDX0J08",stage:"fldl6qlqdI2rhcoHP",action:"fldTX2CBUgiKE5kop",next:"fldzGpxkF3IM2SRDH"};

const SP_STAGES=["Pre-qual","Potential","To contact","In conversation","Follow-up","Discovery call","No reply","Handover to Ops","Closed","Lost"];
const PLATE=new Set(["Potential","To contact","In conversation","Follow-up","Discovery call"]); /* on his plate */
const ORIGINS=["Podcast","Referral","Network","Old client","Old funnels / GHL","Personal Instagram","Event","Instagram","LinkedIn","Episode request","Upwork","Upsell","AI consulting","Rise Voice","Tool","Other"];
const JADE_STAGES=["10 – Lead in","20 – Audit booked","30 – Audit held","40 – Growth plan sent","50 – Follow-up call","60 – Proposal","70 – Won","79 – Lost","80 – Re-approach (60–90 days)"];
const ORIGIN_ST=["New","Sales Pipeline","No Reply","Won","Lost","Not Applicable"];
const PROPOSAL_ST=["New","Build Proposal","Send Proposal","Proposal Sent","Sales Pipeline","Won","Lost","Archive"];
/* v5 (Karen, 5 Nov): Pre-qual Pipeline replaces Events, Referrals, Instagram & LinkedIn and Episode requests (their old stage fields stay in Airtable, no longer written from here) */
const PQ_STAGES=["New","First Outreach","Pre-qual","In Conversation","Follow-up","Email sequence","Podcast Pipeline","Sales Pipeline","No Reply","Archive"];
const PQ_ORIGINS=["Events","Referrals","ReLearn community leads","Kash brand community","Episode keyword","Network","IG organic"];
/* Pre-qual origin → the deal's Origin when it is handed to the Sales Pipeline */
const PQO_ORIGIN={Events:"Event",Referrals:"Referral","Episode keyword":"Episode request",Network:"Network","IG organic":"Instagram"};
const BOARDS=[
  {key:"jade",title:"Growth Audit Pipeline",owner:"Jade",kind:"jade",field:L.stage,stages:JADE_STAGES,defOwner:"Jade",from:"Growth audit path (Jade)",blurb:"The podcast funnel: guests and podcast leads. Jade qualifies them for the growth audit; her stages are her own."},
  {key:"prequal",title:"Pre-qual Pipeline",owner:"Gretta",kind:"cl",field:CL.pq,src:[],source:"",defOwner:"Greta",from:"Pre-qual (Gretta)",stages:PQ_STAGES,closed:new Set(["No Reply","Archive"]),blurb:"Every new lead from events, referrals, communities, episode keywords, the network and Instagram. Gretta checks fit and route, then hands them on."},
  {key:"upwork",title:"Upwork Pipeline",owner:"Danica",kind:"cl",field:CL.uw,src:["Upwork"],source:"Upwork",defOwner:"Danica",from:"Upwork (Danica)",stages:["New","Proposal Sent","Sales Pipeline","No Reply","Won","Lost","Not Applicable"],blurb:"Upwork jobs and proposals, handled by Danica."},
  {key:"upsell",title:"Upsells Pipeline",owner:"Sarah",kind:"cl",field:CL.up,src:["Upsell"],source:"Upsell",defOwner:"Sarah",from:"Upsells (Sarah)",stages:PROPOSAL_ST,blurb:"Existing clients ready for more. Sarah qualifies before it reaches the sales pipeline."}
];
const BK={};BOARDS.forEach(b=>BK[b.key]=b);
const SPB={key:"sp",title:"Sales pipeline",owner:"Kash",kind:"sp",field:SP.stage,stages:SP_STAGES};
/* Podcast Guests Pipeline: read only (no Airtable write access to the Operating System base from here) */
const GUEST_ST=["0 – Researched","10 – Outreach sent","19 – No reply","20 – In conversation","28 - Later Trip","28 – Not now","28 – Not now (try a later trip)","29 – Not interested","30 – Intro call booked","40 – Intro call done","50 – Recording booked","60 – Episode released (stay in touch)"];
const GUEST_CAP=50;
const gLabel=st=>String(st||"").replace(/^\d+\s*[–-]\s*/,"");
/* old view keys that no longer exist land on the board that replaced them */
const OLD_VIEW={event:"prequal",referral:"prequal",social:"prequal",episode:"prequal",ai:"mine",overview:"mine"};
const DONE=new Set(["70 – Won","79 – Lost","Offer accepted (Closed)","Offer declined (Rejected)","No response (Rejected)","Sales Pipeline","Growth Plan Booking","Email sequence","Podcast Pipeline","No Reply","Won","Lost","Not Applicable","Archive","No reply","Handover to Ops","Closed"]);
const HANDED=new Set(["Sales Pipeline","Growth Plan Booking","Email sequence","Podcast Pipeline"]);
const isDone=s=>!!s&&(DONE.has(s)||s.startsWith("→"));
const SRC_LABEL={"🎙️ Podcast":"Podcast","📣 RISEVOICE":"Rise Voice","🎪 Events":"Event","🛠️ Tool":"Tool","🤝 Referral / direct":"Referral / direct","Other":"Other"};
const CT_LABEL={"Podcast guest":"Podcast","Kash in person":"Network"};
const ORIGIN_CT={"Old client":"Old client","Old funnels / GHL":"Old funnels / GHL","Personal Instagram":"Personal Instagram",Network:"Network",Podcast:"Podcast guest",Referral:"Referral",Event:"Event",Instagram:"Instagram",LinkedIn:"LinkedIn","Episode request":"Episode request",Upwork:"Upwork",Upsell:"Upsell","AI consulting":"AI consulting"};
const OFFERS=["High ticket","Mid ticket","Low ticket","AI solutions","Sponsor","Not sure yet"];
const SERVICES=["Podcast placements","Podcast build","Social growth","Email monetisation","Events / speaking","Sponsorship","AI and systems","Talent"];
const CHANNELS=["WhatsApp","Email","Instagram","LinkedIn","Call","In person","Other"];
const OWNERS=["Kash","Jade","Sales hire"];
const CL_OWNERS=["Greta","Sarah","Jade","Kash","Danica"];
const ICON={"High ticket":"M6 3h12l4 6-10 12L2 9zM2 9h20M12 21 8 9l4-6 4 6z","Mid ticket":"M12 2 2 7l10 5 10-5zM2 12l10 5 10-5M2 17l10 5 10-5","Low ticket":"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z","AI solutions":"M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6","Sponsor":"M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.3 3.2 1.3-7-5-4.8 7-.9z","Not sure yet":"M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"};
/* origin icons: the platform's own colour (or the closest), inside a soft grey tag */
const OI={
  "Podcast":{c:"#7C3AED",p:"M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"},
  "Instagram":{c:"#E1306C",p:"M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM17.5 6.5h.01"},
  "LinkedIn":{raw:'<rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/><path d="M7.5 10.5v6M7.5 7.3v.01M11.5 16.5V13a2 2 0 0 1 4 0v3.5M11.5 10.5v6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>'},
  "Upwork":{raw:'<rect x="2" y="2" width="20" height="20" rx="5" fill="#14A800"/><path d="M6.5 8v3.5a2.6 2.6 0 0 0 5.2 0V8M11.7 10.5c.9 2.4 2.1 3.8 3.6 3.8a2.4 2.4 0 0 0 0-4.8c-1.7 0-2.6 1.9-3.4 4.2L11 17" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'},
  "Event":{c:"#EA580C",p:"M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4zM13 5v2M13 11v2M13 17v2"},
  "Referral":{c:"#0D9488",p:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"},
  "Network":{c:"#2563EB",p:"M18 2a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM6 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM18 16a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4"},
  "Episode request":{c:"#0891B2",p:"M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"},
  "Upsell":{c:"#059669",p:"M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"},
  "AI consulting":{c:"#9333EA",p:"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"},
  "Rise Voice":{c:"#4338CA",p:"M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"},
  "Tool":{c:"#64748B",p:"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"},
  "Old client":{c:"#B45309",p:"M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"},
  "Old funnels / GHL":{c:"#475569",p:"M3 4h18l-7 8.5V19l-4 2v-8.5z"},
  "Personal Instagram":{c:"#C13584",p:"M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM17.5 6.5h.01"},
  "Other":{c:"#94A3B8",p:"M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z"}
};
OI["Referral / direct"]=OI.Referral;OI["In person"]=OI.Network;
const DUE_ORDER={overdue:0,today:1,week:2,later:3};
const RO_BLOCK=new Set(["fab","svc","spsvc","clsvc","postc","addconv","savelead","dropgo","dropsave","dropmanual","inadd","insave","logct","logsp"]);
const VIEW_ONLY="View only on this link. Open the Claude copy to make changes.";
const CHEV="M15 18l-6-6 6-6",EXP="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",PLUS="M12 5v14M5 12h14",XI="M6 6l12 12M18 6 6 18",MIC="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8";

const S={boxOpen:(()=>{try{return localStorage.getItem("slBox")!=="0"}catch(e){return true}})(),pqGroup:(()=>{try{return localStorage.getItem("slPqGroup")==="origin"?"origin":"stage"}catch(e){return "stage"}})(),loaded:false,loading:false,err:"",leads:[],conv:[],calls:[],money:[],contacts:[],cl:[],sp:[],ul:[],pipelines:[],guests:[],guestTeam:[],view:"mine",spView:"pipeline",groupBy:"date",openId:null,openCl:null,openClB:null,openSp:null,openCt:null,openG:null,gAll:{},ctAll:false,comments:{},cOpen:false,adding:false,drop:null,prevLastC:{},inAdd:null,cq:"",co:""};
const el=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sv=v=>v==null?"":(typeof v==="object"?(v.name||""):String(v));
const ids=v=>Array.isArray(v)?v.map(x=>typeof x==="object"?x.id:x):[];
const pad=n=>String(n).padStart(2,"0");
const now=new Date();const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());const TODAY=ymd(now);
const plusDays=n=>{const d=new Date(now);d.setDate(d.getDate()+n);return ymd(d)};
const dd=(a,b)=>Math.round((Date.parse(a)-Date.parse(b))/864e5);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],WD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const short=d=>{if(!d)return"";const x=new Date(String(d).slice(0,10)+"T12:00:00");return x.getDate()+" "+MON[x.getMonth()]};
const agoL=d=>{if(!d)return"no contact logged";const n=dd(TODAY,d);return n<=0?"today":n===1?"1 day ago":n+" days ago"};
const money=n=>!n?"–":n>=1000?"$"+(Math.round(n/100)/10)+"K":"$"+n;
const full=n=>n?"$"+Number(n).toLocaleString("en-US"):"";
const digits=v=>{const d=String(v).replace(/[^0-9]/g,"");return d?Number(d):null};
const norm=s=>String(s||"").toLowerCase().replace(/^@/,"").replace(/\s+/g," ").trim();
const svg=(d,s)=>`<svg width="${s||14}" height="${s||14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;
const viewer=()=>{const v=(window.__rlViewer||(window.claude?.use?"":"Kash")).trim();return OWNERS.includes(v)?v:""};
const atUrl=(b,t,id)=>"https://airtable.com/"+b+"/"+t+"/"+id;
const idFromUrl=u=>{const m=String(u||"").match(/(rec[A-Za-z0-9]{14})/);return m?m[1]:""};
const lastNote=t=>{const p=String(t||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);return p.length?p[p.length-1]:""};
function dueOf(chase){if(!chase)return{due:"later",dueL:"No chase date"};const n=dd(chase,TODAY);if(n<0){const k=-n;return{due:"overdue",dueL:"Overdue · "+(k>=28?Math.round(k/30)+(Math.round(k/30)>1?" months":" month"):k+(k>1?" days":" day"))}}if(n===0)return{due:"today",dueL:"Today"};if(n<=7)return{due:"week",dueL:WD[new Date(chase+"T12:00:00").getDay()]+" "+short(chase)};return{due:"later",dueL:short(chase)}}
function otagH(o){const k=OI[o]?o:"Other";const i=OI[k];const ic=i.raw?`<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">${i.raw}</svg>`:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${i.c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${i.p}"></path></svg>`;return `<span class="sl-otag">${ic}${esc(o||"Other")}</span>`}
/* the offer = services in play: tags on cards, clickable chips in the windows */
const svcTagsH=list=>(list||[]).map(x=>`<span class="sl-svc">${esc(x)}</span>`).join("");
function svcPickH(act,list,gid){const ro=S.ro;return `<div role="group" aria-labelledby="${gid}"><p class="sl-sub" id="${gid}">Services in play (the offer)${ro?"":` <span style="text-transform:none;letter-spacing:0;font-weight:400">· click to add or remove</span>`}</p><div class="sl-chips">${ro?((list||[]).length?list.map(x=>`<span class="sl-chip" aria-pressed="true">${esc(x)}</span>`).join(""):'<span class="pm">None yet</span>'):SERVICES.map(x=>`<button type="button" class="sl-chip" data-act="${act}" data-v="${esc(x)}" aria-pressed="${(list||[]).includes(x)}">${esc(x)}</button>`).join("")}</div></div>`}
function tagH(o){return `<span class="sl-tag${o==="High ticket"?" hi":""}">${svg(ICON[o]||ICON["Not sure yet"],13)}${esc(o)}</span>`}

let mcpP=null;
async function mcp(){if(!window.claude?.use)throw new Error("unavailable");if(!mcpP)mcpP=window.claude.use("mcp");const m=await mcpP;if(!m)throw new Error("unavailable");return m}
async function call(tool,args){
  /* n8n-hosted copy (Kash's link): the same calls go to the page's own save route, which allows only this tab's tables and fields */
  if(!window.claude?.use){const res=await fetch(location.pathname.replace(/\/$/,"")+"/sales-api",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tool,args})});let j={};try{j=await res.json()}catch(e){}if(!res.ok||j.isError)throw new Error("airtable");return j.payload||{}}
  const m=await mcp();const r=await m.callTool("Airtable",tool,args,{cache:false});if(r&&r.isError)throw new Error("airtable");return (r&&r.payload)||{}}
async function list(base,tbl,fields){let out=[],c=null;do{const p=await call("list_records_for_table",{baseId:base,tableId:tbl,fieldIds:fields,pageSize:1000,...(c?{cursor:c}:{})});out=out.concat(p.records||[]);c=p.nextCursor||null}while(c);return out.map(r=>Object.assign({_id:r.id},r.cellValuesByFieldId||{}))}
async function upd(base,tbl,id,fields,typecast){return call("update_records_for_table",{baseId:base,tableId:tbl,records:[{id,fields}],typecast:!!typecast})}
async function mk(base,tbl,fields,typecast){const p=await call("create_records_for_table",{baseId:base,tableId:tbl,records:[{fields}],typecast:!!typecast});return ((p.records||[])[0]||{}).id}

function toast(t){let x=el("slToast");if(!x){x=document.createElement("div");x.id="slToast";x.className="sl-toast";x.setAttribute("role","status");document.body.appendChild(x)}x.textContent=t;x.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{x.hidden=true},2400)}

async function load(force){
  if(S.loading||(S.loaded&&!force))return;S.loading=true;S.err="";if(!S.loaded)el("slBody").innerHTML='<p class="pm">Loading sales…</p>';
  try{
    if(!window.claude?.use){
      /* n8n-hosted copy: data from {page path}/sales (records {id, fields:{fldXXX:value}}); saves go through {page path}/sales-api */
      S.ro=false;S.n8n=true;
      const res=await fetch(location.pathname.replace(/\/$/,"")+"/sales",{cache:"no-store"});if(!res.ok)throw new Error("sales feed "+res.status);
      const j=await res.json();const n=a=>(a||[]).map(r=>Object.assign({_id:r.id},r.fields||{}));
      Object.assign(S,{leads:n(j.leads),conv:n(j.conversations),calls:n(j.calls),money:n(j.moneyIn),contacts:n(j.contacts),cl:n(j.companyLeads),sp:n(j.salesPipeline),ul:n(j.upsellList),pipelines:n(j.pipelines),guests:n(j.guests),guestTeam:n(j.guestTeam),noSp:!j.salesPipeline,noPl:!j.pipelines,noG:!j.guests,fetchedAt:j.fetchedAt||"",loaded:true});
    }else{
      const opt=p=>p.catch(()=>[]);
      /* the three v5 tables are optional: if one fails the tab still loads, with that part empty */
      const [leads,conv,calls,mon,contacts,cl,sp,ul,pls,gs,gt]=await Promise.all([list(CB,T.leads,Object.values(L)),opt(list(CB,T.conv,Object.values(C))),opt(list(CB,T.calls,Object.values(CA))),opt(list(CB,T.money,Object.values(MI))),opt(list(CB,T.contacts,Object.values(CT))),opt(list(RB,T.cl,Object.values(CL))),list(CB,T.sp,Object.values(SP)),opt(list(RB,T.ul,Object.values(UL))),opt(list(CB,T.pipes,Object.values(PL))),opt(list(GB,T.guests,Object.values(G))),opt(list(GB,T.team,[TM.name]))]);
      Object.assign(S,{leads,conv,calls,money:mon,contacts,cl,sp,ul,pipelines:pls,guests:gs,guestTeam:gt,noSp:false,noPl:!pls.length,noG:!gs.length,loaded:true});
    }
  }catch(e){S.err=String(e&&e.message||e)}
  S.loading=false;render();
}

/* ---------- derived data ---------- */
function deriveJ(){
  const convBy={};S.conv.forEach(c=>ids(c[C.lead]).forEach(id=>(convBy[id]=convBy[id]||[]).push(c)));
  Object.values(convBy).forEach(a=>a.sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||""))));
  return S.leads.map(r=>{
    const stage=sv(r[L.stage])||JADE_STAGES[0];const src=sv(r[L.source]);
    const cv=convBy[r._id]||[];const lc=cv[0];
    const lastC=[r[L.lastC]||"",lc?lc[C.date]||"":""].sort().pop();
    return Object.assign({kind:"jade",id:r._id,r,name:r[L.name]||"(no name)",co:r[L.co]||r[L.what]||"",origin:SRC_LABEL[src]||src.replace(/^[^A-Za-z]+/,"")||"Other",stage,closed:/Won|Lost/i.test(stage),chase:r[L.chase]||"",conv:cv,lastConv:lc,lastC,offer:sv(r[L.confirmed])||sv(r[L.likely])||"Not sure yet",value:r[L.value]||0,est:!!r[L.est],done:(r[L.lastC]||"")===TODAY,owner:sv(r[L.owner]),services:(r[L.services]||[]).map(sv),board:BK.jade,boards:[BK.jade]},dueOf(r[L.chase]||""));
  });
}
function deriveCL(){
  return S.cl.filter(r=>String(r[CL.name]||"").trim()).map(r=>{
    const src=sv(r[CL.src]);const pqo=sv(r[CL.pqo]);
    /* Pre-qual: only rows with a Pre-qual stage; Upwork and Upsells also by Source, as before */
    const boards=BOARDS.filter(b=>b.kind==="cl"&&(b.src.includes(src)||sv(r[b.field])));
    const b0=boards[0]||null;const stage=b0?sv(r[b0.field]):"";const lastC=r[CL.lastc]||"";
    return Object.assign({kind:"cl",id:r._id,r,name:String(r[CL.name]).trim(),co:r[CL.co]||"",origin:src||PQO_ORIGIN[pqo]||(b0&&b0.source)||"Other",pqo,boards,board:b0,stage,closed:isDone(stage),chase:r[CL.chase]||"",owner:sv(r[CL.owner]),want:r[CL.want]||"",next:r[CL.next]||"",notes:r[CL.notes]||"",lastC,value:r[CL.val]||0,est:!!r[CL.est],services:(r[CL.services]||[]).map(sv),done:lastC===TODAY},dueOf(r[CL.chase]||""));
  });
}
function deriveSP(){
  return S.sp.filter(r=>String(r[SP.deal]||"").trim()).map(r=>{
    const stage=sv(r[SP.stage])||"Pre-qual";const lastC=r[SP.lastc]||"";const rv=r[SP.rv]||"";
    return Object.assign({kind:"sp",id:r._id,r,name:String(r[SP.deal]).trim(),co:r[SP.co]||"",origin:sv(r[SP.origin])||"Other",stage,pre:stage==="Pre-qual",plate:PLATE.has(stage),closed:!PLATE.has(stage)&&stage!=="Pre-qual",chase:r[SP.chase]||"",owner:sv(r[SP.owner]),needed:r[SP.needed]||"",notes:r[SP.notes]||"",lastC,value:r[SP.value]||0,est:!!r[SP.est],offer:sv(r[SP.offer])||"Not sure yet",services:(r[SP.services]||[]).map(sv),from:sv(r[SP.from]),jadeId:ids(r[SP.jade])[0]||"",rvId:idFromUrl(rv),rvUl:/tbl8xDFVwfdMS7v3v/.test(rv),contactIds:ids(r[SP.contacts]),done:lastC===TODAY,board:SPB,boards:[SPB]},dueOf(r[SP.chase]||""));
  });
}
function derive(){
  const J=deriveJ(),K=deriveCL(),P=deriveSP();
  const spOf={};P.forEach(p=>{if(p.jadeId)spOf[p.jadeId]=spOf[p.jadeId]||p;if(p.rvId&&!p.rvUl)spOf[p.rvId]=spOf[p.rvId]||p});
  return {J,K,P,spOf,all:J.concat(K,P)};
}
/* where a Pre-qual (or handed-over) deal sits on its team board right now, read live */
function liveOf(p,D){
  if(p.jadeId){const l=D.J.find(x=>x.id===p.jadeId);if(l)return {who:"Jade",where:BK.jade.title,stage:l.stage,item:l}}
  if(p.rvId&&!p.rvUl){const c=D.K.find(x=>x.id===p.rvId);if(c)return {who:c.owner||(c.board?c.board.defOwner:""),where:c.board?c.board.title:"Company Leads",stage:c.stage||"No stage yet",item:c}}
  if(p.rvId&&p.rvUl){const u=S.ul.find(x=>x._id===p.rvId);if(u)return {who:"Sarah",where:"Sarah's upsell list",stage:[sv(u[UL.stage]),sv(u[UL.action])].filter(Boolean).join(" · ")||"On the list",item:null}}
  return null;
}
function boardItems(b,D){return b.kind==="jade"?D.J:b.kind==="sp"?D.P:D.K.filter(c=>c.boards.includes(b))}
function stageOf(b,it){return b.kind==="cl"?sv(it.r[b.field]):it.stage}
const CLOSED_ST=new Set(["70 – Won","79 – Lost","Offer accepted (Closed)","Offer declined (Rejected)","No response (Rejected)","Won","Lost","Not Applicable","Archive","Closed"]);
function health(b,D){
  const open=boardItems(b,D).filter(i=>!CLOSED_ST.has(stageOf(b,i)));
  if(!open.length)return{label:"Empty",dot:"var(--grey-line)",color:"var(--muted)",open:0,od:0};
  const od=open.filter(i=>i.due==="overdue"&&!i.done).length;
  if(od>=2)return{label:"Stuck",dot:"var(--act)",color:"var(--act)",open:open.length,od};
  if(od===1)return{label:"Slowing",dot:"#E3A008",color:"var(--watch)",open:open.length,od};
  return{label:"On track",dot:"var(--ok)",color:"var(--ok)",open:open.length,od};
}
/* traffic light for a column title: red = someone overdue, amber = due today, green = moving, grey = empty or a closing stage */
/* columns: colour follows the stage sequence (dark grey → amber → green; won green, lost red, parked pale grey) */
const LOST_ST=new Set(["79 – Lost","Lost","Offer declined (Rejected)","No response (Rejected)"]);
const WON_ST=new Set(["70 – Won","Won","Closed","Handover to Ops","Offer accepted (Closed)","Sales Pipeline","Growth Plan Booking"]);
const OUT_ST=new Set(["No reply","No Reply","Not Applicable","Archive","80 – Re-approach (60–90 days)"]);
function stageTone(stages,st){
  if(LOST_ST.has(st))return"lost";if(WON_ST.has(st))return"won";if(OUT_ST.has(st))return"out";
  const open=stages.filter(x=>!LOST_ST.has(x)&&!WON_ST.has(x)&&!OUT_ST.has(x));const i=open.indexOf(st);
  return !st||i<0?"s0":"s"+(open.length<2?0:Math.round(i*5/(open.length-1)));
}
/* what each column means, in two short lines (board-specific first) */
const STAGE_INFO={
  "sp|Pre-qual":"With the teams. Nothing needed from you yet.","sp|Potential":"Worth pursuing. No outreach planned yet.","sp|To contact":"You reach out first: a message, call or intro.","sp|In conversation":"You're talking. Move it to a call or a proposal.","sp|Follow-up":"Proposal or call done. Chase for a yes or no.","sp|Discovery call":"Call booked. Prepare, take it, log what was said.","sp|No reply":"Gone quiet after follow-ups. Try again later.","sp|Handover to Ops":"Won. Hand the client over to production.","sp|Closed":"Signed and handed over. Nothing left to do.","sp|Lost":"They said no, or it isn't a fit.",
  "10 – Lead in":"New guest or lead. Jade qualifies them for a growth audit.","20 – Audit booked":"Growth audit booked with Kash.","30 – Audit held":"Audit done. Growth plan to write.","40 – Growth plan sent":"Plan sent. Waiting for their response.","50 – Follow-up call":"Call to go through the plan and next steps.","60 – Proposal":"Proposal sent. Chase for a decision.","70 – Won":"Signed. Hand over to production.","79 – Lost":"Said no, or not a fit.","80 – Re-approach (60–90 days)":"Not now. Try again in 60–90 days.",
  "Contact info provided by client":"A client shared their details. Not contacted yet.","First outreach":"First message sent. Waiting for a reply.","Following up":"No reply yet. Chasing.","Call booked":"Intro call booked.","Post call follow-up":"Call done. Following up on next steps.","Offer accepted (Closed)":"Won: they accepted the offer.","Offer declined (Rejected)":"They turned the offer down.","No response (Rejected)":"Never replied. Closed.",
  "New":"New lead. Not qualified yet.","event|New":"Met at an event. Not qualified yet.","upwork|New":"New Upwork job or invite. Not applied yet.","upsell|New":"Client flagged as ready for more.","ai|New":"Interested in AI consulting. Not qualified yet.",
  "Growth Plan Booking":"Handed to Jade to book a growth audit.","Sales Pipeline":"Handed to Kash: now on his sales pipeline.","Build Proposal":"Proposal being prepared.","Send Proposal":"Proposal ready. Send it.","Proposal Sent":"Sent. Waiting for their answer.","upwork|Proposal Sent":"Proposal sent on Upwork. Waiting for a reply.",
  "No Reply":"Didn't answer after follow-ups.","Won":"Signed.","Lost":"Said no.","Not Applicable":"Not a sales lead: spam, fan or peer.","Archive":"Parked for now.","":"No stage set yet. Pick one."};
const stageInfo=(bk,st)=>STAGE_INFO[bk+"|"+st]??STAGE_INFO[st]??"";
/* folded columns, remembered per viewer; Pre-qual starts folded */
const COLS_KEY="slCols";
S.cols=Object.assign({sp:["Pre-qual"]},(()=>{try{const v=JSON.parse(localStorage.getItem(COLS_KEY)||"null");return v&&typeof v==="object"?v:{}}catch(e){return {}}})());
const isFolded=(bk,st)=>(S.cols[bk]||[]).includes(st);
function toggleFold(bk,st){const a=S.cols[bk]||[];S.cols[bk]=a.includes(st)?a.filter(x=>x!==st):a.concat([st]);try{localStorage.setItem(COLS_KEY,JSON.stringify(S.cols))}catch(e){}}
function colH(bk,stages,st,n,inner,add,extra){
  const tone=stageTone(stages,st),lab=st||"No stage yet",info=stageInfo(bk,st),d=`data-board="${esc(bk)}" data-stage="${esc(st)}"`;
  if(isFolded(bk,st))return `<div class="sl-col sl-colc stx st-${tone}" ${d}><button type="button" class="sl-cexp" data-act="fold" ${d} aria-expanded="false" aria-label="Show ${esc(lab)}, ${n} ${n===1?"card":"cards"}" title="${esc(info)}"><i class="sl-dot"></i><small>${n}</small><span class="v">${esc(lab)}</span></button></div>`;
  return `<div class="sl-col" ${d}><div class="sl-colh stx st-${tone}"><div class="t"><span><i class="sl-dot"></i>${esc(lab)}</span><span class="r"><small>${n}</small><button type="button" class="sl-ccol" data-act="fold" ${d} aria-expanded="true" aria-label="Fold ${esc(lab)}" title="Fold this column">${svg(CHEV,15)}</button></span></div>${info?`<p class="sl-cinfo">${esc(info)}</p>`:""}${extra||""}</div>${inner}${add}</div>`;
}
/* the row under the stats: the name search (moved in by render) and the view's own controls */
const toolsH=x=>`<div class="sl-tools" id="slTools">${x||""}</div>`;
const FOLD_FOOT="Columns run from grey (early) through amber to green (won); red means lost. Fold any column with its arrow.";
/* everyone: one entry per Contact, with every record linked to it; records without a Contact yet stand on their own */
function peopleOf(D){
  const by={};S.contacts.forEach(c=>{by[c._id]={id:c._id,ct:c,name:String(c[CT.name]||"(no name)").trim(),co:c[CT.co]||"",what:c[CT.what]||"",origin:CT_LABEL[sv(c[CT.src])]||sv(c[CT.src])||"",items:[],convs:[]}});
  const byRv={};S.contacts.forEach(c=>{const x=idFromUrl(c[CT.rvurl]);if(x)byRv[x]=c._id});
  const loose=[];const leadP={};
  D.J.forEach(l=>{const cid=ids(l.r[L.contacts]).find(x=>by[x]);if(cid){by[cid].items.push(l);leadP[l.id]=by[cid]}else loose.push(l)});
  D.K.filter(k=>k.board).forEach(k=>{const cid=[idFromUrl(k.r[CL.contact]),byRv[k.id]].find(x=>x&&by[x]);cid?by[cid].items.push(k):loose.push(k)});
  D.P.forEach(p=>{const cs=p.contactIds.filter(x=>by[x]);cs.length?cs.forEach(x=>by[x].items.push(p)):loose.push(p)});
  const out=Object.values(by).concat(loose.map(it=>{const p={id:"i:"+it.id,ct:null,name:it.name,co:it.co,what:"",origin:it.origin,items:[it],convs:[]};if(it.kind==="jade")leadP[it.id]=p;return p}));
  S.conv.forEach(c=>{const ps=new Set();ids(c[C.contact]).forEach(x=>by[x]&&ps.add(by[x]));ids(c[C.lead]).forEach(x=>leadP[x]&&ps.add(leadP[x]));ps.forEach(p=>p.convs.push(c))});
  out.forEach(p=>{p.convs.sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||"")));
    if(!p.origin)p.origin=(p.items[0]&&p.items[0].origin)||"Other";if(!p.co)p.co=(p.items.find(i=>i.co)||{}).co||"";
    p.items.sort((a,b)=>(a.kind==="sp"?0:1)-(b.kind==="sp"?0:1));
    p.lastC=[...p.items.map(i=>i.lastC||""),...p.convs.map(c=>c[C.date]||"")].sort().pop()||""});
  return out.sort((a,b)=>String(b.lastC).localeCompare(String(a.lastC))||a.name.localeCompare(b.name));
}
const whereOf=it=>it.kind==="sp"?"Sales pipeline":it.board?it.board.title:"Company Leads";
const stageLine=it=>[it.co,it.kind==="cl"?(it.board?it.board.title+" · ":"")+(it.stage||"No stage yet"):it.stage].filter(Boolean).join(" · ");
const spChip=(it,D)=>{const p=D.spOf[it.id];return p&&!p.pre?`<span class="sl-kchip" title="On Kash's sales pipeline">Kash · ${esc(p.stage)}</span>`:""};

/* ---------- rendering ---------- */
function valRow(it){const ro=S.ro?" readonly":"";return `<div class="sl-vrow"><div class="sl-lbl"><label for="slV-${it.id}">Deal value / month</label>${it.est&&it.value?'<span class="sl-est">Estimate</span>':""}</div><input id="slV-${it.id}" type="text" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" data-act="value" value="${esc(full(it.value))}"${ro}></div>`}
/* a deal on his plate (by-date view): what's needed from him, chase, value */
function spCardH(p){
  const ro=S.ro?" readonly":"";
  return `<article class="sl-card ${p.done?"done":p.due}" data-id="${p.id}" data-kind="sp">
  <div class="sl-ch"><input type="checkbox" data-act="done" ${p.done?"checked":""}${S.ro?" disabled":""} aria-label="${p.done?"Untick":"Mark"} ${esc(p.name)} as contacted">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp">${esc(p.name)}</button><div class="sl-co">${esc([p.co,p.stage].filter(Boolean).join(" · "))}</div></div>
    <button type="button" class="sl-exp" data-act="opensp" aria-label="Open details for ${esc(p.name)}">${svg(EXP)}</button></div>
  <div class="sl-cm"><span class="sl-tags">${otagH(p.origin)}${tagH(p.offer)}${svcTagsH(p.services)}</span><span class="sl-due ${p.done?"":p.due}">${p.done?"Contacted today":esc(p.dueL)}</span></div>
  <div class="sl-box">
    <div><div class="sl-lbl"><label for="slN-${p.id}">What's needed from you</label><span>${p.lastC?"Last contact "+esc(short(p.lastC)):""}</span></div><textarea id="slN-${p.id}" rows="1" data-act="needed" placeholder="What do you need to do?"${ro}>${esc(p.needed)}</textarea></div>
    ${valRow(p)}
  </div></article>`;
}
function spKcardH(p,D){
  if(p.pre){const lv=liveOf(p,D);
    return `<article class="sl-card sl-kc sl-pq" data-id="${p.id}" data-kind="sp" draggable="${S.ro?"false":"true"}">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp" style="font-size:14px">${esc(p.name)}</button>${p.co?`<div class="sl-co" style="font-size:12.5px">${esc(p.co)}</div>`:""}</div>
    <div class="sl-cm"><span class="sl-tags">${otagH(p.origin)}</span></div>
    <p class="sl-with">${lv?`With ${esc(lv.who||"the team")} · ${esc(lv.where)} · <b>${esc(lv.stage)}</b>`:`With ${esc(p.owner||"the team")}`}</p></article>`}
  return `<article class="sl-card sl-kc ${p.done?"done":p.due}" data-id="${p.id}" data-kind="sp" draggable="${S.ro?"false":"true"}">
  <div class="sl-ch"><input type="checkbox" data-act="done" ${p.done?"checked":""}${S.ro?" disabled":""} aria-label="${p.done?"Untick":"Mark"} ${esc(p.name)} as contacted" style="width:18px;height:18px">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp" style="font-size:14px">${esc(p.name)}</button>${p.co?`<div class="sl-co" style="font-size:12.5px">${esc(p.co)}</div>`:""}</div></div>
  <div class="sl-cm"><span class="sl-tags">${otagH(p.origin)}${tagH(p.offer)}${svcTagsH(p.services)}</span><span class="sl-due ${p.done?"":p.due}">${p.done?"Contacted today":esc(p.dueL)}</span></div>
  <div class="sl-box"><div><span class="sl-cl"><b class="pm">Needed from you</b> ${esc(p.needed||"–")}</span></div>${p.value?`<div class="sl-kv"><b class="pm">Value</b><b>${esc(full(p.value))}/mo${p.est?' <span class="sl-est">Est.</span>':""}</b></div>`:""}</div>
  </article>`;
}
function kcardH(it,b,D){
  if(it.kind==="sp")return spKcardH(it,D);
  const j=it.kind==="jade",open=j?"open":"openc";
  const nx=j?(it.r[L.next]||""):it.next;
  const about=j?["Last",it.lastConv?(it.lastConv[C.sum]||"")+" · "+agoL(it.lastC):"Nothing logged yet"]:it.want?["Wants",it.want]:it.notes?["Notes",lastNote(it.notes)]:null;
  const sub=[it.co,!j&&it.owner?it.owner:""].filter(Boolean).join(" · ");
  const when=(j||it.chase)?`<span class="sl-due ${it.done?"":it.due}">${it.done?"Contacted today":esc(it.dueL)}</span>`:`<span class="sl-due">${it.lastC?"Last contact "+esc(short(it.lastC)):"No chase date"}</span>`;
  const rows=(about?`<div><span class="sl-cl"><b class="pm">${about[0]}</b> ${esc(about[1])}</span></div>`:"")+(nx?`<div><span class="sl-cl"><b class="pm">Next</b> ${esc(nx)}</span></div>`:"")+(it.value?`<div class="sl-kv"><b class="pm">Value</b><b>${esc(full(it.value))}/mo${it.est?' <span class="sl-est">Est.</span>':""}</b></div>`:"");
  return `<article class="sl-card sl-kc ${it.done?"done":it.due}" data-id="${it.id}" data-kind="${it.kind}" draggable="${S.ro?"false":"true"}">
  <div class="sl-ch">${j?`<input type="checkbox" data-act="done" ${it.done?"checked":""}${S.ro?" disabled":""} aria-label="${it.done?"Untick":"Mark"} ${esc(it.name)} as contacted" style="width:18px;height:18px">`:""}
    <div class="sl-cn"><button type="button" class="sl-name" data-act="${open}" style="font-size:14px">${esc(it.name)}</button>${sub?`<div class="sl-co" style="font-size:12.5px">${esc(sub)}</div>`:""}</div></div>
  <div class="sl-cm"><span class="sl-tags">${otagH(it.origin)}${j?tagH(it.offer):""}${svcTagsH(it.services)}${spChip(it,D)}</span>${when}</div>
  ${rows?`<div class="sl-box">${rows}</div>`:""}
  </article>`;
}
function inlineAdd(o){
  if(S.ro)return "";
  const key=[o.ctx,o.board||"",o.stage||"",o.chase||""].join("|");
  if(S.inAdd!==key)return `<button type="button" class="sl-inadd" data-act="inadd" data-ikey="${esc(key)}">${svg(PLUS,14)}Add a lead</button>`;
  return `<div class="sl-inform"><label class="vh" for="slIn">Name of the new lead</label><input id="slIn" placeholder="Name" autocomplete="off">
    ${o.board==="sp"?`<label class="vh" for="slInO">Origin</label><select id="slInO">${ORIGINS.map(x=>`<option ${x==="Network"?"selected":""}>${esc(x)}</option>`).join("")}</select>`:""}
    <div class="sl-inbtn"><button type="button" class="sl-ghost" data-act="incancel">Cancel</button><button type="button" class="sl-solid" data-act="insave" data-ikey="${esc(key)}">Add</button></div></div>`;
}
function rail(D,plate,people){
  const item=(k,t,n,dot,icon)=>`<button type="button" class="sl-ri" data-act="view" data-v="${esc(k)}" aria-current="${S.view===k?"page":"false"}">${icon?svg(icon,15):`<i class="sl-dot" style="background:${dot}"></i>`}<span>${esc(t)}</span>${n!=null?`<small>${n}</small>`:""}</button>`;
  return `<nav class="sl-rail" aria-label="Sales sections">${item("mine","Sales pipeline",plate.length,null,"M3 3v18h18M7 15l4-4 3 3 5-6")}${item("contacts","Contacts",people.length,null,"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8")}<div class="sl-rl">Team boards</div>${BOARDS.map(b=>{const h=health(b,D);return item(b.key,b.title,h.open,h.dot)}).join("")}</nav>`;
}
const kpiH=(lab,val,col)=>`<div class="sl-kpi"><span>${lab}</span><b style="color:${col||"var(--ink)"}">${val}</b></div>`;
/* HIS BOARD: the Sales pipeline */
function spH(D){
  const plate=D.P.filter(p=>p.plate);
  const od=plate.filter(p=>p.due==="overdue"&&!p.done).length,td=plate.filter(p=>p.due==="today"&&!p.done).length;
  const val=plate.reduce((a,p)=>a+(p.value||0),0);
  const kpis=`<div class="sl-kpis">${kpiH("On your plate",plate.length)}${kpiH("Overdue",od,od?"var(--act)":"")}${kpiH("Due today",td,td?"var(--watch)":"")}${kpiH("Discovery calls",plate.filter(p=>p.stage==="Discovery call").length)}${kpiH("On your plate / month",money(val))}</div>`;
  const seg=[["pipeline","Pipeline"],["date","By date"]].map(([k,t])=>`<button type="button" data-act="spview" data-v="${k}" aria-pressed="${S.spView===k}">${t}</button>`).join("");
  const head=`<div class="sl-ftop"><h2>Sales pipeline</h2></div><p class="sl-goal">What needs you, stage by stage. Pre-qual is what the teams are still working on, for reference.</p>`;
  const tools=toolsH(`<div class="sl-seg" role="group" aria-label="Show as">${seg}</div>`);
  const note=S.noSp?`<div class="sl-msg" style="margin-bottom:12px">The sales pipeline isn't in this link's data feed yet.</div>`:"";
  let body;
  if(S.spView==="date"){
    const sortC=(a,b)=>((a.done?1:0)-(b.done?1:0))||(DUE_ORDER[a.due]-DUE_ORDER[b.due])||String(a.chase).localeCompare(String(b.chase));
    const groups=[["overdue","Overdue",null,"lost"],["today","Today",TODAY,"s2"],["week","This week",plusDays(3),"s5"],["later","Later","","s0"]].map(([k,t,ch,tone])=>({t,k,tone,ls:plate.filter(p=>p.due===k).sort(sortC),add:ch===null?null:{ctx:"d",board:"sp",stage:"To contact",chase:ch}}));
    body=`<div class="sl-groups">${groups.map(g=>`<div><div class="sl-gh stx st-${g.tone}"><i class="sl-dot"></i><span>${esc(g.t)}</span><small>${g.ls.length}</small></div><div class="sl-gcards">${g.ls.length?g.ls.map(spCardH).join(""):'<div class="sl-empty">Nobody here</div>'}${g.add?inlineAdd(g.add):""}</div></div>`).join("")}</div>`;
  }else{
    /* Pre-qual (first, folded by default): the teams' open leads, Jade's first, most recently active first */
    const TEAM_ORDER=["Jade","Greta","Sarah"];const act=p=>[p.lastC||"",p.r[SP.leadin]||""].sort().pop();
    const pq=D.P.filter(p=>p.pre).map(p=>({p,who:(liveOf(p,D)||{}).who||p.owner||"Team"}));
    pq.sort((a,b)=>((TEAM_ORDER.indexOf(a.who)+1||9)-(TEAM_ORDER.indexOf(b.who)+1||9))||act(b.p).localeCompare(act(a.p))||a.p.name.localeCompare(b.p.name));
    const byWho={};pq.forEach(x=>byWho[x.who]=(byWho[x.who]||0)+1);
    const cols=SP_STAGES.map(st=>{
      const cs=st==="Pre-qual"?pq.map(x=>x.p):D.P.filter(p=>p.stage===st).sort((a,c)=>(DUE_ORDER[a.due]-DUE_ORDER[c.due])||a.name.localeCompare(c.name));
      const inner=cs.map(p=>spKcardH(p,D)).join("")||'<div class="sl-empty">Nobody here</div>';
      return colH("sp",SP_STAGES,st,cs.length,inner,st==="Pre-qual"?"":inlineAdd({ctx:"p",board:"sp",stage:st}),st==="Pre-qual"&&pq.length?`<p class="sl-pqn">${Object.entries(byWho).map(([w,n])=>`${esc(w)} ${n}`).join(" · ")}</p>`:"")}).join("");
    body=`<div class="sl-board sl-spb">${cols}</div><p class="sl-foot">${S.ro?"":"Drag a card to move it, including out of Pre-qual. "}${FOLD_FOOT}</p>`;
  }
  return head+note+kpis+tools+boxH(D)+body;
}
/* Contacts: everyone ever contacted, with their tags, where they are and their conversations */
function contactsH(D,people){
  const origins=[...new Set(people.map(p=>p.origin))].sort();
  return `<div class="sl-ftop"><h2>Contacts</h2><span class="pm">Everyone we've been in touch with</span></div>${toolsH()}
   <div class="sl-pfil"><label class="vh" for="slCq">Filter contacts</label><input id="slCq" type="search" placeholder="Filter by name or company…" value="${esc(S.cq)}" autocomplete="off">
   <label class="vh" for="slCo">Origin</label><select id="slCo"><option value="">All origins</option>${origins.map(o=>`<option ${o===S.co?"selected":""}>${esc(o)}</option>`).join("")}</select></div>
   <div id="slPl">${peopleRowsH(people)}</div>`;
}
function peopleRowsH(people){
  const q=norm(S.cq);const ls=people.filter(p=>(!q||norm(p.name).includes(q)||norm(p.co).includes(q))&&(!S.co||p.origin===S.co));
  if(!ls.length)return '<div class="sl-empty">Nobody matches. Use + to add someone new.</div>';
  return `<p class="pm" style="margin:0 0 8px">${ls.length} ${ls.length===1?"person":"people"}</p><div class="sl-plist" role="list">${ls.map(p=>`<button type="button" class="sl-pr" role="listitem" data-act="opent" data-id="${esc(p.id)}">
    <span class="n"><b>${esc(p.name)}</b><small>${esc(p.co||p.what||"")}</small></span>
    <span class="tg">${otagH(p.origin)}${p.items.map(i=>`<span class="sl-chip-s${i.kind==="sp"&&!i.pre?" mine":""}">${esc(whereOf(i))} · ${esc(i.stage||"No stage yet")}${i.kind!=="sp"&&i.owner?" · "+esc(i.owner):""}</span>`).join("")||'<span class="sl-chip-s">Not on a board</span>'}</span>
    <span class="lc">${p.lastC?esc(short(p.lastC)):"–"}</span>
    <span class="cv">${p.convs.length?p.convs.length+(p.convs.length>1?" conversations":" conversation"):""}</span></button>`).join("")}</div>`;
}
/* Team overview: how every team board is doing */
/* the "boards at a glance" box, on his board above the kanban (no separate Overview any more) */
function boxH(D){
  const rows=BOARDS.map(b=>{const items=boardItems(b,D);const h=health(b,D);
    const withKash=items.filter(i=>{const p=D.spOf[i.id];return (p&&!p.pre)||HANDED.has(stageOf(b,i))}).length;
    return `<button type="button" class="sl-hr sl-hgrid" data-act="view" data-v="${b.key}"><span style="font-weight:600">${esc(b.title)}</span><span>${esc(b.owner)}</span><span>${h.open}</span><span>${withKash}</span><span style="font-weight:600;color:${h.od?"var(--act)":"var(--muted)"}">${h.od}</span><span class="sl-hl" style="color:${h.color}"><i class="sl-dot" style="background:${h.dot}"></i>${h.label}</span></button>`}).join("");
  const open=S.boxOpen!==false;
  return `<section class="sl-panel sl-box2"><div class="sl-boxh"><h3>Team boards at a glance</h3><button type="button" class="sl-ghost" data-act="boxtog" aria-expanded="${open}">${open?"Hide":"Show"}</button></div>${open?`<div class="sl-ht"><div class="sl-hh sl-hgrid"><span>Board</span><span>Owner</span><span>Active</span><span>With you</span><span>Overdue</span><span>Health</span></div>${rows}</div><p class="sl-foot">Active: every card still in play on that board, including the ones handed to you. With you: on your sales pipeline. Click a board to open it.</p>`:""}</section>`;
}
function boardH(b,D){
  const items=boardItems(b,D);const h=health(b,D);
  const noStage=b.kind==="cl"?items.filter(i=>!sv(i.r[b.field])):[];
  const cols=(noStage.length?[""]:[]).concat(b.stages).map(st=>{
    const cs=(st===""?noStage:items.filter(i=>stageOf(b,i)===st)).sort((a,c)=>(DUE_ORDER[a.due]-DUE_ORDER[c.due]));
    return colH(b.key,b.stages,st,cs.length,cs.map(i=>kcardH(i,b,D)).join("")||'<div class="sl-empty">Nobody here</div>',st?inlineAdd({ctx:"b",board:b.key,stage:st}):"")}).join("");
  const where=b.kind==="cl"?" · Rise Voice":" · ReLearn";
  return `<div class="sl-ftop"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><h2>${esc(b.title)}</h2><span class="sl-hl" style="color:${h.color}"><i class="sl-dot" style="background:${h.dot}"></i>${h.label}</span></div><span class="pm">Owner: ${esc(b.owner)}${where}</span></div>
    <p class="sl-goal">${esc(b.blurb)}</p>${toolsH()}
    <div class="sl-board">${cols}</div>
    <p class="sl-foot">${S.ro?"":"Drag a card to another column to move it. "}"Kash · stage" marks people already on his sales pipeline. ${FOLD_FOOT}</p>`;
}
function modalH(J){
  const l=J.find(x=>x.id===S.openId);if(!l)return "";
  const r=l.r;const svc=(r[L.services]||[]).map(sv);
  const cm=S.comments[l.id];const cmList=cm&&cm.list||[];
  const tl=l.conv.map(c=>`<div><span class="d">${esc(short(c[C.date]))}</span><span>${esc(c[C.sum]||"")}<small>${esc([sv(c[C.ch]),sv(c[C.who]),sv(c[C.dir])].filter(Boolean).join(" · "))}</small></span></div>`).join("")||'<div><span class="pm">No conversations logged yet.</span></div>';
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slMh">
   <div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slMh">${esc(l.name)}</h2><div class="sl-co" style="margin-top:2px">${esc(l.co)}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px">${otagH(l.origin)}${tagH(l.offer)}<span class="sl-due ${l.due}">${esc(l.dueL)}</span><span class="pm">Podcast board · ${esc(l.stage)}</span></div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts">
      <div class="sl-fact"><label for="slMst">Stage</label><select id="slMst" data-act="jstage"${S.ro?" disabled":""}>${JADE_STAGES.map(x=>`<option ${x===l.stage?"selected":""}>${esc(x)}</option>`).join("")}</select></div>
      <div class="sl-fact"><label for="slMv">Deal value / month${l.est&&l.value?' <span class="sl-est">Estimate</span>':""}</label><input id="slMv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(l.value))}"${S.ro?" readonly":""}></div>
      <div class="sl-fact"><label for="slMo">Owner</label><select id="slMo" data-act="owner"${S.ro?" disabled":""}><option value="">–</option>${OWNERS.map(o=>`<option ${o===l.owner?"selected":""}>${o}</option>`).join("")}</select></div>
      <div class="sl-fact"><label for="slMlo">Likely offer</label><select id="slMlo" data-act="likely"${S.ro?" disabled":""}>${OFFERS.map(o=>`<option ${o===(sv(r[L.likely])||"Not sure yet")?"selected":""}>${o}</option>`).join("")}</select></div>
      <div class="sl-fact"><span class="l">Last contact</span><div class="sl-fv">${agoL(l.lastC)}</div></div>
    </div>
    <div role="group" aria-labelledby="slMs"><p class="sl-sub" id="slMs">Services in play${S.ro?"":` <span style="text-transform:none;letter-spacing:0;font-weight:400">· click to add or remove</span>`}</p><div class="sl-chips">${S.ro?(svc.length?svc.map(s=>`<span class="sl-chip" aria-pressed="true">${esc(s)}</span>`).join(""):'<span class="pm">None yet</span>'):SERVICES.map(s=>`<button type="button" class="sl-chip" data-act="svc" data-v="${esc(s)}" aria-pressed="${svc.includes(s)}">${esc(s)}</button>`).join("")}</div></div>
    <section class="sl-need"><h3><label for="slMn">What's needed from Kash</label></h3><textarea id="slMn" data-act="needed" rows="1" placeholder="What does Kash need to do next?"${S.ro?" readonly":""}>${esc(r[L.needed]||"")}</textarea></section>
    <section class="sl-hap"><h3><label for="slMl">What's happening</label></h3><textarea id="slMl" data-act="latest" rows="1" placeholder="A short summary of where things stand"${S.ro?" readonly":""}>${esc(r[L.latest]||"")}</textarea>${r[L.want]?`<p class="sl-want"><b>In their words:</b> ${esc(r[L.want])}</p>`:""}</section>
    <section><p class="sl-sub">Conversations</p>
      <div class="sl-addc"${S.ro?" hidden":""}><label class="vh" for="slCc">Channel</label><select id="slCc">${CHANNELS.map(c=>`<option>${c}</option>`).join("")}</select><label class="vh" for="slCt">What happened</label><input id="slCt" placeholder="Log a conversation: what was said?"><button type="button" class="sl-ghost" data-act="addconv">${svg(PLUS)}Add</button></div>
      <div class="sl-tl">${tl}</div></section>
   </div>
   <div class="sl-cmts">
    ${S.cOpen&&cmList.length?`<div class="sl-clist">${cmList.map(c=>`<div><span class="sl-av">${esc((c.who||"?").charAt(0))}</span><div><div><b>${esc(c.who)}</b> <span class="pm">${esc(c.when)}</span></div><div>${esc(c.text)}</div></div></div>`).join("")}</div>`:""}
    ${S.ro?`<div class="sl-cbar"><span class="pm">Comments are in the Claude copy of this dashboard.</span></div>`:`<div class="sl-cbar"><span class="me" aria-hidden="true">${svg("M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0")}</span><input id="slCm" aria-label="Add a comment" placeholder="Add a comment... type @ to tag someone"><button type="button" class="sl-solid" data-act="postc" style="padding:5px 12px;font-size:13px">Post</button>
    <button type="button" class="sl-ctog" data-act="ctog" aria-expanded="${S.cOpen}">${svg("M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z")}<span class="sl-ctl">${cm&&cm.loading?"Loading…":cmList.length?cmList.length+(cmList.length>1?" comments":" comment"):"No comments yet"}</span></button></div>`}
   </div></div></div>`;
}
/* Company Lead (Rise Voice) record */
function recModalH(it,people){
  if(!it)return "";const r=it.r;const b=it.board;const ro=S.ro?" readonly":"",dis=S.ro?" disabled":"";
  const cur=b?sv(r[b.field]):"";
  const bits=[r[CL.email],r[CL.phone],r[CL.ig]?"@"+r[CL.ig]:"",r[CL.li]];
  const p=people.find(x=>x.items.includes(it));
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slCh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slCh">${esc(it.name)}</h2><div class="sl-co" style="margin-top:2px">${esc([it.co].concat(bits).filter(Boolean).join(" · "))}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px">${otagH(it.origin)}<span class="sl-tag">${esc("Rise Voice · "+(b?b.title:"Company Leads"))}</span><span class="sl-due ${it.due}">${esc(it.dueL)}</span></div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts">
      <div class="sl-fact"><label for="slKs">Stage</label><select id="slKs" data-act="rstage"${dis}>${b?(cur?"":'<option value="">No stage yet</option>')+b.stages.map(s=>`<option ${s===cur?"selected":""}>${esc(s)}</option>`).join(""):""}</select></div>
      <div class="sl-fact"><label for="slKo">Owner</label><select id="slKo" data-act="rowner"${dis}><option value="">–</option>${CL_OWNERS.map(o=>`<option ${o===it.owner?"selected":""}>${o}</option>`).join("")}</select></div>
      <div class="sl-fact"><label for="slKd">Chase date</label><input id="slKd" type="date" data-act="rchase" value="${esc(it.chase)}"${ro}></div>
      <div class="sl-fact"><label for="slKv">Deal value / month${it.est&&it.value?' <span class="sl-est">Estimate</span>':""}</label><input id="slKv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(it.value))}"${ro}></div>
    </div>
    ${svcPickH("clsvc",it.services,"slKsv")}
    <section class="sl-need"><h3><label for="slKn">Next step (team)</label></h3><textarea id="slKn" data-act="next" rows="1"${ro}>${esc(it.next)}</textarea></section>
    <section class="sl-hap"><h3><label for="slKw">What they want</label></h3><textarea id="slKw" data-act="rwant" rows="1"${ro}>${esc(it.want)}</textarea></section>
    <section class="sl-hap"><h3><label for="slKt">Notes</label></h3><textarea id="slKt" data-act="rnotes" rows="1"${ro}>${esc(it.notes)}</textarea></section>
    <div class="sl-fbtns" style="justify-content:space-between;align-items:center"><span class="pm">Last contact: ${esc(agoL(it.lastC))}${b?" · board owner "+esc(b.owner):""}</span>${p?`<button type="button" class="sl-ghost" data-act="opent" data-id="${esc(p.id)}">See contact and conversations</button>`:""}</div>
  </div></div></div>`;
}
/* a deal on Kash's Sales pipeline */
function spModalH(p,D,people){
  if(!p)return "";const ro=S.ro?" readonly":"",dis=S.ro?" disabled":"";
  const lv=liveOf(p,D);const pers=people.filter(x=>x.items.includes(p));const per=pers.find(x=>x.id===p.contactIds[0])||pers[0];
  const convs=[...new Set(pers.flatMap(x=>x.convs))].sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||"")));
  const tl=convs.map(x=>`<div><span class="d">${esc(short(x[C.date]))}</span><span>${esc(x[C.sum]||"")}<small>${esc([sv(x[C.ch]),sv(x[C.who])].filter(Boolean).join(" · "))}</small></span></div>`).join("");
  const src=lv?`<button type="button" class="sl-wh" ${lv.item?`data-act="${lv.item.kind==="jade"?"open":"openc"}" data-id="${lv.item.id}"`:"disabled"}><span class="w">${esc(lv.where)}</span><b>${esc(lv.stage)}</b><span class="pm">${esc(lv.who||"")}</span></button>`:`<p class="pm" style="margin:0">${esc(p.from||"Kash direct")}</p>`;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slSh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slSh">${esc(p.name)}</h2><div class="sl-co" style="margin-top:2px">${esc(p.co)}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px">${otagH(p.origin)}${tagH(p.offer)}${p.pre?'<span class="pm">Pre-qual · with the team</span>':`<span class="sl-due ${p.due}">${esc(p.dueL)}</span>`}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts">
      <div class="sl-fact"><label for="slSs">Stage</label><select id="slSs" data-act="spstage"${dis}>${SP_STAGES.map(s=>`<option ${s===p.stage?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      <div class="sl-fact"><label for="slSo">Origin</label><select id="slSo" data-act="sporigin"${dis}>${ORIGINS.map(o=>`<option ${o===p.origin?"selected":""}>${esc(o)}</option>`).join("")}</select></div>
      <div class="sl-fact"><label for="slSd">Chase date</label><input id="slSd" type="date" data-act="spchase" value="${esc(p.chase)}"${ro}></div>
      <div class="sl-fact"><label for="slSv">Value / month${p.est&&p.value?' <span class="sl-est">Estimate</span>':""}</label><input id="slSv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(p.value))}"${ro}></div>
      <div class="sl-fact"><label for="slSk">Ticket</label><select id="slSk" data-act="spoffer"${dis}>${OFFERS.map(o=>`<option ${o===p.offer?"selected":""}>${esc(o)}</option>`).join("")}</select></div>
    </div>
    ${svcPickH("spsvc",p.services,"slSsv")}
    <section class="sl-need"><h3><label for="slSn">What's needed from you</label></h3><textarea id="slSn" data-act="needed" rows="1" placeholder="${p.pre?"Nothing yet: it's with the team":"What do you need to do?"}"${ro}>${esc(p.needed)}</textarea></section>
    <section class="sl-hap"><h3><label for="slSt">Notes</label></h3><textarea id="slSt" data-act="spnotes" rows="1"${ro}>${esc(p.notes)}</textarea></section>
    <section><p class="sl-sub">Where it came from</p>${src}</section>
    <section><p class="sl-sub">Conversations</p>
      ${S.ro?"":`<div class="sl-addc"><label class="vh" for="slSc">Channel</label><select id="slSc">${CHANNELS.map(x=>`<option>${x}</option>`).join("")}</select><label class="vh" for="slSx">What happened</label><input id="slSx" placeholder="Log a conversation"><button type="button" class="sl-ghost" data-act="logsp" data-id="${p.id}">${svg(PLUS)}Add</button></div>`}
      <div class="sl-tl">${tl||'<div><span class="pm">No conversations logged yet.</span></div>'}</div></section>
    <div class="sl-fbtns" style="justify-content:flex-start;align-items:center"><span class="pm">Last contact: ${esc(agoL(p.lastC))}</span></div>
  </div></div></div>`;
}
function ctModalH(people){
  const p=people.find(x=>x.id===S.openCt);if(!p)return "";const c=p.ct||{};
  const bits=[c[CT.email],c[CT.phone],c[CT.ig]?"@"+norm(c[CT.ig]):"",c[CT.li]].filter(Boolean);
  const where=p.items.map(i=>`<button type="button" class="sl-wh${i.kind==="sp"&&!i.pre?" mine":""}" data-act="${i.kind==="jade"?"open":i.kind==="sp"?"opensp":"openc"}" data-id="${i.id}"><span class="w">${esc(whereOf(i))}</span><b>${esc(i.stage||"No stage yet")}</b><span class="pm">${esc(i.kind==="sp"?(i.pre?"with the team":(i.needed||"").slice(0,60)):[i.owner,i.closed?"":i.dueL].filter(Boolean).join(" · "))}</span></button>`).join("")||'<p class="pm" style="margin:0">Not on any board yet.</p>';
  const tl=p.convs.map(x=>`<div><span class="d">${esc(short(x[C.date]))}</span><span>${esc(x[C.sum]||"")}<small>${esc([sv(x[C.ch]),sv(x[C.who])].filter(Boolean).join(" · "))}</small></span></div>`).join("");
  const notes=p.items.filter(i=>i.kind!=="jade"&&i.notes).map(i=>`<div><span class="d">Notes</span><span style="white-space:pre-line">${esc(i.notes)}<small>${esc(whereOf(i))}</small></span></div>`).join("");
  const jl=p.items.find(i=>i.kind==="jade");const lat=jl&&jl.r[L.latest]?`<div><span class="d">Latest</span><span style="white-space:pre-line">${esc(jl.r[L.latest])}<small>Jade's board</small></span></div>`:"";
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slTh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slTh">${esc(p.name)}</h2><div class="sl-co" style="margin-top:2px">${esc([p.co].concat(bits).filter(Boolean).join(" · "))}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">${otagH(p.origin)}${p.lastC?`<span class="pm">Last contact ${esc(short(p.lastC))}</span>`:""}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    ${p.what&&norm(p.what)!==norm(p.co)?`<p style="margin:0">${esc(p.what)}</p>`:""}
    <section><p class="sl-sub">Where they are</p><div class="sl-whs">${where}</div></section>
    <section><p class="sl-sub">Conversations</p>
      ${S.ro?"":`<div class="sl-addc"><label class="vh" for="slTc">Channel</label><select id="slTc">${CHANNELS.map(x=>`<option>${x}</option>`).join("")}</select><label class="vh" for="slTt">What happened</label><input id="slTt" placeholder="Log a conversation with ${esc(p.name)}"><button type="button" class="sl-ghost" data-act="logct" data-id="${esc(p.id)}">${svg(PLUS)}Add</button></div>`}
      <div class="sl-tl">${lat+tl+notes||'<div><span class="pm">No conversations logged yet.</span></div>'}</div></section>
  </div></div></div>`;
}
/* name search in the header: people, with where they are */
function searchHits(q){
  q=norm(q);if(q.length<2)return [];
  return peopleOf(derive()).filter(p=>norm(p.name).includes(q)||norm(p.co).includes(q)).slice(0,10);
}
function renderSearch(){
  const box=el("slQr");if(!box)return;const q=(el("slQ")||{}).value||"";
  if(norm(q).length<2){box.hidden=true;box.innerHTML="";return}
  const hits=searchHits(q);box.hidden=false;
  box.innerHTML=hits.length?hits.map(p=>`<button type="button" class="sl-qi" data-act="opent" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><span>${esc(p.items.map(i=>whereOf(i)+" · "+(i.stage||"No stage yet")+(i.kind!=="sp"&&i.owner?" · "+i.owner:"")).join(" | ")||"Contact")}</span></button>`).join(""):'<div class="sl-qi"><span>Nobody by that name yet. Use + to add them.</span></div>';
}
/* Drop a note */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null;
function dropH(){
  const d=S.drop;if(!d)return "";
  const body=d.items?`${d.recap?`<div class="sl-recap"><b>Here's what I understood</b><p>${esc(d.recap)}</p></div>`:""}<div class="sl-props">${d.items.map((it,i)=>propH(it,i)).join("")}</div>${d.question?`<p class="sl-qn"><b>Claude asks:</b> ${esc(d.question)}</p>`:""}
      <div class="sl-fbtns"><button type="button" class="sl-ghost" data-act="dropback">Back to the note</button><button type="button" class="sl-solid" data-act="dropsave"${d.busy?" disabled":""}>${d.busy?"Saving…":"Yes, that's right. Save"}</button></div>`
    :`<label class="vh" for="slDt">Your note</label><textarea id="slDt" class="sl-dtext" rows="5" placeholder="Say or type what happened. E.g. 'Met Sara Lopez at the Dubai summit, she runs a skincare brand and wants help with social. Follow up Thursday on WhatsApp.' Or: 'Spoke to Marc, he wants the call next week.'">${esc(d.text||"")}</textarea>
      <div class="sl-mic">${SR?`<button type="button" class="sl-ghost" data-act="mic" aria-pressed="${!!d.listening}">${svg(MIC,15)}${d.listening?"Listening… tap to stop":"Speak"}</button>`:""}<span class="pm">${SR?"Or tap the microphone on your keyboard.":"Tap the microphone on your keyboard to speak."} One note can cover several people.</span></div>
      ${d.err?`<p class="sl-qn" style="color:var(--act)">${esc(d.err)}</p>`:""}
      <div class="sl-fbtns"><button type="button" class="sl-ghost" data-act="dropmanual">Add by hand instead</button><button type="button" class="sl-solid" data-act="dropgo"${d.busy?" disabled":""}>${d.busy?"Reading your note…":"Understand it"}</button></div>`;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slDh"><div class="sl-db">
    <div class="sl-dh"><div><h2 id="slDh" style="font-size:19px">${d.items?"Check before saving":"Drop a note"}</h2>${d.items?'<div class="sl-co">Change anything that\'s wrong, then save.</div>':""}</div><button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    ${body}</div></div></div>`;
}
const boardOpts=sel=>`<option value="sp" ${sel==="sp"?"selected":""}>My sales pipeline</option>`+BOARDS.map(x=>`<option value="${x.key}" ${x.key===sel?"selected":""}>Team: ${esc(x.title)}</option>`).join("");
const stagesFor=k=>k==="sp"?SP_STAGES:(BK[k]||BK.jade).stages;
function propH(it,i){
  const bk=it.board||"sp";const match=it.match;const sp=bk==="sp";
  const what=match?(match.kind==="sp"?(match.stage==="Pre-qual"?"Move "+match.name+" from Pre-qual onto your plate":"Update "+match.name+" on your pipeline"):sp?"Move "+match.name+" onto your pipeline":"Update "+match.name):"New person"+(sp?" on your pipeline":"");
  return `<div class="sl-prop" data-i="${i}">
    <div class="sl-prow"><b>${esc(what)}</b><span class="pm">${match?esc(match.where+" · "+match.stage):""}</span></div>
    <div class="sl-form"><div class="two">
      <label>Name<input id="slP-n-${i}" value="${esc(it.name||"")}"></label>
      <label>Company / what they do<input id="slP-c-${i}" value="${esc(it.company||it.what_they_do||"")}"></label>
      <label>Goes to<select id="slP-b-${i}" data-act="pboard" data-i="${i}"${match&&match.kind==="sp"?" disabled":""}>${boardOpts(bk)}</select></label>
      <label>Stage<select id="slP-s-${i}">${stagesFor(bk).map(s=>`<option ${s===it.stage?"selected":""}>${esc(s)}</option>`).join("")}</select></label>
      <label>Origin<select id="slP-g-${i}">${ORIGINS.map(o=>`<option ${o===(it.origin||"Network")?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
      <label>Chase date<input id="slP-d-${i}" type="date" value="${esc(it.chase_date||"")}"></label>
    </div>
    <label>What's needed from you<input id="slP-x-${i}" value="${esc(it.needed||"")}" placeholder="What do you need to do next?"></label>
    <label>Conversation to log<input id="slP-v-${i}" value="${esc(it.conversation&&it.conversation.summary||"")}" placeholder="Leave empty to log nothing"></label>
    <div class="two"><label>Channel<select id="slP-h-${i}">${CHANNELS.map(c=>`<option ${it.conversation&&c===it.conversation.channel?"selected":""}>${c}</option>`).join("")}</select></label>
      <label>Value / month<input id="slP-m-${i}" inputmode="numeric" value="${esc(full(it.monthly_value))}" placeholder="$0"></label>
      <label>Likely offer<select id="slP-o-${i}">${OFFERS.map(o=>`<option ${o===(it.likely_offer||"Not sure yet")?"selected":""}>${o}</option>`).join("")}</select></label></div>
    </div></div>`;
}
function addH(){
  if(!S.adding)return "";const bk=BK[S.view]?S.view:"sp";
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg narrow" role="dialog" aria-modal="true" aria-labelledby="slAh"><div class="sl-db">
   <div class="sl-dh"><h2 id="slAh" style="font-size:19px">New lead</h2><button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
   <div class="sl-form">
    <label>Name<input id="slFn" placeholder="Full name"></label>
    <label>Company / what they do<input id="slFw" placeholder="e.g. Founder, DIRTEA"></label>
    <div class="two"><label>Goes to<select id="slFf" data-act="fboard">${boardOpts(bk)}</select></label>
      <label>Stage<select id="slFs">${stagesFor(bk).map(s=>`<option ${s===(bk==="sp"?"To contact":"")?"selected":""}>${esc(s)}</option>`).join("")}</select></label>
      <label>Origin<select id="slFg">${ORIGINS.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>
      <label>Value / month<input id="slFv" inputmode="numeric" placeholder="$0"></label>
      <label>Chase date<input id="slFd" type="date" value="${TODAY}"></label>
      <label>Likely offer<select id="slFo">${OFFERS.map(o=>`<option ${o==="Not sure yet"?"selected":""}>${o}</option>`).join("")}</select></label></div>
    <label>What's needed from you<textarea id="slFx" rows="2" placeholder="What do you need to do next?"></textarea></label>
   </div>
   <div class="sl-fbtns"><button type="button" class="sl-ghost" data-act="close">Cancel</button><button type="button" class="sl-solid" data-act="savelead">Add lead</button></div>
  </div></div></div>`;
}
function render(){
  const body=el("slBody");if(!body)return;
  const sr=document.querySelector("#v-sales .sl-srch");const foc=!!(sr&&sr.contains(document.activeElement));if(sr)sr.remove();
  const putSearch=()=>{if(!sr)return;const slot=el("slTools")||el("slHome");slot.prepend(sr);if(foc&&el("slTools"))el("slQ").focus()};
  if(S.err){body.innerHTML=`<div class="sl-msg"><b>Couldn't load the sales data.</b><br><span class="pm">${S.ro?"The sales data feed for this link isn't available yet.":"Check that your Airtable connection is on and has access to ReLearn Commercials and Rise Voice, then press Refresh."}</span></div>`;el("slModal").innerHTML="";putSearch();return}
  if(!S.loaded){putSearch();return}
  const D=derive();const plate=D.P.filter(p=>p.plate);const people=peopleOf(D);
  const fab=el("slFab");if(fab&&S.ro)fab.hidden=true;
  const note=S.ro?`<p class="pm" style="margin:-2px 0 12px">View only on this link${S.fetchedAt?" · data from "+esc(String(S.fetchedAt).slice(11,16))+" UTC":""}. Open the Claude copy to make changes.</p>`:"";
  if(S.view==="overview")S.view="mine";
  const main=S.view==="mine"?spH(D):S.view==="contacts"?contactsH(D,people):boardH(BK[S.view]||BK.jade,D);
  const bd0=body.querySelector(".sl-board"),bl=bd0?bd0.scrollLeft:0,key=S.view+"|"+S.spView,sy=window.scrollY;
  body.innerHTML=note+`<div class="sl-layout">${rail(D,plate,people)}<div class="sl-main">${main}</div></div>`;putSearch();
  const bd1=body.querySelector(".sl-board");if(bd1&&S.lastKey===key)bd1.scrollLeft=bl;if(S.lastKey===key&&window.scrollY!==sy)window.scrollTo(0,sy);S.lastKey=key;
  const rec=S.openCl?D.K.find(x=>x.id===S.openCl):null;const spr=S.openSp?D.P.find(x=>x.id===S.openSp):null;
  el("slModal").innerHTML=(S.openId?modalH(D.J):"")+(rec?recModalH(rec,people):"")+(spr?spModalH(spr,D,people):"")+(S.openCt?ctModalH(people):"")+addH()+dropH();
  document.querySelectorAll("#v-sales textarea,#slModal textarea").forEach(grow);
  renderSearch();
  if(S.inAdd&&el("slIn"))el("slIn").focus();
}
function grow(t){if(!t.offsetParent||t.id==="slDt")return;t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px"}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.matches)return;if(t.matches("#v-sales textarea,#slModal textarea"))grow(t);if(t.id==="slQ")renderSearch();
  if(t.id==="slDt"&&S.drop)S.drop.text=t.value;
  if(t.id==="slCq"){S.cq=t.value;const pl=el("slPl");if(pl)pl.innerHTML=peopleRowsH(peopleOf(derive()))}});

/* ---------- writes ---------- */
const lead=id=>S.leads.find(r=>r._id===id);
const KF={cl:{base:RB,tbl:T.cl,arr:"cl",next:CL.next,want:CL.want,notes:CL.notes,owner:CL.owner,chase:CL.chase,value:CL.val,est:CL.est,lastc:CL.lastc},
          sp:{base:CB,tbl:T.sp,arr:"sp",next:SP.needed,want:null,notes:SP.notes,owner:SP.owner,chase:SP.chase,value:SP.value,est:SP.est,lastc:SP.lastc,stage:SP.stage}};
const recOf=(kind,id)=>(S[KF[kind].arr]||[]).find(r=>r._id===id);
async function saveLead(id,fields,typecast,quiet){const r=lead(id);const prev={};Object.keys(fields).forEach(k=>{prev[k]=r[k]});Object.assign(r,fields);if(!quiet)render();
  try{await upd(CB,T.leads,id,fields,typecast);toast("Saved")}catch(e){Object.assign(r,prev);render();toast("Couldn't save. Try again.")}}
async function saveRec(kind,id,fields,quiet){const k=KF[kind];const r=recOf(kind,id);if(!r)return;const prev={};Object.keys(fields).forEach(f=>{prev[f]=r[f]});Object.assign(r,fields);if(!quiet)render();
  try{await upd(k.base,k.tbl,id,fields,false);toast("Saved")}catch(e){Object.assign(r,prev);render();toast("Couldn't save. Try again.")}}
async function openComments(id){if(S.ro){S.comments[id]={list:[]};return}S.comments[id]={loading:true,list:[]};render();
  try{const p=await call("list_record_comments",{baseId:CB,tableId:T.leads,recordId:id,pageSize:100});
    const list=(p.comments||[]).map(c=>{const users=Object.assign({},p.mentioned||{},c.mentioned||{});let t=String(c.text||"");t=t.replace(/@\[([A-Za-z0-9]+)\]/g,(m,u)=>"@"+((users[u]&&(users[u].displayName||users[u].name||users[u].email))||"someone"));
      const a=c.author||{};const w=c.createdTime?short(String(c.createdTime).slice(0,10)):"";return {who:a.name||a.email||"Someone",when:w,text:t}}).reverse();
    S.comments[id]={list}}catch(e){S.comments[id]={list:[],err:true}}
  if(S.openId===id)render()}

/* contacts: find one person, never duplicate */
function findContact(p){
  const e=norm(p.email),ig=norm(p.instagram),li=norm(p.linkedin),n=norm(p.name);
  return S.contacts.find(c=>(e&&norm(c[CT.email])===e)||(ig&&norm(c[CT.ig])===ig)||(li&&norm(c[CT.li])===li))||(n?S.contacts.find(c=>norm(c[CT.name])===n):null)||null;
}
async function ensureContact(p,source,extra){
  let c=findContact(p);if(c)return c._id;
  const f={[CT.name]:p.name};if(p.email)f[CT.email]=p.email;if(p.phone)f[CT.phone]=p.phone;if(p.instagram)f[CT.ig]=norm(p.instagram);if(p.linkedin)f[CT.li]=p.linkedin;if(p.company)f[CT.co]=p.company;if(p.what_they_do)f[CT.what]=p.what_they_do;if(source)f[CT.src]=source;Object.assign(f,extra||{});
  const id=await mk(CB,T.contacts,f,true);S.contacts.push(Object.assign({_id:id},f));return id;
}
const BOARD_CT_SRC={jade:"Podcast guest",event:"Event",referral:"Referral",social:"Instagram",episode:"Episode request",upwork:"Upwork",upsell:"Upsell",ai:"AI consulting"};
async function logConv(summary,ch,leadId,contactId){
  if(!summary)return;const w=viewer();const f={[C.sum]:summary,[C.date]:TODAY,[C.ch]:ch||"Other"};if(leadId)f[C.lead]=[leadId];if(contactId)f[C.contact]=[contactId];if(w)f[C.who]=w;
  const id=await mk(CB,T.conv,f,true);S.conv.push(Object.assign({_id:id},f));
}
/* a new deal on Kash's pipeline; links back to the team record when there is one */
async function newDeal(it,link){
  const stage=SP_STAGES.includes(it.stage)?it.stage:"To contact";const val=digits(it.monthly_value);const conv=it.conversation&&it.conversation.summary?it.conversation:null;
  const f={[SP.deal]:it.name,[SP.stage]:stage,[SP.origin]:ORIGINS.includes(it.origin)?it.origin:"Network",[SP.owner]:"Kash",[SP.leadin]:TODAY,[SP.from]:link&&link.from||"Kash direct",[SP.offer]:OFFERS.includes(it.likely_offer)?it.likely_offer:"Not sure yet"};
  if(it.company)f[SP.co]=it.company;if(it.needed)f[SP.needed]=it.needed;if(it.chase_date)f[SP.chase]=it.chase_date;if(val)f[SP.value]=val;if(conv){f[SP.lastc]=TODAY;f[SP.notes]=TODAY+" · "+conv.channel+": "+conv.summary}
  let cids=link&&link.contactIds||[];
  if(!cids.length){try{cids=[await ensureContact({name:it.name,company:it.company,what_they_do:it.what_they_do,email:it.email,phone:it.phone,instagram:it.instagram,linkedin:it.linkedin},ORIGIN_CT[f[SP.origin]]||"Other")]}catch(e){cids=[]}}
  if(cids.length)f[SP.contacts]=cids;if(link&&link.jadeId)f[SP.jade]=[link.jadeId];if(link&&link.rv)f[SP.rv]=link.rv;
  const id=await mk(CB,T.sp,f,true);
  if(conv)await logConv(conv.summary,conv.channel,link&&link.jadeId||"",cids[0]||"").catch(()=>{});
  return id;
}
async function saveProposal(it){
  const bk=it.board||"sp";const conv=it.conversation&&it.conversation.summary?it.conversation:null;const val=digits(it.monthly_value);
  const D=derive();const m=it.match?D.all.find(x=>x.id===it.match.id):null;
  if(m&&m.kind==="sp"){ /* update a deal already on his pipeline */
    const r=recOf("sp",m.id);const f={};if(it.needed)f[SP.needed]=it.needed;if(it.chase_date)f[SP.chase]=it.chase_date;if(SP_STAGES.includes(it.stage)&&it.stage!==m.stage)f[SP.stage]=it.stage;if(val){f[SP.value]=val;f[SP.est]=false}
    if(it.origin&&ORIGINS.includes(it.origin)&&it.origin!==m.origin)f[SP.origin]=it.origin;if(it.likely_offer&&it.likely_offer!=="Not sure yet")f[SP.offer]=it.likely_offer;
    if(conv){f[SP.lastc]=TODAY;f[SP.notes]=((r&&r[SP.notes])?r[SP.notes]+"\n\n":"")+TODAY+" · "+conv.channel+": "+conv.summary}
    if(Object.keys(f).length)await upd(CB,T.sp,m.id,f,false);
    if(conv)await logConv(conv.summary,conv.channel,m.jadeId||"",m.contactIds[0]||"").catch(()=>{});
    return;
  }
  if(m&&bk==="sp"){ /* someone on a team board who now needs Kash: open the deal, linked back, and hand over where the board has the stage */
    const existing=D.spOf[m.id];
    if(existing){it.match={id:existing.id,kind:"sp"};return saveProposal(it)}
    const link=m.kind==="jade"?{jadeId:m.id,from:BK.jade.from,contactIds:ids(m.r[L.contacts])}:{rv:atUrl(RB,T.cl,m.id),from:m.board?m.board.from:"",contactIds:[idFromUrl(m.r[CL.contact])].filter(Boolean)};
    if(!it.origin||it.origin==="Network")it.origin=ORIGINS.includes(m.origin)?m.origin:"Other";
    await newDeal(it,link);
    if(m.kind==="cl"&&m.board&&m.board.stages.includes("Sales Pipeline"))await upd(RB,T.cl,m.id,{[m.board.field]:"Sales Pipeline"},false).catch(()=>{});
    return;
  }
  if(m&&m.kind==="jade"){
    const r=lead(m.id);const f={};if(it.needed)f[L.needed]=it.needed;if(it.chase_date)f[L.chase]=it.chase_date;if(it.likely_offer&&it.likely_offer!=="Not sure yet")f[L.likely]=it.likely_offer;if(conv)f[L.lastC]=TODAY;if(val){f[L.value]=val;f[L.est]=false}
    if(r&&JADE_STAGES.includes(it.stage)&&it.stage!==sv(r[L.stage]))f[L.stage]=it.stage;
    if(Object.keys(f).length)await upd(CB,T.leads,m.id,f,false);
    if(conv)await logConv(conv.summary,conv.channel,m.id,r?ids(r[L.contacts])[0]:"");
    return;
  }
  if(m&&m.kind==="cl"){
    const k=KF.cl,r=recOf("cl",m.id);const bb=m.board;
    const f={};if(it.needed)f[k.next]=it.needed;if(it.chase_date)f[k.chase]=it.chase_date;if(it.what_they_want)f[k.want]=it.what_they_want;if(val){f[k.value]=val;f[k.est]=false}
    if(conv){f[k.lastc]=TODAY;f[k.notes]=((r&&r[k.notes])?r[k.notes]+"\n\n":"")+TODAY+" · "+conv.channel+": "+conv.summary}
    if(bb&&it.stage&&bb.stages.includes(it.stage))f[bb.field]=it.stage;
    if(Object.keys(f).length)await upd(RB,T.cl,m.id,f,false);
    if(conv){const cid=idFromUrl(r&&r[CL.contact]);if(cid)await logConv(conv.summary,conv.channel,"",cid).catch(()=>{})}
    return;
  }
  if(bk==="sp")return newDeal(it,null);
  /* new person for a team board */
  const b=BK[bk]||BK.jade;const stage=b.stages.includes(it.stage)?it.stage:b.stages[0];
  const person={name:it.name,company:it.company,what_they_do:it.what_they_do,email:it.email,phone:it.phone,instagram:it.instagram,linkedin:it.linkedin};
  if(b.kind==="jade"){
    let cid="";try{cid=await ensureContact(person,BOARD_CT_SRC.jade)}catch(e){} /* the lead still saves if Contacts can't be written */
    const f={[L.name]:it.name,[L.stage]:stage,[L.source]:"🤝 Referral / direct",[L.owner]:"Jade",[L.leadIn]:TODAY};if(cid)f[L.contacts]=[cid];
    if(it.company)f[L.co]=it.company;if(it.what_they_do)f[L.what]=it.what_they_do;if(it.chase_date)f[L.chase]=it.chase_date;if(it.what_they_want)f[L.want]=it.what_they_want;if(it.likely_offer)f[L.likely]=it.likely_offer;if(conv)f[L.lastC]=TODAY;if(val)f[L.value]=val;
    const lid=await mk(CB,T.leads,f,false);
    if(conv)await logConv(conv.summary,conv.channel,lid,cid);
  }else{
    const src=b.key==="social"&&conv&&conv.channel==="LinkedIn"?"LinkedIn":b.source;
    const f={[CL.name]:it.name,[CL.src]:src,[b.field]:stage,[CL.leadin]:TODAY};if(b.defOwner)f[CL.owner]=b.defOwner;
    if(it.company)f[CL.co]=it.company;if(it.email)f[CL.email]=it.email;if(it.phone)f[CL.phone]=it.phone;if(it.instagram)f[CL.ig]=norm(it.instagram);if(it.linkedin)f[CL.li]=it.linkedin;if(it.chase_date)f[CL.chase]=it.chase_date;if(it.what_they_want)f[CL.want]=it.what_they_want;if(val)f[CL.val]=val;
    if(conv){f[CL.lastc]=TODAY;f[CL.notes]=TODAY+" · "+conv.channel+": "+conv.summary+" (from Kash)"}
    const clid=await mk(RB,T.cl,f,false);
    let cid="";try{cid=await ensureContact(person,BOARD_CT_SRC[b.key],{[CT.rvurl]:atUrl(RB,T.cl,clid),[CT.rvboard]:b.title+" · "+stage})}catch(e){}
    if(cid){await upd(RB,T.cl,clid,{[CL.contact]:atUrl(CB,T.contacts,cid)},false).catch(()=>{});
      if(conv)await logConv(conv.summary,conv.channel,"",cid).catch(()=>{})}
  }
}
function itemsForPrompt(){
  const D=derive();
  return D.P.map(p=>({id:p.id,kind:"pipeline",name:p.name,company:p.co,stage:p.stage})).concat(D.J.map(l=>({id:l.id,kind:"team",name:l.name,company:l.co,where:"Podcast board (Jade) · "+l.stage})),D.K.filter(k=>k.board&&!k.closed).map(k=>({id:k.id,kind:"team",name:k.name,company:k.co,where:k.board.title+" · "+(k.stage||"no stage")})));
}
function dropPrompt(text){
  return `You turn Kash's quick notes (often dictated on his phone) into updates for his sales pipeline. Today is ${TODAY} (${WD[now.getDay()]}).

Kash's own board is his SALES PIPELINE (board "sp"). Everything Kash says he is handling goes there. Its stages, in order: ${SP_STAGES.map(s=>JSON.stringify(s)).join(", ")}. Use "To contact" when he still has to reach out, "In conversation" while talking, "Follow-up" after a proposal or call, "Discovery call" when a call is booked, "Closed" when won, "Lost" when it's a no. Never use "Pre-qual" for something Kash is handling.
Only use a team board when Kash says the TEAM should handle it: "jade" (Jade qualifies for a growth audit), ${BOARDS.filter(b=>b.kind==="cl").map(b=>`"${b.key}" (${b.title}, stages ${b.stages.map(s=>JSON.stringify(s)).join(", ")})`).join("; ")}.
Origin is one of ${ORIGINS.join(", ")}. "Network" = someone Kash met himself or knows personally.

People already in the system. If the note is about one of them, set match_id to their id. "pipeline" entries are already on his board; "team" entries are with a team (if Kash is now handling one, still set match_id and board "sp"):
${JSON.stringify(itemsForPrompt())}

Reply with only JSON in this shape:
{"recap":"One to three plain sentences, addressed to Kash, of what you understood and what will be saved.","items":[{"match_id":"","name":"","company":"","what_they_do":"","email":"","phone":"","instagram":"","linkedin":"","board":"sp","stage":"To contact","origin":"Network","likely_offer":"Not sure yet","monthly_value":null,"needed":"what Kash has to do next, short","chase_date":"YYYY-MM-DD or empty","conversation":{"channel":"WhatsApp","summary":""}}],"question":""}
Rules: one item per deal (a person with two separate proposals = two items). Keep every text short and business-only: no emojis, no personal chit-chat. Never invent contact details: leave them empty. Turn relative dates ("Thursday", "next week") into dates. likely_offer is one of ${OFFERS.join(", ")}. monthly_value is a number in dollars only if the note gives one (use the low end of a range), else null. conversation.channel is one of ${CHANNELS.join(", ")}; set conversation to null if no conversation happened. Put a short question in "question" only if something essential is unclear.

Kash's note:
"""${text.slice(0,6000)}"""`;
}
function toggleMic(){
  if(!SR||!S.drop)return;
  if(rec){try{rec.stop()}catch(e){}return}
  const base=(el("slDt")&&el("slDt").value)||S.drop.text||"";
  try{rec=new SR();rec.lang=navigator.language||"en-GB";rec.continuous=true;rec.interimResults=true;
    rec.onresult=ev=>{let t="";for(let i=0;i<ev.results.length;i++)t+=ev.results[i][0].transcript;const v=(base?base+" ":"")+t.trim();S.drop.text=v;const ta=el("slDt");if(ta)ta.value=v};
    rec.onerror=ev=>{toast(ev.error==="not-allowed"||ev.error==="service-not-allowed"?"The microphone isn't available here. Use your keyboard's microphone.":"Couldn't hear that. Try again or type.")};
    rec.onend=()=>{rec=null;if(S.drop){S.drop.listening=false;render()}};
    rec.start();S.drop.listening=true;render();
  }catch(e){rec=null;toast("The microphone isn't available here. Use your keyboard's microphone.")}
}

document.addEventListener("click",async e=>{
  const a=e.target.closest("[data-act]");
  if(!a){const qr=el("slQr");if(qr&&!qr.hidden&&!e.target.closest(".sl-srch")){qr.hidden=true}return}
  const inSales=a.closest("#v-sales")||a.closest("#slModal")||a.id==="slFab";if(!inSales)return;
  const act=a.dataset.act;const card=a.closest("[data-id]");const id=(a.dataset.id)||(card&&card.dataset.id);
  if(act==="closebg"&&e.target!==a)return;
  if(S.ro&&RO_BLOCK.has(act)){toast(VIEW_ONLY);return}
  if(a.closest("#slQr")&&el("slQ")){el("slQ").value=""} /* picking a search result clears the search */
  const hideQ=()=>{if(el("slQr"))el("slQr").hidden=true};
  const closeAll=()=>{S.openId=S.openCl=S.openSp=S.openCt=null};
  if(act==="view"){S.view=a.dataset.v;S.inAdd=null;render();window.scrollTo({top:0});return}
  if(act==="fold"){toggleFold(a.dataset.board,a.dataset.stage);S.inAdd=null;render();const f=document.querySelector(`#v-sales .sl-col[data-board="${a.dataset.board}"][data-stage="${CSS.escape(a.dataset.stage)}"] [data-act="fold"]`);if(f)f.focus();return}
  if(act==="boxtog"){S.boxOpen=!(S.boxOpen!==false);try{localStorage.setItem("slBox",S.boxOpen?"1":"0")}catch(x){}render();return}
  if(act==="spview"){S.spView=a.dataset.v;S.inAdd=null;render();return}
  if(act==="open"){closeAll();S.openId=id;S.cOpen=false;hideQ();render();openComments(id);return}
  if(act==="openc"){closeAll();S.openCl=id;hideQ();render();return}
  if(act==="opensp"){closeAll();S.openSp=id;hideQ();render();return}
  if(act==="opent"){closeAll();S.openCt=id;hideQ();render();return}
  if(act==="close"||act==="closebg"){closeAll();S.adding=false;if(rec){try{rec.stop()}catch(x){}}S.drop=null;render();return}
  if(act==="refresh"){load(true);return}
  if(act==="inadd"){S.inAdd=a.dataset.ikey;render();return}
  if(act==="incancel"){S.inAdd=null;render();return}
  if(act==="insave"){const name=(el("slIn").value||"").trim();if(!name){el("slIn").focus();return}
    const [ctx,bk,stg,ch]=String(a.dataset.ikey).split("|");a.disabled=true;
    try{
      if(bk==="sp"){await newDeal({name,stage:stg||"To contact",origin:el("slInO")?el("slInO").value:"Network",chase_date:ch||(ctx==="p"?TODAY:""),conversation:null},null)}
      else{const b=BK[bk];await saveProposal({name,board:b.key,stage:b.stages.includes(stg)?stg:b.stages[0],conversation:null})}
      S.inAdd=null;toast(name+" added");await load(true)}catch(err){a.disabled=false;toast("Couldn't add the lead.")}return}
  if(act==="fab"&&S.n8n){S.adding=true;render();setTimeout(()=>el("slFn")&&el("slFn").focus(),30);return}
  if(act==="fab"){S.drop={text:""};render();setTimeout(()=>el("slDt")&&el("slDt").focus(),30);return}
  if(act==="mic"){toggleMic();return}
  if(act==="dropmanual"){if(rec){try{rec.stop()}catch(x){}}S.drop=null;S.adding=true;render();setTimeout(()=>el("slFn")&&el("slFn").focus(),30);return}
  if(act==="dropback"){S.drop.items=null;S.drop.question="";S.drop.recap="";render();return}
  if(act==="dropgo"){const t=(el("slDt").value||"").trim();S.drop.text=t;if(!t){el("slDt").focus();return}
    if(rec){try{rec.stop()}catch(x){}}
    const sample=await window.claude?.use?.("sample").catch(()=>null);
    if(!sample){S.drop.err="Claude isn't available here. Use 'Add by hand instead'.";render();return}
    S.drop.busy=true;S.drop.err="";render();
    try{const res=await sample.json(dropPrompt(t),{cache:false});
      const D=derive();
      const items=(res&&Array.isArray(res.items)?res.items:[]).filter(x=>x&&x.name).map(x=>{let m=x.match_id?D.all.find(i=>i.id===x.match_id):null;
        if(m&&m.kind!=="sp"&&(!x.board||x.board==="sp")&&D.spOf[m.id])m=D.spOf[m.id]; /* already on his pipeline (often Pre-qual): update that deal, never a second one */
        let board=m&&m.kind==="sp"?"sp":(x.board==="sp"||BK[x.board])?x.board:"sp";
        return Object.assign({},x,{match:m?{id:m.id,kind:m.kind,name:m.name,where:whereOf(m),stage:m.stage||"no stage"}:null,board,stage:x.stage||(m&&m.kind==="sp"?m.stage:"To contact"),origin:x.origin||(m?m.origin:"Network")})});
      if(!items.length){S.drop.busy=false;S.drop.err=(res&&res.question)||"I couldn't find a person in that note. Add a name and try again.";render();return}
      Object.assign(S.drop,{busy:false,items,recap:(res&&res.recap)||"",question:(res&&res.question)||""});render();
    }catch(err){S.drop.busy=false;S.drop.err=err&&err.code==="not_granted"?"Allow this dashboard to use Claude to read notes, or add by hand.":err&&err.code==="rate_limited"?"Claude is busy right now. Try again in a minute.":"I couldn't read that note. Try again, or add by hand.";render()}
    return}
  if(act==="dropsave"){const d=S.drop;if(!d||!d.items)return;
    d.items.forEach((it,i)=>{const v=k=>{const x=el("slP-"+k+"-"+i);return x?x.value.trim():""};
      it.name=v("n")||it.name;const co=v("c");if(co)it.company=co;if(!(it.match&&it.match.kind==="sp"))it.board=v("b")||it.board;it.stage=v("s")||it.stage;it.origin=v("g")||it.origin;it.needed=v("x");it.chase_date=v("d");it.likely_offer=v("o");it.monthly_value=v("m");
      const cs=v("v");it.conversation=cs?{channel:v("h")||"Other",summary:cs}:null});
    d.busy=true;render();let ok=0,bad=0;
    for(const it of d.items){try{await saveProposal(it);ok++}catch(err){bad++}}
    S.drop=null;toast(bad?`Saved ${ok}, ${bad} failed. Check Airtable.`:`Saved ${ok} ${ok===1?"update":"updates"}`);await load(true);return}
  if(act==="ctog"){S.cOpen=!S.cOpen;render();return}
  if(act==="spsvc"||act==="clsvc"){const kind=act==="spsvc"?"sp":"cl";const rid=kind==="sp"?S.openSp:S.openCl;const r=recOf(kind,rid);if(!r)return;const f=kind==="sp"?SP.services:CL.services;const cur=(r[f]||[]).map(sv);const v=a.dataset.v;saveRec(kind,rid,{[f]:cur.includes(v)?cur.filter(x=>x!==v):cur.concat([v])});return}
  if(act==="svc"){const r=lead(S.openId);const cur=(r[L.services]||[]).map(sv);const v=a.dataset.v;const nx=cur.includes(v)?cur.filter(x=>x!==v):cur.concat([v]);saveLead(S.openId,{[L.services]:nx});return}
  if(act==="postc"){const inp=el("slCm");const t=(inp&&inp.value||"").trim();if(!t)return;const id2=S.openId;inp.value="";
    try{await call("create_record_comment",{baseId:CB,tableId:T.leads,recordId:id2,text:t});S.cOpen=true;toast("Comment posted");openComments(id2)}catch(err){toast("Couldn't post the comment.")}return}
  if(act==="addconv"){const t=(el("slCt").value||"").trim();if(!t)return;const ch=el("slCc").value;const id2=S.openId;const r=lead(id2);const cid=r?ids(r[L.contacts])[0]:"";const f={[C.sum]:t,[C.lead]:[id2],[C.date]:TODAY,[C.ch]:ch};if(cid)f[C.contact]=[cid];const w=viewer();if(w)f[C.who]=w;
    try{const nid=await mk(CB,T.conv,f);S.conv.push(Object.assign({_id:nid},f,{[C.lead]:[{id:id2}],[C.ch]:{name:ch},[C.who]:w?{name:w}:null}));await saveLead(id2,{[L.lastC]:TODAY})}catch(err){toast("Couldn't log the conversation.")}return}
  if(act==="logsp"){const t=(el("slSx").value||"").trim();if(!t){el("slSx").focus();return}const ch=el("slSc").value;const p=derive().P.find(x=>x.id===a.dataset.id);if(!p)return;
    a.disabled=true;try{await logConv(t,ch,p.jadeId||"",p.contactIds[0]||"");await saveRec("sp",p.id,{[SP.lastc]:TODAY},true);toast("Conversation logged");render()}catch(err){a.disabled=false;toast("Couldn't log the conversation.")}return}
  if(act==="logct"){const t=(el("slTt").value||"").trim();if(!t){el("slTt").focus();return}const ch=el("slTc").value;const p=peopleOf(derive()).find(x=>x.id===a.dataset.id);if(!p)return;
    const jl=p.items.find(i=>i.kind==="jade");const f={[C.sum]:t,[C.date]:TODAY,[C.ch]:ch};if(p.ct)f[C.contact]=[p.ct._id];if(jl)f[C.lead]=[jl.id];const w=viewer();if(w)f[C.who]=w;
    if(!p.ct&&!jl){toast("Add this person to Contacts first.");return}
    a.disabled=true;
    try{const nid=await mk(CB,T.conv,f);S.conv.push(Object.assign({_id:nid},f));
      if(jl)await upd(CB,T.leads,jl.id,{[L.lastC]:TODAY}).then(()=>{lead(jl.id)[L.lastC]=TODAY}).catch(()=>{});
      for(const i of p.items.filter(i=>i.kind!=="jade")){await upd(KF[i.kind].base,KF[i.kind].tbl,i.id,{[KF[i.kind].lastc]:TODAY}).then(()=>{recOf(i.kind,i.id)[KF[i.kind].lastc]=TODAY}).catch(()=>{})}
      toast("Conversation logged");render()}catch(err){a.disabled=false;toast("Couldn't log the conversation.")}return}
  if(act==="savelead"){const name=(el("slFn").value||"").trim();if(!name){el("slFn").focus();return}
    const it={name,company:el("slFw").value||"",board:el("slFf").value,stage:el("slFs").value,origin:el("slFg").value,likely_offer:el("slFo").value,needed:el("slFx").value||"",chase_date:el("slFd").value||"",monthly_value:el("slFv").value,conversation:null};
    a.disabled=true;
    try{await saveProposal(it);S.adding=false;toast("Lead added");await load(true)}catch(err){a.disabled=false;toast("Couldn't add the lead.")}return}
});
document.addEventListener("keydown",e=>{
  if(e.target&&e.target.id==="slIn"){if(e.key==="Enter"){e.preventDefault();const b=document.querySelector('#v-sales [data-act="insave"]');if(b)b.click();return}if(e.key==="Escape"){S.inAdd=null;render();return}}
  if(e.key==="Escape"&&(S.openId||S.openCl||S.openSp||S.openCt||S.adding||S.drop)&&el("slModal")&&el("slModal").innerHTML){S.openId=S.openCl=S.openSp=S.openCt=null;S.adding=false;if(rec){try{rec.stop()}catch(x){}}S.drop=null;render()}
});
document.addEventListener("change",e=>{
  const a=e.target.closest("[data-act]")||e.target;if(!(a.closest("#v-sales")||a.closest("#slModal")))return;
  if(a.id==="slCo"){S.co=a.value;const pl=el("slPl");if(pl)pl.innerHTML=peopleRowsH(peopleOf(derive()));return}
  if(!a.dataset||!a.dataset.act)return;
  const card=a.closest("[data-id]");const act=a.dataset.act;
  if(act==="pboard"){const i=a.dataset.i;const s=el("slP-s-"+i);if(s)s.innerHTML=stagesFor(a.value).map(x=>`<option>${esc(x)}</option>`).join("");return}
  if(act==="fboard"){const s=el("slFs");if(s)s.innerHTML=stagesFor(a.value).map(x=>`<option ${x==="To contact"?"selected":""}>${esc(x)}</option>`).join("");return}
  if(S.ro){if(a.type==="checkbox")a.checked=!a.checked;toast(VIEW_ONLY);render();return}
  const kind=card?card.dataset.kind:S.openSp?"sp":S.openCl?"cl":"jade";
  const id=(card&&card.dataset.id)||S.openSp||S.openCl||S.openId;
  if(kind==="cl"||kind==="sp"){const k=KF[kind];const r=recOf(kind,id);if(!r)return;
    if(act==="done"){if(a.checked){S.prevLastC[id]=r[k.lastc]||null;saveRec(kind,id,{[k.lastc]:TODAY})}else saveRec(kind,id,{[k.lastc]:S.prevLastC[id]||null});return}
    if(act==="rstage"){const it=derive().K.find(x=>x.id===id);if(it&&it.board)saveRec("cl",id,{[it.board.field]:a.value||null});return}
    if(act==="spstage")return saveRec("sp",id,{[SP.stage]:a.value});
    if(act==="spoffer")return saveRec("sp",id,{[SP.offer]:a.value});
    if(act==="sporigin")return saveRec("sp",id,{[SP.origin]:a.value});
    if(act==="spchase")return saveRec("sp",id,{[SP.chase]:a.value||null});
    if(act==="spnotes")return saveRec("sp",id,{[SP.notes]:a.value||null},true);
    if(act==="needed"&&kind==="sp")return saveRec("sp",id,{[SP.needed]:a.value||null},true);
    if(act==="value")return saveRec(kind,id,{[k.value]:digits(a.value),[k.est]:false},true);
    const map={next:k.next,rwant:k.want,rnotes:k.notes,rowner:k.owner,rchase:k.chase};
    if(map[act]){saveRec(kind,id,{[map[act]]:a.value||null},act==="next"||act==="rwant"||act==="rnotes");return}
    return}
  if(act==="jstage")return saveLead(id,{[L.stage]:a.value});
  if(act==="done"){const r=lead(id);if(a.checked){S.prevLastC[id]=r[L.lastC]||null;saveLead(id,{[L.lastC]:TODAY})}else{saveLead(id,{[L.lastC]:S.prevLastC[id]||null})}return}
  if(act==="next")return saveLead(id,{[L.next]:a.value},false,true);
  if(act==="needed")return saveLead(id,{[L.needed]:a.value},false,true);
  if(act==="latest")return saveLead(id,{[L.latest]:a.value},false,true);
  if(act==="owner")return saveLead(id,{[L.owner]:a.value||null});
  if(act==="likely")return saveLead(id,{[L.likely]:a.value});
  if(act==="value")return saveLead(id,{[L.value]:digits(a.value),[L.est]:false},false,true);
  if(act==="last"){const l=deriveJ().find(x=>x.id===id);if(!l||!l.lastConv)return;const c=l.lastConv;const prev=c[C.sum];c[C.sum]=a.value;
    upd(CB,T.conv,c._id,{[C.sum]:a.value}).then(()=>toast("Saved")).catch(()=>{c[C.sum]=prev;render();toast("Couldn't save.")});return}
});
/* drag a card between columns */
let slDrag=false;
document.addEventListener("dragend",()=>{slDrag=false});
document.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest("#v-sales .sl-kc");if(!c)return;slDrag=true;e.dataTransfer.setData("text/plain",c.dataset.kind+":"+c.dataset.id);e.dataTransfer.effectAllowed="move"});
document.addEventListener("dragover",e=>{
  if(slDrag){const y=e.clientY,H=innerHeight,E=90;if(y<E)window.scrollBy(0,-Math.ceil((E-y)/3));else if(y>H-E)window.scrollBy(0,Math.ceil((y-(H-E))/3));
    const bd=document.querySelector("#v-sales .sl-board");if(bd){const r=bd.getBoundingClientRect();if(y>r.top&&y<r.bottom){if(e.clientX<r.left+70)bd.scrollLeft-=16;else if(e.clientX>r.right-70)bd.scrollLeft+=16}}}
  const col=e.target.closest&&e.target.closest("#v-sales .sl-col");if(!col)return;e.preventDefault();document.querySelectorAll("#v-sales .sl-col.over").forEach(x=>x!==col&&x.classList.remove("over"));col.classList.add("over")});
document.addEventListener("dragleave",e=>{const col=e.target.closest&&e.target.closest("#v-sales .sl-col");if(col&&!col.contains(e.relatedTarget))col.classList.remove("over")});
document.addEventListener("drop",e=>{slDrag=false;const col=e.target.closest&&e.target.closest("#v-sales .sl-col");if(!col)return;e.preventDefault();col.classList.remove("over");
  const [kind,id]=(e.dataTransfer.getData("text/plain")||"").split(":");if(!id)return;if(S.ro){toast(VIEW_ONLY);return}
  const bk=col.dataset.board;const st=col.dataset.stage;if(!bk||!st)return;
  /* save after the drag has fully ended, so the card being dragged isn't redrawn mid-drag */
  setTimeout(()=>{if(bk==="sp"&&kind==="sp")saveRec("sp",id,{[SP.stage]:st});else if(bk==="jade"&&kind==="jade")saveLead(id,{[L.stage]:st});else{const b=BK[bk];if(b&&b.kind==="cl"&&kind==="cl")saveRec("cl",id,{[b.field]:st})}},0)});

/* hook into the page's tabs */
if(typeof showTab==="function"){const prevShow=showTab;showTab=function(t){prevShow(t);const v=el("v-sales");if(v)v.hidden=t!=="sales";const fab=el("slFab");if(fab)fab.hidden=t!=="sales"||S.ro;if(t==="sales"){if(el("asof"))el("asof").hidden=true;if(el("rvAsof"))el("rvAsof").hidden=true;load()}else{S.openId=S.openCl=S.openSp=S.openCt=null;S.adding=false;S.drop=null;S.inAdd=null;if(el("slModal"))el("slModal").innerHTML=""}}}
{const hb=el("refreshBtn");if(hb)hb.addEventListener("click",()=>{if(S.loaded&&!S.loading)load(true)})}
if(location.hash==="#sales")showTab("sales");
})();
</script>
