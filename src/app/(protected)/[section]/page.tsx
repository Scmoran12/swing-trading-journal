import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const sections: Record<string, { title: string; subtitle: string; icon: IconName; features: string[] }> = {
  scanner: { title: "סריקה שבועית", subtitle: "מרחב לבחינת רעיונות חדשים ולבניית רשימה ממוקדת.", icon: "scan", features: ["סקירת צילומי מסך", "אישור סימולי מניות", "מחקר מועמדים לפי נתונים מאומתים"] },
  research: { title: "מחקר מניות", subtitle: "הקשר, נתונים ותזה לפני קבלת החלטה.", icon: "research", features: ["זיהוי המניה והבורסה", "נתונים עם מקור וזמן תצפית", "ריכוז המחקר ותוכניות קשורות"] },
  plans: { title: "תוכניות מסחר", subtitle: "להגדיר מראש למה נכנסים, מה הסיכון ומתי יוצאים.", icon: "plans", features: ["תזה ותנאי כניסה", "סטופ, גודל פוזיציה וסיכון", "אישור תוכנית ושמירת גרסאות"] },
  watchlist: { title: "בהמתנה לכניסה", subtitle: "המקום לתוכניות מאושרות שממתינות לתנאים שלהן.", icon: "watchlist", features: ["תנאים וסטטוס בדיקה", "תוקף התוכנית", "תיעוד רכישה ידנית לאחר ביצוע"] },
  positions: { title: "עסקאות פעילות", subtitle: "תמונה מסודרת של העסקאות וההחלטות לאורך הדרך.", icon: "positions", features: ["כמות, סיכון וסטופ עדכני", "הוספה ומימוש חלקי", "היסטוריית החלטות וביצועים"] },
  journal: { title: "יומן מסחר", subtitle: "התוכנית, הביצוע והתובנות שלך — לאורך זמן.", icon: "journal", features: ["תיעוד ביצועים ועמלות", "רגשות והערות בזמן ההחלטה", "תחקור וסגירת עסקה"] },
  analytics: { title: "ביצועים ותובנות", subtitle: "ללמוד מהמסחר המתועד, בלי להשלים נתונים חסרים.", icon: "analytics", features: ["תוצאות מבוססות יומן", "עמידה בתוכניות", "סקירה שבועית לפי נתונים מתועדים"] },
};

type Props = { params: Promise<{ section: string }> };
export function generateStaticParams() { return ["scanner"].map(section => ({ section })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: Object.hasOwn(sections, section) ? sections[section].title : "העמוד לא נמצא" };
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section)) notFound();
  const content = sections[section];
  return <><section className="page-heading"><div><p className="eyebrow">מרחב העבודה שלך</p><h1>{content.title}</h1><p className="subtitle">{content.subtitle}</p></div><span className="outlined-chip">תצוגת בסיס</span></section><section className="panel empty-state"><span className="empty-icon large"><Icon name={content.icon} size={38} /></span><h2>המרחב מוכן לשלב הבא</h2><p className="muted">המסך עדיין בבנייה. הזנת מידע ושמירתו ייפתחו לאחר הגדרת חשבון מקומי מאובטח.</p><ul className="feature-list" aria-label="יכולות מתוכננות">{content.features.map(feature => <li key={feature}><span className="feature-dot" />{feature}<span className="planned-label">בהמשך</span></li>)}</ul><Link href="/settings" className="primary-button">למצב ההגדרה <Icon name="arrow" size={17} /></Link></section></>;
}
