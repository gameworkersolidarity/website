import Head from 'next/head'
import { getSingleSolidarityAction, getSolidarityActions } from '../../data/solidarityAction';
import { SolidarityAction } from '../../data/types';
import { SolidarityActionItem, SolidarityActionCard } from '../../components/SolidarityActions';
import Link from 'next/link';

export default function Page({ action }: { action: SolidarityAction }) {
  return action ? (
    <>
      <div className='max-w-xl'>
        <SolidarityActionCard data={action} />
      </div>
      <div className='my-4' />
      <Link href='/'>
        <div className='link text-gray-400 text-sm'>
          &larr; Timeline
        </div>
      </Link>
    </>
  ) : null
}

export async function getStaticPaths() {
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

export async function getStaticProps(context) {
  return {
    props: {
      action: await getSingleSolidarityAction(context.params.actionId)
    },
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}