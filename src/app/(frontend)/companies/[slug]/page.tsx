import { notFound } from 'next/navigation'
import { payloadUserQuery } from '@/utils/payload.server'
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

  const companyResult = await payloadUserQuery({
    collection: 'companies',
    depth: 2, // Include related solidarity actions and their related entities
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  if (!companyResult.docs[0]) {
    notFound()
  }

  const company = validatePayloadDocument('companies', companyResult.docs[0])

  const descendants = await getDescendants('companies', getSlug('companies', company))

  // Query solidarity actions and redundancies directly where this company is related
  const actionResults = await payloadUserQuery({
    collection: 'actions',
    where: {
      and: [
        {
          companies: {
            in: descendants.map((descendant) => descendant.id),
          },
        },
      ],
    },
    sort: '-date',
    depth: 2, // Include related entities
    pagination: false,
  })

  const validatedActions = validatePayloadResult('actions', actionResults)
  const actions = validatedActions.docs

  const uniqueOrganisingGroups = Array.from(
    new Set(actions.flatMap((action) => action.organisingGroups as OrganisingGroup[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  const uniqueCountries = Array.from(
    new Set(actions.flatMap((action) => action.countries as Country[])),
  )
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <CompanyPage
      initialCompany={company}
      descendants={descendants.length > 1 ? descendants : null}
      actions={actions}
      organisingGroups={uniqueOrganisingGroups}
      countries={uniqueCountries}
    />
  )
}
