'use server'

import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
import { ActionNav, ActionPage } from './ActionPage'
import { Action } from '@/payload-types'
import { getSlug } from '@/utils/payloadPath'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { getMediaUrl, getThumbnailUrl } from '@/utils/media'
import { projectStrings } from '@/project-strings'
import type { Media } from '@/payload-types'
import { format } from 'date-fns'
import { validatePayloadDocument, validatePayloadDocuments } from '@/utils/validate-payload'

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const actions = await payloadUserQuery({
    collection: 'actions',
    sort: '-date',
    depth: 2,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!actions.docs[0]) notFound()

  const action = validatePayloadDocument('actions', actions.docs[0])

  const actionNav: ActionNav = {
    previousInCampaign: {},
    nextInCampaign: {},
    previousInCountry: {},
    nextInCountry: {},
    previousInCategory: {},
    nextInCategory: {},
    previousInCompany: {},
    nextInCompany: {},
    previousInOrganisingGroup: {},
    nextInOrganisingGroup: {},
    sameDay: [],
  }

  const sameDayActionsResult = await payloadUserQuery({
    collection: 'actions',
    where: {
      date: {
        equals: action.date,
      },
      id: {
        not_equals: action.id,
      },
    },
    depth: 2,
  })

  actionNav.sameDay = validatePayloadDocuments('actions', sameDayActionsResult.docs)

  const actionIdsIncluded: string[] = [action.id]

  for (const country of action?.countries ?? []) {
    if (typeof country === 'string') continue
    const prevAction = await getNearestAction(
      action,
      { countries: { equals: country.id } },
      'previous',
    )
    if (prevAction && prevAction.id !== action.id && !actionIdsIncluded.includes(prevAction.id)) {
      actionIdsIncluded.push(prevAction.id)
      actionNav.previousInCountry![getSlug('countries', country)] = prevAction
    }
    const nextAction = await getNearestAction(action, { countries: { equals: country.id } }, 'next')
    if (nextAction && nextAction.id !== action.id && !actionIdsIncluded.includes(nextAction.id)) {
      actionIdsIncluded.push(nextAction.id)
      actionNav.nextInCountry![getSlug('countries', country)] = nextAction
    }
  }

  for (const category of action?.categories ?? []) {
    if (typeof category === 'string') continue
    const prevAction = await getNearestAction(
      action,
      { categories: { in: [category.id] } },
      'previous',
    )
    if (prevAction && prevAction.id !== action.id && !actionIdsIncluded.includes(prevAction.id)) {
      actionIdsIncluded.push(prevAction.id)
      actionNav.previousInCategory![getSlug('categories', category)] = prevAction
    }
    const nextAction = await getNearestAction(
      action,
      { categories: { equals: category.id } },
      'next',
    )
    if (nextAction && nextAction.id !== action.id && !actionIdsIncluded.includes(nextAction.id)) {
      actionIdsIncluded.push(nextAction.id)
      actionNav.nextInCategory![getSlug('categories', category)] = nextAction
    }
  }

  for (const company of action?.companies ?? []) {
    if (typeof company === 'string') continue
    const prevAction = await getNearestAction(
      action,
      { companies: { equals: company.id } },
      'previous',
    )
    if (prevAction && prevAction.id !== action.id && !actionIdsIncluded.includes(prevAction.id)) {
      actionIdsIncluded.push(prevAction.id)
      actionNav.previousInCompany![getSlug('companies', company)] = prevAction
    }
    const nextAction = await getNearestAction(action, { companies: { equals: company.id } }, 'next')
    if (nextAction && nextAction.id !== action.id && !actionIdsIncluded.includes(nextAction.id)) {
      actionIdsIncluded.push(nextAction.id)
      actionNav.nextInCompany![getSlug('companies', company)] = nextAction
    }
  }

  for (const organisingGroup of action?.organisingGroups ?? []) {
    if (typeof organisingGroup === 'string') continue
    const prevAction = await getNearestAction(
      action,
      { organisingGroups: { equals: organisingGroup.id } },
      'previous',
    )
    if (prevAction && prevAction.id !== action.id && !actionIdsIncluded.includes(prevAction.id)) {
      actionIdsIncluded.push(prevAction.id)
      actionNav.previousInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] =
        prevAction
    }
    const nextAction = await getNearestAction(
      action,
      { organisingGroups: { equals: organisingGroup.id } },
      'next',
    )
    if (nextAction && nextAction.id !== action.id && !actionIdsIncluded.includes(nextAction.id)) {
      actionIdsIncluded.push(nextAction.id)
      actionNav.nextInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] = nextAction
    }
  }

  for (const campaign of action?.campaigns?.docs ?? []) {
    if (typeof campaign === 'string') continue
    const prevAction = await getNearestAction(
      action,
      { campaigns: { equals: campaign.id } },
      'previous',
    )
    if (prevAction && prevAction.id !== action.id && !actionIdsIncluded.includes(prevAction.id)) {
      actionIdsIncluded.push(prevAction.id)
      actionNav.previousInCampaign![getSlug('campaigns', campaign)] = prevAction
    }
    const nextAction = await getNearestAction(
      action,
      { campaigns: { equals: campaign.id } },
      'next',
    )
    if (nextAction && nextAction.id !== action.id && !actionIdsIncluded.includes(nextAction.id)) {
      actionIdsIncluded.push(nextAction.id)
      actionNav.nextInCampaign![getSlug('campaigns', campaign)] = nextAction
    }
  }

  return <ActionPage initialAction={action} actionNav={actionNav} />

  async function getNearestAction(
    action: Action,
    filter: any,
    direction: 'previous' | 'next' | 'sameDay',
  ) {
    const actions = await payloadUserQuery({
      collection: 'actions',
      where: {
        ...filter,
        date: {
          [direction === 'previous'
            ? 'less_than'
            : direction === 'next'
              ? 'greater_than'
              : 'equals']: action.date,
        },
        id: {
          not_equals: action.id,
        },
      },
      depth: 2,
      sort: direction === 'previous' ? '-date' : 'date',
      limit: 1,
    })
    return actions.docs[0]
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'actions',
    slug,
    notFoundTitle: 'Action Not Found',
    getImages: (record: any) => {
      const documents = record?.documents
      if (!Array.isArray(documents) || documents.length === 0) return undefined
      const first = documents[0]
      if (typeof first !== 'object' || first === null) return undefined
      const media = first as Media
      let url = getThumbnailUrl(media) || getMediaUrl(media, { baseUrl: projectStrings.baseUrl })
      if (!url) return undefined
      if (url.startsWith('/')) url = `${projectStrings.baseUrl}${url}`
      return [
        {
          url,
          width: media.width || 1200,
          height: media.height || 630,
          alt: media.alt || record.name || 'Action',
        },
      ]
    },
    getDescription: async (record: any) => {
      const parts: string[] = []

      // Add date information
      if (record.date) {
        const actionDate = new Date(record.date)
        const dateStr = format(actionDate, 'e MMM yy')
        parts.push(dateStr)
      }

      // Add location information
      if (record.location) {
        parts.push(record.location)
      } else if (
        record.countries &&
        Array.isArray(record.countries) &&
        record.countries.length > 0
      ) {
        const countryNames = record.countries
          .map((c: any) => (typeof c === 'object' ? c.name : null))
          .filter(Boolean)
          .slice(0, 2)
        if (countryNames.length > 0) {
          parts.push(countryNames.join(', '))
        }
      }

      // Add company information
      // if (record.companies && Array.isArray(record.companies) && record.companies.length > 0) {
      //   const companyNames = record.companies
      //     .map((c: any) => (typeof c === 'object' ? c.name : null))
      //     .filter(Boolean)
      //     .slice(0, 2)
      //   if (companyNames.length > 0) {
      //     parts.push(`at ${companyNames.join(', ')}`)
      //   }
      // }

      // // Add headcount if available
      // if (record.headcount) {
      //   parts.push(`${record.headcount} workers affected`)
      // }

      // Add description if available
      if (record.description) {
        const descText = lexicalToPlainText(record.description)
        if (descText) {
          // Truncate description to fit in share card (max ~200 chars)
          const truncatedDesc =
            descText.length > 200 ? descText.substring(0, 197) + '...' : descText
          parts.push(truncatedDesc)
        }
      }

      // Build final description
      let description = parts.join(' • ')

      // Fallback if no parts
      if (!description) {
        description = `Learn about this worker organising action in the video game industry.`
      }

      return description
    },
  })
}
