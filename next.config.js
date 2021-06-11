module.exports = {
  future: {
    webpack5: true
  }, 
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  images: {
    domains: ['dl.airtable.com'],
  },
}