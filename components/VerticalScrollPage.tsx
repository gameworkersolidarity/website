import Emoji from 'a11y-react-emoji';

export default function VerticalScrollPage ({ children }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <main>
        {children}
      </main>

      <div className='py-6' />

      <footer className='mt-auto bg-gwYellow'>
        <div className='content-wrapper py-5 md:py-6'>
          <div className='space-x-2 text-sm'>
            <a href='https://commonknowledge.coop'>
              Developed with <Emoji symbol='✊' label='worker power' /> by <span className='link'>Common Knowledge Co-operative</span>
            </a>
            <a href='http://shaunabuckley.com/'>
              Design by <span className='link'>Shauna Buckley</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}