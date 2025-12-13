'use server'

import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { EventNav, EventPage } from './EventPage'
import { Event } from '@/payload-types'
import { getSlug } from '@/utils/payloadPath'

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const events = await payload.find({
    collection: 'events',
    sort: '-date',
    depth: 2,
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

  const eventIdsIncluded: string[] = [event.id]

  for (const country of event?.countries ?? []) {
    if (typeof country === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { countries: { equals: country.id } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id && !eventIdsIncluded.includes(prevEvent.id)) {
      eventIdsIncluded.push(prevEvent.id)
      eventNav.previousInCountry![getSlug('countries', country)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { countries: { equals: country.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id && !eventIdsIncluded.includes(nextEvent.id)) {
      eventIdsIncluded.push(nextEvent.id)
      eventNav.nextInCountry![getSlug('countries', country)] = nextEvent
    }
    const sameDayEvent = await getNearestEvent(
      event,
      { countries: { equals: country.id } },
      'sameDay',
    )
    if (
      sameDayEvent &&
      sameDayEvent.id !== event.id &&
      !eventIdsIncluded.includes(sameDayEvent.id)
    ) {
      eventIdsIncluded.push(sameDayEvent.id)
      eventNav.sameDayInCountry![getSlug('countries', country)] = sameDayEvent
    }
  }

  for (const category of event?.categories ?? []) {
    if (typeof category === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { categories: { in: [category.id] } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id && !eventIdsIncluded.includes(prevEvent.id)) {
      eventIdsIncluded.push(prevEvent.id)
      eventNav.previousInCategory![getSlug('categories', category)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { categories: { equals: category.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id && !eventIdsIncluded.includes(nextEvent.id)) {
      eventIdsIncluded.push(nextEvent.id)
      eventNav.nextInCategory![getSlug('categories', category)] = nextEvent
    }
    const sameDayEvent = await getNearestEvent(
      event,
      { categories: { equals: category.id } },
      'sameDay',
    )
    if (
      sameDayEvent &&
      sameDayEvent.id !== event.id &&
      !eventIdsIncluded.includes(sameDayEvent.id)
    ) {
      eventIdsIncluded.push(sameDayEvent.id)
      eventNav.sameDayInCategory![getSlug('categories', category)] = sameDayEvent
    }
  }

  for (const company of event?.companies ?? []) {
    if (typeof company === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { companies: { equals: company.id } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id && !eventIdsIncluded.includes(prevEvent.id)) {
      eventIdsIncluded.push(prevEvent.id)
      eventNav.previousInCompany![getSlug('companies', company)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { companies: { equals: company.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id && !eventIdsIncluded.includes(nextEvent.id)) {
      eventIdsIncluded.push(nextEvent.id)
      eventNav.nextInCompany![getSlug('companies', company)] = nextEvent
    }
    const sameDayEvent = await getNearestEvent(
      event,
      { companies: { equals: company.id } },
      'sameDay',
    )
    if (
      sameDayEvent &&
      sameDayEvent.id !== event.id &&
      !eventIdsIncluded.includes(sameDayEvent.id)
    ) {
      eventIdsIncluded.push(sameDayEvent.id)
      eventNav.sameDayInCompany![getSlug('companies', company)] = sameDayEvent
    }
  }

  for (const organisingGroup of event?.organisingGroups ?? []) {
    if (typeof organisingGroup === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { organisingGroups: { equals: organisingGroup.id } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id && !eventIdsIncluded.includes(prevEvent.id)) {
      eventIdsIncluded.push(prevEvent.id)
      eventNav.previousInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] = prevEvent
    }
    const nextEvent = await getNearestEvent(
      event,
      { organisingGroups: { equals: organisingGroup.id } },
      'next',
    )
    if (nextEvent && nextEvent.id !== event.id && !eventIdsIncluded.includes(nextEvent.id)) {
      eventIdsIncluded.push(nextEvent.id)
      eventNav.nextInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] = nextEvent
    }
    const sameDayEvent = await getNearestEvent(
      event,
      { organisingGroups: { equals: organisingGroup.id } },
      'sameDay',
    )
    if (
      sameDayEvent &&
      sameDayEvent.id !== event.id &&
      !eventIdsIncluded.includes(sameDayEvent.id)
    ) {
      eventIdsIncluded.push(sameDayEvent.id)
      eventNav.sameDayInOrganisingGroup![getSlug('organisingGroups', organisingGroup)] =
        sameDayEvent
    }
  }

  for (const campaign of event?.campaigns?.docs ?? []) {
    if (typeof campaign === 'string') continue
    const prevEvent = await getNearestEvent(
      event,
      { campaigns: { equals: campaign.id } },
      'previous',
    )
    if (prevEvent && prevEvent.id !== event.id && !eventIdsIncluded.includes(prevEvent.id)) {
      eventIdsIncluded.push(prevEvent.id)
      eventNav.previousInCampaign![getSlug('campaigns', campaign)] = prevEvent
    }
    const nextEvent = await getNearestEvent(event, { campaigns: { equals: campaign.id } }, 'next')
    if (nextEvent && nextEvent.id !== event.id && !eventIdsIncluded.includes(nextEvent.id)) {
      eventIdsIncluded.push(nextEvent.id)
      eventNav.nextInCampaign![getSlug('campaigns', campaign)] = nextEvent
    }
    const sameDayEvent = await getNearestEvent(
      event,
      { campaigns: { equals: campaign.id } },
      'sameDay',
    )
    if (
      sameDayEvent &&
      sameDayEvent.id !== event.id &&
      !eventIdsIncluded.includes(sameDayEvent.id)
    ) {
      eventIdsIncluded.push(sameDayEvent.id)
      eventNav.sameDayInCampaign![getSlug('campaigns', campaign)] = sameDayEvent
    }
  }

  return <EventPage initialEvent={event} eventNav={eventNav} />

  async function getNearestEvent(
    event: Event,
    filter: any,
    direction: 'previous' | 'next' | 'sameDay',
  ) {
    const events = await payload.find({
      collection: 'events',
      where: {
        ...filter,
        date: {
          [direction === 'previous'
            ? 'less_than'
            : direction === 'next'
              ? 'greater_than'
              : 'equals']: event.date,
        },
        id: {
          not_equals: event.id,
        },
      },
      depth: 1,
      sort: direction === 'previous' ? '-date' : 'date',
      limit: 1,
    })
    return events.docs[0]
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const eventResult = await payload.find({
    collection: 'events',
    where: {
      slug: {
        equals: slug,
      },
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 0,
    draft: isDraftMode,
    limit: 1,
  })

  if (eventResult.docs.length === 0) {
    return {
      title: 'Event Not Found',
    }
  }

  const event = eventResult.docs[0]
  return {
    title: `${event.name} - Game Workers Solidarity Platform`,
    description:
      event.description?.root?.children[0]?.text ??
      `Learn about worker organising in the video game industry.`,
  }
}
