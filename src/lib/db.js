import portfolioData from "../data/portfolio-data.json";

export async function queryD1(sql, params = []) {
  const sqlLower = sql.toLowerCase();

  if (sqlLower.includes("from projects")) {
    // If querying a specific project by name
    if (sqlLower.includes("lower(name) = lower(?)")) {
      const name = params[0]?.toLowerCase();
      const project = portfolioData.projects.find(p => p.name.toLowerCase() === name);
      return project ? [project] : [];
    }
    return portfolioData.projects;
  }

  if (sqlLower.includes("from skills")) {
    return portfolioData.skills;
  }

  if (sqlLower.includes("from social_data")) {
    const list = [...portfolioData.social.socials];
    if (portfolioData.social.contact.hasEmail && portfolioData.social.contact.email) {
      list.push({
        name: "Email",
        platform: "Email",
        url: portfolioData.social.contact.email
      });
    }
    return list;
  }

  if (sqlLower.includes("from profile_status")) {
    return [{ status: portfolioData.status }];
  }

  throw new Error(`Mock queryD1: Unsupported SQL query: ${sql}`);
}

