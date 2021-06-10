import { format, getMonth, getYear } from 'date-fns';
import useSWR from 'swr'
import { SolidarityActionsData } from '../pages/api/solidarityActions';
import { SolidarityAction } from '../data/types';
import { stringifyArray } from '../utils/string';
import { ExternalLinkIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import { useContextualRouting } from 'next-use-contextual-routing';
import { useRouter } from 'next/dist/client/router';
import { Dialog } from '@headlessui/react'
import { useMediaQuery } from '../utils/mediaQuery';
import { up } from '../utils/screens';
import cx from 'classnames'

export function SolidarityActionsList () {
  const data = useSWR<SolidarityActionsData>('/api/solidarityActions')
  const { makeContextualHref, returnHref } = useContextualRouting();

  const actionsByMonth = data.data?.solidarityActions?.reduce((bins, action) => {
    const key = `${getYear(new Date(action.fields.Date))}-${getMonth(new Date(action.fields.Date))}`
    bins[key] ??= []
    bins[key].push(action)
    return bins
  }, {} as { [key: string]: SolidarityAction[] })

  const router = useRouter();
  const { actionId } = router.query;
  const selectedAction = data?.data?.solidarityActions?.find(a => a.id === actionId)
  const screenIsWiderThanMd = useMediaQuery(up("md"));

  return (
    <>
      <Dialog
        open={!!actionId && !!selectedAction}
        onClose={() => router.push(returnHref, '/', { shallow: true })}
        className="fixed z-40 inset-0 overflow-y-auto"
      >
        <Dialog.Overlay className="fixed z-10 inset-0 bg-black opacity-75" />
        <div className='absolute z-20 w-full max-w-xl top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 py-5'>
          <SolidarityActionCard
            withSummary
            data={selectedAction}
          />
        </div>
      </Dialog>
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {Object.values(actionsByMonth).map((actions, i) => {
          return (
            <div className='space-y-4' key={i}>
              <h2 className='text-2xl font-bold text-gray-400'>{format(new Date(actions[0].fields.Date), 'MMMM yyyy')}</h2>
              {actions.map(action =>
                <Link
                  key={action.id}
                  href={!screenIsWiderThanMd ? `/action/${action.id}` : makeContextualHref({ actionId: action.id })}
                  as={`/action/${action.id}`}
                  shallow={screenIsWiderThanMd}
                >
                  <div className='transition cursor-pointer hover:opacity-75'>
                    <SolidarityActionItem
                      data={action}
                      isFeatured={action.fields.DisplayStyle === 'Featured'}
                    />
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function SolidarityActionItem ({ data, isFeatured }: { data: SolidarityAction, isFeatured?: boolean }) {
  return (
    <article className={cx(isFeatured && 'border-t-8 border-gray-800', 'bg-gray-900 rounded-md flex flex-col space-y-1 justify-between')}>
      <div className='space-y-1 p-4 pb-2'>
        {data.fields.Category?.length ?
          <div className='text-xs space-x-3 flex justify-between w-full flex-row'>
            <span className='text-pink-400 space-x-1'>{data.fields.Category?.map(c =>
              <div className='capitalize-first inline-block' key={c}>{c}</div>
            )}</span>
          </div>
        : null}
        <h3 className={cx(isFeatured ? 'text-2xl' : 'text-lg', 'font-bold leading-snug')}>{data.fields.Name}</h3>
        {data.fields.Link && (
          <a href={data.fields.Link} className='my-1 text-sm text-gray-400 hover:text-pink-400'>
            <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
            &nbsp;
            <span className='align-middle underline text-inherit '>{new URL(data.fields.Link).hostname}</span>
          </a>
        )}
      </div>
      {isFeatured && data.fields.Summary && (
        <div className={cx(isFeatured ? 'text-gray-200' : 'text-gray-400', 'w-full px-4 pb-2')}>
          <div className='max-w-xl text-sm' dangerouslySetInnerHTML={{ __html: data.fields.Summary }} />
        </div>
      )}
      <div className='text-xs space-x-3 flex justify-between w-full flex-row p-4 pt-0'>
        <span className='text-gray-400'>{stringifyArray(data.fields.Location, data.fields.Country)}</span>
        <time dateTime={format(new Date(data.fields.Date), "yyyy-MM-dd")} className='text-gray-400'>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</time>
      </div>
    </article>
  )
}

export function SolidarityActionCard ({ data }: { data: SolidarityAction, withSummary?: boolean }) {
  return (
    <>
      <article className='bg-gray-900 rounded-md flex flex-col space-y-4 justify-between'>
        <div className='space-y-1 px-4 md:px-5 pt-4 md:pt-5'>
          <div className='text-xs space-x-3 flex w-full flex-row'>
            <span className='text-gray-400'>{stringifyArray(data.fields.Location, data.fields.Country)}</span>
            <time dateTime={format(new Date(data.fields.Date), "yyyy-MM-dd")} className='text-gray-400'>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</time>
            {data.fields.Category?.length ?
              <span className='text-pink-400 space-x-1'>{data.fields.Category?.map(c =>
                <div className='capitalize-first inline-block' key={c}>{c}</div>
              )}</span>
            : null }
          </div>
          <h3 className='text-2xl font-bold leading-snug'>{data.fields.Name}</h3>
        </div>
        {data.fields.Summary && (
          <div className='w-full text-gray-200 px-4 md:px-5'>
            <div className='max-w-xl -my-1' dangerouslySetInnerHTML={{ __html: data.fields.Summary }} />
          </div>
        )}
        {data.fields.Link && (
          <div className='px-4 md:px-5 pb-1'>
            <a href={data.fields.Link} className='my-1 text-md text-gray-400 hover:text-pink-400'>
              <span className='align-middle'>Read more: </span>
              <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
              &nbsp;
              <span className='align-middle underline text-inherit '>{new URL(data.fields.Link).hostname}</span>
            </a>
          </div>
        )}
        <div className='text-sm my-4 p-4 md:pb-4 px-4 md:px-5 text-gray-500 rounded-md border-t-2 border-dotted border-gray-800 pt-3'>
          Have more info about this action? <a className='link' href='mailto:hello@gameworkersolidarity.com'>Let us know</a>.
        </div>
      </article>
    </>
  )
}