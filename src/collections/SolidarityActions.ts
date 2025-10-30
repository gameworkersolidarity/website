import { slugField, type CollectionConfig } from 'payload'

export const SolidarityActions: CollectionConfig = {
  slug: 'solidarityActions',
  admin: {
    useAsTitle: 'Name',
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
      name: 'airtableId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Legacy Airtable ID for URL redirects',
      },
      hidden: true,
    },
    slugField({
      fieldToUse: 'Name',
    }),
    {
      name: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'Location',
      type: 'text',
    },
    {
      name: 'Summary',
      type: 'richText',
    },
    {
      name: 'Date',
      type: 'date',
      required: true,
    },
    {
      name: 'LastModified',
      type: 'date',
      required: true,
    },
    {
      name: 'Link',
      type: 'text',
    },
    {
      name: 'LocationData',
      type: 'textarea',
    },
    {
      name: 'Country',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
    },
    {
      name: 'Company',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
    },
    {
      name: 'OrganisingGroups',
      type: 'relationship',
      relationTo: 'organisingGroups',
      hasMany: true,
    },
    {
      name: 'Category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'Document',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'DisplayStyle',
      type: 'select',
      options: ['Featured'],
    },
    {
      name: 'hasPassedValidation',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'Public',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
