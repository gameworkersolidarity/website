import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    description: 'Authenticated CMS users (admins). Used for login and access control.',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
