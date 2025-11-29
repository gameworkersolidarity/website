import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'

export const Companies: CollectionConfig = {
  slug: 'companies',
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
        collection: 'companies',
        path: getPath('companies', { slug }),
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
    // {
    //   name: 'descendants',
    //   virtual: true,
    //   type: 'json',
    //   hooks: {
    //     afterRead: [
    //       async ({ siblingData }) => {
    //         const breadcrumbDictionary = new Map<string, Omit<Breadcrumb, 'doc'>>()
    //         for (const breadcrumb of siblingData.breadcrumbs) {
    //           breadcrumbDictionary.set(breadcrumb.doc, breadcrumb)
    //         }
    //         const payloadConfig = await config
    //         const payload = await getPayload({ config: payloadConfig })
    //         const instances = await payload.find({
    //           collection: 'companies',
    //           where: {
    //             'breadcrumbs.url': {
    //               contains: `/${siblingData.slug}`,
    //             },
    //           },
    //         })
    //         // const instances = { docs: [] as any }
    //         for (const instance of instances.docs) {
    //           for (const breadcrumb of instance.breadcrumbs || []) {
    //             const docId = typeof breadcrumb.doc === 'string' ? breadcrumb.doc : breadcrumb.id
    //             if (docId) {
    //               breadcrumbDictionary.set(docId, breadcrumb as any)
    //             }
    //           }
    //         }
    //         return Array.from(breadcrumbDictionary.values())
    //       },
    //     ],
    //   },
    // },
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
      name: 'countries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
      admin: {
        description: 'Countries where this company has workers.',
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
            return getPath('companies', { slug: siblingData.slug })
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
              getPath('companies', { slug: siblingData.slug }),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
  ],
}
