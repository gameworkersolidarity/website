import Head from 'next/head'

export default function Home() {
  return (
    <div className='min-h-screen p-6 flex flex-col justify-center'>
      <Head>
        <title>Game Worker Solidarity Project</title>
        <meta name="description" content="A living history of game worker solidarity" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className='text-4xl font-bold'>
          <span className='text-gray-400'>We are the</span>
          &nbsp;
          <u>Game Worker Solidarity Project</u>
        </h1>
      </main>

      <div className='py-2' />

      <footer>
        <a className='text-gray-500' href='https://commonknowledge.coop'>
          Developed by Common Knowledge Co-operative
        </a>
      </footer>
    </div>
  )
}
