import Head from 'next/head'
import { getSolidarityActions } from './api/solidarityActions'
import VerticalScrollPage from '../components/VerticalScrollPage';
import env from 'env-var';
import qs from 'query-string'

export default function Page() {
  const embedUrl = qs.stringifyUrl({
    url: `https://airtable.com/embed/${env.get('AIRTABLE_SUBMIT_EMBED_ID').default('shrghSX8tcj2XwhqO').required().asString()}`,
    query: {
      backgroundColor: 'red'
    }
  })

  return (
    <>
      <Head>
        <title>Submit an action — Game Worker Solidarity archive</title>
        <meta name="description" content="Add a solidarity action to the living history of game worker solidarity" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className='text-2xl font-bold mb-4'>
        Submit
      </h1>

      <script src="https://static.airtable.com/js/embed/embed_snippet_v1.js"></script>
      <iframe
        className="airtable-embed airtable-dynamic-height"
        src={embedUrl}
        // @ts-ignore
        frameBorder="0" onmousewheel="" width="100%" height="1815"
        style={{ background: 'transparent', border: '1px solid #ccc' }}
      />
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