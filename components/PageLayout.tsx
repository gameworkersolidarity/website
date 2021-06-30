import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { StaticPage } from '../data/types';
import qs from 'query-string';
import useSWR from 'swr';
import { doNotFetch } from '../utils/swr';
import { LinksData } from '../pages/api/links';

export default function PageLayout ({ children }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />

      <div className='py-4' />

      <main>
        {children}
      </main>

      <div className='py-6' />

      <Footer />
    </div>
  )
}

function Header () {
  const { data } = useSWR<LinksData>(qs.stringifyUrl({
    url: '/api/links'
  }), { 
    // Data should have been loaded by _app.tsx already,
    ...doNotFetch()
  })

  return (
    <header className='my-4'>
      <div className='content-wrapper'>
        <nav className='lg:flex flex-row justify-between items-center'>
          <div className='text-2xl font-identity font-bold cursor-pointer  hover:text-gwPink'>
            <Link href='/'>Game Worker Solidarity</Link>
          </div>
          <div className='ml-auto space-x-2'>
            <Link href={'/submit'}>
              <span className='link'>Submit</span>
            </Link>
            <Link href='/docs'>
              <span className='link'>API</span>
            </Link>
            <Link href={'/news'}>
              <span className='link'>News</span>
            </Link>
            {data?.links?.map?.((link, i) => (
              <a href={link.fields.Slug ? `/${link.fields.Slug}` : link.fields.Link} key={link.fields.Slug || link.fields.Link}>
                <span className='link'>{link.fields.Title}</span>
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}

function Footer () {
  return (
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
  )
}