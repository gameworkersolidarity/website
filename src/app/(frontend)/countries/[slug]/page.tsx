import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
import { Company, OrganisingGroup } from '@/payload-types'
import { CountryPage } from './CountryPage'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { validatePayloadDocument, validatePayloadResult } from '@/utils/validate-payload'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'countries',
    slug,
    notFoundTitle: 'Country Not Found',
    getTitle: (country) => `Game worker solidarity in ${country.name}`,
  })
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  const countryResult = await payloadUserQuery({
    collection: 'countries',
    depth: 2, // Include related solidarity actions and their related entities
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!countryResult.docs[0]) {
    notFound()
  }

  const country = validatePayloadDocument('countries', countryResult.docs[0])

  // Query solidarity actions directly where this country is related
  const actionsResult = await payloadUserQuery({
    collection: 'actions',
    where: {
      and: [
        {
          countries: {
            equals: country.id,
          },
        },
      ],
    },
    sort: '-date',
    depth: 2, // Include related entities
    pagination: false,
  })

  const validatedActions = validatePayloadResult('actions', actionsResult)
  const actions = validatedActions.docs

  // Extract unique companies from solidarity actions
  const companiesSet = new Map<string, Company>()
  const organisingGroupsSet = new Map<string, OrganisingGroup>()

  actions.forEach((action) => {
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

  const organisingGroupsResult = await payloadUserQuery({
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
      actions={actions}
      companies={uniqueCompanies}
      organisingGroups={organisingGroups}
    />
  )
}
