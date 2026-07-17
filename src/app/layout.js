import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { queryD1 } from "../lib/db";

async function getSocialLinks() {
  try {
    const rawSocial = await queryD1(
      "SELECT url FROM social_data WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC"
    );
    return rawSocial.map((s) => s.url);
  } catch (error) {
    console.error("Error fetching social links in layout:", error);
    return [];
  }
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
    <html lang="en" className={initialClass} suppressHydrationWarning>
      <head>
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
      <body suppressHydrationWarning>
        <ThemeProvider>
          <NextTopLoader />
          {children}
          <Analytics />
          <SpeedInsights />
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
