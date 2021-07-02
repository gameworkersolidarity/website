import { getSingleStaticPage, getStaticPages } from '../data/staticPage';
import { BlogPost, StaticPage } from '../data/types';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import ErrorPage from './404'

type PageProps = { article: StaticPage | null, errorMessage?: string }
type PageParams = { slug: string[] }

export default function Page({ article, errorMessage }: PageProps) {
  if (!article) return <ErrorPage message={errorMessage} />

  return (
    <PageLayout>
      <NextSeo
        title={article.fields.Title}
        description={article.body.plaintext}
        openGraph={{
          title: article.fields.Title,
          description: article.body.plaintext
        }}
      />

      <section className='content-wrapper py-5'>
        <article className='space-y-2'>
          <h1 className='font-identity text-4xl'>{article.fields.Title}</h1>
          <p className='text-2xl font-semibold'>{article.fields.Summary}</p>
          <div className='prose ' dangerouslySetInnerHTML={{ __html: article.body.html }} />
        </article>
      </section>
    </PageLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = (await getStaticPages()).filter(page => typeof page.fields.Slug === 'string')
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
  PageProps, PageParams
> = async (context) => {
  if (!context?.params?.slug) throw new Error()

  let article
  let errorMessage = ''
  try {
    article = await getSingleStaticPage(context.params.slug.join('/')) || null
  } catch (e) {
    console.error("No article was found", e)
    article = null
    errorMessage = e.toString()
  }

  return {
    props: {
      article,
      errorMessage
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}