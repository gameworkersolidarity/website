import App from 'next/app'
import { SWRConfig } from 'swr'
import '../styles/globals.css'
import Head from 'next/head';
import Link from 'next/link';
import VerticalScrollPage from '../components/VerticalScrollPage';
import { getStaticPageLinks } from '../data/staticPage';
import { projectStrings } from '../data/site';
import { useRouter } from 'next/dist/client/router';
import {DefaultSeo} from 'next-seo';

function MyApp({ Component, pageProps, links }) {
  const router = useRouter()
  const canonicalURL = (new URL(router.asPath, projectStrings.baseUrl)).toString()
  return (
    <SWRConfig value={{
      initialData: pageProps,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }}>
      <DefaultSeo
        defaultTitle={projectStrings.name}
        titleTemplate={`%s | ${projectStrings.name}`}
        description={projectStrings.description}
        canonical={canonicalURL}
        additionalLinkTags={[
          {
            rel: 'icon',
            href: '/favicon.ico'
          }
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

      <VerticalScrollPage>
        <Link href='/'>
          <div className='text-2xl font-bold cursor-pointer text-gray-300 hover:text-pink-400'>
            <div>Game Worker Solidarity Project</div>
          </div>
        </Link>

        <nav className='space-x-2 md:space-x-4 text-sm text-gray-300'>
            <Link href={'/'}>
              <span className='link'>All data</span>
            </Link>
            <Link href={'/submit'}>
              <span className='link'>Add data</span>
            </Link>
            <Link href='/docs'>
              <span className='link'>API docs</span>
            </Link>
            <span>&middot;</span>
            <Link href={'/news'}>
              <span className='link'>News</span>
            </Link>
            {links?.map((link, i) => (
              <a href={link.fields.Slug || link.fields.Link} key={link.fields.Slug || link.fields.Link}>
                <span className='link'>{link.fields.Title}</span>
              </a>
            ))}
        </nav>

        <hr className='my-3 border-transparent' />

        <Component {...pageProps} />
      </VerticalScrollPage>
    </SWRConfig>
  )
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  const links = await getStaticPageLinks()
  return { ...appProps, links }
}

export default MyApp
