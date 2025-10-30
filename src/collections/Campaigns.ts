import { slugField, type CollectionConfig } from 'payload'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
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
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'timeline',
      type: 'array',
      label: 'Timeline Events',
      minRows: 0,
      admin: {
        description:
          'Add events to create a timeline. Set parent events to create hierarchical relationships. Use link types to indicate causality.',
      },
      fields: [
        {
          name: 'event',
          type: 'relationship',
          relationTo: 'solidarityActions',
          required: true,
          admin: {
            description: 'The solidarity action/event to include in this timeline',
          },
        },
        {
          name: 'parentEvent',
          type: 'relationship',
          relationTo: 'solidarityActions',
          admin: {
            description:
              'Optional: Set this event as a child of another event to create a hierarchy',
          },
        },
        {
          name: 'linkType',
          type: 'select',
          options: [
            {
              label: 'Strong Link',
              value: 'strong',
            },
            {
              label: 'Weak Link',
              value: 'weak',
            },
            {
              label: 'No Link (Root Event)',
              value: 'none',
            },
          ],
          defaultValue: 'none',
          required: true,
          admin: {
            description:
              'Strong links indicate direct causality. Weak links indicate indirect relationships. None for root events.',
          },
        },
        {
          name: 'linkDescription',
          type: 'textarea',
          admin: {
            description: 'Optional description of how this event relates to its parent',
          },
        },
        {
          name: 'displayOrder',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Order in which to display events (lower numbers first)',
          },
        },
      ],
    },
  ],
}
