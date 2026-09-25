export const metadata = {
  title: "Showayeb Ahamed – Projects",
  description:
    "Explore projects developed by Showayeb Ahamed. Discover full-stack web applications, open-source software, desktop tools, and modern web development work.",
  keywords:
    "Showayeb Ahamed, web developer, software developer, front-end development, full-stack development, programming, coding, portfolio, web projects, JavaScript, React, HTML, CSS, NextJs, TailwindCSS, Bootstrap, responsive design, developer portfolio, UHSC, UHSCIAN",

  metadataBase: new URL("https://showayeb.dev"),

  alternates: {
    canonical: "https://showayeb.dev/project",
  },

  openGraph: {
    title: "Showayeb Ahamed – Projects",
    description:
      "Explore projects developed by Showayeb Ahamed. Discover full-stack web applications, open-source software, desktop tools, and modern web development work.",
    url: "https://showayeb.dev/project",
    siteName: "Showayeb Ahamed's Portfolio",
    images: [
      {
        url: "https://showayeb.dev/profile-pic.png",
        width: 1200,
        height: 630,
        alt: "Showayeb Ahamed's Projects Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Showayeb Ahamed – Projects",
    description:
      "Explore projects developed by Showayeb Ahamed. Discover full-stack web applications, open-source software, desktop tools, and modern web development work.",
    images: ["https://showayeb.dev/profile-pic.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

import portfolioData from "@/data/portfolio-data.json";

function getSocialLinks() {
  return portfolioData.socialLinksOnly || (portfolioData.social?.socials || []).map((s) => s.url);
}

export default function RootLayout({ children }) {
  const socialLinks = getSocialLinks();

  return (
    <>
      {children}
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
    </>
  );
}
