import { slugField, type CollectionConfig } from 'payload'

export const Redundancies: CollectionConfig = {
  slug: 'redundancies',
  trash: true,
  admin: {
    useAsTitle: 'studio',
    defaultColumns: ['studio', 'date', 'headcount', 'company', 'type', 'createdAt'],
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
    {
      name: 'studio',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'headcount',
      type: 'number',
      admin: {
        description: 'Number of people affected (if known)',
      },
    },
    {
      name: 'parent',
      type: 'text',
      admin: {
        description: 'Parent company name (as imported from CSV)',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: ['Indie', 'Console', 'Mobile', 'Online', 'AR/VR', 'Tech', 'Publisher'],
      admin: {
        description: 'Type of studio/business',
      },
    },
    {
      name: 'studioLocation',
      type: 'text',
      admin: {
        description: 'Location of the studio',
      },
    },
    {
      name: 'parentLocation',
      type: 'text',
      admin: {
        description: 'Location of the parent company',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      admin: {
        description: 'Matched company from database',
      },
    },
    {
      name: 'parentCompany',
      type: 'relationship',
      relationTo: 'companies',
      admin: {
        description: 'Matched parent company from database',
      },
    },
  ],
}
