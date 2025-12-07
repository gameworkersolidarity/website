import { getPayload } from 'payload'
import config from '@/payload.config'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { OrganisingGroupLabel } from '@/components/OrganisingGroupLabel'
import { CountryLabel } from '@/components/CountryLabel'
import type { OrganisingGroup, Country } from '@/payload-types'
import { OrganisingGroupLinks } from '../organising-groups/[slug]/OrganisingGroupPage'

export const metadata = {
  title: 'Start Organising - Game Workers Solidarity Platform',
  description:
    'Find organising groups and unions by country to get started with worker organising.',
}

export default async function StartOrganisingPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  // Fetch the global data for the description
  const startOrganisingData = await payload.findGlobal({
    slug: 'startOrganising',
    draft: isDraftMode,
  })

  // Fetch all published organising groups with their countries
  const groupsResult = await payload.find({
    collection: 'organisingGroups',
    where: {
      ...(!isDraftMode
        ? {
            _status: {
              equals: 'published',
            },
          }
        : {}),
    },
    depth: 1, // Include countries
    pagination: false,
    sort: 'name',
    draft: isDraftMode,
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
              <h2 className="text-2xl">
                <CountryLabel country={country} />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div key={group.id} className="bg-white rounded-xl p-4">
                    <Link key={group.id} href={group.path!}>
                      <div className="font-bold">
                        <OrganisingGroupLabel organisingGroup={group} />
                      </div>
                      {group.fullName && (
                        <div className="text-sm text-gray-600 mt-1">{group.fullName}</div>
                      )}
                    </Link>
                    {!!(group.website || group.twitter || group.bluesky) && (
                      <div className="text-sm text-gray-600 mt-1">
                        <OrganisingGroupLinks page={group} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
