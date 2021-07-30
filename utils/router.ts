import { NextRouter } from "next/dist/client/router"

import scrollIntoView from 'scroll-into-view';

export function scrollToId(router: NextRouter, year: string) {
  const element = document.getElementById(year)

  if (!element) return
  
  const headerHeight = 74
  const headerScrollPadding = 20
  
  scrollIntoView(element, {
    align:{
      top: 0,
      topOffset: headerHeight + headerScrollPadding
    }
  })
  
  // TODO: Re-add this functionality to update the hash
  // router.push({ hash: year }, undefined, { shallow: true, scroll: false })
}