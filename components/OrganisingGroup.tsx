import { Dialog, Transition } from "@headlessui/react"
import { OrganisingGroup } from '../data/types';
import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';
import pluralize from 'pluralize';
import { useRouter } from 'next/dist/client/router';
import { NextSeo } from "next-seo";
import cx from 'classnames';
import { SolidarityActionCountryRelatedActions, SolidarityActionRelatedActions } from "./SolidarityActions";
import { projectStrings } from "../data/site";
import { groupUrl } from "../data/organisingGroup";

export function useSelectedOrganisingGroup(groups: OrganisingGroup[], key = 'dialogOrganisingGroupId') {
  const router = useRouter();
  const dialogOrganisingGroupId = router.query[key]
  const selectedOrganisingGroup = groups.find(a => a.id === dialogOrganisingGroupId)
  return [selectedOrganisingGroup, key] as const
}

export const OrganisingGroupDialog = (
  { onClose, data }:
  { onClose: () => void, data?: OrganisingGroup }
) => {
  return (
    <Transition
      show={!!data}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog
        open={!!data}
        onClose={onClose}
        className="fixed z-40 inset-0 overflow-y-auto"
      >
        {!!data && (
          <>
            <OrganisingGroupSEO data={data} />
            <Dialog.Overlay className="fixed z-10 inset-0 bg-gwOrange opacity-80" />
            <div className='absolute z-20 w-full max-w-4xl top-[15%] left-1/2 transform -translate-x-1/2 py-5 p-4'>
              <Dialog.Title className='hidden'>{data.fields.Name}</Dialog.Title>
              <Dialog.Description className='hidden'>{data.fields.IsUnion ? "Union" : "Organising group"} in {stringifyArray(...data.fields?.countryName || [])}</Dialog.Description>
              <button
                type="button"
                className="mb-3 rounded-xl px-2 py-1 border-box"
                onClick={onClose}
              >
                &larr; Back
              </button>
              <OrganisingGroupCard data={data} />
            </div>
          </>
        )}
      </Dialog>
    </Transition>
  )
}

export const OrganisingGroupSEO = ({ data }: { data: OrganisingGroup }) => (
  <NextSeo
    title={data.fields.Name}
    canonical={groupUrl(data)}
    openGraph={{
      title: data.fields.Name
    }}
  />
)

export const OrganisingGroupCard = ({ data, withPadding = true, withContext = true }: { data: OrganisingGroup, withPadding?: boolean, withContext?: boolean }) => {
  return (
    <>
      <article className={cx('space-y-2px rounded-xl overflow-hidden glowable')}>
        <div className={cx(withPadding && 'md:px-8', 'p-4 bg-white')}>
          <div className='text-sm'>
            <div className='flex flex-wrap tracking-tight'>
              <span className='pr-3'>{data.fields.IsUnion ? "Union" : "Organising group"}</span>
              {data.geography?.country.map(country => (
                <span className='pr-3' key={country.iso3166}>
                  <Emoji
                    symbol={country.emoji.emoji}
                    label={`Flag of ${country.name}`}
                    className='pr-1'
                  />
                  <span>{country.name}</span>
                </span>
              ))}
            </div>
            <div className='pb-4' />
            <h3 className={cx('text-3xl leading-tight font-semibold max-w-3xl')}>
              {data.fields.Name}
            </h3>
            {data.fields["Full Name"] && (
              <div className={'w-full pt-4 text-lg font-light space-y-2'}>
                {data.fields["Full Name"] && (data.fields["Name"].trim() !== data.fields["Full Name"].trim()) && (
                  <p className='font-semibold text-xl leading-tight'>
                    {data.fields["Full Name"].trimEnd()}
                  </p>
                )}
                <p>{data.fields.IsUnion ? "A union" : "An organising group"} active {
                data.fields.countryCode?.length
                  ? <span>in {pluralize('country', data.fields.countryCode?.length, true)}</span>
                  : <span>internationally</span>
}. We know of {pluralize('action', data.fields["Solidarity Actions"]?.length, true)} associated with them.</p>
              </div>
            )}
            <div className='flex flex-row space-x-4 mt-1 text-sm'>
              {data.fields.Website && (
                <a href={data.fields.Website} className='block my-1'>
                  <Emoji symbol='🔗' label='Website' className='align-baseline' />
                  &nbsp;
                  <span className='align-baseline underline text-inherit'>{new URL(data.fields.Website).hostname}</span>
                </a>
              )}
              {data.fields.Twitter && (
                <a href={data.fields.Twitter} className='block my-1'>
                  <svg width="20" height="20" fill="currentColor" className='inline-block text-[#1da1f2]'>
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  &nbsp;
                  <span className='align-baseline underline text-inherit'>
                    @{new URL(data.fields.Twitter).pathname.replace(/\//gmi, '')}
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className={cx(withPadding && 'md:px-8', 'p-4 bg-white')}>
          Have more info about this {data.fields.IsUnion ? "union" : "organising group"}? <a className='link' href={`mailto:${projectStrings.email}`}>Let us know &rarr;</a>
        </div>
        {withContext && (
          <div className='grid gap-[2px] grid-cols-2'>
            <div className={cx(withPadding && 'md:px-8', 'p-4 bg-white')}>
              <SolidarityActionRelatedActions
                name={data.fields.Name}
                metadata={pluralize('related action', data.fields["Solidarity Actions"]?.length, true)}
                url={`/?group=${data.fields.Name}`}
                subtitle={`This ${data.fields.IsUnion ? "union" : "organising group"}`}
              />
            </div>
            {data.fields.countryCode?.map(code =>
              <div className={cx(withPadding && 'md:px-8', 'p-4 bg-white')} key={code}>
                <SolidarityActionCountryRelatedActions
                  countryCode={code}
                />
              </div>
            )}
          </div>
        )}
      </article>
    </>
  )
}