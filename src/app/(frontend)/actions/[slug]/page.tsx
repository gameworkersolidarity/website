'use server'

import { getPayload } from 'payload'
import { fetchDraftMode } from '@/utils/auth'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { ActionNav, ActionPage } from './ActionPage'
import { Action } from '@/payload-types'
import { getSlug } from '@/utils/payloadPath'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { format } from 'date-fns'

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = await fetchDraftMode(payload)

  const actions = await payload.find({
    collection: 'actions',
    sort: '-date',
    depth: 2,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
    draft: isDraftMode,
  })

  const action = actions.docs[0]

  if (!action) notFound()

  const actionNav: ActionNav = {
    previousInCampaign: {},
    sameDayInCampaign: {},
    nextInCampaign: {},
    previousInCountry: {},
    sameDayInCountry: {},
    nextInCountry: {},
    previousInCategory: {},
    sameDayInCategory: {},
    nextInCategory: {},
    previousInCompany: {},
    sameDayInCompany: {},
    nextInCompany: {},
    previousInOrganisingGroup: {},
    sameDayInOrganisingGroup: {},
    nextInOrganisingGroup: {},
  }

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
    const sameDayAction = await getNearestAction(
      action,
      { countries: { equals: country.id } },
      'sameDay',
    )
    if (
      sameDayAction &&
      sameDayAction.id !== action.id &&
      !actionIdsIncluded.includes(sameDayAction.id)
    ) {
      actionIdsIncluded.push(sameDayAction.id)
      actionNav.sameDayInCountry![getSlug('countries', country)] = sameDayAction
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
    const sameDayAction = await getNearestAction(
      action,
      { categories: { equals: category.id } },
      'sameDay',
    )
    if (
      sameDayAction &&
      sameDayAction.id !== action.id &&
      !actionIdsIncluded.includes(sameDayAction.id)
    ) {
      actionIdsIncluded.push(sameDayAction.id)
      actionNav.sameDayInCategory![getSlug('categories', category)] = sameDayAction
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
    const sameDayAction = await getNearestAction(
      action,
      { companies: { equals: company.id } },
      'sameDay',
    )
    if (
      sameDayAction &&
      sameDayAction.id !== action.id &&
      !actionIdsIncluded.includes(sameDayAction.id)
    ) {
      actionIdsIncluded.push(sameDayAction.id)
      actionNav.sameDayInCompany![getSlug('companies', company)] = sameDayAction
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
    const sameDayAction = await getNearestAction(
      action,
      { organisingGroups: { equals: organisingGroup.id } },
      'sameDay',
    )
    if (
      sameDayAction &&
      sameDayAction.id !== action.id &&
      !actionIdsIncluded.includes(sameDayAction.id)
    ) {
      actionIdsIncluded.push(sameDayAction.id)
      actionNav.sameDayInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] =
        sameDayAction
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
    const sameDayAction = await getNearestAction(
      action,
      { campaigns: { equals: campaign.id } },
      'sameDay',
    )
    if (
      sameDayAction &&
      sameDayAction.id !== action.id &&
      !actionIdsIncluded.includes(sameDayAction.id)
    ) {
      actionIdsIncluded.push(sameDayAction.id)
      actionNav.sameDayInCampaign![getSlug('campaigns', campaign)] = sameDayAction
    }
  }

  return <ActionPage initialAction={action} actionNav={actionNav} />

  async function getNearestAction(
    action: Action,
    filter: any,
    direction: 'previous' | 'next' | 'sameDay',
  ) {
    const actions = await payload.find({
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
