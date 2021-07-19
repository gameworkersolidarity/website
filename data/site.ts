import env from 'env-var';
export const projectStrings = {
  name: env.get('SITE_TITLE').default("Game Worker Solidarity Project").asString(),
  description: env.get('SITE_DESCRIPTION').default("Preserving the history of video game solidarity").asString(),
  baseUrl: env.get('SITE_BASE_URL').default("https://gameworkersolidarity.com").asString(),
  twitterHandle: env.get('TWITTER_HANDLE').default('@GWSolidarity').asString(),
  email: env.get('EMAIL_ADDRESS').default('hello@commonknowledge.coop').asString(),
  github: env.get('GITHUB_REPO_URL').default('https://github.com/gameworkersolidarity/website').asString(),
}