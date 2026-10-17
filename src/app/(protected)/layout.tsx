import{IdleGuard}from"@/components/idle-guard";
import Link from "next/link";
import {Navigation} from "@/components/navigation";
import {Icon} from "@/components/icon";
import {LogoutButton} from "@/components/auth-controls";
import {ownerPage} from "@/application/owner";
import {sourceVersion} from '@/domain/readiness/policy.mjs';
export const dynamic="force-dynamic";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const owner=await ownerPage();return (<div className="app-shell"><IdleGuard/>
        <aside className="sidebar">
          <Link href="/dashboard" className="brand" aria-label="SwingPilot AI — סקירה כללית">
            <span className="brand-symbol" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="m3 18 6-7 5 4 9-11M17 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span dir="ltr">SwingPilot<span className="brand-ai">AI</span></span>
          </Link>
          <p className="nav-caption">מרחב המסחר שלך</p>
          <Navigation />
          <div className="sidebar-footer"><Icon name="shield" /><div><strong>מרחב מקומי ואישי</strong><span>המידע נשאר בשליטתך</span></div></div>
        </aside>
        <div className="workspace">
          <header className="topbar"><span className="workspace-label">{owner.name} · יומן מקומי</span><div className="topbar-meta"><span className="status-chip">מצב ידני</span><LogoutButton/><span className="theme-label"><Icon name="moon" size={16} />מצב כהה</span></div></header>
          <main id="main-content" className="main-content">{children}</main>
          <footer className="page-footer"><span>SwingPilot AI <bdi dir="ltr">v{sourceVersion}</bdi></span><span>החלטות וביצוע עסקאות נשארים בידיך</span></footer>
        </div>
      </div>);}
