import Emoji from 'a11y-react-emoji';

export default function VerticalScrollPage ({ children }) {
  return (
    <div className='min-h-screen max-w-7xl mx-auto p-4 md:py-6 md:px-7 flex flex-col'>
      <main>
        {children}
      </main>

      <div className='py-6' />

      <footer className='mt-auto space-x-5 text-gray-500'>
        <a href='https://commonknowledge.coop'>
          Developed with <Emoji symbol='✊' label='worker power' /> by Common Knowledge Co-operative
        </a>
      </footer>
    </div>
  )
}