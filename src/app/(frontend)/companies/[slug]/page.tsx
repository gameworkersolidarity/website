import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { getDescendants } from '@/utils/payloadTree.server'
import { CompanyPage } from './CompanyPage'
import { getSlug } from '@/utils/payloadPath'
import { Country, OrganisingGroup } from '@/payload-types'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const companiesResult = await payload.find({
    collection: 'companies',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return companiesResult.docs
    .map((company) => ({
      slug: getSlug('companies', company),
    }))
    .filter((company) => !!company.slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const companyResult = await payload.find({
    collection: 'companies',
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

  if (companyResult.docs.length === 0) {
    return {
      title: 'Company Not Found',
    }
  }

  const company = companyResult.docs[0]
  return {
    title: `Worker organising at ${company.name} - Game Workers Solidarity Platform`,
    description:
      company.description?.root?.children[0]?.text ??
      `Learn about video game worker organising at ${company.name}.`,
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

  const company = await payload
    .find({
      collection: 'companies',
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

  if (!company) {
    notFound()
  }

  const descendants = await getDescendants('companies', getSlug('companies', company))

  // Query solidarity actions and redundancies directly where this company is related
  const eventResults = await payload.find({
    collection: 'events',
    where: {
      and: [
        {
          companies: {
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
    sort: '-date',
    depth: 2, // Include related entities
    draft: isDraftMode,
    pagination: false,
  })

  const events = eventResults.docs

  const uniqueOrganisingGroups = Array.from(
    new Set(events.flatMap((event) => event.organisingGroups as OrganisingGroup[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  const uniqueCountries = Array.from(
    new Set(events.flatMap((event) => event.countries as Country[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <CompanyPage
      initialCompany={company}
      descendants={descendants.length > 1 ? descendants : null}
      events={events}
      organisingGroups={uniqueOrganisingGroups}
      countries={uniqueCountries}
    />
  )
}
