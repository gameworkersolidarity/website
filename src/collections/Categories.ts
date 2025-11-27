import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { slugField, type CollectionConfig } from 'payload'
import { projectStrings } from '@/project-strings'

function getPath(siblingData: { slug: string }) {
  return `/categories/${siblingData.slug}`
}

export const Categories: CollectionConfig = {
  slug: 'categories',
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
        collection: 'categories',
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
      required: true,
    },
    {
      name: 'emoji',
      type: 'text',
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
        description: 'Choose a color for this page',
      },
    }),
    {
      name: 'path',
      type: 'text',
      virtual: true,
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
