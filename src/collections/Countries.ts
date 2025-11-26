import { slugField, type CollectionConfig } from 'payload'
import coords from 'country-coords'
import { colorPickerField } from '@/components/payloadcms/ColourPickerField'

export const Countries: CollectionConfig = {
  slug: 'countries',
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
        collection: 'countries',
        path: `/countries/${slug}`,
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
      name: 'countryCode',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'coords',
      type: 'json',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.countryCode) {
              return null
            }
            const countryData = coords[siblingData.countryCode]
            return countryData || null
          },
        ],
      },
    },
  ],
}
