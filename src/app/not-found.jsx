import "./(frontend)/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import NotFoundClient from "@/components/NotFoundClient";
import { getPortfolioData } from "@/lib/getPortfolioData";
import NextTopLoader from "nextjs-toploader";

export const metadata = {
  title: "404: Page Not Found – Portfolio",
  description: "The requested page could not be found.",
};

export default async function RootNotFound() {
  const { profile } = await getPortfolioData();

  const configTheme = profile?.theme || process.env.NEXT_PUBLIC_THEME || "dark";
  let initialClass = "dark";
  if (configTheme === "light" || configTheme === "a_light") {
    initialClass = "light";
  }

  return (
    <html lang="en" className={initialClass} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
        <NextTopLoader color="#c2410c" showSpinner={false} />
        <ThemeProvider configTheme={configTheme}>
          <NotFoundClient />
        </ThemeProvider>
      </body>
    </html>
  );
}
