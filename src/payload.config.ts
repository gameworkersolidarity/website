import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { StaticPages } from './collections/StaticPages'
import { MenuItems } from './collections/MenuItems'
import { BlogPosts } from './collections/BlogPosts'
import { Countries } from './collections/Countries'
import { Companies } from './collections/Companies'
import { Categories } from './collections/Categories'
import { OrganisingGroups } from './collections/OrganisingGroups'
import { SolidarityActions } from './collections/SolidarityActions'
import { cloudinaryStorage } from 'payload-cloudinary'
import 'dotenv/config'
import env from 'env-var'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    StaticPages,
    MenuItems,
    BlogPosts,
    Countries,
    Companies,
    Categories,
    OrganisingGroups,
    SolidarityActions,
  ],
  editor: lexicalEditor(),
  secret: env.get('PAYLOAD_SECRET').required().asString(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  plugins: [
    cloudinaryStorage({
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
    }),
  ],
})
