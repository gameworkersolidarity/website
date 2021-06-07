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

        <nav className='md:space-x-4'>
          <div className='space-x-4 md:inline'>
            <Link href={'/'}>
              <span className='link'>Solidarity actions</span>
            </Link>
            <Link href={'/submit'}>
              <span className='link'>Add data</span>
            </Link>
            <Link href='/docs'>
              <span className='link'>API docs</span>
            </Link>
            <Link href={'/news'}>
              <span className='link'>News</span>
            </Link>
          </div>
          <div className='hidden md:inline-block border-gray-600 border-l h-3 align-middle' />
          <div className='space-x-4 md:inline'>
            <a href='https://github.com/gameworkersolidarity/website'>
              <span className='link'>
                Github
              </span>
            </a>
            <a className='link' href='mailto:hello@gameworkersolidarity.com'>
              hello@gameworkersolidarity.com
            </a>
          </div>
        </nav>

        <hr className='my-4 border-transparent' />

        <Component {...pageProps} />
      </VerticalScrollPage>
    </SWRConfig>
  )
}

export default MyApp
