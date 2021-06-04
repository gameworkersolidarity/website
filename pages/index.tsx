import Head from 'next/head'
import Emoji from 'a11y-react-emoji'
import { SolidarityActionsList } from '../components/SolidarityActions'
import { getSolidarityActions } from './api/solidarityActions'
import VerticalScrollPage from '../components/VerticalScrollPage';
import env from 'env-var';
import Link from 'next/link';

export default function Page() {
  return (
    <>
      <h1 className='text-2xl font-bold'>
        Timeline
      </h1>

      <div className='py-4' />

      <section>
        <SolidarityActionsList />
      </section>
    </>
  )
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  const solidarityActions = await getSolidarityActions()

  return {
    props: {
      solidarityActions,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}