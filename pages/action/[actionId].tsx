import Head from 'next/head'
import { getSingleSolidarityAction, getSolidarityActions } from '../../data/solidarityAction';
import { SolidarityAction } from '../../data/types';
import { SolidarityActionCard } from '../../components/SolidarityActions';
import Link from 'next/link';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';

export default function Page({ action }: { action: SolidarityAction }) {
  return action ? (
    <>
      <div className='max-w-xl'>
        <SolidarityActionCard
          data={action}
          withContext
          contextProps={{
            listProps: {
              withDialog: true
            }
          }}
        />
      </div>
      <div className='my-4' />
      <Link href='/'>
        <div className='link  text-sm'>
          &larr; All actions
        </div>
      </Link>
    </>
  ) : null
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
  { action: SolidarityAction }, { actionId: string }
> = async (context) => {
  if (!context?.params?.actionId) throw new Error()

  const action = await getSingleSolidarityAction(context.params.actionId)

  return {
    props: {
      action
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}