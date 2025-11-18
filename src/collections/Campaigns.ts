import { slugField, type CollectionConfig } from 'payload'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  trash: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'campaigns',
        path: `/campaigns/${slug}`,
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
  },
  fields: [
    slugField({
      fieldToUse: 'title',
    }),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'events',
      label: 'Events',
      admin: {
        description:
          'Configure which events to include in this campaign. You can either select individual events or create a dynamic list of events based on selected companies, countries, categories, and organising groups.',
      },
      type: 'blocks',
      blocks: [
        {
          slug: 'event',
          labels: {
            singular: 'Event',
            plural: 'Events',
          },
          fields: [
            {
              name: 'event',
              type: 'relationship',
              relationTo: 'events',
              required: true,
              hasMany: true,
              admin: {
                description: 'Manually select events to include in this campaign',
              },
            },
          ],
        },
        {
          slug: 'dynamicEventList',
          labels: {
            singular: 'Dynamic Event List',
            plural: 'Dynamic Event Lists',
          },
          fields: [
            {
              name: 'companies',
              type: 'relationship',
              relationTo: 'companies',
              hasMany: true,
              admin: {
                description: 'Filter events by selected companies',
              },
            },
            {
              name: 'countries',
              type: 'relationship',
              relationTo: 'countries',
              hasMany: true,
              admin: {
                description: 'Filter events by selected countries',
              },
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description: 'Filter events by selected categories',
              },
            },
            {
              name: 'organisingGroups',
              type: 'relationship',
              relationTo: 'organisingGroups',
              hasMany: true,
              admin: {
                description: 'Filter events by selected organising groups',
              },
            },
          ],
        },
      ],
    },
  ],
}
