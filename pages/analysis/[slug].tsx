import { getBlogPosts } from '../../data/blogPost';
import { BlogPost } from '../../data/types';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';
import PageLayout from '../../components/PageLayout';
import ErrorPage from '../404'
import Image from 'next/image';
import { DateTime } from '../../components/Date';
import { BlogPostThumbnail } from '../../components/BlogPost';

type PageProps = { article: BlogPost | null, moreArticles: BlogPost[], errorMessage?: string }
type PageParams = { slug: string }

export default function Page({ moreArticles, article, errorMessage }: PageProps) {
  if (!article) return <ErrorPage message={errorMessage} />

  return (
    <PageLayout>
      <NextSeo
        title={article.fields.Title}
        description={article.fields.Summary}
        openGraph={!!article.fields.Image?.[0] ? ({
          title: article.fields.Title,
          description: article.fields.Summary,
          images: [
            {
              url: article.fields.Image[0].url,
              alt: 'Game Worker Solidarity',
            }
          ]
        }) : ({
          title: article.fields.Title,
          description: article.fields.Summary,
        })}
      />

      <article className='pt-6 pb-7 content-wrapper max-w-4xl mx-auto'>
        <header className='space-y-4'>
          <div className='space-x-4 text-sm font-semibold text-left'>
            <DateTime date={article.fields.Date} />
          </div>
          {!!article.fields.Image?.[0] ? (
            <>
              <div className='flex flex-col justify-center space-y-4'>
                <h1 className='font-identity text-5xl md:text-6xl'>{article.fields.Title}</h1>
                {article.fields.ByLine && <p className='text-xl font-light'>{article.fields.ByLine}</p>}
              </div>
              <div className='rounded-lg shadow-gwPink overflow-hidden'>
                <Image
                  layout='responsive'
                  src={article.fields.Image[0].thumbnails.full?.url || article.fields.Image[0].url}
                  width={article.fields.Image[0].thumbnails.large.width}
                  height={article.fields.Image[0].thumbnails.large.height}
                />
              </div>
              <div className='pb-5' />
            </>
          ) : (
            <>
              <div className='flex flex-col justify-center space-y-4 pb-4'>
                <h1 className='font-identity text-5xl md:text-6xl mb-4'>{article.fields.Title}</h1>
                {article.fields.ByLine && <p className='text-xl font-light'>{article.fields.ByLine}</p>}
              </div>
            </>
          )}
        </header>
        <div className='space-y-4'>
          <div className='prose text-lg' dangerouslySetInnerHTML={{ __html: article.body.html }} />
        </div>
      </article>

      {moreArticles.length != 0 ?
        <aside className='content-wrapper mx-auto space-y-4 border-t border-gwPink pt-5 pb-5'>
          <h2 className='font-identity text-4xl'>Read more</h2>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {moreArticles.slice(0, 3).map(b =>
              <BlogPostThumbnail key={b.id} blog={b} />
            )}
          </div>
        </aside>
        : ""}
    </PageLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = (await getBlogPosts()).filter(page => typeof page.fields.Slug === 'string')
  return {
    paths: links.map(page => ({
      params: {
        slug: page.fields.Slug!
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
  let moreArticles
  let errorMessage = ''
  try {
    moreArticles = await getBlogPosts()
    article = moreArticles.find(a => a.fields.Slug === context.params!.slug)
  } catch (e) {
    console.error("No article was found", e)
    article = null
    errorMessage = e.toString()
  }

  return {
    props: {
      article,
      moreArticles: moreArticles.filter(a => a.id !== article.id),
      errorMessage
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}