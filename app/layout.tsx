import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeButton } from "@/components/ThemeButton";
import { META } from "@/lib/data";
import { relativeTime } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: {
    default: "India SWE Jobs — HFT & tech engineering roles",
    template: "%s · India SWE Jobs",
  },
  description:
    "Software-engineering roles in India across HFT/quant firms, AI labs, global tech and Indian product companies. Filter by city, level, discipline and walk-in interviews.",
  keywords: [
    "India software engineer jobs", "Bangalore SWE jobs", "HFT jobs India",
    "quant developer India", "walk-in interview", "fresher software jobs India",
  ],
  openGraph: {
    title: "India SWE Jobs — HFT & tech engineering roles",
    description:
      "Software-engineering roles in India across HFT/quant firms, AI labs, global tech and Indian product companies.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

const NAV = [
  { href: "/", label: "All roles" },
  { href: "/internships", label: "Internships" },
  { href: "/new-grad", label: "New grad / fresher" },
  { href: "/experienced", label: "Experienced" },
  { href: "/walkins", label: "Walk-ins" },
  { href: "/companies", label: "Companies" },
  { href: "/saved", label: "Saved" },
  { href: "/about", label: "About" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Set the theme before first paint, from the same localStorage key the
            reference site uses. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.dataset.theme='dark'}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">IN</span>
              India SWE Jobs
            </Link>
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>{n.label}</Link>
              ))}
            </nav>
            <div className="header-right">
              <a
                className="icon-btn"
                href="#filters"
                title="Filters"
                aria-label="Filters"
                style={{ display: "none" }}
              >
                ☰
              </a>
              <ThemeButton />
            </div>
          </div>
        </header>

        {children}

        <footer className="shell" style={{ paddingBottom: 40, color: "var(--muted)", fontSize: 12.5 }}>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>
              {META.counts.open_engineering.toLocaleString()} open engineering roles from {META.counts.sources} company boards · data
              refreshed {relativeTime(META.generated_at)}
            </span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
              <Link href="/about">About</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/contact">Contact</Link>
              <a href="/sitemap.xml">Sitemap</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
