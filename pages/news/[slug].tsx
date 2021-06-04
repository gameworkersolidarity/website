import Head from 'next/head'
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring';
import VerticalScrollPage from '../../components/VerticalScrollPage';
import { getSingleBlogPost } from '../api/getSingleBlogPost';
import { BlogPost } from '../../data/types';
import { getBlogPosts } from '../api/getBlogPosts';

type Props = {
  blogPost: BlogPost,
  slug: string
};

export default function Page({ blogPost }: Props) {
  return (
    <>
      <Head>
        <title>{blogPost.fields.Title} — Game Worker Solidarity Project</title>
        <meta name="description" content={blogPost.fields.Summary} />
      </Head>

      <h1 className='text-4xl font-bold'>
        <div>{blogPost.fields.Title}</div>
      </h1>
      <h2 className='text-xl font-bold text-gray-400'>{blogPost.fields.Summary}</h2>
      <div className='prose' dangerouslySetInnerHTML={{ __html: blogPost.fields.Body }} />
    </>
  )
}

interface Params extends ParsedUrlQuery {
  slug: string,
}

export const getStaticPaths: GetStaticPaths = async () => {
  const blogPosts = await getBlogPosts()

  const paths = blogPosts.map(blog => ({
    params: { slug: blog.fields.Slug }
  }))

  return {
    paths,
    fallback: true
  };
}

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params: { slug }}) => {
  const blogPost = await getSingleBlogPost(slug)
  return {
    props: {
      slug,
      blogPost
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}