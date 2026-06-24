import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "CausalFunnel Analytics",
  description: "Simple user analytics, session tracking, and heatmaps",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="brand">
                <div className="brand-mark" />
                <div>
                  <div className="brand-title">CausalFunnel Analytics</div>
                  <div className="brand-subtitle">Session tracking · Journey analysis · Heatmaps</div>
                </div>
              </div>

              <nav className="nav">
                <Link href="/sessions">Sessions</Link>
                <Link href="/heatmap">Heatmap</Link>
              </nav>
            </div>
          </header>

          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
