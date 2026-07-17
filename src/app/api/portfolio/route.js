import { NextResponse } from "next/server";
import portfolioData from "../../../data/portfolio-data.json";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    if (type === "projects") {
      return NextResponse.json(portfolioData.projects);
    }

    if (type === "skills") {
      return NextResponse.json(portfolioData.skills);
    }

    if (type === "social") {
      return NextResponse.json(portfolioData.social);
    }

    if (type === "status") {
      return NextResponse.json({ status: portfolioData.status });
    }

    if (type === "project") {
      const name = searchParams.get("name");
      if (!name) {
        return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
      }
      const project = portfolioData.projects.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ project, readmeContent: project.readmeContent || "" });
    }

    // Default: Return all data
    return NextResponse.json({
      projects: portfolioData.projects,
      skills: portfolioData.skills,
      social: portfolioData.social,
      status: portfolioData.status,
    });
  } catch (error) {
    console.error("API /api/portfolio Error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 });
  }
}

