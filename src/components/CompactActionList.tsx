'use client'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import Link from 'next/link'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { ActionInitiatorFilter } from '@/collections/enums'
import { twMerge } from 'tailwind-merge'
import { ActionFilterContextValue, useActionFilterContext } from './ActionFilterContextProvider'
import { CategoryLabel } from './CategoryLabel'
import { CountryLabel } from './CountryLabel'
import { CompanyLabel } from './CompanyLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { HighlightText } from './HighlightText'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DateTime } from './DateTime'
import { LexicalRenderer } from '@/app/(frontend)/components/LexicalRenderer'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'

type SortField =
  | 'date'
  | 'name'
  | 'categories'
  | 'countries'
  | 'companies'
  | 'organisingGroups'
  | 'headcount'
type SortDirection = 'asc' | 'desc' | null

export function CompactActionList({
  actions,
  linkStyle = 'hard',
  searchQuery,
}: {
  actions: Action[]
  linkStyle?: 'soft' | 'hard'
  searchQuery: ActionFilterContextValue['searchQuery']
}) {
  const { highlights } = useActionFilterContext()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc')
      } else if (sortDirection === 'asc') {
        setSortDirection(null)
        setSortField('date')
        setSortDirection('desc')
      }
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedActions = useMemo(() => {
    if (!sortDirection) return actions

    const sorted = [...actions].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'categories':
          aValue = a.categories?.[0]
            ? typeof a.categories[0] === 'object'
              ? (a.categories[0] as Category).name
              : ''
            : ''
          bValue = b.categories?.[0]
            ? typeof b.categories[0] === 'object'
              ? (b.categories[0] as Category).name
              : ''
            : ''
          break
        case 'countries':
          aValue = a.countries?.[0]
            ? typeof a.countries[0] === 'object'
              ? (a.countries[0] as Country).name
              : ''
            : ''
          bValue = b.countries?.[0]
            ? typeof b.countries[0] === 'object'
              ? (b.countries[0] as Country).name
              : ''
            : ''
          break
        case 'companies':
          aValue = a.companies?.[0]
            ? typeof a.companies[0] === 'object'
              ? (a.companies[0] as Company).name
              : ''
            : ''
          bValue = b.companies?.[0]
            ? typeof b.companies[0] === 'object'
              ? (b.companies[0] as Company).name
              : ''
            : ''
          break
        case 'organisingGroups':
          aValue = a.organisingGroups?.[0]
            ? typeof a.organisingGroups[0] === 'object'
              ? (a.organisingGroups[0] as OrganisingGroup).name
              : ''
            : ''
          bValue = b.organisingGroups?.[0]
            ? typeof b.organisingGroups[0] === 'object'
              ? (b.organisingGroups[0] as OrganisingGroup).name
              : ''
            : ''
          break
        case 'headcount':
          aValue = a.headcount || 0
          bValue = b.headcount || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [actions, sortField, sortDirection])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4" />
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4" />
    return <ArrowUpDown className="w-4 h-4" />
  }

  if (sortedActions.length === 0) {
    return <div className="flex items-center justify-center h-24 text-gray-500">No results.</div>
  }

  return (
    <div className="flex flex-col @container">
      {/* Sort controls */}
      <div className="sticky top-0 bg-background z-10 border-b border-gray-200 px-3 pb-2 flex flex-wrap gap-1.5 justify-center opacity-50">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleSort('date')}>
          Date {getSortIcon('date')}
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleSort('name')}>
          Name {getSortIcon('name')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleSort('headcount')}
        >
          Headcount {getSortIcon('headcount')}
        </Button>
        {/* <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleSort('categories')}
        >
          Category {getSortIcon('categories')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleSort('countries')}
        >
          Country {getSortIcon('countries')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleSort('companies')}
        >
          Company {getSortIcon('companies')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => handleSort('organisingGroups')}
        >
          Organising Groups {getSortIcon('organisingGroups')}
        </Button> */}
      </div>

      {/* Action cards */}
      <div className="flex flex-col divide-y divide-gray-200">
        {sortedActions.map((action) => {
          const isExpanded = expandedIds.has(action.id)
          const actionHighlights = highlights[action.id]
          const nameRanges = actionHighlights?.name
          const descriptionRanges = actionHighlights?.description
          const shouldShowDescription = action.featured && action.description

          return (
            <Collapsible
              key={action.id}
              open={isExpanded}
              onOpenChange={() => toggleExpand(action.id)}
            >
              <div
                className={twMerge(
                  'px-3 py-2 hover:bg-gray-50 transition-colors',
                  action.initiator === ActionInitiatorFilter.BOSS_LED && 'bg-orange-50',
                )}
              >
                {/* Collapsed state - Title and key info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      <Link
                        href={action.path || '/'}
                        className="font-medium text-sm hover:underline flex-1"
                      >
                        <HighlightText text={action.name || ''} ranges={nameRanges} />
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button className="flex-shrink-0 text-gray-500 hover:text-gray-700">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Key info in 6-column layout */}
                    <div className="grid grid-cols-3 @md:grid-cols-6 gap-2 @md:gap-3 text-xs">
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          DATE
                        </div>
                        <div className="font-mono text-[11px] opacity-75">
                          <Link href={action.path || '/'} className="hover:underline">
                            <DateTime date={action.date} format="dd MMM yyyy" />
                          </Link>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          INITIATOR
                        </div>
                        <div className="text-[11px] uppercase font-mono">
                          <DisplayInitiator
                            initiator={action.initiator as ActionInitiatorFilter}
                            link="soft"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          CATEGORY
                        </div>
                        <div className="text-[11px]">
                          {action.categories && action.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {(action.categories as Category[]).slice(0, 1).map((category) => (
                                <CategoryLabel
                                  key={typeof category === 'object' ? category.id : category}
                                  category={category as unknown as Category}
                                  link={linkStyle === 'soft' ? 'soft' : true}
                                />
                              ))}
                              {(action.categories as Category[]).length > 1 && (
                                <span className="text-[10px] opacity-50">
                                  +{(action.categories as Category[]).length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          ORGANISING GROUP
                        </div>
                        <div className="text-[11px]">
                          {action.organisingGroups && action.organisingGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {(action.organisingGroups as OrganisingGroup[])
                                .slice(0, 1)
                                .map((og) => (
                                  <OrganisingGroupLabel
                                    key={og.id}
                                    organisingGroup={og as unknown as OrganisingGroup}
                                    link={linkStyle === 'soft' ? 'soft' : true}
                                  />
                                ))}
                              {(action.organisingGroups as OrganisingGroup[]).length > 1 && (
                                <span className="text-[10px] opacity-50">
                                  +{(action.organisingGroups as OrganisingGroup[]).length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          COMPANY
                        </div>
                        <div className="text-[11px]">
                          {action.companies && action.companies.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {(action.companies as Company[]).slice(0, 1).map((company) => (
                                <CompanyLabel
                                  key={company.id}
                                  company={company as unknown as Company}
                                  link={linkStyle === 'soft' ? 'soft' : true}
                                />
                              ))}
                              {(action.companies as Company[]).length > 1 && (
                                <span className="text-[10px] opacity-50">
                                  +{(action.companies as Company[]).length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase opacity-50 font-mono mb-0.5">
                          COUNTRY
                        </div>
                        <div className="text-[11px]">
                          {action.countries && action.countries.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {(action.countries as Country[]).slice(0, 1).map((country) => (
                                <CountryLabel
                                  key={country.id}
                                  country={country as Country}
                                  link={linkStyle === 'soft' ? 'soft' : true}
                                />
                              ))}
                              {(action.countries as Country[]).length > 1 && (
                                <span className="text-[10px] opacity-50">
                                  +{(action.countries as Country[]).length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded state - Description if featured */}
                <CollapsibleContent className="mt-2 pt-2 ">
                  {/* Description - Show if featured */}
                  {shouldShowDescription && (
                    <div>
                      <div className="text-[10px] uppercase opacity-50 font-mono mb-1.5">
                        DESCRIPTION
                      </div>
                      <div className="text-xs leading-relaxed">
                        {action.description && descriptionRanges && descriptionRanges.length > 0 ? (
                          <HighlightText
                            text={lexicalToPlainText(action.description)}
                            ranges={descriptionRanges}
                          />
                        ) : (
                          <LexicalRenderer content={action.description} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Link to full page */}
                  <div className="mt-2">
                    <Link
                      href={action.path || '/'}
                      className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      View full details →
                    </Link>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
