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
import { Actions } from './collections/Actions'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { StartOrganising } from './globals/StartOrganising'
import { cloudinaryStorage } from 'payload-cloudinary'
import env from 'env-var'
import { s3Storage } from '@payloadcms/storage-s3'
import { openapi, scalar } from 'payload-oapi'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import { projectStrings } from './project-strings'
import { getPath, getSlug } from './utils/payloadPath'
import { AboutPage } from './globals/AboutPage'
import { CampaignsPage } from './globals/CampaignsPage'
import { DataPage } from './globals/DataPage'
import { ActionSubmissionPage } from './globals/ActionSubmissionPage'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import type { MCPAccessSettings } from '@payloadcms/plugin-mcp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  defaultDepth: 1,
  maxDepth: 3,
  graphQL: {
    disablePlaygroundInProduction: false,
    disableIntrospectionInProduction: false,
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: ['./app/(payload)/admin/components/HomepageLink#HomepageLink'],
      graphics: {
        Logo: './app/(payload)/admin/components/Logo#default',
        Icon: './app/(payload)/admin/components/Icon#default',
      },
    },
    dashboard: {
      widgets: [
        {
          slug: 'stats',
          Component: './app/(payload)/admin/components/StatsWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: 'recent-edits',
          Component: './app/(payload)/admin/components/RecentEditsWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: 'bust-cache',
          Component: './app/(payload)/admin/components/BustCacheWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
      ],
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
      url: ({ data, collectionConfig, globalConfig }) => {
        const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
        const baseURL = projectStrings.baseUrl

        // Handle globals
        if (globalConfig) {
          const globalPathMap: Record<string, string> = {
            header: '/',
            footer: '/',
            startOrganising: '/start-organising',
            aboutPage: '/about',
            campaignsPage: '/campaigns',
            dataPage: '/data',
            actionSubmissionPage: '/submit',
          }
          const path = globalPathMap[globalConfig.slug] || '/'
          const encodedParams = new URLSearchParams({
            path,
            previewSecret,
          })
          return `${baseURL}/preview?${encodedParams.toString()}`
        }

        // Handle collections
        if (!data?.slug || !collectionConfig) {
          return null
        }

        const encodedParams = new URLSearchParams({
          slug: getSlug(collectionConfig.slug, data as any),
          collection: collectionConfig.slug,
          path: getPath(collectionConfig.slug, data as any),
          previewSecret,
        })
        return `${baseURL}/preview?${encodedParams.toString()}`
      },
      collections: [
        'actions',
        'campaigns',
        'categories',
        'companies',
        'organisingGroups',
        'countries',
        'staticPages',
        'blogPosts',
      ],
      globals: [
        'header',
        'footer',
        'startOrganising',
        'aboutPage',
        'campaignsPage',
        'dataPage',
        'actionSubmissionPage',
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
    Actions,
  ],
  globals: [
    Header,
    Footer,
    StartOrganising,
    AboutPage,
    CampaignsPage,
    DataPage,
    ActionSubmissionPage,
  ],
  editor: lexicalEditor(),
  secret: env.get('PAYLOAD_SECRET').required().asString(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: env.get('DATABASE_URL').required().asString(),
  }),
  email: env.get('USE_SMTP').default('false').asBoolStrict()
    ? nodemailerAdapter({
        defaultFromAddress: projectStrings.email,
        defaultFromName: projectStrings.name,
        skipVerify: true, // Avoid SMTP verify at startup (Proton limits connections; verify is unnecessary for sending)
        transport: nodemailer.createTransport({
          host: env.get('SMTP_HOST').asString() || 'localhost',
          port: env.get('SMTP_PORT').default(587).asInt(),
          secure: env.get('SMTP_SECURE').default('false').asBoolStrict(),
          auth: env.get('SMTP_USER').asString()
            ? {
                user: env.get('SMTP_USER').asString(),
                pass: env.get('SMTP_PASS').asString(),
              }
            : undefined,
          // For development, allow self-signed certificates
          // ...(process.env.NODE_ENV === 'development' && {
          //   tls: {
          //     rejectUnauthorized: false,
          //   },
          // }),
        }),
      })
    : undefined,
  plugins: [
    mcpPlugin({
      collections: {
        actions: {
          enabled: true,
          description: 'Labour actions (strikes, redundancies, unionisation) in the games industry',
        },
        campaigns: { enabled: true, description: 'Campaigns and solidarity initiatives' },
        categories: { enabled: true, description: 'Categories for organising content' },
        companies: { enabled: true, description: 'Game companies and studios' },
        organisingGroups: { enabled: true, description: 'Unions and organising groups' },
        countries: { enabled: true, description: 'Countries and regions' },
        staticPages: { enabled: true, description: 'Static site pages' },
        blogPosts: { enabled: true, description: 'Blog posts and articles' },
      },
      overrideAuth: async (req, getDefaultMcpAccessSettings) => {
        const mcpCollectionSlugs = [
          'actions',
          'campaigns',
          'categories',
          'companies',
          'organisingGroups',
          'countries',
          'staticPages',
          'blogPosts',
        ] as const
        const viewOnlySettings = Object.fromEntries(
          mcpCollectionSlugs.map((slug) => [slug, { find: true }]),
        )
        const authHeader =
          typeof req.headers?.get === 'function'
            ? req.headers.get('Authorization')
            : (req.headers as unknown as Record<string, string>)?.['authorization']
        const hasBearer = authHeader?.startsWith('Bearer ')
        if (!hasBearer) {
          return {
            ...viewOnlySettings,
            user: undefined,
          } as unknown as MCPAccessSettings
        }
        try {
          const defaultSettings = await getDefaultMcpAccessSettings()
          return {
            ...defaultSettings,
            ...viewOnlySettings,
          }
        } catch {
          return {
            ...viewOnlySettings,
            user: undefined,
          } as unknown as MCPAccessSettings
        }
      },
    }),
    importExportPlugin({
      debug: true,
      overrideExportCollection: ({ collection }) => {
        collection.access = {
          ...collection.access,
          read: ({ req }) => true,
          create: ({ req }) => true,
        }
        return collection
      },
      collections: [
        {
          slug: 'actions',
          export: {
            // pls download me from /api/export/actions
            disableDownload: false,
            // run sync
            disableJobsQueue: true,
            format: 'csv',
            limit: 0,
          },
          import: false,
        },
      ],
      // see below for a list of available options
    }),
    nestedDocsPlugin({
      collections: ['companies', 'organisingGroups'],
      // For querying descendants and ascendants
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
      breadcrumbsFieldSlug: 'parents',
    }),
    openapi({
      openapiVersion: '3.0',
      metadata: {
        title: 'Game Worker Solidarity API',
        version: '1.0.0',
        description: `Free, public API for querying the Game Workers Solidarity archival database. Please let us know how you use it! ${projectStrings.email}`,
      },
      // @ts-ignore
      exclude: {
        collections: [
          'payload-preferences',
          'payload-migrations',
          'payload-locked-documents',
          'payload-kv',
          'payload-jobs',
          'users',
          'staticPages',
          'blogPosts',
          'media',
          'exports',
          'imports',
          'payload-mcp-api-keys',
        ],
        globals: [
          'header',
          'footer',
          'startOrganising',
          'aboutPage',
          'campaignsPage',
          'dataPage',
          'actionSubmissionPage',
        ],
        methods: ['post', 'patch', 'delete'],
        // endpoints: ['/api/some-endpoint', '/api/another/*'], // Add specific endpoints or patterns with wildcards
      },
    }),
    scalar({
      // Scalar UI will be available at /api/docs by default
      // You can customize the path if needed:
      // path: '/api/docs',
    }),
    env.get('NEXT_PUBLIC_STORAGE_TYPE').required().asString() === 'cloudinary'
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
      : env.get('NEXT_PUBLIC_STORAGE_TYPE').required().asString() === 's3'
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
