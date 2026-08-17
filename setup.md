# Project Setup Guide - Portfolio Website

This guide walks you through setting up and running your portfolio website from scratch, including database initialization, environment configuration, and local development.

This website utilizes a **build-time caching system** (`scripts/build-cache.js`) that downloads all database records (`projects`, `skills`, `social_data`, `profile_status`, `education`) and assets (icons, project images, README files, and institution logos) from Appwrite during the build phase. It also auto-generates `public/robots.txt` and `public/sitemap.xml`. This ensures that the application runs completely database-free and storage-free at runtime, providing blazing-fast load times and 0 runtime resource usage on Vercel.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v18.x or later recommended)
* **npm** or **pnpm**

---

## 2. Installation

1. Clone or download the repository to your local machine.
2. Open your terminal in the project root directory and run:
   ```bash
   npm install
   ```

---

## 3. Database & Storage Setup (Appwrite)

Your portfolio data and assets are fetched from Appwrite at build time and cached locally in `src/data/portfolio-data.json` and `public/`.

### Appwrite Configuration
1. Log in to your [Appwrite Console](https://cloud.appwrite.io).
2. Create a Project and Database (`profile_data`).
3. Create the collections: `projects`, `skills`, `social_data`, `profile_status`, `education`.
4. Create a Storage Bucket (`profile_data`) for uploading skill icons, project preview images, README markdown files, and institution logos.
5. Create an **API Key** with the following read permissions enabled under Scopes:
   - `documents.read` / `rows.read`
   - `collections.read` / `tables.read`
   - `files.read`
   - `buckets.read`

---

## 4. Environment Variables Configuration

Copy `example.env` and rename it to `.env.local`:
```bash
cp example.env .env.local
```

Fill in the variables in `.env.local`:

| Variable Name | Description |
| :--- | :--- |
| `APPWRITE_ENDPOINT` | Your Appwrite API Endpoint (e.g. `https://sgp.cloud.appwrite.io/v1`). |
| `APPWRITE_PROJECT_ID` | Your Appwrite Project ID. |
| `APPWRITE_API_KEY` | Your Appwrite API Key (Required at build time). |
| `APPWRITE_DATABASE_ID` | Your Appwrite Database ID (`profile_data`). |
| `APPWRITE_BUCKET_ID` | Your Appwrite Storage Bucket ID (`profile_data`). |
| `NEXT_PUBLIC_SHOW_PERCENT`| Toggles displaying skill percentage numbers (`true` or `false`). |
| `NEXT_PUBLIC_THEME` | Controls default theme behavior (`auto`, `dark`, `light`, `a_dark`, `a_light`). |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile CAPTCHA secret key. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Cloudflare Turnstile CAPTCHA site key. |
| `NEXT_PUBLIC_SITE_URL` | Your website domain URL (e.g. `https://showayeb.dev`). Used for generating `sitemap.xml`. |

---

## 5. Running Locally

Starting the development server automatically triggers the pre-build cache script (`scripts/build-cache.js`), which fetches your database data and images, auto-generates `robots.txt` & `sitemap.xml`, and starts Next.js:
```bash
npm run dev
# or build cache manually
npm run sa
```

---

## 6. Deploying to Vercel

1. Push your portfolio repository to GitHub.
2. In Vercel Dashboard, import your repository.
3. In **Environment Variables**, add `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, and `APPWRITE_BUCKET_ID`.
4. Vercel will run `scripts/build-cache.js` during the build step to fetch your data, generate `sitemap.xml` & `robots.txt`, and complete static site compilation.
