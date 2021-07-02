import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { StaticPage, MenuItem } from '../data/types';
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
  const { data } = useSWR<{ headerLinks: MenuItem[] }>('/api/links?placement=Header', { 
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
          {data?.headerLinks?.map?.((link, i) => (
            <a
              href={link.fields.url}
              key={link.fields.url}
              className='lg:block xl:inline-block'
            >
              <span className='link'>{link.fields.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Footer ({ fullWidth }: { fullWidth?: boolean }) {
  const { data } = useSWR<{ footerLinks: MenuItem[] }>('/api/links?placement=Header', { 
    // Data should have been loaded by _app.tsx already,
    ...doNotFetch()
  })

  return (
    <footer className='mt-auto bg-gwPink'>
      <div className={cx(fullWidth ? 'px-4 md:px-5' : 'content-wrapper', 'py-5 md:py-6 space-y-4 flex flex-col md:flex-row justify-between items-start align-top')}>
        <div className='space-y-4 flex-grow'>
          <nav className='grid gap-4 grid-flow-col grid-rows-2 auto-cols-auto'>
            {data?.footerLinks?.map?.((link, i) => (
              <a
                href={link.fields.url}
                key={link.fields.url}
              >
                <span className='link'>{link.fields.label}</span>
              </a>
            ))}
          </nav>
          <div className='text-sm'>
            Site by <a className='link' href='https://commonknowledge.coop'>
              Common Knowledge Co-operative
            </a> and <a className='link' href='http://shaunabuckley.com/'>
              Shauna Buckley
            </a>
          </div>
        </div>
        <div className='text-7xl'>
          <Emoji symbol='✊' label='worker power' /> 
        </div>
      </div>
    </footer>
  )
}