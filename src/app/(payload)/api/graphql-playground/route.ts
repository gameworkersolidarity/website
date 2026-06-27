/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* MODIFIED to ensure GraphQL playground works in production */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

// Ensure GraphQL playground is available in production
// Payload's default handler should work, but we ensure it's always enabled
export const GET = GRAPHQL_PLAYGROUND_GET(config)
