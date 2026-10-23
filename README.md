# 🌟 Showayeb Ahamed — Portfolio Monorepo

<p align="center">
  <img src="https://user-images.githubusercontent.com/18350557/176309783-0785949b-9127-417c-8b55-ab5a4333674e.gif" width="36" alt="Hi" />
  <br />
  <strong>A modern, high-performance decoupled portfolio monorepo featuring an ultra-fast Astro 7 SSG Frontend and a headless Payload CMS 3.x Backend (Next.js Standalone, PostgreSQL & Cloudflare R2 / S3).</strong>
</p>

<p align="center">
  <a href="https://showayeb.dev"><img src="https://img.shields.io/badge/Live_Site-showayeb.dev-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Site" /></a>
  <a href="https://hub.docker.com/r/showayebdev/my_portfolio_astro"><img src="https://img.shields.io/badge/Docker_Hub-Astro_Frontend-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub Astro" /></a>
  <a href="https://hub.docker.com/r/showayebdev/my_portfolio"><img src="https://img.shields.io/badge/Docker_Hub-Payload_CMS-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub CMS" /></a>
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
* **Containerization:** Clean, multi-target root [`Dockerfile`](Dockerfile) producing two independent, lightweight production images on Docker Hub.

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
│   │   └── payload.config.js  # Database, Lexical editor & S3 storage config
│   ├── .env                   # Remote PostgreSQL & S3 credentials
│   └── package.json           # Next.js & Payload CMS dependencies
│
├── .env.docker                # Docker Compose environment (Cloud Neon DB & R2)
├── .env.docker.full           # Full stack Docker environment (Local Postgres & MinIO)
├── .dockerignore              # Clean build ignore rules for monorepo
├── Dockerfile                 # Unified multi-target Dockerfile (targets: cms, astro)
├── docker-compose.yml         # Cloud DB Docker orchestration
├── docker-compose.full.yml    # Complete offline Docker stack (Postgres + MinIO + CMS + Astro)
└── package.json               # Root scripts for builds, installs, and Docker actions
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
* **Databases:** PostgreSQL (Neon Cloud / Supabase / Local Docker Container)
* **Storage:** Cloudflare R2 / AWS S3 / MinIO (Self-hosted)

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
  ```
* **Backend:** Copy `payload-cms/.env.example` to `payload-cms/.env` and provide your database credentials:
  ```ini
  DATABASE_URL=postgresql://user:password@host/db?sslmode=require
  PAYLOAD_SECRET=your_secret_key
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
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

### Method 2: Docker Compose (Cloud Services)

Runs both the Payload CMS and Astro Frontend containers connected to your remote cloud database (Neon) and storage (Cloudflare R2):

```bash
# Start containers in background
npm run docker:up

# View logs
docker compose logs -f

# Stop containers
npm run docker:down
```

* **Payload CMS & Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
* **Astro Frontend:** [http://localhost:4321](http://localhost:4321)
* **Swagger API Docs:** [http://localhost:3000/docs](http://localhost:3000/docs)

---

### Method 3: Full-Stack Offline Docker (Postgres + MinIO + CMS + Astro)

Runs a completely isolated local development environment inside Docker with zero external cloud dependencies:

```bash
# Start full local stack
npm run docker:full:up

# Stop full local stack
npm run docker:full:down
```

| Service | Container Name | URL | Credentials / Notes |
| :--- | :--- | :--- | :--- |
| **Astro Frontend** | `astro-frontend-full-app` | [http://localhost:4321](http://localhost:4321) | Production SSG preview |
| **Payload CMS** | `nextjs-payload-full-app` | [http://localhost:3000/admin](http://localhost:3000/admin) | First visit prompts to create admin |
| **Local PostgreSQL**| `local-postgres-db` | `localhost:5432` | User: `postgres`, Pass: `postgres`, DB: `portfolio` |
| **Local MinIO Console** | `local-minio-s3` | [http://localhost:9001](http://localhost:9001) | User: `minioadmin`, Pass: `minioadmin` |

---

## 🐳 Docker Hub Images

Pre-built multi-architecture Docker images are published and maintained on Docker Hub:

| Image | Tag | Description |
| :--- | :--- | :--- |
| **[`showayebdev/my_portfolio_astro`](https://hub.docker.com/r/showayebdev/my_portfolio_astro)** | `latest` | Fast, SEO-optimized Astro SSG frontend |
| **[`showayebdev/my_portfolio`](https://hub.docker.com/r/showayebdev/my_portfolio)** | `latest` | Headless Payload CMS 3.x backend |

---

## 📜 Available Scripts

Run these scripts from the repository root:

| Command | Description |
| :--- | :--- |
| **`npm run install:all`** | Installs `node_modules` for both `astro` and `payload-cms` |
| **`npm run dev:cms`** | Starts Payload CMS Next.js backend in development mode |
| **`npm run dev:astro`** | Starts Astro frontend in local development mode |
| **`npm run build`** | Builds both Payload CMS and Astro for production |
| **`npm run docker:up`** | Spins up CMS & Astro using `.env.docker` |
| **`npm run docker:down`** | Stops the Docker containers cleanly |
| **`npm run docker:full:up`** | Spins up complete local stack (Postgres + MinIO + CMS + Astro) |
| **`npm run docker:full:down`**| Stops the complete local stack |
| **`npm run docker:build:cms`**| Builds the Payload CMS Docker image locally |
| **`npm run docker:build:astro`**| Builds the Astro Frontend Docker image locally |
| **`npm run docker:publish:all`**| Builds both images and pushes them to Docker Hub |

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
