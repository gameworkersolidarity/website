import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'

function getPath(siblingData: { slug: string }) {
  return `/groups/${siblingData.slug}`
}

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
      name: 'fullName',
      type: 'text',
    },
    {
      name: 'countries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
      admin: {
        description: 'Countries where this group organises.',
      },
    },
    {
      name: 'companies',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
      admin: {
        description: 'Companies this group organises workers within.',
      },
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
