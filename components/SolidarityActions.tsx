import { format, getMonth, getYear } from 'date-fns';
import useSWR from 'swr'
import { SolidarityActionsData } from '../pages/api/solidarityActions';
import { SolidarityAction, Country } from '../data/types';
import { stringifyArray } from '../utils/string';
import { ExternalLinkIcon, PaperClipIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import { useContextualRouting } from 'next-use-contextual-routing';
import { useRouter } from 'next/dist/client/router';
import { Dialog, Transition } from '@headlessui/react'
import { useMediaQuery } from '../utils/mediaQuery';
import { up } from '../utils/screens';
import cx from 'classnames'
import { NextSeo } from 'next-seo';
import qs from 'query-string';
import { useMemo, useRef } from 'react';
import pluralize from 'pluralize'
import Emoji from 'a11y-react-emoji';
import { projectStrings } from '../data/site';
import Image from 'next/image'

interface ListProps {
  data: SolidarityAction[],
  withDialog?: boolean,
  gridStyle?: string,
  dialogProps?: Partial<DialogProps>
}

interface DialogProps {
  selectedAction?: SolidarityAction,
  returnHref?: string
  cardProps?: Partial<CardProps>
  key?: string
}

interface CardProps {
  data: SolidarityAction,
  withContext?: boolean
  contextProps?: Partial<ContextProps>
}

interface ContextProps {
  countryCode: string,
  listProps?: Partial<ListProps>
}

export function SolidarityActionDialog ({ selectedAction, returnHref, cardProps }: DialogProps) {
  const router = useRouter()

  function onClose () {
    return router.replace(returnHref, returnHref, { shallow: true })
  }

  const showDialog = !!selectedAction

  return (
    <Transition
      show={showDialog}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog
        open={showDialog}
        onClose={onClose}
        className="fixed z-40 inset-0 overflow-y-auto"
      >
        {selectedAction?.fields && (
          <>
            <Dialog.Overlay className="fixed z-10 inset-0 bg-black opacity-75" />
            <div className='absolute z-20 w-full max-w-xl top-[15%] left-1/2 transform -translate-x-1/2 py-5'>
              <Dialog.Title className='hidden'>{selectedAction.fields.Name}</Dialog.Title>
              <Dialog.Description className='hidden'>{selectedAction.fields.Summary}</Dialog.Description>
              <button
                type="button"
                className="mb-3 rounded-md px-2 py-1 border-box"
                onClick={onClose}
              >
                &larr; Back
              </button>
              <SolidarityActionCard
                data={selectedAction}
                {...cardProps}
              />
            </div>
          </>
        )}
      </Dialog>
    </Transition>
  )
}

export function useSelectedAction(solidarityActions: SolidarityAction[], key = 'dialogActionId') {
  const router = useRouter();
  const dialogActionId = router.query[key]
  const selectedAction = solidarityActions.find(a => a.id === dialogActionId)
  return [selectedAction, key] as const
}

export function SolidarityActionsList ({
  data: solidarityActions, withDialog, gridStyle = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', dialogProps
}: ListProps) {
  const { makeContextualHref } = useContextualRouting();
  const [selectedAction, dialogKey] = useSelectedAction(solidarityActions || [], dialogProps?.key)
  const screenIsWiderThanMd = useMediaQuery(up("md"));

  const actionsByMonth = solidarityActions?.reduce((bins, action) => {
    const key = `${getYear(new Date(action.fields.Date))}-${getMonth(new Date(action.fields.Date))}`
    bins[key] ??= []
    bins[key].push(action)
    return bins
  }, {} as { [key: string]: SolidarityAction[] })

  const linksAsDialogs = screenIsWiderThanMd && withDialog

  const router = useRouter()
  const returnHref = useMemo(() => typeof window !== 'undefined' ? window.location.pathname : router.pathname, [])

  return (
    <>
      {withDialog && (
        <SolidarityActionDialog
          selectedAction={selectedAction}
          returnHref={returnHref}
          {...dialogProps}
        />
      )}
      <div className={`grid gap-4 ${gridStyle}`}>
        {actionsByMonth && Object.values(actionsByMonth).map((actions, i) => {
          return (
            <div key={i}>
              <h2 className='text-xl text-gray-400 font-bold pb-1'>
                {format(new Date(actions[0].fields.Date), 'MMMM yyyy')}
              </h2>
              <div className='space-y-4'>
                {actions.map(action =>
                  <Link
                    key={action.id}
                    href={!linksAsDialogs ? `/action/${action.id}` : makeContextualHref({ [dialogKey]: action.id })}
                    as={`/action/${action.id}`}
                    shallow={linksAsDialogs}
                  >
                    <div className='transition cursor-pointer group'>
                      <SolidarityActionItem
                        data={action}
                        isFeatured={action.fields.DisplayStyle === 'Featured'}
                      />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function SolidarityActionsFullList () {
  const data = useSWR<SolidarityActionsData>('/api/solidarityActions')

  return (
    <SolidarityActionsList
      data={data?.data?.solidarityActions}
      withDialog
      dialogProps={{
        cardProps: {
          withContext: true,
          contextProps: {
            listProps: {
              withDialog: false
            }
          }
        },
      }}
    />
  )
}

export function SolidarityActionItem ({ data, isFeatured }: { data: SolidarityAction, isFeatured?: boolean }) {
  return (
    <article className={cx(isFeatured && 'border-t-8 border-gray-800', 'bg-gray-900 group-hover:bg-gray-800 transition duration-75 rounded-md flex flex-col space-y-1 justify-between')}>
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
          <a href={data.fields.Link} className='block my-1 text-sm text-gray-400 hover:text-pink-400'>
            <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
            &nbsp;
            <span className='align-middle underline text-inherit '>{new URL(data.fields.Link).hostname}</span>
          </a>
        )}
        {data.fields.Document?.map(doc => (
          <a key={doc.id} href={doc.url} className='block my-1 text-sm text-gray-400 hover:text-pink-400'>
            <PaperClipIcon className='h-3 w-3 inline-block text-inherit align-middle' />
            &nbsp;
            <span className='align-middle underline text-inherit '>{doc.filename}</span>
          </a>
        ))}
      </div>
      {isFeatured && data.fields.Summary && (
        <div className={cx(isFeatured ? 'text-gray-200' : 'text-gray-400', 'w-full px-4 pb-2')}>
          <div className='max-w-xl text-sm' dangerouslySetInnerHTML={{ __html: data.fields.Summary }} />
        </div>
      )}
      <div className='text-xs space-x-3 flex justify-between items-center align-middle w-full flex-row px-4 pb-2'>
        <span className='space-x-1 text-gray-400'>
          {data.fields.Location ? (
            <span>
              <span>{data.fields.Location}</span>
              <span className='pointer-events-none'>,</span>
            </span>
          ) : null}
          {data.geography?.country.map(country => (
            <span className='space-x-1' key={country.iso3166}>
              <span>{country.name}</span>
              <Emoji
                symbol={country.emoji.emoji}
                label={`Flag of ${country.name}`}
              />
            </span>
          ))}
        </span>
        <time className='align-middle text-gray-400' dateTime={format(new Date(data.fields.Date), "yyyy-MM-dd")}>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</time>
      </div>
    </article>
  )
}

export function SolidarityActionCard ({ data, withContext, contextProps }: CardProps) {
  const seoTitle = `${format(new Date(data.fields.Date), 'dd MMM yyyy')}: ${data.fields.Name}`

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={data.fields.Summary}
        openGraph={{
          title: seoTitle,
          description: data.fields.Summary
        }}
      />
      <article className='bg-gray-900 rounded-md flex flex-col space-y-4 justify-between'>
        <div className='space-y-1 px-4 md:px-5 pt-4 md:pt-5'>
          <div className='text-xs space-x-2 flex w-full flex-row text-gray-400'>
            {data.fields.Location ? <span>{data.fields.Location}</span> : null}
            {data.geography?.country.map(country => (
              <span className='space-x-1' key={country.iso3166}>
                <span>{country.name}</span>
                <Emoji
                  symbol={country.emoji.emoji}
                  label={`Flag of ${country.name}`}
                />
              </span>
            ))}
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
        {data.fields.Document?.length && (
          <div className='text-sm my-4 p-4 md:pb-4 px-4 md:px-5 rounded-md border-t-2 border-dotted border-gray-800 hover:bg-gray-900 transition duration-75 pt-3'>
            <div className='uppercase text-sm text-gray-400 pb-2'>Attachments</div>
            <div className='grid gap-4'>
              {data.fields.Document.map(doc => (
                <a key={doc.id} href={doc.url} className='rounded-md overflow-hidden box-border border-2 border-gray-800'>
                  <div className='text-lg mb-1 px-4 pt-3'>{doc.filename}</div>
                  <div className='text-gray-400 font-mono pb-2 px-4'>{doc.type}</div>
                  <Image
                    src={doc.thumbnails.large.url}
                    width={doc.thumbnails.large.width}
                    height={doc.thumbnails.large.height}
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className='text-sm my-4 p-4 md:pb-4 px-4 md:px-5 text-gray-500 rounded-md border-t-2 border-dotted border-gray-800 pt-3'>
          Have more info about this action? <a className='link' href={`mailto:${projectStrings.email}`}>Let us know</a>.
        </div>
      </article>

      {withContext && (
        <>
          <div className='my-4' />
          <div className='uppercase text-sm text-gray-400 pb-2'>Related</div>
          <div className='grid sm:grid-cols-2 gap-4'>
            {data.fields['Country Code'].map(code =>
              <SolidarityActionCountryRelatedActions
                key={code}
                countryCode={code}
                {...contextProps}
              />
            )}
          </div>
        </>
      )}
    </>
  )
}

export function SolidarityActionCountryRelatedActions ({ countryCode, listProps }: ContextProps) {
  const { data } = useSWR<Country>(qs.stringifyUrl({
    url: `/api/country`,
    query: {
      iso2: countryCode
    }
  }), { revalidateOnMount: true })

  const actionCount = data?.fields?.['Solidarity Actions']?.length
  
  return data?.fields ? (
    <Link href={`/country/${data.fields.Slug}`}>
      <div className='cursor-pointer bg-gray-900 hover:bg-gray-800 rounded-md p-4'>
        <div className='font-bold text-lg'>
          {data.fields.Name} <Emoji symbol={data.emoji.emoji} label='flag' />
        </div>
        <div className='text-gray-400 pb-3'>{pluralize('action', actionCount, true)}</div>
        <div className='link text-sm'>
          View country dashboard &rarr;
        </div>
      </div>
    </Link>
  ) : null
}