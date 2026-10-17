'use client';
import {useState,type FormEvent} from 'react';
type Scenario={id:string;session_date:string;session_status:string;regular_close:string|null;source_note:string;version:number;is_current:boolean};
type Run={id:string;scenario_id:string;reason:string;due_at:string;deadline_at:string;state:string;row_version:number;timing:string};
type Data={assessedAt:string;scenarios:Scenario[];runs:Run[];blockers:string[];events:{scenario_id:string;action:string;created_at:string}[]};
const blockers:Record<string,string>={CALENDAR_UNVERIFIED:'לוח המסחר טרם אומת',BILLING_UNVERIFIED:'אופן החיוב בבקשות נתונים טרם אומת',RAW_SOURCE_UNVERIFIED:'קליטת פלט המקור הישיר טרם אומתה',PRICE_UNITS_AND_TIMES_UNVERIFIED:'יחידות המחיר וזמני המקור טרם אומתו',NATIVE_DISPATCH_UNVERIFIED:'הפעלה מתוזמנת ב־Codex טרם אומתה',INCLUDED_USAGE_CONTROLS_UNVERIFIED:'שימוש במכסה הכלולה בלבד טרם אומת',NOTIFICATION_RECEIPT_UNVERIFIED:'קבלת התראה בפועל טרם אומתה'};
const states:Record<string,string>={PENDING:'ממתין לתרגול ידני',BLOCKED_GATES:'חסום — חסרות הוכחות',EXPIRED_SUPPRESSED:'חלון הזמן חלף — לא יופק איתות',SUPERSEDED:'הוחלף בגרסת תרחיש חדשה',CANCELLED:'בוטל'};
const timings:Record<string,string>={UPCOMING:'המועד עדיין לפנינו',DUE:'בתוך חלון התרגול',EXPIRED:'חלון התרגול חלף'};
function time(value:string,zone='Asia/Jerusalem'){return new Intl.DateTimeFormat('he-IL',{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(new Date(value));}
export function MonitoringWorkspace({initialData}:{initialData:Data}){
 const [data,setData]=useState(initialData),[sessionDate,setSessionDate]=useState(''),[status,setStatus]=useState('OPEN'),[close,setClose]=useState('16:00'),[note,setNote]=useState(''),[ack,setAck]=useState(false);
 const [preview,setPreview]=useState<{reason:string;dueAt:string;deadlineAt:string}[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [pending,setPending]=useState<{payload:string;key:string}|null>(null);
 const current=data.scenarios.find(s=>s.session_date===sessionDate&&s.is_current);
 const body={sessionDate,sessionStatus:status,regularClose:status==='CLOSED'?null:close,sourceNote:note,expectedVersion:current?.version??0,acknowledgedRehearsal:ack};
 function load(date:string){const found=data.scenarios.find(s=>s.session_date===date&&s.is_current);setSessionDate(date);setStatus(found?.session_status??'OPEN');setClose(found?.regular_close??'16:00');setNote(found?.source_note??'');setAck(false);setPreview(null);}
 async function refresh(){const r=await fetch('/api/monitoring');const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d);}
 async function call(action:string,body:any){
  const payload=JSON.stringify({action,body}),key=pending?.payload===payload?pending.key:crypto.randomUUID();
  if(action!=='PREVIEW')setPending({payload,key});
  const r=await fetch('/api/monitoring',{method:'POST',headers:{'Content-Type':'application/json',...(action==='PREVIEW'?{}:{'Idempotency-Key':key})},body:payload});const d=await r.json();if(!r.ok)throw new Error(d.error);
  if(action!=='PREVIEW'){setPending(null);await refresh();}return d;
 }
 async function perform(work:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await work();}catch(e){const code=e instanceof Error?e.message:'';setError(code==='REVISION_CONFLICT'?'התרחיש השתנה. יש לרענן ולבדוק את הגרסה העדכנית.':code==='AUTH_REQUIRED'?'החיבור פג. יש להיכנס שוב לחשבון.':code==='REHEARSAL_LIMIT_REACHED'?'הגעת למגבלת היסטוריית התרגולים המקומית.':'הפעולה לא הושלמה. יש לבדוק את התאריך, שעת הסגירה ושדות התרחיש.');}finally{setBusy(false);}}
 async function save(event:FormEvent){event.preventDefault();await perform(async()=>{await call('SAVE_SCENARIO',body);setAck(false);setPreview(null);setNotice('התרחיש נשמר לתרגול. ניטור אוטומטי לא הופעל.');});}
 return <>
  <section className="page-heading"><div><p className="eyebrow">מועדים ומוכנות</p><h1>מועדי בדיקה וניטור</h1><p className="subtitle">תרגול מקומי של שני מועדי הבדיקה ושל חזרה לאחר הפסקה.</p></div><span className="status-chip">ניטור אוטומטי לא פעיל</span></section>
  <section className="panel"><h2>מה עדיין נדרש להפעלת ניטור</h2><p className="diagnostic-warning">לא בוצעה כאן בדיקת שוק מתוזמנת. אין תהליך רקע, בקשת מחיר, הפעלת Codex או שליחת התראה. התרגולים אינם מוכיחים קבלת נתונים או עבודה כשהאתר סגור.</p>
   <ul className="diagnostic-findings">{data.blockers.map(code=><li key={code}>{blockers[code]??code}</li>)}</ul>
   <p className="muted">המצב מוצג לפי השרת נכון ל־{time(data.assessedAt)} (ירושלים). לרענון המצב יש ללחוץ על רענון; אין בדיקה אוטומטית ברקע.</p>
  </section>
  <section className="panel"><h2>תרחיש ידני ליום מסחר</h2><p className="muted">תאריך היום ושעת הסגירה הם הנחות לתרגול. אין הסקה אוטומטית של ימי מסחר לפי יום בשבוע, ותאריך שלא הוזן נשאר ללא תרחיש. לוח אמיתי מחייב מקור מאומת.</p>
   <form className="stack-form" onSubmit={save}><div className="form-grid">
    <label htmlFor="monitoring-date">תאריך מושב המסחר בארה״ב<input id="monitoring-date" type="date" required min="2000-01-01" max="2099-12-31" value={sessionDate} disabled={busy} onChange={e=>load(e.target.value)}/></label>
    <label>הנחת מצב המסחר<select value={status} disabled={busy} onChange={e=>{setStatus(e.target.value);setPreview(null);setAck(false);}}><option value="OPEN">יום מסחר פתוח</option><option value="CLOSED">יום סגור — ללא בדיקות</option></select></label>
    {status==='OPEN'&&<label>סגירה רגילה בשעון ניו יורק<select value={close} disabled={busy} onChange={e=>{setClose(e.target.value);setPreview(null);setAck(false);}}><option value="16:00">16:00 — סגירה רגילה</option><option value="13:00">13:00 — הנחת סגירה מוקדמת</option></select></label>}
    <label>הסבר להנחות התרגול<input required maxLength={250} value={note} disabled={busy} onChange={e=>{setNote(e.target.value);setPreview(null);setAck(false);}} placeholder="למשל: תרחיש בדיוני לבדיקת שינוי שעון"/></label>
   </div>
   {current&&<p className="muted">לתאריך זה שמורה גרסה {current.version}. שינוי ההנחות ייצור גרסה חדשה וישמור את ההיסטוריה.</p>}
   <label className="check-label"><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>אני מבין שזה תרחיש ידני שלא מאמת את לוח המסחר ולא מפעיל ניטור.</label>
   <div className="quick-links"><button type="button" className="quiet-button" disabled={busy||!ack||!sessionDate||!note.trim()} onClick={()=>perform(async()=>{const result=await call('PREVIEW',body);setPreview(result.runs);})}>תצוגת מועדים לפני שמירה</button><button className="primary-button" disabled={busy||!ack}>שמירת תרחיש בלבד</button></div>
   </form>
   {preview&&<div className="review-result" aria-live="polite"><h3>מועדים מחושבים לתרגול</h3>{preview.length===0?<p>היום הוגדר כסגור; לא ייווצרו בדיקות.</p>:preview.map(run=><p key={run.reason}>{run.reason==='JERUSALEM_2240'?'22:40 ירושלים':'רבע שעה אחרי הסגירה'}: {time(run.dueAt)} (ירושלים) · <bdi dir="ltr">{run.dueAt}</bdi></p>)}</div>}
  </section>
  <div role="status" aria-live="polite">{notice&&<p className="save-notice">{notice}</p>}</div>{error&&<p role="alert" className="form-error">{error}</p>}
  <section className="panel"><h2>תרחישים ותוצאות תרגול</h2><p className="muted">חלון התרגול הוא חמש דקות. תרגול שמועדו הגיע חסום בשל ההוכחות החסרות; לאחר החלון הוא מסומן כפג בלי לשחזר איתות כניסה. בדיקת המועדים אינה בודקת מחירי שוק.</p>
   <div className="quick-links"><button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await refresh();setPreview(null);})}>רענון</button><button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{const result=await call('RECONCILE',{});setNotice(`תרגול המועדים הסתיים: ${result.blocked} נוספו כחסומים, ${result.expired} סומנו כפגי תוקף. לא הופק איתות.`);})}>בדיקת מועדי התרגול עכשיו</button></div>
   {data.scenarios.length===0&&<p className="muted">אין תרחישים שמורים; ניטור אינו מוגדר.</p>}
   <p className="muted">מוצגות עד 30 גרסאות תרחיש אחרונות מתוך עד 500 גרסאות שמורות.</p>
   {data.scenarios.slice(0,30).map(s=><article className="plan-item" key={s.id}><h3><bdi dir="ltr">{s.session_date}</bdi> · גרסה {s.version}{!s.is_current?' · הוחלפה':''}</h3><p className="review-text">{s.source_note}</p>
    <p className="muted">מקור: הנחות ידניות לתרגול בלבד {s.session_status==='CLOSED'?'· הוגדר יום סגור, ללא בדיקות':`· סגירה מוצהרת ${s.regular_close} בניו יורק`}</p>
    {s.is_current&&<button className="quiet-button" disabled={busy} onClick={()=>load(s.session_date)}>טעינת התרחיש לעריכה</button>}
    {s.session_status==='OPEN'&&<div className="table-wrap"><table><caption>שני המועדים לתרגול</caption><thead><tr><th>סוג הבדיקה</th><th>ירושלים</th><th>ניו יורק</th><th>מצב שמור</th><th>תזמון בזמן הרענון</th><th>פעולה</th></tr></thead><tbody>
     {data.runs.filter(run=>run.scenario_id===s.id).map(run=><tr key={run.id}><th scope="row">{run.reason==='JERUSALEM_2240'?'22:40 ירושלים':'סגירה + 15 דקות'}</th><td>{time(run.due_at)}</td><td>{time(run.due_at,'America/New_York')}</td><td>{states[run.state]}</td><td>{timings[run.timing]}</td><td>{['PENDING','BLOCKED_GATES'].includes(run.state)&&<button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await call('CANCEL_RUN',{runId:run.id,expectedRevision:run.row_version});setNotice('ריצת התרגול בוטלה.');})}>ביטול</button>}</td></tr>)}
    </tbody></table></div>}
    <details><summary>היסטוריית התרחיש</summary>{data.events.filter(event=>event.scenario_id===s.id).map((event,i)=><p className="muted" key={i}>{time(event.created_at)} · {event.action==='SCENARIO_CREATED'?'נשמר תרחיש':states[event.action]??event.action}</p>)}<p className="muted">מתוך 200 האירועים האחרונים.</p></details>
   </article>)}
  </section>
 </>;
}
