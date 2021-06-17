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
import { useMemo, useRef, useState } from 'react';
import pluralize from 'pluralize'
import Emoji from 'a11y-react-emoji';
import { projectStrings } from '../data/site';
import Image from 'next/image'
import Fuse from 'fuse.js';
import { CumulativeMovementChart } from './ActionChart';

interface ListProps {
  data: SolidarityAction[],
  withDialog?: boolean,
  gridStyle?: string,
  dialogProps?: Partial<DialogProps>,
  mini?: boolean
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
    if (returnHref) {
      return router.replace(returnHref, returnHref, { shallow: true })
    }
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
            <Dialog.Overlay className="fixed z-10 inset-0 bg-gwBlue opacity-75" />
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
  data: solidarityActions, withDialog, gridStyle = 'grid-cols-1', dialogProps, mini
}: ListProps) {
  const { makeContextualHref } = useContextualRouting();
  const [selectedAction, dialogKey] = useSelectedAction(solidarityActions || [], dialogProps?.key)
  const screenIsWiderThanMd = useMediaQuery(up("md"));

  const actionsByYear = solidarityActions?.reduce((bins, action) => {
    const key = `${getYear(new Date(action.fields.Date))}`
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
        {actionsByYear && Object.values(actionsByYear).map((actions, i) => {
          return (
            <div key={i}>
              <h2 className={cx(mini ? 'text-lg py-3' : 'text-2xl py-6', 'text-center font-bold')}>
                {format(new Date(actions[0].fields.Date), 'yyyy')}
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
                      {mini ? <SolidarityActionMiniItem data={action} /> : <SolidarityActionItem data={action} />}
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
  const actions = data?.data?.solidarityActions || []
  const search = useMemo(() => new Fuse(actions, {
    keys: ['fields.Category'],
    // threshold: 0.5,
    findAllMatches: true,
    shouldSort: false,
    useExtendedSearch: true
  }), [actions])
  const categories = useMemo(() => {
    return Array.from(new Set(actions.reduce((arr, action) => [...arr, ...(action.fields?.Category || [] as string[])], [])))
  }, [actions])
  //
  const [filteredCategories, setCategories] = useState<string[]>([])
  const toggleCategory = (category: string) => {
    let categories = JSON.parse(JSON.stringify(filteredCategories))
    const i = categories.indexOf(category)
    console.log(categories, category, i)
    let _categories
    if (i > -1) {
      categories.splice(i, 1)
      _categories = categories
    } else {
      _categories = Array.from(new Set(categories.concat([category])))
    }
    console.log(_categories)
    setCategories(_categories)
  }
  const displayedActions = useMemo(() => {
    if (!filteredCategories.length) return actions
    return search.search({
      $or: filteredCategories.map(c => ({ 'fields.Category': `'${c}` }))
    }).map(s => s.item)
  }, [actions, search, filteredCategories])

  return (
    <div className='md:flex flex-row relative'>
      <div>
        <CumulativeMovementChart data={displayedActions} />

        <SolidarityActionsList
          data={displayedActions}
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
      </div>
      <div className='hidden md:block sticky top-0'>
        <div className='pl-5 space-y-3'>
          <h4 className='text-lg font-bold leading-tight'>Filter actions</h4>
          <div className='space-y-3'>
            {categories.map(category => (
              <div
                key={category}
                className={cx(filteredCategories.includes(category) ? 'text-gwOrange' : 'text-gray-600', 'cursor-pointer capitalize')}
                onClick={() => toggleCategory(category)}>
                  {category}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SolidarityActionMiniItem ({ data }: { data: SolidarityAction }) {
  return (
    <article className={'flex flex-row space-x-2 border-gwOrange border-2 rounded-md group-hover:shadow-glow transition duration-75 p-3 justify-between'}>
      <Emoji symbol='💥' label='Action icon' className='text-xl' />
      <h3 className={'max-w-lg px-4 w-full'}>{data.fields.Name}</h3>
      {data.geography?.country.map(country => (
        <Emoji
          key={country.iso3166}
          symbol={country.emoji.emoji}
          label={`Flag of ${country.name}`}
          className='align-top'
        />
      ))}
    </article>
  )
}

export function SolidarityActionItem ({ data }: { data: SolidarityAction }) {
  const isFeatured = data.fields.DisplayStyle === 'Featured'
  return (
    <article className={('bg-gray-100 rounded-md group-hover:shadow-glow transition duration-75 lg:grid grid-cols-8 gap-4 p-4 border-2 border-gwOrange text-sm')}>
      <div>
        <Emoji symbol='💥' label='Action icon' className='text-xl' />
        {stringifyArray(data.fields.Category)}
      </div>
      <div className='col-span-5'>
        <h3 className={cx(isFeatured ? 'text-2xl leading-tight' : 'text-md italic leading-snug', 'max-w-xl ')}>{data.fields.Name}</h3>
        <div className=' md:flex flex-row md:space-x-6'>
          {data.fields.Link && (
            <a href={data.fields.Link} className='block my-1'>
              <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
              &nbsp;
              <span className='align-middle underline text-inherit text-gwBlue'>{new URL(data.fields.Link).hostname}</span>
            </a>
          )}
          {data.fields.Document?.map(doc => (
            <a key={doc.id} href={doc.url} className='block my-1'>
              <PaperClipIcon className='h-3 w-3 inline-block text-inherit align-middle' />
              &nbsp;
              <span className='align-middle underline text-inherit text-gwBlue'>{doc.filename}</span>
            </a>
          ))}
        </div>
        {isFeatured && data.fields.Summary && (
          <div className={'w-full  pt-4 pb-3'}>
            <div className='max-w-md text-sm' dangerouslySetInnerHTML={{ __html: data.summary.html }} />
          </div>
        )}
      </div>
      <div className='space-x-1'>
        {data.geography?.country.map(country => (
          <span className='space-x-1' key={country.iso3166}>
            <Emoji
              symbol={country.emoji.emoji}
              label={`Flag of ${country.name}`}
            />
            <span>{country.name}</span>
          </span>
        ))}
        {data.fields.Location ? (
            <span><br />{data.fields.Location}</span>
          ) : null}
      </div>
      <time dateTime={format(new Date(data.fields.Date), "yyyy-MM-dd")}>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</time>
    </article>
  )
}

export function SolidarityActionCard ({ data, withContext, contextProps }: CardProps) {
  const seoTitle = `${format(new Date(data.fields.Date), 'dd MMM yyyy')}: ${data.fields.Name}`

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={data.summary.plaintext}
        openGraph={{
          title: seoTitle,
          description: data.summary.plaintext
        }}
      />
      <article className='bg-gwOrangeLight rounded-md flex flex-col space-y-4 justify-between'>
        <div className='space-y-1 px-4 md:px-5 pt-4 md:pt-5'>
          <div className='text-xs space-x-2 flex w-full flex-row '>
            {data.fields.Location ? <span>{data.fields.Location}</span> : null}
            {data.geography?.country.map(country => (
              <span className='space-x-1' key={country.iso3166}>
                <Emoji
                  symbol={country.emoji.emoji}
                  label={`Flag of ${country.name}`}
                />
                <span>{country.name}</span>
              </span>
            ))}
            <time dateTime={format(new Date(data.fields.Date), "yyyy-MM-dd")} className=''>{format(new Date(data.fields.Date), 'dd MMM yyyy')}</time>
            {data.fields.Category?.length ?
              <span className=' space-x-1'>{data.fields.Category?.map(c =>
                <div className='capitalize-first inline-block' key={c}>{c}</div>
              )}</span>
            : null }
          </div>
          <h3 className='text-2xl font-bold leading-snug'>{data.fields.Name}</h3>
        </div>
        {data.fields.Summary && (
          <div className='w-full  px-4 md:px-5'>
            <div className='max-w-xl -my-1' dangerouslySetInnerHTML={{ __html: data.summary.html }} />
          </div>
        )}
        {data.fields.Link && (
          <div className='px-4 md:px-5 pb-1'>
            <a href={data.fields.Link} className='my-1 text-md  hover:'>
              <span className='align-middle'>Read more: </span>
              <ExternalLinkIcon className='h-3 w-3 inline-block text-inherit align-middle' />
              &nbsp;
              <span className='align-middle underline text-inherit '>{new URL(data.fields.Link).hostname}</span>
            </a>
          </div>
        )}
        {data.fields.Document?.length && (
          <div className='text-sm my-4 p-4 md:pb-4 px-4 md:px-5 border-t-2 border-dotted border-gwBlue hover: transition duration-75 pt-3'>
            <div className='uppercase text-sm  pb-2'>Attachments</div>
            <div className='grid gap-4'>
              {data.fields.Document.map(doc => (
                <a key={doc.id} href={doc.url} className='overflow-hidden box-border border-2 border-gwBlue'>
                  <div className='text-lg mb-1 px-4 pt-3'>{doc.filename}</div>
                  <div className=' font-mono pb-2 px-4'>{doc.type}</div>
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
        <div className='text-sm my-4 p-4 md:pb-4 px-4 md:px-5 border-t-2 border-dotted border-gwBlue pt-3'>
          Have more info about this action? <a className='link' href={`mailto:${projectStrings.email}`}>Let us know</a>.
        </div>
      </article>

      {withContext && (
        <>
          <div className='my-4' />
          <div className='uppercase text-sm pb-2'>Related</div>
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

  const actionCount = data?.fields?.['Solidarity Actions']?.length || 0
  
  return data?.fields ? (
    <Link href={`/country/${data.fields.Slug}`}>
      <div className='cursor-pointer bg-gwOrangeLight hover: rounded-md p-4'>
        <div className='font-bold text-lg'>
          {data.fields.Name} <Emoji symbol={data.emoji.emoji} label='flag' />
        </div>
        <div className=' pb-3'>{pluralize('action', actionCount, true)}</div>
        <div className='link text-sm'>
          View country dashboard &rarr;
        </div>
      </div>
    </Link>
  ) : null
}