import App from 'next/app'
import { SWRConfig } from 'swr'
import '../styles/globals.css'
import Head from 'next/head';
import Link from 'next/link';
import VerticalScrollPage from '../components/VerticalScrollPage';
import { getStaticPageLinks } from '../data/staticPage';

function MyApp({ Component, pageProps, links }) {
  return (
    <SWRConfig value={{
      initialData: pageProps,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }}>
      <Head>
        <title>Game Worker Solidarity Project</title>
        <meta name="description" content="A living history of game worker solidarity" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VerticalScrollPage>
        <Link href='/'>
          <div className='text-4xl font-bold cursor-pointer hover:text-pink-400'>
            <div className='text-gray-400'>A living history of</div>
            <div>game worker solidarity</div>
          </div>
        </Link>

        <div className='py-2' />

        <nav className='space-x-2 md:space-x-4'>
            <Link href={'/'}>
              <span className='link'>Solidarity actions</span>
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

        <hr className='my-4 border-transparent' />

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
