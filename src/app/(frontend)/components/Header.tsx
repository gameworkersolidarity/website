import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface NavigationItem {
  label: string
  url: string
}

interface HeaderProps {
  navigation?: NavigationItem[]
}

export function Header({ navigation = [] }: HeaderProps) {
  const _navigation = [
    {
      label: 'Home',
      url: '/',
    },
    ...navigation,
    {
      label: 'API docs',
      url: '/api/docs',
    },
  ]

  return (
    <header className="site-header">
      <div className="header-content-wrapper">
        <div className="header-brand">
          <Link href="/" className="header-logo-link">
            <Image
              src="/images/GameWorkerSolidarity_Logo_Transparent.png"
              alt="Game Worker Solidarity"
              width={100}
              height={100}
              className="header-logo"
            />
          </Link>
          <Link href="/" className="header-title font-identity">
            Game Worker Solidarity
          </Link>
        </div>
        <nav className="header-nav">
          <ul className="header-nav-list">
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
        </nav>
      </div>
    </header>
  )
}
