import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { Company } from '@/payload-types'
import { getDescendants } from '@/utils/payloadTree.server'
import { OrganisingGroupPage } from './OrganisingGroupPage'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const groupsResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return groupsResult.docs.map((group) => ({
    slug: group.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const groupResult = await payload.find({
    collection: 'organisingGroups',
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

  if (groupResult.docs.length === 0) {
    return {
      title: 'Organising Group Not Found',
    }
  }

  const group = groupResult.docs[0]
  return {
    title: `${group.fullName || group.name} - Organising Groups - Game Workers Solidarity Platform`,
    description: `Learn about ${group.fullName || group.name} and related solidarity actions.`,
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const group = await payload
    .find({
      collection: 'organisingGroups',
      depth: 2, // Include related solidarity actions and their related entities
      draft: isDraftMode,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
        // Only fetch published content when not in draft mode
        ...(!isDraftMode
          ? {
              _status: {
                equals: 'published',
              },
            }
          : {}),
      },
    })
    .then(({ docs }) => docs?.[0])

  if (!group) {
    notFound()
  }

  const descendants = await getDescendants('organisingGroups', group.slug)

  // Query solidarity actions directly where this organising group is related
  const actionsResult = await payload.find({
    collection: 'events',
    sort: 'date:desc',
    where: {
      and: [
        {
          organisingGroups: {
            in: descendants.map((descendant) => descendant.id),
          },
        },
        ...(!isDraftMode
          ? [
              {
                _status: {
                  equals: 'published',
                },
              },
            ]
          : []),
      ],
    },
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const events = actionsResult.docs

  // Extract unique companies from solidarity actions
  const companiesSet = new Map<string, Company>()

  events.forEach((action) => {
    // Extract companies
    if (action.companies && Array.isArray(action.companies)) {
      action.companies.forEach((company) => {
        if (
          typeof company === 'object' &&
          company !== null &&
          'id' in company &&
          'slug' in company &&
          'name' in company
        ) {
          const companyId = String(company.id)
          if (!companiesSet.has(companyId)) {
            companiesSet.set(companyId, company)
          }
        }
      })
    }
  })

  const uniqueCompanies = Array.from(companiesSet.values())

  return <OrganisingGroupPage initialGroup={group} events={events} companies={uniqueCompanies} />
}
