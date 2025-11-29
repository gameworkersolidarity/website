'use client'
import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Star, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Campaign, Category, Company, Country, Event, OrganisingGroup } from '@/payload-types'
import { format } from 'date-fns'
import Link from 'next/link'
import Emoji from 'a11y-react-emoji'
import chroma from 'chroma-js'
import { useAtom } from 'jotai/react'
import { sortOrderAtom } from '@/utils/global-state'
import pluralize from 'pluralize'
import { DisplayInitiator } from '@/utils/displayInitiator'
import { EventInitiator } from '@/collections/enums'
import { twMerge } from 'tailwind-merge'

export const columns: ColumnDef<Event>[] = [
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
        <Link href={row.original.path!}>{format(row.getValue('date'), 'dd MMM yyyy')}</Link>
      </TableCell>
    ),
  },
  {
    accessorKey: 'initiator',
    header: 'Actor',
    cell: ({ cell, row }) => (
      <TableCell key={cell.id} className="text-xs uppercase">
        <DisplayInitiator initiator={row.getValue('initiator') as EventInitiator} />
      </TableCell>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ cell, row }) => (
      <TableCell
        key={cell.id}
        className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-sm"
      >
        <Link href={row.original.path!}>
          <div className="font-medium">{row.getValue('name')}</div>
          {row.original.campaigns?.docs?.length ? (
            <div className="text-xs text-gray-500 flex items-center gap-1">
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
          Companies
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ cell, row }) => (
      <TableCell
        key={cell.id}
        className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-12"
      >
        <Link href={row.original.path!}>
          {(row.getValue('companies') as Company[])?.map((company) => company.name).join(', ')}
        </Link>
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
      <TableCell
        key={cell.id}
        className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-12"
      >
        <Link href={row.original.path!}>
          {(row.getValue('organisingGroups') as OrganisingGroup[])
            ?.map((organisingGroup) => organisingGroup.name)
            .join(', ')}
        </Link>
      </TableCell>
    ),
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
          Categories
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ cell, row }) => (
      <TableCell
        key={cell.id}
        className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-12 capitalize"
      >
        <Link href={row.original.path!}>
          {(row.getValue('categories') as Category[])?.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-1 capitalize text-xs bg-snot-100 py-0.5 rounded-sm px-1"
              style={{
                backgroundColor: category.color,
                color: chroma.contrast(category.color, 'white') > 0.5 ? 'white' : 'black',
              }}
            >
              <Emoji symbol={category.emoji || ''} label={`Emoji for ${category.name}`} />
              {category.name}
            </span>
          ))}
        </Link>
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
        <Link href={row.original.path!}>
          {(row.getValue('countries') as Country[])?.map((country) => country.name).join(', ')}
        </Link>
      </TableCell>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ cell, row }) => (
      <TableCell
        key={cell.id}
        className="overflow-hidden text-ellipsis text-wrap wrap-normal max-w-16"
      >
        <Link href={row.original.path!}>{row.getValue('location')}</Link>
      </TableCell>
    ),
  },
]

export function CompactEventList({ events }: { events: Event[] }) {
  const [sorting, setSorting] = useAtom(sortOrderAtom)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const table = useReactTable({
    data: events,
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
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                row.original.initiator === EventInitiator.WORKER_LED && 'bg-blue-50',
                row.original.initiator === EventInitiator.BOSS_LED && 'bg-orange-50',
              )}
            >
              {row
                .getVisibleCells()
                .map((cell) => flexRender(cell.column.columnDef.cell, cell.getContext()))}
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
