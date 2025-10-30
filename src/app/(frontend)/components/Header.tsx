import React from 'react'
import Link from 'next/link'

interface NavigationItem {
  label: string
  url: string
}

interface HeaderProps {
  navigation?: NavigationItem[]
}

export function Header({ navigation = [] }: HeaderProps) {
  if (navigation.length === 0) {
    return null
  }

  return (
    <header className="site-header">
      <nav className="header-nav">
        <ul className="header-nav-list">
          {navigation.map((item, index) => (
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
    </header>
  )
}
