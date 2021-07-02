import env from 'env-var';
import { GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import PageLayout from '../components/PageLayout';

export default function Page({ embedUrl }) {
  return (
    <PageLayout fullWidth>
      <NextSeo
        title={'All data'}
        openGraph={{
          title: 'All data'
        }}
      />

      <div>
        <h1 className='text-2xl font-bold mb-4 hidden'>
          All data
        </h1>

        <AirtableDataEmbed url={EMBED_URL} />
      </div>
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {}
  }
}

const EMBED_URL = `https://airtable.com/embed/${env.get('AIRTABLE_DATA_EMBED_ID').default('shrxKvrGsmARoz6eY').asString()}?backgroundColor=red&viewControls=on`

function AirtableDataEmbed ({ url }) {
  return (
    <iframe
      className="airtable-embed"
      src={url}
      frameBorder="0" width="100%"
      style={{ height: '75vh' }}
    />
  )
}