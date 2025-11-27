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
          <ul className="list-none flex flex-row space-x-4">
            {navigation.map((item, index) => (
              <li key={index} className="nav-link">
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
