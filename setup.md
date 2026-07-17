# Project Setup Guide - Portfolio Website

This guide walks you through setting up and running your portfolio website from scratch, including database initialization, environment configuration, and local development.

This website utilizes a **build-time caching system** (`scripts/build-cache.js`) that downloads all database records (projects, skills, social links, profile status) and assets (sitemaps, robots.txt, icons, project images, and README files) from Cloudflare D1/R2 during the build phase. This ensures that the application runs completely database-free and storage-free at runtime, providing blazing-fast load times and 0 runtime resource usage on Vercel.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v18.x or later recommended)
* **npm** or **pnpm** (preferred for faster dependency resolution)

---

## 2. Installation

1. Clone or download the repository to your local machine.
2. Open your terminal in the project root directory and run:
   ```bash
   npm install
   # or if using pnpm
   pnpm install
   ```

---

## 3. Database Setup (Cloudflare D1)

Your portfolio data (projects, skills, social links, and profile status) is fetched from a Cloudflare D1 Database at build time and cached locally in a JSON file (`src/data/portfolio-data.json`).

### Step 1: Create a D1 Database
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **D1** in the left sidebar.
3. Click **Create Database** > **Create D1 Database**.
4. Enter a database name and click **Create**.
5. Copy your **Database ID** (UUID format) and **Account ID** (from your browser address bar or domain overview page).

### Step 2: Initialize Database Schema & Data
Go to the **Console** tab of your D1 database in the Cloudflare Dashboard (or run via Wrangler CLI) and execute the following SQL scripts:

#### A. Social Data Schema & Seed
```sql
DROP TABLE IF EXISTS social_data;

CREATE TABLE social_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER, 
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL
);

-- Example Insert:
INSERT INTO social_data (sort_order, name, platform, url) VALUES
  (1, 'GitHub', 'github', 'https://github.com/yourusername');
```

#### B. Skills Schema & Seed
```sql
DROP TABLE IF EXISTS skills;

CREATE TABLE skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER, 
  name TEXT NOT NULL,
  src TEXT NOT NULL,
  percent INTEGER NOT NULL,
  color TEXT NOT NULL,
  categories TEXT NOT NULL
);

-- Example Insert:
INSERT INTO skills (sort_order, name, src, percent, color, categories) VALUES
  (1, 'HTML5', '/icons/html5.svg', 95, '#e34f26', '["all", "front-end"]');
```

#### C. Projects Schema & Seed
```sql
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER, 
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  img TEXT NOT NULL,
  description TEXT NOT NULL,
  buttons TEXT NOT NULL,
  readme TEXT NOT NULL
);

-- Example Insert:
INSERT INTO projects (sort_order, name, title, img, description, buttons, readme) VALUES
  (1, 'sample-project', 'Sample Project', '/project/sample.png', 'A sample description of a project.', '[{"name": "GitHub", "link": "https://github.com/username/project"}]', '/readme/sample.md');
```

#### D. Profile Status Schema & Seed
```sql
DROP TABLE IF EXISTS profile_status;

CREATE TABLE profile_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL
);

-- Example Insert:
INSERT INTO profile_status (status) VALUES ('🚀 Working on cool stuff!');
```

---

## 4. Storage Setup (Cloudflare R2 or Custom Storage)

Your portfolio hosts assets like skill icons, project preview images, and project README markdown files, which are downloaded locally to the `public/` directory at build time. During local development and production builds on Vercel, the files are fetched from the R2 custom domain specified by `NEXT_PUBLIC_STORAGE_API` and cached on the disk. At runtime, they are served locally from Vercel without querying R2.

### Step 1: Create a Cloudflare R2 Bucket
1. Log in to your **Cloudflare Dashboard**.
2. Navigate to **R2 Object Storage** in the left sidebar.
3. Click **Create Bucket**.
4. Name your bucket (e.g. `portfolio-assets`) and click **Create Bucket**.

### Step 2: Configure Public Access / Custom Domain
By default, R2 buckets are private. You need to enable public access so that visitors can view your assets:
1. Inside your R2 bucket settings, click the **Settings** tab.
2. Under **Public Access**, choose one of the following:
   * **Custom Domain**: Connect a domain/subdomain (e.g., `r2.yourdomain.com`). This is the recommended approach.
   * **R2.dev Subdomain**: Enable the automatic `pub-xxxx.r2.dev` public access URL.
3. Keep this URL handy; you will assign it to `NEXT_PUBLIC_STORAGE_API` in your environment configuration.

### Step 3: Recommended Directory Structure
To match the default seeded D1 Database paths, organize your R2 bucket directories as follows:
* `/icons/` — Upload skill icons here (e.g., `/icons/html5.svg`).
* `/project/` — Upload project preview images here (e.g., `/project/sample.png`).
* `/readme/` — Upload project README markdown files here (e.g., `/readme/sample.md`).

---

## 5. Environment Variables Configuration

Copy `example.env` and rename it to `.env.local`:
```bash
cp example.env .env.local
```

Fill in the variables in `.env.local` (Note: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_DB_API_TOKEN` are required at **build time** so the pre-build caching script can connect to your database and download assets):

| Variable Name | Description |
| :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID (Required at build time). |
| `CLOUDFLARE_DATABASE_ID` | Your D1 Database ID (Required at build time). |
| `CLOUDFLARE_DB_API_TOKEN` | A Cloudflare API Token with `D1:Read` custom permissions (Required at build time). |
| `NEXT_PUBLIC_STORAGE_API` | The base URL of your Cloudflare R2 bucket where assets, readmes, and config files are hosted (Required at build time; e.g. `https://r2.yourdomain.com`). |
| `NEXT_PUBLIC_SHOW_PERCENT`| Toggles displaying the skill percentage number and circular progress rings (`true` or `false`). |
| `NEXT_PUBLIC_THEME` | Controls the theme behavior: `auto` (respects `localStorage`), `dark` (locks to dark mode, hides toggle), `light` (locks to light mode, hides toggle), `a_dark` (defaults to dark mode first, allows toggling), `a_light` (defaults to light mode first, allows toggling). |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile CAPTCHA secret key. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Cloudflare Turnstile CAPTCHA site key. |
| `EMAIL_USER` | SMTP username (e.g. your Gmail) for sending contact notifications. |
| `EMAIL_PASS` | SMTP App password for the SMTP user. |
| `GOOGLE_SUBMIT_FORM_URL` | URL to forward contact form submissions to a Google Form/Sheet backup. |
| `SITEMAP_PASS` | A security password token used to trigger sitemap generation. |
| `SITE_DOMAIN` | Your website domain URL (e.g. `https://showayeb.dev`). |

---

## 6. Running Locally

Starting the development server automatically triggers the pre-build cache script (`scripts/build-cache.js`), which reads your credentials from `.env.local`, downloads your database data and images, and starts Next.js in Turbopack mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the site.

---

## 7. Deploying to Vercel

1. Push your portfolio repository to GitHub (the downloaded assets and JSON cache are gitignored and will not be pushed to GitHub).
2. In the **Vercel Dashboard**, click **Add New** > **Project** and select your GitHub repository.
3. In the **Environment Variables** section, configure all variables from `.env.local` (especially `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_DB_API_TOKEN` so Vercel can run the cache downloader during build time).
4. Click **Deploy**. Vercel will run the cache downloader script during the build step and publish your optimized Next.js deployment.
