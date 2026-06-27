import { notFound } from 'next/navigation'
import { getCachedDataForSlug } from '@/utils/payload.server'
import { Company, Country } from '@/payload-types'
import { getDescendants } from '@/utils/payloadTree.server'
import { OrganisingGroupPage } from './OrganisingGroupPage'
import { generateMetadataForSlug } from '@/utils/generateMetadata'
import { validatePayloadDocument, validatePayloadResult } from '@/utils/validate-payload'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generateMetadataForSlug({
    collection: 'organisingGroups',
    slug,
    notFoundTitle: 'Organising Group Not Found',
  })
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  const result = await getCachedDataForSlug('organisingGroups', slug, async ({ query }) => {
    const groupResult = await query({
      collection: 'organisingGroups',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    if (!groupResult.docs[0]) return null

    const group = validatePayloadDocument('organisingGroups', groupResult.docs[0])
    const descendants = await getDescendants('organisingGroups', group.slug, undefined, query)

    const actionsResult = await query({
      collection: 'actions',
      sort: '-date',
      where: {
        and: [
          {
            organisingGroups: {
              in: descendants.map((d) => d.id),
            },
          },
        ],
      },
      depth: 2,
      pagination: false,
    })
    const validatedActions = validatePayloadResult('actions', actionsResult)
    const actions = validatedActions.docs

    const companiesSet = new Map<string, Company>()
    const countriesSet = new Map<string, Country>()
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
            if (!companiesSet.has(companyId)) companiesSet.set(companyId, company)
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

    const uniqueCompanies = Array.from(companiesSet.values())
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
    const uniqueCountries = Array.from(countriesSet.values())
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      group,
      actions,
      descendants,
      companies: uniqueCompanies,
      countries: uniqueCountries,
    }
  })

  if (!result) notFound()

  return (
    <OrganisingGroupPage
      initialGroup={result.group}
      actions={result.actions}
      companies={result.companies}
      descendants={result.descendants}
      countries={result.countries}
    />
  )
}
