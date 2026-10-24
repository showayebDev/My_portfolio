# ============================================================
# MULTI-TARGET MONOREPO DOCKERFILE
# Targets:
#   1. cms   (Payload CMS Backend - Next.js Standalone, Port 3000)
#   2. astro (Astro SSG Frontend - Port 4321)
# ============================================================

# ------------------------------------------------------------
# TARGET 1: PAYLOAD CMS BACKEND
# ------------------------------------------------------------
FROM node:20-slim AS cms-deps
WORKDIR /app
COPY payload-cms/package.json payload-cms/package-lock.json* ./
RUN npm install

FROM node:20-slim AS cms-builder
WORKDIR /app
COPY --from=cms-deps /app/node_modules ./node_modules
COPY payload-cms ./

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PAYLOAD_SECRET=build_secret_temp_for_static_analysis
ENV S3_BUCKET=my-portfolio

RUN npm run build

FROM node:20-slim AS cms
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

COPY --from=cms-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=cms-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=cms-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

LABEL org.opencontainers.image.title="Payload CMS Portfolio Backend"
LABEL org.opencontainers.image.description="Payload CMS 3.x headless backend powered by Next.js Standalone, PostgreSQL, and private Cloudflare R2 / S3 storage with FULL_RESTRICTION security mode."
LABEL org.opencontainers.image.authors="Showayeb Ahamed"
LABEL org.opencontainers.image.vendor="Showayeb Ahamed"

CMD ["node", "server.js"]


# ------------------------------------------------------------
# TARGET 2: ASTRO FRONTEND
# ------------------------------------------------------------
FROM node:22-slim AS astro-deps
WORKDIR /app
COPY astro/package.json astro/package-lock.json* ./
RUN npm install

FROM node:22-slim AS astro
WORKDIR /app
COPY --chown=node:node --from=astro-deps /app/node_modules ./node_modules
COPY --chown=node:node astro ./

ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=4321

USER node

EXPOSE 4321

LABEL org.opencontainers.image.title="Astro Portfolio Frontend"
LABEL org.opencontainers.image.description="Fast, SEO-optimized Astro SSG frontend showcasing projects, skills, and portfolio data with authenticated Payload CMS data localization."
LABEL org.opencontainers.image.authors="Showayeb Ahamed"
LABEL org.opencontainers.image.vendor="Showayeb Ahamed"

CMD ["sh", "-c", "node -e \"(async()=>{const u=process.env.PAYLOAD_URL||'http://app:3000';for(let i=0;i<30;i++){try{const r=await fetch(u);if(r.status<500)return;}catch(e){}await new Promise(r=>setTimeout(r,1000));}})()\" ; npm run build && npm run preview -- --host 0.0.0.0 --port 4321"]
