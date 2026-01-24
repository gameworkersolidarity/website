'use client'
import { Fragment, useMemo, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Campaign, Category, Company, Country, Action, OrganisingGroup } from '@/payload-types'
import { format } from 'date-fns'
import Link from 'next/link'
import Emoji from 'a11y-react-emoji'
import { useAtom } from 'jotai/react'
import { ActionFilterKey, getFilterPath, sortOrderAtom } from '@/utils/global-state'
import pluralize from 'pluralize'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { ActionInitiatorFilter } from '@/collections/enums'
import { twMerge } from 'tailwind-merge'
import { useActionFilterContext } from './ActionFilterContextProvider'
import { CountryLabel } from './CountryLabel'
import { CategoryLabel } from './CategoryLabel'
import { CompanyLabel } from './CompanyLabel'
import { OrganisingGroupLabel } from './OrganisingGroupLabel'
import { HighlightText } from './HighlightText'

export function CompactActionList({
  actions,
  linkStyle = 'hard',
  searchQuery,
}: {
  actions: Action[]
  linkStyle?: 'soft' | 'hard'
  searchQuery?: string
}) {
  const { filteredCampaignSlug, highlights } = useActionFilterContext()

  const columns = useMemo(() => {
    const columns: ColumnDef<Action>[] = [
      {
        accessorKey: 'date',
        header: ({ column, table }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Date
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown />
              ) : (
                <ArrowUpDown />
              )}
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell
            key={cell.id}
            className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-8 font-mono text-xs opacity-50 uppercase"
          >
            <Link href={row.original.path || '/'}>
              {format(row.getValue('date'), 'dd MMM yyyy')}
            </Link>
          </TableCell>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        cell: ({ cell, row }) => {
          const actionHighlights = highlights[row.original.id]
          const nameRanges = actionHighlights?.name

          return (
            <TableCell key={cell.id} className="overflow-hidden text-ellipsis">
              <Link href={row.original.path || '/'}>
                <div className="font-medium text-wrap w-[250px]">
                  <HighlightText text={row.getValue('name')} ranges={nameRanges} />
                </div>
                {!filteredCampaignSlug && row.original.campaigns?.docs?.length ? (
                  <div className="text-xs opacity-50 flex items-center gap-1">
                    <Star fill="currentColor" className="w-3 h-3 text-snot-400" />
                    <span className="text-xs">Part of the</span>
                    <span className="italic font-medium">
                      {row.original.campaigns?.docs
                        ?.map((campaign) => (campaign as Campaign).name)
                        .join(', ')}
                    </span>{' '}
                    <span className="text-xs">
                      {pluralize('campaign', row.original.campaigns?.docs?.length)}
                    </span>
                  </div>
                ) : null}
              </Link>
            </TableCell>
          )
        },
      },
      {
        accessorKey: 'categories',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Category
              <ArrowUpDown />
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell key={cell.id} className="text-ellipsis wrap-normal text-wrap">
            <div className="flex flex-wrap gap-1">
              {(row.getValue('categories') as Category[])?.map((category) => (
                <CategoryLabel
                  category={category as unknown as Category}
                  key={(category as Category).id}
                  link={linkStyle === 'soft' ? 'soft' : true}
                />
              ))}
            </div>
            {row.original.headcount ? (
              <span className="text-xs opacity-50">
                {row.original.headcount} {pluralize('worker', row.original.headcount)}
              </span>
            ) : null}
          </TableCell>
        ),
      },
      {
        accessorKey: 'countries',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Country
              <ArrowUpDown />
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell
            key={cell.id}
            className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-12"
          >
            <div className="flex flex-wrap gap-1">
              {(row.getValue('countries') as Country[])?.map((country) => (
                <div key={country.id}>
                  <CountryLabel
                    country={country as Country}
                    link={linkStyle === 'soft' ? 'soft' : true}
                  />
                  {row.original.location ? (
                    <span className="text-xs opacity-50">{row.original.location}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </TableCell>
        ),
      },
      {
        accessorKey: 'companies',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Company
              <ArrowUpDown />
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell key={cell.id}>
            <div className="flex flex-wrap gap-1">
              {(row.getValue('companies') as Company[])?.map((company) => (
                <CompanyLabel
                  company={company as unknown as Company}
                  key={(company as Company).id}
                  link={linkStyle === 'soft' ? 'soft' : true}
                />
              ))}
            </div>
          </TableCell>
        ),
      },
      {
        accessorKey: 'organisingGroups',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Organising Groups
              <ArrowUpDown />
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell key={cell.id}>
            <div className="flex flex-wrap gap-1">
              {(row.getValue('organisingGroups') as OrganisingGroup[])?.map((organisingGroup) => (
                <OrganisingGroupLabel
                  organisingGroup={organisingGroup as unknown as OrganisingGroup}
                  key={(organisingGroup as OrganisingGroup).id}
                  link={linkStyle === 'soft' ? 'soft' : true}
                />
              ))}
            </div>
          </TableCell>
        ),
      },
      {
        accessorKey: 'headcount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                return column.getIsSorted() === 'asc'
                  ? column.toggleSorting(true)
                  : column.getIsSorted() === 'desc'
                    ? column.clearSorting()
                    : column.toggleSorting(false)
              }}
            >
              Headcount
              <ArrowUpDown />
            </Button>
          )
        },
        cell: ({ cell, row }) => (
          <TableCell
            key={cell.id}
            className="text-ellipsis text-wrap wrap-normal max-w-12 uppercase font-mono text-xs"
          >
            {row.getValue('headcount') ? (
              <Link href={row.original.path || '/'}>
                <b>{row.getValue('headcount')}</b>
                &nbsp;
                {pluralize('worker', row.getValue('headcount'))}
              </Link>
            ) : null}
          </TableCell>
        ),
      },
      {
        accessorKey: 'initiator',
        header: 'Actor',
        cell: ({ cell, row }) => (
          <TableCell key={cell.id} className="text-xs uppercase font-mono">
            <DisplayInitiator
              initiator={row.getValue('initiator') as ActionInitiatorFilter}
              link="soft"
            />
          </TableCell>
        ),
      },
    ]
    return columns
  }, [linkStyle, filteredCampaignSlug, highlights])

  const [sorting, setSorting] = useAtom(sortOrderAtom)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: actions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background z-0">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id} className="border-b-3 border-b-gray-200">
                  {header.isPlaceholder ? null : (
                    <Fragment key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Fragment>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className={twMerge(
                'bg-white hover:bg-snot-300',
                row.getIsSelected() && 'bg-snot-300',
                // row.original.initiator === ActionInitiatorFilter.WORKER_LED && 'bg-blue-50',
                row.original.initiator === ActionInitiatorFilter.BOSS_LED && 'bg-orange-50',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <Fragment key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Fragment>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
