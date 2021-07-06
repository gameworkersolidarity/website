import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { useKonami } from 'react-konami-code';
import Emoji from 'a11y-react-emoji';

export function KonamiCode () {
  const [open, setOpen] = useState(false)
  useKonami(() => setOpen(true))
  const close = () => setOpen(false)

  return (
    <Dialog open={open} onClose={close}>
      <Dialog.Overlay className="fixed z-10 inset-0 bg-gwBlue opacity-75" />
      <div className='absolute z-20 w-full max-w-xl top-[15%] left-1/2 transform -translate-x-1/2 py-5'>
        <button
          type="button"
          className="mb-3 rounded-xl px-2 py-1 border-box"
          onClick={close}
        >
          &larr; Back
        </button>
        <div className='p-5 bg-gwOrangeLight rounded-xl space-y-4 absolute'>
          <Dialog.Title className='text-2xl font-bold'>
            You found the easter egg! <Emoji symbol='🎁' label='Picture of a gift box' />
          </Dialog.Title>
          <Dialog.Description as='div' className='space-y-2'>
            <p>We weren't creative enough to actually make any content for the easter egg, but there you are!</p>
            <p>(The real easter egg is the solidarity you build with your coworkers.)</p>
          </Dialog.Description>
          <button className='button border-black' onClick={close}>Close</button>
        </div>
      </div>
    </Dialog>
  )
}