import { NextRouter } from "next/dist/client/router"

import scrollIntoView from 'scroll-into-view'

export function scrollToYear(router: NextRouter, year: string) {
  const element = document.getElementById(year)
  const header = document.getElementById('sticky-header')

  if (!element) return
  if (!header) return

  const headerHeight = header.offsetHeight
  const headerScrollPadding = 8
  
  scrollIntoView(element, {
    align:{
      top: 0,
      topOffset: headerHeight + headerScrollPadding
    }
  })
}