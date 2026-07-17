import ProfileCard from "@/components/ProfileCard";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import { queryD1 } from "../lib/db";

export const runtime = "edge";

async function getProjectData() {
  try {
    const rawProjects = await queryD1("SELECT * FROM projects WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC");
    return rawProjects.map((p) => ({
      ...p,
      buttons: typeof p.buttons === "string" ? JSON.parse(p.buttons) : p.buttons,
    }));
  } catch (error) {
    console.error("Error fetching project data in Home:", error);
    return [];
  }
}

async function getSkillsData() {
  try {
    const rawSkills = await queryD1("SELECT * FROM skills WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC");
    return rawSkills.map((s) => ({
      ...s,
      categories: typeof s.categories === "string" ? JSON.parse(s.categories) : s.categories,
    }));
  } catch (error) {
    console.error("Error fetching skills data in Home:", error);
    return [];
  }
}

async function getSocialData() {
  try {
    const rawSocial = await queryD1("SELECT name, platform, url FROM social_data WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC");
    let email = null;
    let hasEmail = false;
    const socials = [];
    for (const item of rawSocial) {
      if (item.platform.toLowerCase() === "email") {
        email = item.url;
        hasEmail = true;
      } else {
        socials.push({
          name: item.name,
          platform: item.platform,
          url: item.url,
        });
      }
    }
    return {
      contact: { email, hasEmail },
      socials,
    };
  } catch (error) {
    console.error("Error fetching social data in Home:", error);
    return null;
  }
}

async function getProfileStatus() {
  try {
    const rawStatus = await queryD1("SELECT status FROM profile_status LIMIT 1");
    return rawStatus[0]?.status || null;
  } catch (error) {
    console.error("Error fetching profile status in Home:", error);
    return null;
  }
}

export default async function Home() {
  const [projectData, skillsData, socialData, profileStatus] = await Promise.all([
    getProjectData(),
    getSkillsData(),
    getSocialData(),
    getProfileStatus(),
  ]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-4 md:px-8 lg:px-12 py-8 min-h-screen">
      <ProfileCard socialData={socialData} profileStatus={profileStatus} />
      <main className="flex-1 space-y-6" id="about">
        <About />
        <Projects projectData={projectData} />
        <Skills skillsData={skillsData} />
      </main>
    </div>
  );
}
