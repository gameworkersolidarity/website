import App from 'next/app'
import { SWRConfig } from 'swr'
import '../styles/globals.css'
import { projectStrings } from '../data/site';
import {DefaultSeo} from 'next-seo';
import { KonamiCode } from '../components/KonamiCode';
import { doNotFetch } from '../utils/swr';
import { useCanonicalURL } from '../data/seo';
import { getMenuItems } from '../data/menuItem';

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
          description: projectStrings.description
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
