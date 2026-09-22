export const metadata = {
  title: "Showayeb Ahamed – Projects",
  description:
    "Welcome to Showayeb Ahamed's projects! Discover my skills in web development, design, and programming. Explore my projects and learn more about my work.",
  keywords:
    "Showayeb Ahamed, web developer, software developer, front-end development, full-stack development, programming, coding, portfolio, web projects, JavaScript, React, HTML, CSS, NextJs, TailwindCSS, Bootstrap, responsive design, developer portfolio, UHSC, UHSCIAN",

  metadataBase: new URL("https://showayeb.dev"),

  alternates: {
    canonical: "https://showayeb.dev",
  },

  openGraph: {
    title: "Showayeb Ahamed – Projects",
    description:
      "Welcome to Showayeb Ahamed's projects! Discover my skills in web development, design, and programming.",
    url: "https://showayeb.dev/",
    siteName: "Showayeb Ahamed's projects",
    images: [
      {
        url: "https://showayeb.dev/profile-pic.jpg",
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
    title: "Showayeb Ahamed – Projects",
    description:
      "Welcome to Showayeb Ahamed's projects! Discover my skills in web development, design, and programming.",
    images: ["https://showayeb.dev/profile-pic.jpg"],
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
