export const projectStrings = {
  name: process.env.NEXT_PUBLIC_SITE_TITLE || 'Game Worker Solidarity',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Preserving and analysing the history of game worker solidarity',
  baseUrl: process.env.NEXT_PUBLIC_SITE_BASE_URL || 'http://localhost:3000',
  twitterHandle: process.env.TWITTER_HANDLE || '@GWSolidarity',
  blueskyProfile:
    process.env.NEXT_PUBLIC_BLUESKY_PROFILE || 'https://bsky.app/profile/gameworkersolidarity.com',
  email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || 'hello@gameworkersolidarity.com',
  github:
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/gameworkersolidarity/website',
  submissionNotificationEmail:
    process.env.SUBMISSION_NOTIFICATION_EMAIL || 'austin@austinkelmore.com',
  STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'local',
}
