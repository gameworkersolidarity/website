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

For more technical details (Payload, collections, deployment), see [TECHNICAL.md](TECHNICAL.md).
