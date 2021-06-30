import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { StaticPage } from '../data/types';
import qs from 'query-string';
import useSWR from 'swr';
import { doNotFetch } from '../utils/swr';
import { LinksData } from '../pages/api/links';
import cx from 'classnames';

export default function PageLayout ({ children, fullWidth }: { children: any, fullWidth?: boolean }) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header fullWidth={fullWidth} />

      <main>
        {children}
      </main>

      <Footer fullWidth={fullWidth} />
    </div>
  )
}

function Header ({ fullWidth }: { fullWidth?: boolean }) {
  const { data } = useSWR<LinksData>(qs.stringifyUrl({
    url: '/api/links'
  }), { 
    // Data should have been loaded by _app.tsx already,
    ...doNotFetch()
  })

  return (
    <header className={cx(`py-5 bg-gwPink space-y-2`)}>
      <div className={cx(fullWidth ? 'px-4 md:px-5' : 'content-wrapper', 'grid grid-cols-1 lg:grid-cols-3 gap-4')}>
        <div className='space-y-3 col-span-2'>
          <div className='text-6xl font-identity cursor-pointer hover:text-gwPinkLight'>
            <Link href='/'>Game Worker Solidarity</Link>
          </div>
          <p className='text-2xl text-200 max-w-2xl font-light'>
            Mapping and documenting collective movements by game workers striving to improve their working conditions.
          </p>
        </div>
        <nav className='space-x-2 lg:text-right lg:space-x-none xl:space-x-2 lg:pt-2'>
          {data?.links?.map?.((link, i) => (
            <a
              href={link.fields.Slug ? `/${link.fields.Slug}` : link.fields.Link}
              key={link.fields.Slug || link.fields.Link}
              className='lg:block xl:inline-block'
            >
              <span className='link'>{link.fields.Title}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Footer ({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <footer className='mt-auto bg-gwYellow'>
      <div className={cx(fullWidth ? 'px-4 md:px-5' : 'content-wrapper', 'py-5 md:py-6')}>
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