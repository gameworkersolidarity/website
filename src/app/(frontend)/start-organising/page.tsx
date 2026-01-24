import { payloadUserQuery, payloadUserGlobalQuery } from '@/utils/payload.server'
import Link from 'next/link'
import Image from 'next/image'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CountryLabel } from '@/components/CountryLabel'
import type { OrganisingGroup, Country, Media } from '@/payload-types'
import { OrganisingGroupLinks } from '../organising-groups/[slug]/OrganisingGroupPage'
import { notFound } from 'next/navigation'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { OrganisingGroupCard } from '@/components/OrganisingGroupCard'

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
    <div className="mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-4">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 md:gap-6 lg:gap-8">
        <h1 className="text-4xl lg:text-5xl font-bold font-identity mb-4">Start organising!</h1>
        <LexicalRenderer content={startOrganisingData.description} />
      </div>

      {sortedCountries.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {sortedCountries.map(({ country, groups }) => (
            <div key={country.id} className="grid gap-4">
              <header>
                <h2 className="text-2xl">
                  <CountryLabel country={country} link />
                </h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <OrganisingGroupCard key={group.id} group={group} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
