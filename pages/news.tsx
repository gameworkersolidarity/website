import Head from 'next/head'
import { BlogPost } from '../data/types';
import { format } from 'date-fns';
import { getBlogPosts } from '../data/blogPost';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticProps } from 'next';

type Props = {
  blogPosts: BlogPost[],
};

export default function Page({ blogPosts }: Props) {
  return (
    <>
      <NextSeo
        title={'News'}
        openGraph={{
          title: 'News'
        }}
      />

      <h1 className='text-4xl font-bold'>
        Project news
      </h1>

      <div className='py-2' />

      <section className='space-y-6 w-full max-w-xl'>
        {blogPosts.map(b => (
          // <Link href={`/news/${b.fields.Slug}`} key={b.id}>
            <article key={b.id} className='border border-gray-800 p-4 rounded-md'>
              <header className='text-gray-300 space-x-4'>
                {b.fields.Date && <time dateTime={format(new Date(b.fields.Date), 'yyyy-MM-dd')}>{format(new Date(b.fields.Date), 'dd MMM yyyy')}</time>}
              </header>
              <div className='max-w-2xl space-y-2 col-span-2'>
                <h2 className='font-bold text-2xl leading-snug'>
                  {b.fields.Title}
                </h2>
                <p className='text-gray-300 font-bold'>{b.fields.Summary}</p>
                <div className='prose text-gray-300' dangerouslySetInnerHTML={{ __html: b.body.html }} />
              </div>
            </article>
          // </Link>
        ))}
      </section>
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      blogPosts: await getBlogPosts()
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}