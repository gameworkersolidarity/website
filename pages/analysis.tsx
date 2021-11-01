import { BlogPost } from '../data/types';
import { format } from 'date-fns';
import { getBlogPosts } from '../data/blogPost';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import Image from 'next/image'
import Link from 'next/link';
import { BlogPostThumbnail } from '../components/BlogPost';

type Props = {
  blogPosts: BlogPost[],
};

export default function Page({ blogPosts }: Props) {
  return (
    <PageLayout>
      <NextSeo
        title={'Analysis'}
        openGraph={{
          title: 'Analysis'
        }}
      />

      <div className='content-wrapper py-5'>
        <h1 className='font-identity text-6xl'>
          Analysis
        </h1>

        <div className='py-2' />

        <section className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {blogPosts.map(b => (
            <BlogPostThumbnail key={b.id} blog={b} />
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