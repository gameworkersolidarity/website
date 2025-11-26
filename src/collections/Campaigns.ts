import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { slugField, type CollectionConfig } from 'payload'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  trash: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
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
      fieldToUse: 'name',
    }),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Go into more detail.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    colorPickerField({
      name: 'primaryColor',
      label: 'Primary Color',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Choose a color for this page',
      },
    }),
    {
      name: 'emoji',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Used to illustrate the campaign label.',
      },
    },
    {
      label: 'Events',
      type: 'group',
      admin: {
        description:
          'Configure which events to include in this campaign. You can either select individual events or create a dynamic list of events based on selected companies, countries, categories, and organising groups.',
      },
      fields: [
        {
          name: 'events',
          label: 'Events',
          type: 'relationship',
          relationTo: 'events',
          hasMany: true,
        },
        {
          name: 'eventFilters',
          admin: {
            description:
              'Filter events by selected companies, countries, categories, and organising groups',
          },
          type: 'group',
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
