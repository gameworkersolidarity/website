import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "companies" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "companies" ADD COLUMN "slug" varchar NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "slug" varchar NOT NULL;
  CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "companies_slug_idx";
  DROP INDEX "categories_slug_idx";
  ALTER TABLE "companies" DROP COLUMN "generate_slug";
  ALTER TABLE "companies" DROP COLUMN "slug";
  ALTER TABLE "categories" DROP COLUMN "generate_slug";
  ALTER TABLE "categories" DROP COLUMN "slug";`)
}
