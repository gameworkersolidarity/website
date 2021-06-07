import Head from 'next/head'
import { getSolidarityActions } from './api/solidarityActions'
import MarkdownIt from 'markdown-it'
export const markdown = new MarkdownIt();

async function generateDocs() {
  return [
    {
      title: 'GET /api/solidarityActions',
      href: '/api/solidarityActions',
      text: markdown.render(`
        This project includes an read-only API.

        - [\`/api/solidarityActions\`](/api/solidarityActions)

        Example output:
      `),
      exampleOutputJSON: {
        solidarityActions: (await getSolidarityActions()).slice(0, 1)
      }
    }
  ]
}

type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
} ? U : T;

export default function Page({ docs }: { docs: Await<ReturnType<typeof generateDocs>> }) {
  return (
    <>
      <Head>
        <title>API Docs — Game Worker Solidarity Project</title>
      </Head>

      <h1 className='text-2xl font-bold'>
        API
      </h1>

      <div className='py-4' />

      <section>
        {docs.map(doc => 
          <article key={doc.title}>
            <h2><a href={doc.href} className='font-mono text-pink-400'>
              {doc.title}
            </a></h2>
            <div dangerouslySetInnerHTML={{ __html: doc.text }} />
            <pre>
              {JSON.stringify(doc.exampleOutputJSON, null, 2)}
            </pre>
          </article>
        )}
      </section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      docs: await generateDocs()
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}