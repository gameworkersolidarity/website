import MarkdownIt from 'markdown-it'
import { CodeBlock } from '../components/CodeBlock';
import { getSolidarityActions } from '../data/solidarityAction';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticProps } from 'next';
import { getCountryByCode } from '../data/country';
import PageLayout from '../components/PageLayout';
import { projectStrings } from '../data/site';
export const markdown = new MarkdownIt();

interface Doc {
  title: string
  href: string
  text: string
  exampleOutputJSON: any
}

export default function Page({ docs }: { docs: Doc[] }) {
  return (
    <PageLayout>
      <NextSeo
        title={'API Documentation'}
        openGraph={{
          title: 'API Documentation'
        }}
      />

      <div className='py-5 content-wrapper'>
        <h1 className='font-identity text-4xl mb-2'>
          API documentation
        </h1>
        <p className='mb-6 max-w-2xl'>
          This is a public API that we hope might be useful to you for solidarity projects. Please <a href={`mailto:${projectStrings.email}`}>let us know</a> if you use it, we're curious to hear!
        </p>

        <section>
          {docs.map(doc => 
            <article key={doc.title} className='space-y-2'>
              <h2 className='text-xl'><a href={doc.href} className='font-mono text-gwPink'>
                {doc.title}
              </a></h2>
              <div className='prose' dangerouslySetInnerHTML={{ __html: doc.text }} />
              <CodeBlock
                language='json'
                value={JSON.stringify(doc.exampleOutputJSON, null, 2)}
              />
            </article>
          )}
        </section>
      </div>
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const docs = [
    {
      title: 'GET /api/solidarityActions',
      href: '/api/solidarityActions',
      text: markdown.render(`
Serves all solidarity actions data, mirroring the data stored in our Airtable.

Example output:
      `),
      exampleOutputJSON: {
        solidarityActions: (await getSolidarityActions({
          // We want to highlight content that has categories
          filterByFormula: 'AND(Public, Name!="", Country!="", Category!="")',
          maxRecords: 1
        })).slice(0, 1)
      }
    },
    {
      title: 'GET /api/country?iso2=GB',
      href: '/api/country?iso2=GB',
      text: markdown.render(`
Serves country data.

Example output:
      `),
      exampleOutputJSON: (await getCountryByCode('GB'))
    }
  ]

  return {
    props: {
      docs
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt() // In seconds
  }
}