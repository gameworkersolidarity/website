import { BlogPost } from '../data/types';
import { format } from 'date-fns';
import { getBlogPosts } from '../data/blogPost';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';

type Props = {
  blogPosts: BlogPost[],
};

export default function Page({ blogPosts }: Props) {
  return (
    <PageLayout>
      <NextSeo
        title={'News'}
        openGraph={{
          title: 'News'
        }}
      />

      <div className='content-wrapper py-5'>
        <h1 className='text-4xl font-bold'>
          Project news
        </h1>

        <div className='py-2' />

        <section className='space-y-6 w-full max-w-xl'>
          {blogPosts.map(b => (
            // <Link href={`/news/${b.fields.Slug}`} key={b.id}>
              <article key={b.id} className='border-b border-gwPink pb-5 mb-5'>
                <header className=' space-x-4'>
                  {b.fields.Date && <time dateTime={format(new Date(b.fields.Date), 'yyyy-MM-dd')}>{format(new Date(b.fields.Date), 'dd MMM yyyy')}</time>}
                </header>
                <div className='max-w-2xl space-y-2 col-span-2'>
                  <h2 className='font-bold text-2xl leading-snug'>
                    {b.fields.Title}
                  </h2>
                  <p className=' font-bold'>{b.fields.Summary}</p>
                  <div className='prose ' dangerouslySetInnerHTML={{ __html: b.body.html }} />
                </div>
              </article>
            // </Link>
          ))}
        </section>
      </div>
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      blogPosts: await getBlogPosts() || []
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}