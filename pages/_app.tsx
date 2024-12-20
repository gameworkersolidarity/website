import { DefaultSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { KonamiCode } from '../components/KonamiCode';
import { useCanonicalURL } from '../data/seo';
import { projectStrings } from '../data/site';
import '../styles/globals.css';
import { doNotFetch } from '../utils/swr';

export const defaultOGImageStack = [
  {
    url: projectStrings.baseUrl + `/images/game-workers-share-card-new.png`,
    alt: 'Game Worker Solidarity',
    width: 955,
    height: 500
  }
]

function MyApp({ Component, pageProps, headerLinks, footerLinks }) {
  const canonicalURL = useCanonicalURL()

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
          images: defaultOGImageStack
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

export default MyApp
