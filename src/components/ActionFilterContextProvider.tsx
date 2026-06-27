'use client'

import { ActionInitiatorFilter } from '@/collections/enums'
import type { Campaign, Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import {
  useCategoryFilter,
  useYearFilter,
  useOrganisingGroupFilter,
  useCompanyFilter,
  useCountryISOA2Filter,
  useCampaignFilter,
  useInitiatorFilter,
  useSearchQueryFilter,
} from '@/utils/global-state'
import { getYear } from 'date-fns'
import { noop } from 'lodash'
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useDebounce } from '@custom-react-hooks/use-debounce'
import {
  AnyOrama,
  create,
  insertMultiple,
  InternalTypedDocument,
  Results,
  search,
} from '@orama/orama'
import { Highlight } from '@orama/highlight'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { useCallback } from 'react'

export type HighlightRange = {
  field: string
  start: number
  end: number
}

export type ActionHighlights = {
  [actionId: string]: {
    [field: string]: Array<[number, number]>
  }
}

export type ActionFilterContextValue = {
  filteredActions: Action[]
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
  filteredCountryISOA2?: string[] | null
  filteredCategorySlug?: string[] | null
  filteredCompanySlug?: string[] | null
  filteredOrganisingGroupSlug?: string[] | null
  filteredCampaignSlug?: string[] | null
  filteredCountries?: Country[] | null
  filteredCategories?: Category[] | null
  filteredCompanies?: Company[] | null
  filteredCampaigns?: Campaign[] | null
  filteredOrganisingGroups?: OrganisingGroup[] | null
  filteredInitiator?: ActionInitiatorFilter | null
  filteredYear?: number[] | null
  availableYears: number[]
  searchQuery: string | null
  highlights: ActionHighlights
  setSearchQuery: ReturnType<typeof useSearchQueryFilter>[1]
  setCountryISOA2Filter: ReturnType<typeof useCountryISOA2Filter>[1]
  setCategoryFilter: ReturnType<typeof useCategoryFilter>[1]
  setCompanyFilter: ReturnType<typeof useCompanyFilter>[1]
  setOrganisingGroupFilter: ReturnType<typeof useOrganisingGroupFilter>[1]
  setCampaignFilter: ReturnType<typeof useCampaignFilter>[1]
  setInitiatorFilter: ReturnType<typeof useInitiatorFilter>[1]
  setYearFilter: ReturnType<typeof useYearFilter>[1]
  setSelectedPopupIds: Dispatch<SetStateAction<string[] | null>>
  selectedPopupIds: string[] | null
}

export const ActionFilterContext = createContext<ActionFilterContextValue>({
  filteredActions: [],
  selectedPopupIds: null,
  availableYears: [],
  searchQuery: null,
  highlights: {},
  setSearchQuery: noop as any,
  setCountryISOA2Filter: noop,
  setCategoryFilter: noop,
  setCompanyFilter: noop,
  setOrganisingGroupFilter: noop,
  setCampaignFilter: noop,
  setInitiatorFilter: noop,
  setYearFilter: noop,
  setSelectedPopupIds: noop,
  countries: [],
  categories: [],
  companies: [],
  organisingGroups: [],
  campaigns: [],
})

export type ActionFilterContextProviderProps = {
  actions: Action[]
  children: React.ReactNode
  overrideFilteredCountryISOA2?: string | string[] | null
  overrideFilteredCategorySlug?: string | string[] | null
  overrideFilteredCompanySlug?: string | string[] | null
  overrideFilteredOrganisingGroupSlug?: string | string[] | null
  overrideFilteredCampaignSlug?: string | string[] | null
  overrideFilteredInitiator?: ActionInitiatorFilter | null
  overrideFilteredYear?: string | number | string[] | number[] | null
  countries: Country[]
  categories: Category[]
  companies: Company[]
  organisingGroups: OrganisingGroup[]
  campaigns: Campaign[]
}

// Helper function to create a searchable version of an action with description converted to plain text
function createSearchableAction(action: Action) {
  let descriptionText: string | undefined
  if (action.description) {
    try {
      descriptionText = lexicalToPlainText(action.description)
    } catch (e) {
      // If conversion fails, skip description
    }
  }

  return {
    id: action.id,
    actionId: action.id, // Store action ID for retrieval
    name: action.name || '',
    description: descriptionText || '',
    location: action.location || '',
    source: action.source || '',
    categories: {
      name:
        action.categories
          ?.map((cat) =>
            typeof cat === 'object' && cat !== null && 'name' in cat ? (cat as Category).name : '',
          )
          .filter(Boolean) || [],
    },
    countries: {
      name:
        action.countries
          ?.map((country) =>
            typeof country === 'object' && country !== null && 'name' in country
              ? (country as Country).name
              : '',
          )
          .filter(Boolean) || [],
    },
    companies: {
      name:
        action.companies
          ?.map((company) =>
            typeof company === 'object' && company !== null && 'name' in company
              ? (company as Company).name
              : '',
          )
          .filter(Boolean) || [],
    },
    organisingGroups: {
      name:
        action.organisingGroups
          ?.map((og) =>
            typeof og === 'object' && og !== null && 'name' in og
              ? (og as OrganisingGroup).name
              : '',
          )
          .filter(Boolean) || [],
    },
    campaigns: {
      name:
        action.campaigns?.docs
          ?.map((campaign) =>
            typeof campaign === 'object' && campaign !== null && 'name' in campaign
              ? (campaign as Campaign).name
              : '',
          )
          .filter(Boolean) || [],
    },
  }
}

export function ActionFilterContextProvider({
  actions,
  children,
  countries,
  categories,
  companies,
  organisingGroups,
  campaigns,
  overrideFilteredCountryISOA2,
  overrideFilteredCategorySlug,
  overrideFilteredCompanySlug,
  overrideFilteredOrganisingGroupSlug,
  overrideFilteredCampaignSlug,
  overrideFilteredInitiator,
  overrideFilteredYear,
}: ActionFilterContextProviderProps) {
  const [selectedPopupIds, setSelectedPopupIds] = useState<string[] | null>(null)
  const [searchQuery, setSearchQuery] = useSearchQueryFilter()
  const [filteredCountryISOA2, setCountryISOA2Filter] = useCountryISOA2Filter(
    overrideFilteredCountryISOA2,
  )
  const [filteredCategorySlug, setCategoryFilter] = useCategoryFilter(overrideFilteredCategorySlug)
  const [filteredCompanySlug, setCompanyFilter] = useCompanyFilter(overrideFilteredCompanySlug)
  const [filteredOrganisingGroupSlug, setOrganisingGroupFilter] = useOrganisingGroupFilter(
    overrideFilteredOrganisingGroupSlug,
  )
  const [filteredCampaignSlug, setCampaignFilter] = useCampaignFilter(overrideFilteredCampaignSlug)
  const [filteredInitiator, setInitiatorFilter] = useInitiatorFilter(overrideFilteredInitiator)
  const [filteredYear, setYearFilter] = useYearFilter(overrideFilteredYear)

  const filteredCategories = useMemo(() => {
    return categories?.filter((category) => filteredCategorySlug?.includes(category.slug)) || []
  }, [categories, filteredCategorySlug])

  const filteredCountries = useMemo(() => {
    return countries?.filter((country) => filteredCountryISOA2?.includes(country.isoA2)) || []
  }, [countries, filteredCountryISOA2])

  const filteredCampaigns = useMemo(() => {
    return campaigns?.filter((campaign) => filteredCampaignSlug?.includes(campaign.slug)) || []
  }, [campaigns, filteredCampaignSlug])

  const filteredCompanies = useMemo(() => {
    return companies?.filter((company) => filteredCompanySlug?.includes(company.slug)) || []
  }, [companies, filteredCompanySlug])

  const filteredOrganisingGroups = useMemo(() => {
    return (
      organisingGroups?.filter((organisingGroup) =>
        filteredOrganisingGroupSlug?.includes(organisingGroup.slug),
      ) || []
    )
  }, [organisingGroups, filteredOrganisingGroupSlug])

  const availableYears = useMemo(() => {
    if (!actions?.length) {
      return []
    }
    const years = new Set<number>()
    actions.forEach((action) => {
      if (action.date) {
        const year = getYear(new Date(action.date))
        years.add(year)
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Sort descending (newest first)
  }, [actions])

  // First apply all non-search filters
  const preFilteredActions = useMemo(() => {
    if (!actions?.length) {
      return []
    }
    let filtered = [...actions]
    if (selectedPopupIds && selectedPopupIds.length > 0) {
      filtered = filtered.filter((action) => selectedPopupIds.includes(action.id))
    }
    if (filteredCountryISOA2 && filteredCountryISOA2.length > 0) {
      filtered = filtered.filter((action) =>
        action.countries?.some((country) =>
          filteredCountryISOA2.includes((country as Country).isoA2),
        ),
      )
    }
    if (filteredCategorySlug && filteredCategorySlug.length > 0) {
      filtered = filtered.filter((action) =>
        action.categories?.some((category) =>
          filteredCategorySlug.includes((category as Category).slug),
        ),
      )
    }
    if (filteredCompanySlug && filteredCompanySlug.length > 0) {
      filtered = filtered.filter((action) =>
        action.companies?.some((company) => {
          return (
            filteredCompanySlug.includes((company as Company).slug) ||
            (company as Company).parents?.some((parent) =>
              filteredCompanySlug.some((slug) => parent.url === `/${slug}`),
            )
          )
        }),
      )
    }
    if (filteredOrganisingGroupSlug && filteredOrganisingGroupSlug.length > 0) {
      filtered = filtered.filter((action) =>
        action.organisingGroups?.some((organisingGroup) => {
          return (
            filteredOrganisingGroupSlug.includes((organisingGroup as OrganisingGroup).slug) ||
            (organisingGroup as OrganisingGroup).parents?.some((parent) =>
              filteredOrganisingGroupSlug.some((slug) => parent.url === `/${slug}`),
            )
          )
        }),
      )
    }
    if (filteredCampaignSlug && filteredCampaignSlug.length > 0) {
      filtered = filtered.filter((action) =>
        action.campaigns?.docs?.some((campaign) =>
          filteredCampaignSlug.includes((campaign as Campaign).slug),
        ),
      )
    }
    if (filteredInitiator && filteredInitiator !== ActionInitiatorFilter.ALL) {
      filtered = filtered.filter((action) => action.initiator === filteredInitiator)
    }
    if (filteredYear && filteredYear.length > 0) {
      filtered = filtered.filter((action) => filteredYear.includes(getYear(new Date(action.date))))
    }

    return filtered
  }, [
    actions,
    filteredCountryISOA2,
    filteredCategorySlug,
    filteredCompanySlug,
    filteredOrganisingGroupSlug,
    filteredCampaignSlug,
    filteredInitiator,
    filteredYear,
    selectedPopupIds,
  ])

  // Apply text search using Orama (async)
  // Use useMemo to derive state instead of setState in effect
  // const [filteredActions, setFilteredActions] = useState<Action[]>(preFilteredActions)
  // const [highlights, setHighlights] = useState<ActionHighlights>({})

  const { db, searchIndex, actionMap } = useMemo(() => {
    const db = create({
      schema: {
        id: 'string',
        actionId: 'string',
        name: 'string',
        description: 'string',
        location: 'string',
        source: 'string',
        categories: {
          name: 'string[]',
        },
        countries: {
          name: 'string[]',
        },
        companies: {
          name: 'string[]',
        },
        organisingGroups: {
          name: 'string[]',
        },
        campaigns: {
          name: 'string[]',
        },
      },
    })

    // Build search index with searchable action data
    const searchIndex = preFilteredActions.map((action) => createSearchableAction(action))

    // Create a map from action ID to original action for quick lookup
    const actionMap = new Map<string, Action>()
    preFilteredActions.forEach((action) => {
      actionMap.set(action.id, action)
    })

    // Insert all documents
    insertMultiple(db, searchIndex)

    return { db, searchIndex, actionMap }
  }, [preFilteredActions])

  const searchDb = useCallback(
    (query: string) => {
      // Perform search with field boosting using nested property paths
      const searchResults = search(db, {
        term: query.trim(),
        properties: [
          'name',
          'description',
          'location',
          'source',
          'categories.name',
          'countries.name',
          'companies.name',
          'organisingGroups.name',
          'campaigns.name',
        ],
        boost: {
          name: 2,
          description: 2,
        },
        tolerance: 1, // Typo tolerance (1 character)
      }) as Results<InternalTypedDocument<typeof db.schema>>

      const actions = searchResults.hits
        .map((hit) => actionMap.get(hit.document.actionId as string))
        .filter((action): action is Action => action !== undefined)

      // Initialize highlighter
      const highlighter = new Highlight({
        caseSensitive: false,
        HTMLTag: 'mark',
        CSSClass: 'orama-highlight',
      })

      // Collect match ranges for highlighting by field
      const highlights: ActionHighlights = {}
      searchResults.hits.forEach((hit) => {
        const actionId = hit.document.actionId as string
        if (!highlights[actionId]) {
          highlights[actionId] = {}
        }

        // Get the original action to access field values for highlighting
        const originalAction = actionMap.get(actionId)
        if (!originalAction) return

        // Get the searchable action to access field values
        const searchableAction = searchIndex.find((item) => item.actionId === actionId)
        if (!searchableAction) return

        // Highlight each field that might contain matches
        // For simple string fields that are displayed in the UI
        const simpleFields = ['name', 'description'] as const
        simpleFields.forEach((field) => {
          let fieldValue: string | undefined
          if (field === 'description') {
            try {
              fieldValue = originalAction.description
                ? lexicalToPlainText(originalAction.description)
                : undefined
            } catch (e) {
              // Skip if conversion fails
            }
          } else {
            fieldValue = searchableAction[field] || undefined
          }

          if (fieldValue && typeof fieldValue === 'string' && fieldValue.length > 0) {
            const highlighted = highlighter.highlight(fieldValue, query.trim())
            if (highlighted.positions && highlighted.positions.length > 0) {
              highlights[actionId][field] = highlighted.positions.map(
                (pos) => [pos.start, pos.end] as [number, number],
              )
            }
          }
        })
      })

      return { actions, highlights }
    },
    [db, actionMap, searchIndex],
  )

  const searchResults = useMemo(() => {
    if (!searchQuery?.trim()) {
      return {
        actions: preFilteredActions,
        highlights: {},
      }
    }
    return searchDb(searchQuery)
  }, [searchQuery, searchDb, preFilteredActions])

  return (
    <ActionFilterContext.Provider
      value={{
        filteredActions: searchResults.actions,
        filteredCountryISOA2,
        filteredCategorySlug,
        filteredCompanySlug,
        filteredOrganisingGroupSlug,
        filteredCampaignSlug,
        filteredInitiator,
        filteredCountries,
        filteredCategories,
        filteredCompanies,
        filteredOrganisingGroups,
        filteredCampaigns,
        filteredYear: filteredYear || null,
        availableYears,
        searchQuery,
        setSearchQuery,
        highlights: searchResults.highlights,
        setCountryISOA2Filter,
        setCategoryFilter,
        setCompanyFilter,
        setOrganisingGroupFilter,
        setCampaignFilter,
        setInitiatorFilter,
        setYearFilter,
        setSelectedPopupIds,
        selectedPopupIds,
        countries,
        categories,
        companies,
        organisingGroups,
        campaigns,
      }}
    >
      {children}
    </ActionFilterContext.Provider>
  )
}

export function useActionFilterContext() {
  const context = useContext(ActionFilterContext)

  function clearAllFilters() {
    context.setCountryISOA2Filter(null)
    context.setCategoryFilter(null)
    context.setCompanyFilter(null)
    context.setOrganisingGroupFilter(null)
    context.setCampaignFilter(null)
    context.setInitiatorFilter(null)
    context.setYearFilter(null)
    context.setSelectedPopupIds(null)
    context.setSearchQuery('')
  }

  return {
    ...context,
    clearAllFilters,
  }
}
