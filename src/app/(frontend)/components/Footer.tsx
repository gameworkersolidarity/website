import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import Link from 'next/link'

interface NavigationItem {
  label: string
  url: string
}

interface FooterProps {
  navigation?: NavigationItem[]
}

export function Footer({ navigation = [] }: FooterProps) {
  return (
    <footer className="mt-auto bg-gw-pink text-sm">
      <div className="content-wrapper py-5 md:py-6 space-y-4 flex flex-col md:flex-row justify-between items-start align-top">
        <div className="space-y-4 grow">
          <NavigationMenu viewport={false} className="-ml-2">
            <NavigationMenuList className="flex-wrap">
              {navigation.map((item, index) => (
                <NavigationMenuItem key={index} className="relative">
                  {'url' in item && item.url ? (
                    <NavigationMenuLink asChild>
                      <Link href={item.url}>{item.label}</Link>
                    </NavigationMenuLink>
                  ) : null}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="md:flex space-y-4 md:space-y-0 md:space-x-5">
            <div>
              Site developed by{' '}
              <a className="link" href="https://commonknowledge.coop">
                Common Knowledge
              </a>{' '}
              and{' '}
              <a className="link" href="http://shaunabuckley.com/">
                Shauna Buckley
              </a>
            </div>
            <div>
              Funded by{' '}
              <a className="link" href="https://www.open.ac.uk">
                The Open University
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
