'use client'

import Link from 'next/link'
import Image from 'next/image'
import { twMerge } from 'tailwind-merge'
import useScrollPosition from '@react-hook/window-scroll'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import { MenuIcon } from 'lucide-react'
import { navLinks } from '@/app/links'
import { useElementSize } from '@custom-react-hooks/use-element-size'
import { SearchBar } from '@/components/SearchBar'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'

type NavigationItem =
  | {
      label: string
      url: string
      emoji?: string
    }
  | {
      label: string
      emoji?: string
      children?: NavigationItem[]
    }

export function Header({ navigation = [] }: { navigation?: NavigationItem[] }) {
  const _navigation = [...navigation, ...navLinks]

  const [ref, size] = useElementSize()
  const scrollY = useScrollPosition(60 /*fps*/)
  const isFloating = scrollY > (size.height || 100) * 0.75
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [open, setOpen] = useState(false)
  const path = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [path])

  return (
    <>
      <header className="pt-3 bg-gw-pink space-y-2 z-40" ref={ref} id="static-header">
        <div className="content-wrapper">
          <div className="lg:flex lg:space-x-4 space-y-2 lg:space-y-0 items-center">
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
            <div className="leading-none text-4xl lg:text-[4vw] md:w-1/2 font-identity cursor-pointer hover:text-gwPinkLight shrink-0">
              <Link href="/">Game Worker Solidarity</Link>
            </div>
            <p className="leading-normal lg:leading-tight text-xl xl:text-2xl lg:w-1/2 block text-200 font-light">
              Mapping and documenting collective movements by game workers striving to improve their
              working conditions.
            </p>
          </div>
        </div>
      </header>
      <nav
        className="pl-1 md:pl-2 top-0 sticky z-50 py-3 bg-gw-pink h-[60px] flex flex-row items-center"
        id="sticky-header"
      >
        {!isMobile ? (
          <>
            <NavigationMenu viewport={false}>
              <NavigationMenuList className="flex-wrap justify-start gap-0">
                {_navigation.map((item, index) => (
                  <NavigationMenuItem key={index} className="relative">
                    {'children' in item ? (
                      <>
                        <NavigationMenuTrigger>
                          <span className="flex items-center gap-1">
                            {/* {item.emoji && <Emoji symbol={item.emoji} />} */}
                            {item.label}
                          </span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul>
                            {item.children?.map((child, index) => (
                              <li key={index}>
                                <NavigationMenuLink asChild>
                                  <Link href={'url' in child && child.url ? child.url : ''}>
                                    <span className="flex items-center gap-1">
                                      {/* {'emoji' in child && child.emoji && (
                                        <Emoji symbol={child.emoji} />
                                      )} */}
                                      {child.label}
                                    </span>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : 'url' in item && item.url ? (
                      <NavigationMenuLink asChild>
                        <Link href={item.url}>
                          <span className="flex items-center gap-1">
                            {/* {item.emoji && <Emoji symbol={item.emoji} />} */}
                            {item.label}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    ) : null}
                  </NavigationMenuItem>
                ))}
                <NavigationMenuItem suppressHydrationWarning className="hidden lg:block">
                  <SearchBar />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </>
        ) : (
          // Hamburger -> modal menu
          <div className="flex flex-row items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <Button
                variant="ghost"
                onClick={() => {
                  const newState = !open
                  setOpen(newState)
                  if (newState) {
                    posthog.capture('mobile_menu_opened')
                  }
                }}
              >
                <MenuIcon className="w-6 h-6" aria-label="Open menu" />
              </Button>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetDescription className="flex flex-col gap-2">
                    {_navigation.map((item, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        {'url' in item && item.url ? (
                          <Link
                            href={item.url}
                            className="link"
                            onClick={() => {
                              posthog.capture('navigation_link_clicked', {
                                link_label: item.label,
                                link_url: item.url,
                                navigation_type: 'mobile',
                              })
                            }}
                          >
                            <span className="flex items-center gap-1">
                              {/* {item.emoji && <Emoji symbol={item.emoji} />} */}
                              {item.label}
                            </span>
                          </Link>
                        ) : (
                          <div>
                            <span className="flex items-center gap-1">
                              {/* {item.emoji && <Emoji symbol={item.emoji} />} */}
                              {item.label}
                            </span>
                          </div>
                        )}
                        {'children' in item && item.children ? (
                          <div className="ml-3 flex flex-col gap-2">
                            {item.children.map((child, childIndex) => (
                              <Link
                                key={childIndex}
                                href={'url' in child && child.url ? child.url : ''}
                                className="link"
                                onClick={() => {
                                  posthog.capture('navigation_link_clicked', {
                                    link_label: child.label,
                                    link_url: 'url' in child ? child.url : '',
                                    parent_label: item.label,
                                    navigation_type: 'mobile',
                                  })
                                }}
                              >
                                <span className="flex items-center gap-1">
                                  {/* {'emoji' in child && child.emoji && (
                                    <Emoji symbol={child.emoji} />
                                    )} */}
                                  {child.label}
                                </span>
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
            <SearchBar />
          </div>
        )}
        <div
          className={twMerge(
            isFloating ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
            'max-w-6xl mr-4 ml-auto block transform duration-200 transition-all leading-none text-xl lg:text-2xl font-identity cursor-pointer hover:text-gwPinkLight shrink-0 order-1 md:order-last',
          )}
          style={{ marginLeft: 'auto' }}
          suppressHydrationWarning
        >
          <Link href="/">
            <span className="flex items-center gap-2">
              Game Worker Solidarity
              <Image
                src="/images/GameWorkerSolidarity_Logo_Transparent.png"
                width="48"
                height="48"
                alt="Game Worker Solidarity Logo"
              />
            </span>
          </Link>
        </div>
        {/* </div> */}
      </nav>
    </>
  )
}
