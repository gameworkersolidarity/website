import Head from 'next/head'
import { getSingleStaticPage, getStaticPageLinks } from '../data/staticPage';
import { BlogPost, StaticPage } from '../data/types';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';

export default function Page({ article }: { article: BlogPost }) {
  return article ? (
    <>
      <NextSeo
        title={article.fields.Title}
        description={article.body.plaintext}
        openGraph={{
          title: article.fields.Title,
          description: article.body.plaintext
        }}
      />

      <section>
        <article className='space-y-2'>
          <h1 className='text-4xl font-bold'>{article.fields.Title}</h1>
          <p className='text-2xl text-gray-300 font-bold'>{article.fields.Summary}</p>
          <div className='prose text-gray-300' dangerouslySetInnerHTML={{ __html: article.body.html }} />
        </article>
      </section>
    </>
  ) : null
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = (await getStaticPageLinks()).filter(page => typeof page.fields.Slug === 'string')
  return {
    paths: links.map(page => ({
      params: {
        slug: page.fields.Slug!.split('/')
      }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<
  { article: StaticPage }, { slug: string[] }
> = async (context) => {
  if (!context?.params?.slug) throw new Error()

  return {
    props: {
      article: await getSingleStaticPage(context.params.slug.join('/'))
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}