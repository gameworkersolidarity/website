import { slugField, type CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return false
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'events',
        path: `/events/${slug}`,
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
      fieldToUse: 'title',
    }),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'relatedEvents',
      type: 'array',
      label: 'Related Events',
      admin: {
        description: 'Create links to related events directly from this event',
      },
      fields: [
        {
          name: 'relatedEvent',
          type: 'relationship',
          relationTo: 'events',
          required: true,
          admin: {
            description: 'The event this is related to',
          },
        },
        {
          name: 'quality',
          type: 'select',
          options: [
            {
              label: 'Direct',
              value: 'DIRECT',
            },
            {
              label: 'Indirect',
              value: 'INDIRECT',
            },
          ],
          required: true,
          defaultValue: 'DIRECT',
          admin: {
            description: 'The quality of the relationship',
          },
        },
        {
          name: 'comment',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Description of how these events are related (e.g., "The same organiser went on to do this other thing")',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, id }) => {
        // Validate that relatedEvents don't link to the same event or to itself
        if (data?.relatedEvents && Array.isArray(data.relatedEvents)) {
          const relatedEventIds = new Set()
          const currentEventId = id || (data.id ? String(data.id) : null)
          
          for (const item of data.relatedEvents) {
            if (item?.relatedEvent) {
              const eventId =
                typeof item.relatedEvent === 'object'
                  ? item.relatedEvent.id
                  : String(item.relatedEvent)
              
              // Prevent self-links
              if (currentEventId && eventId === currentEventId) {
                throw new Error(
                  'An event cannot link to itself',
                )
              }
              
              // Prevent duplicate links in the same array
              if (relatedEventIds.has(eventId)) {
                throw new Error(
                  'Cannot link to the same event multiple times in related events',
                )
              }
              relatedEventIds.add(eventId)
            }
          }
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Only process if relatedEvents field exists and has data
        if (!doc?.relatedEvents || !Array.isArray(doc.relatedEvents)) {
          // If relatedEvents is empty or null, clean up existing links
          if (doc?.id) {
            const existingLinks = await req.payload.find({
              collection: 'eventLinks',
              where: {
                fromEvent: {
                  equals: doc.id,
                },
              },
              limit: 1000,
            })
            for (const link of existingLinks.docs) {
              await req.payload.delete({
                collection: 'eventLinks',
                id: link.id,
              })
            }
          }
          return
        }

        const currentEventId = doc.id
        if (!currentEventId) return

        // Get existing EventLinks for this event (as fromEvent)
        const existingLinks = await req.payload.find({
          collection: 'eventLinks',
          where: {
            fromEvent: {
              equals: currentEventId,
            },
          },
          limit: 1000,
        })

        const existingLinkMap = new Map()
        existingLinks.docs.forEach((link) => {
          const toEventId =
            typeof link.toEvent === 'object' ? link.toEvent.id : link.toEvent
          existingLinkMap.set(toEventId, link.id)
        })

        // Process each related event
        const processedToEventIds = new Set()

        for (const relatedEventItem of doc.relatedEvents) {
          if (!relatedEventItem?.relatedEvent) continue

          const toEventId =
            typeof relatedEventItem.relatedEvent === 'object'
              ? relatedEventItem.relatedEvent.id
              : relatedEventItem.relatedEvent

          // Skip if linking to itself
          if (toEventId === currentEventId) continue

          processedToEventIds.add(toEventId)

          const linkData = {
            fromEvent: currentEventId,
            toEvent: toEventId,
            quality: relatedEventItem.quality || 'DIRECT',
            comment: relatedEventItem.comment || '',
          }

          // Check if link already exists
          const existingLinkId = existingLinkMap.get(toEventId)

          if (existingLinkId) {
            // Update existing link
            await req.payload.update({
              collection: 'eventLinks',
              id: existingLinkId,
              data: linkData,
            })
          } else {
            // Check if reverse link exists
            const reverseLink = await req.payload.find({
              collection: 'eventLinks',
              where: {
                and: [
                  { fromEvent: { equals: toEventId } },
                  { toEvent: { equals: currentEventId } },
                ],
              },
              limit: 1,
            })

            if (reverseLink.docs.length > 0) {
              // Update reverse link
              await req.payload.update({
                collection: 'eventLinks',
                id: reverseLink.docs[0].id,
                data: {
                  fromEvent: toEventId,
                  toEvent: currentEventId,
                  quality: linkData.quality,
                  comment: linkData.comment,
                },
              })
            } else {
              // Create new link
              await req.payload.create({
                collection: 'eventLinks',
                data: linkData,
              })
            }
          }
        }

        // Remove EventLinks that are no longer in the relatedEvents array
        for (const existingLink of existingLinks.docs) {
          const toEventId =
            typeof existingLink.toEvent === 'object'
              ? existingLink.toEvent.id
              : existingLink.toEvent

          if (!processedToEventIds.has(toEventId)) {
            await req.payload.delete({
              collection: 'eventLinks',
              id: existingLink.id,
            })
          }
        }
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        // Populate relatedEvents from EventLinks when reading
        if (!doc?.id) return doc

        // Only populate if relatedEvents is not already set (to avoid overwriting during admin edit)
        if (doc.relatedEvents && Array.isArray(doc.relatedEvents) && doc.relatedEvents.length > 0) {
          return doc
        }

        const eventLinks = await req.payload.find({
          collection: 'eventLinks',
          where: {
            fromEvent: {
              equals: doc.id,
            },
          },
          limit: 1000,
          depth: 1,
        })

        // Map EventLinks to relatedEvents format
        doc.relatedEvents = eventLinks.docs.map((link) => ({
          relatedEvent:
            typeof link.toEvent === 'object' ? link.toEvent.id : link.toEvent,
          quality: link.quality || 'DIRECT',
          comment: link.comment || '',
        }))

        return doc
      },
    ],
  },
}

