import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "static_pages" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "organising_groups" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "solidarity_actions" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "static_pages" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "blog_posts" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "blog_posts" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "countries" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "countries" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "companies" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "categories" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "organising_groups" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "organising_groups" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "solidarity_actions" ADD COLUMN "airtable_id" varchar;
  ALTER TABLE "solidarity_actions" ADD COLUMN "generate_slug" boolean DEFAULT true;
  CREATE UNIQUE INDEX "static_pages_slug_idx" ON "static_pages" USING btree ("slug");
  CREATE UNIQUE INDEX "blog_posts_airtable_id_idx" ON "blog_posts" USING btree ("airtable_id");
  CREATE UNIQUE INDEX "countries_airtable_id_idx" ON "countries" USING btree ("airtable_id");
  CREATE UNIQUE INDEX "companies_airtable_id_idx" ON "companies" USING btree ("airtable_id");
  CREATE UNIQUE INDEX "categories_airtable_id_idx" ON "categories" USING btree ("airtable_id");
  CREATE UNIQUE INDEX "organising_groups_airtable_id_idx" ON "organising_groups" USING btree ("airtable_id");
  CREATE UNIQUE INDEX "solidarity_actions_airtable_id_idx" ON "solidarity_actions" USING btree ("airtable_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "static_pages_slug_idx";
  DROP INDEX "blog_posts_airtable_id_idx";
  DROP INDEX "countries_airtable_id_idx";
  DROP INDEX "companies_airtable_id_idx";
  DROP INDEX "categories_airtable_id_idx";
  DROP INDEX "organising_groups_airtable_id_idx";
  DROP INDEX "solidarity_actions_airtable_id_idx";
  ALTER TABLE "static_pages" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "organising_groups" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "solidarity_actions" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "static_pages" DROP COLUMN "generate_slug";
  ALTER TABLE "blog_posts" DROP COLUMN "airtable_id";
  ALTER TABLE "blog_posts" DROP COLUMN "generate_slug";
  ALTER TABLE "countries" DROP COLUMN "airtable_id";
  ALTER TABLE "countries" DROP COLUMN "generate_slug";
  ALTER TABLE "companies" DROP COLUMN "airtable_id";
  ALTER TABLE "categories" DROP COLUMN "airtable_id";
  ALTER TABLE "organising_groups" DROP COLUMN "airtable_id";
  ALTER TABLE "organising_groups" DROP COLUMN "generate_slug";
  ALTER TABLE "solidarity_actions" DROP COLUMN "airtable_id";
  ALTER TABLE "solidarity_actions" DROP COLUMN "generate_slug";`)
}
