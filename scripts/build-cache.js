const fs = require('fs');
const path = require('path');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { Client, Databases, Storage, Query } = require('node-appwrite');

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

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const bucketId = process.env.APPWRITE_BUCKET_ID;

if (!projectId || !apiKey) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Missing Appwrite credentials!');
  console.error('Please configure APPWRITE_PROJECT_ID and APPWRITE_API_KEY in your environment or .env.local.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setSelfSigned(true);

if (apiKey) {
  client.setKey(apiKey);
}

const databases = new Databases(client);
const storage = new Storage(client);

// Retry helper for network resilience
async function fetchWithRetry(fn, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Network notice: ${err.message}. Retrying (${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Helper to fetch documents from an Appwrite collection
async function fetchCollection(collectionId) {
  try {
    const response = await fetchWithRetry(() => databases.listDocuments(databaseId, collectionId, [
      Query.limit(100)
    ]));
    return response.documents || [];
  } catch (err) {
    throw new Error(`Appwrite fetch failed for collection '${collectionId}': ${err.message}`);
  }
}

// Helper to map all files in Appwrite Storage bucket
async function getStorageFilesMap() {
  try {
    const response = await fetchWithRetry(() => storage.listFiles(bucketId, [Query.limit(100)]));
    const map = new Map();
    for (const file of response.files || []) {
      map.set(file.name, file.$id);
    }
    return map;
  } catch (err) {
    console.warn('Warning: Failed to list Appwrite Storage files:', err.message);
    return new Map();
  }
}

// Helper to download an asset from Appwrite Storage
async function downloadAppwriteAsset(filesMap, possibleNames, getRelativePathFn) {
  let fileId = null;
  let matchedName = null;
  for (const name of possibleNames) {
    if (filesMap.has(name)) {
      fileId = filesMap.get(name);
      matchedName = name;
      break;
    }
  }

  if (!fileId) {
    return null;
  }

  const relativePath = typeof getRelativePathFn === 'function' ? getRelativePathFn(matchedName) : getRelativePathFn;
  const localPath = path.join(__dirname, '../public', relativePath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  console.log(`Downloading Appwrite asset '${matchedName}' -> public${relativePath}`);
  const buffer = await fetchWithRetry(() => storage.getFileDownload(bucketId, fileId));
  const buf = Buffer.from(buffer);
  fs.writeFileSync(localPath, buf);
  return { buffer: buf, matchedName, relativePath };
}

async function buildCache() {
  try {
    console.log('--- Starting Portfolio Cache Build ---');
    console.log(`Using Appwrite Endpoint: ${endpoint}`);
    console.log(`Using Project ID: ${projectId}`);
    console.log(`Using Database ID: ${databaseId}`);
    console.log(`Using Bucket ID: ${bucketId}`);

    // 1. Fetch DB data and Storage Files map sequentially for socket stability
    const rawProjectsDocs = await fetchCollection('projects');
    const rawSkillsDocs = await fetchCollection('skills');
    const rawSocialDocs = await fetchCollection('social_data');
    const rawStatusDocs = await fetchCollection('profile_status');
    const rawEducationDocs = await fetchCollection('education');
    const filesMap = await getStorageFilesMap();

    console.log(`Found ${filesMap.size} files in Appwrite Storage bucket '${bucketId}'.`);

    // Filter and sort items by sort_order
    const rawProjects = rawProjectsDocs
      .filter(doc => doc.sort_order !== null && doc.sort_order !== undefined && doc.sort_order !== 0)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const rawSkills = rawSkillsDocs
      .filter(doc => doc.sort_order !== null && doc.sort_order !== undefined && doc.sort_order !== 0)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const rawSocial = rawSocialDocs
      .filter(doc => doc.sort_order !== null && doc.sort_order !== undefined && doc.sort_order !== 0)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const rawEducation = rawEducationDocs
      .filter(doc => doc.sort_order !== null && doc.sort_order !== undefined && doc.sort_order !== 0)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    console.log(`Fetched Appwrite records: ${rawProjects.length} projects, ${rawSkills.length} skills, ${rawSocial.length} social items, ${rawEducation.length} education items.`);

    // 2. Download and process project images and READMEs from Appwrite Storage
    const projects = [];
    for (const project of rawProjects) {
      const p = { ...project };

      // Process project buttons if they are stored as JSON string
      if (typeof p.buttons === 'string') {
        try {
          p.buttons = JSON.parse(p.buttons);
          if (typeof p.buttons === 'string') {
            p.buttons = JSON.parse(p.buttons);
          }
        } catch (e) {
          p.buttons = [];
        }
      }
      if (!Array.isArray(p.buttons)) {
        p.buttons = [];
      }

      // Download project image from Appwrite Storage
      if (p.img) {
        const cleanPath = p.img.startsWith('/') ? p.img : `/${p.img}`;
        const baseName = path.basename(cleanPath);
        try {
          await downloadAppwriteAsset(filesMap, [baseName], cleanPath);
        } catch (err) {
          console.error(`Warning: Failed to download image for project ${p.name}:`, err.message);
        }
      }

      // Fetch and download project README from Appwrite Storage
      if (p.readme) {
        const cleanPath = p.readme.startsWith('/') ? p.readme : `/${p.readme}`;
        const baseName = path.basename(cleanPath);
        try {
          const res = await downloadAppwriteAsset(filesMap, [baseName], cleanPath);
          p.readmeContent = res && res.buffer ? res.buffer.toString('utf-8') : '';
        } catch (err) {
          console.error(`Warning: Failed to process README for project ${p.name}:`, err.message);
          p.readmeContent = '';
        }
      } else {
        p.readmeContent = '';
      }

      projects.push(p);
    }

    // 3. Download skill icons from Appwrite Storage
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

      // Download skill icon from Appwrite Storage to s.src path
      if (s.src) {
        const cleanPath = s.src.startsWith('/') ? s.src : `/${s.src}`;
        const baseName = path.basename(cleanPath);
        const iconVariant = baseName.startsWith('icon-') ? baseName : `icon-${baseName}`;
        const plainVariant = baseName.replace(/^icon-/, '');
        try {
          await downloadAppwriteAsset(filesMap, [iconVariant, plainVariant, baseName], cleanPath);
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

    // 4.5 Download profile picture from Appwrite Storage
    try {
      await downloadAppwriteAsset(filesMap, ['profile-pic.png', 'profile_pic.png'], '/profile-pic.png');
    } catch (err) {
      console.error('Warning: Failed to download profile-pic.png:', err.message);
    }

    // 4.6 Download static sitemap, robots, and favicon if present in Appwrite Storage
    const others = ['sitemap.xml', 'robots.txt', 'favicon.ico'];
    for (const file of others) {
      try {
        await downloadAppwriteAsset(filesMap, [file], `/${file}`);
      } catch (err) {
        // Optional static file
      }
    }

    // 4.7 Process Education items
    const education = [];
    for (const doc of rawEducation) {
      const edu = {
        name: doc.name,
        description: doc.description,
        direction: doc.direction,
        icon: doc.icon,
        src: doc.src || null,
        sort_order: doc.sort_order
      };

      // Download education logo from Appwrite Storage if src or icon is an image path
      const logoPath = edu.src || (edu.icon && (edu.icon.startsWith('/') || edu.icon.includes('.')) ? edu.icon : null);
      if (logoPath) {
        const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
        const baseName = path.basename(cleanPath);
        try {
          await downloadAppwriteAsset(filesMap, [baseName], cleanPath);
        } catch (err) {
          console.error(`Warning: Failed to download logo for education ${edu.name}:`, err.message);
        }
      }

      education.push(edu);
    }

    // 5. Compile the consolidated portfolio data structure
    const portfolioCache = {
      projects,
      skills,
      social: {
        contact: { email, hasEmail },
        socials
      },
      status: rawStatusDocs[0]?.status || null,
      education,
      socialLinksOnly
    };

    // 6. Write consolidated portfolio-data.json
    const outputJsonPath = path.join(__dirname, '../src/data/portfolio-data.json');
    const publicDir = path.join(__dirname, '../public');
    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
    fs.writeFileSync(outputJsonPath, JSON.stringify(portfolioCache, null, 2), 'utf8');
    console.log(`Success! Saved consolidated portfolio data to ${outputJsonPath}`);

    // 7. Auto-generate robots.txt & sitemap.xml
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://showayeb.dev').replace(/\/+$/, '');
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate public/robots.txt
    const robotsTxtContent = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxtContent, 'utf8');
    console.log(`Generated public/robots.txt`);

    // Generate public/sitemap.xml
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/project`, priority: '0.8', changefreq: 'weekly' }
    ];

    const projectUrls = projects.map(p => ({
      loc: `${baseUrl}/project/${encodeURIComponent(p.name)}`,
      priority: '0.7',
      changefreq: 'monthly'
    }));

    const allUrls = [...staticUrls, ...projectUrls];

    const escapeXml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const sitemapXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>\n`;

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXmlContent, 'utf8');
    console.log(`Generated public/sitemap.xml with ${allUrls.length} URLs.`);
    console.log('--- Cache Build Finished Successfully ---');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Cache Build Failed:', error.message);
    process.exit(1);
  }
}

buildCache();
