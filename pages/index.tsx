import Head from 'next/head'
import Emoji from 'a11y-react-emoji'

export default function Home() {
  return (
    <div className='min-h-screen p-6 flex flex-col justify-center text-center'>
      <Head>
        <title>Game Worker Solidarity Project</title>
        <meta name="description" content="A living history of game worker solidarity" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='mt-auto'>
        <h1 className='text-4xl font-bold'>
          <div className='text-gray-400'>In development</div>
          <div>Game Worker Solidarity Project</div>
        </h1>
      </main>

      <div className='py-2' />

      <footer className='mt-auto'>
        <a className='text-gray-500' href='https://commonknowledge.coop'>
          Developed with <Emoji symbol='✊' label='worker power' /> by Common Knowledge Co-operative
        </a>
      </footer>
    </div>
  )
}
