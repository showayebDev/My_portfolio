# 🌟 Showayeb Ahamed — Portfolio Monorepo

<p align="center">
  <img src="https://user-images.githubusercontent.com/18350557/176309783-0785949b-9127-417c-8b55-ab5a4333674e.gif" width="36" alt="Hi" />
  <br />
  <strong>A modern, high-performance decoupled portfolio monorepo featuring an ultra-fast Astro 7 SSG Frontend and a headless Payload CMS 3.x Backend (Next.js Standalone, PostgreSQL & Cloudflare R2 / S3).</strong>
</p>

<p align="center">
  <a href="https://showayeb.dev"><img src="https://img.shields.io/badge/Live_Site-showayeb.dev-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Site" /></a>
  <a href="https://github.com/showayebDev"><img src="https://img.shields.io/badge/GitHub-showayebDev-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
</p>

---

## 🏗️ Architecture Overview

This monorepo follows a modern **Decoupled / Headless Architecture**:

```
                       ┌─────────────────────────┐
                       │    Browser / Client     │
                       └───────────┬─────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼ (Port 4321)                       ▼ (Port 3000)
    ┌──────────────────────────┐        ┌──────────────────────────┐
    │      Astro Frontend      │        │    Payload CMS Backend   │
    │     (Static SSG Site)    │        │  (Next.js 16 Standalone) │
    └────────────┬─────────────┘        └────────────┬─────────────┘
                 │                                   │
                 │ Build-time API Data Fetching      ├─► PostgreSQL (Neon / Local)
                 └───────────────────────────────────┤
                                                     └─► S3 / Cloudflare R2 Storage
```

* **Frontend (`astro/`):** Powered by **Astro 7**, **Tailwind CSS v4**, Marked, and Highlight.js. It pre-renders static HTML pages at build time by querying the Payload CMS REST API.
* **Backend (`payload-cms/`):** Powered by **Payload CMS 3.x** and **Next.js 16 Standalone**. Provides an intuitive Admin UI (`/admin`), REST API (`/api`), and interactive Swagger documentation (`/docs`).

---

## 📁 Monorepo Structure

```
My_portfolio/
├── astro/                     # Astro SSG Frontend Application (Port 4321)
│   ├── src/
│   │   ├── components/        # ProfileCard, Projects, Skills, MarkdownView, etc.
│   │   ├── layouts/           # Master HTML Layout with Theme switching
│   │   ├── lib/               # API client (fetchFromApi) & Markdown renderers
│   │   ├── pages/             # Pages: index.astro, project/[name].astro, 404.astro
│   │   └── styles/            # Tailwind CSS v4 styling
│   ├── .env                   # Local dev environment config
│   ├── .env.example           # Example environment template
│   └── package.json           # Astro dependencies & scripts
│
├── payload-cms/               # Payload CMS 3.x Headless Backend (Port 3000)
│   ├── src/
│   │   ├── collections/       # Users, Projects, Skills, Media, Education
│   │   ├── globals/           # Profile & Social Links Globals
│   │   ├── endpoints/         # Database & S3 migration endpoints
│   │   ├── middleware.js      # Edge Middleware for FULL_RESTRICTION mode
│   │   └── payload.config.js  # Database, Lexical editor & S3 storage config
│   ├── .env                   # Remote PostgreSQL & S3 credentials
│   └── package.json           # Next.js & Payload CMS dependencies
│
└── package.json               # Root scripts for builds and installs
```

---

## 🛠️ Tech Stack

### Frontend (`astro/`)
* **Framework:** [Astro 7](https://astro.build/) (Static Site Generation)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Markdown:** [Marked](https://marked.js.org/) & [Highlight.js](https://highlightjs.org/)
* **Runtime:** Node.js `>= 22`

### Backend (`payload-cms/`)
* **Framework:** [Next.js 16](https://nextjs.org/) (Standalone Output) & [React 19](https://react.org/)
* **Headless CMS:** [Payload CMS 3.x](https://payloadcms.com/)
* **Editor:** Lexical Rich Text & Markdown Editor
* **API Documentation:** Interactive Swagger UI at `/docs`
* **Runtime:** Node.js `>= 20`

### Databases & Cloud Storage
* **Databases:** PostgreSQL (Neon Cloud / Supabase / Local)
* **Storage:** Cloudflare R2 / AWS S3 / MinIO (Self-hosted)

---

## 🛡️ Security & Privacy (`FULL_RESTRICTION`)

This project implements an optional, zero-trust **`FULL_RESTRICTION`** security architecture to keep your headless CMS backend and storage bucket 100% private:

* **Private R2 / S3 Storage:** Cloudflare R2's `Public Development URL` or custom domains can remain **completely disabled**. No media files or raw assets are publicly exposed.
* **Internal Media Proxy (`/my-portfolio/*`):** Media files are streamed through Payload CMS's internal S3 proxy using private AWS SDK S3 credentials.
* **Edge Middleware Protection:** When `FULL_RESTRICTION=true` is enabled in `payload-cms`:
  * All public API endpoints (`/api/*`) and media proxy routes (`/my-portfolio/*`) require authentication. Unauthorized requests return `401 Unauthorized`.
  * **Astro Build-Time Integration:** Astro automatically sends an `x-payload-secret` header matching `PAYLOAD_SECRET` during SSG build, securely downloading content and localizing images into its static output.
  * **Admin Panel Access:** Logged-in administrators retain full access in the browser via standard `payload-token` session cookies.
  * **Essential Auth Routes:** Public auth endpoints (`/api/users/login`, `/api/users/logout`, etc.) and system health checks remain accessible.

---

## 🚀 Getting Started

### Method 1: Local Development (Node.js)

#### 1. Install all dependencies across the monorepo:
```bash
npm run install:all
```

#### 2. Configure Environment Variables:
* **Frontend:** Copy `astro/.env.example` to `astro/.env`:
  ```ini
  PAYLOAD_URL=http://localhost:3000
  PUBLIC_SITE_URL=http://localhost:4321
  PAYLOAD_SECRET=your_secret_key_matching_payload_cms
  ```
* **Backend:** Copy `payload-cms/.env.example` to `payload-cms/.env`:
  ```ini
  DATABASE_URL=postgresql://user:password@host/db?sslmode=require
  PAYLOAD_SECRET=your_secret_key_matching_payload_cms
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  FULL_RESTRICTION=true
  ```

#### 3. Start Development Servers:
* **Start CMS Backend:**
  ```bash
  npm run dev:cms        # Runs Payload CMS at http://localhost:3000
  ```
* **Start Astro Frontend:**
  ```bash
  npm run dev:astro      # Runs Astro Dev Server at http://localhost:4321
  ```

---

## 📜 Available Scripts

Run these scripts from the repository root:

| Command | Description |
| :--- | :--- |
| **`npm run install:all`** | Installs `node_modules` for both `astro` and `payload-cms` |
| **`npm run dev:cms`** | Starts Payload CMS Next.js backend in development mode |
| **`npm run dev:astro`** | Starts Astro frontend in local development mode |
| **`npm run build`** | Builds both Payload CMS and Astro for production |
| **`npm run build:cms`** | Builds Payload CMS backend for production |
| **`npm run build:astro`** | Builds Astro frontend for production |

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
