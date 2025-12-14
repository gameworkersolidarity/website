import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { Company, OrganisingGroup } from '@/payload-types'
import { CountryPage } from './CountryPage'

export async function generateStaticParams() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const countriesResult = await payload.find({
    collection: 'countries',
    where: {
      _status: {
        equals: 'published',
      },
    },
    pagination: false,
  })

  return countriesResult.docs
    .map((country) => ({
      slug: country.slug,
    }))
    .filter((country) => !!country.slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const isDraftMode = (await draftMode()).isEnabled
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { slug } = await params

  const countryResult = await payload.find({
    collection: 'countries',
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

  if (countryResult.docs.length === 0) {
    return {
      title: 'Country Not Found',
    }
  }

  const country = countryResult.docs[0]
  return {
    title: `Worker organising in ${country.name}`,
    description:
      country.description?.root?.children[0]?.text ??
      `Learn about video game worker organising in ${country.name}.`,
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

  const country = await payload
    .find({
      collection: 'countries',
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

  if (!country) {
    notFound()
  }

  // Query solidarity actions directly where this country is related
  const actionsResult = await payload.find({
    collection: 'events',
    where: {
      and: [
        {
          countries: {
            equals: country.id,
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

  const events = actionsResult.docs

  // Extract unique companies from solidarity actions
  const companiesSet = new Map<string, Company>()
  const organisingGroupsSet = new Map<string, OrganisingGroup>()

  events.forEach((action) => {
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
    if (action.organisingGroups && Array.isArray(action.organisingGroups)) {
      action.organisingGroups.forEach((organisingGroup) => {
        if (
          typeof organisingGroup === 'object' &&
          organisingGroup !== null &&
          'id' in organisingGroup &&
          'slug' in organisingGroup &&
          'name' in organisingGroup
        ) {
          const organisingGroupId = String(organisingGroup.id)
          if (!organisingGroupsSet.has(organisingGroupId)) {
            organisingGroupsSet.set(organisingGroupId, organisingGroup)
          }
        }
      })
    }
  })

  const uniqueCompanies = Array.from(companiesSet.values())
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  const organisingGroupsResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      countries: {
        in: [country.id],
      },
    },
  })

  for (const organisingGroup of organisingGroupsResult.docs) {
    // add to organisingGroupsMap
    organisingGroupsSet.set(organisingGroup.id, organisingGroup)
  }

  const organisingGroups = Array.from(organisingGroupsSet.values())
    .filter(Boolean)
    // Only top level organising groups
    .filter((organisingGroup) => !organisingGroup.parent)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <CountryPage
      initialCountry={country}
      events={events}
      companies={uniqueCompanies}
      organisingGroups={organisingGroups}
    />
  )
}
