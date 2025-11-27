import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { slugField, type CollectionConfig } from 'payload'
import { projectStrings } from '@/project-strings'

function getPath(siblingData: { slug: string }) {
  return `/campaigns/${siblingData.slug}`
}

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  trash: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'campaigns',
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
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Go into more detail.',
      },
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
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Choose a color for this page',
      },
    }),
    {
      name: 'emoji',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Used to illustrate the campaign label.',
      },
    },
    {
      label: 'Events',
      type: 'group',
      admin: {
        description:
          'Configure which events to include in this campaign. You can either select individual events or create a dynamic list of events based on selected companies, countries, categories, and organising groups.',
      },
      fields: [
        {
          name: 'events',
          label: 'Events',
          type: 'relationship',
          relationTo: 'events',
          hasMany: true,
        },
      ],
    },
    {
      name: 'path',
      type: 'text',
      virtual: true,
      required: true,
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
      required: true,
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
