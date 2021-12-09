import { getSingleStaticPage } from '../data/staticPage';
import { StaticPage } from '../data/types';
import { NextSeo } from 'next-seo';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import ErrorPage from './404'
import { projectStrings } from '../data/site';
import { OpenUniversityLogo } from '../components/OpenUniversityLogo';

type PageProps = { article: StaticPage | null, errorMessage?: string }
type PageParams = { slug: string[] }

export default function Page({ article, errorMessage }: PageProps) {
  if (!article) return <ErrorPage message={errorMessage} />

  return (
    <PageLayout>
      <NextSeo
        title={article.fields.Title}
        description={article.fields.Summary}
        openGraph={{
          title: article.fields.Title,
          description: article.fields.Summary
        }}
      />

      <section className='content-wrapper py-5'>
        <article className='space-y-2'>
          <h1 className='font-identity text-4xl md:text-6xl pb-3'>{article.fields.Title}</h1>
          <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-6'>
            <section className='prose md:col-span-2'
              dangerouslySetInnerHTML={{ __html: article.body.html }}
            />
            <div className='grid lg:grid-cols-2 lg:col-span-2 gap-6'>
              <div className='space-y-5'>
                <section className='space-y-3'>
                  <h2 className='font-semibold text-lg'>Team</h2>
                  <p>Austin Kelmore, Game worker and union organizer, IWGB.&nbsp;<a href='https://twitter.com/AustinKelmore' className='link'>@AustinKelmore</a></p>
                  <p>Jamie Woodcock, Senior Lecturer, The Open University.&nbsp;<a href='https://twitter.com/jamie_woodcock' className='link'>@jamie_woodcock</a></p>
                  <p>Michelle Phan, Research Assistant, University of Toronto.&nbsp;<a href='https://twitter.com/phanny' className='link'>@phanny</a></p>
                  <p>Common Knowledge.&nbsp;<a href='https://twitter.com/commonknowledge' className='link'>@commonknowledge</a></p>
                  <p>Shauna Buckley, Designer. &nbsp;<a href='https://twitter.com/_ShaunaBuckley' className='link'>@_ShaunaBuckley</a></p>
                </section>
                <section className='space-y-3'>
                  <h2 className='font-semibold text-lg'>Contact</h2>
                  <p><a className='link' href={`mailto:${projectStrings.email}`}>
                    Email
                  </a></p>
                  <p><a className='link' href={`https://twitter.com/${projectStrings.twitterHandle}`}>
                    Twitter
                  </a></p>
                  <p><a className='link' href={projectStrings.github}>
                    GitHub
                  </a></p>
                </section>
              </div>
              <section className='space-y-3'>
                <h2 className='font-semibold text-lg'>Credits</h2>
                <p>This website was developed as part of the <em>Mapping labour organising in games industry: past, present, and future</em> project, funded by PVC-RES at The Open University</p>
                <a href='https://www.open.ac.uk/' className='block'><OpenUniversityLogo /></a>
              </section>
            </div>
          </div>
        </article>
      </section>
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps<
  PageProps, PageParams
> = async () => {
  let article
  let errorMessage = ''
  try {
    article = await getSingleStaticPage('about') || null
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