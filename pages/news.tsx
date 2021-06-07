import Head from 'next/head'
import { getBlogPosts } from './api/blogPosts';
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

      <section className='space-y-6'>
        {blogPosts.map(b => (
          // <Link href={`/news/${b.fields.Slug}`} key={b.id}>
            <article key={b.id}
              className='md:grid grid-cols-3'
            >
              <header className='text-gray-400 space-x-4'>
                {b.fields.Date && <span>{format(new Date(b.fields.Date), 'dd MMM yyyy')}</span>}
              </header>
              <div className='max-w-2xl space-y-2 col-span-2'>
                <h2 className='font-bold text-4xl leading-snug'>
                  {b.fields.Title}
                </h2>
                <p className='text-2xl text-gray-400 font-bold'>{b.fields.Summary}</p>
                <div className='prose text-gray-400' dangerouslySetInnerHTML={{ __html: b.fields.Body }} />
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