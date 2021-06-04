import { format, getMonth, getYear } from 'date-fns';
import useSWR from 'swr'
import { SolidarityActionsData } from '../pages/api/solidarityActions';
import { SolidarityAction } from '../data/types';
import { stringifyArray } from '../utils/string';
import { ExternalLinkIcon } from '@heroicons/react/outline';

export function SolidarityActionsList () {
  const actions = useSWR<SolidarityActionsData>('/api/solidarityActions')

  const actionsByMonth = actions.data?.solidarityActions?.reduce((bins, action) => {
    const key = `${getYear(new Date(action.fields.Date))}-${getMonth(new Date(action.fields.Date))}`
    bins[key] ??= []
    bins[key].push(action)
    return bins
  }, {} as { [key: string]: SolidarityAction[] })

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Object.values(actionsByMonth).map((actions, i) => {
        return (
          <div className='space-y-4' key={i}>
            <h2 className='text-2xl font-bold'>{format(new Date(actions[0].fields.Date), 'MMMM yyyy')}</h2>
            {actions.map(event =>
              <SolidarityActionItem key={event.id} data={event} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SolidarityActionItem ({ data }: { data: SolidarityAction }) {
  return (
    <article className='bg-gray-900 p-4 rounded-md flex flex-col space-y-1 justify-between'>
      <div className='space-y-1'>
        <div className='text-xs space-x-3 flex justify-between w-full flex-row'>
          <span className='text-pink-400 space-x-3'>{data.fields.Category?.map(c => <span key={c}>{c}</span>)}</span>
        </div>
        <h3 className='text-lg font-bold leading-snug'>{data.fields.Name}</h3>
        {data.fields.Link && (
          <a href={data.fields.Link} className='my-1 text-sm text-gray-400 hover:text-pink-400'>
            <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
            &nbsp;
            <span className='align-middle underline text-inherit '>{new URL(data.fields.Link).hostname}</span>
          </a>
        )}
      </div>
      <div className='text-xs space-x-3 flex justify-between w-full flex-row'>
        <span className='text-gray-400'>{stringifyArray(data.fields.Location, data.fields.Country)}</span>
        <span className='text-gray-400'>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</span>
      </div>
    </article>
  )
}