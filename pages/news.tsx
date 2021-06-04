import Head from 'next/head'
import Link from 'next/link';
import { getBlogPosts } from './api/getBlogPosts';
import { BlogPost } from '../data/types';
import { format } from 'date-fns';

type Props = {
  blogPosts: BlogPost[],
};

export default function Page({ blogPosts }: Props) {
  return (
    <>
      <Head>
        <title>News — Game Worker Solidarity Project</title>
      </Head>

      <h1 className='hidden'>
        Latest News
      </h1>

      <section className='grid gap-4'>
        {blogPosts.map(b => (
          // <Link href={`/news/${b.fields.Slug}`} key={b.id}>
            <article key={b.id}
              // className='md:border-2 md:border-gray-900 md:p-7 rounded-md flex flex-col space-y-2 justify-between'
            >
              <div className='max-w-2xl space-y-2'>
                <header className='text-xs opacity-60 space-x-4'>
                  {b.fields.Date && <span>{format(new Date(b.fields.Date), 'dd MMM yyyy')}</span>}
                </header>
                <h2 className='font-bold text-4xl'>
                  {b.fields.Title}
                </h2>
                <h3 className='text-xl font-bold text-gray-400'>{b.fields.Summary}</h3>
                <div className='prose' dangerouslySetInnerHTML={{ __html: b.fields.Body }} />
              </div>
            </article>
          // </Link>
        ))}
      </section>
    </>
  )
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  const blogPosts = await getBlogPosts()

  return {
    props: {
      blogPosts,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}