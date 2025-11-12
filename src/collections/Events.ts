import { slugField, type CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return false
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'events',
        path: `/events/${slug}`,
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
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'relatedEvents',
      type: 'array',
      label: 'Related Events',
      admin: {
        description: 'Create links to related events directly from this event',
      },
      fields: [
        {
          name: 'relatedEvent',
          type: 'relationship',
          relationTo: 'events',
          required: true,
          admin: {
            description: 'The event this is related to',
          },
        },
        {
          name: 'quality',
          type: 'select',
          options: [
            {
              label: 'Direct',
              value: 'DIRECT',
            },
            {
              label: 'Indirect',
              value: 'INDIRECT',
            },
          ],
          required: true,
          defaultValue: 'DIRECT',
          admin: {
            description: 'The quality of the relationship',
          },
        },
        {
          name: 'comment',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Description of how these events are related (e.g., "The same organiser went on to do this other thing")',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, id }) => {
        // Validate that relatedEvents don't link to the same event or to itself
        if (data?.relatedEvents && Array.isArray(data.relatedEvents)) {
          const relatedEventIds = new Set()
          const currentEventId = id || (data.id ? String(data.id) : null)
          
          for (const item of data.relatedEvents) {
            if (item?.relatedEvent) {
              const eventId =
                typeof item.relatedEvent === 'object'
                  ? item.relatedEvent.id
                  : String(item.relatedEvent)
              
              // Prevent self-links
              if (currentEventId && eventId === currentEventId) {
                throw new Error(
                  'An event cannot link to itself',
                )
              }
              
              // Prevent duplicate links in the same array
              if (relatedEventIds.has(eventId)) {
                throw new Error(
                  'Cannot link to the same event multiple times in related events',
                )
              }
              relatedEventIds.add(eventId)
            }
          }
        }
      },
    ],
  },
}

