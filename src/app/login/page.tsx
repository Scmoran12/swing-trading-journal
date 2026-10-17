import Link from "next/link";
import {LoginForm} from "@/components/auth-controls";
export default function Login(){return <main id="main-content" className="auth-page"><section className="panel auth-card"><p className="eyebrow" dir="ltr">SwingPilot AI</p><h1>ברוכים הבאים למרחב שלך</h1><p className="muted">כניסה לחשבון המקומי במחשב הזה.</p><LoginForm/><Link className="text-link" href="/recovery">עזרה בכניסה ושחזור מקומי</Link></section></main>;}
