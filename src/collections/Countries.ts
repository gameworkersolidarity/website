import { slugField, type CollectionConfig } from 'payload'
import coords from 'country-coords'
import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { getCountryFlag } from '@/utils/iso'
import { projectStrings } from '@/project-strings'
import { getBboxForCountry, getIsoA3ForCountry, getLatLngForCountry } from '@/utils/geo'

function getPath(siblingData: { slug: string }) {
  return `/countries/${siblingData.slug}`
}

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
        path: getPath({ slug }),
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
      required: true,
      position: 'sidebar',
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
      name: 'isoA2',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'emoji',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.isoA2) {
              return null
            }
            return getCountryFlag(siblingData.isoA2)
          },
        ],
      },
    },
    {
      name: 'bbox',
      type: 'json',
      virtual: true,
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getBboxForCountry(siblingData.isoA2)
          },
        ],
      },
    },
    {
      name: 'isoA3',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getIsoA3ForCountry(siblingData.isoA2)
          },
        ],
      },
    },
    {
      name: 'coordinates',
      type: 'json',
      virtual: true,
      hidden: true,
      typescriptSchema: [
        ({ jsonSchema }) => ({
          ...jsonSchema,
          type: 'object',
          properties: {
            latitude: { type: 'number', required: true },
            longitude: { type: 'number', required: true },
          },
          required: ['latitude', 'longitude'],
        }),
      ],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getLatLngForCountry(siblingData.isoA2)
          },
        ],
      },
    },
    {
      name: 'path',
      type: 'text',
      virtual: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath(siblingData as unknown as { slug: string })
          },
        ],
      },
    },
    {
      name: 'url',
      type: 'text',
      virtual: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return new URL(
              getPath(siblingData as unknown as { slug: string }),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
  ],
}
