import { notFound } from 'next/navigation'
import { getCachedDataForSlug } from '@/utils/payload.server'
import { getDescendants } from '@/utils/payloadTree.server'
import { CompanyPage } from './CompanyPage'
import { getSlug } from '@/utils/payloadPath'
import { Country, OrganisingGroup } from '@/payload-types'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { validatePayloadDocument, validatePayloadResult } from '@/utils/validate-payload'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'companies',
    slug,
    notFoundTitle: 'Company Not Found',
    getTitle: (company) => `Game worker solidarity in ${company.name}`,
  })
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  const result = await getCachedDataForSlug('companies', slug, async ({ query }) => {
    const companyResult = await query({
      collection: 'companies',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    if (!companyResult.docs[0]) return null

    const company = validatePayloadDocument('companies', companyResult.docs[0])
    const descendants = await getDescendants(
      'companies',
      getSlug('companies', company),
      undefined,
      query,
      {
        id: String(company.id),
        name: company.name,
        slug: getSlug('companies', company),
      },
    )

    const actionResults = await query({
      collection: 'actions',
      where: {
        and: [
          {
            companies: {
              in: descendants.map((d) => d.id),
            },
          },
        ],
      },
      sort: '-date',
      depth: 2,
      pagination: false,
    })
    const validatedActions = validatePayloadResult('actions', actionResults)
    const actions = validatedActions.docs

    const organisingGroupsSet = new Map<string, OrganisingGroup>()
    const countriesSet = new Map<string, Country>()
    actions.forEach((action) => {
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
      if (action.countries && Array.isArray(action.countries)) {
        action.countries.forEach((country) => {
          if (
            typeof country === 'object' &&
            country !== null &&
            'id' in country &&
            'name' in country
          ) {
            const countryId = String(country.id)
            if (!countriesSet.has(countryId)) countriesSet.set(countryId, country)
          }
        })
      }
    })

    const uniqueOrganisingGroups = Array.from(organisingGroupsSet.values())
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
    const uniqueCountries = Array.from(countriesSet.values())
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      company,
      descendants,
      actions,
      organisingGroups: uniqueOrganisingGroups,
      countries: uniqueCountries,
    }
  })

  if (!result) notFound()

  return (
    <CompanyPage
      initialCompany={result.company}
      descendants={result.descendants.length > 1 ? result.descendants : null}
      actions={result.actions}
      organisingGroups={result.organisingGroups}
      countries={result.countries}
    />
  )
}
