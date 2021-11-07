import env from 'env-var'
import MarkdownIt from 'markdown-it'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import PageLayout from '../components/PageLayout'
import { projectStrings } from '../data/site'
export const markdown = new MarkdownIt()

export default function Page({ introHTML }: { introHTML: string }) {
  return (
    <PageLayout>
      <NextSeo
        title={'Get the Data'}
        openGraph={{
          title: 'Get the Data'
        }}
      />

      <div className='py-5 content-wrapper'>
        <h1 className='font-identity text-4xl mb-2'>
          Get the Data
        </h1>
        <div
          className='max-w-2xl prose'
          dangerouslySetInnerHTML={{ __html: introHTML }}
        />
      </div>
      <AirtableDataEmbed url={EMBED_URL} />
    </PageLayout>
  )
}

const EMBED_URL = `https://airtable.com/embed/${env.get('AIRTABLE_DATA_EMBED_ID').default('shrxKvrGsmARoz6eY').asString()}?backgroundColor=red&viewControls=on`

function AirtableDataEmbed({ url }) {
  return (
    <iframe
      className="airtable-embed"
      src={url}
      frameBorder="0" width="100%"
      style={{ height: '66vh' }}
    />
  )
}

const introHTML = markdown.render(`
We provide the full dataset of actions as:

- a CSV file via Airtable (see below)
- a public API at [GET /api/solidarityActions](/api/solidarityActions)

There are no limitations on the use of this data at present. Please use this data for your solidarity projects and [tell us](mailto:${projectStrings.email}), we'd love to hear about them!
`)

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      introHTML
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt() // In seconds
  }
}