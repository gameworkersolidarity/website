import { fetchDraftMode } from '@/utils/auth'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { payloadUserQuery } from '@/utils/payload.server'
import { Company, Country } from '@/payload-types'
import { getDescendants } from '@/utils/payloadTree.server'
import { OrganisingGroupPage } from './OrganisingGroupPage'
import { generateMetadataForSlug } from '@/utils/generateMetadata'

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

  const group = await payloadUserQuery({
    collection: 'organisingGroups',
    depth: 2, // Include related solidarity actions and their related entities
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  }).then(({ docs }) => docs?.[0])

  if (!group) {
    notFound()
  }

  const descendants = await getDescendants('organisingGroups', group.slug)

  // Query solidarity actions directly where this organising group is related
  const actionsResult = await payloadUserQuery({
    collection: 'actions',
    sort: '-date',
    where: {
      and: [
        {
          organisingGroups: {
            in: descendants.map((descendant) => descendant.id),
          },
        },
      ],
    },
    depth: 2, // Include related entities
    pagination: false,
  })

  const actions = actionsResult.docs

  // Extract unique companies from solidarity actions
  const companiesSet = new Map<string, Company>()

  actions.forEach((action) => {
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
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  const uniqueCountries = Array.from(
    new Set(actions.flatMap((action) => action.countries as Country[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <OrganisingGroupPage
      initialGroup={group}
      actions={actions}
      companies={uniqueCompanies}
      descendants={descendants}
      countries={uniqueCountries}
    />
  )
}
