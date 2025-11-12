import { type CollectionConfig } from 'payload'

export const EventLinks: CollectionConfig = {
  slug: 'eventLinks',
  admin: {
    useAsTitle: 'comment',
    defaultColumns: ['fromEvent', 'toEvent', 'quality', 'comment', 'createdAt'],
    description: 'Links between events with descriptive comments',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'fromEvent',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      admin: {
        description: 'The source event',
      },
    },
    {
      name: 'toEvent',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      admin: {
        description: 'The target/related event',
      },
      validate: (value, { data }) => {
        if (value && data?.fromEvent && value === data.fromEvent) {
          return 'An event cannot link to itself'
        }
        return true
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
        description: 'The quality of the relationship between events',
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
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Prevent duplicate links (both directions)
        if (data?.fromEvent && data?.toEvent && operation === 'create') {
          const existingLink = await req.payload.find({
            collection: 'eventLinks',
            where: {
              or: [
                {
                  and: [
                    { fromEvent: { equals: data.fromEvent } },
                    { toEvent: { equals: data.toEvent } },
                  ],
                },
                {
                  and: [
                    { fromEvent: { equals: data.toEvent } },
                    { toEvent: { equals: data.fromEvent } },
                  ],
                },
              ],
            },
            limit: 1,
          })

          if (existingLink.docs.length > 0) {
            throw new Error('A link between these two events already exists')
          }
        }
      },
    ],
  },
  indexes: [
    {
      fields: ['fromEvent', 'toEvent'],
      unique: true,
    },
  ],
}

