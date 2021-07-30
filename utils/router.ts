import { NextRouter } from "next/dist/client/router"

export function scrollToId(router: NextRouter, year: string) {
  const element = document.getElementById(year)

  if (!element) return
  
  // As we have a sticky header, we need to offset the smooth scrolling to it
  // rather than use scrollTo
  const headerOffset = 74
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition - headerOffset

  window.scrollTo({
    behavior: 'smooth',
    top: offsetPosition
  })

  // TODO: Re-add this functionality to update the hash
  // router.push({ hash: year }, undefined, { shallow: true, scroll: false })
}