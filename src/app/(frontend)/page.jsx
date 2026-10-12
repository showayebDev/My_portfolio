import ProfileCard from "@/components/ProfileCard";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import { getPortfolioData } from "@/lib/getPortfolioData";

export const revalidate = 3600;

export default async function Home() {
  const { profile, education, skills, categories, projects } = await getPortfolioData();

  const showPercent =
    typeof profile?.showPercent === "boolean"
      ? profile.showPercent
      : process.env.NEXT_PUBLIC_SHOW_PERCENT === "true";

  const featuredProjects = projects.filter((p) => p.featured !== false);

  return (
    <div className="relative min-h-screen overflow-visible">
      {/* Background Decorative Collage Tape & Stamp Accents */}
      <div className="hidden xl:block fixed top-6 right-8 pointer-events-none select-none z-0">
        <div className="washi-tape washi-tape-sage !w-[100px] !h-[24px] rotate-12 shadow-sm" />
      </div>


      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-4 md:px-8 lg:px-12 py-8 relative z-10">
        <ProfileCard profile={profile} />
        <main className="flex-1 space-y-8" id="about">
          <About educationData={education} />
          <Projects projectData={featuredProjects.length > 0 ? featuredProjects : projects} />
          <Skills
            skillsData={skills}
            categoriesData={categories}
            showPercent={showPercent}
          />

        </main>
      </div>
    </div>
  );
}
