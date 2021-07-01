import { NextRouter } from "next/dist/client/router";

export function scrollToId(router: NextRouter, year: string) {
  const element = document.getElementById(year);
  if (!element) return

  if (!!element.scrollIntoView) {
    // Smooth scroll to that elment
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
    setTimeout(() => {
      router.push({ hash: year }, undefined, { shallow: true, scroll: false })
    }, 450)
  } else {
    router.push({ hash: year }, undefined, { shallow: true, scroll: false })
  }
}