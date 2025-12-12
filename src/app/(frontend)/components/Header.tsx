'use client'

import Link from 'next/link'
import Image from 'next/image'
import { twMerge } from 'tailwind-merge'
import useScrollPosition from '@react-hook/window-scroll'
import { useRef } from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import { HamburgerIcon, MenuIcon } from 'lucide-react'
import { navLinks } from '@/app/links'

type NavigationItem =
  | {
      label: string
      url: string
    }
  | {
      label: string
      children?: NavigationItem[]
    }

export function Header({ navigation = [] }: { navigation?: NavigationItem[] }) {
  const _navigation = [...navigation, ...navLinks]

  const headerRef = useRef<HTMLDivElement>(null)
  const scrollY = useScrollPosition(60 /*fps*/)
  const isFloating = scrollY > (headerRef.current?.clientHeight || 100) * 0.75
  const isMobile = useMediaQuery('(max-width: 768px)')

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
        className="pl-1 md:pl-2 top-0 sticky z-40 py-3 bg-gw-pink h-[60px] flex flex-row items-center"
        id="sticky-header"
      >
        {!isMobile ? (
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex-wrap">
              {_navigation.map((item, index) => (
                <NavigationMenuItem key={index} className="relative">
                  {'children' in item ? (
                    <>
                      <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul>
                          {item.children?.map((child, index) => (
                            <li key={index}>
                              <NavigationMenuLink asChild>
                                <Link href={'url' in child && child.url ? child.url : ''}>
                                  {child.label}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : 'url' in item && item.url ? (
                    <NavigationMenuLink asChild>
                      <Link href={item.url}>{item.label}</Link>
                    </NavigationMenuLink>
                  ) : null}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        ) : (
          // Hamburger -> modal menu
          <div className="flex flex-row items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost">
                  <MenuIcon className="w-6 h-6" aria-label="Open menu" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetDescription className="flex flex-col gap-2">
                    {_navigation.map((item, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        {'url' in item && item.url ? (
                          <Link href={item.url} className="link">
                            {item.label}
                          </Link>
                        ) : (
                          <div>{item.label}</div>
                        )}
                        {'children' in item && item.children ? (
                          <div className="ml-3 flex flex-col gap-2">
                            {item.children.map((child, index) => (
                              <Link
                                key={index}
                                href={'url' in child && child.url ? child.url : ''}
                                className="link"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        )}
        <div
          className={twMerge(
            isFloating ? 'opacity-100 max-w-6xl translate-x-0 mr-4' : 'opacity-0 translate-x-2',
            'block transform ml-auto duration-200 transition-all leading-none text-xl lg:text-2xl font-identity cursor-pointer hover:text-gwPinkLight shrink-0 order-1 md:order-last',
          )}
          style={{ marginLeft: 'auto' }}
        >
          <Link href="/">Game Worker Solidarity</Link>
        </div>
        {/* </div> */}
      </nav>
    </>
  )
}
