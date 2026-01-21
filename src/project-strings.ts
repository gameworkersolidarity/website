import env from 'env-var'
export const projectStrings = {
  name: env.get('NEXT_PUBLIC_SITE_TITLE').default('Game Worker Solidarity').asString(),
  description: env
    .get('NEXT_PUBLIC_SITE_DESCRIPTION')
    .default('Preserving and analysing the history of game worker solidarity')
    .asString(),
  baseUrl: env.get('NEXT_PUBLIC_SITE_BASE_URL').default('http://localhost:3000').asString(),
  twitterHandle: env.get('TWITTER_HANDLE').default('@GWSolidarity').asString(),
  blueskyProfile: env
    .get('NEXT_PUBLIC_BLUESKY_PROFILE')
    .default('https://bsky.app/profile/gameworkersolidarity.com')
    .asString(),
  email: env.get('NEXT_PUBLIC_EMAIL_ADDRESS').default('hello@gameworkersolidarity.com').asString(),
  github: env
    .get('NEXT_PUBLIC_GITHUB_REPO_URL')
    .default('https://github.com/gameworkersolidarity/website')
    .asString(),
  submissionNotificationEmail: env
    .get('NEXT_PUBLIC_SUBMISSION_NOTIFICATION_EMAIL')
    .default('austin@austinkelmore.com')
    .asString(),
  STORAGE_TYPE: env.get('NEXT_PUBLIC_STORAGE_TYPE').default('local').asString(),
}
