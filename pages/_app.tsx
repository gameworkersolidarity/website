import * as Fathom from 'fathom-client';
import { DefaultSeo } from 'next-seo';
import App from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { KonamiCode } from '../components/KonamiCode';
import { getMenuItems } from '../data/menuItem';
import { useCanonicalURL } from '../data/seo';
import { projectStrings } from '../data/site';
import '../styles/globals.css';
import { doNotFetch } from '../utils/swr';

function MyApp({ Component, pageProps, headerLinks, footerLinks }) {
  const canonicalURL = useCanonicalURL()

  const router = useRouter()

  useEffect(() => {
    Fathom.load('OZSKHUQE', {
      includedDomains: ['gameworkersolidarity.com', 'www.gameworkersolidarity.com'],
      url: 'https://skunk.gameworkersolidarity.com/script.js',
    })

    function onRouteChangeComplete() {
      Fathom.trackPageview()
    }


    router.events.on('routeChangeComplete', onRouteChangeComplete)

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [])

  return (
    <SWRConfig value={{
      initialData: { ...pageProps, headerLinks, footerLinks },
      ...doNotFetch()
    }}>
      <DefaultSeo
        defaultTitle={projectStrings.name}
        titleTemplate={`%s | ${projectStrings.name}`}
        description={projectStrings.description}
        canonical={canonicalURL}
        additionalLinkTags={[
          { rel: 'icon', href: '/favicon/favicon.ico' },
          { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-touch-icon.png" },
          { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
          { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/favicon-16x16.png" },
          { rel: "manifest", href: "/site.webmanifest" }
        ]}
        openGraph={{
          url: canonicalURL,
          site_name: projectStrings.name,
          title: projectStrings.name,
          description: projectStrings.description,
          images: [
            {
              url: projectStrings.baseUrl + `/images/game-workers-share-card.png`,
              alt: 'Game Worker Solidarity',
            }
          ]
        }}
        twitter={{
          handle: projectStrings.twitterHandle,
          site: projectStrings.twitterHandle,
          cardType: 'summary_large_image',
        }}
      />
      <div>
        <KonamiCode />
        <Component {...pageProps} />
      </div>
    </SWRConfig>
  )
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  const links = await getMenuItems()
  return {
    ...appProps,
    headerLinks: links.filter(l => l.fields.placement.includes('Header')),
    footerLinks: links.filter(l => l.fields.placement.includes('Footer'))
  }
}

export default MyApp
