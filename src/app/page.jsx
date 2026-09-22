import ProfileCard from "@/components/ProfileCard";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import portfolioData from "@/data/portfolio-data.json";

export const dynamic = "force-static";

function parseButtonsSafely(buttons) {
  if (Array.isArray(buttons)) return buttons;
  if (typeof buttons === "string") {
    try {
      const parsed = JSON.parse(buttons);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export default function Home() {
  const projectData = (portfolioData.projects || [])
    .filter((p) => p.sort_order !== null && p.sort_order !== undefined && p.sort_order !== 0)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((p) => ({
      ...p,
      buttons: parseButtonsSafely(p.buttons),
    }));

  const skillsData = (portfolioData.skills || [])
    .filter((s) => s.sort_order !== null && s.sort_order !== undefined && s.sort_order !== 0)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((s) => ({
      ...s,
      categories: Array.isArray(s.categories)
        ? s.categories
        : typeof s.categories === "string"
        ? JSON.parse(s.categories)
        : [],
    }));

  const socialData = portfolioData.social || {
    contact: { email: null, hasEmail: false },
    socials: [],
  };

  const profileStatus = portfolioData.status || null;

  const educationData = (portfolioData.education || [])
    .filter((e) => e.sort_order !== null && e.sort_order !== undefined && e.sort_order !== 0)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-4 md:px-8 lg:px-12 py-8 min-h-screen">
      <ProfileCard socialData={socialData} profileStatus={profileStatus} />
      <main className="flex-1 space-y-6" id="about">
        <About educationData={educationData} />
        <Projects projectData={projectData} />
        <Skills skillsData={skillsData} />
      </main>
    </div>
  );
}
