"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/sessions", label: "Sessions" },
  { href: "/heatmap", label: "Heatmap" },
];

function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary navigation">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-link nav-link-active" : "nav-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand" aria-label="CausalFunnel overview">
                <div className="brand-mark" aria-hidden="true" />

                <div>
                  <div className="brand-title">CausalFunnel</div>
                  <div className="brand-subtitle">
                    Product analytics workspace
                  </div>
                </div>
              </Link>

              <Navigation />

              <div className="collector-status" title="Backend collector: localhost:4000">
                <span className="collector-dot" aria-hidden="true" />
                <span>Collector local</span>
              </div>
            </div>
          </header>

          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}