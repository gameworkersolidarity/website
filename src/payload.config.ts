import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { StaticPages } from './collections/StaticPages'
import { BlogPosts } from './collections/BlogPosts'
import { Countries } from './collections/Countries'
import { Companies } from './collections/Companies'
import { Categories } from './collections/Categories'
import { OrganisingGroups } from './collections/OrganisingGroups'
import { Campaigns } from './collections/Campaigns'
import { Events } from './collections/Events'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { StartOrganising } from './globals/StartOrganising'
import { cloudinaryStorage } from 'payload-cloudinary'
import 'dotenv/config'
import env from 'env-var'
import { s3Storage } from '@payloadcms/storage-s3'
import { openapi, scalar } from 'payload-oapi'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { projectStrings } from './project-strings'
import { getPath, getSlug } from './utils/payloadPath'
import { AboutPage } from './globals/AboutPage'
import { CampaignsPage } from './globals/CampaignsPage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoRefresh: true,
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: 'test@example.com',
            password: 'test',
            prefillOnly: true,
          }
        : undefined,
    livePreview: {
      url: ({ data, collectionConfig }) => {
        if (!data?.slug || !collectionConfig) {
          return null
        }

        const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
        const baseURL = projectStrings.baseUrl
        const encodedParams = new URLSearchParams({
          slug: getSlug(collectionConfig.slug, data as any),
          collection: collectionConfig.slug,
          path: getPath(collectionConfig.slug, data as any),
          previewSecret,
        })
        return `${baseURL}/preview?${encodedParams.toString()}`
      },
      collections: [
        'events',
        'campaigns',
        'categories',
        'companies',
        'organisingGroups',
        'countries',
        'staticPages',
        'blogPosts',
      ],
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Laptop',
          name: 'laptop',
          width: 1440,
          height: 900,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1920,
          height: 1080,
        },
      ],
    },
  },
  collections: [
    Users,
    Media,
    StaticPages,
    BlogPosts,
    Countries,
    Companies,
    Categories,
    OrganisingGroups,
    Campaigns,
    Events,
  ],
  globals: [Header, Footer, StartOrganising, AboutPage, CampaignsPage],
  editor: lexicalEditor(),
  secret: env.get('PAYLOAD_SECRET').required().asString(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: env.get('DATABASE_URL').required().asString(),
  }),
  plugins: [
    nestedDocsPlugin({
      collections: ['companies', 'organisingGroups'],
      // For querying descendants and ascendants
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
      breadcrumbsFieldSlug: 'parents',
    }),
    openapi({
      openapiVersion: '3.0',
      metadata: {
        title: 'Game Workers Solidarity Platform API',
        version: '1.0.0',
        description: `Free, public API for querying the Game Workers Solidarity archival database. Please let us know how you use it! ${projectStrings.email}`,
      },
    }),
    scalar({
      // Scalar UI will be available at /api/docs by default
      // You can customize the path if needed:
      // path: '/api/docs',
    }),
    env.get('STORAGE_TYPE').required().asString() === 'cloudinary'
      ? cloudinaryStorage({
          config: {
            cloud_name: env.get('CLOUDINARY_NAME').required().asString(),
            api_key: env.get('CLOUDINARY_API_KEY').required().asString(),
            api_secret: env.get('CLOUDINARY_API_SECRET').required().asString(),
          },
          collections: {
            media: true, // Enable for media collection
            // Add more collections as needed
          },
          folder: 'gws-media', // Optional, defaults to 'payload-media'
        })
      : env.get('STORAGE_TYPE').required().asString() === 's3'
        ? s3Storage({
            collections: {
              media: {
                prefix: 'media',
              },
            },
            bucket: process.env.S3_BUCKET || '',
            config: {
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              region: process.env.S3_REGION || 'us-east-1',
              endpoint: process.env.S3_ENDPOINT || '',
            },
          })
        : (config) => {
            return config
          },
  ],
})
