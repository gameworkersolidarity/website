import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { projectStrings } from '@/project-strings'
import { getPath } from '@/utils/payloadPath'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = projectStrings.baseUrl
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Fetch all published content from Payload CMS
  const [
    staticPages,
    blogPosts,
    campaigns,
    categories,
    companies,
    countries,
    events,
    organisingGroups,
  ] = await Promise.all([
    payload.find({
      collection: 'staticPages',
      pagination: false,
    }),
    payload.find({
      collection: 'blogPosts',
      pagination: false,
    }),
    payload.find({
      collection: 'campaigns',
      pagination: false,
    }),
    payload.find({
      collection: 'categories',
      pagination: false,
    }),
    payload.find({
      collection: 'companies',
      pagination: false,
    }),
    payload.find({
      collection: 'countries',
      pagination: false,
    }),
    payload.find({
      collection: 'events',
      pagination: false,
    }),
    payload.find({
      collection: 'organisingGroups',
      pagination: false,
    }),
  ])

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/campaigns`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/countries`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/data`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/start-organising`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/submit-event`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic routes from collections
  const dynamicRoutes: MetadataRoute.Sitemap = [
    // Static pages
    ...staticPages.docs.map((page) => ({
      url: `${baseUrl}${getPath('staticPages', page)}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Blog posts
    ...blogPosts.docs.map((post) => ({
      url: `${baseUrl}${getPath('blogPosts', post)}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Campaigns
    ...campaigns.docs.map((campaign) => ({
      url: `${baseUrl}${getPath('campaigns', campaign)}`,
      lastModified: campaign.updatedAt ? new Date(campaign.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Categories
    ...categories.docs.map((category) => ({
      url: `${baseUrl}${getPath('categories', category)}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Companies
    ...companies.docs.map((company) => ({
      url: `${baseUrl}${getPath('companies', company)}`,
      lastModified: company.updatedAt ? new Date(company.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Countries
    ...countries.docs.map((country) => ({
      url: `${baseUrl}${getPath('countries', country)}`,
      lastModified: country.updatedAt ? new Date(country.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Events
    ...events.docs.map((event) => ({
      url: `${baseUrl}${getPath('events', event)}`,
      lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    // Organising groups
    ...organisingGroups.docs.map((group) => ({
      url: `${baseUrl}${getPath('organisingGroups', group)}`,
      lastModified: group.updatedAt ? new Date(group.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return [...staticRoutes, ...dynamicRoutes]
}
