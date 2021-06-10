module.exports = {
  siteUrl: process.env.SITE_BASE_URL || 'https://gameworkersolidarity.com',
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/actions/*',
    '/server-sitemap.xml'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://example.com/server-sitemap.xml',
    ],
  },
}