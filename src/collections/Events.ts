import { getPayload, slugField, type CollectionConfig } from 'payload'
import { EventInitiator } from './enums'
import { projectStrings } from '@/project-strings'
import { geocodeOpenStreetMap } from '@/utils/geo'
import config from '@/payload.config'
import { getPath } from '@/utils/payloadPath'
import { Event } from '@/payload-types'

export const Events: CollectionConfig = {
  slug: 'events',
  trash: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'events',
        path: getPath('events', doc as unknown as Event),
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
            description: 'Optional end date for the event, if the event spans multiple days.',
          },
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: {
            description: 'What kind of event is this?',
          },
        },
        {
          name: 'headcount',
          type: 'number',
          admin: {
            description: 'How many workers were involved in, or affected by, this event.',
          },
        },
        {
          name: 'initiator',
          type: 'select',
          options: [
            {
              label: 'Worker-led (e.g. an action or worker news)',
              value: EventInitiator.WORKER_LED,
            },
            {
              label: 'Boss-led (e.g. a redundancy or a policy change)',
              value: EventInitiator.BOSS_LED,
            },
            {
              label: 'Other (neither worker-led nor boss-led)',
              value: EventInitiator.OTHER,
            },
          ],
          defaultValue: EventInitiator.WORKER_LED,
          admin: {
            description:
              'Who led this? Used to decide whether to display the event on timelines and so on.',
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
            description: 'Third party URL that evidences this event.',
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
        },
        {
          name: 'coordinates',
          type: 'json',
          admin: {
            hidden: true,
            readOnly: true,
            description:
              'Coordinates of the event. Will be automatically populated if the location, or country, is provided.',
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
        },
        {
          name: 'organisingGroups',
          type: 'relationship',
          relationTo: 'organisingGroups',
          hasMany: true,
        },
        {
          name: 'campaigns',
          type: 'join',
          collection: 'campaigns',
          on: 'events',
          admin: {
            description: 'Campaigns this event is part of.',
          },
        },
        {
          name: 'relatedEvents',
          type: 'array',
          label: 'Related events',
          admin: {
            description: 'Link related events and they will appear on the same timeline',
          },
          fields: [
            {
              name: 'event',
              type: 'relationship',
              relationTo: 'events',
              required: true,
              admin: {
                description: 'The event this is related to',
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
                description: 'How are these events related?',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  'Description of how these events are related (e.g., "The same organiser went on to do this other thing")',
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
            return getPath('events', siblingData as unknown as Event)
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
              getPath('events', siblingData as unknown as Event),
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
            return `/admin/collections/events/${siblingData.id}`
          },
        ],
      },
    },
    {
      name: 'submissionContactDetails',
      type: 'textarea',
      label: 'Contact Details',
      admin: {
        description: 'Contact information provided by the person who submitted this event',
        position: 'sidebar',
      },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: 'Consent',
      admin: {
        description: 'User consented to Game Worker Solidarity Project publishing this information online and offline',
        position: 'sidebar',
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
      async ({ doc, operation, req }) => {
        // Send email notification when a new event is created as a draft
        if (operation === 'create' && doc._status === 'draft' && doc.submissionContactDetails) {
          try {
            await req.payload.sendEmail({
              to: projectStrings.submissionNotificationEmail,
              from: projectStrings.email,
              subject: `New Event Submission: ${doc.name || 'Untitled Event'}`,
              html: `
                <h2>New Event Submission</h2>
                <p>A new event has been submitted and saved as a draft.</p>
                <h3>Event Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${doc.name || 'N/A'}</li>
                  <li><strong>Date:</strong> ${doc.date || 'N/A'}</li>
                  <li><strong>Location:</strong> ${doc.location || 'N/A'}</li>
                  <li><strong>ID:</strong> ${doc.id}</li>
                </ul>
                <h3>Contact Details:</h3>
                <p>${doc.submissionContactDetails || 'N/A'}</p>
                <p><a href="${projectStrings.baseUrl}/admin/collections/events/${doc.id}">View in Admin Panel</a></p>
              `,
              text: `
New Event Submission

A new event has been submitted and saved as a draft.

Event Details:
- Name: ${doc.name || 'N/A'}
- Date: ${doc.date || 'N/A'}
- Location: ${doc.location || 'N/A'}
- ID: ${doc.id}

Contact Details:
${doc.submissionContactDetails || 'N/A'}

View in Admin Panel: ${projectStrings.baseUrl}/admin/collections/events/${doc.id}
              `,
            })
          } catch (error) {
            console.error('Failed to send submission notification email:', error)
            // Don't throw - we don't want to fail the save if email fails
          }
        }
      },
    ],
  },
}
