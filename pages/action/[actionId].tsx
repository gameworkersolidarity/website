import { getSingleSolidarityAction, getSolidarityActions } from '../../data/solidarityAction';
import { SolidarityAction } from '../../data/types';
import { SolidarityActionCard } from '../../components/SolidarityActions';
import Link from 'next/link';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';
import ErrorPage from '../404'
import PageLayout from '../../components/PageLayout';

type PageProps = { action: SolidarityAction | null, errorMessage?: string }
type PageParams = { actionId: string }

export default function Page({ action, errorMessage }: PageProps) {
  if (!action) return <ErrorPage message={errorMessage} />

  return (
    <PageLayout>
      <div className='bg-gwOrangeLight'>
        <div className='max-w-4xl mx-auto py-5 px-4'>
          <SolidarityActionCard
            data={action}
            withContext
          />
          <div className='my-4' />
          <Link href='/'>
            <div className='link  text-sm'>
              &larr; All actions
            </div>
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = await getSolidarityActions()
  return {
    paths: links.map(page => ({
      params: {
        actionId: page.id
      }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<
  PageProps, PageParams
> = async (context) => {
  if (!context?.params?.actionId) throw new Error()

  let action
  let errorMessage = ''
  try {
    action = await getSingleSolidarityAction(context.params.actionId) || null
  } catch (e) {
    console.error("No action was found", e)
    errorMessage = e.toString()
    action = null
  }

  return {
    props: {
      action,
      errorMessage
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}