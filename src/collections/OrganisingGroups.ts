import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { slugField, type CollectionConfig } from 'payload'

export const OrganisingGroups: CollectionConfig = {
  slug: 'organisingGroups',
  trash: true,
  admin: {
    useAsTitle: 'name',
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'organisingGroups',
        path: `/groups/${slug}`,
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
      fieldToUse: 'name',
    }),
    {
      name: 'name',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
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
      admin: {
        position: 'sidebar',
        description: 'Choose a color for this page',
      },
    }),
    {
      name: 'fullName',
      type: 'text',
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
    },
    {
      name: 'isUnion',
      type: 'checkbox',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'bluesky',
      type: 'text',
    },
    {
      name: 'twitter',
      type: 'text',
    },
    {
      name: 'children',
      type: 'relationship',
      relationTo: 'organisingGroups',
      hasMany: true,
      admin: {
        description: 'Child/sub-organising groups',
      },
    },
  ],
}
