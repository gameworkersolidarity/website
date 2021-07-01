import { Dialog, Transition } from "@headlessui/react"
import { OrganisingGroup } from '../data/types';
import { stringifyArray } from '../utils/string';
import Emoji from 'a11y-react-emoji';
import pluralize from 'pluralize';
import { useRouter } from 'next/dist/client/router';

export function useSelectedOrganisingGroup(solidarityOrganisingGroups: OrganisingGroup[], key = 'dialogOrganisingGroupId') {
  const router = useRouter();
  const dialogOrganisingGroupId = router.query[key]
  const selectedOrganisingGroup = solidarityOrganisingGroups.find(a => a.id === dialogOrganisingGroupId)
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
            <Dialog.Overlay className="fixed z-10 inset-0 bg-gwBlue opacity-75" />
            <div className='absolute z-20 w-full max-w-xl top-[15%] left-1/2 transform -translate-x-1/2 py-5 p-4'>
              <Dialog.Title className='hidden'>{data.fields.Name}</Dialog.Title>
              <Dialog.Description className='hidden'>{data.fields.IsUnion ? "Union" : "Organising group"} in {stringifyArray(...data.fields?.countryName || [])}</Dialog.Description>
              <button
                type="button"
                className="mb-3 rounded-lg px-2 py-1 border-box"
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

const OrganisingGroupCard = ({ data }: { data: OrganisingGroup }) => {
  return (
    <div className='bg-gwOrangeLight rounded-lg p-4 space-y-2'>
      <div className='font-bold text-lg'>
        {data.fields.Name}
      </div>
      {/* <div>{data.fields.IsUnion ? "Union" : "Organising group"} in {stringifyArray(...data.fields?.countryName || [])}</div> */}
      <div className=''>{pluralize('action', data.fields["Solidarity Actions"]?.length || 0, true)}</div>
      {data.fields.Website && (
        <a href={data.fields.Website} className='block'>
        <Emoji symbol='🔗' label='Link' />
          &nbsp;
          <span className='align-middle underline text-inherit'>{new URL(data.fields.Website).hostname}</span>
        </a>
      )}
      {data.fields.Twitter && (
        <a href={data.fields.Twitter} className='block'>
          <span className='align-middle underline text-inherit'>{data.fields.Twitter}</span>
        </a>
      )}
    </div>
  )
}