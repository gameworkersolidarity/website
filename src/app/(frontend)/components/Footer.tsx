import React from 'react'
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
    <footer className="site-footer">
      <div className="footer-content">
        <nav className="footer-nav">
          <ul className="footer-nav-list">
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
        <div className="footer-attribution">
          Site developed by Common Knowledge and Shauna Buckley
          <br />
          Funded by The Open University
        </div>
      </div>
    </footer>
  )
}
