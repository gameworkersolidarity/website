import Head from 'next/head'
import { BlogPost } from '../data/types';
import { format } from 'date-fns';
import { getBlogPosts } from '../data/blogPost';

type Props = {
  blogPosts: BlogPost[],
};

export default function Page({ blogPosts }: Props) {
  return (
    <>
      <Head>
        <title>News — Game Worker Solidarity Project</title>
      </Head>

      <h1 className='text-2xl font-bold'>
        Project news
      </h1>

      <div className='py-2' />

      <section className='space-y-6'>
        {blogPosts.map(b => (
          // <Link href={`/news/${b.fields.Slug}`} key={b.id}>
            <article key={b.id}
              className='md:grid grid-cols-3'
            >
              <header className='text-gray-400 space-x-4'>
                {b.fields.Date && <time dateTime={format(new Date(b.fields.Date), 'yyyy-MM-dd')}>{format(new Date(b.fields.Date), 'dd MMM yyyy')}</time>}
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

export async function getStaticProps() {
  return {
    props: {
      blogPosts: await getBlogPosts()
    },
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}