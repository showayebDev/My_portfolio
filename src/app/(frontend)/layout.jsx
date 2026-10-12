import "./globals.css";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { getPortfolioData } from "@/lib/getPortfolioData";
import NextTopLoader from "nextjs-toploader";
import BuildInvalidator from "@/components/BuildInvalidator";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata() {
  const { profile } = await getPortfolioData();
  const title = profile.siteTitle || (profile.name ? `${profile.name} – Portfolio` : "Portfolio");
  const description =
    profile.siteDescription ||
    "Welcome to my portfolio! Discover my skills, projects, and work in web development.";

  return {
    title,
    description,
    keywords: profile.name
      ? `${profile.name}, portfolio, web developer, software developer, Next.js, Payload CMS`
      : "portfolio, web developer, software developer, Next.js, Payload CMS",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: "/",
      siteName: title,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export default async function RootLayout({ children }) {
  const { profile } = await getPortfolioData();
  const configTheme = profile?.theme || process.env.NEXT_PUBLIC_THEME || "dark";

  let initialClass = "dark";
  if (configTheme === "light" || configTheme === "a_light") {
    initialClass = "light";
  }

  return (
    <html lang="en" className={`${initialClass} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
        <NextTopLoader
          color="#c2410c"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #c2410c,0 0 5px #c2410c"
        />
        <BuildInvalidator />
        <ThemeProvider configTheme={configTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
