import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import React from 'react'
import { LexicalRenderer } from '../../components/LexicalRenderer'
import Link from 'next/link'
import type { Country, Category, Company, OrganisingGroup } from '@/payload-types'

type Props = {
  params: Promise<{ slug: string }>
}

// Helper function to get country flag emoji from country code
function getCountryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Helper function to format date like "02 Jun 2025"
function formatDate(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const day = date.getDate().toString().padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Type guards
function isCountry(obj: string | Country): obj is Country {
  return typeof obj === 'object' && obj !== null && 'countryCode' in obj
}

function isCategory(obj: string | Category): obj is Category {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

function isCompany(obj: string | Company): obj is Company {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

function isOrganisingGroup(obj: string | OrganisingGroup): obj is OrganisingGroup {
  return typeof obj === 'object' && obj !== null && 'Name' in obj
}

export default async function SolidarityActionPage({ params }: Props) {
  const { slug } = await params
  const isDraftMode = (await draftMode()).isEnabled

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const action = await payload
    .find({
      collection: 'solidarityActions',
      depth: 2, // Include related data (countries, companies, etc.)
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

  if (!action) {
    notFound()
  }

  // Extract related entities
  const countries = Array.isArray(action.Country) ? action.Country.filter(isCountry) : []
  const categories = Array.isArray(action.Category) ? action.Category.filter(isCategory) : []
  const companies = Array.isArray(action.Company) ? action.Company.filter(isCompany) : []
  const organisingGroups = Array.isArray(action.OrganisingGroups)
    ? action.OrganisingGroups.filter(isOrganisingGroup)
    : []

  // Fetch action counts for related entities
  const [
    countryActionsCounts,
    categoryActionsCounts,
    companyActionsCounts,
    organisingGroupActionsCounts,
  ] = await Promise.all([
    // Country action counts
    Promise.all(
      countries.map(async (country) => {
        const result = await payload.find({
          collection: 'solidarityActions',
          where: {
            and: [
              {
                Country: {
                  in: [country.id],
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
          limit: 0,
        })
        return { id: country.id, count: result.totalDocs }
      }),
    ),
    // Category action counts
    Promise.all(
      categories.map(async (category) => {
        const result = await payload.find({
          collection: 'solidarityActions',
          where: {
            and: [
              {
                Category: {
                  in: [category.id],
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
          limit: 0,
        })
        return { id: category.id, count: result.totalDocs }
      }),
    ),
    // Company action counts
    Promise.all(
      companies.map(async (company) => {
        const result = await payload.find({
          collection: 'solidarityActions',
          where: {
            and: [
              {
                Company: {
                  in: [company.id],
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
          limit: 0,
        })
        return { id: company.id, count: result.totalDocs }
      }),
    ),
    // Organising group action counts
    Promise.all(
      organisingGroups.map(async (group) => {
        const result = await payload.find({
          collection: 'solidarityActions',
          where: {
            and: [
              {
                OrganisingGroups: {
                  in: [group.id],
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
          limit: 0,
        })
        return { id: group.id, count: result.totalDocs }
      }),
    ),
  ])

  const countryActionsMap = new Map(countryActionsCounts.map((c) => [c.id, c.count]))
  const categoryActionsMap = new Map(categoryActionsCounts.map((c) => [c.id, c.count]))
  const companyActionsMap = new Map(companyActionsCounts.map((c) => [c.id, c.count]))
  const organisingGroupActionsMap = new Map(
    organisingGroupActionsCounts.map((c) => [c.id, c.count]),
  )

  const formattedDate = action.Date ? formatDate(new Date(action.Date)) : ''

  return (
    <div className="action-page">
      <article className="action-article">
        {/* Metadata line */}
        <div className="action-metadata">
          {formattedDate && (
            <time dateTime={action.Date} className="action-date">
              {formattedDate}
            </time>
          )}
          {countries.map((country, idx) => (
            <span key={idx} className="action-metadata-item">
              {country.countryCode && (
                <span className="action-flag" aria-label={`Flag of ${country.Name}`}>
                  {getCountryFlag(country.countryCode)}
                </span>
              )}
              <span>{country.Name}</span>
            </span>
          ))}
          {categories.map((category, idx) => (
            <span key={idx} className="action-metadata-item capitalize">
              {category.slug ? (
                <Link
                  href={`/categories/${category.slug}`}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {category.Emoji && <span>{category.Emoji}</span>}
                  <span> {category.Name}</span>
                </Link>
              ) : (
                <>
                  {category.Emoji && <span>{category.Emoji}</span>}
                  <span> {category.Name}</span>
                </>
              )}
            </span>
          ))}
        </div>

        {/* Article title */}
        <h1 className="action-title font-identity">{action.Name}</h1>

        {/* Article content */}
        {action.Summary && (
          <div className="action-content">
            <LexicalRenderer content={action.Summary} />
          </div>
        )}

        {/* External link */}
        {action.Link && (
          <div className="action-link-section">
            <a
              href={action.Link}
              target="_blank"
              rel="noopener noreferrer"
              className="action-external-link"
            >
              <span aria-label="Link" role="img">
                🔗
              </span>{' '}
              <span className="action-link-domain">
                {(() => {
                  try {
                    return new URL(action.Link).hostname.replace('www.', '')
                  } catch {
                    return action.Link
                  }
                })()}
              </span>
            </a>
          </div>
        )}

        {/* Have more info section */}
        <div className="action-more-info">
          <span>Have more info about this action? </span>
          <a href="mailto:hello@gameworkersolidarity.com" className="action-more-info-link">
            Let us know →
          </a>
        </div>
      </article>

      {/* Related information boxes */}
      {(countries.length > 0 ||
        categories.length > 0 ||
        companies.length > 0 ||
        organisingGroups.length > 0) && (
        <div className="action-related-info">
          {countries.map((country) => {
            const count = countryActionsMap.get(country.id) || 0
            return (
              <div key={country.id} className="related-info-box">
                <div className="related-info-header">
                  {country.countryCode && (
                    <span className="related-info-icon" aria-label={`Flag of ${country.Name}`}>
                      {getCountryFlag(country.countryCode)}
                    </span>
                  )}
                  <span className="related-info-title">{country.Name}</span>
                </div>
                <div className="related-info-type">Country</div>
                {country.slug && (
                  <Link href={`/countries/${country.slug}`} className="related-info-link">
                    {count} action{count !== 1 ? 's' : ''} →
                  </Link>
                )}
              </div>
            )
          })}

          {categories.map((category) => {
            const count = categoryActionsMap.get(category.id) || 0
            return (
              <div key={category.id} className="related-info-box">
                <div className="related-info-header">
                  {category.Emoji && <span className="related-info-icon">{category.Emoji}</span>}
                  <span className="related-info-title">{category.Name}</span>
                </div>
                <div className="related-info-type">Category</div>
                {category.slug && (
                  <Link href={`/categories/${category.slug}`} className="related-info-link">
                    {count} action{count !== 1 ? 's' : ''} →
                  </Link>
                )}
              </div>
            )
          })}

          {organisingGroups.map((group) => (
            <div key={group.id} className="related-info-box">
              <div className="related-info-title">
                {typeof group === 'object' && 'FullName' in group
                  ? group.FullName || group.Name
                  : group.Name}
              </div>
              <div className="related-info-type">Organising group</div>
              {group.slug && (
                <Link href={`/organising-groups/${group.slug}`} className="related-info-link">
                  Learn more →
                </Link>
              )}
            </div>
          ))}

          {companies.map((company) => {
            const count = companyActionsMap.get(company.id) || 0
            return (
              <div key={company.id} className="related-info-box">
                <div className="related-info-title">{company.Name}</div>
                <div className="related-info-type">Company</div>
                {company.slug && (
                  <Link href={`/companies/${company.slug}`} className="related-info-link">
                    All actions →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
