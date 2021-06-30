import env from 'env-var';
import qs from 'query-string'
import { NextSeo } from 'next-seo';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';

export default function Page({ embedUrl }) {
  return (
    <PageLayout>
      <NextSeo
        title={'Submit data'}
        openGraph={{
          title: 'Submit data'
        }}
      />

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
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      embedUrl: qs.stringifyUrl({
        url: `https://airtable.com/embed/${env.get('AIRTABLE_SUBMIT_EMBED_ID').default('shrghSX8tcj2XwhqO').asString()}`,
        query: {
          backgroundColor: 'red'
        }
      })
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}