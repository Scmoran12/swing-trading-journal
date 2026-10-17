'use client';
import {useState,type FormEvent} from 'react';
type Job={id:string;state:string;row_version:number;attempt_count:number;receipt_attempts:number;expired:boolean;created_at:string;expires_at:string;confirmed_at:string|null;receipt_context:string|null};
type Data={preference:{enabled:boolean;row_version:number};tests:Job[];attempts:{test_id:string;attempt:number;outcome:string;error_code:string|null}[];testMode:boolean};
const labels:Record<string,string>={QUEUED:'ממתין להפעלה ידנית מהמחשב',LEASED:'ניסיון שליחה בתהליך',ACCEPTED:'המשלח קיבל את הבקשה — הקבלה טרם אושרה',FAILED:'השליחה נחסמה לפני הצגת ההתראה',UNKNOWN:'לא ידוע אם הוצגה התראה',RECEIPT_CONFIRMED:'קבלה אושרה לפי קוד ודיווח שלך',EXPIRED:'תוקף הבדיקה פג',CANCELLED:'בוטל'};
const contexts:Record<string,string>={WEBSITE_CLOSED:'לפי הדיווח: האתר היה סגור',WEBSITE_OPEN:'לפי הדיווח: האתר היה פתוח',UNKNOWN:'מצב האתר בזמן הקבלה לא צוין'};
const messages:Record<string,string>={DESKTOP_TESTS_DISABLED:'יש לאפשר בדיקות התראה לפני יצירת בדיקה.',REVISION_CONFLICT:'המצב השתנה. יש לרענן ולנסות שוב.',RECEIPT_CODE_INVALID:'יש להזין קוד בן שש ספרות מההתראה עצמה.',RECEIPT_UNAVAILABLE:'הבדיקה אינה זמינה לאישור קבלה. יש לרענן.',DESKTOP_TEST_LIMIT:'הגעת למגבלת הבדיקות המקומית.',DELIVERY_RETRY_UNAVAILABLE:'משלוח חוזר אינו זמין. תוצאה לא ידועה לא נשלחת שוב אוטומטית.',AUTH_REQUIRED:'החיבור פג. יש להיכנס מחדש.'};
export function DesktopTests({initialData}:{initialData:Data}){
 const [data,setData]=useState(initialData),[enabled,setEnabled]=useState(initialData.preference.enabled),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [code,setCode]=useState(''),[seen,setSeen]=useState(false),[context,setContext]=useState('UNKNOWN'),[selected,setSelected]=useState(''),[pending,setPending]=useState<{payload:string;key:string}|null>(null);
 async function refresh(){const r=await fetch('/api/desktop-tests');const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d);setEnabled(d.preference.enabled);}
 async function command(action:string,body:any){const payload=JSON.stringify({action,body}),key=pending?.payload===payload?pending.key:crypto.randomUUID();setPending({payload,key});const r=await fetch('/api/desktop-tests',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:payload});const d=await r.json();if(!r.ok)throw new Error(d.error);setPending(null);await refresh();return d;}
 async function perform(work:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await work();}catch(e){setError(messages[e instanceof Error?e.message:'']??'הפעולה לא הושלמה. יש לבדוק את המצב ולנסות שוב.');}finally{setBusy(false);}}
 async function ack(event:FormEvent,job:Job){event.preventDefault();await perform(async()=>{const result=await command('ACK',{testId:job.id,expectedRevision:job.row_version,code,seen,context});setCode('');setSeen(false);setSelected('');setNotice(result.verified?'הקוד תאם. נשמר דיווח הקבלה שלך, בנפרד מתוצאת המשלח.':result.locked?'מספר ניסיונות הקוד מוצה. אפשר לבטל וליצור בדיקה חדשה.':'הקוד לא תאם; יש לבדוק את הקוד מההתראה עצמה.');});}
 return <>
  <section className="page-heading"><div><p className="eyebrow">התראות מקומיות</p><h1>בדיקת התראה במחשב</h1><p className="subtitle">בדיקה חד־פעמית בלבד, עם אישור קבלה נפרד לפי קוד.</p></div><span className="status-chip">התראות מסחר אינן פעילות</span></section>
  <section className="panel"><h2>בדיקה יזומה עם Windows</h2><p className="muted">האתר יוצר בדיקה בתור מקומי. פקודה שתפעיל במחשב שולחת לכל היותר בדיקה אחת, גם כשהדפדפן סגור. אין תהליך קבוע, בקשת מחיר, הפעלת Codex או שירות בתשלום.</p>
   <p className="diagnostic-warning">קבלת בקשה במשלח אינה הוכחה שהתראה הוצגה. יש לאשר רק לאחר שראית את הקוד בהתראה של Windows. בדיקה זו אינה מפעילה ניטור, התראות עסקה או דחיפה ל־iPhone.</p>
   <form className="stack-form" onSubmit={e=>{e.preventDefault();perform(async()=>{await command('PREFERENCE',{enabled,expectedRevision:data.preference.row_version});setNotice('העדפת בדיקות ההתראה נשמרה.');});}}>
    <label className="check-label" htmlFor="desktop-tests-enabled"><input id="desktop-tests-enabled" type="checkbox" checked={enabled} disabled={busy} onChange={e=>setEnabled(e.target.checked)}/>אפשר בדיקות התראה ידניות בלבד. תוכן ההתראה יהיה כותרת בדיקה וקוד, ללא מידע מהיומן.</label><button className="primary-button" disabled={busy}>שמירת העדפה</button>
   </form>
   <div className="quick-links"><button className="quiet-button" disabled={busy||!data.preference.enabled} onClick={()=>perform(async()=>{await command('QUEUE',{});setNotice('בדיקה נשמרה לעשר דקות. יש להפעיל את המשלח הידני במחשב; עדיין לא נשלחה התראה.');})}>יצירת בדיקה חד־פעמית</button><button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await command('RECONCILE',{});})}>רענון תוצאות ותוקף</button></div>
   <p className="muted">כיבוי ההעדפה מבטל עבודה ממתינה. אי אפשר להחזיר התראה שכבר נמסרה ל־Windows או להבטיח עצירה באמצע שליחה.</p>
   <details><summary>איך מבצעים בדיקה כשהאתר סגור</summary><ol className="instruction-list"><li>שמור העדפה ויצר בדיקה. תוקפה עשר דקות.</li><li>סגור את כל לשוניות האתר והשאר את PostgreSQL ואת משתמש Windows פעילים.</li><li>בשיחת Codex המקומית בקש לזהות AppID קיים ורשום של PowerShell, ואז הפעל את הפקודה מההוראות המקומיות.</li><li>לאחר הופעת התראה, חזור לאתר והזן את הקוד שראית. קוד לא יוצג באתר או בפלט המשלח.</li></ol>
    <p className="muted">שם היישום בהתראה יהיה של המארח הרשום שבחרת, למשל PowerShell; הטקסט מסומן SwingPilot TEST ONLY. אין רישום יישום או שינוי הרשאות Windows אוטומטי.</p><pre dir="ltr">npm.cmd run desktop:test -- {data.testMode?'--test ':''}--app-id REGISTERED_APP_ID</pre>
   </details>
  </section>
  <div role="status" aria-live="polite">{notice&&<p className="save-notice">{notice}</p>}</div>{error&&<p className="form-error" role="alert">{error}</p>}
  <section className="panel"><h2>היסטוריית בדיקות וקבלה</h2><p className="muted">עד 200 בדיקות ו־300 ניסיונות. תוצאה לא ידועה לא נשלחת שוב אוטומטית; ייתכן שהודעה כבר הוצגה.</p>
   {data.tests.length===0&&<p className="muted">לא נוצרו בדיקות.</p>}
   {data.tests.map(job=><article className="plan-item" key={job.id}><h3>{labels[job.state]}</h3><p className="muted">נוצרה: <bdi dir="ltr">{job.created_at}</bdi> · ניסיונות שליחה {job.attempt_count}/3</p>
    {job.expired&&!['EXPIRED','RECEIPT_CONFIRMED','CANCELLED'].includes(job.state)&&<p className="diagnostic-warning">הזמן חלף. יש לרענן תוצאות; בדיקה שפג תוקפה לא תישלח.</p>}
    {job.confirmed_at&&<p>{contexts[job.receipt_context??'UNKNOWN']} · מועד אישור: <bdi dir="ltr">{job.confirmed_at}</bdi></p>}
    <div className="quick-links">
     {job.state==='FAILED'&&!job.expired&&job.attempt_count<3&&<button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await command('RETRY',{testId:job.id,expectedRevision:job.row_version});setNotice('נשמר ניסיון חוזר. יש להפעיל שוב את המשלח ידנית.');})}>הכנה לניסיון ידני חוזר</button>}
     {['QUEUED','LEASED','ACCEPTED','FAILED','UNKNOWN'].includes(job.state)&&<button className="quiet-button" disabled={busy} onClick={()=>perform(async()=>{await command('CANCEL',{testId:job.id,expectedRevision:job.row_version});})}>ביטול</button>}
     {['ACCEPTED','UNKNOWN'].includes(job.state)&&!job.expired&&job.receipt_attempts<5&&<button className="quiet-button" disabled={busy} onClick={()=>{setSelected(job.id);setCode('');setSeen(false);setContext('UNKNOWN');}}>ראיתי את קוד הבדיקה</button>}
    </div>
    {selected===job.id&&['ACCEPTED','UNKNOWN'].includes(job.state)&&<form className="stack-form" onSubmit={e=>ack(e,job)}><label htmlFor="desktop-receipt-code">קוד בן שש ספרות מההתראה<input id="desktop-receipt-code" dir="ltr" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} required value={code} disabled={busy} onChange={e=>setCode(e.target.value)}/></label>
     <label>מצב האתר כשקיבלת את ההתראה<select value={context} disabled={busy} onChange={e=>setContext(e.target.value)}><option value="UNKNOWN">לא צוין</option><option value="WEBSITE_CLOSED">כל לשוניות האתר היו סגורות</option><option value="WEBSITE_OPEN">האתר היה פתוח</option></select></label>
     <label className="check-label"><input type="checkbox" checked={seen} disabled={busy} onChange={e=>setSeen(e.target.checked)}/>ראיתי בפועל התראה של Windows עם הקוד הזה. אני מאשר דיווח קבלה אישי, לא רק הצלחת פקודה.</label><button className="primary-button" disabled={busy||!seen}>אישור קבלה לפי קוד</button></form>}
    <details><summary>ניסיונות המשלח</summary>{data.attempts.filter(a=>a.test_id===job.id).map(a=><p className="muted" key={a.attempt}>ניסיון {a.attempt}: {labels[a.outcome]} {a.error_code&&<bdi dir="ltr"> · {a.error_code}</bdi>}</p>)}</details>
   </article>)}
  </section>
 </>;
}
