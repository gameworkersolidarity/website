import { getPayload, slugField, type CollectionConfig } from 'payload'
import { ActionInitiator } from './enums'
import { projectStrings } from '@/project-strings'
import { geocodeOpenStreetMap } from '@/utils/geo'
import config from '@/payload.config'
import { getPath } from '@/utils/payloadPath'
import { Action, Category, Company, Country, OrganisingGroup } from '@/payload-types'
import {
  draftModeAccessControl,
  loggedInUserOnly,
  loggedInUserOnlyFieldsHook,
} from '@/app/(payload)/querying/accessControl'
import { revalidateCacheHook } from '@/lib/revalidate-on-change'
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { LexicalContent } from '@/global-types'
import { after } from 'next/server'

export const Actions: CollectionConfig = {
  slug: 'actions',
  admin: {
    useAsTitle: 'name',
    description:
      'Individual actions (strikes, protests, events). Core content with date, location, and relations to campaigns, companies, countries, and categories.',
    defaultColumns: ['name', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'actions',
        path: getPath('actions', doc as unknown as Action),
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
  },
  trash: true,
  access: {
    read: draftModeAccessControl,
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
      name: 'airtableId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Legacy Airtable ID for url redirects.',
      },
      hidden: true,
    },
    {
      name: 'description',
      type: 'richText',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value, columnName, row }) => {
            if (value) {
              delete row[columnName]
              row[`${columnName}_plainText`] = lexicalToPlainText(
                value as NonNullable<LexicalContent>,
              )
            }
          },
        },
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Internal notes on where this data came from. Will be prefilled in the case of automatic ingestions from other datasets.',
      },
    },
    {
      label: 'Metadata',
      type: 'group',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            description: 'Optional end date for the action, if the action spans multiple days.',
          },
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: {
            description: 'What kind of action is this?',
          },
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row }) => {
                if (value) {
                  // @ts-ignore
                  row[columnName] = value.map((v: Category) => v.name).join(', ')
                }
              },
            },
          },
        },
        {
          name: 'headcount',
          type: 'number',
          admin: {
            description: 'How many workers were involved in, or affected by, this action.',
          },
        },
        {
          name: 'initiator',
          type: 'select',
          options: [
            {
              label: 'Worker-led (e.g. an action or worker news)',
              value: ActionInitiator.WORKER_LED,
            },
            {
              label: 'Boss-led (e.g. a redundancy or a policy change)',
              value: ActionInitiator.BOSS_LED,
            },
            {
              label: 'Other (neither worker-led nor boss-led)',
              value: ActionInitiator.OTHER,
            },
          ],
          defaultValue: ActionInitiator.WORKER_LED,
          admin: {
            description:
              'Who led this? Used to decide whether to display the action on timelines and so on.',
          },
        },
      ],
    },
    {
      label: 'Media',
      type: 'group',
      fields: [
        {
          name: 'link',
          type: 'text',
          admin: {
            description: 'Third party URL that evidences this action.',
          },
        },
        {
          name: 'documents',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
        },
      ],
    },
    {
      label: 'Geography',
      type: 'group',
      fields: [
        {
          name: 'location',
          type: 'text',
        },
        {
          name: 'countries',
          type: 'relationship',
          relationTo: 'countries',
          hasMany: true,
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row }) => {
                if (value) {
                  // @ts-ignore
                  row[columnName] = value.map((v: Country) => v.name).join(', ')
                }
              },
            },
          },
        },
        {
          name: 'coordinates',
          type: 'json',
          admin: {
            hidden: true,
            readOnly: true,
            description:
              'Coordinates of the action. Will be automatically populated if the location, or country, is provided.',
          },
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
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row }) => {
                if (
                  value &&
                  typeof value === 'object' &&
                  'latitude' in value &&
                  'longitude' in value
                ) {
                  delete row[columnName]
                  row['latitude'] = value.latitude
                  row['longitude'] = value.longitude
                }
              },
            },
          },
        },
      ],
    },
    {
      label: 'Connections',
      type: 'group',
      fields: [
        // Relations
        {
          name: 'companies',
          type: 'relationship',
          relationTo: 'companies',
          hasMany: true,
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row }) => {
                if (value) {
                  delete row[columnName]
                  // @ts-ignore
                  row[columnName] = value.map((v: Company) => v.name).join(', ')
                }
              },
            },
          },
        },
        {
          name: 'organisingGroups',
          type: 'relationship',
          relationTo: 'organisingGroups',
          hasMany: true,
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row }) => {
                if (value) {
                  // @ts-ignore
                  row[columnName] = value.map((v: OrganisingGroup) => v.name).join(', ')
                }
              },
            },
          },
        },
        {
          name: 'campaigns',
          type: 'join',
          collection: 'campaigns',
          on: 'actions',
          admin: {
            description: 'Campaigns this action is part of.',
          },
          custom: {
            'plugin-import-export': {
              disabled: true,
            },
          },
        },
        {
          name: 'relatedActions',
          type: 'array',
          label: 'Related actions',
          admin: {
            description: 'Link related actions and they will appear on the same timeline',
          },
          fields: [
            {
              name: 'action',
              type: 'relationship',
              relationTo: 'actions',
              required: true,
              admin: {
                description: 'The action this is related to',
              },
            },
            {
              name: 'connectionType',
              type: 'select',
              options: [
                {
                  label: 'Direct (e.g. the same organiser)',
                  value: 'DIRECT',
                },
                {
                  label: 'Indirect (e.g. inspired by or influenced by)',
                  value: 'INDIRECT',
                },
              ],
              required: true,
              defaultValue: 'DIRECT',
              admin: {
                description: 'How are these actions related?',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  'Description of how these actions are related (e.g., "The same organiser went on to do this other thing")',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'path',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath('actions', siblingData as unknown as Action)
          },
        ],
      },
    },
    {
      name: 'url',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return new URL(
              getPath('actions', siblingData as unknown as Action),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
    {
      name: 'adminPath',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string', required: true })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return `/admin/collections/actions/${siblingData.id}`
          },
        ],
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      access: {
        read: loggedInUserOnly,
      },
      admin: {
        description:
          'Featured actions will be highlighted on timelines and show descriptions in preview mode',
        position: 'sidebar',
      },
      custom: {
        'plugin-import-export': {
          disabled: true,
        },
      },
    },
    {
      name: 'submissionContactDetails',
      type: 'textarea',
      label: 'Contact Details',
      access: {
        read: loggedInUserOnly,
      },
      admin: {
        description: 'Contact information provided by the person who submitted this action',
        position: 'sidebar',
      },
      custom: {
        'plugin-import-export': {
          disabled: true,
        },
      },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: 'Consent',
      custom: {
        'plugin-import-export': {
          disabled: true,
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data.countries?.length) {
          const payloadConfig = await config
          const payload = await getPayload({ config: payloadConfig })
          const country0 = data.countries?.[0]
          if (!country0) {
            return data
          }
          const country0Data = await payload.find({
            collection: 'countries',
            where: {
              id: {
                equals: country0,
              },
            },
            limit: 1,
          })
          const country0isoA2 = country0Data.docs?.[0]?.isoA2
          if (!country0isoA2) {
            return data
          }
          if (data.location) {
            const geo = await geocodeOpenStreetMap(data.location, country0isoA2)
            if (!geo) {
              return data
            }
            data.coordinates = {
              latitude: parseFloat(geo.lat),
              longitude: parseFloat(geo.lon),
            }
            return data
          } else if (country0Data.docs?.[0]?.coordinates) {
            data.coordinates = {
              latitude: country0Data.docs?.[0]?.coordinates?.latitude,
              longitude: country0Data.docs?.[0]?.coordinates?.longitude,
            }
            return data
          }
        }

        return data
      },
    ],
    afterChange: [
      async () => {
        after(() => {
          revalidateCacheHook('actions')
        })
      },
      async ({ doc, operation, req }) => {
        // Send email notification when a new action is created as a draft
        if (operation === 'create' && doc._status === 'draft' && doc.submissionContactDetails) {
          try {
            await req.payload.sendEmail({
              to: process.env.SUBMISSION_NOTIFICATION_EMAIL,
              from: projectStrings.email,
              subject: `New Action Submission: ${doc.name || 'Untitled Action'}`,
              html: `
                <h2>New Action Submission</h2>
                <p>A new action has been submitted and saved as a draft.</p>
                <h3>Action Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${doc.name || 'N/A'}</li>
                  <li><strong>Date:</strong> ${doc.date || 'N/A'}</li>
                  <li><strong>Location:</strong> ${doc.location || 'N/A'}</li>
                  <li><strong>ID:</strong> ${doc.id}</li>
                </ul>
                <h3>Contact Details:</h3>
                <p>${doc.submissionContactDetails || 'N/A'}</p>
                <p><a href="${projectStrings.baseUrl}/admin/collections/actions/${doc.id}">View in Admin Panel</a></p>
              `,
              text: `
New Action Submission

A new action has been submitted and saved as a draft.

Action Details:
- Name: ${doc.name || 'N/A'}
- Date: ${doc.date || 'N/A'}
- Location: ${doc.location || 'N/A'}
- ID: ${doc.id}

Contact Details:
${doc.submissionContactDetails || 'N/A'}

View in Admin Panel: ${projectStrings.baseUrl}/admin/collections/actions/${doc.id}
              `,
            })
          } catch (error) {
            console.error('Failed to send submission notification email:', error)
            // Don't throw - we don't want to fail the save if email fails
          }
        }
      },
    ],
    afterDelete: [revalidateCacheHook('actions')],
  },
}
