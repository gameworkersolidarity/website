import Head from 'next/head'
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

      <h1 className='text-2xl font-bold mb-4 hidden'>
        Submit a solidarity action to the timeline 
      </h1>

      <script src="https://static.airtable.com/js/embed/embed_snippet_v1.js"></script>
      <iframe
        className="airtable-embed airtable-dynamic-height"
        src={embedUrl}
        // @ts-ignore
        frameBorder="0" onmousewheel="" width="100%" height="1815"
        style={{ background: 'transparent', border: 'transparent' }}
      />
    </>
  )
}