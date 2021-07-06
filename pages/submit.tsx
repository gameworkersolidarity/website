import env from 'env-var';
import qs from 'query-string'
import { NextSeo } from 'next-seo';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import Script from 'next/script';

export default function Page() {
  return (
    <PageLayout>
      <NextSeo
        title={'Submit data'}
        openGraph={{
          title: 'Submit data'
        }}
      />

      <div>
        <h1 className='font-identity text-4xl font-bold mb-4 hidden'>
          Submit a solidarity action to the timeline 
        </h1>

        <AirtableEmbed url={EMBED_URL} />
      </div>
    </PageLayout>
  )
}

const EMBED_URL = qs.stringifyUrl({
  url: `https://airtable.com/embed/${env.get('AIRTABLE_SUBMIT_EMBED_ID').default('shrghSX8tcj2XwhqO').asString()}`,
  query: {
    backgroundColor: 'red'
  }
})

function AirtableEmbed ({ url }) {
  return (
    <>
      <Script src="https://static.airtable.com/js/embed/embed_snippet_v1.js" strategy='beforeInteractive' />
      <iframe
        className="airtable-embed airtable-dynamic-height"
        src={EMBED_URL}
        // @ts-ignore
        frameBorder="0" width="100%" height="1815"
        style={{ background: 'transparent', border: 'transparent' }}
      />
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {},
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt() // In seconds
  }
}