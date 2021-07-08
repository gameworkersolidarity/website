const env = require('env-var')
const siteUrl = env.get('SITE_BASE_URL').default('https://gameworkersolidarity.com').asString()

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/action/*',
    '/group/*',
    '/server-sitemap.xml'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${siteUrl}/server-sitemap.xml`,
    ],
  },
}