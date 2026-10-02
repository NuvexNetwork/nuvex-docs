import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: {
    default: "Nuvex Docs",
    template: "%s · Nuvex Docs",
  },
  description: "Documentation for the Nuvex protocol.",
};

const navbar = <Navbar logo={<b>Nuvex</b>} />;
const footer = (
  <Footer>Milestone 0. Pages describe the design and say when a feature is not implemented.</Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout navbar={navbar} pageMap={await getPageMap()} footer={footer}>
          {children}
        </Layout>
      </body>
    </html>
  );
}
