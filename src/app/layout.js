import "./globals.css";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import NextTopLoader from "nextjs-toploader";
import { GoogleAnalytics } from "@next/third-parties/google";
import portfolioData from "@/data/portfolio-data.json";
import AutoUpdater from "@/components/AutoUpdater";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

function getSocialLinks() {
  return portfolioData.socialLinksOnly || (portfolioData.social?.socials || []).map((s) => s.url);
}

export const metadata = {
  title: "Showayeb Ahamed – Portfolio",
  description:
    "Welcome to Showayeb Ahamed's portfolio! Discover my skills in web development, design, and programming. Explore my projects and learn more about my work.",
  keywords:
    "Showayeb Ahamed, web developer, software developer, front-end development, full-stack development, programming, coding, portfolio, web projects, JavaScript, React, HTML, CSS, NextJs, TailwindCSS, Bootstrap, responsive design, developer portfolio, UHSC, UHSCIAN",

  metadataBase: new URL("https://showayeb.dev"),

  alternates: {
    canonical: "https://showayeb.dev",
  },

  openGraph: {
    title: "Showayeb Ahamed – Portfolio",
    description:
      "Welcome to Showayeb Ahamed's portfolio! Discover my skills in web development, design, and programming.",
    url: "https://showayeb.dev/",
    siteName: "Showayeb Ahamed's Portfolio",
    images: [
      {
        url: "https://showayeb.dev/profile-pic.png",
        width: 1200,
        height: 630,
        alt: "Showayeb Ahamed's Portfolio Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Showayeb Ahamed – Portfolio",
    description:
      "Welcome to Showayeb Ahamed's portfolio! Discover my skills in web development, design, and programming.",
    images: ["https://showayeb.dev/profile-pic.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "google-site-verification": "cvta9GHpsvTp2V2Vt8uFH3zrccVxxKvDzwI68IesufE",
  },
};
const gaId = process.env.GAID || "";

export default async function RootLayout({ children }) {
  const socialLinks = await getSocialLinks();
  const configTheme = process.env.NEXT_PUBLIC_THEME || "auto";

  let initialClass = "";
  if (configTheme === "dark" || configTheme === "a_dark") {
    initialClass = "dark";
  } else if (configTheme === "light" || configTheme === "a_light") {
    initialClass = "light";
  }

  return (
    <html lang="en" className={`${initialClass} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: "document",
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } }
                    ]
                  },
                  eagerness: "moderate"
                }
              ],
              prefetch: [
                {
                  source: "document",
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } }
                    ]
                  },
                  eagerness: "moderate"
                }
              ]
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const configTheme = "${configTheme}";
                let theme = "auto";
                if (configTheme === "dark") {
                  theme = "dark";
                } else if (configTheme === "light") {
                  theme = "light";
                } else {
                  if (configTheme === "auto") {
                    const stored = localStorage.getItem("theme");
                    if (stored) {
                      theme = stored;
                    }
                  } else if (configTheme === "a_dark") {
                    theme = "dark";
                  } else if (configTheme === "a_light") {
                    theme = "light";
                  }
                }
                const root = document.documentElement;
                root.classList.remove("light", "dark");
                if (theme === "auto") {
                  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
                  root.classList.add(prefersLight ? "light" : "dark");
                } else {
                  root.classList.add(theme);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={montserrat.className} suppressHydrationWarning>
        <ThemeProvider>
          <AutoUpdater currentBuildId={portfolioData.buildId} />
          <NextTopLoader />
          {children}
          <GoogleAnalytics gaId={gaId} />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Showayeb Ahamed",
              url: "https://showayeb.dev",
              image: "https://showayeb.dev/favicon.ico",
              sameAs: socialLinks,
            }),
          }}
        />
      </body>
    </html>
  );
}
