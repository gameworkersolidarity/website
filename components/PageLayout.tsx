import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { StaticPage, MenuItem } from '../data/types';
import qs from 'query-string';
import useSWR from 'swr';
import { doNotFetch } from '../utils/swr';
import { LinksData } from '../pages/api/links';
import cx from 'classnames';
import useScrollPosition from '@react-hook/window-scroll'
import { useRef } from 'react';

export default function PageLayout ({ children }: { children: any }) {
  return (
    <div className='min-h-screen flex flex-col relative'>
      <Header />

      <main>
        {children}
      </main>

      <Footer />
    </div>
  )
}

function Header ({  }: {  }) {
  const { data } = useSWR<{ headerLinks: MenuItem[] }>('/api/links?placement=Header', { 
    // Data should have been loaded by _app.tsx already,
    ...doNotFetch()
  })
  
  const headerRef = useRef<HTMLDivElement>(null)
  const scrollY = useScrollPosition(60 /*fps*/)
  const isFloating = scrollY > ((headerRef.current?.clientHeight || 100) * 0.75)

  return (
    <>
    <header className='py-5 bg-gwPink space-y-2' ref={headerRef} id='static-header'>
      <div className='content-wrapper'>
        <div className='sm:flex sm:space-x-4 space-y-2 sm:space-y-0 items-top'>
          <div className='leading-none text-4xl lg:text-[4vw] sm:w-1/2 font-identity cursor-pointer hover:text-gwPinkLight flex-shrink-0'>
            <Link href='/'>Game Worker Solidarity</Link>
          </div>
          <p className='leading-normal sm:leading-tight text-xl xl:text-2xl sm:w-1/2 block text-200 max-w-2xl font-light flex-shrink-0'>
            Mapping and documenting collective movements by game workers striving to improve their working conditions.
          </p>
        </div>
      </div>
    </header>
    <nav className='top-0 sticky z-40 py-3 bg-gwPink' id='sticky-header'>
      <div className='text-sm md:text-base content-wrapper w-full flex flex-row flex-wrap justify-start -mx-1 space-x-1 md:-mx-2 md:space-x-3 items-center'>
        {data?.headerLinks?.map?.((link, i) => (
          <a
            href={link.fields.url}
            key={link.fields.url}
            className='order-last md:order-1'
          >
            <span className='nav-link'>
              {link.fields.label}
            </span>
          </a>
        ))}
        <div className={cx(
          isFloating ? 'opacity-100 max-w-6xl translate-x-0' : 'opacity-0 translate-x-2',
          'hidden md:block transform ml-auto duration-200 transition-all leading-none text-xl lg:text-2xl font-identity cursor-pointer hover:text-gwPinkLight flex-shrink-0 order-1 md:order-last'
        )} style={{ marginLeft: 'auto'}}>
          <Link href='/'>Game Worker Solidarity</Link>
        </div>
      </div>
    </nav>
    <div id='portal-node' />
    </>
  )
}

function Footer ({ }: { }) {
  const { data } = useSWR<{ footerLinks: MenuItem[] }>('/api/links?placement=Header', { 
    // Data should have been loaded by _app.tsx already,
    ...doNotFetch()
  })

  return (
    <footer className='mt-auto bg-gwPink text-sm'>
      <div className="content-wrapper py-5 md:py-6 space-y-4 flex flex-col md:flex-row justify-between items-start align-top">
        <div className='space-y-4 flex-grow'>
          <nav className='flex flex-wrap -mx-1 md:-mx-2'>
            {data?.footerLinks?.map?.((link, i) => (
              <a
                href={link.fields.url}
                key={link.fields.url}
              >
                <span className='nav-link'>{link.fields.label}</span>
              </a>
            ))}
          </nav>
          <div className='md:flex space-y-4 md:space-y-0 md:space-x-5'>
            <div>
              Site developed by <a className='link' href='https://commonknowledge.coop'>
                Common Knowledge
              </a> and <a className='link' href='http://shaunabuckley.com/'>
                Shauna Buckley
              </a>
            </div>
            <div>
              Funded by <a className='link' href='https://www.open.ac.uk'>The Open University</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}