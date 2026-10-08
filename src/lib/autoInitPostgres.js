// @ts-check
import pg from 'pg'

const INITIAL_POSTGRES_SCHEMA = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_media_prefix" AS ENUM('projects', 'icons', 'profile', 'media');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_education_icon" AS ENUM('FaUniversity', 'FaSchool', 'FaGraduationCap', 'FaBookReader');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_profile_socials_platform" AS ENUM('GitHub', 'Facebook', 'LinkedIn', 'Instagram', 'Twitter', 'WhatsApp', 'Discord', 'YouTube', 'Telegram', 'Other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_profile_theme" AS ENUM('auto', 'dark', 'light', 'a_dark', 'a_light');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "users_sessions" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "created_at" timestamp(3) with time zone,
  "expires_at" timestamp(3) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "email" varchar NOT NULL,
  "reset_password_token" varchar,
  "reset_password_expiration" timestamp(3) with time zone,
  "salt" varchar,
  "hash" varchar,
  "reset_password_requested_at" timestamp(3) with time zone,
  "login_attempts" numeric DEFAULT 0,
  "lock_until" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "media" (
  "id" serial PRIMARY KEY NOT NULL,
  "prefix" "enum_media_prefix" DEFAULT 'media' NOT NULL,
  "alt" varchar NOT NULL,
  "_objectkey" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "url" varchar,
  "thumbnail_u_r_l" varchar,
  "filename" varchar,
  "mime_type" varchar,
  "filesize" numeric,
  "width" numeric,
  "height" numeric
);

CREATE TABLE IF NOT EXISTS "projects_buttons" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "link" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "description" varchar NOT NULL,
  "image_id" integer,
  "image_url" varchar,
  "featured" boolean DEFAULT true,
  "sort_order" numeric DEFAULT 0,
  "readme_content" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "skills" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "icon_id" integer,
  "icon_url" varchar,
  "percent" numeric DEFAULT 80,
  "color" varchar DEFAULT '#38bdf8',
  "sort_order" numeric DEFAULT 0,
  "show_in_frontend" boolean DEFAULT true,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "skills_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "skill_categories_id" integer
);

CREATE TABLE IF NOT EXISTS "skill_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "sort_order" numeric DEFAULT 0,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "education" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "description" varchar NOT NULL,
  "period" varchar NOT NULL,
  "logo_id" integer,
  "logo_url" varchar,
  "icon" "enum_education_icon" DEFAULT 'FaGraduationCap',
  "sort_order" numeric DEFAULT 0,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_kv" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar NOT NULL,
  "data" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "global_slug" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "users_id" integer,
  "media_id" integer,
  "projects_id" integer,
  "skills_id" integer,
  "skill_categories_id" integer,
  "education_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar,
  "value" jsonb,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "users_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "profile_socials" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "platform" "enum_profile_socials_platform" DEFAULT 'GitHub' NOT NULL,
  "name" varchar NOT NULL,
  "url" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "profile" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "greeting" varchar,
  "bio" varchar,
  "status" varchar,
  "show_job" boolean DEFAULT true,
  "job" varchar,
  "show_location" boolean DEFAULT true,
  "location" varchar,
  "show_experience" boolean DEFAULT true,
  "experience" varchar,
  "avatar_id" integer,
  "avatar_url" varchar,
  "email" varchar,
  "site_title" varchar DEFAULT 'Portfolio',
  "site_description" varchar DEFAULT 'Welcome to my portfolio! Discover my skills, projects, and work.',
  "projects_header_subtitle" varchar DEFAULT 'Browse My Recent',
  "projects_header_title" varchar DEFAULT 'Projects',
  "explore_more_git_hub_url" varchar DEFAULT 'https://github.com',
  "theme" "enum_profile_theme" DEFAULT 'dark' NOT NULL,
  "show_percent" boolean DEFAULT false,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

DO $$ BEGIN
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "projects_buttons" ADD CONSTRAINT "projects_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "skills" ADD CONSTRAINT "skills_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_skill_categories_fk" FOREIGN KEY ("skill_categories_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "education" ADD CONSTRAINT "education_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skill_categories_fk" FOREIGN KEY ("skill_categories_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_education_fk" FOREIGN KEY ("education_id") REFERENCES "public"."education"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "profile_socials" ADD CONSTRAINT "profile_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "profile" ADD CONSTRAINT "profile_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
CREATE INDEX IF NOT EXISTS "projects_buttons_order_idx" ON "projects_buttons" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "projects_buttons_parent_id_idx" ON "projects_buttons" USING btree ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_slug_idx" ON "projects" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "projects_image_idx" ON "projects" USING btree ("image_id");
CREATE INDEX IF NOT EXISTS "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "skills_icon_idx" ON "skills" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "skills_updated_at_idx" ON "skills" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "skills_created_at_idx" ON "skills" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "skills_rels_order_idx" ON "skills_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "skills_rels_parent_idx" ON "skills_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "skills_rels_path_idx" ON "skills_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "skills_rels_skill_categories_id_idx" ON "skills_rels" USING btree ("skill_categories_id");
CREATE UNIQUE INDEX IF NOT EXISTS "skill_categories_slug_idx" ON "skill_categories" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "skill_categories_updated_at_idx" ON "skill_categories" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "skill_categories_created_at_idx" ON "skill_categories" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "education_logo_idx" ON "education" USING btree ("logo_id");
CREATE INDEX IF NOT EXISTS "education_updated_at_idx" ON "education" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "education_created_at_idx" ON "education" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("skills_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_skill_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("skill_categories_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_education_id_idx" ON "payload_locked_documents_rels" USING btree ("education_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "profile_socials_order_idx" ON "profile_socials" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "profile_socials_parent_id_idx" ON "profile_socials" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "profile_avatar_idx" ON "profile" USING btree ("avatar_id");
`

let hasChecked = false

/**
 * Automatically checks if a connected PostgreSQL database is blank.
 * If blank, automatically creates all required tables, enums, indexes, and constraints.
 *
 * @param {string} connectionString
 */
export async function ensurePostgresSchema(connectionString) {
  if (!connectionString || hasChecked) return
  hasChecked = true

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()

    const res = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
      LIMIT 1;
    `)

    if (res.rows.length === 0) {
      console.log('⚡ [DB Auto-Init] Blank PostgreSQL database detected! Automatically creating all tables and schema...')
      await client.query(INITIAL_POSTGRES_SCHEMA)
      await client.query(`
        INSERT INTO "payload_migrations" ("name", "batch", "created_at", "updated_at")
        VALUES ('auto_init_schema', 1, now(), now())
        ON CONFLICT DO NOTHING;
      `)
      console.log('✅ [DB Auto-Init] PostgreSQL schema initialized successfully with zero errors!')
    } else {
      await client.query(`
        ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "show_job" boolean DEFAULT true;
      `).catch(() => {})
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.warn('[DB Auto-Init] Note:', errorMsg)
  } finally {
    await client.end().catch(() => {})
  }
}
