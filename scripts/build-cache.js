const fs = require('fs');
const path = require('path');

// 1. Load environment variables from local .env files if present (for local dev)
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const envPath = path.join(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    const dotenvContent = fs.readFileSync(envPath, 'utf-8');
    dotenvContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (process.env[match[1]] === undefined) {
          process.env[match[1]] = value;
        }
      }
    });
  }
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
const apiToken = process.env.CLOUDFLARE_DB_API_TOKEN;
const storageApi = process.env.NEXT_PUBLIC_STORAGE_API || 'https://r2.showayeb.dev';

if (!accountId || !databaseId || !apiToken) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Missing Cloudflare D1 credentials!');
  console.error('Please configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_DB_API_TOKEN in your environment or .env.local.');
  process.exit(1);
}

// Helper to run query via D1 HTTP API
async function runQuery(sql, params = []) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`D1 query failed: ${response.status} ${errText}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 API error: ${JSON.stringify(data.errors)}`);
  }
  return data.result?.[0]?.results || [];
}

// Helper to download binary files
async function downloadFile(url, relativePath) {
  const localPath = path.join(__dirname, '../public', relativePath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  console.log(`Downloading asset: ${url} -> public${relativePath}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
}

// Helper to fetch text content (e.g. readmes)
async function fetchText(url) {
  console.log(`Fetching text: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch text ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function buildCache() {
  try {
    console.log('--- Starting Portfolio Cache Build ---');
    console.log(`Using Database ID: ${databaseId}`);
    console.log(`Using Storage API: ${storageApi}`);

    // 1. Fetch DB data in parallel
    const [rawProjects, rawSkills, rawSocial, rawStatus] = await Promise.all([
      runQuery("SELECT * FROM projects WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC"),
      runQuery("SELECT * FROM skills WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC"),
      runQuery("SELECT name, platform, url FROM social_data WHERE sort_order IS NOT NULL AND sort_order != 0 ORDER BY sort_order ASC, id ASC"),
      runQuery("SELECT status FROM profile_status LIMIT 1")
    ]);

    console.log(`Fetched database records: ${rawProjects.length} projects, ${rawSkills.length} skills, ${rawSocial.length} social items.`);

    // 2. Download and process project images and READMEs
    const projects = [];
    for (const project of rawProjects) {
      const p = { ...project };

      // Process project buttons if they are stored as JSON string
      if (typeof p.buttons === 'string') {
        try {
          p.buttons = JSON.parse(p.buttons);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      // Download project image if relative
      if (p.img && !p.img.startsWith('http')) {
        const cleanPath = p.img.startsWith('/') ? p.img : `/${p.img}`;
        try {
          await downloadFile(`${storageApi}${cleanPath}`, cleanPath);
        } catch (err) {
          console.error(`Warning: Failed to download image for project ${p.name}:`, err.message);
        }
      }

      // Fetch and download project README if defined
      if (p.readme) {
        const cleanPath = p.readme.startsWith('/') ? p.readme : `/${p.readme}`;
        try {
          // Download raw README markdown file to public
          await downloadFile(`${storageApi}${cleanPath}`, cleanPath);
          
          // Also fetch it to embed directly inside the JSON database
          p.readmeContent = await fetchText(`${storageApi}${cleanPath}`);
        } catch (err) {
          console.error(`Warning: Failed to process README for project ${p.name}:`, err.message);
          p.readmeContent = '';
        }
      } else {
        p.readmeContent = '';
      }

      projects.push(p);
    }

    // 3. Download skill icons
    const skills = [];
    for (const skill of rawSkills) {
      const s = { ...skill };

      // Process skill categories if stored as JSON string
      if (typeof s.categories === 'string') {
        try {
          s.categories = JSON.parse(s.categories);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      // Download skill icon if relative
      if (s.src && !s.src.startsWith('http')) {
        const cleanPath = s.src.startsWith('/') ? s.src : `/${s.src}`;
        try {
          await downloadFile(`${storageApi}${cleanPath}`, cleanPath);
        } catch (err) {
          console.error(`Warning: Failed to download icon for skill ${s.name}:`, err.message);
        }
      }

      skills.push(s);
    }

    // 4. Process social links
    let email = null;
    let hasEmail = false;
    const socials = [];
    const socialLinksOnly = [];

    for (const item of rawSocial) {
      socialLinksOnly.push(item.url);
      if (item.platform.toLowerCase() === 'email') {
        email = item.url;
        hasEmail = true;
      } else {
        socials.push({
          name: item.name,
          platform: item.platform,
          url: item.url
        });
      }
    }

    // 4.5 Download profile picture
    try {
      await downloadFile(`${storageApi}/profile_pic/profile-pic.png`, '/profile-pic.png');
    } catch (err) {
      console.error('Warning: Failed to download profile-pic.png:', err.message);
    }

    // 4.6 Download static sitemap, robots, and favicon
    const others = ['sitemap.xml', 'robots.txt', 'favicon.ico'];
    for (const file of others) {
      try {
        await downloadFile(`${storageApi}/others/${file}`, `/${file}`);
      } catch (err) {
        console.error(`Warning: Failed to download ${file}:`, err.message);
      }
    }

    // 5. Compile the consolidated portfolio data structure
    const portfolioCache = {
      projects,
      skills,
      social: {
        contact: { email, hasEmail },
        socials
      },
      status: rawStatus[0]?.status || null,
      socialLinksOnly
    };

    // 6. Write to local JSON file
    const cachePath = path.join(__dirname, '../src/data/portfolio-data.json');
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(portfolioCache, null, 2));

    console.log('\x1b[32m%s\x1b[0m', `Success! Saved consolidated portfolio data to ${cachePath}`);
    console.log('--- Cache Build Finished Successfully ---');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Cache Build Failed:', error.message);
    process.exit(1);
  }
}

buildCache();
