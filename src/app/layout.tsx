import type {Metadata,Viewport} from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"SwingPilot AI | יומן המסחר שלך",template:"%s | SwingPilot AI"},description:"יומן מסחר מקומי ואישי",robots:{index:false,follow:false}};
export const viewport:Viewport={themeColor:"#0b1019",colorScheme:"dark"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="he" dir="rtl" data-theme="dark"><body><a className="skip-link" href="#main-content">דילוג לתוכן</a>{children}</body></html>;}
