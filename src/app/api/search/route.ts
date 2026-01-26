'use server'

import { NextRequest, NextResponse } from 'next/server'
import { payloadUserQuery } from '@/utils/payload.server'
import type { Action, Company, Country, Category, OrganisingGroup } from '@/payload-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        actions: [],
        unions: [],
        companies: [],
        countries: [],
        categories: [],
      })
    }

    const searchTerm = query.trim()

    // Search all collections in parallel
    const [actionsResult, unionsResult, companiesResult, countriesResult, categoriesResult] =
      await Promise.all([
        // Search Actions
        payloadUserQuery({
          collection: 'actions',
          where: {
            or: [
              {
                name: {
                  like: searchTerm,
                },
              },
              {
                location: {
                  like: searchTerm,
                },
              },
            ],
          },
          limit: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            path: true,
            url: true,
            date: true,
          },
          sort: '-date',
        }),
        // Search Unions (OrganisingGroups where isUnion = true)
        payloadUserQuery({
          collection: 'organisingGroups',
          where: {
            and: [
              {
                isUnion: {
                  equals: true,
                },
              },
              {
                or: [
                  {
                    name: {
                      like: searchTerm,
                    },
                  },
                  {
                    fullName: {
                      like: searchTerm,
                    },
                  },
                ],
              },
            ],
          },
          limit: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            fullName: true,
            path: true,
            url: true,
            logo: true,
          },
          sort: 'name',
        }),
        // Search Companies
        payloadUserQuery({
          collection: 'companies',
          where: {
            name: {
              like: searchTerm,
            },
          },
          limit: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            path: true,
            url: true,
          },
          sort: 'name',
        }),
        // Search Countries
        payloadUserQuery({
          collection: 'countries',
          where: {
            or: [
              {
                name: {
                  like: searchTerm,
                },
              },
              {
                isoA2: {
                  like: searchTerm.toUpperCase(),
                },
              },
            ],
          },
          limit: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            isoA2: true,
            emoji: true,
            path: true,
            url: true,
          },
          sort: 'name',
        }),
        // Search Categories
        payloadUserQuery({
          collection: 'categories',
          where: {
            name: {
              like: searchTerm,
            },
          },
          limit: 10,
          select: {
            id: true,
            slug: true,
            name: true,
            emoji: true,
            path: true,
            url: true,
          },
          sort: 'name',
        }),
      ])

    return NextResponse.json({
      actions: actionsResult.docs as Action[],
      unions: unionsResult.docs as OrganisingGroup[],
      companies: companiesResult.docs as Company[],
      countries: countriesResult.docs as Country[],
      categories: categoriesResult.docs as Category[],
    })
  } catch (error: any) {
    console.error('Error searching:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to search',
        actions: [],
        unions: [],
        companies: [],
        countries: [],
        categories: [],
      },
      { status: 500 },
    )
  }
}
