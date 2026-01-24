import { payloadUserQuery, payloadUserGlobalQuery } from '@/utils/payload.server'
import type { OrganisingGroup, Country } from '@/payload-types'
import { notFound } from 'next/navigation'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { StartOrganisingPageClient } from './StartOrganisingPage.client'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const startOrganisingData = await payloadUserGlobalQuery({
      slug: 'startOrganising',
    })

    const title = 'Start Organising'
    const description =
      (startOrganisingData?.description
        ? lexicalToPlainText(startOrganisingData.description)
        : '') ||
      'Find organising groups and unions by country to get started with worker organising.'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  } catch (error) {
    const title = 'Start Organising'
    const description =
      'Find organising groups and unions by country to get started with worker organising.'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  }
}

export default async function StartOrganisingPage() {
  // Fetch the global data for the description
  const startOrganisingData = await payloadUserGlobalQuery({
    slug: 'startOrganising',
  })

  if (!startOrganisingData) {
    return notFound()
  }

  // Fetch all published organising groups with their countries
  const groupsResult = await payloadUserQuery({
    collection: 'organisingGroups',
    where: {
      and: [
        {
          highlighted: {
            equals: true,
          },
        },
      ],
    },
    depth: 2, // Include countries and logo
    pagination: false,
    sort: 'name',
  })

  const groups = groupsResult.docs as OrganisingGroup[]

  // Group organising groups by country
  const groupsByCountry = new Map<string, { country: Country; groups: OrganisingGroup[] }>()

  groups.forEach((group) => {
    if (group.countries && Array.isArray(group.countries)) {
      group.countries.forEach((country) => {
        if (country && typeof country === 'object' && 'id' in country && 'name' in country) {
          const countryId = String(country.id)
          const countryData = country as Country

          if (!groupsByCountry.has(countryId)) {
            groupsByCountry.set(countryId, {
              country: countryData,
              groups: [],
            })
          }

          const entry = groupsByCountry.get(countryId)!
          // Avoid duplicates
          if (!entry.groups.some((g) => g.id === group.id)) {
            entry.groups.push(group)
          }
        }
      })
    }
  })

  // Sort countries by name
  const sortedCountries = Array.from(groupsByCountry.values()).sort((a, b) =>
    a.country.name.localeCompare(b.country.name),
  )

  // Sort groups within each country by name
  sortedCountries.forEach((entry) => {
    entry.groups.sort((a, b) => a.name.localeCompare(b.name))
  })

  return (
    <StartOrganisingPageClient
      initialData={startOrganisingData}
      groupsByCountry={sortedCountries}
    />
  )
}
