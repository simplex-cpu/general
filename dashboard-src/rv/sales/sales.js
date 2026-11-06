<script>
/* Sales tab v5.2 (Karen, 5 Nov): Podcast Leads (was Growth Audit) and Podcast Guests; stages shown as "Sent to Sales" / "Sent to Podcast";
   one place per person (Pre-qual is one tile on the Sales Pipeline, handed-on Podcast Leads sit in "Sent to Sales"); standard origins only;
   Pre-qual "Sent to Podcast" adds the person to Podcast Guests for Jade.
   v5: My Board = what is on Kash's plate; Pipelines = Sales Pipeline (every deal), Podcast Leads, Podcast Guests (view only),
   Pre-qual (replaces Events, Referrals, Instagram & LinkedIn, Episode requests), Upwork, Upsells; Leads = every contact as a table.
   Pipelines at a glance comes from the Pipelines table, with Health set by hand (nothing works it out).
   Before v5: Sales tab v4 (4.2): Kash's board IS his Sales pipeline (ReLearn Commercials → Sales pipeline, one row per deal, his own stages).
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

/* v5.2 (Kash + Karen, 5 Nov): the standard sales stages. Airtable is being converted separately, so old values still land in the right column */
/* v7 (Kash + Karen call, 6 Nov): Kash's Sales tab is ONE sales pipeline. It starts when a call is booked (Audit booked): nothing before
   that shows (Pre-qual, Lead in and In conversation stay with the teams, for the lead-gen section to come). No side menu of team
   pipelines, no Group by: the stages, and the source of each deal as the tag on its card. SALES_ONLY=false brings the team boards back. */
const SALES_ONLY=true;
/* v8 (Karen, 6 Nov): Kash's board reads the "Kash board" field on each person's own record: Jade's Leads, Rise Voice Company Leads,
   and (for leads he adds himself) the Sales pipeline table. Airtable automations keep it in step with the team stages; this page only
   translates a team stage itself when "Kash board" is empty (safety net), with the same map as the automations. */
const KB_STAGES=["Audit Booked","Audit Held","Proposal Sent","Follow-up","Won","Onboarded","Lost"];
const KBF={jade:"fldzKqgC2SQOyGndm",cl:"fld5YT1cAYB56QePD",sp:"fldG9pzFmtKIGXCx1"},CL_NEED="fldb5I0h67Oqpp6QZ";
const SP_STAGES=SALES_ONLY?KB_STAGES:["Pre-qual","Lead in","In conversation","Audit booked","Audit held","Proposal sent","Follow-up call","Won – Handover to Ops","Lost / No reply"];
/* old Sales pipeline names -> current ones; not used on Kash's board, where "Follow-up" and "Lost" are real stages (kbRows translates) */
const SP_OLD=SALES_ONLY?{}:{"Potential":"Lead in","To contact":"Lead in","Follow-up":"In conversation","Discovery call":"Audit booked","Handover to Ops":"Won – Handover to Ops","Closed":"Won – Handover to Ops","Lost":"Lost / No reply","No reply":"Lost / No reply"};
/* a deal's stage as shown and counted (old or new Airtable value); blank = Pre-qual */
const spStage=v=>{const s=String(sv(v)||"").trim();return s?(SP_OLD[s]||s):"Pre-qual"};
const SP_WON=SALES_ONLY?"Won":"Won – Handover to Ops",SP_LOST=SALES_ONLY?"Lost":"Lost / No reply",SP_NEW=SALES_ONLY?"Audit Booked":"Lead in";
const SALES_STAGES=SALES_ONLY?KB_STAGES:["Audit booked","Audit held","Proposal sent","Follow-up call",SP_WON,SP_LOST];
const SALES_SET=new Set(SALES_STAGES);
const PLATE=new Set(SALES_ONLY?["Audit Booked","Audit Held","Proposal Sent","Follow-up"]:["Lead in","In conversation","Audit booked","Audit held","Proposal sent","Follow-up call"]); /* on his plate = open deals */
/* v5.2 (Karen, 5 Nov): the only origin / source names shown anywhere (Kash's funnel list from the 4 Nov ops meeting + the Pre-qual origins).
   Old values still in Airtable are shown (and written) as their standard name. */
const ORIGINS=["Podcast guest","Kash brand community","ReLearn community leads","Events","Referrals","Episode keyword","Network","IG organic","Upwork","Upsells","Old funnels / GHL","Other"];
const ORIG_MAP={"Podcast":"Podcast guest","Podcast guest":"Podcast guest","Referral":"Referrals","Referral / direct":"Referrals","Upsell":"Upsells","Old client":"Upsells","Personal Instagram":"IG organic","Instagram":"IG organic","Kash in person":"Network","In person":"Network","Event":"Events","Episode request":"Episode keyword","Old funnels / GHL":"Old funnels / GHL","Old funnels/GHL":"Old funnels / GHL","GHL":"Old funnels / GHL","LinkedIn":"Other","AI consulting":"Other","Rise Voice":"Other","Tool":"Other"};
const ORIG_LC={};ORIGINS.forEach(o=>ORIG_LC[o.toLowerCase()]=o);Object.keys(ORIG_MAP).forEach(k=>ORIG_LC[k.toLowerCase()]=ORIG_MAP[k]);
/* standard origin for any old or new value; "" when blank (the caller picks "No source" or "Other") */
const stdO=v=>{const s=String(sv(v)||"").replace(/^[^A-Za-z]+/,"").trim();return s?(ORIG_LC[s.toLowerCase()]||"Other"):""};
/* stage names as shown (Airtable values stay as they are) */
const ST_LABEL={"Sales Pipeline":"Sent to Sales","Podcast Pipeline":"Sent to Podcast"};
const stL=s=>ST_LABEL[s]||s;
/* the deal's From as shown: the Growth audit path is now Podcast Leads */
const fromL=s=>/growth audit path/i.test(String(s||""))?"Podcast Leads (Jade)":String(s||"");
const JADE_STAGES=["10 – Lead in","20 – Audit booked","30 – Audit held","40 – Growth plan sent","50 – Follow-up call","60 – Proposal","70 – Won","79 – Lost","80 – Re-approach (60–90 days)"];
const ORIGIN_ST=["New","Sales Pipeline","No Reply","Won","Lost","Not Applicable"];
const PROPOSAL_ST=["New","Build Proposal","Send Proposal","Proposal Sent","Sales Pipeline","Won","Lost","Archive"];
/* v5 (Karen, 5 Nov): Pre-qual Pipeline replaces Events, Referrals, Instagram & LinkedIn and Episode requests (their old stage fields stay in Airtable, no longer written from here) */
const PQ_STAGES=["New","First Outreach","Pre-qual","In Conversation","Follow-up","Email sequence","Podcast Pipeline","Sales Pipeline","No Reply","Archive"];
const PQ_ORIGINS=["Events","Referrals","ReLearn community leads","Kash brand community","Episode keyword","Network","IG organic"];
const BOARDS=[
  {key:"jade",title:"Podcast Leads",owner:"Jade",kind:"jade",field:L.stage,stages:JADE_STAGES,defOwner:"Jade",from:"Podcast Leads (Jade)",blurb:"Podcast guests with a sales opportunity. Jade turns them into clients; her stages are her own."},
  {key:"prequal",title:"Pre-qual Pipeline",owner:"Gretta",kind:"cl",field:CL.pq,src:[],source:"",defOwner:"Gretta",from:"Pre-qual (Gretta)",stages:PQ_STAGES,closed:new Set(["No Reply","Archive"]),blurb:"Every new lead from events, referrals, communities, episode keywords, the network and Instagram. Gretta checks fit and route, then hands them on."},
  {key:"upwork",title:"Upwork Pipeline",owner:"Danica",kind:"cl",field:CL.uw,src:["Upwork"],source:"Upwork",defOwner:"Danica",from:"Upwork (Danica)",stages:["New","Proposal Sent","Sales Pipeline","No Reply","Won","Lost","Not Applicable"],blurb:"Upwork jobs and proposals, handled by Danica."},
  {key:"upsell",title:"Upsells Pipeline",owner:"Sarah",kind:"cl",field:CL.up,src:["Upsell","Upsells"],source:"Upsell",defOwner:"Sarah",from:"Upsells (Sarah)",stages:PROPOSAL_ST,blurb:"Existing clients ready for more. Sarah qualifies before it reaches the sales pipeline."}
];
const BK={};BOARDS.forEach(b=>BK[b.key]=b);
const SPB={key:"sp",title:"Sales pipeline",owner:"Kash",kind:"sp",field:SP.stage,stages:SP_STAGES};
/* Podcast Guests: the board is read only; the one write is a new guest when Pre-qual sends someone to the podcast (Sent to Podcast) */
const GUEST_ST=["0 – Researched","10 – Outreach sent","19 – No reply","20 – In conversation","28 - Later Trip","28 – Not now","28 – Not now (try a later trip)","29 – Not interested","30 – Intro call booked","40 – Intro call done","50 – Recording booked","60 – Episode released (stay in touch)"];
const GUEST_CAP=50;
const gLabel=st=>String(st||"").replace(/^\d+\s*[–-]\s*/,"");
/* old view keys that no longer exist land on the board that replaced them */
const OLD_VIEW={event:"prequal",referral:"prequal",social:"prequal",episode:"prequal",ai:"mine",overview:"mine"};
const DONE=new Set(["70 – Won","79 – Lost","Offer accepted (Closed)","Offer declined (Rejected)","No response (Rejected)","Sales Pipeline","Growth Plan Booking","Email sequence","Podcast Pipeline","No Reply","Won","Lost","Not Applicable","Archive","No reply","Handover to Ops","Closed"]);
const HANDED=new Set(["Sales Pipeline","Growth Plan Booking","Email sequence","Podcast Pipeline"]);
const isDone=s=>!!s&&(DONE.has(s)||s.startsWith("→"));
const OFFERS=["High ticket","Mid ticket","Low ticket","AI solutions","Sponsor","Not sure yet"];
const SERVICES=["Podcast placements","Podcast build","Social growth","Email monetisation","Events / speaking","Sponsorship","AI and systems","Talent"];
const CHANNELS=["WhatsApp","Email","Instagram","LinkedIn","Call","In person","Other"];
const OWNERS=["Kash","Jade","Sales hire"];
const CL_OWNERS=["Gretta","Sarah","Jade","Kash","Danica"];
/* the Airtable option is still spelled "Greta" on older rows: show it as Gretta; new writes use "Gretta" (typecast) */
const ownerN=v=>v==="Greta"?"Gretta":v;
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
/* v5.2: every standard origin has its icon */
OI["Podcast guest"]=OI.Podcast;OI.Referrals=OI.Referral;OI.Events=OI.Event;OI["IG organic"]=OI.Instagram;OI.Upsells=OI.Upsell;
OI["Kash brand community"]={c:"#4338CA",p:OI["Rise Voice"].p};OI["ReLearn community leads"]={c:"#DB2777",p:OI.Referral.p};OI["Episode keyword"]=OI["Episode request"];
const DUE_ORDER={overdue:0,today:1,week:2,later:3};
const RO_BLOCK=new Set(["addoffer","spwon","splost","spmore","delgo","ctedit","ctsave","fab","svc","spsvc","clsvc","postc","addconv","savelead","dropgo","dropsave","dropmanual","inadd","insave","logct","logsp"]);
const VIEW_ONLY="View only on this link. Open the Claude copy to make changes.";
const CHEV="M15 18l-6-6 6-6",EXP="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",PLUS="M12 5v14M5 12h14",XI="M6 6l12 12M18 6 6 18",MIC="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8";

const S={boxOpen:(()=>{try{return localStorage.getItem("slBox")!=="0"}catch(e){return true}})(),pqGroup:(()=>{try{return localStorage.getItem("slPqGroup")==="origin"?"origin":"stage"}catch(e){return "stage"}})(),loaded:false,loading:false,err:"",leads:[],conv:[],calls:[],money:[],contacts:[],cl:[],sp:[],ul:[],pipelines:[],guests:[],guestTeam:[],view:"mine",openId:null,openCl:null,openClB:null,openSp:null,openCt:null,openG:null,gAll:{},ctAll:false,comments:{},cOpen:false,adding:false,drop:null,prevLastC:{},inAdd:null,cq:"",co:""};
/* v5.4: re-level the board headers when a board changes width (window resize, tab shown) */
const headW=new WeakMap();
const headRO=typeof ResizeObserver==="function"?new ResizeObserver(es=>{if(es.some(e=>headW.get(e.target)!==Math.round(e.contentRect.width))){es.forEach(e=>headW.set(e.target,Math.round(e.contentRect.width)));requestAnimationFrame(()=>eqHeads())}}):null;
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
/* a typed amount: "12000", "$12,000", "12k", "1.5m", "5000/mo"; a range ("10-15k", "10k to 15k") keeps its low end, as the
   Drop-a-note prompt does. "" = cleared (null); anything else is NaN and is not saved */
const amt=v=>{if(typeof v==="number")return isFinite(v)?Math.round(v):NaN;let s=String(v==null?"":v).trim().toLowerCase();if(!s)return null;
  s=s.replace(/usd|[$£€,\s]/g,"").replace(/(?:\/|per|a)?(?:month|mo|pm)$/,"");
  const m=s.match(/^(\d+(?:\.\d+)?|\.\d+)([km]?)(?:(?:-|–|—|to)(\d+(?:\.\d+)?|\.\d+)([km]?))?$/);if(!m)return NaN;
  const mul=x=>x==="k"?1e3:x==="m"?1e6:1;return Math.round(Number(m[1])*mul(m[2]||m[4]||""))};
/* the same, for values that were already checked (a form, Claude's reply): unreadable = nothing */
const amtOK=v=>{const n=amt(v);return Number.isNaN(n)?null:n};
const AMT_MSG="Type the value as a number, e.g. 12000, $12,000 or 12k.";
const norm=s=>String(s||"").toLowerCase().replace(/^@/,"").replace(/\s+/g," ").trim();
const svg=(d,s)=>`<svg width="${s||14}" height="${s||14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;
const viewer=()=>{const v=(window.__rlViewer||(window.claude?.use?"":"Kash")).trim();return OWNERS.includes(v)?v:""};
const atUrl=(b,t,id)=>"https://airtable.com/"+b+"/"+t+"/"+id;
const idFromUrl=u=>{const m=String(u||"").match(/(rec[A-Za-z0-9]{14})/);return m?m[1]:""};
const lastNote=t=>{const p=String(t||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);return p.length?p[p.length-1]:""};
function dueOf(chase){if(!chase)return{due:"later",dueL:"No chase date"};const n=dd(chase,TODAY);if(n<0){const k=-n;return{due:"overdue",dueL:"Overdue · "+(k>=28?Math.round(k/30)+(Math.round(k/30)>1?" months":" month"):k+(k>1?" days":" day"))}}if(n===0)return{due:"today",dueL:"Today"};if(n<=7)return{due:"week",dueL:WD[new Date(chase+"T12:00:00").getDay()]+" "+short(chase)};return{due:"later",dueL:short(chase)}}
/* an origin's icon on its own (tags, and the column titles when a board is grouped by source) */
function oIconH(o,sz,cls){const k=OI[o]?o:"Other";const i=OI[k];const c=cls?` class="${cls}"`:"";sz=sz||13;return i.raw?`<svg${c} width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true">${i.raw}</svg>`:`<svg${c} width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${i.c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${i.p}"></path></svg>`}
function otagH(o){o=stdO(o)||"Other";return `<span class="sl-otag">${oIconH(o)}${esc(o||"Other")}</span>`}
/* the offer = services in play: tags on cards, clickable chips in the windows */
const svcTagsH=list=>(list||[]).map(x=>`<span class="sl-svc">${esc(x)}</span>`).join("");
function svcPickH(act,list,gid,row){const ro=S.ro;
  const chips=`<div class="sl-chips">${ro?((list||[]).length?list.map(x=>`<span class="sl-chip" aria-pressed="true">${esc(x)}</span>`).join(""):'<span class="pm">None yet</span>'):SERVICES.map(x=>`<button type="button" class="sl-chip" data-act="${act}" data-v="${esc(x)}" aria-pressed="${(list||[]).includes(x)}">${esc(x)}</button>`).join("")}</div>`;
  /* row (Kash's window, 6 Nov): the label and the offers on one line */
  if(row)return `<div class="sl-svcrow" role="group" aria-labelledby="${gid}"><span class="sl-sub" id="${gid}">Offers in play</span>${chips}</div>`;
  return `<div role="group" aria-labelledby="${gid}"><p class="sl-sub" id="${gid}">Offers in play${ro?"":` <span style="text-transform:none;letter-spacing:0;font-weight:400">· click to add or remove</span>`}</p>${chips}</div>`}
function tagH(o){return `<span class="sl-tag${o==="High ticket"?" hi":""}">${svg(ICON[o]||ICON["Not sure yet"],13)}${esc(o)}</span>`}

/* ---------- v6 (Karen, 6 Nov): ONE branded picker for every dropdown in the Sales tab ----------
   Closed: the value as a coloured pill (+ caret); in forms and filters a field-sized button holding the pill.
   Open: the dashboard's own listbox (a popover; a bottom sheet on phones). The trigger is a <button> whose value is the
   selected value, and picking fires the same "change" event the old <select> fired, so every save path is unchanged. */
const TICKET_C={"High ticket":"blue","Mid ticket":"violet","Low ticket":"teal","AI solutions":"purple","Sponsor":"yellow","Not sure yet":"grey"};
const CH_C={WhatsApp:"green",Instagram:"pink",Email:"blue",Call:"purple","In person":"yellow",LinkedIn:"teal",Other:"grey"};
const OI_C=o=>(OI[o]&&OI[o].c)||({LinkedIn:"#0A66C2",Upwork:"#14A800"})[o]||"#94A3B8";
/* a stage's tone, the same one its board column uses */
function stoneOf(k,v){if(k==="sp")return stageTone(SP_STAGES,v);const bk=k.slice(3);if(!v)return "out";const tm=TONE_MAP[bk];if(tm)return tm[v]||"s1";const b=BK[bk];return stageTone(b?b.stages:[v],v)}
/* the pill for value v (label l) of a picker kind: sp | st:<board> | health | origin | filter | owner | ticket | ch | board */
function pillH(k,v,l){
  l=l==null?v:l;let cls="pc-grey",st="",ic='<i class="sl-dot"></i>';
  if(v===MIXED){cls="pc-grey pc-mix"}
  else if(k==="sp"||k.startsWith("st:"))cls="stx st-"+stoneOf(k,v);
  else if(k==="health")cls=HEALTH_TONE[v]?"stx st-"+HEALTH_TONE[v]:"pc-grey";
  else if(k==="origin"||k==="filter"){if(v&&v!=="No source"&&v!=="No origin yet"){const o=OI[v]?v:"Other";cls="pc-o";st=` style="--pd:${OI_C(o)}"`;ic=oIconH(o,13)}else if(k==="filter"&&!v){cls="pc-none";ic=""}}
  else if(k==="owner"){if(v){cls="pc-ind";ic=`<span class="sl-pav" aria-hidden="true">${esc(v.charAt(0).toUpperCase())}</span>`}}
  else if(k==="ticket"){cls="pc-"+(TICKET_C[v]||"grey");ic=svg(ICON[v]||ICON["Not sure yet"],13)}
  else if(k==="ch")cls="pc-"+(CH_C[v]||"grey");
  else if(k==="date")cls=v==="overdue"?"pc-od":v==="today"?"pc-td":v==="none"?"pc-grey pc-dnone":"pc-grey";
  else if(k==="board"||k==="offer")cls=v==="sp"||k==="offer"?"pc-ind":"pc-grey";
  return `<span class="sl-pill ${cls}"${st}>${ic}<span class="t">${esc(l)}</span></span>`;
}
/* an option is [value, label] (or just the value); an optional third item is a short note shown on the right (e.g. "already in play") */
const pkNorm=opts=>(opts||[]).map(x=>Array.isArray(x)?[String(x[0]),String(x[1]==null?x[0]:x[1])].concat(x[2]?[String(x[2])]:[]):[String(x),String(x)]);
const CARET="m6 9 6 6 6-6";
/* the value a person-level picker shows when the person's offers differ */
const MIXED="\u2217mixed";
/* o: {id, k (kind), v (value), opts ([value,label] or value), name (what it is, for screen readers and the sheet title), act, field, dis, attrs, cls}.
   Like a native <select>, a value that is not in the list shows (and is) the first option. */
function pkH(o){
  const opts=pkNorm(o.opts);const cur=opts.find(x=>x[0]===String(o.v==null?"":o.v))||opts[0]||["",""];
  return `<button type="button" class="sl-pk${o.field?" fld":""}${o.cls?" "+o.cls:""}" id="${esc(o.id)}" value="${esc(cur[0])}"${o.act?` data-act="${esc(o.act)}"`:""} data-k="${esc(o.k)}" data-n="${esc(o.name)}" data-o="${esc(JSON.stringify(opts))}" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(o.name+": "+cur[1])}" title="${esc(cur[1])}"${o.dis?" disabled":""}${o.attrs||""}>${pillH(o.k,cur[0],cur[1])}${o.dis?"":`<span class="car" aria-hidden="true">${svg(CARET,14)}</span>`}</button>`;
}
/* v6.1: a chase date in a window's facts is a real pill ("Fri 7 Nov"; red when overdue, amber today; "Set a date" when empty) with the
   date input laid over it, so a click anywhere on the pill opens the browser's date picker and the save path is the input's, as before */
const dLab=v=>v?WD[new Date(String(v).slice(0,10)+"T12:00:00").getDay()]+" "+short(v):"Set a date";
const dState=v=>{if(!v)return "none";const d=dueOf(v).due;return d==="overdue"||d==="today"?d:""};
const dateH=(id,act,v)=>`<span class="sl-dpw${S.ro?" ro":""}">${pillH("date",dState(v),dLab(v))}${S.ro?"":`<span class="car" aria-hidden="true">${svg(CARET,14)}</span>`}<input id="${id}" type="date" class="sl-dpi" data-act="${act}" value="${esc(v||"")}"${S.ro?" readonly":""}></span>`;
const dpSync=i=>{const p=i.closest(".sl-dpw")&&i.closest(".sl-dpw").querySelector(".sl-pill");if(p)p.outerHTML=pillH("date",dState(i.value),dLab(i.value))};
const pkOptsOf=t=>{try{return pkNorm(JSON.parse(t.dataset.o||"[]"))}catch(e){return []}};
/* set a picker's value (and its pill) without firing anything */
function pkSet(t,v){const opts=pkOptsOf(t);const c=opts.find(x=>x[0]===String(v==null?"":v))||opts[0]||["",""];t.value=c[0];t.setAttribute("aria-label",t.dataset.n+": "+c[1]);t.title=c[1];const p=t.querySelector(".sl-pill");if(p)p.outerHTML=pillH(t.dataset.k,c[0],c[1])}
/* give a picker a new list (e.g. the stages after "Goes to" changes) */
function pkReplace(t,opts,v,k){t.dataset.o=JSON.stringify(pkNorm(opts));if(k)t.dataset.k=k;pkSet(t,v)}
let PK=null;
const pkVis=()=>PK.opts.map((x,i)=>i).filter(i=>!PK.q||PK.opts[i][1].toLowerCase().includes(PK.q));
function pkEl(){let p=el("slPk");if(p)return p;
  p=document.createElement("div");p.id="slPk";p.className="sl-pop";p.hidden=true;document.body.appendChild(p);
  const s=document.createElement("div");s.id="slPkS";s.className="sl-pkscrim";s.hidden=true;document.body.appendChild(s);
  p.addEventListener("mousedown",e=>{if(e.target.closest(".sl-pko"))e.preventDefault()});
  p.addEventListener("click",e=>{const o=e.target.closest(".sl-pko");if(o&&PK)pkPick(Number(o.dataset.i))});
  p.addEventListener("mousemove",e=>{const o=e.target.closest(".sl-pko");if(o&&PK&&Number(o.dataset.i)!==PK.act){PK.act=Number(o.dataset.i);pkMark(false)}});
  p.addEventListener("input",e=>{if(PK&&e.target.id==="slPkF"){PK.q=e.target.value.trim().toLowerCase();const v=pkVis();if(!v.includes(PK.act))PK.act=v.length?v[0]:-1;pkList()}});
  p.addEventListener("keydown",pkKey);
  return p}
function pkList(){const l=el("slPkL");if(!l||!PK)return;const v=pkVis();
  /* v6.1: deal stages: a line before the closing stages (Won, Lost) */
  const cl=x=>x===SP_WON||x===SP_LOST;
  l.innerHTML=v.length?v.map((i,n)=>{const [val,lab,note]=PK.opts[i];const sel=val===PK.t.value;const sep=PK.k==="sp"&&cl(val)&&n>0&&!cl(PK.opts[v[n-1]][0])?'<div class="sl-pksep" aria-hidden="true"></div>':"";return sep+`<div role="option" id="slPkO-${i}" class="sl-pko${i===PK.act?" act":""}" data-i="${i}" data-v="${esc(val)}" aria-selected="${sel}">${pillH(PK.k,val,lab)}${note?`<span class="sl-pkn">${esc(note)}</span>`:""}${sel?'<span class="sl-ck" aria-hidden="true">✓</span>':""}</div>`}).join(""):'<div class="sl-pke">No matches</div>';
  pkMark(true)}
function pkMark(scroll){const l=el("slPkL");if(!l||!PK)return;l.querySelectorAll(".sl-pko.act").forEach(x=>x.classList.remove("act"));const a=el("slPkO-"+PK.act);
  const f=el("slPkF")||l;if(a){a.classList.add("act");f.setAttribute("aria-activedescendant",a.id);if(scroll)a.scrollIntoView({block:"nearest"})}else f.removeAttribute("aria-activedescendant")}
function pkPlace(){
  if(!PK)return;const p=el("slPk"),l=el("slPkL");if(!p||!l)return;
  if(PK.sheet){p.style.left=p.style.top=p.style.width="";l.style.maxHeight="";return}
  const r=PK.t.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight,M=8,G=6;
  /* v6.1: as wide as its widest option (so "Social growth · already in play" is not cut), between the button's width / 220px and 360px */
  l.style.maxHeight="";p.style.width="max-content";const nat=Math.ceil(p.getBoundingClientRect().width);const w=Math.min(Math.max(r.width,220,nat),360,vw-2*M);p.style.width=w+"px";
  p.style.left=Math.round(Math.min(Math.max(M,r.left),vw-w-M))+"px";p.style.top="0px";
  const h=p.offsetHeight,extra=h-l.offsetHeight,below=vh-r.bottom-G-M,above=r.top-G-M;
  if(h<=below||below>=above){if(h>below)l.style.maxHeight=Math.max(96,below-extra)+"px";p.style.top=Math.round(r.bottom+G)+"px";PK.up=false}
  else{if(h>above)l.style.maxHeight=Math.max(96,above-extra)+"px";p.style.top=Math.round(Math.max(M,r.top-G-p.offsetHeight))+"px";PK.up=true}
  p.classList.toggle("up",!!PK.up)}
function pkOpen(t){
  pkClose(false);if(!t||t.disabled)return;
  const opts=pkOptsOf(t);const sheet=matchMedia("(max-width:560px)").matches;const big=opts.length>10;
  PK={t,id:t.id,sp:S.openSp,opts,k:t.dataset.k||"",sheet,q:"",act:Math.max(0,opts.findIndex(x=>x[0]===t.value)),ta:"",tt:0};
  const p=pkEl(),n=t.dataset.n||"Options";
  p.innerHTML=(sheet?`<div class="sl-pkh"><b>${esc(n)}</b><button type="button" class="sl-pkx" aria-label="Close">${svg(XI,16)}</button></div>`:"")
    +(big?`<div class="sl-pkf"><input id="slPkF" type="text" placeholder="Type to filter" aria-label="${esc("Filter "+n)}" aria-controls="slPkL" aria-autocomplete="list" autocomplete="off" spellcheck="false"></div>`:"")
    +`<div class="sl-pkl" id="slPkL" role="listbox" tabindex="-1" aria-label="${esc(n)}"></div>`;
  p.classList.toggle("sheet",sheet);p.hidden=false;el("slPkS").hidden=!sheet;
  const x=p.querySelector(".sl-pkx");if(x)x.addEventListener("click",()=>pkClose(true));
  t.setAttribute("aria-expanded","true");t.setAttribute("aria-controls","slPkL");
  /* phones: focus the list, not the filter box, so the keyboard does not cover the sheet (tap the box to filter) */
  pkList();pkPlace();(!sheet&&el("slPkF")||el("slPkL")).focus({preventScroll:true});pkMark(true);
}
function pkClose(back){if(!PK)return;const t=PK.t;PK=null;const p=el("slPk");if(p){p.hidden=true;p.innerHTML="";p.classList.remove("sheet","up")}const s=el("slPkS");if(s)s.hidden=true;
  if(t&&t.isConnected){t.setAttribute("aria-expanded","false");if(back)t.focus({preventScroll:true})}}
/* pick option i: the same change event as the old select (nothing when the value is the same), then focus back on the picker */
function pkPick(i){if(!PK)return;const t=PK.t,o=PK.opts[i],id=t.id;pkClose(false);if(!o)return;
  if(t.value!==o[0]){pkSet(t,o[0]);t.dispatchEvent(new Event("change",{bubbles:true}))}
  const n=t.isConnected?t:el(id);if(n)n.focus({preventScroll:true})}
function pkKey(e){
  if(!PK)return;const v=pkVis();const at=v.indexOf(PK.act);const inF=e.target.id==="slPkF";const k=e.key;
  const go=j=>{if(!v.length)return;PK.act=v[Math.max(0,Math.min(v.length-1,j))];pkMark(true)};
  if(k==="ArrowDown"){e.preventDefault();go(at<0?0:at+1)}
  else if(k==="ArrowUp"){e.preventDefault();go(at<0?0:at-1)}
  else if(k==="Home"&&!inF){e.preventDefault();go(0)}else if(k==="End"&&!inF){e.preventDefault();go(v.length-1)}
  else if(k==="PageDown"){e.preventDefault();go(at+8)}else if(k==="PageUp"){e.preventDefault();go(at-8)}
  else if(k==="Enter"||(k===" "&&!inF)){e.preventDefault();if(at>=0)pkPick(PK.act)}
  else if(k==="Escape"){e.preventDefault();pkClose(true)}
  else if(k==="Tab"){e.preventDefault();pkClose(true)}
  else if(!inF&&k.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    /* type to jump: the next option whose name starts with what was typed */
    const ts=Date.now();PK.ta=(ts-PK.tt>700?"":PK.ta)+k.toLowerCase();PK.tt=ts;
    const order=PK.ta.length===1?v.slice(at+1).concat(v.slice(0,at+1)):v.slice(Math.max(at,0)).concat(v.slice(0,Math.max(at,0)));
    const hit=order.find(i=>PK.opts[i][1].toLowerCase().startsWith(PK.ta));if(hit!=null){PK.act=hit;pkMark(true)}e.preventDefault()}
  else return;
  e.stopPropagation()}
/* after a redraw: keep the open list on the new copy of its picker, or close it when the picker is gone */
function pkSync(){if(!PK)return;if(PK.sp!==S.openSp){pkClose(false);return}if(PK.t.isConnected)return;const n=el(PK.id);if(!n||n.disabled){pkClose(false);return}PK.t=n;n.setAttribute("aria-expanded","true");n.setAttribute("aria-controls","slPkL");pkPlace()}
/* a click anywhere else closes the list and does nothing else (like a native dropdown) */
let pkSwallow=0;
document.addEventListener("pointerdown",e=>{if(!PK)return;const p=el("slPk");if(p&&p.contains(e.target))return;if(PK.t.contains(e.target))return;pkSwallow=Date.now();pkClose(false)},true);
document.addEventListener("click",e=>{if(pkSwallow&&Date.now()-pkSwallow<800){pkSwallow=0;e.stopPropagation();e.preventDefault()}pkSwallow=0},true);
document.addEventListener("scroll",e=>{if(!PK||PK.sheet)return;const p=el("slPk");if(p&&e.target instanceof Node&&p.contains(e.target))return;pkPlace()},true);
window.addEventListener("resize",()=>{if(PK){const sh=matchMedia("(max-width:560px)").matches;if(sh!==PK.sheet)pkClose(false);else pkPlace()}});

let mcpP=null;
async function mcp(){if(!window.claude?.use)throw new Error("unavailable");if(!mcpP)mcpP=window.claude.use("mcp");const m=await mcpP;if(!m)throw new Error("unavailable");return m}
async function call(tool,args){
  /* n8n-hosted copy (Kash's link): the same calls go to the page's own save route, which allows only this tab's tables and fields */
  if(!window.claude?.use){const res=await fetch(location.pathname.replace(/\/$/,"")+"/sales-api",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tool,args})});let j={};try{j=await res.json()}catch(e){}if(!res.ok||j.isError)throw new Error("airtable");return j.payload||{}}
  const m=await mcp();const r=await m.callTool("Airtable",tool,args,{cache:false});if(r&&r.isError)throw new Error("airtable");return (r&&r.payload)||{}}
async function list(base,tbl,fields){let out=[],c=null;do{const p=await call("list_records_for_table",{baseId:base,tableId:tbl,fieldIds:fields,pageSize:1000,...(c?{cursor:c}:{})});out=out.concat(p.records||[]);c=p.nextCursor||null}while(c);return out.map(r=>Object.assign({_id:r.id},r.cellValuesByFieldId||{}))}
async function upd(base,tbl,id,fields,typecast){return call("update_records_for_table",{baseId:base,tableId:tbl,records:[{id,fields}],typecast:!!typecast})}
async function mk(base,tbl,fields,typecast){
  /* sales-only mode: Kash's own new lead keeps its stage in "Kash board" (and the old Sales stage in step) */
  if(SALES_ONLY&&tbl===T.sp&&fields[SP.stage]){fields=Object.assign({},fields,{[KBF.sp]:fields[SP.stage],[SP.stage]:KB_TO_OLD[fields[SP.stage]]||null})}
  const p=await call("create_records_for_table",{baseId:base,tableId:tbl,records:[{fields}],typecast:!!typecast});return ((p.records||[])[0]||{}).id}

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
      /* v5.1: the 1,181 podcast guests come in a second, background request (header X-Sales-Part: guests), so the tab opens without waiting for them */
      if(!j.guests){S.gLoading=true;S.noG=false;S.gP=fetch(location.pathname.replace(/\/$/,"")+"/sales",{cache:"no-store",headers:{"X-Sales-Part":"guests"}}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
        .then(g=>{S.guests=n(g.guests);S.guestTeam=n(g.guestTeam);S.noG=!g.guests;S.gLoading=false;render()}).catch(()=>{S.gLoading=false;S.noG=true;render()})}
      else S.gP=null;
      if(SALES_ONLY){S.spRaw=S.sp;S.sp=kbRows()}
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
    return Object.assign({kind:"jade",id:r._id,r,name:r[L.name]||"(no name)",co:r[L.co]||r[L.what]||"",origin:stdO(src)||"Other",stage,closed:/Won|Lost/i.test(stage),chase:r[L.chase]||"",conv:cv,lastConv:lc,lastC,offer:sv(r[L.confirmed])||sv(r[L.likely])||"Not sure yet",value:r[L.value]||0,est:!!r[L.est],done:(r[L.lastC]||"")===TODAY,owner:sv(r[L.owner]),services:(r[L.services]||[]).map(sv),board:BK.jade,boards:[BK.jade]},dueOf(r[L.chase]||""));
  });
}
function deriveCL(){
  return S.cl.filter(r=>String(r[CL.name]||"").trim()).map(r=>{
    const src=sv(r[CL.src]);const pqo=sv(r[CL.pqo]);
    /* Pre-qual: only rows with a Pre-qual stage; Upwork and Upsells also by Source, as before */
    const boards=BOARDS.filter(b=>b.kind==="cl"&&(b.src.includes(src)||sv(r[b.field])));
    const b0=boards[0]||null;const stage=b0?sv(r[b0.field]):"";const lastC=r[CL.lastc]||"";
    return Object.assign({kind:"cl",id:r._id,r,name:String(r[CL.name]).trim(),co:r[CL.co]||"",origin:stdO(pqo)||stdO(src)||stdO(b0&&b0.source)||"Other",pqo,boards,board:b0,stage,closed:isDone(stage),chase:r[CL.chase]||"",owner:ownerN(sv(r[CL.owner])),want:r[CL.want]||"",next:r[CL.next]||"",notes:r[CL.notes]||"",lastC,value:r[CL.val]||0,est:!!r[CL.est],services:(r[CL.services]||[]).map(sv),done:lastC===TODAY},dueOf(r[CL.chase]||""));
  });
}
function deriveSP(){
  return S.sp.filter(r=>String(r[SP.deal]||"").trim()).map(r=>{
    const stage=spStage(r[SP.stage]);const lastC=r[SP.lastc]||"";const rv=r[SP.rv]||"";
    return Object.assign({kind:"sp",id:r._id,r,name:String(r[SP.deal]).trim(),co:r[SP.co]||"",origin:stdO(r[SP.origin])||"Other",stage,pre:stage==="Pre-qual",plate:PLATE.has(stage),closed:stage===SP_WON||stage===SP_LOST,chase:r[SP.chase]||"",owner:sv(r[SP.owner]),needed:r[SP.needed]||"",notes:r[SP.notes]||"",lastC,value:r[SP.value]||0,est:!!r[SP.est],offer:sv(r[SP.offer])||"Not sure yet",services:(r[SP.services]||[]).map(sv),from:fromL(sv(r[SP.from])),jadeId:ids(r[SP.jade])[0]||"",rvId:idFromUrl(rv),rvUl:/tbl8xDFVwfdMS7v3v/.test(rv),contactIds:ids(r[SP.contacts]),done:lastC===TODAY,board:SPB,boards:[SPB]},dueOf(r[SP.chase]||""));
  });
}
/* the team stage -> Kash board translation, only used when "Kash board" is empty (the automations normally fill it) */
/* Karen, 6 Nov: same rule as the automations. A team hand-over (or any later team stage) lands at Audit Booked and Kash moves it on;
   a team Lost before the hand-over stays with the team (Not a Fit). Once a lead shows one of Kash's stages only Kash moves it. */
const KB_JADE={"10 – Lead in":"In Conversation","20 – Audit booked":"Audit Booked","30 – Audit held":"Audit Booked","40 – Growth plan sent":"Audit Booked","50 – Follow-up call":"Audit Booked","60 – Proposal":"Audit Booked","70 – Won":"Audit Booked","79 – Lost":"Not a Fit","80 – Re-approach (60–90 days)":"Not a Fit"};
const KB_PQ={"New":"New","First Outreach":"Contacted","Pre-qual":"In Conversation","In Conversation":"In Conversation","Follow-up":"In Conversation","Email sequence":"Nurture Sequence","Podcast Pipeline":"Sent to Podcast","Sales Pipeline":"Audit Booked","No Reply":"No Reply","Archive":"Not a Fit"};
const KB_UW={"New":"New","Proposal Sent":"Contacted","Sales Pipeline":"Audit Booked","Won":"Audit Booked","No Reply":"No Reply","Lost":"Not a Fit","Not Applicable":"Not a Fit"};
const KB_US={"New":"New","Build Proposal":"In Conversation","Send Proposal":"In Conversation","Proposal Sent":"In Conversation","Sales Pipeline":"Audit Booked","Won":"Audit Booked","Lost":"Not a Fit","Archive":"Not a Fit"};
const KB_REF={"Contact info provided by client":"New","First outreach":"Contacted","Following up":"In Conversation","Call booked":"Audit Booked","Post call follow-up":"Audit Booked","Offer accepted (Closed)":"Audit Booked","Offer declined (Rejected)":"Not a Fit","No response (Rejected)":"No Reply","Sales Pipeline":"Audit Booked"};
const KB_SIMPLE={"New":"New","Sales Pipeline":"Audit Booked","Won":"Audit Booked","No Reply":"No Reply","Lost":"Not a Fit","Not Applicable":"Not a Fit","Growth Plan Booking":"Sent to Podcast"};
const KB_OLD={"Audit booked":"Audit Booked","Audit held":"Audit Held","Proposal sent":"Proposal Sent","Follow-up call":"Follow-up","Won – Handover to Ops":"Won","Lost / No reply":"Lost","Lead in":"New","Potential":"New","To contact":"New","In conversation":"In Conversation","Follow-up":"In Conversation","Discovery call":"Audit Booked"};
const KB_TO_OLD={"Audit Booked":"Audit booked","Audit Held":"Audit held","Proposal Sent":"Proposal sent","Follow-up":"Follow-up call","Won":"Won – Handover to Ops","Onboarded":"Won – Handover to Ops","Lost":"Lost / No reply"};
const JADE_SRC={"🎙️ Podcast":"Podcast guest","🤝 Referral / direct":"Referrals","🎪 Events":"Events"};
function kbCl(r){const s=f=>sv(r[f]),src=s(CL.src);
  if(src==="Upwork"&&s(CL.uw))return KB_UW[s(CL.uw)]||"";
  if((src==="Upsell"||src==="Old client")&&s(CL.up))return KB_US[s(CL.up)]||"";
  if(src==="AI consulting"&&s(CL.ai))return KB_US[s(CL.ai)]||"";
  if(s(CL.pq))return KB_PQ[s(CL.pq)]||"";
  for(const [f,m] of [[CL.uw,KB_UW],[CL.up,KB_US],[CL.ai,KB_US],[CL.ref,KB_REF],[CL.so,KB_SIMPLE],[CL.ev,KB_SIMPLE],[CL.ep,KB_SIMPLE]])if(s(f))return m[s(f)]||"";
  return ""}
const clFrom=r=>{const src=sv(r[CL.src]);return src==="Upwork"?"Upwork (Danica)":(src==="Upsell"||src==="Old client")?"Upsells (Sarah)":src==="AI consulting"?"AI consulting (Sarah)":"Pre-qual (Gretta)"};
/* one row per person, in the Sales pipeline field ids the board already reads; _src says which table it saves back to */
function kbRows(){
  const out=[];
  (S.leads||[]).forEach(r=>{const st=sv(r[L.stage]);out.push({_id:r._id,_src:"jade",
    [SP.deal]:r[L.name]||"",[SP.co]:r[L.co]||"",[SP.what]:r[L.what]||"",[SP.stage]:sv(r[KBF.jade])||KB_JADE[st]||"",
    [SP.origin]:JADE_SRC[sv(r[L.source])]||stdO(sv(r[L.source]))||"Other",[SP.owner]:sv(r[L.owner]),[SP.needed]:r[L.needed]||"",[SP.notes]:r[L.latest]||"",
    [SP.value]:r[L.value]||0,[SP.est]:!!r[L.est],[SP.chase]:r[L.chase]||"",[SP.lastc]:r[L.lastC]||"",[SP.leadin]:r[L.leadIn]||"",
    [SP.services]:(r[L.services]||[]).map(sv),[SP.offer]:sv(r[L.likely])||"Not sure yet",[SP.contacts]:ids(r[L.contacts]),[SP.jade]:[r._id],[SP.from]:"Podcast Leads (Jade)"})});
  (S.cl||[]).forEach(r=>{const ct=idFromUrl(r[CL.contact]);out.push({_id:r._id,_src:"cl",
    [SP.deal]:String(r[CL.name]||"").trim(),[SP.co]:r[CL.co]||"",[SP.what]:r[CL.want]||"",[SP.stage]:sv(r[KBF.cl])||kbCl(r),
    [SP.origin]:stdO(sv(r[CL.pqo]))||stdO(sv(r[CL.src]))||"Other",[SP.owner]:ownerN(sv(r[CL.owner])),[SP.needed]:r[CL_NEED]||"",[SP.notes]:r[CL.notes]||"",
    [SP.value]:r[CL.val]||0,[SP.est]:!!r[CL.est],[SP.chase]:r[CL.chase]||"",[SP.lastc]:r[CL.lastc]||"",[SP.leadin]:r[CL.leadin]||"",
    [SP.services]:(r[CL.services]||[]).map(sv),[SP.offer]:"",[SP.contacts]:ct?[ct]:[],[SP.from]:clFrom(r)})});
  /* Kash's own leads: Sales pipeline rows that did not come from a team board */
  (S.spRaw||[]).forEach(r=>{if(ids(r[SP.jade]).length||String(r[SP.rv]||"").trim())return;
    out.push(Object.assign({},r,{_src:"sp",[SP.stage]:sv(r[KBF.sp])||KB_OLD[sv(r[SP.stage])]||""}))});
  return out;
}
/* a save on Kash's board goes to the person's own record: the board's field ids are swapped for that table's */
const KB_WRITE={jade:{base:CB,tbl:T.leads,f:{[SP.stage]:KBF.jade,[SP.needed]:L.needed,[SP.notes]:L.latest,[SP.value]:L.value,[SP.est]:L.est,[SP.chase]:L.chase,[SP.lastc]:L.lastC,[SP.services]:L.services,[SP.offer]:L.likely}},
  cl:{base:RB,tbl:T.cl,f:{[SP.stage]:KBF.cl,[SP.needed]:CL_NEED,[SP.notes]:CL.notes,[SP.value]:CL.val,[SP.est]:CL.est,[SP.chase]:CL.chase,[SP.lastc]:CL.lastc,[SP.services]:CL.services}}};
function kbWrite(r,fields){
  const src=r._src||"sp";
  if(src==="sp"){const f=Object.assign({},fields);if(SP.stage in f){f[KBF.sp]=f[SP.stage]||null;f[SP.stage]=KB_TO_OLD[f[SP.stage]]||null}return {base:CB,tbl:T.sp,fields:f}}
  const m=KB_WRITE[src];if(!m)return null;const f={};Object.keys(fields).forEach(k=>{if(m.f[k])f[m.f[k]]=fields[k]});
  return Object.keys(f).length?{base:m.base,tbl:m.tbl,fields:f}:null;
}
function derive(){
  const J=SALES_ONLY?[]:deriveJ(),K=SALES_ONLY?[]:deriveCL(),P=SALES_ONLY?deriveSP().filter(p=>SALES_SET.has(p.stage)):deriveSP();
  const spOf={};P.forEach(p=>{if(p.jadeId)spOf[p.jadeId]=spOf[p.jadeId]||p;if(p.rvId&&!p.rvUl)spOf[p.rvId]=spOf[p.rvId]||p});
  return {J,K,P,spOf,all:J.concat(K,P)};
}
/* Podcast Guests (ReLearn Operating System), read only; "Handled by" links to Team */
function deriveG(){
  const tn={};S.guestTeam.forEach(t=>{tn[t._id]=String(sv(t[TM.name])||"").trim()});
  return S.guests.filter(r=>String(sv(r[G.name])||"").trim()).map(r=>{
    const st=sv(r[G.stage]);const stage=st&&st!=="Status"?st:"";
    const by=(Array.isArray(r[G.by])?r[G.by]:[]).map(x=>typeof x==="object"?(tn[x.id]||x.name||""):(tn[x]||"")).filter(Boolean);
    return {kind:"guest",id:r._id,r,name:String(sv(r[G.name])).trim(),stage,by,last:r[G.last]||"",next:r[G.next]||""};
  });
}
const gActive=g=>!!g.stage&&g.stage!=="29 – Not interested";
/* v5.3 (Karen, 5 Nov): "in progress" = talking to them, from In conversation to Recording booked (the rail count; 1,000+ researched/outreach rows are not open leads) */
const gProg=g=>/^(20|30|40|50)\s*[–-]/.test(String(g.stage||""));
/* the Pipelines table row for a board (Health is set by hand there; nothing here works it out) */
const plOf=key=>S.pipelines.find(r=>sv(r[PL.key])===key)||null;
const HEALTH_TONE={"On track":"s5","Slowing":"s2","Stuck":"lost"};
/* where a Pre-qual (or handed-over) deal sits on its team board right now, read live */
function liveOf(p,D){
  if(p.jadeId){const l=D.J.find(x=>x.id===p.jadeId);if(l)return {who:"Jade",where:BK.jade.title,stage:l.stage,item:l}}
  if(p.rvId&&!p.rvUl){const c=D.K.find(x=>x.id===p.rvId);if(c)return {who:c.owner||(c.board?c.board.defOwner:""),where:c.board?c.board.title:"Company Leads",stage:stL(c.stage)||"No stage yet",item:c}}
  if(p.rvId&&p.rvUl){const u=S.ul.find(x=>x._id===p.rvId);if(u)return {who:"Sarah",where:"Sarah's upsell list",stage:[sv(u[UL.stage]),sv(u[UL.action])].filter(Boolean).join(" · ")||"On the list",item:null}}
  return null;
}
function boardItems(b,D){return b.kind==="jade"?D.J:b.kind==="sp"?D.P:D.K.filter(c=>c.boards.includes(b))}
function stageOf(b,it){return b.kind==="cl"?sv(it.r[b.field]):it.stage}
/* v5.2 one place per person: a board's count = people still being worked on there. Handed on (Sent to Sales / Sent to Podcast /
   Email sequence), parked or closed columns don't count; on Podcast Leads, leads whose deal is past Pre-qual sit in "Sent to Sales" */
const COUNT_OUT=new Set(["Sales Pipeline","Podcast Pipeline","Email sequence","No Reply","Archive","Won","Lost","Not Applicable","70 – Won","79 – Lost"]);
const sentJ=(l,D)=>{const p=D.spOf[l.id];return !!p&&!p.pre};
const activeCount=(b,D)=>boardItems(b,D).filter(i=>!COUNT_OUT.has(stageOf(b,i))&&!(b.kind==="jade"&&sentJ(i,D))).length;
/* Sales Pipeline count: open deals Kash's side is working (Pre-qual is still with the teams) */
const spOpen=D=>D.P.filter(p=>p.plate);
const RULE_NOTE="Each person is worked on one board. When a team hands someone on, they show under Sent to Sales on the team board and as a deal on the Sales Pipeline.";
/* traffic light for a column title: red = someone overdue, amber = due today, green = moving, grey = empty or a closing stage */
/* columns: colour follows the stage sequence (dark grey → amber → green; won green, lost red, parked pale grey) */
const LOST_ST=new Set(["79 – Lost","Lost","Lost / No reply","Offer declined (Rejected)","No response (Rejected)"]);
const WON_ST=new Set(["70 – Won","Won","Onboarded","Won – Handover to Ops","Closed","Handover to Ops","Offer accepted (Closed)","Sales Pipeline","Growth Plan Booking","Email sequence","Podcast Pipeline"]);
const OUT_ST=new Set(["No reply","No Reply","Not Applicable","Archive","80 – Re-approach (60–90 days)"]);
/* boards whose colours are set by hand rather than by position */
const TONE_MAP={
  "jade-sent":{"Sent to Sales":"won"},
  prequal:{"New":"s0","First Outreach":"s1","Pre-qual":"s2","In Conversation":"s3","Follow-up":"s4","Email sequence":"won","Podcast Pipeline":"won","Sales Pipeline":"won","No Reply":"out","Archive":"out"},
  "prequal-o":{},
  "sp-src":{},
  "sp-date":{overdue:"lost",today:"s2",week:"s5",later:"s0",none:"out"},
  guests:{"0 – Researched":"s0","10 – Outreach sent":"s1","19 – No reply":"out","20 – In conversation":"s2","28 - Later Trip":"out","28 – Not now":"out","28 – Not now (try a later trip)":"out","29 – Not interested":"lost","30 – Intro call booked":"s3","40 – Intro call done":"s4","50 – Recording booked":"s5","60 – Episode released (stay in touch)":"won","":"out"}
};
function stageTone(stages,st){
  if(LOST_ST.has(st))return"lost";if(WON_ST.has(st))return"won";if(OUT_ST.has(st))return"out";
  const open=stages.filter(x=>!LOST_ST.has(x)&&!WON_ST.has(x)&&!OUT_ST.has(x));const i=open.indexOf(st);
  return !st||i<0?"s0":"s"+(open.length<2?0:Math.round(i*5/(open.length-1)));
}
/* what each column means, in two short lines (board-specific first) */
const STAGE_INFO={
  "sp|Audit Booked":"Call with Kash booked.","sp|Audit Held":"Audit done, proposal to write.","sp|Proposal Sent":"Proposal with the client.","sp|Follow-up":"Following up on the proposal: a call or a message.","sp|Won":"Signed.","sp|Onboarded":"Handed over to Ops and started.","sp|Lost":"Said no or went quiet.",
  "sp|Pre-qual":"With the teams. Nothing needed from you yet.","sp|Lead in":"New, not contacted yet.","sp|In conversation":"Talking, before an audit is booked.","sp|Audit booked":"Growth audit / discovery call in the diary.","sp|Audit held":"Audit done, proposal to write.","sp|Proposal sent":"Proposal with the client.","sp|Follow-up call":"Call booked to go through the proposal.","sp|Won – Handover to Ops":"Signed. Ops takes over.","sp|Lost / No reply":"Said no or went quiet.",
  "10 – Lead in":"New guest or lead. Jade qualifies them for a growth audit.","20 – Audit booked":"Growth audit booked with Kash.","30 – Audit held":"Audit done. Growth plan to write.","40 – Growth plan sent":"Plan sent. Waiting for their response.","50 – Follow-up call":"Call to go through the plan and next steps.","60 – Proposal":"Proposal sent. Chase for a decision.","70 – Won":"Signed. Hand over to production.","79 – Lost":"Said no, or not a fit.","80 – Re-approach (60–90 days)":"Not now. Try again in 60–90 days.",
  "prequal|New":"Just came in. Not contacted yet.","prequal|First Outreach":"First message sent. Waiting for a reply.","prequal|Pre-qual":"Replied. Checking fit and route.","prequal|In Conversation":"Qualified and talking.","prequal|Follow-up":"Not replying. Chasing.","prequal|Email sequence":"Moved to an email sequence.","prequal|Podcast Pipeline":"Handed to Jade as a potential podcast guest.","prequal|Sales Pipeline":"Handed to Kash's Sales Pipeline.","upwork|Sales Pipeline":"Handed to the Sales Pipeline.","upsell|Sales Pipeline":"Handed to the Sales Pipeline.","jade-sent|Sent to Sales":"Has a deal on the Sales Pipeline. Kash has it from here.","prequal|No Reply":"No answer after follow-ups.","prequal|Archive":"Closed or not a fit.",
  "New":"New lead. Not qualified yet.","upwork|New":"New Upwork job or invite. Not applied yet.","upsell|New":"Client flagged as ready for more.",
  "Sales Pipeline":"Handed to Kash: now on his sales pipeline.","Build Proposal":"Proposal being prepared.","Send Proposal":"Proposal ready. Send it.","Proposal Sent":"Sent. Waiting for their answer.","upwork|Proposal Sent":"Proposal sent on Upwork. Waiting for a reply.",
  "No Reply":"Didn't answer after follow-ups.","Won":"Signed.","Lost":"Said no.","Not Applicable":"Not a sales lead: spam, fan or peer.","Archive":"Parked for now.","":"No stage set yet. Pick one.",
  "prequal-o|":"No Pre-qual origin set yet.","sp-src|":"No origin set on these deals yet. Set it in the deal window.","guests|":"No status set in Airtable yet.",
  "sp-date|overdue":"Chase date has passed.","sp-date|today":"Chase them today.","sp-date|week":"Chase in the next 7 days.","sp-date|later":"Chase date more than a week away.","sp-date|none":"No chase date set yet."};
const stageInfo=(bk,st)=>STAGE_INFO[bk+"|"+st]??STAGE_INFO[st]??"";
/* folded columns, remembered per viewer; Pre-qual starts folded */
const COLS_KEY="slCols";
S.cols=Object.assign({sp:["Pre-qual"]},(()=>{try{const v=JSON.parse(localStorage.getItem(COLS_KEY)||"null");return v&&typeof v==="object"?v:{}}catch(e){return {}}})());
const isFolded=(bk,st)=>(S.cols[bk]||[]).includes(st);
function toggleFold(bk,st){const a=S.cols[bk]||[];S.cols[bk]=a.includes(st)?a.filter(x=>x!==st):a.concat([st]);try{localStorage.setItem(COLS_KEY,JSON.stringify(S.cols))}catch(e){}}
function colH(bk,stages,st,n,inner,add,extra,label,ic){
  const tm=TONE_MAP[bk];const tone=tm?(tm[st]||"s1"):stageTone(stages,st),lab=label||stL(st)||"No stage yet",tip=stageInfo(bk,st),info=bk==="prequal-o"||bk==="guests"||bk==="sp-src"||(SALES_ONLY&&bk==="sp")?"":tip,d=`data-board="${esc(bk)}" data-stage="${esc(st)}"`;
  const mark=ic||'<i class="sl-dot"></i>';
  if(isFolded(bk,st))return `<div class="sl-col sl-colc stx st-${tone}" ${d}><button type="button" class="sl-cexp" data-act="fold" ${d} aria-expanded="false" aria-label="Show ${esc(lab)}, ${n} ${n===1?"card":"cards"}" title="${esc(tip)}">${mark}<small>${n}</small><span class="v">${esc(lab)}</span></button></div>`;
  return `<div class="sl-col" ${d}><div class="sl-colh stx st-${tone}"><div class="t"><span${tip&&!info?` title="${esc(tip)}"`:""}>${mark}${esc(lab)}</span><span class="r"><small>${n}</small><button type="button" class="sl-ccol" data-act="fold" ${d} aria-expanded="true" aria-label="Fold ${esc(lab)}" title="Fold this column">${svg(CHEV,15)}</button></span></div>${info?`<p class="sl-cinfo">${esc(info)}</p>`:""}${extra||""}</div>${inner}${add}</div>`;
}
/* the row under the stats: the name search (moved in by render) and the view's own controls */
const toolsH=x=>`<div class="sl-tools" id="slTools">${x||""}</div>`;
const SRC_FOOT="Each card shows its stage. Fold any column with its arrow.";
const FOLD_FOOT="Columns run from grey (early) through amber to green (won or handed on); red means lost. Fold any column with its arrow.";
/* everyone: one entry per Contact, with every record linked to it; records without a Contact yet stand on their own */
function peopleOf(D){
  const by={};S.contacts.forEach(c=>{by[c._id]={id:c._id,ct:c,name:String(c[CT.name]||"(no name)").trim(),co:c[CT.co]||"",what:c[CT.what]||"",origin:stdO(c[CT.src]),src:stdO(c[CT.src]),items:[],convs:[]}});
  const byRv={};S.contacts.forEach(c=>{const x=idFromUrl(c[CT.rvurl]);if(x)byRv[x]=c._id});
  const loose=[];const leadP={};
  D.J.forEach(l=>{const cid=ids(l.r[L.contacts]).find(x=>by[x]);if(cid){by[cid].items.push(l);leadP[l.id]=by[cid]}else loose.push(l)});
  D.K.filter(k=>k.board).forEach(k=>{const cid=[idFromUrl(k.r[CL.contact]),byRv[k.id]].find(x=>x&&by[x]);cid?by[cid].items.push(k):loose.push(k)});
  D.P.forEach(p=>{const cs=p.contactIds.filter(x=>by[x]);cs.length?cs.forEach(x=>by[x].items.push(p)):loose.push(p);if(p.jadeId&&cs.length&&!leadP[p.jadeId])leadP[p.jadeId]=by[cs[0]]});
  const out=Object.values(by).concat(loose.map(it=>{const p={id:"i:"+it.id,ct:null,name:it.name,co:it.co,what:"",origin:it.origin,items:[it],convs:[]};if(it.kind==="jade")leadP[it.id]=p;if(it.kind==="sp"&&it.jadeId&&!leadP[it.jadeId])leadP[it.jadeId]=p;return p}));
  S.conv.forEach(c=>{const ps=new Set();ids(c[C.contact]).forEach(x=>by[x]&&ps.add(by[x]));ids(c[C.lead]).forEach(x=>leadP[x]&&ps.add(leadP[x]));ps.forEach(p=>p.convs.push(c))});
  out.forEach(p=>{p.convs.sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||"")));
    if(!p.origin)p.origin=(p.items[0]&&p.items[0].origin)||"Other";if(!p.co)p.co=(p.items.find(i=>i.co)||{}).co||"";
    p.items.sort((a,b)=>(a.kind==="sp"?0:1)-(b.kind==="sp"?0:1));
    p.lastC=[...p.items.map(i=>i.lastC||""),...p.convs.map(c=>c[C.date]||"")].sort().pop()||""});
  return out.sort((a,b)=>String(b.lastC).localeCompare(String(a.lastC))||a.name.localeCompare(b.name));
}
const whereOf=it=>it.kind==="sp"?"Sales Pipeline":it.board?it.board.title:"Company Leads";
const spChip=(it,D)=>{const p=D.spOf[it.id];return p&&!p.pre?`<span class="sl-kchip" title="On Kash's Sales Pipeline">With Kash: ${esc(stL(p.stage))}</span>`:""};

/* ---------- rendering ---------- */
function valRow(it){const ro=S.ro?" readonly":"";return `<div class="sl-vrow"><div class="sl-lbl"><label for="slV-${it.id}">Deal value / month</label>${it.est&&it.value?'<span class="sl-est">Estimate</span>':""}</div><input id="slV-${it.id}" type="text" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" data-act="value" value="${esc(full(it.value))}"${ro}></div>`}
/* a deal on his plate (by-date view): what's needed from him, chase, value */
/* v5.3 (Karen, 5 Nov): one person with several offers (e.g. "Vishen Lakhiani · Content" and "· Podcast growth") is one deal per offer, not a duplicate */
/* v5.6: the " · " may have any spacing round it ("Lumen ·Design"), and spacing inside the person's name does not matter ("vishen  lakhiani") */
const OFF_SEP=/\s*·\s*/;
const offPerson=s=>String(s||"").split(OFF_SEP)[0].replace(/\s+/g," ").trim();
const offKey=s=>offPerson(s).toLowerCase();
/* v5.5 (Karen, 5 Nov): the offer is the part of the deal name after " · " (the whole name when there is none); the person is the part before */
const offName=s=>{const t=String(s||"").trim();const m=t.match(OFF_SEP);return !m?t:(t.slice(m.index+m[0].length).trim()||t)};
/* v6 (Karen, 6 Nov): the deal window is about a PERSON; each of their Sales Pipeline deals is one OFFER, shown as one tab.
   A person = the deals (not Pre-qual) that share the part of the name before " · " OR share a linked contact (followed through, so
   A–B by name and B–C by contact are one person). Pre-qual deals are still with the teams: they are their own single tab.
   Tabs keep the order the deals have in Airtable (a new offer is added last), so a tab never jumps when its stage changes. */
function personGroup(p,P){
  if(p.pre||SALES_ONLY)return [p];
  const g=new Map([[p.id,p]]);let grew=true;
  while(grew){grew=false;const ks=new Set([...g.values()].map(x=>offKey(x.name)).filter(Boolean)),cs=new Set([...g.values()].flatMap(x=>x.contactIds));
    P.forEach(x=>{if(x.pre||g.has(x.id))return;if(ks.has(offKey(x.name))||x.contactIds.some(c=>cs.has(c))){g.set(x.id,x);grew=true}})}
  const o={};S.sp.forEach((r,i)=>{o[r._id]=i});return [...g.values()].sort((a,b)=>(o[a.id]??1e9)-(o[b.id]??1e9));
}
const stIdx=st=>{const i=SP_STAGES.indexOf(st);return i<0?99:i};
const offSort=g=>g.slice().sort((a,b)=>stIdx(a.stage)-stIdx(b.stage)||offName(a.name).localeCompare(offName(b.name)));
/* the person's name as most of their deals spell it (so "vishen  lakhiani · Ads" still says "Vishen Lakhiani") */
const offWho=g=>{const n={};g.forEach(x=>{const w=offPerson(x.name);if(w)n[w]=(n[w]||0)+1});const k=Object.keys(n);return k.length?k.reduce((a,b)=>n[b]>n[a]?b:a):""};
/* an offer's tab name: its Services joined with " + "; else the part of the deal name after " · "; else "" (the tab then reads "Select offer") */
const offLabel=x=>{if((x.services||[]).length)return x.services.join(" + ");const t=String(x.name||"");const m=t.match(OFF_SEP);return m?t.slice(m.index+m[0].length).trim():""};
const isOpenOffer=x=>x.stage!==SP_WON&&x.stage!==SP_LOST;
/* the person as the window names them: their linked contact's name (the real person, e.g. "Daniel Carmody" for
   "Lee Harris Energy (Daniel Carmody)"), else the name their deals share. New deal names still use the deals' own spelling (offWho). */
const personName=g=>{for(const x of g)for(const id of x.contactIds){const c=S.contacts.find(r=>r._id===id);const n=c&&String(sv(c[CT.name])||"").trim();if(n)return n}return offWho(g)};
/* a deal's stage as a chip in its stage colour */
const stcH=st=>`<span class="sl-stc stx st-${stageTone(SP_STAGES,st)}"><i class="sl-dot"></i>${esc(stL(st)||"No stage yet")}</span>`;
/* one deal in an offers list (deal window) or a Deals list (contact window); the deal whose window is open is "This one" and not a button */
function offRowH(x,cur){
  const meta=[otagH(x.origin),x.owner?`<span>Owner: ${esc(x.owner)}</span>`:"",x.from?`<span>From ${esc(x.from)}</span>`:"",x.lastC?`<span>Last contact ${esc(short(x.lastC))}</span>`:""].filter(Boolean).join("");
  const val=x.value?`<span class="sl-ofv">${esc(full(x.value))}/mo${x.est?' <span class="sl-est">Est.</span>':""}</span>`:"";
  const inner=`<span class="sl-oft"><b>${esc(offLabel(x)||offName(x.name))}</b>${stcH(x.stage)}</span><span class="sl-ofr">${val}${cur?'<span class="sl-ofme">This one</span>':`<span class="sl-ofa">${svg(ARROW_I,15)}</span>`}</span><span class="sl-ofm">${meta}</span>`;
  const pre=x.pre?" data-pre":"";
  return cur?`<div class="sl-of cur" aria-current="true"${pre}>${inner}</div>`:`<button type="button" class="sl-of" data-act="opensp" data-id="${esc(x.id)}"${pre}${x.needed&&!x.pre?` title="${esc("Needed from you: "+x.needed)}"`:""}>${inner}</button>`;
}
const OFF_NOTE="Each offer is its own deal, so it can move through the stages on its own.";
const PRE_NOTE="Pre-qual deals are still with the teams and are not counted as offers yet.";
function spCardH(p,D){
  const ro=S.ro?" readonly":"";
  return `<article class="sl-card ${p.done?"done":p.due}" data-id="${p.id}" data-kind="sp">
  <div class="sl-ch"><input type="checkbox" data-act="done" ${p.done?"checked":""}${S.ro?" disabled":""} aria-label="${p.done?"Untick":"Mark"} ${esc(p.name)} as contacted">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp">${esc(p.name)}</button><div class="sl-co">${esc([p.co,stL(p.stage)].filter(Boolean).join(" · "))}</div></div>
    <button type="button" class="sl-exp" data-act="opensp" aria-label="Open details for ${esc(p.name)}">${svg(EXP)}</button></div>
  <div class="sl-cm"><span class="sl-tags">${otagH(p.origin)}${tagH(p.offer)}${svcTagsH(p.services)}</span><span class="sl-due ${p.done?"":p.due}">${p.done?"Contacted today":esc(p.dueL)}</span></div>
  <div class="sl-box">
    <div><div class="sl-lbl"><label for="slN-${p.id}">What's needed from you</label><span>${p.lastC?"Last contact "+esc(short(p.lastC)):""}</span></div><textarea id="slN-${p.id}" rows="1" data-act="needed" placeholder="What do you need to do?"${ro}>${esc(p.needed)}</textarea></div>
    ${valRow(p)}
  </div></article>`;
}
function spKcardH(p,D,showOwner,bySrc,byDate){
  if(p.pre){const lv=liveOf(p,D);
    return `<article class="sl-card sl-kc sl-pq" data-id="${p.id}" data-kind="sp" draggable="${S.ro?"false":"true"}">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp" style="font-size:14px">${esc(p.name)}</button>${p.co?`<div class="sl-co" style="font-size:12.5px">${esc(p.co)}</div>`:""}</div>
    <div class="sl-cm"><span class="sl-tags">${otagH(p.origin)}</span></div>
    <p class="sl-with">${lv?`With ${esc(lv.who||"the team")} · ${esc(lv.where)} · <b>${esc(lv.stage)}</b>`:`With ${esc(p.owner||"the team")}`}</p></article>`}
  return `<article class="sl-card sl-kc ${p.done?"done":p.due}${bySrc&&p.closed?" sl-closed":""}" data-id="${p.id}" data-kind="sp" draggable="${S.ro||byDate?"false":"true"}">
  <div class="sl-ch"><label class="sl-cbx"><input type="checkbox" data-act="done" ${p.done?"checked":""}${S.ro?" disabled":""} aria-label="${p.done?"Untick":"Mark"} ${esc(p.name)} as contacted" style="width:18px;height:18px"></label>
    <div class="sl-cn"><button type="button" class="sl-name" data-act="opensp" style="font-size:14px">${esc(p.name)}</button>${(()=>{const sub=[p.co,showOwner&&p.owner?p.owner:""].filter(Boolean).join(" · ");return sub?`<div class="sl-co" style="font-size:12.5px">${esc(sub)}</div>`:""})()}</div></div>
  <div class="sl-cm"><span class="sl-tags">${bySrc||byDate?stcH(p.stage):otagH(p.origin)}${byDate?otagH(p.origin):""}${tagH(p.offer)}${svcTagsH(p.services)}</span><span class="sl-due ${p.done?"":p.due}">${p.done?"Contacted today":esc(p.dueL)}</span></div>
  <div class="sl-box"><div><span class="sl-cl"><b class="pm">Needed from you</b> ${esc(p.needed||"–")}</span></div>${p.value?`<div class="sl-kv"><b class="pm">Value</b><b>${esc(full(p.value))}/mo${p.est?' <span class="sl-est">Est.</span>':""}</b></div>`:""}</div>
  </article>`;
}
function kcardH(it,b,D,showStage,sent){
  if(it.kind==="sp")return spKcardH(it,D);
  const j=it.kind==="jade",open=j?"open":"openc";
  const nx=j?(it.r[L.next]||""):it.next;
  const about=j?["Last",it.lastConv?(it.lastConv[C.sum]||"")+" · "+agoL(it.lastC):"Nothing logged yet"]:it.want?["Wants",it.want]:it.notes?["Notes",lastNote(it.notes)]:null;
  const sub=[it.co,!j&&it.owner?it.owner:""].filter(Boolean).join(" · ");
  const when=(j||it.chase)?`<span class="sl-due ${it.done?"":it.due}">${it.done?"Contacted today":esc(it.dueL)}</span>`:`<span class="sl-due">${it.lastC?"Last contact "+esc(short(it.lastC)):"No chase date"}</span>`;
  const rows=(about?`<div><span class="sl-cl"><b class="pm">${about[0]}</b> ${esc(about[1])}</span></div>`:"")+(nx?`<div><span class="sl-cl"><b class="pm">Next</b> ${esc(nx)}</span></div>`:"")+(it.value?`<div class="sl-kv"><b class="pm">Value</b><b>${esc(full(it.value))}/mo${it.est?' <span class="sl-est">Est.</span>':""}</b></div>`:"");
  return `<article class="sl-card sl-kc ${it.done?"done":it.due}" data-id="${it.id}" data-kind="${it.kind}" draggable="${S.ro||sent?"false":"true"}">
  <div class="sl-ch">${j&&!sent?`<label class="sl-cbx"><input type="checkbox" data-act="done" ${it.done?"checked":""}${S.ro?" disabled":""} aria-label="${it.done?"Untick":"Mark"} ${esc(it.name)} as contacted" style="width:18px;height:18px"></label>`:""}
    <div class="sl-cn"><button type="button" class="sl-name" data-act="${open}" style="font-size:14px">${esc(it.name)}</button>${sub?`<div class="sl-co" style="font-size:12.5px">${esc(sub)}</div>`:""}</div></div>
  <div class="sl-cm"><span class="sl-tags">${showStage?`<span class="sl-chip-s"${sent?' title="Stage on Jade\'s board"':""}>${esc(stL(stageOf(b,it))||"No stage yet")}</span>`:(b&&b.key==="prequal"&&it.pqo?`<span class="sl-chip-s">${esc(it.pqo)}</span>`:otagH(it.origin))}${j?tagH(it.offer):""}${svcTagsH(it.services)}${spChip(it,D)}</span>${when}</div>
  ${rows?`<div class="sl-box">${rows}</div>`:""}
  </article>`;
}
function inlineAdd(o){
  if(S.ro)return "";
  const key=[o.ctx,o.board||"",o.stage||"",o.chase||""].join("|");
  if(S.inAdd!==key)return `<button type="button" class="sl-inadd" data-act="inadd" data-ikey="${esc(key)}">${svg(PLUS,14)}Add a lead</button>`;
  return `<div class="sl-inform"><label class="vh" for="slIn">Name of the new lead</label><input id="slIn" placeholder="Name" autocomplete="off">
    ${o.board==="sp"?`<label class="vh" for="slInO">Origin</label>${pkH({id:"slInO",k:"origin",v:"Network",opts:ORIGINS,name:"Origin",field:true})}`:""}
    <div class="sl-inbtn"><button type="button" class="sl-ghost" data-act="incancel">Cancel</button><button type="button" class="sl-solid" data-act="insave" data-ikey="${esc(key)}">Add</button></div></div>`;
}
/* v5 sidebar: My Board, then the Pipelines, then Leads. No automatic health dots: a neutral dot only */
const PEOPLE_I="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8";
const VIEWS=new Set(["mine","sales","jade","guests","prequal","upwork","upsell","contacts"]);
function rail(D,plate){
  const item=(k,t,n,icon)=>`<button type="button" class="sl-ri" data-act="view" data-v="${esc(k)}" aria-current="${S.view===k?"page":"false"}">${icon?svg(icon,15):`<i class="sl-dot" style="background:var(--grey-line)"></i>`}<span>${esc(t)}</span>${n!=null?`<small>${n}</small>`:""}</button>`;
  const bi=k=>item(k,BK[k].title,activeCount(BK[k],D));
  const openDeals=spOpen(D).length;
  return `<nav class="sl-rail" aria-label="Sales sections">${item("mine","My Board",plate.length,"M3 3v18h18M7 15l4-4 3 3 5-6")}<div class="sl-rl">Pipelines</div>${item("sales","Sales Pipeline",openDeals)}${bi("jade")}${item("guests","Podcast Guests",S.noG?null:deriveG().filter(gProg).length)}${bi("prequal")}${bi("upwork")}${bi("upsell")}<div class="sl-rl sl-rsep" aria-hidden="true"></div>${item("contacts","Leads",S.contacts.length,PEOPLE_I)}</nav>`;
}
const kpiH=(lab,val,col)=>`<div class="sl-kpi"><span>${lab}</span><b style="color:${col||"var(--ink)"}">${val}</b></div>`;
/* the Sales pipeline columns, shared by My Board (his plate only) and the Sales Pipeline (every deal, every owner) */
function spColsH(D,stages,all){
  return stages.map(st=>{
    if(st==="Pre-qual"){const pq=D.P.filter(p=>p.pre);return colH("sp",SP_STAGES,st,pq.length,pqTileH(pq,D),"","")}
    const cs=D.P.filter(p=>p.stage===st).sort((a,c)=>(DUE_ORDER[a.due]-DUE_ORDER[c.due])||a.name.localeCompare(c.name));
    const inner=cs.map(p=>spKcardH(p,D,all)).join("")||'<div class="sl-empty">Nobody here</div>';
    /* "Add a lead" only on open stages (a new lead never starts as won or lost) */
    return colH("sp",SP_STAGES,st,cs.length,inner,PLATE.has(st)?inlineAdd({ctx:"p",board:"sp",stage:st}):"","")}).join("");
}
/* v6 (Karen, 6 Nov): My Board and the Sales Pipeline each have ONE "Group by: Date | Stage | Source" (it replaces My Board's
   "Pipeline / By date" and the separate "Stage / Source"); each view remembers its own choice. Default Stage on both (what Kash sees today). */
const GRP_KEY={sales:"slGrpSales",mine:"slGrpMine"};
const GRPS=["date","stage","source"];
S.grp={};Object.keys(GRP_KEY).forEach(k=>{let v="";try{v=localStorage.getItem(GRP_KEY[k])||""}catch(e){}S.grp[k]=GRPS.includes(v)?v:"stage"});
const grpOf=v=>GRPS.includes(S.grp[v])?S.grp[v]:"stage";
const grpSegH=v=>`<div class="sl-seg" role="group" aria-label="Group by"><span aria-hidden="true">Group by</span>${[["date","Date"],["stage","Stage"],["source","Source"]].map(([k,t])=>`<button type="button" data-act="spgroup" data-k="${v}" data-v="${k}" aria-pressed="${grpOf(v)===k}">${t}</button>`).join("")}</div>`;
/* grouped by chase date: Overdue, Today, This week, Later, No date */
const DATE_COLS=[["overdue","Overdue"],["today","Today"],["week","This week"],["later","Later"],["none","No date"]];
const dateKey=p=>p.chase?p.due:"none";
/* Sales Pipeline by date: the Pre-qual tile first, then the open deals by chase date (cards open the window; no drag here) */
function dateColsH(D,cards){
  const pq=D.P.filter(p=>p.pre);const pre=colH("sp",SP_STAGES,"Pre-qual",pq.length,pqTileH(pq,D),"","");
  const srt=(a,c)=>((a.done?1:0)-(c.done?1:0))||String(a.chase).localeCompare(String(c.chase))||a.name.localeCompare(c.name);
  return pre+DATE_COLS.map(([k,t])=>{const cs=cards.filter(p=>dateKey(p)===k).sort(srt);
    return colH("sp-date",DATE_COLS.map(x=>x[0]),k,cs.length,cs.map(p=>spKcardH(p,D,true,false,true)).join("")||'<div class="sl-empty">Nobody here</div>',"","",t)}).join("");
}
const DATE_FOOT="Grouped by chase date. Cards can't be dragged here: switch to Stage or Source to move them. Fold any column with its arrow.";
/* one column per standard origin that has a card (ORIGINS order, Other then No source last); each card shows its stage instead of its origin.
   Won and lost deals stay in, after the open ones and greyed. withPre: the Pre-qual tile first, exactly as when grouped by stage */
function srcColsH(D,cards,withPre,showOwner){
  const by={};cards.forEach(p=>{const o=stdO(p.r[SP.origin]);(by[o]=by[o]||[]).push(p)});
  const order=ORIGINS.filter(o=>by[o]).concat(by[""]?[""]:[]);
  const srt=(a,c)=>((a.closed?1:0)-(c.closed?1:0))||(DUE_ORDER[a.due]-DUE_ORDER[c.due])||a.name.localeCompare(c.name);
  const pre=withPre?(()=>{const pq=D.P.filter(p=>p.pre);return colH("sp",SP_STAGES,"Pre-qual",pq.length,pqTileH(pq,D),"","")})():"";
  const cols=order.map(o=>{const cs=by[o].slice().sort(srt);
    const inner=cs.map((p,i)=>(p.closed&&(i===0||!cs[i-1].closed)?'<p class="sl-csep">Won or lost</p>':"")+spKcardH(p,D,showOwner,true)).join("");
    /* Sales Pipeline: under the title, how many are open and how many won or lost (the column count is all of them); only when some are won or lost */
    const nc=cs.filter(x=>x.closed).length;const sub=withPre&&nc?`<p class="sl-cinfo">${cs.length-nc} open · ${nc} won or lost</p>`:"";
    return colH("sp-src",order,o,cs.length,inner,"",sub,o||"No source",o?oIconH(o,14,"sl-oic"):"")}).join("");
  return pre+cols||'<div class="sl-empty" style="flex:1">Nobody here</div>';
}
/* v5.2 one place per person: the Pre-qual column on the Sales Pipeline is one tile (the people themselves are on the team boards) */
function teamOfDeal(p,D){
  const lv=liveOf(p,D);if(lv&&lv.item)return lv.where;
  if(p.rvUl)return BK.upsell.title;
  const f=p.from;
  return /jade|podcast leads/i.test(f)?BK.jade.title:/gret+a|referral|pre-qual/i.test(f)?BK.prequal.title:/upwork/i.test(f)?BK.upwork.title:/upsell/i.test(f)?BK.upsell.title:"Other";
}
function pqTileH(pq,D){
  if(!pq.length)return '<div class="sl-empty">Nobody here</div>';
  const by={};pq.forEach(p=>{const t=teamOfDeal(p,D);by[t]=(by[t]||0)+1});
  const parts=Object.entries(by).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([t,n])=>`<span class="sl-pqi">${esc(t)} ${n}</span>`).join(" · ");
  return `<div class="sl-pqtile"><p class="sl-pqt"><b>${pq.length}</b> ${pq.length===1?"lead is":"leads are"} still with the teams (Pre-qual)</p><p class="sl-pqn">${parts}</p><button type="button" class="sl-ghost" data-act="view" data-v="prequal" aria-label="Open the Pre-qual Pipeline">Open Pre-qual</button></div>`;
}
/* MY BOARD: only what is on Kash's plate */
function spH(D){
  const plate=D.P.filter(p=>p.plate);
  const od=plate.filter(p=>p.due==="overdue"&&!p.done).length,td=plate.filter(p=>p.due==="today"&&!p.done).length;
  const val=plate.reduce((a,p)=>a+(p.value||0),0);
  const kpis=`<div class="sl-kpis">${kpiH("On your plate",plate.length)}${kpiH("Overdue",od,od?"var(--act)":"")}${kpiH("Due today",td,td?"var(--watch)":"")}${kpiH("Audits booked",plate.filter(p=>p.stage==="Audit booked").length)}${kpiH("On your plate / month",money(val))}</div>`;
  const grp=grpOf("mine"),bySrc=grp==="source";
  const head=`<div class="sl-ftop"><h2>My Board</h2></div><p class="sl-goal">${bySrc?"What needs you, grouped by where each deal came from.":grp==="date"?"What needs you, by chase date.":"What needs you, stage by stage."} Every deal, with every owner, is on the Sales Pipeline.</p>`;
  const tools=toolsH(grpSegH("mine"));
  const note=S.noSp?`<div class="sl-msg" style="margin-bottom:12px">The sales pipeline isn't in this link's data feed yet.</div>`:"";
  let body;
  if(grp==="date"){
    /* his plate as the By date view always showed it (cards with what's needed and the value), now with "No date" on its own */
    const sortC=(a,b)=>((a.done?1:0)-(b.done?1:0))||(DUE_ORDER[a.due]-DUE_ORDER[b.due])||String(a.chase).localeCompare(String(b.chase));
    const groups=[["overdue","Overdue",null,"lost"],["today","Today",TODAY,"s2"],["week","This week",plusDays(3),"s5"],["later","Later",null,"s0"],["none","No date","","out"]].map(([k,t,ch,tone])=>({t,k,tone,ls:plate.filter(p=>dateKey(p)===k).sort(sortC),add:ch===null?null:{ctx:"d",board:"sp",stage:SP_NEW,chase:ch}}));
    body=`<div class="sl-groups" data-group="date">${groups.map(g=>`<div data-due="${g.k}"><div class="sl-gh stx st-${g.tone}"><i class="sl-dot"></i><span>${esc(g.t)}</span><small>${g.ls.length}</small></div><div class="sl-gcards">${g.ls.length?g.ls.map(p=>spCardH(p,D)).join(""):'<div class="sl-empty">Nobody here</div>'}${g.add?inlineAdd(g.add):""}</div></div>`).join("")}</div>`;
  }else if(bySrc){
    body=`<div class="sl-board sl-spb" data-group="source">${srcColsH(D,plate,false,false)}</div><p class="sl-foot">${S.ro?"":"Drag a card to another source to change where the deal came from. "}${SRC_FOOT}</p>`;
  }else{
    body=`<div class="sl-board sl-spb">${spColsH(D,SP_STAGES.filter(s=>PLATE.has(s)),false)}</div><p class="sl-foot">${S.ro?"":"Drag a card to move it. "}${FOLD_FOOT}</p>`;
  }
  return head+note+kpis+glanceH(D)+tools+body;
}
/* SALES PIPELINE: every deal, every owner, every stage (Pre-qual folded by default, as on his board before) */
function salesH(D){
  const open=spOpen(D);
  if(SALES_ONLY){
    const n=st=>D.P.filter(p=>p.stage===st).length;
    const kpis=`<div class="sl-kpis">${kpiH("Open deals",open.length)}${kpiH("Audits booked",n("Audit Booked"))}${kpiH("Proposals out",n("Proposal Sent")+n("Follow-up"))}${kpiH("Won",n(SP_WON)+n("Onboarded"))}</div>`;
    const nt=S.noSp?`<div class="sl-msg" style="margin-bottom:12px">The sales pipeline isn't in this link's data feed yet.</div>`:"";
    /* Karen, 6 Nov: one title only ("Sales" above it is hidden), no status pill, owner line or explanations */
    return `<div class="sl-ftop sl-ftop1"><div class="sl-tt"><h2>Sales Pipeline</h2></div></div>${nt}${kpis}${toolsH()}
    <div class="sl-board sl-spb sl-full" style="grid-template-columns:${SALES_STAGES.map(st=>isFolded("sp",st)?"46px":"minmax(212px,340px)").join(" ")}">${spColsH(D,SALES_STAGES,true)}</div>`;
  }
  const kpis=`<div class="sl-kpis">${kpiH("Open deals",open.length)}${kpiH("Still with the teams",D.P.filter(p=>p.pre).length)}${kpiH("Audits booked",D.P.filter(p=>p.stage==="Audit booked").length)}${kpiH("Won",D.P.filter(p=>p.stage===SP_WON).length)}</div>`;
  const note=S.noSp?`<div class="sl-msg" style="margin-bottom:12px">The sales pipeline isn't in this link's data feed yet.</div>`:"";
  const grp=grpOf("sales"),bySrc=grp==="source";
  const goal=bySrc?"Every deal past Pre-qual, grouped by where it came from. Won and lost deals are included: they sit under each source's open deals, greyed. Pre-qual counts the leads the teams are still working on."
    :grp==="date"?"Every open deal, grouped by its chase date. Pre-qual counts the leads the teams are still working on; they are on the team boards."
    :"Every deal, every owner, every stage. Pre-qual counts the leads the teams are still working on; they are on the team boards.";
  const board=bySrc?`<div class="sl-board sl-spb" data-group="source">${srcColsH(D,D.P.filter(p=>!p.pre&&SP_STAGES.includes(p.stage)),true,true)}</div><p class="sl-foot">${S.ro?"":"Drag a card to another source to change where the deal came from. "}${SRC_FOOT}</p>`
    :grp==="date"?`<div class="sl-board sl-spb" data-group="date">${dateColsH(D,open)}</div><p class="sl-foot">${DATE_FOOT}</p>`
    :`<div class="sl-board sl-spb">${spColsH(D,SP_STAGES,true)}</div><p class="sl-foot">${S.ro?"":"Drag a card to move it. "}${FOLD_FOOT}</p>`;
  return `<div class="sl-ftop"><div class="sl-tt"><h2>Sales Pipeline</h2>${healthPill("sales")}</div><span class="pm">Owner: Kash · ReLearn · ${open.length} open ${open.length===1?"deal":"deals"}</span></div>
    <p class="sl-goal">${goal}</p><p class="sl-rule">${esc(RULE_NOTE)}</p>${note}${kpis}${toolsH(grpSegH("sales"))}
    ${board}`;
}
/* the health someone set by hand in the Pipelines table, shown next to a board's title */
function healthPill(key){const r=plOf(key);const h=r?sv(r[PL.health]):"";return h?`<span class="sl-hpill stx st-${HEALTH_TONE[h]||"s1"}"><i class="sl-dot"></i>${esc(h)}</span>`:""}
/* Leads: every contact, as a table */
function contactsH(D,people){
  const srcs=[...new Set(people.filter(p=>p.ct).map(p=>p.src||"No source"))].sort();
  return `<div class="sl-ftop"><h2>Leads</h2><span class="pm">Everyone we've been in touch with</span></div>${toolsH()}
   <div class="sl-pfil"><label class="vh" for="slCq">Filter leads</label><input id="slCq" type="search" placeholder="Filter by name, company or email…" value="${esc(S.cq)}" autocomplete="off">
   <label class="vh" for="slCo">Source</label>${pkH({id:"slCo",k:"filter",v:S.co,opts:[["","All sources"]].concat(srcs),name:"Source",field:true})}</div>
   <div id="slPl">${peopleRowsH(people)}</div>`;
}
const CT_CAP=200;
function peopleRowsH(people){
  const q=norm(S.cq);const ls=people.filter(p=>p.ct&&(!q||norm(p.name).includes(q)||norm(p.co).includes(q)||norm(p.ct[CT.email]).includes(q))&&(!S.co||(p.src||"No source")===S.co));
  if(!ls.length)return '<div class="sl-empty">Nobody matches. Use + to add someone new.</div>';
  const shown=S.ctAll?ls:ls.slice(0,CT_CAP);
  const rows=shown.map(p=>{const c=p.ct;const ig=sv(c[CT.ig]);
    return `<tr data-act="opent" data-id="${esc(p.id)}"><th scope="row"><button type="button" class="sl-plink" data-act="opent" data-id="${esc(p.id)}">${esc(p.name)}</button></th><td>${esc(p.co)}</td><td>${esc(p.src||"–")}</td><td class="sl-wb">${esc(sv(c[CT.email]))}</td><td class="sl-nw">${esc(sv(c[CT.phone]))}</td><td>${esc(sv(c[CT.loc]))}</td><td>${ig?"@"+esc(norm(ig)):""}</td>
      <td><span class="sl-tgs">${p.items.map(i=>`<span class="sl-chip-s${i.kind==="sp"&&!i.pre?" mine":""}">${esc(whereOf(i))} · ${esc(stL(i.stage)||"No stage yet")}</span>`).join("")||'<span class="pm">Not on a board</span>'}</span></td></tr>`}).join("");
  return `<p class="pm" style="margin:0 0 8px">${ls.length} ${ls.length===1?"lead":"leads"}${shown.length<ls.length?" · showing the "+shown.length+" most recently in touch":""}</p>
    <div class="sl-ht sl-ctw"><table class="sl-pt sl-ctab"><thead><tr><th scope="col">Name</th><th scope="col">Company</th><th scope="col">Source</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Location</th><th scope="col">Instagram</th><th scope="col">Boards they are on</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${shown.length<ls.length?`<button type="button" class="sl-inadd sl-more" data-act="ctall">Show all ${ls.length}</button>`:""}`;
}
/* My Board summary: the Pipelines table (Health set by hand) beside Leads by source */
function glanceH(D){
  const open=S.boxOpen!==false;
  const tog=`<button type="button" class="sl-ghost" data-act="boxtog" aria-expanded="${open}">${open?"Hide":"Show"}</button>`;
  if(!open)return `<section class="sl-panel sl-box2"><div class="sl-boxh"><h3>Pipelines at a glance · Leads by source</h3>${tog}</div></section>`;
  return `<div class="sl-glance sl-box2"><section class="sl-panel"><div class="sl-boxh"><h3>Pipelines at a glance</h3>${tog}</div>${pipesH()}</section><section class="sl-panel"><h3>Leads by source</h3>${srcPieH()}</section></div>`;
}
const tv=v=>Array.isArray(v)?v.map(sv).filter(Boolean).join(", "):sv(v);
const HEALTHS=["","On track","Slowing","Stuck"];
/* old board names that may still be in the Pipelines table, shown under their new names (display only; nothing is written) */
const PL_OLD=[[/Growth Audit Pipeline/gi,"Podcast Leads"],[/Podcast Guests Pipeline/gi,"Podcast Guests"]];
const plTxt=v=>PL_OLD.reduce((t,[re,n])=>t.replace(re,n),String(v||""));
function pipesH(){
  if(!S.pipelines.length)return `<p class="pm" style="margin:10px 0 0">${S.noPl?"The Pipelines table isn't in this link's data feed yet.":"No pipelines in the Pipelines table yet."}</p>`;
  const ord=r=>{const n=Number(sv(r[PL.order]));return isFinite(n)&&sv(r[PL.order])!==""?n:999};
  const rows=S.pipelines.slice().sort((a,b)=>ord(a)-ord(b)||String(sv(a[PL.name])).localeCompare(String(sv(b[PL.name])))).map(r=>{
    const key=sv(r[PL.key]);const v=VIEWS.has(key)&&key!=="mine"&&key!=="contacts"?key:"";const h=sv(r[PL.health]);const tone=HEALTH_TONE[h];
    const name=plTxt(sv(r[PL.name]))||"(no name)";const opts=HEALTHS.includes(h)?HEALTHS:HEALTHS.concat([h]);
    const nm=v?`<button type="button" class="sl-plink" data-act="view" data-v="${esc(v)}">${esc(name)}</button>`:`<b>${esc(name)}</b>`;
    const sel=`<label class="vh" for="slPh-${esc(r._id)}">Health of ${esc(name)}</label>${pkH({id:"slPh-"+r._id,k:"health",v:h,opts:opts.map(o=>[o,o||"–"]),name:"Health of "+name,act:"plhealth",dis:S.ro,cls:"sl-hsel",attrs:` data-id="${esc(r._id)}"`})}`;
    return `<tr><th scope="row">${nm}</th><td>${sel}</td><td>${esc(plTxt(tv(r[PL.who])))}</td><td>${esc(plTxt(tv(r[PL.fall])))}</td><td>${esc(plTxt(tv(r[PL.next])))}</td></tr>`}).join("");
  return `<div class="sl-ht"><table class="sl-pt"><thead><tr><th scope="col">Pipeline</th><th scope="col">Health</th><th scope="col">Who handles it?</th><th scope="col">Who falls in here?</th><th scope="col">Where do they go next?</th></tr></thead><tbody>${rows}</tbody></table></div><p class="sl-foot">Health is set by hand here and saved to the Pipelines table. Click a pipeline to open its board.</p>`;
}
/* Leads by source: one per contact, top 7 sources then Other; colours in a fixed order (light and dark steps in CSS) */
function srcPieH(){
  const by={};S.contacts.forEach(c=>{const s=stdO(c[CT.src])||"No source";by[s]=(by[s]||0)+1});
  let ent=Object.entries(by).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));const tot=S.contacts.length;
  if(!tot)return '<p class="pm" style="margin:10px 0 0">No contacts yet.</p>';
  if(ent.length>8){const keep=ent.filter(e=>e[0]!=="Other").slice(0,7);const ks=new Set(keep.map(e=>e[0]));ent=keep.concat([["Other",ent.filter(e=>!ks.has(e[0])).reduce((a,x)=>a+x[1],0)]])}
  let ci=0;const sl=ent.map(([k,n])=>({k,n,c:k==="No source"?"none":k==="Other"?"other":"c"+(++ci)}));
  const R=15.915,GAP=sl.length>1?0.6:0;let off=25;
  const arcs=sl.map(s=>{const len=s.n/tot*100;const a=`<circle class="sl-pie-${s.c}" cx="21" cy="21" r="${R}" fill="none" stroke-width="6" stroke-dasharray="${Math.max(len-GAP,0.01).toFixed(3)} ${(100-Math.max(len-GAP,0.01)).toFixed(3)}" stroke-dashoffset="${off.toFixed(3)}"><title>${esc(s.k)}: ${s.n} (${Math.round(s.n/tot*100)}%)</title></circle>`;off-=len;return a}).join("");
  return `<div class="sl-pie"><svg viewBox="0 0 42 42" width="150" height="150" role="img" aria-label="Leads by source, ${tot} contacts">${arcs}<text x="21" y="21" text-anchor="middle" dominant-baseline="central" class="sl-pie-t">${tot}</text></svg>
    <ul class="sl-leg">${sl.map(s=>`<li><i class="sl-pie-${s.c}" aria-hidden="true"></i><span>${esc(s.k)}</span><b>${s.n}</b></li>`).join("")}</ul></div>`;
}
function boardH(b,D){
  const items=boardItems(b,D);const pq=b.key==="prequal";const byO=pq&&S.pqGroup==="origin";const jd=b.kind==="jade";
  /* Podcast Leads: leads whose deal is past Pre-qual on the Sales Pipeline sit in a last, display-only "Sent to Sales" column */
  const sent=jd?items.filter(i=>sentJ(i,D)):[];const work=jd?items.filter(i=>!sentJ(i,D)):items;
  let cols;
  if(byO){
    /* grouped by Pre-qual origin (no drag here: moving between origins isn't a stage change) */
    /* only people still being worked on, so the columns add up to the header count (handed on / parked / closed: see Kanban) */
    const act=items.filter(i=>!COUNT_OUT.has(stageOf(b,i)));
    const extra=[...new Set(act.map(i=>i.pqo).filter(o=>o&&!PQ_ORIGINS.includes(o)))].sort();const groups=PQ_ORIGINS.concat(extra,[""]);
    cols=groups.map(o=>{const cs=act.filter(i=>(i.pqo||"")===o).sort((a,c)=>(DUE_ORDER[a.due]-DUE_ORDER[c.due])||a.name.localeCompare(c.name));
      return colH("prequal-o",groups,o,cs.length,cs.map(i=>kcardH(i,b,D,true)).join("")||'<div class="sl-empty">Nobody here</div>',"","",o||"No origin")}).join("");
  }else{
    const noStage=b.kind==="cl"?work.filter(i=>!sv(i.r[b.field])):[];
    cols=(noStage.length?[""]:[]).concat(b.stages).map(st=>{
      const cs=(st===""?noStage:work.filter(i=>stageOf(b,i)===st)).sort((a,c)=>(DUE_ORDER[a.due]-DUE_ORDER[c.due]));
      /* Pre-qual: new leads always start in New */
      return colH(b.key,b.stages,st,cs.length,cs.map(i=>kcardH(i,b,D)).join("")||'<div class="sl-empty">Nobody here</div>',st&&!COUNT_OUT.has(st)&&(!pq||st==="New")?inlineAdd({ctx:"b",board:b.key,stage:st}):"")}).join("");
    if(jd){const cs=sent.slice().sort((a,c)=>a.name.localeCompare(c.name));
      cols+=colH("jade-sent",["Sent to Sales"],"Sent to Sales",cs.length,cs.map(i=>kcardH(i,b,D,true,true)).join("")||'<div class="sl-empty">Nobody here</div>',"","")}
  }
  const where=b.kind==="cl"?" · Rise Voice":" · ReLearn";const n=activeCount(b,D);
  const seg=pq?`<div class="sl-seg" role="group" aria-label="Group by">${[["stage","Kanban"],["origin","By origin"]].map(([k,t])=>`<button type="button" data-act="pqgroup" data-v="${k}" aria-pressed="${S.pqGroup===k}">${t}</button>`).join("")}</div>`:"";
  return `<div class="sl-ftop"><div class="sl-tt"><h2>${esc(b.title)}</h2>${healthPill(b.key)}</div><span class="pm">Owner: ${esc(b.owner)}${where} · ${n} being worked on</span></div>
    <p class="sl-goal">${esc(b.blurb)}</p><p class="sl-rule">${esc(RULE_NOTE)}</p>${toolsH(seg)}
    <div class="sl-board">${cols}</div>
    <p class="sl-foot">${byO?"Grouped by Pre-qual origin: only people still being worked on. Switch to Kanban to see those handed on, parked or closed, and to move cards between stages. ":S.ro?"":"Drag a card to another column to move it. "}"With Kash: stage" shows where a handed-on lead sits on the Sales Pipeline. ${FOLD_FOOT}</p>`;
}
/* PODCAST GUESTS (ReLearn Operating System → Guests): view only */
function gcardH(g){
  return `<article class="sl-card sl-kc sl-gc" data-id="${esc(g.id)}" data-kind="guest" draggable="false">
    <div class="sl-cn"><button type="button" class="sl-name" data-act="openg" style="font-size:14px">${esc(g.name)}</button>${g.by.length?`<div class="sl-co" style="font-size:12.5px">${esc(g.by.join(", "))}</div>`:""}</div>
    <div class="sl-cm"><span class="sl-due">${g.last?"Last contacted "+esc(dshort(g.last)):"Not contacted yet"}</span></div>
    ${g.next?`<div class="sl-box"><div><span class="sl-cl"><b class="pm">Next</b> ${esc(g.next)}</span></div></div>`:""}</article>`;
}
const dshort=v=>{const s=sv(v);return /^\d{4}-\d{2}-\d{2}/.test(s)?short(s):s};
function guestsH(){
  const gs=deriveG();const known=new Set(GUEST_ST);
  const extra=[...new Set(gs.map(g=>g.stage).filter(s=>s&&!known.has(s)))].sort();const stages=GUEST_ST.concat(extra,[""]);
  const by={};gs.forEach(g=>(by[g.stage]=by[g.stage]||[]).push(g));
  const cols=stages.map(st=>{
    const cs=(by[st]||[]).sort((a,b)=>String(b.last).localeCompare(String(a.last))||a.name.localeCompare(b.name));
    const shown=S.gAll[st]?cs:cs.slice(0,GUEST_CAP);
    const inner=(shown.map(gcardH).join("")||'<div class="sl-empty">Nobody here</div>')+(cs.length>shown.length?`<button type="button" class="sl-inadd sl-more" data-act="gall" data-stage="${esc(st)}">Show all ${cs.length}</button>`:"");
    return colH("guests",stages,st,cs.length,inner,"","",st?gLabel(st):"No stage")}).join("");
  const note=S.gLoading?`<div class="sl-msg" style="margin-bottom:12px">Loading the podcast guests…</div>`:S.noG?`<div class="sl-msg" style="margin-bottom:12px">Couldn't load the podcast guests. Press Refresh to try again.</div>`:"";
  return `<div class="sl-ftop"><div class="sl-tt"><h2>Podcast Guests</h2>${healthPill("guests")}</div><span class="pm">View only · ReLearn Operating System</span></div>${S.gLoading||S.noG?"":`<p class="sl-goal"><b>${gs.filter(gProg).length}</b> in progress (In conversation to Recording booked) · ${gs.length.toLocaleString("en-GB")} guests in total, including researched and outreach sent.</p>`}
    <p class="sl-goal">Every guest from first research to a released episode. Click a guest to see their details. Changes are made in Airtable for now.</p>${note}${toolsH()}
    <div class="sl-board">${cols}</div>
    <p class="sl-foot">Long columns show the ${GUEST_CAP} most recently contacted first; press "Show all" for the rest. ${FOLD_FOOT}</p>`;
}
/* v6 (Karen, 6 Nov): the windows' long blocks (What's needed, notes, conversations…) are collapsible sections: bold title, icon,
   a count badge (dark with a number, outlined 0 when empty), chevron. All start folded; each kind remembers open / closed for the
   session, so a section Kash opens stays open as he moves between deals and tabs. */
const SEC_I={need:"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",notes:"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",conv:"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",next:"M5 12h14M13 6l6 6-6 6",want:"M3 21c3 0 7-1 7-8V5H3v7h4c0 3-2 4-4 4M14 21c3 0 7-1 7-8V5h-7v7h4c0 3-2 4-4 4"};
S.sec={};
/* o: {key, icon, title, count, meta, body, cls} */
function secH(o){const open=!!S.sec[o.key],id="slSec-"+o.key,n=o.count||0;
  return `<section class="sl-sec sl-sec-${o.icon}${o.cls?" "+o.cls:""}" data-sec="${esc(o.key)}"><h3 class="sl-sech"><button type="button" class="sl-sect" id="${id}-h" data-act="sectog" data-sec="${esc(o.key)}" aria-expanded="${open}" aria-controls="${id}"><span class="ic">${svg(SEC_I[o.icon]||SEC_I.notes,18)}</span><span class="tt">${esc(o.title)}</span><span class="sl-cnt${n?"":" zero"}" data-cnt>${n}</span>${o.meta?`<span class="meta">${esc(o.meta)}</span>`:""}<span class="chev">${svg(CARET,16)}</span></button></h3><div class="sl-secb" id="${id}" role="region" aria-labelledby="${id}-h"${open?"":" hidden"}>${o.body}</div></section>`}
/* a text block inside a section: a white box (the What's needed one has an orange edge) */
const secTextH=(id,act,val,ph,label,cls)=>`<div class="sl-secbox${cls?" "+cls:""}"><label class="vh" for="${id}">${esc(label)}</label><textarea id="${id}" data-act="${act}" rows="1" placeholder="${esc(ph||"")}"${S.ro?" readonly":""}>${esc(val)}</textarea></div>`;
const secReadH=v=>`<div class="sl-secbox"><p>${v?esc(v):'<span class="pm">Nothing yet.</span>'}</p></div>`;
/* conversations as plain rows, newest first: channel, what was said, date · who (extra rows, e.g. notes, may be added) */
const cvRowH=(ch,txt,meta)=>`<div class="sl-cv"><span class="ch">${esc(ch)}</span><p>${esc(txt)}</p><span class="d">${esc(meta)}</span></div>`;
const cvRowsH=(convs,extra,after)=>`<div class="sl-cvl">${(extra||"")+convs.map(x=>cvRowH(sv(x[C.ch])||"Other",x[C.sum]||"",[short(x[C.date]),sv(x[C.who]),sv(x[C.dir])].filter(Boolean).join(" · "))).join("")+(after||"")||'<p class="pm sl-cve">No conversations logged yet.</p>'}</div>`;
function modalH(D){
  const l=D.J.find(x=>x.id===S.openId);if(!l)return "";
  const r=l.r;const svc=(r[L.services]||[]).map(sv);
  const cm=S.comments[l.id];const cmList=cm&&cm.list||[];
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg sl-dlg-w" role="dialog" aria-modal="true" aria-labelledby="slMh">
   <div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slMh">${esc(l.name)}</h2><div class="sl-co" style="margin-top:2px">${esc(l.co)}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px">${otagH(l.origin)}${tagH(l.offer)}<span class="sl-due ${l.due}">${esc(l.dueL)}</span><span class="pm">${esc(BK.jade.title)} · ${esc(l.stage)}</span>${spChip(l,D)}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts sl-facts-j">
      <div class="sl-fact"><label for="slMst">Stage</label>${pkH({id:"slMst",k:"st:jade",v:l.stage,opts:JADE_STAGES,name:"Stage",act:"jstage",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slMv">Value / month${l.est&&l.value?' <span class="sl-est">Estimate</span>':""}</label><input id="slMv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(l.value))}"${S.ro?" readonly":""}></div>
      <div class="sl-fact"><label for="slMo">Owner</label>${pkH({id:"slMo",k:"owner",v:l.owner,opts:[["","–"]].concat(OWNERS),name:"Owner",act:"owner",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slMlo">Likely offer</label>${pkH({id:"slMlo",k:"ticket",v:sv(r[L.likely])||"Not sure yet",opts:OFFERS,name:"Likely offer",act:"likely",dis:S.ro})}</div>
      <div class="sl-fact"><span class="l">Last contact</span><div class="sl-fv">${agoL(l.lastC)}</div></div>
    </div>
    <div role="group" aria-labelledby="slMs"><p class="sl-sub" id="slMs">Services in play${S.ro?"":` <span style="text-transform:none;letter-spacing:0;font-weight:400">· click to add or remove</span>`}</p><div class="sl-chips">${S.ro?(svc.length?svc.map(s=>`<span class="sl-chip" aria-pressed="true">${esc(s)}</span>`).join(""):'<span class="pm">None yet</span>'):SERVICES.map(s=>`<button type="button" class="sl-chip" data-act="svc" data-v="${esc(s)}" aria-pressed="${svc.includes(s)}">${esc(s)}</button>`).join("")}</div></div>
    <div class="sl-secs">
    ${secH({key:"need",icon:"need",cls:"need",title:"What's needed from Kash",count:String(r[L.needed]||"").trim()?1:0,body:secTextH("slMn","needed",r[L.needed]||"","What does Kash need to do next?","What's needed from Kash","need")})}
    ${secH({key:"hap",icon:"notes",title:"What's happening",count:String(r[L.latest]||"").trim()?1:0,body:secTextH("slMl","latest",r[L.latest]||"","A short summary of where things stand","What's happening")+(r[L.want]?`<p class="sl-want"><b>In their words:</b> ${esc(r[L.want])}</p>`:"")})}
    ${secH({key:"conv",icon:"conv",title:"Conversations",count:l.conv.length,body:cvRowsH(l.conv)+`<div class="sl-addc"${S.ro?" hidden":""}><label class="vh" for="slCc">Channel</label>${pkH({id:"slCc",k:"ch",v:CHANNELS[0],opts:CHANNELS,name:"Channel",field:true})}<label class="vh" for="slCt">What happened</label><input id="slCt" placeholder="Log a conversation: what was said?"><button type="button" class="sl-ghost" data-act="addconv">${svg(PLUS)}Add</button></div>`})}
    </div>
   </div>
   <div class="sl-cmts">
    ${S.cOpen&&cmList.length?`<div class="sl-clist">${cmList.map(c=>`<div><span class="sl-av">${esc((c.who||"?").charAt(0))}</span><div><div><b>${esc(c.who)}</b> <span class="pm">${esc(c.when)}</span></div><div>${esc(c.text)}</div></div></div>`).join("")}</div>`:""}
    ${S.ro?`<div class="sl-cbar"><span class="pm">Comments are in the Claude copy of this dashboard.</span></div>`:`<div class="sl-cbar"><span class="me" aria-hidden="true">${svg("M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0")}</span><input id="slCm" aria-label="Add a comment" placeholder="Add a comment... type @ to tag someone"><button type="button" class="sl-solid" data-act="postc">Post</button>
    <button type="button" class="sl-ctog" data-act="ctog" aria-expanded="${S.cOpen}">${svg("M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z")}<span class="sl-ctl">${cm&&cm.loading?"Loading…":cmList.length?cmList.length+(cmList.length>1?" comments":" comment"):"No comments yet"}</span></button></div>`}
   </div></div></div>`;
}
/* Company Lead (Rise Voice) record; the board is the one it was opened from when it sits on more than one */
const clBoardOf=it=>{const b=S.openClB&&BK[S.openClB];return b&&it.boards.includes(b)?b:it.board};
function recModalH(it,people,D){
  if(!it)return "";const r=it.r;const b=clBoardOf(it);const ro=S.ro?" readonly":"",dis=S.ro?" disabled":"";
  const cur=b?sv(r[b.field]):"";const pq=b&&b.key==="prequal";
  const bits=[r[CL.email],r[CL.phone],r[CL.ig]?"@"+r[CL.ig]:"",r[CL.li]];
  const p=people.find(x=>x.items.includes(it));
  const owners=it.owner&&!CL_OWNERS.includes(it.owner)?CL_OWNERS.concat([it.owner]):CL_OWNERS;
  const pqOrigins=it.pqo&&!PQ_ORIGINS.includes(it.pqo)?PQ_ORIGINS.concat([it.pqo]):PQ_ORIGINS;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg sl-dlg-w" role="dialog" aria-modal="true" aria-labelledby="slCh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slCh">${esc(it.name)}</h2><div class="sl-co" style="margin-top:2px">${esc([it.co].concat(bits).filter(Boolean).join(" · "))}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px">${otagH(it.origin)}<span class="sl-tag">${esc("Rise Voice · "+(b?b.title:"Company Leads"))}</span><span class="sl-due ${it.due}">${esc(it.dueL)}</span>${spChip(it,D)}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts${pq?" sl-facts-pq":""}">
      <div class="sl-fact"><label for="slKs">${pq?"Pre-qual stage":"Stage"}</label>${pkH({id:"slKs",k:"st:"+(b?b.key:""),v:cur,opts:b?(cur?[]:[["","No stage yet"]]).concat(b.stages.map(s=>[s,stL(s)])):[],name:pq?"Pre-qual stage":"Stage",act:"rstage",dis:S.ro})}</div>
      ${pq?`<div class="sl-fact"><label for="slKg">Origin</label>${pkH({id:"slKg",k:"origin",v:it.pqo,opts:[["","No origin yet"]].concat(pqOrigins),name:"Origin",act:"rorigin",dis:S.ro})}</div>`:""}
      <div class="sl-fact"><label for="slKo">Owner</label>${pkH({id:"slKo",k:"owner",v:it.owner,opts:[["","–"]].concat(owners),name:"Owner",act:"rowner",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slKd">Chase date</label>${dateH("slKd","rchase",it.chase)}</div>
      <div class="sl-fact"><label for="slKv">Value / month${it.est&&it.value?' <span class="sl-est">Estimate</span>':""}</label><input id="slKv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(it.value))}"${ro}></div>
    </div>
    ${svcPickH("clsvc",it.services,"slKsv")}
    <div class="sl-secs">
    ${secH({key:"next",icon:"next",title:"Next step (team)",count:String(it.next||"").trim()?1:0,body:secTextH("slKn","next",it.next,"","Next step (team)")})}
    ${secH({key:"want",icon:"want",title:"What they want",count:String(it.want||"").trim()?1:0,body:secTextH("slKw","rwant",it.want,"","What they want")})}
    ${secH({key:"notes",icon:"notes",title:"Notes",count:String(it.notes||"").trim()?1:0,body:secTextH("slKt","rnotes",it.notes,"","Notes")})}
    </div>
    <div class="sl-fbtns" style="justify-content:space-between;align-items:center"><span class="pm">Last contact: ${esc(agoL(it.lastC))}${b?" · board owner "+esc(b.owner):""}</span>${p?`<button type="button" class="sl-ghost" data-act="opent" data-id="${esc(p.id)}">See contact and conversations</button>`:""}</div>
  </div></div></div>`;
}
/* v6 (Karen, 6 Nov): the deal window = one PERSON, their offers as tabs (see personGroup).
   Header: person, company, ⋯ (Delete this offer) and ✕. Row 1 = the person: total value of their open offers, Origin and Owner
   (set on every offer at once), last contact. Tabs = offers; under them a full-bleed grey area with the selected offer's facts,
   What's needed / Notes (that offer) and Conversations (the person). Footer: Won / Lost on the selected offer.
   Quick actions (⋯, Won / Lost, Add offer) are only for Sales Pipeline deals Kash handles: not Pre-qual (still with the teams),
   not in view-only mode, and in no other window. */
const PERSON_I="M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0",ARROW_I="M5 12h14M13 6l6 6-6 6";
const DOTS_H='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>';
const TRASH_I="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",CHECK_I="M20 6 9 17l-5-5",BACK_I="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11";
const quickOK=p=>!!p&&!S.ro&&!p.pre;
/* the offers picker (Add offer, Select offer): the 8 offers; ones the person already has say "already in play" (still allowed) */
const offerOpts=g=>{const have=new Set(g.flatMap(x=>x.services||[]));return SERVICES.map(s=>[s,s,have.has(s)?"already in play":""])};
function spModalH(p,D,people){
  if(!p)return "";if(SALES_ONLY)return kbModalH(p,D,people);const ro=S.ro?" readonly":"";
  const g=personGroup(p,D.P);const gids=new Set(g.map(x=>x.id));
  const pers=people.filter(x=>x.items.some(i=>gids.has(i.id)));const per=pers.find(x=>x.id===p.contactIds[0])||pers.find(x=>x.ct)||pers[0];
  const who=personName(g)||(per&&per.name)||p.name;const first=who.split(/\s+/)[0]||who;
  const co=String(p.co||(g.find(x=>x.co)||{}).co||"");
  const convs=[...new Set(pers.flatMap(x=>x.convs))].sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||"")));
  const open=g.filter(isOpenOffer);const tot=open.reduce((a,x)=>a+(Number(x.value)||0),0);const est=open.some(x=>x.est&&x.value);
  const lastc=g.map(x=>x.lastC).filter(Boolean).sort().pop()||"";
  const lab=offLabel(p);const quick=quickOK(p);
  /* v6.1: Origin and Owner are the person's: the value all their offers share, or "Mixed" when the offers differ (picking a value sets it on every offer) */
  const oneOf=vs=>new Set(vs).size===1?vs[0]:MIXED;const pOrigin=oneOf(g.map(x=>x.origin)),pOwner=oneOf(g.map(x=>x.owner||""));
  const mixed=[[MIXED,"Mixed","differs by offer"]];const xOwn=[...new Set(g.map(x=>x.owner).filter(o=>o&&!OWNERS.includes(o)))];
  const owners=(pOwner===MIXED?mixed:[]).concat([["","–"]],OWNERS.concat(xOwn).map(o=>[o,ownerN(o)]));
  const ttl=per?`<button type="button" class="sl-ttl" data-act="opent" data-id="${esc(per.id)}" title="Open the contact">${svg(PERSON_I,18)}<span>${esc(who)}</span><span class="ar">${svg(ARROW_I,16)}</span></button>`:esc(who);
  const oo=esc(JSON.stringify(pkNorm(offerOpts(g))));
  const tabs=g.map(x=>{const l=offLabel(x),sel=x.id===p.id,ph=!l,pick=ph&&!S.ro;
    return `<button type="button" role="tab" id="slTab-${esc(x.id)}" class="sl-tab${ph?" sl-tph":""}" aria-selected="${sel}" aria-controls="slOffP" tabindex="${sel?0:-1}" data-act="sptab" data-id="${esc(x.id)}"${pick?` value="" data-k="offer" data-n="Offer" data-o="${oo}" aria-haspopup="listbox" aria-expanded="false"`:""}>${ph?(pick?`Select offer <span aria-hidden="true">▾</span>`:"No offer yet"):esc(l)}</button>`}).join("");
  const add=quick?`<button type="button" class="sl-tab add" id="slAddOff" data-act="addoffer" value="" data-k="offer" data-n="Add an offer" data-o="${oo}" aria-haspopup="listbox" aria-expanded="false" aria-label="Add offer">${svg(PLUS,15)}<span class="tl">Add offer</span></button>`:"";
  const lv=p.pre?liveOf(p,D):null;
  const meta=[lv?`<span>With ${esc(lv.who||"the team")} · ${esc(lv.where)} · <b>${esc(lv.stage)}</b></span>`:p.pre?`<span>Pre-qual · with ${esc(p.owner||"the team")}</span>`:"",
    p.from?`<span>From ${esc(p.from)}</span>`:"",
    pers.length?`<span>${pers.length>1?"Contacts":"Contact"}: ${pers.map(x=>`<button type="button" class="sl-plink" data-act="opent" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join(", ")}</span>`:'<span class="pm">No linked contact yet</span>'].filter(Boolean).join("");
  const log=S.ro?"":`<div class="sl-addc"><label class="vh" for="slSc">Channel</label>${pkH({id:"slSc",k:"ch",v:CHANNELS[0],opts:CHANNELS,name:"Channel",field:true})}<label class="vh" for="slSx">What happened</label><input id="slSx" placeholder="Log a conversation"><button type="button" class="sl-ghost" data-act="logsp" data-id="${esc(p.id)}">${svg(PLUS)}Add</button></div>`;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg sl-dlg-sp" role="dialog" aria-modal="true" aria-labelledby="slSh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slSh">${ttl}</h2>${co?`<div class="sl-co" style="margin-top:2px">${esc(co)}</div>`:""}</div>
      <div class="sl-dhb">${quick?`<button type="button" class="sl-x sl-dmore" id="slMore" data-act="spmore" aria-haspopup="menu" aria-expanded="false" aria-label="More actions for this offer" title="More">${DOTS_H}</button>`:""}<button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div></div>
    <div class="sl-facts sl-pfacts">
      <div class="sl-fact sl-ftot"><span class="l">Total value / month</span><div class="sl-fv"><b>${tot?esc(full(tot)):"–"}</b> <small>${open.length} open ${open.length===1?"offer":"offers"}</small>${est?' <span class="sl-est">Est.</span>':""}</div></div>
      <div class="sl-fact"><label for="slSo">Origin</label>${pkH({id:"slSo",k:"origin",v:pOrigin,opts:(pOrigin===MIXED?mixed:[]).concat(ORIGINS),name:"Origin",act:"porigin",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slSw">Owner</label>${pkH({id:"slSw",k:"owner",v:pOwner,opts:owners,name:"Owner",act:"powner",dis:S.ro})}</div>
      <div class="sl-fact"><span class="l">Last contact</span><div class="sl-fv">${lastc?`${esc(short(lastc))} <small>· ${esc(agoL(lastc))}</small>`:'<small>No contact logged</small>'}</div></div>
    </div>
    <div class="sl-offw">
    <div class="sl-tabsr"><div class="sl-tabs" role="tablist" aria-label="${esc("Offers for "+who)}">${tabs}</div>${add}</div>
    <div class="sl-offa" id="slOffP" role="tabpanel" aria-labelledby="slTab-${esc(p.id)}">
    <div class="sl-facts sl-ofacts">
      <div class="sl-fact"><label for="slSs">Stage</label>${pkH({id:"slSs",k:"sp",v:p.stage,opts:((L=>L.includes(p.stage)?L:L.concat([p.stage]))(SALES_ONLY?SALES_STAGES:SP_STAGES)).map(s=>[s,stL(s)]),name:"Stage",act:"spstage",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slSk">Ticket</label>${pkH({id:"slSk",k:"ticket",v:p.offer,opts:OFFERS,name:"Ticket",act:"spoffer",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slSv">Value / month${p.est&&p.value?' <span class="sl-est">Est.</span>':""}</label><input id="slSv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(p.value))}"${ro}></div>
      <div class="sl-fact"><label for="slSd">Chase on</label>${dateH("slSd","spchase",p.chase)}</div>
    </div>
    <div class="sl-secs">
    ${secH({key:"need",icon:"need",cls:"need",title:"What's needed from you",count:String(p.needed||"").trim()?1:0,body:secTextH("slSn","needed",p.needed,p.pre?"Nothing yet: it's with the team":"What do you need to do?","What's needed from you","need")})}
    ${secH({key:"notes",icon:"notes",title:"Notes",count:String(p.notes||"").trim()?1:0,body:secTextH("slSt","spnotes",p.notes,"","Notes")})}
    ${secH({key:"conv",icon:"conv",title:"Conversations",count:convs.length,meta:"For "+first+", across all offers",body:cvRowsH(convs)+log})}
    </div>
    <p class="sl-dmeta">${meta}</p>
    </div></div>
  </div>
  ${quick?`<div class="sl-dfoot"><span class="sl-dfh">${lab?`Applies to the <b>${esc(lab)}</b> offer`:"Applies to this offer"}</span><span class="sl-dfb"><button type="button" class="sl-lost" id="slLost" data-act="splost" aria-pressed="${p.stage===SP_LOST}">${p.stage===SP_LOST?svg(CHECK_I,15):""}Lost</button><button type="button" class="sl-won" id="slWon" data-act="spwon" aria-pressed="${p.stage===SP_WON}">${p.stage===SP_WON?svg(CHECK_I,15):""}Won</button></span></div>`:""}
  </div></div>`;
}
/* v8 (Karen, 6 Nov): one card per person. Stage, value, chase, origin, owner and ticket on top; the offers as chips;
   What's needed, Notes and Conversations folded with counts; Won / Lost in the footer. No delete (the record is the team's). */
function kbModalH(p,D,people){
  const ro=S.ro?" readonly":"";const src=p.r._src||"sp",own=src==="sp";
  const pers=people.filter(x=>x.items.some(i=>i.id===p.id));const per=pers.find(x=>x.id===p.contactIds[0])||pers.find(x=>x.ct)||pers[0];
  const who=p.name||(per&&per.name)||"";const first=who.split(/\s+/)[0]||who;
  const convs=[...new Set(pers.flatMap(x=>x.convs))].sort((x,y)=>String(y[C.date]||"").localeCompare(String(x[C.date]||"")));
  const ttl=per?`<button type="button" class="sl-ttl" data-act="opent" data-id="${esc(per.id)}" title="Open the contact">${svg(PERSON_I,18)}<span>${esc(who)}</span><span class="ar">${svg(ARROW_I,16)}</span></button>`:esc(who);
  const xOwn=p.owner&&!OWNERS.includes(p.owner)?[p.owner]:[];const owners=[["","–"]].concat(OWNERS.concat(xOwn).map(o=>[o,ownerN(o)]));
  const stOpts=((L2=>L2.includes(p.stage)?L2:L2.concat([p.stage]))(SALES_STAGES)).map(s=>[s,stL(s)]);
  const roFact=(lab,v)=>`<div class="sl-fact"><span class="l">${lab}</span><div class="sl-fv">${v||'<small>–</small>'}</div></div>`;
  const meta=[p.from?`<span>From ${esc(p.from)}</span>`:"",
    pers.length?`<span>${pers.length>1?"Contacts":"Contact"}: ${pers.map(x=>`<button type="button" class="sl-plink" data-act="opent" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join(", ")}</span>`:'<span class="pm">No linked contact yet</span>'].filter(Boolean).join("");
  const log=S.ro?"":`<div class="sl-addc"><label class="vh" for="slSc">Channel</label>${pkH({id:"slSc",k:"ch",v:CHANNELS[0],opts:CHANNELS,name:"Channel",field:true})}<label class="vh" for="slSx">What happened</label><input id="slSx" placeholder="Log a conversation"><button type="button" class="sl-ghost" data-act="logsp" data-id="${esc(p.id)}">${svg(PLUS)}Add</button></div>`;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg sl-dlg-sp sl-dlg-kb" role="dialog" aria-modal="true" aria-labelledby="slSh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slSh">${ttl}</h2>${p.co?`<div class="sl-co" style="margin-top:2px">${esc(p.co)}</div>`:""}</div>
      <div class="sl-dhb"><button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div></div>
    <div class="sl-facts sl-kfacts">
      <div class="sl-fact"><label for="slSs">Stage</label>${pkH({id:"slSs",k:"sp",v:p.stage,opts:stOpts,name:"Stage",act:"spstage",dis:S.ro})}</div>
      <div class="sl-fact"><label for="slSd">Chase on</label>${dateH("slSd","spchase",p.chase)}</div>
      ${own?`<div class="sl-fact"><label for="slSo">Origin</label>${pkH({id:"slSo",k:"origin",v:p.origin,opts:ORIGINS,name:"Origin",act:"porigin",dis:S.ro})}</div>`:roFact("Origin",otagH(p.origin))}
      ${src!=="cl"?`<div class="sl-fact"><label for="slSk">Ticket</label>${pkH({id:"slSk",k:"ticket",v:p.offer||"Not sure yet",opts:OFFERS,name:"Ticket",act:"spoffer",dis:S.ro})}</div>`:""}
      ${roFact("Last contact",p.lastC?`${esc(short(p.lastC))} <small>· ${esc(agoL(p.lastC))}</small>`:"<small>No contact logged</small>")}
      ${own?`<div class="sl-fact"><label for="slSw">Owner</label>${pkH({id:"slSw",k:"owner",v:p.owner||"",opts:owners,name:"Owner",act:"powner",dis:S.ro})}</div>`:roFact("Owner",p.owner?`<b>${esc(ownerN(p.owner))}</b>`:"")}
      <div class="sl-fact"><label for="slSv">Value / month${p.est&&p.value?' <span class="sl-est">Est.</span>':""}</label><input id="slSv" data-act="value" inputmode="numeric" placeholder="${S.ro?"–":"Add value"}" value="${esc(full(p.value))}"${ro}></div>
    </div>
    ${svcPickH("spsvc",p.services,"slSsv",true)}
    <div class="sl-secs">
    ${secH({key:"need",icon:"need",cls:"need",title:"What's needed from you",count:String(p.needed||"").trim()?1:0,body:secTextH("slSn","needed",p.needed,"What do you need to do?","What's needed from you","need")})}
    ${secH({key:"notes",icon:"notes",title:"Notes",count:String(p.notes||"").trim()?1:0,body:secTextH("slSt","spnotes",p.notes,"","Notes")})}
    ${secH({key:"conv",icon:"conv",title:"Conversations",count:convs.length,meta:"For "+first,body:cvRowsH(convs)+log})}
    </div>
    <p class="sl-dmeta">${meta}</p>
  </div>
  ${S.ro?"":`<div class="sl-dfoot">${own?"":`<button type="button" class="sl-backbtn" id="slBack" data-act="spback" title="The lead leaves your board and goes back to the team">${svg(BACK_I,16)}<span>Send back<span class="sl-bkx"> to team</span></span></button>`}<span class="sl-dfh${own?"":" r"}">Outcome for <b>${esc(first)}</b></span><span class="sl-dfb"><button type="button" class="sl-lost" id="slLost" data-act="splost" aria-pressed="${p.stage===SP_LOST}">${p.stage===SP_LOST?svg(CHECK_I,15):""}Lost</button><button type="button" class="sl-won" id="slWon" data-act="spwon" aria-pressed="${p.stage===SP_WON}">${p.stage===SP_WON?svg(CHECK_I,15):""}Won</button></span></div>`}
  </div></div>`;
}
/* the warning before an offer is deleted: a small dialog over the deal window (focus stays inside; Esc / Cancel close it) */
function delH(D){
  const d=S.del;if(!d)return "";const p=D.P.find(x=>x.id===d.id);if(!p){S.del=null;return ""}
  const who=personName(personGroup(p,D.P))||p.name;const lab=offLabel(p);
  return `<div class="sl-ov sl-ov2" data-act="delbg"><div class="sl-dlg sl-cfm" role="alertdialog" aria-modal="true" aria-labelledby="slDelH" aria-describedby="slDelT">
    <div class="sl-cfmb"><span class="sl-cfmi">${svg(SEC_I.need,22)}</span><div style="min-width:0"><h2 id="slDelH">Delete this offer?</h2>
      <p id="slDelT">${lab?`Delete the <b>${esc(lab)}</b> offer for <b>${esc(who)}</b>?`:`Delete this offer for <b>${esc(who)}</b>?`} This removes it from Airtable. Their contact and other offers stay.</p></div></div>
    <div class="sl-fbtns"><button type="button" class="sl-ghost sl-cfmc" id="slDelC" data-act="delcancel">Cancel</button><button type="button" class="sl-dang" id="slDelGo" data-act="delgo"${d.busy?" disabled":""}>${svg(TRASH_I,15)}${d.busy?"Deleting…":"Delete offer"}</button></div>
  </div></div>`;
}
/* Karen, 6 Nov: "Send back to team" on a lead a team handed over. Its Kash board status becomes Review: it leaves his board and
   the team's own board drives it again (moving it to their hand-over stage puts it back on his board at Audit Booked). */
function backH(D){
  const b=S.back;if(!b)return "";const p=D.P.find(x=>x.id===b.id);if(!p||(p.r._src||"sp")==="sp"){S.back=null;return ""}
  const team=(String(p.from||"").match(/\(([^)]+)\)/)||[])[1]||"the team";
  return `<div class="sl-ov sl-ov2" data-act="backbg"><div class="sl-dlg sl-cfm" role="alertdialog" aria-modal="true" aria-labelledby="slBackH" aria-describedby="slBackT">
    <div class="sl-cfmb"><span class="sl-cfmi back">${svg(BACK_I,22)}</span><div style="min-width:0"><h2 id="slBackH">Send back to the team?</h2>
      <p id="slBackT"><b>${esc(p.name)}</b> leaves your board and goes back to ${esc(team)}. They pick it up from there and can hand it to you again.</p></div></div>
    <div class="sl-fbtns"><button type="button" class="sl-ghost sl-cfmc" id="slBackC" data-act="backcancel">Cancel</button><button type="button" class="sl-solid" id="slBackGo" data-act="backgo"${b.busy?" disabled":""}>${svg(BACK_I,15)}${b.busy?"Sending…":"Send back"}</button></div>
  </div></div>`;
}
const safeUrl=u=>{const s=String(sv(u)||"").trim();if(!s)return "";const t=/^https?:\/\//i.test(s)?s:/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)?"https://"+s:"";return t};
const linkH=u=>{const h=safeUrl(u);return h?`<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(sv(u))}</a>`:esc(sv(u))};
/* v5.2 (Karen, 5 Nov): a contact's info can be edited here (Edit → Save / Cancel; one update with only what changed) */
const CT_EDIT=[["name","Name","text"],["co","Company","text"],["email","Email","email"],["phone","Phone","tel"],["ig","Instagram","text"],["li","LinkedIn","url"],["web","Website","url"],["loc","Location","text"],["src","Source","select"],["what","What they do","area"],["notes","Notes","area"]];
/* the value as the window shows it before editing (Source in its standard name) */
const ctCur=(c,k)=>k==="src"?stdO(c[CT.src]):String(sv(c[CT[k]])||"").trim();
const igHandle=v=>{const t=String(v||"").trim();const m=t.match(/instagram\.com\/([^/?#\s]+)/i);return (m?m[1]:t).replace(/^@+/,"").replace(/\/+$/,"")};
const telH=v=>{const t=String(v||"").replace(/[^\d+]/g,"");return t?`<a href="tel:${esc(t)}">${esc(v)}</a>`:esc(v)};
const mailH=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?`<a href="mailto:${esc(v)}">${esc(v)}</a>`:esc(v);
const igLinkH=v=>{const h=igHandle(v);return /^[A-Za-z0-9._]+$/.test(h)?`<a href="https://www.instagram.com/${esc(h)}/" target="_blank" rel="noopener noreferrer">@${esc(h.toLowerCase())}</a>`:esc(v)};
/* checks and tidies the edited values; returns {fields} to send, or {err, key}.
   Only fields the user actually changed are checked, tidied and sent: a saved value that would fail the checks
   (e.g. phone 'WhatsApp only') or that is in another form (e.g. IG '@Handle', 'site.com') is left exactly as it is. */
const nlz=s=>String(s==null?"":s).replace(/\r\n?/g,"\n").trim();
function ctChanges(c,vals){
  const f={};
  for(const [k,l] of CT_EDIT){
    if(vals[k]==null)continue;
    let v=nlz(vals[k]);const cur=ctCur(c,k);
    if(v===nlz(cur))continue;
    if(k==="name"&&!v)return {err:"A contact needs a name.",key:k};
    if(k==="email"&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return {err:"That email doesn't look right.",key:k};
    if(k==="phone"&&v&&(v.replace(/\D/g,"").length<5||/[A-Za-z]/.test(v)))return {err:"That phone number doesn't look right.",key:k};
    if((k==="li"||k==="web")&&v){if(/\s/.test(v)||!/\./.test(v))return {err:"Check the "+l+" link.",key:k};if(!/^https?:\/\//i.test(v))v="https://"+v.replace(/^\/+/,"")}
    if(k==="ig"&&v)v=igHandle(v);
    if(k==="src"&&v&&!ORIGINS.includes(v))v=stdO(v)||"Other";
    if(v!==cur)f[CT[k]]=v||null;
  }
  return {fields:f};
}
/* a contact: details (editable), boards, deals and conversations */
function ctModalH(people){
  const p=people.find(x=>x.id===S.openCt);if(!p)return "";const c=p.ct||{};const can=!!p.ct&&!S.ro;const ed=can&&S.ctEdit===p.id;
  const fact=(l,v,wide)=>`<div class="sl-fact${wide?" wide":""}"><span class="l">${l}</span><div class="sl-fv sl-wb"${wide?' style="white-space:pre-line;font-weight:400"':""}>${v||"–"}</div></div>`;
  const ig=sv(c[CT.ig]);const dv=k=>S.ctDraft&&S.ctDraft[k]!=null?S.ctDraft[k]:ctCur(c,k);
  const PH={name:"Full name",co:"Company",email:"name@company.com",phone:"+44 7700 900000",ig:"@handle",li:"linkedin.com/in/…",web:"company.com",loc:"City or country",what:"What they do",notes:"Anything worth keeping"};
  const edH=([k,l,t])=>{const id="slTe-"+k,v=dv(k);
    if(t==="select"){const opts=(v?[]:[["","No source"]]).concat((v&&!ORIGINS.includes(v)?[v]:[]).concat(ORIGINS));return `<div class="sl-fact"><label for="${id}">${l}</label>${pkH({id,k:"origin",v,opts,name:l,field:true,attrs:` data-ct="${k}"`})}</div>`}
    if(t==="area")return `<div class="sl-fact wide"><label for="${id}">${l}</label><textarea id="${id}" data-ct="${k}" rows="2" placeholder="${esc(PH[k]||"")}">${esc(v)}</textarea></div>`;
    return `<div class="sl-fact"><label for="${id}">${l}</label><input id="${id}" data-ct="${k}" type="${t}" value="${esc(v)}" placeholder="${esc(PH[k]||"")}" autocomplete="off"${k==="name"?" required":""}></div>`};
  const info=ed?`<div class="sl-facts sl-cted">${CT_EDIT.map(edH).join("")}</div>
      <div class="sl-fbtns"><button type="button" class="sl-ghost" data-act="ctcancel">Cancel</button><button type="button" class="sl-solid" data-act="ctsave"${S.ctBusy?" disabled":""}>${S.ctBusy?"Saving…":"Save"}</button></div>`
    :`<div class="sl-facts">
      ${fact("Email",sv(c[CT.email])?mailH(sv(c[CT.email]).trim()):"")}${fact("Phone",sv(c[CT.phone])?telH(sv(c[CT.phone])):"")}
      ${fact("Instagram",ig?igLinkH(ig):"")}${fact("LinkedIn",c[CT.li]?linkH(c[CT.li]):"")}${fact("Website",c[CT.web]?linkH(c[CT.web]):"")}
      ${fact("Location",esc(sv(c[CT.loc])))}${fact("Source",esc(stdO(c[CT.src])))}${sv(c[CT.notes])?fact("Notes",esc(sv(c[CT.notes])),true):""}
    </div>`;
  const whH=i=>`<button type="button" class="sl-wh${i.kind==="sp"&&!i.pre?" mine":""}"${i.kind==="sp"&&!i.pre&&i.needed?` title="${esc(i.needed)}"`:""} data-act="${i.kind==="jade"?"open":i.kind==="sp"?"opensp":"openc"}" data-id="${i.id}"><span class="w">${esc(whereOf(i))}</span><b>${esc(stL(i.stage)||"No stage yet")}</b><span class="pm">${esc(i.kind==="sp"?(i.pre?"with the team":(i.needed||"")):[i.owner,i.closed?"":i.dueL].filter(Boolean).join(" · "))}</span></button>`;
  const boards=p.items.filter(i=>i.kind!=="sp"),deals=p.items.filter(i=>i.kind==="sp");
  /* the conversations, with the boards' latest summary and notes after them (as before) */
  const notes=p.items.filter(i=>i.kind!=="jade"&&i.notes).map(i=>cvRowH("Notes",i.notes,whereOf(i))).join("");
  const jl=p.items.find(i=>i.kind==="jade");const lat=jl&&jl.r[L.latest]?cvRowH("Latest",jl.r[L.latest],"Jade's board"):"";
  const brief=sv(c[CT.what])||p.what;
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slTh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slTh">${esc(p.name)}</h2><div class="sl-co" style="margin-top:2px">${esc(p.co)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">${otagH(p.origin)}${p.lastC?`<span class="pm">Last contact ${esc(short(p.lastC))}</span>`:""}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <section class="sl-ctinfo" aria-labelledby="slTi"><div class="sl-cthd"><p class="sl-sub" id="slTi">Contact info${ed?" · editing":""}</p>${can&&!ed?`<button type="button" class="sl-ghost" data-act="ctedit" data-id="${esc(p.id)}">Edit</button>`:""}</div>
    ${info}</section>
    ${p.ct?"":'<p class="pm" style="margin:0">Not in Contacts yet: this person is only on a board.</p>'}
    ${ed?"":`<section class="sl-hap"><h3>What they do</h3><p style="margin:0;white-space:pre-line">${brief?esc(brief):'<span class="pm">No brief yet.</span>'}</p></section>`}
    <section><p class="sl-sub">Boards</p><div class="sl-whs">${boards.map(whH).join("")||'<p class="pm" style="margin:0">Not on any board yet.</p>'}</div></section>
    <section class="sl-ctdeals"><p class="sl-sub">Deals${deals.length>1?" ("+deals.length+")":""}</p>${deals.length>1?`<p class="sl-offn">${esc(OFF_NOTE)}${deals.some(x=>x.pre)?" "+esc(PRE_NOTE):""}</p>`:""}${deals.length?`<div class="sl-ofl">${offSort(deals).sort((a,b)=>(a.pre?1:0)-(b.pre?1:0)).map(x=>offRowH(x,false)).join("")}</div>`:'<p class="pm" style="margin:0">No deal on the Sales Pipeline.</p>'}</section>
    <div class="sl-secs">${secH({key:"conv",icon:"conv",title:"Conversations",count:p.convs.length,body:cvRowsH(p.convs,lat,notes)+(S.ro?"":`<div class="sl-addc"><label class="vh" for="slTc">Channel</label>${pkH({id:"slTc",k:"ch",v:CHANNELS[0],opts:CHANNELS,name:"Channel",field:true})}<label class="vh" for="slTt">What happened</label><input id="slTt" placeholder="Log a conversation"><button type="button" class="sl-ghost" data-act="logct" data-id="${esc(p.id)}">${svg(PLUS)}Add</button></div>`)})}</div>
  </div></div></div>`;
}
/* a guest's Source as shown: an old origin name (Referral, Event…) in its standard name; guest-only sources (Outlier research, Inbound…) as they are */
const gSrcL=v=>(Array.isArray(v)?v:[v]).map(x=>String(sv(x)||"").trim()).filter(Boolean).map(x=>ORIG_LC[x.toLowerCase()]||x).join(", ");
/* a podcast guest: view only */
function gModalH(){
  const g=deriveG().find(x=>x.id===S.openG);if(!g)return "";const r=g.r;
  const fact=(l,v)=>`<div class="sl-fact"><span class="l">${l}</span><div class="sl-fv sl-wb">${v||"–"}</div></div>`;
  const lu=sv(r[G.lead]);const lid=idFromUrl(lu);const inLeads=!!lid&&S.leads.some(x=>x._id===lid);
  const ga=lu?(inLeads?`<button type="button" class="sl-ghost" data-act="open" data-id="${esc(lid)}">Open in ${esc(BK.jade.title)}</button>`:safeUrl(lu)?`<a class="sl-ghost" href="${esc(safeUrl(lu))}" target="_blank" rel="noopener noreferrer">Open in ${esc(BK.jade.title)}</a>`:""):"";
  const ig=sv(r[G.ig]);const igH=ig?igLinkH(ig):"";
  const ln=(h,v,key,icon)=>secH({key,icon,title:h,count:String(v||"").trim()?1:0,body:secReadH(v)});
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg" role="dialog" aria-modal="true" aria-labelledby="slGh"><div class="sl-db">
    <div class="sl-dh"><div style="min-width:0"><h2 id="slGh">${esc(g.name)}</h2><div class="sl-co" style="margin-top:2px">Podcast guest · view only</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px"><span class="sl-tag">${esc(g.stage?gLabel(g.stage):"No stage")}</span>${r[G.ga]?'<span class="sl-chip-s mine">Growth audit booked</span>':""}</div></div>
      <button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
    <div class="sl-facts">
      ${fact("Status",esc(g.stage||"No stage"))}${fact("Handled by",esc(g.by.join(", ")))}${fact("Source",esc(gSrcL(r[G.src])))}
      ${fact("First contacted",esc(dshort(r[G.first])))}${fact("Last contacted",esc(dshort(r[G.last])))}${fact("Pre-interview",esc(dshort(r[G.pre])))}
      ${fact("Growth audit booked",r[G.ga]?"Yes":"No")}
    </div>
    <div class="sl-secs">${ln("Latest update",sv(r[G.latest]),"glatest","notes")}${ln("Next step",sv(r[G.next]),"gnext","next")}</div>
    <div class="sl-facts">
      ${fact("Instagram",igH)}${fact("Personal email",esc(sv(r[G.email])))}${fact("Phone",esc(sv(r[G.phone])))}${fact("Website",r[G.web]?linkH(r[G.web]):"")}${fact("Based in",esc(tv(r[G.based])))}
    </div>
    <div class="sl-fbtns" style="justify-content:space-between;align-items:center"><span class="pm">Changes to guests are made in Airtable for now.</span>${ga}</div>
  </div></div></div>`;
}
/* name search in the header: people, with where they are (and podcast guests) */
function searchHits(q){
  q=norm(q);if(q.length<2)return [];
  return peopleOf(derive()).filter(p=>(!SALES_ONLY||p.items.some(i=>i.kind==="sp"))&&(norm(p.name).includes(q)||norm(p.co).includes(q))).slice(0,10);
}
function guestHits(q){q=norm(q);if(q.length<2||SALES_ONLY)return [];return deriveG().filter(g=>norm(g.name).includes(q)).slice(0,5)}
function renderSearch(){
  const box=el("slQr");if(!box)return;const q=(el("slQ")||{}).value||"";
  if(norm(q).length<2){box.hidden=true;box.innerHTML="";return}
  const hits=searchHits(q),gh=guestHits(q);box.hidden=false;
  /* v6.1: the name opens the contact; each Sales Pipeline offer is its own chip ("Sponsorship · In conversation") that opens the deal window on that offer */
  box.innerHTML=hits.length||gh.length?hits.map(p=>{const sp=offSort(p.items.filter(i=>i.kind==="sp")).sort((a,b)=>(a.pre?1:0)-(b.pre?1:0)),other=p.items.filter(i=>i.kind!=="sp");
      const sub=other.map(i=>whereOf(i)+" · "+(stL(i.stage)||"No stage yet")+(i.owner?" · "+i.owner:"")).join(" | ")||(sp.length?"Sales Pipeline":"Contact");
      const chips=sp.map(i=>{const l=(offLabel(i)||offName(i.name))+" · "+(stL(i.stage)||"No stage yet");return `<button type="button" class="sl-qo stx st-${stageTone(SP_STAGES,i.stage)}" data-act="opensp" data-id="${esc(i.id)}" aria-label="${esc("Open the "+l+" deal for "+p.name)}"><i class="sl-dot"></i><span>${esc(l)}</span></button>`}).join("");
      return `<div class="sl-qg"><button type="button" class="sl-qi" data-act="opent" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><span>${esc(sub)}</span></button>${chips?`<div class="sl-qos">${chips}</div>`:""}</div>`}).join("")
    +gh.map(g=>`<button type="button" class="sl-qi" data-act="openg" data-id="${esc(g.id)}"><b>${esc(g.name)}</b><span>${esc("Podcast Guests · "+(g.stage?gLabel(g.stage):"No stage")+(g.by.length?" · "+g.by.join(", "):""))}</span></button>`).join(""):'<div class="sl-qi"><span>Nobody by that name yet. Use + to add them.</span></div>';
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
const boardList=()=>SALES_ONLY?[["sp","Sales Pipeline"]]:[["sp","My sales pipeline"]].concat(BOARDS.map(x=>[x.key,"Team: "+x.title]));
const stagesFor=k=>k==="sp"?(SALES_ONLY?SALES_STAGES.filter(x=>PLATE.has(x)):SP_STAGES):(BK[k]||BK.jade).stages;
/* stage options: the value is the Airtable stage, the text is how it is shown; coloured like the board they go to */
const stList=k=>stagesFor(k).map(s=>[s,stL(s)]);
const stKind=k=>k==="sp"?"sp":"st:"+(BK[k]?k:"jade");
const stDef=k=>k==="sp"?SP_NEW:k==="prequal"?"New":"";
function propH(it,i){
  const bk=it.board||"sp";const match=it.match;const sp=bk==="sp";
  const what=match?(match.kind==="sp"?(match.stage==="Pre-qual"?"Move "+match.name+" from Pre-qual onto your plate":"Update "+match.name+" on your pipeline"):sp?"Move "+match.name+" onto your pipeline":"Update "+match.name):"New person"+(sp?" on your pipeline":"");
  return `<div class="sl-prop" data-i="${i}">
    <div class="sl-prow"><b>${esc(what)}</b><span class="pm">${match?esc(match.where+" · "+stL(match.stage)):""}</span></div>
    <div class="sl-form"><div class="two">
      <label>Name<input id="slP-n-${i}" value="${esc(it.name||"")}"></label>
      <label>Company / what they do<input id="slP-c-${i}" value="${esc(it.company||it.what_they_do||"")}"></label>
      <label>Goes to${pkH({id:"slP-b-"+i,k:"board",v:bk,opts:boardList(),name:"Goes to",act:"pboard",field:true,dis:!!(match&&match.kind==="sp"),attrs:` data-i="${i}"`})}</label>
      <label>Stage${pkH({id:"slP-s-"+i,k:stKind(bk),v:it.stage,opts:stList(bk),name:"Stage",field:true})}</label>
      <label>Origin${pkH({id:"slP-g-"+i,k:"origin",v:stdO(it.origin)||"Network",opts:ORIGINS,name:"Origin",field:true})}</label>
      <label>Chase date<input id="slP-d-${i}" type="date" value="${esc(it.chase_date||"")}"></label>
    </div>
    <label>What's needed from you<input id="slP-x-${i}" value="${esc(it.needed||"")}" placeholder="What do you need to do next?"></label>
    <label>Conversation to log<input id="slP-v-${i}" value="${esc(it.conversation&&it.conversation.summary||"")}" placeholder="Leave empty to log nothing"></label>
    <div class="two"><label>Channel${pkH({id:"slP-h-"+i,k:"ch",v:it.conversation&&it.conversation.channel,opts:CHANNELS,name:"Channel",field:true})}</label>
      <label>Value / month<input id="slP-m-${i}" inputmode="numeric" value="${esc(full(it.monthly_value))}" placeholder="$0"></label>
      <label>Likely offer${pkH({id:"slP-o-"+i,k:"ticket",v:it.likely_offer||"Not sure yet",opts:OFFERS,name:"Likely offer",field:true})}</label></div>
    </div></div>`;
}
function addH(){
  if(!S.adding)return "";const bk=!SALES_ONLY&&BK[S.view]?S.view:"sp";
  return `<div class="sl-ov" data-act="closebg"><div class="sl-dlg narrow" role="dialog" aria-modal="true" aria-labelledby="slAh"><div class="sl-db">
   <div class="sl-dh"><h2 id="slAh" style="font-size:19px">New lead</h2><button type="button" class="sl-x" data-act="close" aria-label="Close">${svg(XI,16)}</button></div>
   <div class="sl-form">
    <label>Name<input id="slFn" placeholder="Full name"></label>
    <label>Company / what they do<input id="slFw" placeholder="e.g. Founder, DIRTEA"></label>
    <div class="two">${SALES_ONLY?`<input type="hidden" id="slFf" value="sp">`:`<label>Goes to${pkH({id:"slFf",k:"board",v:bk,opts:boardList(),name:"Goes to",act:"fboard",field:true})}</label>`}
      <label>Stage${pkH({id:"slFs",k:stKind(bk),v:stDef(bk),opts:stList(bk),name:"Stage",field:true})}</label>
      <label>Origin${pkH({id:"slFg",k:"origin",v:ORIGINS[0],opts:ORIGINS,name:"Origin",field:true})}</label>
      <label>Value / month<input id="slFv" inputmode="numeric" placeholder="$0"></label>
      <label>Chase date<input id="slFd" type="date" value="${TODAY}"></label>
      <label>Likely offer${pkH({id:"slFo",k:"ticket",v:"Not sure yet",opts:OFFERS,name:"Likely offer",field:true})}</label></div>
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
  if(SALES_ONLY){S.view="sales";const hd=document.querySelector("#sales .sl-head");if(hd)hd.style.display="none"}
  if(OLD_VIEW[S.view])S.view=OLD_VIEW[S.view];if(!VIEWS.has(S.view))S.view="mine";
  const fab=el("slFab");if(fab&&S.ro)fab.hidden=true;
  const note=S.ro?`<p class="pm" style="margin:-2px 0 12px">View only on this link${S.fetchedAt?" · data from "+esc(String(S.fetchedAt).slice(11,16))+" UTC":""}. Open the Claude copy to make changes.</p>`:"";
  const main=S.view==="mine"?spH(D):S.view==="sales"?salesH(D):S.view==="contacts"?contactsH(D,people):S.view==="guests"?guestsH():boardH(BK[S.view]||BK.jade,D);
  const bd0=body.querySelector(".sl-board"),bl=bd0?bd0.scrollLeft:0,bt=bd0?bd0.scrollTop:0,key=S.view+"|"+(S.grp[S.view]||""),sy=window.scrollY;const rl0=body.querySelector(".sl-rail"),rsl=rl0?rl0.scrollLeft:0;
  body.innerHTML=note+(SALES_ONLY?`<div class="sl-layout sl-solo"><div class="sl-main">${main}</div></div>`:`<div class="sl-layout">${rail(D,plate)}<div class="sl-main">${main}</div></div>`);putSearch();
  const bd1=body.querySelector(".sl-board");if(bd1&&S.lastKey===key){bd1.scrollLeft=bl;bd1.scrollTop=bt}if(S.lastKey===key&&window.scrollY!==sy)window.scrollTo(0,sy);S.lastKey=key;
  railKeep(body,rsl);eqHeads(body);
  const rec=S.openCl?D.K.find(x=>x.id===S.openCl):null;const spr=S.openSp?D.P.find(x=>x.id===S.openSp):null;
  /* v6: a redraw keeps the window's scroll position (and focus, when the same control is still there), e.g. when moving between offer tabs */
  const mo=el("slModal");const mdb=mo.querySelector(".sl-dlg:not(.sl-cfm) .sl-db");const mkey=[S.openId,S.openCl,S.openSp?"sp":"",S.openCt,S.openG].join("|");const mst=mdb&&S.mKey===mkey?mdb.scrollTop:0;
  const fid=document.activeElement&&mo.contains(document.activeElement)&&document.activeElement.id||"";
  /* v6.1: only on the same deal: a field of another offer (same id, new tab) never takes over text typed for the last one */
  const same=S.mSp===S.openSp;S.mSp=S.openSp;
  const fa=document.activeElement;const ftx=same&&fid&&(fa.tagName==="TEXTAREA"||(fa.tagName==="INPUT"&&!/^(checkbox|radio|date)$/.test(fa.type)))?{v:fa.value,s:fa.selectionStart,e:fa.selectionEnd,d:fa.dataset.dirty==="1"||fa.value!==fa.defaultValue}:null;
  if(!spr){S.del=null;S.back=null}
  /* the offer tab strip keeps its sideways scroll on a redraw of the same window (it only moves when the selected tab is out of view) */
  const otl=S.mKey===mkey&&mo.querySelector(".sl-tabs"),tsl=otl?otl.scrollLeft:0;
  mo.innerHTML=(S.openId?modalH(D):"")+(rec?recModalH(rec,people,D):"")+(spr?spModalH(spr,D,people)+delH(D)+backH(D):"")+(S.openCt?ctModalH(people):"")+(S.openG?gModalH():"")+addH()+dropH();
  S.mKey=mkey;const ndb=mo.querySelector(".sl-dlg:not(.sl-cfm) .sl-db");
  document.querySelectorAll("#v-sales textarea,#slModal textarea").forEach(grow);
  if(ndb&&mst)ndb.scrollTop=mst;
  const ntl=mo.querySelector(".sl-tabs");if(ntl&&tsl)ntl.scrollLeft=tsl;
  /* the selected tab in view (only when it is out of view; the first / last tab scroll right to the edge), and the edge fades */
  const stab=mo.querySelector('.sl-tabs [aria-selected="true"]');if(stab){const tl=stab.parentElement;tabFade(tl);const a=stab.getBoundingClientRect(),r=tl.getBoundingClientRect();
    if(a.left<r.left-1)tl.scrollLeft=stab===tl.firstElementChild?0:tl.scrollLeft+a.left-r.left-8;else if(a.right>r.right+1)tl.scrollLeft=stab===tl.lastElementChild?tl.scrollWidth:tl.scrollLeft+a.right-r.right+8;tabFade(tl,false)}
  if(fid&&same&&!PK){const f=el(fid);if(f&&mo.contains(f)&&!f.disabled){
    /* a field being typed in keeps its text; it still saves when the person leaves it */
    if(ftx&&ftx.d&&(f.tagName==="TEXTAREA"||f.tagName==="INPUT")&&f.value!==ftx.v){f.value=ftx.v;f.dataset.dirty="1";f.addEventListener("change",()=>{f.dataset.dirty=""},{once:true});f.addEventListener("blur",()=>{if(f.dataset.dirty==="1"){f.dataset.dirty="";f.dispatchEvent(new Event("change",{bubbles:true}))}},{once:true});if(f.tagName==="TEXTAREA")grow(f)}
    f.focus({preventScroll:true});if(ftx)try{f.setSelectionRange(ftx.s,ftx.e)}catch(x){}}}
  if((S.del||S.back)&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".sl-cfm"))){const c=el("slDelC")||el("slBackC");if(c)c.focus({preventScroll:true})}
  menuSync();
  renderSearch();
  if(S.inAdd&&el("slIn")&&!PK)el("slIn").focus();
  pkSync();
}
/* v5.4: the rail keeps its sideways scroll and shows the selected item (phone); the headers on one board share one height so first cards line up */
/* v6.1: a tab row that scrolls fades at the edge(s) that hide more tabs */
/* v6.2: on a phone "Add offer" shrinks to the + only when the tabs do not fit beside its full label (measured with the label shown, so it never flips back and forth); a scroll only updates the fades */
function tabFade(tl,fit){if(!tl)return;const row=tl.parentElement;if(fit!==false&&row){row.classList.remove("sl-tov");row.classList.toggle("sl-tov",tl.scrollWidth>tl.clientWidth+1)}
  const ov=tl.scrollWidth>tl.clientWidth+1,max=tl.scrollWidth-tl.clientWidth;tl.classList.toggle("sl-tfl",ov&&tl.scrollLeft>1);tl.classList.toggle("sl-tfr",ov&&tl.scrollLeft<max-1)}
document.addEventListener("scroll",e=>{const t=e.target;if(t&&t.classList&&t.classList.contains("sl-tabs"))tabFade(t,false)},true);
window.addEventListener("resize",()=>tabFade(document.querySelector("#slModal .sl-tabs")));
function railKeep(body,sl){const r=body.querySelector(".sl-rail");if(!r)return;r.scrollLeft=sl;if(r.scrollWidth<=r.clientWidth)return;const a=r.querySelector('[aria-current="page"]');if(!a)return;const rr=r.getBoundingClientRect(),ar=a.getBoundingClientRect();if(ar.left<rr.left||ar.right>rr.right)r.scrollLeft+=ar.left-rr.left-12}
/* grouped by source: only the source columns are lined up (the Pre-qual tile keeps its two-line note, as when grouped by stage, and stays out of the sum) */
function eqHeads(root){(root||document).querySelectorAll("#v-sales .sl-board").forEach(bd=>{const src=bd.matches('[data-group="source"]');const all=[...bd.querySelectorAll(".sl-col:not(.sl-colc)>.sl-colh")];all.forEach(h=>{h.style.minHeight=""});const hs=src?all.filter(h=>h.parentElement.dataset.board==="sp-src"):all;if(!src&&!hs.some(h=>h.querySelector(".sl-cinfo")))return;const m=Math.max(0,...hs.map(h=>h.offsetHeight));if(m)hs.forEach(h=>{if(h.offsetHeight<m)h.style.minHeight=m+"px"})});
  if(headRO){headRO.disconnect();document.querySelectorAll("#v-sales .sl-board").forEach(b=>headRO.observe(b))}}
/* v5.6: a window remembers what opened it (a card's chip, name or button on the page) and gives focus back to it on close.
   The page is redrawn when a window opens, so the opener is found again by its card and its place on that card */
/* closing a window (✕, backdrop, Esc) first leaves the field being edited, so its change saves on the record that was open */
function flushEdit(){const a=document.activeElement;const m=el("slModal");if(a&&m&&m.contains(a)&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT")&&a.blur)a.blur()}
/* the window is about to show another offer: leave the field being edited (it saves on the offer that is still open), close a list or menu */
function leaveOffer(){flushEdit();pkClose(false);menuClose(false)}
const OPENERS=new Set(["open","openc","opensp","opent","openg"]);
function keepOpener(a){if(!a||a.closest("#slModal")||!a.closest("#v-sales"))return;const c=a.parentElement&&a.parentElement.closest("#v-sales [data-id]");
  const col=a.closest(".sl-col,.sl-groups>[data-due]");
  S.opener={el:a,act:a.dataset.act,aid:a.dataset.id||"",card:c?c.dataset.id:"",idx:c?[...c.querySelectorAll(`[data-act="${a.dataset.act}"]`)].indexOf(a):-1,colB:col?col.dataset.board||"":"",colS:col?(col.dataset.stage??col.dataset.due??""):null,q:!!a.closest("#slQr")}}
function backToOpener(){const o=S.opener;S.opener=null;if(!o||el("slModal").querySelector(".sl-dlg"))return;let t=o.el&&o.el.isConnected?o.el:null;
  if(!t&&o.card){const c=document.querySelector(`#v-sales [data-id="${CSS.escape(o.card)}"]`);if(c)t=c.querySelectorAll(`[data-act="${o.act}"]`)[o.idx]||c.querySelector("button[data-act],input[data-act]")}
  if(!t&&o.q)t=el("slQ"); /* a search result: back to the search box */
  if(!t&&o.aid)t=document.querySelector(`#v-sales [data-act="${o.act}"][data-id="${CSS.escape(o.aid)}"]`);
  /* v6.1: the opener is gone (e.g. its only offer was deleted): the column it was in (its fold button), else the page heading */
  if(!t&&o.colS!=null){const c=o.colB?document.querySelector(`#v-sales .sl-col[data-board="${CSS.escape(o.colB)}"][data-stage="${CSS.escape(o.colS)}"]`):document.querySelector(`#v-sales .sl-groups>[data-due="${CSS.escape(o.colS)}"]`);
    t=c&&(c.querySelector('[data-act="fold"]')||c.querySelector("button[data-act],input[data-act]"))}
  if(!t||!t.getClientRects().length){const h=document.querySelector("#v-sales .sl-main h2");if(h){h.tabIndex=-1;t=h}}
  if(t&&t.getClientRects().length)t.focus({preventScroll:true})}
function grow(t){if(!t.offsetParent||t.id==="slDt")return;t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px"}
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.matches)return;if(t.matches("#v-sales textarea,#slModal textarea"))grow(t);if(t.id==="slQ")renderSearch();
  /* a section's count follows what is typed in it (1 with text, 0 when empty) */
  if(t.matches("#slModal .sl-secbox textarea")){const c=t.closest(".sl-sec")&&t.closest(".sl-sec").querySelector("[data-cnt]");if(c){const n=t.value.trim()?1:0;c.textContent=n;c.classList.toggle("zero",!n)}}
  if(t.id==="slDt"&&S.drop)S.drop.text=t.value;
  if(t.dataset&&t.dataset.ct&&S.ctDraft)S.ctDraft[t.dataset.ct]=t.value;
  if(t.id==="slCq"){S.cq=t.value;const pl=el("slPl");if(pl)pl.innerHTML=peopleRowsH(peopleOf(derive()))}});

/* ---------- writes ---------- */
const lead=id=>S.leads.find(r=>r._id===id);
const KF={cl:{base:RB,tbl:T.cl,arr:"cl",next:CL.next,want:CL.want,notes:CL.notes,owner:CL.owner,chase:CL.chase,value:CL.val,est:CL.est,lastc:CL.lastc},
          sp:{base:CB,tbl:T.sp,arr:"sp",next:SP.needed,want:null,notes:SP.notes,owner:SP.owner,chase:SP.chase,value:SP.value,est:SP.est,lastc:SP.lastc,stage:SP.stage},
          ct:{base:CB,tbl:T.contacts,arr:"contacts"},pl:{base:CB,tbl:T.pipes,arr:"pipelines"}};
const recOf=(kind,id)=>(S[KF[kind].arr]||[]).find(r=>r._id===id);
/* a failed save puts the record back, but keeps what the person typed in the window so they can try again */
const typedIn=()=>{const m=el("slModal");return m?[...m.querySelectorAll("textarea[id],input[id]:not([type=checkbox]):not([type=date]):not([type=radio])")].map(x=>[x.id,x.value]):[]};
/* a logged conversation's box empties (also when Enter logged it and the box still has focus) */
const clearIn=id=>{const x=el(id);if(x){x.value="";x.defaultValue="";delete x.dataset.dirty}};
/* a value that isn't an amount: nothing is saved, the field goes back to the saved value, and the toast says why */
function badAmt(a,prev){const t=String(a.value).trim();a.value=a.defaultValue=full(prev);toast(`Not saved: "${t.length>24?t.slice(0,24)+"…":t}" isn't an amount. ${AMT_MSG}`)}
const putTyped=v=>v.forEach(([id,val])=>{const x=el(id);if(x&&x.value!==val){x.value=val;if(x.tagName==="TEXTAREA")grow(x)}});
async function saveLead(id,fields,typecast,quiet){const r=lead(id);const prev={};Object.keys(fields).forEach(k=>{prev[k]=r[k]});Object.assign(r,fields);if(!quiet)render();
  try{await upd(CB,T.leads,id,fields,typecast);toast("Saved")}catch(e){const keep=typedIn();Object.assign(r,prev);render();putTyped(keep);toast("Couldn't save. Try again.")}}
async function saveRec(kind,id,fields,quiet,typecast){const k=KF[kind];const r=recOf(kind,id);if(!r)return false;
  const w=kind==="sp"&&SALES_ONLY?kbWrite(r,fields):{base:k.base,tbl:k.tbl,fields};if(!w){toast("That can't be changed from Kash's board.");render();return false}
  const prev={};Object.keys(fields).forEach(f=>{prev[f]=r[f]});Object.assign(r,fields);if(!quiet)render();
  try{await upd(w.base,w.tbl,id,w.fields,!!typecast);toast("Saved");return true}catch(e){const keep=typedIn();Object.assign(r,prev);render();putTyped(keep);toast("Couldn't save. Try again.");return false}}
/* a Company Lead's stage on one board; on Pre-qual, "Sales Pipeline" (Sent to Sales) also opens (or moves up) the deal on Kash's
   Sales Pipeline, linked back, and "Podcast Pipeline" (Sent to Podcast) adds them to Podcast Guests for Jade */
async function setClStage(id,b,st){
  const ok=await saveRec("cl",id,{[b.field]:st||null});
  if(ok&&b.key==="prequal"&&st==="Sales Pipeline")await handToSales(id,b);
  if(ok&&b.key==="prequal"&&st==="Podcast Pipeline")await handToPodcast(id);
}
/* the standard origin a handed-over deal gets, by the board it comes from */
const handOrigin=(it,b)=>!b?(stdO(it.origin)||"Other"):b.key==="prequal"?(stdO(it.pqo)||stdO(it.origin)||"Other"):b.key==="upwork"?"Upwork":b.key==="upsell"?"Upsells":b.key==="jade"?"Podcast guest":"Other";
/* Sent to Podcast: one new guest on Podcast Guests (ReLearn Operating System), unless they are already there */
const GUEST_ST_NEW="20 – In conversation",JADE_TEAM_ID="recT0wAfthtKftV89";
const nmKey=s=>String(sv(s)||"").toLowerCase().replace(/\s+/g,"");
const igKey=s=>{const t=String(sv(s)||"").trim().toLowerCase();const m=t.match(/instagram\.com\/([^/?#\s]+)/);return (m?m[1]:t).replace(/^@/,"").replace(/\/+$/,"")};
const isEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||"").trim());
const emKey=s=>{const t=String(sv(s)||"").trim().toLowerCase();return isEmail(t)?t:""}; /* only real addresses match (some rows hold notes like "Whatsapp/IG") */
function guestMatch(name,email,ig){
  const n=nmKey(name),e=emKey(email),i=igKey(ig);
  return S.guests.find(g=>(n&&nmKey(g[G.name])===n)||(e&&emKey(g[G.email])===e)||(i&&igKey(g[G.ig])===i))||null;
}
const longDate=()=>pad(now.getDate())+" "+MON[now.getMonth()]+" "+now.getFullYear();
async function handToPodcast(id){
  const it=derive().K.find(x=>x.id===id);if(!it)return;const r=it.r;
  /* on Kash's link the guests come in a second request: wait for it, so nobody is added twice */
  if(S.gP)await S.gP.catch(()=>{});
  if(S.noG){toast("Couldn't check Podcast Guests, so nobody was added. Refresh and try again.");return}
  const email=isEmail(sv(r[CL.email]))?sv(r[CL.email]).trim():"",ig=sv(r[CL.ig]).trim(),phone=sv(r[CL.phone]).trim();
  if(guestMatch(it.name,email,ig)){toast("Already in Podcast Guests");return}
  const pqo=it.pqo||"";const notes=String(it.notes||"").replace(/\s+/g," ").trim().slice(0,300);
  const f={[G.name]:it.name,[G.stage]:GUEST_ST_NEW,[G.by]:[JADE_TEAM_ID],[G.src]:pqo==="Referrals"?"Referral":pqo==="Events"?"Event":"Inbound",
    [G.latest]:("From Pre-qual (Gretta) on "+longDate()+": origin "+(pqo||"not set")+". "+notes).trim()};
  if(ig)f[G.ig]=ig;if(email)f[G.email]=email;if(phone)f[G.phone]=phone;
  try{const gid=await mk(GB,T.guests,f,true);if(!gid)throw new Error("no id");S.guests.push(Object.assign({_id:gid},f));render();toast("Sent to Podcast Guests for Jade")}
  catch(e){toast("Couldn't add to Podcast Guests")}
}
async function handToSales(id,b){
  const D=derive();const it=D.K.find(x=>x.id===id);if(!it)return;const ex=D.spOf[id];
  try{
    if(ex){if(ex.pre&&await saveRec("sp",ex.id,{[SP.stage]:SP_NEW},true,true))render()}
    else{await newDeal({name:it.name,company:it.co,stage:SP_NEW,origin:handOrigin(it,b),chase_date:TODAY,conversation:null},{rv:atUrl(RB,T.cl,id),from:b.from,contactIds:[idFromUrl(it.r[CL.contact])].filter(Boolean)});await load(true)}
    toast("Handed to Kash's Sales Pipeline");
  }catch(e){toast("Moved, but the deal couldn't be opened on the Sales Pipeline.")}
}
async function openComments(id){if(S.ro){S.comments[id]={list:[]};return}S.comments[id]={loading:true,list:[]};render();
  try{const p=await call("list_record_comments",{baseId:CB,tableId:T.leads,recordId:id,pageSize:100});
    const list=(p.comments||[]).map(c=>{const users=Object.assign({},p.mentioned||{},c.mentioned||{});let t=String(c.text||"");t=t.replace(/@\[([A-Za-z0-9]+)\]/g,(m,u)=>"@"+((users[u]&&(users[u].displayName||users[u].name||users[u].email))||"someone"));
      const a=c.author||{};const w=c.createdTime?short(String(c.createdTime).slice(0,10)):"";return {who:a.name||a.email||"Someone",when:w,text:t}}).reverse();
    S.comments[id]={list}}catch(e){S.comments[id]={list:[],err:true}}
  if(S.openId===id)render()}

/* contact info edited in the contact window: one update with only the changed fields (typecast for a new Source option) */
async function saveContact(){
  const id=S.ctEdit;const c=recOf("ct",id);if(!c||S.ctBusy)return;
  document.querySelectorAll("#slModal [data-ct]").forEach(x=>{S.ctDraft=S.ctDraft||{};S.ctDraft[x.dataset.ct]=x.value});
  const res=ctChanges(c,S.ctDraft||{});
  if(res.err){toast(res.err);const f=el("slTe-"+res.key);if(f)f.focus();return}
  const fields=res.fields;
  if(!Object.keys(fields).length){S.ctEdit=null;S.ctDraft=null;render();toast("No changes to save");return}
  S.ctBusy=true;render();
  try{await upd(CB,T.contacts,id,fields,true);
    Object.keys(fields).forEach(k=>{if(fields[k]==null)delete c[k];else c[k]=fields[k]});
    S.ctEdit=null;S.ctDraft=null;S.ctBusy=false;render();toast("Contact saved")}
  catch(e){S.ctBusy=false;render();toast("Couldn't save")}
}
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
/* a new contact's Source (standard names only); Pre-qual leads use their Pre-qual origin */
const BOARD_CT_SRC={jade:"Podcast guest",upwork:"Upwork",upsell:"Upsells",prequal:"Other"};
async function logConv(summary,ch,leadId,contactId){
  if(!summary)return;const w=viewer();const f={[C.sum]:summary,[C.date]:TODAY,[C.ch]:ch||"Other"};if(leadId)f[C.lead]=[leadId];if(contactId)f[C.contact]=[contactId];if(w)f[C.who]=w;
  const id=await mk(CB,T.conv,f,true);S.conv.push(Object.assign({_id:id},f));
}
/* a new deal on Kash's pipeline; links back to the team record when there is one */
async function newDeal(it,link){
  const st0=spStage(it.stage);const stage=it.stage&&SP_STAGES.includes(st0)?st0:SP_NEW;const val=amtOK(it.monthly_value);const conv=it.conversation&&it.conversation.summary?it.conversation:null;
  const f={[SP.deal]:it.name,[SP.stage]:stage,[SP.origin]:stdO(it.origin)||"Other",[SP.owner]:"Kash",[SP.leadin]:TODAY,[SP.from]:link&&link.from||"Kash direct",[SP.offer]:OFFERS.includes(it.likely_offer)?it.likely_offer:"Not sure yet"};
  if(it.company)f[SP.co]=it.company;if(it.needed)f[SP.needed]=it.needed;if(it.chase_date)f[SP.chase]=it.chase_date;if(val)f[SP.value]=val;if(conv){f[SP.lastc]=TODAY;f[SP.notes]=TODAY+" · "+conv.channel+": "+conv.summary}
  let cids=link&&link.contactIds||[];
  if(!cids.length){try{cids=[await ensureContact({name:it.name,company:it.company,what_they_do:it.what_they_do,email:it.email,phone:it.phone,instagram:it.instagram,linkedin:it.linkedin},f[SP.origin])]}catch(e){cids=[]}}
  if(cids.length)f[SP.contacts]=cids;if(link&&link.jadeId)f[SP.jade]=[link.jadeId];if(link&&link.rv)f[SP.rv]=link.rv;
  const id=await mk(CB,T.sp,f,true);
  if(conv)await logConv(conv.summary,conv.channel,link&&link.jadeId||"",cids[0]||"").catch(()=>{});
  return id;
}
async function saveProposal(it){
  const bk=it.board||"sp";const conv=it.conversation&&it.conversation.summary?it.conversation:null;const val=amtOK(it.monthly_value);
  const D=derive();const m=it.match?D.all.find(x=>x.id===it.match.id):null;
  if(m&&m.kind==="sp"){ /* update a deal already on his pipeline */
    const r=recOf("sp",m.id);const f={};if(it.needed)f[SP.needed]=it.needed;if(it.chase_date)f[SP.chase]=it.chase_date;if(it.stage&&SP_STAGES.includes(spStage(it.stage))&&spStage(it.stage)!==m.stage)f[SP.stage]=spStage(it.stage);if(val){f[SP.value]=val;f[SP.est]=false}
    if(stdO(it.origin)&&stdO(it.origin)!==m.origin)f[SP.origin]=stdO(it.origin);if(it.likely_offer&&it.likely_offer!=="Not sure yet")f[SP.offer]=it.likely_offer;
    if(conv){f[SP.lastc]=TODAY;f[SP.notes]=((r&&r[SP.notes])?r[SP.notes]+"\n\n":"")+TODAY+" · "+conv.channel+": "+conv.summary}
    if(Object.keys(f).length)await upd(CB,T.sp,m.id,f,true); /* typecast: a standard origin may be a new option */
    if(conv)await logConv(conv.summary,conv.channel,m.jadeId||"",m.contactIds[0]||"").catch(()=>{});
    return;
  }
  if(m&&bk==="sp"){ /* someone on a team board who now needs Kash: open the deal, linked back, and hand over where the board has the stage */
    const existing=D.spOf[m.id];
    if(existing){it.match={id:existing.id,kind:"sp"};return saveProposal(it)}
    const link=m.kind==="jade"?{jadeId:m.id,from:BK.jade.from,contactIds:ids(m.r[L.contacts])}:{rv:atUrl(RB,T.cl,m.id),from:m.board?m.board.from:"",contactIds:[idFromUrl(m.r[CL.contact])].filter(Boolean)};
    if(!it.origin||it.origin==="Network")it.origin=handOrigin(m,m.kind==="jade"?BK.jade:m.board);
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
  const b=BK[bk]||BK.jade;const stage=b.key==="prequal"?"New":b.stages.includes(it.stage)?it.stage:b.stages[0]; /* Pre-qual: new leads start in New */
  const person={name:it.name,company:it.company,what_they_do:it.what_they_do,email:it.email,phone:it.phone,instagram:it.instagram,linkedin:it.linkedin};
  if(b.kind==="jade"){
    let cid="";try{cid=await ensureContact(person,BOARD_CT_SRC.jade)}catch(e){} /* the lead still saves if Contacts can't be written */
    const f={[L.name]:it.name,[L.stage]:stage,[L.source]:"🤝 Referral / direct",[L.owner]:"Jade",[L.leadIn]:TODAY};if(cid)f[L.contacts]=[cid];
    if(it.company)f[L.co]=it.company;if(it.what_they_do)f[L.what]=it.what_they_do;if(it.chase_date)f[L.chase]=it.chase_date;if(it.what_they_want)f[L.want]=it.what_they_want;if(it.likely_offer)f[L.likely]=it.likely_offer;if(conv)f[L.lastC]=TODAY;if(val)f[L.value]=val;
    const lid=await mk(CB,T.leads,f,false);
    if(conv)await logConv(conv.summary,conv.channel,lid,cid);
  }else{
    const f={[CL.name]:it.name,[b.field]:stage,[CL.leadin]:TODAY};if(b.source)f[CL.src]=b.source;if(b.defOwner)f[CL.owner]=b.defOwner;
    const po=b.key==="prequal"&&PQ_ORIGINS.includes(stdO(it.origin))?stdO(it.origin):"";if(po)f[CL.pqo]=po; /* Pre-qual: the origin picked when adding */
    if(it.company)f[CL.co]=it.company;if(it.email)f[CL.email]=it.email;if(it.phone)f[CL.phone]=it.phone;if(it.instagram)f[CL.ig]=norm(it.instagram);if(it.linkedin)f[CL.li]=it.linkedin;if(it.chase_date)f[CL.chase]=it.chase_date;if(it.what_they_want)f[CL.want]=it.what_they_want;if(val)f[CL.val]=val;
    if(conv){f[CL.lastc]=TODAY;f[CL.notes]=TODAY+" · "+conv.channel+": "+conv.summary+" (from Kash)"}
    const clid=await mk(RB,T.cl,f,b.defOwner==="Danica"||b.defOwner==="Gretta"); /* typecast adds the new Danica owner option */
    let cid="";try{cid=await ensureContact(person,po||BOARD_CT_SRC[b.key]||"Other",{[CT.rvurl]:atUrl(RB,T.cl,clid),[CT.rvboard]:b.title+" · "+stage})}catch(e){}
    if(cid){await upd(RB,T.cl,clid,{[CL.contact]:atUrl(CB,T.contacts,cid)},false).catch(()=>{});
      if(conv)await logConv(conv.summary,conv.channel,"",cid).catch(()=>{})}
  }
}
function itemsForPrompt(){
  const D=derive();
  return D.P.map(p=>({id:p.id,kind:"pipeline",name:p.name,company:p.co,stage:p.stage})).concat(D.J.map(l=>({id:l.id,kind:"team",name:l.name,company:l.co,where:BK.jade.title+" (Jade) · "+l.stage})),D.K.filter(k=>k.board&&!k.closed).map(k=>({id:k.id,kind:"team",name:k.name,company:k.co,where:k.board.title+" · "+(k.stage||"no stage")})));
}
function dropPrompt(text){
  return `You turn Kash's quick notes (often dictated on his phone) into updates for his sales pipeline. Today is ${TODAY} (${WD[now.getDay()]}).

Kash's own board is his SALES PIPELINE (board "sp"). Everything Kash says he is handling goes there. Its stages, in order: ${SP_STAGES.map(s=>JSON.stringify(s)).join(", ")}. Use "Lead in" when it's new and he still has to reach out, "In conversation" while talking (before an audit is booked), "Audit booked" when a growth audit / discovery call is in the diary, "Audit held" once the audit is done and a proposal is to write, "Proposal sent" when the proposal is with them, "Follow-up call" when a call is booked to go through the proposal, "Won – Handover to Ops" when they sign, "Lost / No reply" when it's a no or they went quiet. Never use "Pre-qual" for something Kash is handling.
Only use a team board when Kash says the TEAM should handle it: "jade" (${BK.jade.title}: podcast guests with a sales opportunity, Jade turns them into clients), ${BOARDS.filter(b=>b.kind==="cl").map(b=>`"${b.key}" (${b.title}, stages ${b.stages.map(s=>JSON.stringify(s)).join(", ")})`).join("; ")}.
Origin is one of ${ORIGINS.join(", ")}. "Network" = someone Kash met himself or knows personally.

People already in the system. If the note is about one of them, set match_id to their id. "pipeline" entries are already on his board; "team" entries are with a team (if Kash is now handling one, still set match_id and board "sp"):
${JSON.stringify(itemsForPrompt())}

Reply with only JSON in this shape:
{"recap":"One to three plain sentences, addressed to Kash, of what you understood and what will be saved.","items":[{"match_id":"","name":"","company":"","what_they_do":"","email":"","phone":"","instagram":"","linkedin":"","board":"sp","stage":"Lead in","origin":"Network","likely_offer":"Not sure yet","monthly_value":null,"needed":"what Kash has to do next, short","chase_date":"YYYY-MM-DD or empty","conversation":{"channel":"WhatsApp","summary":""}}],"question":""}
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
  const pk=e.target.closest&&e.target.closest(".sl-pk");
  if(pk&&(pk.closest("#v-sales")||pk.closest("#slModal"))){e.preventDefault();if(PK&&PK.t===pk)pkClose(true);else pkOpen(pk);return}
  const a=e.target.closest("[data-act]");
  if(!a){const qr=el("slQr");if(qr&&!qr.hidden&&!e.target.closest(".sl-srch")){qr.hidden=true}return}
  const inSales=a.closest("#v-sales")||a.closest("#slModal")||a.id==="slFab";if(!inSales)return;
  const act=a.dataset.act;const card=a.closest("[data-id]");const id=(a.dataset.id)||(card&&card.dataset.id);
  if(act==="closebg"&&e.target!==a)return;
  if(S.ro&&RO_BLOCK.has(act)){toast(VIEW_ONLY);return}
  if(a.closest("#slQr")&&el("slQ")){el("slQ").value=""} /* picking a search result clears the search */
  const hideQ=()=>{if(el("slQr"))el("slQr").hidden=true};
  const closeAll=()=>{S.openId=S.openCl=S.openSp=S.openCt=S.openG=null;S.ctEdit=null;S.ctDraft=null;S.ctBusy=false;S.del=null;S.back=null;menuClose(false)};
  /* v6 deal window: the delete warning, the ⋯ menu, Won / Lost, the offer tabs, the folding sections */
  if(act==="delbg"){if(e.target===a)delClose();return}
  if(act==="delcancel"){delClose();return}
  if(act==="delgo"){delOffer();return}
  if(act==="spback"){if(S.openSp&&!S.ro){S.back={id:S.openSp,busy:false};render();const c=el("slBackC");if(c)c.focus({preventScroll:true})}return}
  if(act==="backbg"){if(e.target===a)backClose();return}
  if(act==="backcancel"){backClose();return}
  if(act==="backgo"){sendBack();return}
  if(act==="spmore"){if(menuIsOpen())menuClose(true);else menuOpen();return}
  if(act==="spwon"||act==="splost"){if(a.getAttribute("aria-pressed")!=="true")setWonLost(act==="spwon");return}
  if(act==="sectog"){const k=a.dataset.sec;S.sec[k]=!S.sec[k];a.setAttribute("aria-expanded",String(S.sec[k]));const b=el("slSec-"+k);if(b){b.hidden=!S.sec[k];b.querySelectorAll("textarea").forEach(grow)}return}
  if(act==="sptab"){const id2=a.dataset.id;if(PK&&PK.t===a){pkClose(true);return}if(S.openSp!==id2){S.openSp=id2;render()}const t=el("slTab-"+id2);if(t){t.focus({preventScroll:true});if(t.dataset.o&&!S.ro)pkOpen(t)}return}
  if(act==="addoffer"){if(PK&&PK.t===a){pkClose(true);return}pkOpen(a);return}
  if(act==="view"){S.view=OLD_VIEW[a.dataset.v]||a.dataset.v;S.inAdd=null;render();window.scrollTo({top:0});return}
  if(act==="pqgroup"){S.pqGroup=a.dataset.v==="origin"?"origin":"stage";try{localStorage.setItem("slPqGroup",S.pqGroup)}catch(x){}S.inAdd=null;render();return}
  if(act==="gall"){S.gAll[a.dataset.stage||""]=true;render();return}
  if(act==="ctall"){S.ctAll=true;const pl=el("slPl");if(pl)pl.innerHTML=peopleRowsH(peopleOf(derive()));return}
  if(OPENERS.has(act))keepOpener(a);
  if(act==="openg"){closeAll();S.openG=id;hideQ();render();return}
  if(act==="fold"){toggleFold(a.dataset.board,a.dataset.stage);S.inAdd=null;render();const f=document.querySelector(`#v-sales .sl-col[data-board="${a.dataset.board}"][data-stage="${CSS.escape(a.dataset.stage)}"] [data-act="fold"]`);if(f)f.focus();return}
  if(act==="boxtog"){S.boxOpen=!(S.boxOpen!==false);try{localStorage.setItem("slBox",S.boxOpen?"1":"0")}catch(x){}render();return}
  if(act==="open"){closeAll();S.openId=id;S.cOpen=false;hideQ();render();openComments(id);return}
  if(act==="openc"){closeAll();S.openCl=id;S.openClB=BK[S.view]?S.view:null;hideQ();render();return}
  if(act==="opensp"){closeAll();S.openSp=id;hideQ();render();return}
  if(act==="spgroup"){const k=a.dataset.k;if(!GRP_KEY[k])return;S.grp[k]=GRPS.includes(a.dataset.v)?a.dataset.v:"stage";try{localStorage.setItem(GRP_KEY[k],S.grp[k])}catch(x){}S.inAdd=null;render();
    const b=document.querySelector(`#v-sales [data-act="spgroup"][data-k="${k}"][data-v="${S.grp[k]}"]`);if(b)b.focus();return}
  if(act==="opent"){closeAll();S.openCt=id;hideQ();render();return}
  if(act==="close"||act==="closebg"){flushEdit();closeAll();S.adding=false;if(rec){try{rec.stop()}catch(x){}}S.drop=null;render();backToOpener();return}
  if(act==="refresh"){load(true);return}
  if(act==="inadd"){S.inAdd=a.dataset.ikey;render();return}
  if(act==="incancel"){S.inAdd=null;render();return}
  if(act==="insave"){const name=(el("slIn").value||"").trim();if(!name){el("slIn").focus();return}
    const [ctx,bk,stg,ch]=String(a.dataset.ikey).split("|");a.disabled=true;
    try{
      if(bk==="sp"){await newDeal({name,stage:stg||SP_NEW,origin:el("slInO")?el("slInO").value:"Network",chase_date:ch||(ctx==="p"?TODAY:""),conversation:null},null)}
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
        return Object.assign({},x,{match:m?{id:m.id,kind:m.kind,name:m.name,where:whereOf(m),stage:m.stage||"no stage"}:null,board,stage:(()=>{const st=x.stage||(m&&m.kind==="sp"?m.stage:SP_NEW);return board!=="sp"?st:SP_STAGES.includes(spStage(st))?spStage(st):SP_NEW})(),origin:x.origin||(m?m.origin:"Network")})});
      if(!items.length){S.drop.busy=false;S.drop.err=(res&&res.question)||"I couldn't find a person in that note. Add a name and try again.";render();return}
      Object.assign(S.drop,{busy:false,items,recap:(res&&res.recap)||"",question:(res&&res.question)||""});render();
    }catch(err){S.drop.busy=false;S.drop.err=err&&err.code==="not_granted"?"Allow this dashboard to use Claude to read notes, or add by hand.":err&&err.code==="rate_limited"?"Claude is busy right now. Try again in a minute.":"I couldn't read that note. Try again, or add by hand.";render()}
    return}
  if(act==="dropsave"){const d=S.drop;if(!d||!d.items)return;
    const badV=d.items.findIndex((it,i)=>{const x=el("slP-m-"+i);return !!x&&Number.isNaN(amt(x.value))});if(badV>=0){toast("Value / month: "+AMT_MSG);el("slP-m-"+badV).focus();return}
    d.items.forEach((it,i)=>{const v=k=>{const x=el("slP-"+k+"-"+i);return x?x.value.trim():""};
      it.name=v("n")||it.name;const co=v("c");if(co)it.company=co;if(!(it.match&&it.match.kind==="sp"))it.board=v("b")||it.board;it.stage=v("s")||it.stage;it.origin=v("g")||it.origin;it.needed=v("x");it.chase_date=v("d");it.likely_offer=v("o");it.monthly_value=v("m");
      const cs=v("v");it.conversation=cs?{channel:v("h")||"Other",summary:cs}:null});
    d.busy=true;render();let ok=0,bad=0;
    for(const it of d.items){try{await saveProposal(it);ok++}catch(err){bad++}}
    S.drop=null;toast(bad?`Saved ${ok}, ${bad} failed. Check Airtable.`:`Saved ${ok} ${ok===1?"update":"updates"}`);await load(true);return}
  if(act==="ctog"){S.cOpen=!S.cOpen;render();return}
  /* contact info: Edit → Save (one update, only what changed) / Cancel */
  if(act==="ctedit"){if(!recOf("ct",S.openCt))return;S.ctEdit=S.openCt;S.ctDraft={};S.ctBusy=false;render();const f=el("slTe-name");if(f)f.focus();return}
  if(act==="ctcancel"){S.ctEdit=null;S.ctDraft=null;S.ctBusy=false;render();const b=document.querySelector('#slModal [data-act="ctedit"]');if(b)b.focus();return}
  if(act==="ctsave"){await saveContact();return}
  if(act==="spsvc"||act==="clsvc"){const kind=act==="spsvc"?"sp":"cl";const rid=kind==="sp"?S.openSp:S.openCl;const r=recOf(kind,rid);if(!r)return;const f=kind==="sp"?SP.services:CL.services;const cur=(r[f]||[]).map(sv);const v=a.dataset.v;saveRec(kind,rid,{[f]:cur.includes(v)?cur.filter(x=>x!==v):cur.concat([v])});return}
  if(act==="svc"){const r=lead(S.openId);const cur=(r[L.services]||[]).map(sv);const v=a.dataset.v;const nx=cur.includes(v)?cur.filter(x=>x!==v):cur.concat([v]);saveLead(S.openId,{[L.services]:nx});return}
  if(act==="postc"){const inp=el("slCm");const t=(inp&&inp.value||"").trim();if(!t)return;const id2=S.openId;inp.value="";
    try{await call("create_record_comment",{baseId:CB,tableId:T.leads,recordId:id2,text:t});S.cOpen=true;toast("Comment posted");openComments(id2)}catch(err){toast("Couldn't post the comment.")}return}
  if(act==="addconv"){const t=(el("slCt").value||"").trim();if(!t)return;const ch=el("slCc").value;const id2=S.openId;const r=lead(id2);const cid=r?ids(r[L.contacts])[0]:"";const f={[C.sum]:t,[C.lead]:[id2],[C.date]:TODAY,[C.ch]:ch};if(cid)f[C.contact]=[cid];const w=viewer();if(w)f[C.who]=w;
    try{const nid=await mk(CB,T.conv,f);S.conv.push(Object.assign({_id:nid},f,{[C.lead]:[{id:id2}],[C.ch]:{name:ch},[C.who]:w?{name:w}:null}));clearIn("slCt");await saveLead(id2,{[L.lastC]:TODAY})}catch(err){toast("Couldn't log the conversation.")}return}
  if(act==="logsp"){const t=(el("slSx").value||"").trim();if(!t){el("slSx").focus();return}const ch=el("slSc").value;const p=derive().P.find(x=>x.id===a.dataset.id);if(!p)return;
    /* a conversation needs a person to hang on (as in the contact window): no contact and no Podcast Leads record = nothing to link */
    if(!p.contactIds.length&&!p.jadeId){toast("Add this person to Contacts first.");return}
    a.disabled=true;try{await logConv(t,ch,p.jadeId||"",p.contactIds[0]||"");clearIn("slSx");await saveRec("sp",p.id,{[SP.lastc]:TODAY},true);toast("Conversation logged");render()}catch(err){a.disabled=false;toast("Couldn't log the conversation.")}return}
  if(act==="logct"){const t=(el("slTt").value||"").trim();if(!t){el("slTt").focus();return}const ch=el("slTc").value;const p=peopleOf(derive()).find(x=>x.id===a.dataset.id);if(!p)return;
    const jl=p.items.find(i=>i.kind==="jade");const f={[C.sum]:t,[C.date]:TODAY,[C.ch]:ch};if(p.ct)f[C.contact]=[p.ct._id];if(jl)f[C.lead]=[jl.id];const w=viewer();if(w)f[C.who]=w;
    if(!p.ct&&!jl){toast("Add this person to Contacts first.");return}
    a.disabled=true;
    try{const nid=await mk(CB,T.conv,f);S.conv.push(Object.assign({_id:nid},f));clearIn("slTt");
      if(jl)await upd(CB,T.leads,jl.id,{[L.lastC]:TODAY}).then(()=>{lead(jl.id)[L.lastC]=TODAY}).catch(()=>{});
      for(const i of p.items.filter(i=>i.kind!=="jade")){await upd(KF[i.kind].base,KF[i.kind].tbl,i.id,{[KF[i.kind].lastc]:TODAY}).then(()=>{recOf(i.kind,i.id)[KF[i.kind].lastc]=TODAY}).catch(()=>{})}
      toast("Conversation logged");render()}catch(err){a.disabled=false;toast("Couldn't log the conversation.")}return}
  if(act==="savelead"){const name=(el("slFn").value||"").trim();if(!name){el("slFn").focus();return}
    if(Number.isNaN(amt(el("slFv").value))){toast("Value / month: "+AMT_MSG);el("slFv").focus();return}
    const it={name,company:el("slFw").value||"",board:el("slFf").value,stage:el("slFs").value,origin:el("slFg").value,likely_offer:el("slFo").value,needed:el("slFx").value||"",chase_date:el("slFd").value||"",monthly_value:el("slFv").value,conversation:null};
    a.disabled=true;
    try{await saveProposal(it);S.adding=false;toast("Lead added");await load(true)}catch(err){a.disabled=false;toast("Couldn't add the lead.")}return}
});
document.addEventListener("keydown",e=>{
  /* v6: the delete warning keeps focus inside itself; Esc closes it (only it) */
  if((S.del||S.back)&&el("slModal").querySelector(".sl-cfm")){const box=el("slModal").querySelector(".sl-cfm");
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();if(S.del)delClose();else backClose();return}
    if(e.key==="Tab"){const f=[...box.querySelectorAll("button:not([disabled])")];if(!f.length){e.preventDefault();return}const i=f.indexOf(document.activeElement);e.preventDefault();f[(i<0?0:i+(e.shiftKey?-1:1)+f.length)%f.length].focus();return}
    if(!box.contains(e.target)){e.preventDefault();const c=el("slDelC")||el("slBackC");if(c)c.focus();return}}
  if(e.key==="Escape"&&menuIsOpen()){e.preventDefault();menuClose(true);return}
  /* ⋯ opens from the keyboard with ArrowDown too */
  if(e.key==="ArrowDown"&&e.target&&e.target.id==="slMore"){e.preventDefault();menuOpen();return}
  /* offer tabs: arrows / Home / End move to the next tab and show it */
  const tb=e.target&&e.target.closest&&e.target.closest('#slModal [role="tab"]');
  if(tb&&["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const ts=[...tb.parentElement.querySelectorAll('[role="tab"]')];let i=ts.indexOf(tb);
    i=e.key==="Home"?0:e.key==="End"?ts.length-1:(i+(e.key==="ArrowRight"?1:-1)+ts.length)%ts.length;const nid=ts[i].dataset.id;pkClose(false);if(S.openSp!==nid){S.openSp=nid;render()}const n=el("slTab-"+nid);if(n)n.focus();return}
  if((e.key==="Enter"||e.key===" ")&&e.target&&e.target.matches&&e.target.matches("#slModal .sl-dpi:not([readonly])")&&typeof e.target.showPicker==="function"){e.preventDefault();try{e.target.showPicker()}catch(x){}return}
  /* v6.1: Enter in a "Log a conversation" box logs it (like the board's "Add a lead" name box) */
  if(e.key==="Enter"&&!e.isComposing&&e.target&&["slSx","slTt","slCt"].includes(e.target.id)){e.preventDefault();const b=e.target.closest(".sl-addc")&&e.target.closest(".sl-addc").querySelector("button[data-act]");if(b&&!b.disabled)b.click();return}
  /* v6.1: the header search: ArrowDown moves into the results, arrows move between them, Enter opens the first, Esc closes the list */
  if(e.target&&(e.target.id==="slQ"||(e.target.closest&&e.target.closest("#slQr")))){const qr=el("slQr"),q=el("slQ");const its=qr&&!qr.hidden?[...qr.querySelectorAll("button")]:[];
    if((e.key==="ArrowDown"||e.key==="ArrowUp")&&its.length){e.preventDefault();const i=its.indexOf(document.activeElement);const j=e.key==="ArrowDown"?(i<0?0:Math.min(its.length-1,i+1)):(i<0?-1:i-1);if(j<0)q.focus();else its[j].focus();return}
    if(e.key==="Enter"&&e.target.id==="slQ"&&its.length){e.preventDefault();its[0].click();return}
    if(e.key==="Escape"&&qr&&!qr.hidden){e.preventDefault();qr.hidden=true;q.focus();return}}
  /* a picker opens from the keyboard with ArrowDown / ArrowUp too (Enter and Space press the button) */
  if((e.key==="ArrowDown"||e.key==="ArrowUp")&&e.target&&e.target.matches&&e.target.matches(".sl-pk")&&!e.target.disabled&&(e.target.closest("#v-sales")||e.target.closest("#slModal"))){e.preventDefault();pkOpen(e.target);return}
  if(S.ctEdit&&e.target&&e.target.closest&&e.target.closest("#slModal")){
    if(e.key==="Enter"&&e.target.tagName==="INPUT"&&e.target.dataset.ct){e.preventDefault();saveContact();return}
    if(e.key==="Escape"){e.preventDefault();S.ctEdit=null;S.ctDraft=null;S.ctBusy=false;render();const b=document.querySelector('#slModal [data-act="ctedit"]');if(b)b.focus();return}}
  if(e.target&&e.target.id==="slIn"){if(e.key==="Enter"){e.preventDefault();const b=document.querySelector('#v-sales [data-act="insave"]');if(b)b.click();return}if(e.key==="Escape"){S.inAdd=null;render();return}}
  if(e.key==="Escape"&&(S.openId||S.openCl||S.openSp||S.openCt||S.openG||S.adding||S.drop)&&el("slModal")&&el("slModal").innerHTML){flushEdit();S.openId=S.openCl=S.openSp=S.openCt=S.openG=null;S.ctEdit=null;S.ctDraft=null;S.adding=false;if(rec){try{rec.stop()}catch(x){}}S.drop=null;render();backToOpener()}
});
document.addEventListener("change",e=>{
  if(e.target&&e.target.dataset&&e.target.dataset.ct&&e.target.closest("#slModal")){if(S.ctDraft)S.ctDraft[e.target.dataset.ct]=e.target.value;return}
  const a=e.target.closest("[data-act]")||e.target;if(!(a.closest("#v-sales")||a.closest("#slModal")))return;
  if(a.classList&&a.classList.contains("sl-dpi"))dpSync(a);
  if(a.id==="slCo"){S.co=a.value;const pl=el("slPl");if(pl)pl.innerHTML=peopleRowsH(peopleOf(derive()));return}
  if(!a.dataset||!a.dataset.act)return;
  const card=a.closest("[data-id]");const act=a.dataset.act;
  if(act==="pboard"){const i=a.dataset.i;const s=el("slP-s-"+i);if(s)pkReplace(s,stList(a.value),stDef(a.value),stKind(a.value));return}
  if(act==="fboard"){const s=el("slFs");if(s)pkReplace(s,stList(a.value),stDef(a.value),stKind(a.value));return}
  if(S.ro){if(a.type==="checkbox")a.checked=!a.checked;toast(VIEW_ONLY);render();return}
  if(act==="sptab"){setOffer(a.dataset.id,a.value);return}
  if(act==="addoffer"){addOffer(a.value);return}
  if(act==="plhealth"){const id2=a.dataset.id;saveRec("pl",id2,{[PL.health]:a.value||null});return}
  const kind=card?card.dataset.kind:S.openSp?"sp":S.openCl?"cl":"jade";
  const id=(card&&card.dataset.id)||S.openSp||S.openCl||S.openId;if(!id)return;
  if(kind==="cl"||kind==="sp"){const k=KF[kind];const r=recOf(kind,id);if(!r)return;
    if(act==="done"){if(a.checked){S.prevLastC[id]=r[k.lastc]||null;saveRec(kind,id,{[k.lastc]:TODAY})}else saveRec(kind,id,{[k.lastc]:S.prevLastC[id]||null});return}
    if(act==="rstage"){const it=derive().K.find(x=>x.id===id);const b=it&&clBoardOf(it);if(b)setClStage(id,b,a.value);return}
    if(act==="rorigin"){const v=a.value||null;saveRec("cl",id,{[CL.pqo]:v}).then(ok=>{
        /* the person's contact takes the Pre-qual origin as its Source while it has none (or Other) */
        const ct=ok&&v&&recOf("ct",idFromUrl(r[CL.contact]));if(ct&&(!stdO(ct[CT.src])||stdO(ct[CT.src])==="Other"))saveRec("ct",ct._id,{[CT.src]:stdO(v)||"Other"},true,true)});return}
    if(act==="rowner")return saveRec(kind,id,{[k.owner]:a.value||null},false,a.value==="Danica"||a.value==="Gretta");
    if(act==="spstage")return saveRec("sp",id,{[SP.stage]:a.value},false,true); /* typecast: the new stage names may be new options */
    if(act==="spoffer")return saveRec("sp",id,{[SP.offer]:a.value});
    if(act==="sporigin")return saveRec("sp",id,{[SP.origin]:stdO(a.value)||"Other"},false,true); /* standard name; typecast adds the option */
    /* v6: Origin and Owner in the deal window belong to the person: every offer in the group, one update (typecast as origin writes) */
    if(act==="porigin"||act==="powner"){if(a.value===MIXED)return;const D=derive();const p=D.P.find(x=>x.id===id);if(!p)return;return savePerson(personGroup(p,D.P).map(x=>x.id),act==="porigin"?{[SP.origin]:stdO(a.value)||"Other"}:{[SP.owner]:a.value||null},true)}
    if(act==="spchase")return saveRec("sp",id,{[SP.chase]:a.value||null});
    if(act==="spnotes")return saveRec("sp",id,{[SP.notes]:a.value||null},true);
    if(act==="needed"&&kind==="sp")return saveRec("sp",id,{[SP.needed]:a.value||null},true);
    /* v6.1: "12k" = 12,000, a range keeps its low end, anything else is not saved; the saved value shows formatted, and the window,
       the card and the KPIs redraw at once (the field already holds the new text, so the redraw keeps focus without re-saving) */
    if(act==="value"){const n=amt(a.value);if(Number.isNaN(n)){badAmt(a,r[k.value]);return}a.value=a.defaultValue=full(n);return saveRec(kind,id,{[k.value]:n,[k.est]:false})}
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
  if(act==="value"){const n=amt(a.value);if(Number.isNaN(n)){badAmt(a,(lead(id)||{})[L.value]);return}a.value=a.defaultValue=full(n);return saveLead(id,{[L.value]:n,[L.est]:false})}
  if(act==="last"){const l=deriveJ().find(x=>x.id===id);if(!l||!l.lastConv)return;const c=l.lastConv;const prev=c[C.sum];c[C.sum]=a.value;
    upd(CB,T.conv,c._id,{[C.sum]:a.value}).then(()=>toast("Saved")).catch(()=>{const keep=typedIn();c[C.sum]=prev;render();putTyped(keep);toast("Couldn't save.")});return}
});
/* drag a card between columns */
let slDrag=false;
const clearOver=()=>document.querySelectorAll("#v-sales .sl-col.over").forEach(x=>x.classList.remove("over"));
document.addEventListener("dragend",()=>{slDrag=false;clearOver()});
/* v6.1: the column under the pointer. Below a short column (the board scrolls inside itself on desktop, and short columns are only
   as tall as its visible part) the pointer is over the board itself: the column is the one whose left-right range holds the pointer */
function dropCol(e){const t=e.target;if(!t||!t.closest)return null;const c=t.closest("#v-sales .sl-col");if(c)return c;const bd=t.closest("#v-sales .sl-board");if(!bd)return null;
  return [...bd.children].find(x=>{if(!x.classList.contains("sl-col"))return false;const r=x.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right})||null}
/* Karen, 6 Nov: the board is one screen tall. With a mouse or trackpad, scrolling down over it first moves the page until the
   board reaches the top of the window, then scrolls the cards; sideways swipes always move the board. Phones keep the plain page scroll. */
const FULL_GAP=16;
document.addEventListener("wheel",e=>{
  if(e.ctrlKey||e.deltaY<=0||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
  const b=e.target.closest&&e.target.closest("#v-sales .sl-board.sl-full");if(!b||!matchMedia("(pointer:fine)").matches)return;
  const top=b.getBoundingClientRect().top,room=document.documentElement.scrollHeight-innerHeight-scrollY;
  /* board in place: its cards scroll; at their end the page stays put, so the column titles stay in view */
  if(top<=FULL_GAP+1){if(b.scrollTop+b.clientHeight>=b.scrollHeight-1)e.preventDefault();return}
  if(room<1)return;
  e.preventDefault();const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  window.scrollBy(0,Math.min(dy,top-FULL_GAP,room));
},{passive:false});
document.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest("#v-sales .sl-kc");if(!c)return;if(c.closest('.sl-board[data-group="date"]')){e.preventDefault();return}slDrag=true;e.dataTransfer.setData("text/plain",c.dataset.kind+":"+c.dataset.id);e.dataTransfer.effectAllowed="move"});
document.addEventListener("dragover",e=>{
  if(slDrag){const y=e.clientY,H=innerHeight,E=90;if(y<E)window.scrollBy(0,-Math.ceil((E-y)/3));else if(y>H-E)window.scrollBy(0,Math.ceil((y-(H-E))/3));
    const bd=document.querySelector("#v-sales .sl-board");if(bd){const r=bd.getBoundingClientRect();if(y>r.top&&y<r.bottom){if(e.clientX<r.left+70)bd.scrollLeft-=16;else if(e.clientX>r.right-70)bd.scrollLeft+=16;
      /* desktop: the board scrolls inside itself, so near its top or bottom edge it scrolls up or down to reach the other columns */
      if(bd.scrollHeight>bd.clientHeight){if(y<r.top+70)bd.scrollTop-=Math.ceil((r.top+70-y)/2);else if(y>r.bottom-70)bd.scrollTop+=Math.ceil((y-(r.bottom-70))/2)}}}}
  const col=dropCol(e);if(!col||col.closest('.sl-board[data-group="date"]'))return;const cb=col.dataset.board;
  /* grouped by source: only the source columns take a drop (not the Pre-qual tile, not "No source").
     v6.1: grouped by stage, the Pre-qual tile takes no drop either (Pre-qual is set by the teams, not by Kash) */
  const bySrc=!!col.closest('.sl-board[data-group="source"]');
  if(bySrc?!(cb==="sp-src"&&col.dataset.stage):!((cb==="sp"&&col.dataset.stage!=="Pre-qual")||(BK[cb]&&!(cb==="prequal"&&S.pqGroup==="origin"))))return;e.preventDefault();document.querySelectorAll("#v-sales .sl-col.over").forEach(x=>x!==col&&x.classList.remove("over"));col.classList.add("over")});
document.addEventListener("dragleave",e=>{const t=e.target;if(!t||!t.closest)return;const col=t.closest("#v-sales .sl-col");if(col&&!col.contains(e.relatedTarget))col.classList.remove("over");
  if(t.matches("#v-sales .sl-board")&&!t.contains(e.relatedTarget))clearOver()});
document.addEventListener("drop",e=>{slDrag=false;const col=dropCol(e);if(!col||col.closest('.sl-board[data-group="date"]'))return;e.preventDefault();clearOver();
  const [kind,id]=(e.dataTransfer.getData("text/plain")||"").split(":");if(!id)return;if(S.ro){toast(VIEW_ONLY);return}
  const bk=col.dataset.board;const st=col.dataset.stage;
  if(col.closest('.sl-board[data-group="source"]')){if(bk==="sp-src"&&kind==="sp"&&ORIGINS.includes(st))setTimeout(()=>setOrigin(id,st),0);return}
  if(!bk||!st||(bk==="sp"&&st==="Pre-qual"))return;
  /* save after the drag has fully ended, so the card being dragged isn't redrawn mid-drag; a card dropped back on its own column saves nothing */
  setTimeout(()=>{
    if(bk==="sp"&&kind==="sp"){const r=recOf("sp",id);if(r&&spStage(r[SP.stage])!==st)saveRec("sp",id,{[SP.stage]:st},false,true)}
    else if(bk==="jade"&&kind==="jade"){const r=lead(id);if(r&&(sv(r[L.stage])||JADE_STAGES[0])!==st)saveLead(id,{[L.stage]:st})}
    else{const b=BK[bk];const r=recOf("cl",id);if(b&&b.kind==="cl"&&kind==="cl"&&r&&sv(r[b.field])!==st&&derive().K.some(x=>x.id===id&&x.boards.includes(b)))setClStage(id,b,st)}},0)});

/* a deal dropped on another source column: its Origin becomes that standard origin (typecast adds the option if needed).
   v6.1: Origin belongs to the person (as in the deal window), so every offer of the person moves with it, in one update */
async function setOrigin(id,o){const D=derive();const p=D.P.find(x=>x.id===id);if(!p)return;const g=personGroup(p,D.P);if(g.every(x=>stdO(x.r[SP.origin])===o))return;
  await savePerson(g.map(x=>x.id),{[SP.origin]:o},true,g.length>1?"Origin set to "+o+" on all "+g.length+" offers":"Origin set to "+o)}

/* ---------- v6 (Karen, 6 Nov): deal window quick actions (Sales Pipeline deals only) ---------- */
/* Origin / Owner are the person's: one update for every offer in the group (Airtable takes 10 records per call) */
/* v6.1: a batch that fails is put back on its own; batches already saved stay saved, so the window matches Airtable */
async function savePerson(idL,fields,typecast,msg){
  if(SALES_ONLY)return saveRec("sp",idL[0],fields,false,typecast);
  const rs=idL.map(id=>recOf("sp",id)).filter(Boolean);if(!rs.length)return false;
  const prev=new Map(rs.map(r=>{const o={};Object.keys(fields).forEach(k=>{o[k]=r[k]});return [r,o]}));rs.forEach(r=>Object.assign(r,fields));render();
  let bad=[];
  for(let i=0;i<rs.length;i+=10){const b=rs.slice(i,i+10);try{await call("update_records_for_table",{baseId:CB,tableId:T.sp,records:b.map(r=>({id:r._id,fields})),typecast:!!typecast})}catch(e){bad=bad.concat(b)}}
  if(!bad.length){toast(msg||(rs.length>1?"Saved on all "+rs.length+" offers":"Saved"));return true}
  const keep=typedIn();bad.forEach(r=>Object.assign(r,prev.get(r)));render();putTyped(keep);
  toast(bad.length===rs.length?"Couldn't save. Try again.":`Saved on ${rs.length-bad.length} of ${rs.length} offers. Try again.`);return false
}
/* Won / Lost: the stage of the SELECTED offer only */
async function setWonLost(won){
  const id=S.openSp;const r=recOf("sp",id);if(!r)return;const st=won?SP_WON:SP_LOST;if(spStage(r[SP.stage])===st)return;
  const pr=saveRec("sp",id,{[SP.stage]:st},false,true);const b=el(won?"slWon":"slLost");if(b)b.focus({preventScroll:true});
  if(await pr)toast(won?"Marked as won":"Marked as lost")}
/* ＋ Add offer: a new Sales Pipeline deal for the same person at SP_NEW (Audit booked in sales-only mode), with the current deal's owner, origin, company, From and contacts */
async function addOffer(svc){
  const D=derive();const p=D.P.find(x=>x.id===S.openSp);if(!p||p.pre||S.ro||!SERVICES.includes(svc))return;
  const g=personGroup(p,D.P);const who=offWho(g)||p.name;const r=p.r;
  const f={[SP.deal]:who+" · "+svc,[SP.services]:[svc],[SP.stage]:SP_NEW};
  const ow=sv(r[SP.owner]),og=stdO(r[SP.origin]),co=String(sv(r[SP.co])||"").trim(),fr=sv(r[SP.from]);
  if(ow)f[SP.owner]=ow;if(og)f[SP.origin]=og;if(co)f[SP.co]=co;if(fr)f[SP.from]=fr;if(p.contactIds.length)f[SP.contacts]=p.contactIds.slice();
  const b=el("slAddOff");if(b)b.disabled=true;
  try{const id=await mk(CB,T.sp,f,true);if(!id)throw new Error("no id");S.sp.push(Object.assign({_id:id},f));
    /* v6.1: before the window moves to the new tab, a field still being typed in saves on the offer it belongs to, and an open list closes */
    if(S.openSp===p.id){leaveOffer();S.openSp=id}render();const t=el("slTab-"+id);if(t)t.focus({preventScroll:true});toast("Offer added")}
  catch(e){render();const a=el("slAddOff");if(a)a.focus({preventScroll:true});toast("Couldn't add the offer. Try again.")}
}
/* "Select offer" on a deal with no offer yet: its Services and its name ("<Person> · <Offer>") */
async function setOffer(id,svc){
  const D=derive();const p=D.P.find(x=>x.id===id);if(!p||S.ro||!SERVICES.includes(svc))return;
  const who=offWho(personGroup(p,D.P))||offPerson(p.name)||p.name;
  await saveRec("sp",id,{[SP.services]:[svc],[SP.deal]:who+" · "+svc});const t=el("slTab-"+id);if(t)t.focus({preventScroll:true})}
/* Delete this offer: only from the warning dialog's "Delete offer" */
async function delOffer(){
  const d=S.del;if(!d||d.busy)return;d.busy=true;render();
  try{await call("delete_records_for_table",{baseId:CB,tableId:T.sp,recordIds:[d.id]})}
  catch(e){if(S.del)S.del.busy=false;render();const g=el("slDelGo");if(g)g.focus({preventScroll:true});toast("Couldn't delete");return}
  const D=derive();const p=D.P.find(x=>x.id===d.id);const g=p?personGroup(p,D.P):[];const i=g.findIndex(x=>x.id===d.id);const nx=g[i+1]||g[i-1]||null;
  S.sp=S.sp.filter(r=>r._id!==d.id);S.del=null;
  leaveOffer();
  if(nx){S.openSp=nx.id;render();const t=el("slTab-"+nx.id);if(t)t.focus({preventScroll:true})}
  else{S.openSp=null;render();backToOpener()}
  toast("Offer deleted")}
function delClose(){if(!S.del)return;S.del=null;render();const m=el("slMore");if(m)m.focus({preventScroll:true})}
/* Send back to team: only from the dialog's "Send back"; the card leaves Kash's board when the save succeeds */
async function sendBack(){
  const b=S.back;if(!b||b.busy)return;b.busy=true;render();
  const ok=await saveRec("sp",b.id,{[SP.stage]:"Review"},true,true);
  if(!ok){if(S.back)S.back.busy=false;render();const g=el("slBackGo");if(g)g.focus({preventScroll:true});return}
  S.back=null;S.openSp=null;leaveOffer();render();backToOpener();toast("Sent back to the team")}
function backClose(){if(!S.back)return;S.back=null;render();const m=el("slBack");if(m)m.focus({preventScroll:true})}
/* the ⋯ menu next to ✕: one item, "Delete this offer" (a small menu on top of the window, like the pickers) */
function menuEl(){let m=el("slMenu");if(m)return m;m=document.createElement("div");m.id="slMenu";m.className="sl-menu";m.setAttribute("role","menu");m.hidden=true;document.body.appendChild(m);
  m.addEventListener("click",e=>{const it=e.target.closest("[data-mi]");if(!it)return;menuClose(false);if(it.dataset.mi==="del"&&S.openSp&&!S.ro){S.del={id:S.openSp,busy:false};render();const c=el("slDelC");if(c)c.focus({preventScroll:true})}});
  m.addEventListener("keydown",e=>{const its=[...m.querySelectorAll('[role="menuitem"]')];const i=its.indexOf(document.activeElement);
    if(e.key==="Escape"||e.key==="Tab"){e.preventDefault();menuClose(true)}
    else if(e.key==="ArrowDown"||e.key==="ArrowUp"||e.key==="Home"||e.key==="End"){e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?its.length-1:(i+(e.key==="ArrowDown"?1:-1)+its.length)%its.length;its[j].focus()}
    else return;e.stopPropagation()});
  return m}
function menuPlace(){const m=el("slMenu"),b=el("slMore");if(!m||m.hidden||!b)return;const r=b.getBoundingClientRect(),vw=document.documentElement.clientWidth,w=m.offsetWidth;
  m.style.left=Math.round(Math.max(8,Math.min(r.right-w,vw-w-8)))+"px";m.style.top=Math.round(r.bottom+6)+"px"}
function menuOpen(){const b=el("slMore");if(!b)return;pkClose(false);const m=menuEl();
  m.setAttribute("aria-labelledby","slMore");m.innerHTML=`<button type="button" role="menuitem" class="sl-mi dang" data-mi="del" tabindex="-1">${svg(TRASH_I,16)}Delete this offer</button>`;
  m.hidden=false;b.setAttribute("aria-expanded","true");b.setAttribute("aria-controls","slMenu");menuPlace();m.querySelector('[role="menuitem"]').focus({preventScroll:true})}
function menuClose(back){const m=el("slMenu");if(!m||m.hidden)return;m.hidden=true;m.innerHTML="";const b=el("slMore");if(b){b.setAttribute("aria-expanded","false");if(back)b.focus({preventScroll:true})}}
const menuIsOpen=()=>{const m=el("slMenu");return !!m&&!m.hidden};
/* after a redraw: keep the menu on the new ⋯ button, or close it when the button is gone */
function menuSync(){if(!menuIsOpen())return;const b=el("slMore");if(!b){menuClose(false);return}b.setAttribute("aria-expanded","true");menuPlace()}
document.addEventListener("pointerdown",e=>{if(!menuIsOpen())return;const m=el("slMenu"),b=el("slMore");if(m.contains(e.target)||(b&&b.contains(e.target)))return;menuClose(false)},true);
document.addEventListener("scroll",()=>{if(menuIsOpen())menuPlace()},true);
window.addEventListener("resize",()=>{if(menuIsOpen())menuPlace()});
/* hook into the page's tabs */
if(typeof showTab==="function"){const prevShow=showTab;showTab=function(t){prevShow(t);const v=el("v-sales");if(v)v.hidden=t!=="sales";const fab=el("slFab");if(fab)fab.hidden=t!=="sales"||S.ro;if(t==="sales"){if(el("asof"))el("asof").hidden=true;if(el("rvAsof"))el("rvAsof").hidden=true;load()}else{S.openId=S.openCl=S.openSp=S.openCt=S.openG=null;S.adding=false;S.drop=null;S.inAdd=null;S.ctEdit=null;S.ctDraft=null;S.del=null;if(el("slModal"))el("slModal").innerHTML="";pkClose(false);menuClose(false)}}}
{const hb=el("refreshBtn");if(hb)hb.addEventListener("click",()=>{if(S.loaded&&!S.loading)load(true)})}
if(location.hash==="#sales")showTab("sales");
})();
</script>
