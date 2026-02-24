# [gameworkersolidarity.com](https://gameworkersolidarity.com)

Game Worker Solidarity is mapping and documenting collective movements by game workers striving to improve their working conditions. We're collecting materials created by workers for these movements and aim to document the longer history of resistance in the industry which goes back to its formation.

This repository is for a website backed by a database of events that can be freely searched by location, type of action, and numbers involved for events like the creation of trade union branches, new contracts, strikes, protests, social media campaigns, etc.

Where possible, we'll also interview and record oral histories with participants of these movements to produce a living resource that can help support and inspire more organising in the games industry.

Do you have any information to share with us that we can add to the timeline? [Get in touch!](mailto:hello@gameworkersolidarity.com)

## Building the site from scratch

First, make sure you have the technical requirements installed. (See section below.)

1. **Clone the repository**

   ```bash
   git clone https://github.com/gameworkersolidarity/website.git
   cd website
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`.
   - Set at least:
     - `DATABASE_URL` — MongoDB connection string (local or cloud).
     - `PAYLOAD_SECRET` — Long, random secret for Payload (e.g. JWT signing).
   - For full functionality you may also need: Mapbox token, Cloudinary credentials, `BASE_URL`, and optionally Airtable and SMTP settings (see `.env.example`).

4. **Run the app**
   - **Development:** `pnpm dev` then open http://localhost:3000 (admin at `/admin`).
   - **Production build:** `pnpm build` then `pnpm start`.

### Technical requirements

You need the following installed before running the steps above:

- **Node.js 22** — The project uses Node 22 (see `engines` in `package.json`).
  - **Install:** [nodejs.org](https://nodejs.org/) (LTS or current 22.x), or via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`, or [fnm](https://github.com/Schniz/fnm): `fnm install 22`.
- **pnpm** — Package manager used for install and scripts.
  - **Install:** `npm install -g pnpm` (after Node is installed), or see [pnpm.io/installation](https://pnpm.io/installation) for standalone installers and other methods (Corepack, Homebrew, etc.).
- **Git** — To clone the repository.
  - **Install:** [git-scm.com](https://git-scm.com/) or your OS package manager (`brew install git`, `apt install git`, etc.).

### Importing redundancy data

Redundancy data is imported from CSV files into Payload as **Actions** (with category “Redundancy”), and creates or links **Companies** and **Categories** as needed.

1. **Put CSV files** in `public/redundancies/` (e.g. `2025 Grid View.csv`, `2024 Grid View Breakdown.csv`).
2. **CSV format:** Each file must have exactly these column headers (order doesn’t matter):
   - `Field 1`, `Studio`, `Date`, `Headcount`, `Parent`, `Type`, `Studio Location`, `Parent Location`
   - Dates must be `YYYY-MM-DD`. Company names are matched with fuzzy matching and cached across rows.
3. **Run the ingest:**
   ```bash
   pnpm run ingest:redundancies
   ```

   - Use `--dry-run` to see what would be created without writing.
   - Use `--file "filename.csv"` to process only one file.
   - Use `--max <number>` to limit how many redundancies are created (e.g. for testing).

Full options and examples: [scripts/README.md](scripts/README.md#ingest-redundancies-script).

### Adding database fields

The database schema is defined by **Payload CMS** [collections](https://payloadcms.com/docs/configuration/collections) in `src/collections/`, registered in `src/payload.config.ts`. For a full reference to field types and options, start with the Payload docs:

- **[Fields overview](https://payloadcms.com/docs/fields/overview)** — Field types, common options, and how to define fields.

> **⚠️ Renaming or removing fields:** Changing a field’s `name` or deleting a field can break existing data and code. If you rename or remove fields, you must handle existing data and schema changes properly. See Payload’s **[Database migrations](https://payloadcms.com/docs/database/migrations)** docs before doing this.

Then:

1. **Edit the collection** that should get the new field (e.g. `src/collections/Actions.ts`). Add a new entry to the `fields` array. Use the [fields overview](https://payloadcms.com/docs/fields/overview) and the docs for specific types (e.g. [text](https://payloadcms.com/docs/fields/text), [number](https://payloadcms.com/docs/fields/number), [relationship](https://payloadcms.com/docs/fields/relationship), [date](https://payloadcms.com/docs/fields/date), [richText](https://payloadcms.com/docs/fields/richtext-lexical)) to choose and configure the field.
2. **Regenerate types and Zod schemas** so TypeScript and validation stay in sync:
   ```bash
   pnpm run generate:all
   ```
   This runs [Payload’s type generation](https://payloadcms.com/docs/configuration/typescript#generated-types) and the project’s Zod schema generator. The app and scripts use `@/payload-types` and `payload-zod-schemas`.
3. With MongoDB, new fields are used as soon as the config changes; no separate migrations are required. (No need to restart the dev server for field updates.) — however, if you intend to rename a field, then you should create a [migration](https://payloadcms.com/docs/database/migrations).
4. **Update UI** if needed: the [Payload admin](https://payloadcms.com/docs/admin/overview) will show the new field automatically; update any frontend components or ingest scripts that should read or write the field.

**Adding a new collection** (not just a new field): define the collection per [Configuration → Collections](https://payloadcms.com/docs/configuration/collections), add the module under `src/collections/`, register it in the `collections` array in [payload.config.ts](https://payloadcms.com/docs/configuration/overview), then run `pnpm run generate:all`.

For more technical details (Payload, collections, deployment), see [TECHNICAL.md](TECHNICAL.md).
