import { SWRConfig } from 'swr'
import '../styles/globals.css'
import Head from 'next/head';
import Link from 'next/link';
import VerticalScrollPage from '../components/VerticalScrollPage';

function MyApp({ Component, pageProps }) {
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

        <nav className='space-x-4'>
          <Link href={'/'}>
            <span className='underline cursor-pointer hover:text-pink-400'>Timeline</span>
          </Link>
          <Link href={'/submit'}>
            <span className='underline cursor-pointer hover:text-pink-400'>Add to the archive</span>
          </Link>
          <Link href={'/news'}>
            <span className='underline cursor-pointer hover:text-pink-400'>Latest news</span>
          </Link>
          <a className='underline cursor-pointer hover:text-pink-400' href='mailto:hello@gameworkersolidarity.com'>
            Contact us via email
          </a>
        </nav>

        <hr className='my-4 border-transparent' />

        <Component {...pageProps} />
      </VerticalScrollPage>
    </SWRConfig>
  )
}

export default MyApp
