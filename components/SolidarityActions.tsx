import { format } from 'date-fns';
import useSWR from 'swr'
import { SolidarityActionsData } from '../pages/api/solidarityActions';
import { SolidarityAction } from '../data/types';
import { stringifyArray } from '../utils/string';

export function SolidarityActionsList () {
  const actions = useSWR<SolidarityActionsData>('/api/solidarityActions')

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {actions?.data?.solidarityActions?.map(event =>
        <SolidarityActionItem key={event.id} data={event} />
      )}
    </div>
  )
}

export function SolidarityActionItem ({ data }: { data: SolidarityAction }) {
  return (
    <article className='bg-gray-900 p-4 rounded-md flex flex-col space-y-2'>
      <div className='text-xs opacity-60 space-x-5'>
        {data.fields.Date && <span>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</span>}
        <span>{stringifyArray(data.fields.Location, data.fields.Country)}</span>
      </div>
      <h3 className='text-lg font-bold'>{data.fields.Name}</h3>
      <div className='text-xs text-pink-400 space-x-4 mt-auto'>
        {data.fields.Category?.map(c => <span key={c}>{c}</span>)}
      </div>
    </article>
  )
}