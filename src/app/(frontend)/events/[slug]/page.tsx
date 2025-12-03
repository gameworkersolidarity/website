'use server'

import { GetStaticPaths } from 'next'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { EventNav, EventPage } from './EventPage'
import { Event } from '@/payload-types'
import { getSlug } from '@/utils/payloadPath'

type PageParams = { slug: string }

export const getStaticPaths: GetStaticPaths<PageParams> = async (context) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    depth: 0,
    sort: 'date:desc',
  })

  return {
    paths: events.docs.map((event) => ({
      params: {
        ...event,
      },
    })),
    fallback: true,
  }
}

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    sort: 'date:desc',
    depth: 2,
    draft: isDraftMode,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const event = events.docs[0]

  if (!event) notFound()

  const eventNav: EventNav = {
    previousInCountry: {},
    nextInCountry: {},
    previousInCategory: {},
    nextInCategory: {},
    previousInCompany: {},
    nextInCompany: {},
    previousInOrganisingGroup: {},
    nextInOrganisingGroup: {},
    previousInCampaign: {},
    nextInCampaign: {},
  }

  for (const country of event?.countries ?? []) {
    if (typeof country === 'string') continue
    const prevEvent = await getNearestEvent(event, { countries: { in: [country.id] } }, 'previous')
    if (prevEvent && prevEvent.id !== event.id) {
      eventNav.previousInCountry![getSlug('countries', country)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { countries: { equals: country.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id) {
      eventNav.nextInCountry![getSlug('countries', country)] = nextEvent
    }
  }

  for (const category of event?.categories ?? []) {
    if (typeof category === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { categories: { in: [category.id] } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id) {
      eventNav.previousInCategory![getSlug('categories', category)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { categories: { equals: category.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id) {
      eventNav.nextInCategory![getSlug('categories', category)] = nextEvent
    }
  }

  for (const company of event?.companies ?? []) {
    if (typeof company === 'string') continue
    const prevEvent = await getNearestEvent(event, { companies: { in: [company.id] } }, 'previous')
    if (prevEvent && prevEvent.id !== event.id) {
      eventNav.previousInCompany![getSlug('companies', company)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { companies: { in: [company.id] } }, 'next')
    if (nextEvent && nextEvent.id !== event.id) {
      eventNav.nextInCompany![getSlug('companies', company)] = nextEvent
    }
  }

  for (const organisingGroup of event?.organisingGroups ?? []) {
    if (typeof organisingGroup === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { organisingGroups: { in: [organisingGroup.id] } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id) {
      eventNav.previousInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] = prevEvent
    }
    const nextEvent = await getNearestEvent(
      event,
      { organisingGroups: { equals: organisingGroup.id } },
      'next',
    )
    if (nextEvent && nextEvent.id !== event.id) {
      eventNav.nextInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] = nextEvent
    }
  }

  for (const campaign of event?.campaigns?.docs ?? []) {
    if (typeof campaign === 'string') continue
    const prevEvent = await getNearestEvent(event, { campaigns: { in: [campaign.id] } }, 'previous')
    if (prevEvent && prevEvent.id !== event.id) {
      eventNav.previousInCampaign![getSlug('campaigns', campaign)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { campaigns: { equals: campaign.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id) {
      eventNav.nextInCampaign![getSlug('campaigns', campaign)] = nextEvent
    }
  }

  return <EventPage initialEvent={event} eventNav={eventNav} />

  async function getNearestEvent(event: Event, filter: any, direction: 'previous' | 'next') {
    const config = {
      collection: 'events',
      where: {
        ...filter,
        date: {
          [direction === 'previous' ? 'less_than_equal' : 'greater_than_equal']: event.date,
        },
        id: {
          not_equals: event.id,
        },
      },
      depth: 1,
      sort: direction === 'previous' ? 'date:desc' : 'date:asc',
      limit: 1,
    }
    console.log('config', JSON.stringify(config, null, 2))
    const events = await payload.find(config)
    return events.docs[0]
  }
}
