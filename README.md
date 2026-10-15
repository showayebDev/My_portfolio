# 🌟 Showayeb Ahamed — Developer Portfolio & CMS

<p align="center">
  <img src="https://user-images.githubusercontent.com/18350557/176309783-0785949b-9127-417c-8b55-ab5a4333674e.gif" width="36" alt="Hi" />
  <br />
  <strong>A high-performance, full-stack personal portfolio and content management system built with Next.js 16, React 19, Payload CMS 3.0, Tailwind CSS v4, and dual PostgreSQL / MongoDB database support.</strong>
</p>

<p align="center">
  <a href="https://showayeb.dev"><img src="https://img.shields.io/badge/Live_Site-showayeb.dev-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Site" /></a>
  <a href="https://github.com/showayebDev"><img src="https://img.shields.io/badge/GitHub-showayebDev-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <a href="mailto:me@showayeb.dev"><img src="https://img.shields.io/badge/Contact-me%40showayeb.dev-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
</p>

---

## ⚡ Overview

This repository hosts the source code for **Showayeb Ahamed's** personal portfolio. It is engineered from the ground up for lightning-fast page transitions, modern collage & washi-tape aesthetics, flexible headless content management, and enterprise-grade infrastructure flexibility.

### 🚀 Key Highlights

* **Next.js 16 (App Router) & React 19:** Built with Server Components, optimized standalone output, and client-side micro-animations.
* **Payload CMS 3.0:** Native, code-first headless CMS integrated directly into the Next.js application at `/admin`.
* **Universal Database Architecture (SQL & NoSQL):** Seamlessly auto-detects and connects to either **PostgreSQL** (Neon, Supabase, local Docker) or **MongoDB** (Atlas, local) from a single `DATABASE_URL` string, featuring auto-bootstrapping for blank PostgreSQL databases.
* **Cloudflare R2 / AWS S3 / MinIO Storage:** Cloud & self-hosted object storage with folder prefixes (`projects/`, `icons/`, `profile/`, `media/`) and fallback handling.
* **Full-Stack Docker Compose:** One-command local deployment spinning up the Next.js app, PostgreSQL 16 database, MinIO S3-compatible storage, and an automated bucket provisioner.
* **Built-in Migration & Backup Center:** Self-hosted migration suite at `/admin/migration` supporting direct database cloning, JSON dump export/import with cross-database ID translation, and cloud-to-cloud media bucket transfers.
* **Zero-Latency Route & Image Prefetching:** Custom predictive prefetching utility that pre-caches routes and hero images upon hover, with automatic cache invalidation on new deployments.
* **Centralized Drag-and-Drop Project Ordering:** Custom project display order on both the Homepage and `/project` archive page managed directly via relationship fields in `Profile & Settings`.

---

## 🛠️ Tech Stack

### Frontend & UI
* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components, Standalone)
* **Library:** [React 19](https://react.org/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animations:** [GSAP 3](https://greensock.com/gsap/) & Custom CSS Micro-interactions
* **Icons:** [React Icons](https://react-icons.github.io/react-icons/)
* **Progress Bar:** [nextjs-toploader](https://github.com/TheSGJ/nextjs-toploader)

### Backend & Headless CMS
* **CMS Engine:** [Payload CMS 3.0](https://payloadcms.com/)
* **Rich Text / Documentation:** [@payloadcms/richtext-lexical](https://payloadcms.com/docs/lexical/overview) & [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor)
* **Markdown Rendering:** [Marked](https://marked.js.org/) & [Highlight.js](https://highlightjs.org/)

### Databases
* **SQL:** [PostgreSQL](https://www.postgresql.org/) via `@payloadcms/db-postgres` & `pg`
* **NoSQL:** [MongoDB](https://www.mongodb.com/) via `@payloadcms/db-mongodb`

### Object Storage & DevOps
* **Storage:** [Cloudflare R2](https://www.cloudflare.com/products/r2/) / [AWS S3](https://aws.amazon.com/s3/) / [MinIO](https://min.io/) via `@payloadcms/storage-s3` & `@aws-sdk/client-s3`
* **Containerization:** [Docker](https://www.docker.com/) multi-stage standalone build & [Docker Compose](https://docs.docker.com/compose/)
* **Backups:** [JSZip](https://stuk.github.io/jszip/) for media bundle exports

---

## ⚙️ Getting Started

You can run the project either via **Docker** (recommended for zero-dependency local setup) or directly with **Node.js**.

---

### Method 1: All-in-One Full Stack with Docker (Recommended)

Run the entire application along with local **PostgreSQL** and **MinIO S3** object storage in Docker containers.

#### 1. Setup Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default values in `.env` are already configured for the local Docker stack:

```ini
PAYLOAD_SECRET=4f3b0c6e3fefc7e0217b4d5c89a0
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# PostgreSQL Service Database URL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/portfolio?sslmode=disable

# MinIO S3 Object Storage Configuration
S3_BUCKET=my-portfolio
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://s3:9000
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=http://localhost:9000/my-portfolio
```

#### 2. Start the Stack

```bash
docker compose -f docker-compose.full.yml up -d
```

This single command starts:
1. **`postgres`** — PostgreSQL 16 database with health check.
2. **`s3`** — MinIO S3-compatible object storage server.
3. **`create-bucket`** — Automated init container that creates the `my-portfolio` bucket with public read access.
4. **`app`** — Next.js 16 + Payload CMS production container.

#### 3. Access Services

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Portfolio Website** | [http://localhost:3000](http://localhost:3000) | Live frontend |
| **Payload Admin Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | First visit prompts to create an admin user |
| **MinIO Web Console** | [http://localhost:9001](http://localhost:9001) | **User:** `minioadmin` &bull; **Password:** `minioadmin` |
| **MinIO S3 API** | [http://localhost:9000](http://localhost:9000) | S3 endpoint used by media uploads |
| **PostgreSQL** | `localhost:5432` | **User:** `postgres` &bull; **Password:** `postgres` &bull; **DB:** `portfolio` |

#### Useful Docker Commands

```bash
# View app logs in real time
docker compose -f docker-compose.full.yml logs -f app

# Stop the entire stack
docker compose -f docker-compose.full.yml down

# Stop and delete persistent data volumes (resets DB & S3)
docker compose -f docker-compose.full.yml down -v
```

---

### Method 2: Running with Node.js (Local Development)

#### Prerequisites
* **Node.js:** `>= 20.18.1`
* **Package Manager:** `npm`, `pnpm`, or `bun`
* **Database:** Remote PostgreSQL (e.g. [Neon](https://neon.tech/), [Supabase](https://supabase.com/)) or MongoDB (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
* **Object Storage (Optional):** [Cloudflare R2](https://www.cloudflare.com/products/r2/) or [AWS S3](https://aws.amazon.com/s3/)

#### 1. Clone & Install Dependencies

```bash
git clone https://github.com/showayebDev/My_portfolio.git
cd My_portfolio
npm install
```

#### 2. Configure `.env` for Remote Services

```env
PAYLOAD_SECRET=your-random-32-character-secret-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Remote PostgreSQL (Neon/Supabase)
DATABASE_URL="postgresql://username:password@ep-your-db.neon.tech/neondb?sslmode=require"

# Cloudflare R2 / AWS S3
S3_BUCKET=my-portfolio
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=https://pub-xxxxxx.r2.dev
```

#### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  
Access the CMS admin panel at [http://localhost:3000/admin](http://localhost:3000/admin).

---

### Method 3: Standalone App Docker (Cloud DB & S3)

If you use remote cloud databases (Neon/Supabase) and Cloudflare R2:

```bash
docker compose up -d
```

This builds and launches only the `app` container connected to your external services specified in `.env`.

---

## 📦 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **`npm run dev`** | `next dev` | Generates build-hash and starts Next.js in development mode with HMR. |
| **`npm run build`** | `next build` | Cleans locks, generates version metadata, and compiles production build. |
| **`npm run start`** | `next start` | Runs the compiled production server. |
| **`npm run test`** | `vitest run` | Runs unit & integration test suites. |
| **`npm run lint`** | `eslint .` | Runs ESLint across the codebase. |
| **`npm run generate:types`** | `payload generate:types` | Regenerates TypeScript definitions for all collections and globals. |

---

## 🔄 Migration & Backup Suite

The application includes a self-hosted **Migration & Backup Center** accessible in the admin panel at `/admin/migration`:

1. **Direct Database Migration:** Copy all collections and globals directly from your active database to an external PostgreSQL or MongoDB database without changing configuration files.
2. **JSON Dump Export & Import:** Download full snapshots of your portfolio data as structured JSON files with automated cross-database ID translation between MongoDB string `ObjectId`s and PostgreSQL serial `integer` IDs.
3. **Storage Bucket Transfer:** Perform cloud-to-cloud byte transfers directly between Cloudflare R2, AWS S3, and MinIO buckets while preserving folder prefixes.
4. **Media Backup (ZIP):** Download all uploaded media files packaged into a structured ZIP archive.

---

## 👤 Author

**Showayeb Ahamed**
* 🌍 Location: Dhaka, Bangladesh
* 🌐 Website: [showayeb.dev](https://showayeb.dev)
* 🐙 GitHub: [@showayebDev](https://github.com/showayebDev)
* ✉️ Email: [me@showayeb.dev](mailto:me@showayeb.dev)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
