import { Inter_Tight } from "next/font/google";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

import "nextra-theme-docs/style.css";
import "./brand.css";
import {
  DOCS_URL,
  GITHUB_DOCS_URL,
  GITHUB_ORG_URL,
  GITHUB_PROTOCOL_URL,
  SITE_URL,
  X_URL,
} from "./links";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(DOCS_URL),
  title: {
    default: "Nuvex Docs",
    template: "%s · Nuvex Docs",
  },
  description:
    "Documentation for the Nuvex protocol. Milestone 3: VRF proofs are verified on-chain. Fees are not charged.",
  icons: {
    icon: "/brand/logo.png",
  },
};

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M14.23 10.35 22.1 1.2h-1.87l-6.83 7.94L7.95 1.2H1.2l8.26 12.03L1.2 22.8h1.87l7.22-8.4 5.76 8.4H22.8l-8.57-12.45Zm-2.55 2.97-.84-1.2L4.14 2.64h2.87l5.38 7.7.84 1.2 7 10.02h-2.87l-5.68-8.24Z"
      />
    </svg>
  );
}

const navbar = (
  <Navbar
    logo={
      <span className="nuvex-lockup">
        <img src="/brand/logo.png" alt="" width={36} height={32} />
        <img src="/brand/wordmark.png" alt="Nuvex" width={112} height={14} />
      </span>
    }
    logoLink="/"
    projectLink={GITHUB_PROTOCOL_URL}
    chatLink={X_URL}
    chatIcon={<XIcon />}
  >
    <a href={SITE_URL} className="nuvex-nav-link">
      Website
    </a>
  </Navbar>
);

const footer = (
  <Footer>
    <div className="nuvex-footer">
      <p>
        Milestone 3. Pages describe what the programs do today and say when a feature is not
        implemented.
      </p>
      <nav aria-label="Nuvex links" className="nuvex-footer-links">
        <a href={SITE_URL}>Website</a>
        <a href={DOCS_URL}>Docs</a>
        <a href={GITHUB_ORG_URL}>GitHub</a>
        <a href={GITHUB_PROTOCOL_URL}>Protocol</a>
        <a href={GITHUB_DOCS_URL}>Docs source</a>
        <a href={X_URL}>X</a>
      </nav>
    </div>
  </Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className={`${interTight.variable} dark`} suppressHydrationWarning>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
          darkMode={false}
          docsRepositoryBase={GITHUB_DOCS_URL}
          editLink={null}
          feedback={{ content: null }}
          nextThemes={{ defaultTheme: "dark", forcedTheme: "dark" }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
