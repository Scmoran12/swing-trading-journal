import Link from "next/link";
export default function NotFound() {
  return <section className="panel empty-state"><p className="eyebrow">404</p><h1>העמוד לא נמצא</h1><p className="muted">אפשר לחזור למרחב העבודה ולהמשיך משם.</p><Link className="primary-button" href="/dashboard">חזרה לסקירה הכללית</Link></section>;
}
