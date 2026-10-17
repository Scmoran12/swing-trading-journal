'use client';
import {useState, type FormEvent} from 'react';
import Link from 'next/link';
type Plan = {id:string; symbol:string; row_version:string; version:number; entry:string; stop:string; target:string; thesis:string; invalidation:string};
type Finding = {category:string; factIds:string[]; observation:string; question:string};
type Job = {id:string; symbol:string; state:string; row_version:number; stale:boolean; created_at:string; input:any; input_sha256:string;
  response:null | {modelLabel:string; findings:Finding[]; limitations:string[]}};
type Data = {plans:Plan[]; jobs:Job[]; events:{job_id:string; action:string; state:string; created_at:string}[]};
const states:Record<string,string> = {AWAITING_CODEX:'ממתין לעבודה ידנית ב־Codex',PAUSED_USAGE:'מושהה — מגבלת שימוש',PAUSED_AUTH:'מושהה — נדרשת כניסה',PAUSED_BRIDGE:'מושהה — החיבור אינו זמין',REVIEW_READY:'תשובה ממתינה לעיונך',STALE_RESULT:'תשובה על נתונים שהשתנו',CANCELLED:'בוטל'};
const errors:Record<string,string> = {INPUT_TOO_LARGE:'התשובה גדולה מדי. יש לבקש תשובה קצרה יותר, עד 12 KiB במבנה JSON.',PLAN_UNAVAILABLE:'התוכנית הועברה לארכיון או שתוקפה פג. יש לבחור תוכנית עדכנית.',REVISION_CONFLICT:'הנתונים השתנו. יש לרענן ולבדוק שוב.',IDEMPOTENCY_CONFLICT:'מפתח הבקשה כבר שימש לתוכן אחר. יש לרענן.',REVIEW_BINDING_MISMATCH:'התשובה אינה תואמת לבקשה ולגיבוב שלה.',REVIEW_SCHEMA_INVALID:'מבנה התשובה אינו מתאים. יש להדביק את אובייקט ה־JSON בלבד.',REVIEW_REFERENCE_INVALID:'בתשובה יש הפניה לעובדה שאינה כלולה בבקשה.',REVIEW_LIMIT_REACHED:'הגעת למגבלת הבקשות המקומיות. אפשר לבטל בקשות ממתינות.',REVIEW_PACKET_UNAVAILABLE:'הבקשה מושהית, בוטלה או שהנתונים השתנו. יש לרענן.',REVIEW_CANNOT_RESUME:'הבקשה אינה ניתנת לחידוש. יש ליצור בקשה לגרסה העדכנית.',AUTH_REQUIRED:'החיבור פג. יש להיכנס מחדש.',REVIEW_PAUSED:'יש לחדש את הבקשה לפני יבוא התשובה.'};

export function CodexReviews({initialData}:{initialData:Data}) {
 const [data,setData]=useState(initialData),[planId,setPlanId]=useState(initialData.plans[0]?.id??'');
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState(''),[packet,setPacket]=useState(''),[response,setResponse]=useState(''),[reviewed,setReviewed]=useState(false);
 const [pending,setPending]=useState<{payload:string; key:string}|null>(null);
 const plan=data.plans.find(p=>p.id===planId);
 async function refresh(){const r=await fetch('/api/reviews');const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d);}
 async function send(action:string,body:any){
  const payload=JSON.stringify({action,body}),key=pending?.payload===payload?pending.key:crypto.randomUUID();setPending({payload,key});
  if(new TextEncoder().encode(payload).byteLength>16384)throw new Error('INPUT_TOO_LARGE');
  const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:payload});
  const d=await r.json();if(!r.ok)throw new Error(d.error);setPending(null);await refresh();return d;
 }
 async function perform(work:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await work();}catch(e){const code=e instanceof Error?e.message:'';setError(errors[code]??'הפעולה לא הושלמה. אפשר לנסות שוב או לרענן.');}finally{setBusy(false);}}
 async function create(event:FormEvent){event.preventDefault();if(!plan)return;await perform(async()=>{await send('CREATE',{planId:plan.id,expectedPlanRevision:Number(plan.row_version),sharingAcknowledged:consent});setConsent(false);setNotice('הבקשה נשמרה וממתינה לך. לא נשלח דבר ל־Codex.');});}
 async function loadPacket(job:Job){await perform(async()=>{const r=await fetch(`/api/reviews/${job.id}/packet`);const d=await r.json();if(!r.ok)throw new Error(d.error);setSelected(job.id);setPacket(d.packet);setResponse('');setReviewed(false);setNotice('אפשר לעיין בחבילה ולהעתיק אותה ידנית לשיחת Codex.');});}
 async function submit(event:FormEvent,job:Job){event.preventDefault();await perform(async()=>{let parsed;try{parsed=JSON.parse(response);}catch{throw new Error('REVIEW_SCHEMA_INVALID');}await send('SUBMIT',{jobId:job.id,expectedRevision:job.row_version,response:parsed,reviewAcknowledged:reviewed});setSelected('');setPacket('');setResponse('');setReviewed(false);setNotice('התשובה נשמרה כפרשנות לא מאומתת. התוכנית והעסקאות לא השתנו.');});}
 return <>
  <section className="page-heading"><div><p className="eyebrow">עבודה עם המנוי הקיים</p><h1>סקירות Codex</h1><p className="subtitle">בקשות שמורות לסקירת תוכנית ידנית, עם העתקה ויבוא בפיקוחך.</p></div><span className="status-chip">העברה ידנית</span></section>
  <section className="panel"><h2>בדיקת ניסוח והנחות בתוכנית</h2><p className="muted">האתר מכין בקשה מקומית בלבד. כדי לעבוד עליה, מעתיקים את החבילה לשיחת Codex במנוי הקיים ומייבאים את התשובה. אין הפעלה אוטומטית או חיבור ל־API.</p>
   <p className="diagnostic-warning">מחירי שוק, מחקר, איתותים והמלצות כניסה נשארים חסומים. הסקירה מתייחסת רק לרמות ולתזה שהזנת. המכסה והחיוב במנוי אינם נאכפים בידי האתר — יש להשתמש רק במכסה הכלולה ולעצור אם היא נגמרת.</p>
   {data.plans.length===0?<p>יש ליצור קודם <Link href="/plans" className="text-link">תוכנית ידנית</Link>.</p>:<form className="stack-form" onSubmit={create}>
    <label htmlFor="review-plan">תוכנית לסקירה<select id="review-plan" value={planId} disabled={busy} onChange={e=>{setPlanId(e.target.value);setConsent(false);}}>{data.plans.map(p=><option key={p.id} value={p.id}>{p.symbol} · גרסה {p.version}</option>)}</select></label>
    {plan&&<details><summary>מה ייכלל בחבילה</summary><p>סימול ובורסה, ענף, רמות כניסה/סטופ/יעד, הנחות עמלות והחלקה, תוקף, תזה ותנאי ביטול, ומזהי הגרסה. לא נכללים יתרת מזומן, עסקאות, רגשות, תמונות או פרטי חשבון.</p><p>כניסה {plan.entry} · סטופ {plan.stop} · יעד {plan.target}</p><p className="review-text">{plan.thesis}</p><p className="review-text">{plan.invalidation}</p></details>}
    <label className="check-label"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>בדקתי את התוכן שאבחר להעביר ידנית ל־Codex. אוציא ממנו פרטים פרטיים שאינם דרושים.</label>
    <button className="primary-button" disabled={busy||!consent}>שמירת בקשת סקירה</button>
   </form>}
  </section>
  <div role="status" aria-live="polite">{notice&&<p className="save-notice">{notice}</p>}</div>{error&&<p className="form-error" role="alert">{error}</p>}
  <section className="panel"><div className="section-heading"><h2>בקשות ותשובות</h2><button type="button" className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await refresh();setSelected('');setPacket('');setResponse('');setReviewed(false);})}>רענון</button></div>
   <p className="muted">מוצגות עד 100 הבקשות האחרונות. מצבי השהיה מתועדים לפי דיווחך; הם אינם בדיקה של החשבון ב־Codex.</p>
   {data.jobs.length===0&&<p className="muted">אין עדיין בקשות.</p>}
   {data.jobs.map(job=>{const terminal=['REVIEW_READY','STALE_RESULT','CANCELLED'].includes(job.state);return <article className="plan-item" key={job.id}>
    <h3>{job.symbol} · {states[job.state]}</h3><p className="muted"><bdi dir="ltr">{job.created_at}</bdi> · גרסת בקשה {job.row_version}</p>
    {job.stale&&<p className="diagnostic-warning">התוכנית או גרסת החשבון השתנו, או שתוקף התוכנית פג. התוכן שמור לעיון היסטורי בלבד.</p>}
    {!terminal&&<div className="quick-links">
     {job.state==='AWAITING_CODEX'&&!job.stale&&<button className="quiet-button" disabled={busy} onClick={()=>loadPacket(job)}>פתיחת החבילה ליבוא ידני</button>}
     {job.state==='AWAITING_CODEX'&&[['PAUSE_USAGE','השהיה — מגבלת שימוש'],['PAUSE_AUTH','השהיה — כניסה לחשבון'],['PAUSE_BRIDGE','השהיה — חיבור לא זמין']].map(([action,label])=><button className="quiet-button" key={action} disabled={busy} onClick={()=>perform(async()=>{await send(action,{jobId:job.id,expectedRevision:job.row_version});setSelected('');setPacket('');})}>{label}</button>)}
     {job.state.startsWith('PAUSED_')&&!job.stale&&<button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await send('RESUME',{jobId:job.id,expectedRevision:job.row_version});})}>חידוש ידני</button>}
     <button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await send('CANCEL',{jobId:job.id,expectedRevision:job.row_version});setSelected('');setPacket('');})}>ביטול בקשה</button>
    </div>}
    {selected===job.id&&job.state==='AWAITING_CODEX'&&<div className="review-transfer"><label>חבילה להעתקה ידנית<textarea readOnly dir="ltr" className="diagnostic-input" value={packet}/></label>
     <p className="muted">בחרו את כל טקסט החבילה והעתיקו לשיחת Codex. אין לשלוח דבר אם אין מכסה כלולה זמינה. אפשר לסגור את האתר ולחזור לבקשה מאוחר יותר.</p>
     <form className="stack-form" onSubmit={e=>submit(e,job)}><label htmlFor={`review-response-${job.id}`}>תשובת Codex במבנה JSON<textarea id={`review-response-${job.id}`} className="diagnostic-input" dir="ltr" value={response} disabled={busy} required maxLength={14000} onChange={e=>{setResponse(e.target.value);setReviewed(false);}}/></label>
      <label className="check-label"><input type="checkbox" checked={reviewed} disabled={busy} onChange={e=>setReviewed(e.target.checked)}/>קראתי את התשובה. זו פרשנות שלא אומתה, ושמירתה אינה אישור תוכנית או הוראת מסחר.</label><button className="primary-button" disabled={busy||!reviewed}>שמירת התשובה לעיון</button></form>
    </div>}
    {job.response&&<div className="review-result"><p className="diagnostic-warning">פרשנות מיובאת שלא אומתה · מקור ידני · התוכנית והיומן נשארים ללא שינוי</p><p>תווית מודל לפי הדיווח בתשובה: <bdi dir="ltr">{job.response.modelLabel}</bdi></p>
     {job.response.findings.map((finding,i)=><div className="history-item" key={i}><p className="review-text">{finding.observation}</p><p className="review-text">{finding.question}</p><small><bdi dir="ltr">{finding.factIds.join(', ')}</bdi></small></div>)}
     {job.response.findings.length===0&&<p>לא יובאו הערות. אין בכך אישור לאיכות התוכנית.</p>}
     <ul className="diagnostic-findings">{job.response.limitations.map((value,i)=><li className="review-text" key={i}>{value}</li>)}</ul>
    </div>}
    <details><summary>הנתונים המקוריים בבקשה</summary><p className="muted">אלו נתונים ידניים מהגרסה שנבחרה. שמירת החבילה אינה הוכחה שהיא נשלחה ל־Codex.</p>
      {job.input.facts.map((fact:{id:string;value:string})=><p className="review-text" key={fact.id}><bdi dir="ltr">{fact.id}</bdi>: {fact.value}</p>)}
    </details>
    <details><summary>היסטוריית הבקשה</summary>{data.events.filter(event=>event.job_id===job.id).map((event,i)=><p className="muted" key={i}><bdi dir="ltr">{event.created_at}</bdi> · {states[event.state]??event.state}</p>)}<p className="muted">מוצגים אירועים מתוך 200 האירועים האחרונים.</p></details>
   </article>;})}
  </section>
 </>;
}
