import type {Metadata} from 'next';
import Link from 'next/link';
import {ownerPage} from '@/application/owner';
import {readinessForOwner} from '@/application/readiness.mjs';
export const metadata:Metadata={title:'תקינות מקומית'};
const labels:Record<string,string>={RESTRICTED_ROLES:'הרשאות תפקידי החיבור',ROLE_MEMBERSHIP:'הפרדת תפקידים',POSTGRES_LOOPBACK:'גישה מקומית ל־PostgreSQL',POSTGRES_VERSION:'גרסת PostgreSQL נתמכת',FORCED_OWNER_RLS:'בידוד רשומות לפי בעלים',NO_PUBLIC_TABLE_GRANTS:'טבלאות מוגנות מגישה כללית',NO_PUBLIC_DEFINER_EXECUTION:'פקודות מוגנות מגישה כללית',AUTHORITY_SEPARATION:'הפרדת נתוני כניסה ויומן',DATABASE_DIAGNOSTIC:'זמינות בדיקת מסד הנתונים'};
const gates:Record<string,string>={WINDOWS_BROWSER_ACCEPTANCE:'בדיקות שימוש באתר במחשב Windows',NATIVE_DATA_BILLING_PRICE_HISTORY:'נתוני שוק: זכאות ללא חיוב, יחידות, זמנים והיסטוריה',INCLUDED_USAGE_SPENDING_CONTROLS:'מכסה כלולה והגדרות הוצאות בחשבון',NATIVE_SCHEDULE_SLEEP_RECOVERY:'תזמון בפועל, שינה וחזרה לפעולה',ACTUAL_DESKTOP_RECEIPT:'קבלת התראה אמיתית ב־Windows',PRIVATE_IPHONE_HTTPS_PUSH:'גישה פרטית ומסירת התראה ב־iPhone',BACKUP_RESTORE:'גיבוי ושחזור — נדחו לפי בקשתך'};
export default async function Page(){
 const owner=await ownerPage(),report=await readinessForOwner(owner.id);
 return <>
  <section className="page-heading"><div><p className="eyebrow">הגדרות ותחזוקה</p><h1>תקינות מקומית</h1><p className="subtitle">בדיקות הרשאות וזמינות בלבד, עם הפרדה בין מצב שנבדק לקבלה שעדיין נדרשת.</p></div><span className="status-chip">v{report.sourceVersion}</span></section>
  <section className="panel"><h2>{report.localChecks==='PASSED'?'בדיקות מסד הנתונים עברו':'בדיקות מסד הנתונים דורשות טיפול'}</h2><p className="muted">מועד הבדיקה: <bdi dir="ltr">{report.observedAt}</bdi>. הרשומות הכספיות וההגדרות נשארות ללא שינוי. בדיקת הרשאות לקבצים וגיבובי מיגרציות זמינה רק באבחון המקומי מהמסוף.</p>
   <p className="diagnostic-warning">קבלה לשימוש אישי עדיין ממתינה. תוצאות המסך אינן הוכחה להתראות, לנתוני שוק, להגדרות חיוב, לתזמון או ליכולת שחזור.</p>
   <ul className="diagnostic-findings">{report.checks.map((c:{code:string;status:string})=><li key={c.code}>{c.code.startsWith('AUTH_')?'חיבור כניסה':'חיבור יומן'} · {labels[c.code.replace(/^(APP|AUTH)_/,'')]??'בדיקה מקומית'}: <strong>{c.status==='PASS'?'עבר':'נדרש טיפול'}</strong></li>)}</ul>
  </section>
  <section className="panel"><h2>מה עדיין נדרש במחשב</h2><p className="muted">מצבים שמרניים קבועים אלה אינם קוראים ראיות קבלה מהמחשב ואינם משתנים בעקבות בדיקת מסד הנתונים. יש לתעד ראיות מקומיות נפרדות.</p><ul className="diagnostic-findings">{report.externalAcceptance.map(g=><li key={g.code}>{gates[g.code]} · <bdi dir="ltr">{g.status}</bdi></li>)}</ul>
   <p className="muted">גיבוי ושחזור נשארים דחויים. האתר אינו מפעיל משימה, API, חיבור שוק, רכישה או חשיפה ברשת דרך המסך הזה.</p>
   <Link href="/settings" className="text-link">חזרה להגדרות</Link> · <Link href="/desktop-tests" className="text-link">בדיקת התראה ידנית</Link>
  </section>
 </>;
}
