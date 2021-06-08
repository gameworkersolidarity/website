import Head from 'next/head'
import { getSingleStaticPage, getStaticPageLinks } from '../data/staticPage';
import { BlogPost } from '../data/types';

export default function Page({ article }: { article: BlogPost }) {
  return article ? (
    <>
      <Head>
        <title>{article.fields.Title} — Game Worker Solidarity Project</title>
      </Head>

      <section>
        <article className='space-y-2'>
          <h1 className='text-4xl font-bold'>{article.fields.Title}</h1>
          <p className='text-2xl text-gray-400 font-bold'>{article.fields.Summary}</p>
          <div className='prose text-gray-400' dangerouslySetInnerHTML={{ __html: article.fields.Body }} />
        </article>
      </section>
    </>
  ) : null
}

export async function getStaticPaths() {
  const links = (await getStaticPageLinks()).filter(page => !!page.fields.Slug)
  return {
    paths: links.map(page => ({
      params: {
        slug: page.fields.Slug
      }
    })),
    fallback: true
  }
}

export async function getStaticProps(context) {
  const slug = context.params.slug
  const article = await getSingleStaticPage(slug)
  return {
    props: {
      article
    },
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}