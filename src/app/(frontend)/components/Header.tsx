'use client'

import Link from 'next/link'
import Image from 'next/image'
import { twMerge } from 'tailwind-merge'
import useScrollPosition from '@react-hook/window-scroll'
import { useRef } from 'react'

interface NavigationItem {
  label: string
  url: string
}

export function Header({ navigation = [] }: { navigation?: NavigationItem[] }) {
  const _navigation = [
    {
      label: 'Home',
      url: '/',
    },
    ...navigation,
    {
      label: 'Campaigns',
      url: '/campaigns',
    },
    {
      label: 'Organise!',
      url: '/start-organising',
    },
    {
      label: 'Articles',
      url: '/articles',
    },
    {
      label: 'API docs',
      url: '/api/docs',
    },
    {
      label: 'GraphQL',
      url: '/api/graphql-playground',
    },
    {
      label: 'About',
      url: '/about',
    },
  ]

  const headerRef = useRef<HTMLDivElement>(null)
  const scrollY = useScrollPosition(60 /*fps*/)
  const isFloating = scrollY > (headerRef.current?.clientHeight || 100) * 0.75

  return (
    <>
      <header className="pt-3 bg-gw-pink space-y-2" ref={headerRef} id="static-header">
        <div className="content-wrapper">
          <div className="sm:flex sm:space-x-4 space-y-2 sm:space-y-0 items-center">
            <div className="leading-none shrink-0">
              <Link href="/">
                <Image
                  src="/images/GameWorkerSolidarity_Logo_Transparent.png"
                  width="100"
                  height="100"
                  alt="Game Worker Solidarity Logo"
                />
              </Link>
            </div>
            <div className="leading-none text-4xl lg:text-[4vw] sm:w-1/2 font-identity cursor-pointer hover:text-gwPinkLight shrink-0">
              <Link href="/">Game Worker Solidarity</Link>
            </div>
            <p className="leading-normal sm:leading-tight text-xl xl:text-2xl sm:w-1/2 block text-200 font-light">
              Mapping and documenting collective movements by game workers striving to improve their
              working conditions.
            </p>
          </div>
        </div>
      </header>
      <nav
        className="pl-2 top-0 sticky z-40 py-3 bg-gw-pink h-[60px] flex flex-row items-center"
        id="sticky-header"
      >
        <div className="text-sm md:text-base content-wrapper w-full flex flex-row flex-wrap justify-start -mx-1 space-x-1 md:-mx-2 md:space-x-3 items-center">
          <ul className="list-none flex flex-row space-x-4">
            {_navigation.map((item, index) => (
              <li key={index}>
                {item.url.startsWith('http') ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.url}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
          <div
            className={twMerge(
              isFloating ? 'opacity-100 max-w-6xl translate-x-0' : 'opacity-0 translate-x-2',
              'hidden md:block transform ml-auto duration-200 transition-all leading-none text-xl lg:text-2xl font-identity cursor-pointer hover:text-gwPinkLight shrink-0 order-1 md:order-last',
            )}
            style={{ marginLeft: 'auto' }}
          >
            <Link href="/">Game Worker Solidarity</Link>
          </div>
        </div>
      </nav>
      <div id="portal-node" />
    </>
  )
}
