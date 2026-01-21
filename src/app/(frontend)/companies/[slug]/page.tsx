import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { getDescendants } from '@/utils/payloadTree.server'
import { CompanyPage } from './CompanyPage'
import { getSlug } from '@/utils/payloadPath'
import { Country, OrganisingGroup } from '@/payload-types'
import { generateMetadataForSlug } from '@/utils/generateMetadata'

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
  const actionResults = await payload.find({
    collection: 'actions',
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

  const actions = actionResults.docs

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
