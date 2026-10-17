'use client';

import {useState, type FormEvent} from 'react';
import {diagnosticSample} from '@/domain/market/sample.mjs';

type Result = {
  sampleOutcome: string; assessedAt: string; validatorVersion: string;
  findings: {code: string; field: string | null}[]; integrationBlockers: string[];
  fieldChecks: {field: string; value: string | null; observedAt: string | null; ageSeconds: number | null}[];
  submittedSha256: string;
};
const labels: Record<string, string> = {
  CONTRACT_MISMATCH: 'פרטי המניה אינם תואמים לזהות הצפויה שהוזנה',
  INSTRUMENT_UNSUPPORTED: 'הבדיקה תומכת במניית USD בבורסת ניו יורק או נאסד״ק',
  PROVIDER_UNSUPPORTED: 'המקור המוצהר אינו IBKR', FEED_NOT_REALTIME: 'הנתונים אינם מסומנים כזמן אמת',
  COVERAGE_UNVERIFIED: 'כיסוי המסחר אינו ידוע', COVERAGE_UNSUPPORTED: 'הכיסוי אינו מתאים לבדיקה המבוקשת',
  INTERVAL_UNSUPPORTED: 'ציטוט מחיר אינו מוכיח נר יומי סופי', SESSION_INCOMPATIBLE: 'לא הוצהר על מסחר רגיל פתוח',
  MARKET_HALTED: 'הוצהרה הפסקת מסחר', MARKET_STATUS_UNVERIFIED: 'מצב המסחר אינו ידוע או אינו מתאים',
  RECEIPT_TIME_INVALID: 'זמן קבלת הנתונים חסר או אינו תקין', RECEIPT_TIME_FUTURE: 'זמן הקבלה נמצא בעתיד',
  PRICE_INVALID: 'המחיר חייב להיות מחרוזת עשרונית חיובית בטווח הנתמך', UNIT_SCALE_UNRESOLVED: 'יחידות המחיר או סדר הגודל דורשים בירור',
  OBSERVATION_TIME_MISSING_OR_INVALID: 'זמן המקור של השדה חסר או אינו תקין', OBSERVATION_TIME_FUTURE: 'זמן המקור נמצא בעתיד',
  PRICE_STALE: 'זמן המקור ישן מ־60 שניות', SOURCE_AFTER_RECEIPT: 'זמן המקור מאוחר מזמן הקבלה',
  FIELD_TIME_SEPARATION: 'פער הזמן בין השדות גדול מ־10 שניות', QUOTE_CROSSED: 'מחיר הקנייה גבוה ממחיר המכירה',
  SPREAD_REVIEW_REQUIRED: 'המרווח גדול מ־5%', QUOTE_CONFLICT: 'המחיר האחרון רחוק מאמצע המרווח',
  SOURCE_UNVERIFIED: 'נדרשת הוכחת מקור ישירה מהמחבר', ENTITLEMENT_UNVERIFIED: 'נדרש אישור שהבקשה כלולה ללא תשלום נוסף',
  INSTRUMENT_UNVERIFIED: 'נדרש אימות זהות המניה מהמקור', SESSION_CALENDAR_UNVERIFIED: 'נדרש לוח מסחר מאומת',
  CORPORATE_ACTIONS_UNVERIFIED: 'נדרש בירור התאמות ואירועי חברה',
};
const fieldLabels: Record<string, string> = {last: 'עסקה אחרונה', bid: 'קנייה', ask: 'מכירה'};

export function MarketDiagnostic() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function sample(kind: string) {
    setText(JSON.stringify(diagnosticSample(kind), null, 2)); setResult(null); setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setResult(null); setBusy(true);
    try {
      if (new TextEncoder().encode(text).byteLength > 16384) throw new Error('INPUT_TOO_LARGE');
      const response = await fetch('/api/market-data/diagnose', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: text,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : '';
      setError(code === 'AUTH_REQUIRED' ? 'החיבור פג. יש להיכנס שוב לחשבון.'
        : code === 'INPUT_TOO_LARGE' ? 'הקלט גדול מדי. המגבלה היא 16 KiB.'
        : 'הבדיקה לא הושלמה. יש לבדוק את מבנה הנתונים לפי הדוגמה ולנסות שוב.');
    } finally { setBusy(false); }
  }
  return <>
    <section className="page-heading"><div><p className="eyebrow">נתונים ומקורות</p><h1>בדיקת נתוני שוק</h1>
      <p className="subtitle">בדיקת מחירים, יחידות וזמנים לפני שילוב מקור נתונים.</p></div><span className="status-chip">בדיקה ידנית</span></section>
    <section className="panel"><h2>בדיקה מקומית של נתונים שהוזנו</h2>
      <p className="muted">אפשר לבדוק דוגמה או תיאור מצומצם ללא פרטי חשבון. המידע נבדק זמנית ואינו נשמר. אין להדביק סיסמאות, אסימוני גישה או מספרי חשבון.</p>
      <p className="muted">דוגמאות המחיר בדיוניות. הזנת מזהה אירוע או סימון זמן אמת אינה מאמתת מקור. תוצאת הבדיקה אינה הופכת את הנתונים למחיר שוק מאומת.</p>
      <div className="quick-links"><button type="button" className="quiet-button" disabled={busy} onClick={() => sample('consistent')}>דוגמה עקבית</button>
        <button type="button" className="quiet-button" disabled={busy} onClick={() => sample('scale')}>דוגמה לפער פי 100</button></div>
      <form className="stack-form" onSubmit={submit}>
        <label htmlFor="market-json">נתוני הבדיקה במבנה JSON <textarea id="market-json" dir="ltr" className="diagnostic-input" required maxLength={16384}
          spellCheck={false} value={text} disabled={busy} onChange={event => {setText(event.target.value); setResult(null); setError('');}}
          aria-describedby="market-json-help"/></label>
        <p id="market-json-help" className="muted">שלושת שדות המחיר דורשים מחיר כמחרוזת, יחידות וזמן מקור עם אזור זמן. זמן קבלה אינו מחליף זמן מקור. יש להתאים גם את הזהות הצפויה.</p>
        <button className="primary-button" disabled={busy}>{busy ? 'בודק…' : 'בדיקת הנתונים'}</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
    {result && <section className="panel diagnostic-result" aria-live="polite" aria-atomic="true">
      <h2>{result.sampleOutcome === 'HAZARDS_FOUND' ? 'נמצאו בעיות בנתונים' : 'לא נמצאו בעיות בדוגמה'}</h2>
      <p className="diagnostic-warning">אותות מסחר חיים ובדיקות סוף יום נשארים חסומים. אין בקשת נתונים מהברוקר ואין שינוי ביומן.</p>
      {result.findings.length > 0 && <ul className="diagnostic-findings">{result.findings.map((finding, i) => <li key={i}>
        {finding.field && <strong>{fieldLabels[finding.field]}: </strong>}{labels[finding.code] ?? finding.code}
        <small><bdi dir="ltr">{finding.code}</bdi></small></li>)}</ul>}
      <div className="table-wrap"><table><caption>מחירים וזמני מקור שהוזנו לבדיקה</caption><thead><tr><th>שדה</th><th>מחיר שהוזן</th><th>זמן מקור</th><th>גיל בשניות</th></tr></thead>
        <tbody>{result.fieldChecks.map(field => <tr key={field.field}><th scope="row">{fieldLabels[field.field]}</th>
          <td><bdi dir="ltr">{field.value ?? 'לא תקין'}</bdi></td><td><bdi dir="ltr">{field.observedAt ?? 'חסר או לא תקין'}</bdi></td>
          <td><bdi dir="ltr">{field.ageSeconds === null ? 'לא ידוע' : field.ageSeconds.toFixed(1)}</bdi></td></tr>)}</tbody></table></div>
      <h3>הוכחות שעדיין נדרשות לשימוש בנתונים</h3>
      <ul className="diagnostic-findings">{result.integrationBlockers.map(code => <li key={code}>{labels[code] ?? code}</li>)}</ul>
      <details><summary>פרטי הבדיקה</summary><p className="muted">הספים: גיל עד 60 שניות, סטיית שעון עד 5 שניות, פער בין שדות עד 10 שניות ומרווח עד 5%. אין תיקון אוטומטי של המחיר.</p>
        <p>זמן בדיקה: <bdi dir="ltr">{result.assessedAt}</bdi></p><p>גרסה: <bdi dir="ltr">{result.validatorVersion}</bdi></p>
        <p className="diagnostic-hash">SHA-256 לקלט בלבד: <bdi dir="ltr">{result.submittedSha256}</bdi></p><p className="muted">הגיבוב מתאר את הקלט שהוזן; הוא אינו הוכחת מקור.</p></details>
    </section>}
  </>;
}
