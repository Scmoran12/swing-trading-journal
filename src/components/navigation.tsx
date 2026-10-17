"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "סקירה כללית", icon: "dashboard" },
  { href: "/scanner", label: "סריקה שבועית", icon: "scan" },
  { href: "/research", label: "מחקר מניות", icon: "research" },
  { href: "/plans", label: "תוכניות מסחר", icon: "plans" },
  { href: "/reviews", label: "סקירות Codex", icon: "research" },
  { href: "/watchlist", label: "בהמתנה לכניסה", icon: "watchlist" },
  { href: "/positions", label: "עסקאות פעילות", icon: "positions" },
  { href: "/journal", label: "יומן מסחר", icon: "journal" },
  { href: "/analytics", label: "ביצועים ותובנות", icon: "analytics" },
  { href: "/monitoring", label: "מועדי בדיקה וניטור", icon: "clock" },
  { href: "/notifications", label: "מרכז ההתראות", icon: "clock" },
  { href: "/settings", label: "הגדרות", icon: "settings" },
  { href: "/readiness", label: "תקינות מקומית", icon: "shield" },
];

export function Navigation() {
  const pathname = usePathname();
  return <nav className="navigation" aria-label="ניווט ראשי">
    {items.map(item => <Link key={item.href} href={item.href} className={`nav-link${pathname === item.href ? " active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}>
      <Icon name={item.icon} /><span>{item.label}</span>
    </Link>)}
  </nav>;
}
