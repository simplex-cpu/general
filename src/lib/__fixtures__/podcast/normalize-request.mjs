export function normalizeRequest(body) {
  const errors = [];
  const fail = (field, message) => errors.push({field, message});
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const text = (x, max) => typeof x === 'string' && !!x.trim() && x.length <= max;
  const unknown = (o, allowed, path) => { if (object(o)) for (const key of Object.keys(o)) if (!allowed.includes(key)) fail(path + key, 'Unknown field.'); };
  if (!object(body)) return {valid:false, errors:[{field:'body',message:'Send one JSON object.'}]};
  unknown(body,['schema_version','job_id','source_id','source_url','transcript','speakers','counts','anti_ai_slop_rules','campaign_context'],'');
  if (body.schema_version !== '1.0') fail('schema_version','Must be 1.0.');
  if (!text(body.job_id,36) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.job_id)) fail('job_id','Use an application-generated UUID for this generation job.');
  if (!text(body.source_id,200)) fail('source_id','A source record ID is required.');
  if (body.source_url != null && (!text(body.source_url,2048) || !/^https:\/\/[^\s]+$/.test(body.source_url))) fail('source_url','Use an HTTPS reference URL or null. This workflow does not fetch it.');
  if (!text(body.anti_ai_slop_rules,20000)) fail('anti_ai_slop_rules','Supply the saved brand/general writing rules, up to 20,000 characters.');
  const counts = body.counts;
  if (!object(counts)) fail('counts','Supply broll, talking_clip, carousel and graphic counts.');
  else {
    unknown(counts,['broll','talking_clip','carousel','graphic'],'counts.');
    for (const key of ['broll','talking_clip']) if (!Number.isInteger(counts[key]) || counts[key]<0 || counts[key]>20) fail('counts.'+key,'Must be an integer from 0 to 20.');
    for (const key of ['carousel','graphic']) if (counts[key] !== 0) fail('counts.'+key,'Unsupported by this workflow. Must be 0; use a separate workflow.');
    if (Number.isInteger(counts.broll) && Number.isInteger(counts.talking_clip) && (counts.broll+counts.talking_clip<1 || counts.broll+counts.talking_clip>20)) fail('counts','Request 1–20 supported scripts in total.');
  }
  const speakers=body.speakers;
  const byId = new Map(), names = new Set();
  if (!Array.isArray(speakers) || !speakers.length || speakers.length>20) fail('speakers','Supply 1–20 speaker records.');
  else speakers.forEach((s,i)=>{
    const p='speakers['+i+'].';
    if (!object(s)) {fail(p,'Must be an object.');return;}
    unknown(s,['id','name','bio','role','attribution_verified'],p);
    if (!text(s.id,64) || !/^[A-Za-z0-9_-]+$/.test(s.id) || byId.has(s.id)) fail(p+'id','Use a unique ID containing letters, numbers, underscores or hyphens.');
    if (!text(s.name,160) || names.has(s.name.trim())) fail(p+'name','Supply a unique display name.');
    if (!text(s.bio,4000)) fail(p+'bio','A brief factual bio is required, up to 4,000 characters.');
    if (s.role != null && !text(s.role,100)) fail(p+'role','Use a role string or omit it.');
    if (s.attribution_verified !== undefined && typeof s.attribution_verified !== 'boolean') fail(p+'attribution_verified','Must be boolean. Default false.');
    byId.set(s.id,s);if(typeof s.name==='string')names.add(s.name.trim());
  });
  const transcript=body.transcript;
  const segments=transcript?.segments;
  if (!object(transcript)) fail('transcript','Supply a transcript object with timestamped segments.');
  else {
    unknown(transcript,['language','segments'],'transcript.');
    if (transcript.language !== undefined && !text(transcript.language,35)) fail('transcript.language','Use a language code or omit it.');
  }
  let prior=-1, characters=0;
  if (!Array.isArray(segments) || !segments.length || segments.length>10000) fail('transcript.segments','Supply 1–10,000 chronological segments.');
  else segments.forEach((s,i)=>{
    const p='transcript.segments['+i+'].';
    if(!object(s)){fail(p,'Must be an object.');return;}
    unknown(s,['start_ms','end_ms','speaker_id','text'],p);
    if (!Number.isInteger(s.start_ms) || !Number.isInteger(s.end_ms) || s.start_ms<0 || s.end_ms<=s.start_ms || s.end_ms>86400000) fail(p+'start_ms/end_ms','Use integer milliseconds, end > start, within 24 hours.');
    if (Number.isInteger(s.start_ms) && s.start_ms<prior) fail(p+'start_ms','Segments must be in chronological order.');
    prior=s.start_ms;
    if (!text(s.text,20000)) fail(p+'text','Supply verbatim spoken text, up to 20,000 characters per segment.');
    characters += typeof s.text==='string'?s.text.length:0;
    if (s.speaker_id !== null && !byId.has(s.speaker_id)) fail(p+'speaker_id','Use a supplied speaker ID or explicit null.');
  });
  if(characters>500000)fail('transcript','Maximum 500,000 transcript characters per job.');
  const c=body.campaign_context === undefined ? {} : body.campaign_context;
  if(!object(c))fail('campaign_context','Must be an object.');
  else {
    unknown(c,['audience','approved_cta','available_footage','release_status','previously_used_angles'],'campaign_context.');
    for(const key of ['audience','approved_cta','available_footage','release_status'])if(c[key]!=null&&!text(c[key],4000))fail('campaign_context.'+key,'Use nonempty text, null or omit.');
    if(c.previously_used_angles!==undefined&&(!Array.isArray(c.previously_used_angles)||c.previously_used_angles.length>100||c.previously_used_angles.some(x=>!text(x,1000))))fail('campaign_context.previously_used_angles','Supply up to 100 short angle descriptions.');
  }
  if(errors.length)return {valid:false,errors};
  const stamp=ms=>[Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(x=>String(x).padStart(2,'0')).join(':')+'.'+String(ms%1000).padStart(3,'0');
  const lineId=i=>'L'+String(i+1).padStart(5,'0');
  const ranges=[];
  segments.forEach((s,i)=>{
    const speaker=byId.get(s.speaker_id);
    if(!speaker?.attribution_verified)return;
    const last=ranges.at(-1);
    if(last&&last.speaker===speaker.name.trim()&&last.end_line_id===lineId(i-1))last.end_line_id=lineId(i);
    else ranges.push({start_line_id:lineId(i),end_line_id:lineId(i),speaker:speaker.name.trim()});
  });
  return {valid:true,errors:[],job_id:body.job_id,source_id:body.source_id,source_url:body.source_url??null,
    ANTI_AI_SLOP_RULES:body.anti_ai_slop_rules,
    TRANSCRIPT:segments.map(s=>'['+stamp(s.start_ms)+'-'+stamp(s.end_ms)+'] Speaker '+(s.speaker_id??'unknown')+': '+s.text.replace(/\s+/g,' ').trim()).join('\n'),
    SPEAKER_BIOS:speakers.map(s=>({name:s.name.trim(),role:s.role??'Participant',bio:s.bio})),
    SCRIPT_COUNTS:{BROLL:counts.broll,TALKING_CLIP:counts.talking_clip},
    OPTIONAL_CAMPAIGN_CONTEXT:{audience:c.audience??'Infer the likely audience from this episode; write for viewers unfamiliar with the conversation.',approved_cta:c.approved_cta??null,available_footage:c.available_footage??'Original podcast footage; verify camera angles and reactions.',release_status:c.release_status??null,previously_used_angles:c.previously_used_angles??[],verified_speaker_ranges:ranges,output_language:transcript.language??'same language as the transcript',source_notes:'Speaker IDs are supplied by the upstream transcript. Treat identities as unverified except for the explicit verified_speaker_ranges. A bio alone does not verify diarization.'},
    MODEL:'gpt-6-astra',REASONING_EFFORT:'low',EDITOR_REASONING_EFFORT:'low'};
}
