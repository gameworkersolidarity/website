import Head from 'next/head'
import MarkdownIt from 'markdown-it'
import { CodeBlock } from '../components/CodeBlock';
import { getSolidarityActions } from '../data/solidarityAction';
import { NextSeo } from 'next-seo';
import env from 'env-var';
export const markdown = new MarkdownIt();

interface Doc {
  title: string
  href: string
  text: string
  exampleOutputJSON: any
}

export default function Page({ docs }: { docs: Doc[] }) {
  return (
    <>
      <NextSeo
        title={'API Documentation'}
        openGraph={{
          title: 'API Documentation'
        }}
      />

      <h1 className='text-4xl font-bold mb-4'>
        Public API documentation
      </h1>

      <section>
        {docs.map(doc => 
          <article key={doc.title} className='space-y-2'>
            <h2 className='text-xl'><a href={doc.href} className='font-mono text-pink-400'>
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
    </>
  )
}

export async function getStaticProps() {
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