import { SolidarityActionsFullList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction } from '../data/types';
import { format } from 'date-fns';
import { SolidarityActionsData } from './api/solidarityActions';
import Link from 'next/link';
import { projectStrings } from '../data/site';
import { Map } from '../components/Map';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';

export default function Page({ solidarityActions }: { solidarityActions: SolidarityAction[] }) {
  if (!solidarityActions.length) {
    return <div>Loading...</div>
  }

  const latestYear = parseInt(format(new Date(solidarityActions[solidarityActions.length - 1].fields.Date), 'yyyy'))
  const earliestYear = parseInt(format(new Date(solidarityActions[0].fields.Date), 'yyyy'))

  return (
    <PageLayout>
      <section className='my-4'>
        <Map data={solidarityActions} />
      </section>

      <div className='content-wrapper'>
        <section className='bg-gwPink p-4 md:p-5 rounded-md'>
          <div className='max-w-3xl mx-auto'>
            <h1 className='text-xl font-bold text-center'>
              <div>Documenting years of solidarity</div>
              <div className=' font-normal'>
                {earliestYear} &rarr; forever
              </div>
            </h1>

            <p className='my-4'>The Game Worker Solidarity Project is mapping and documenting collective movements by game workers striving to improve their working conditions.</p>
            <p className='my-4'>We're collecting materials created by workers for these movements and aim to document the longer history of resistance in the industry which goes back to its formation.</p>
          </div>
        </section>
      </div>

      <section className='my-4 content-wrapper'>
        <SolidarityActionsFullList />
      </section>

      <div className='my-5 content-wrapper'>
        <p>Can you contribute more info about worker organising?</p>
        <div className='space-x-2'>
          <Link href='/submit'>
            <span className='button'>
              Submit a solidarity action
            </span>
          </Link>
          <a className='button' href={`mailto:${projectStrings.email}`}>
            Contact us
          </a>
        </div>
      </div>
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps<
  SolidarityActionsData,
  {}
> = async (context) => {
  const data = await getSolidarityActions()
  return {
    props: {
      solidarityActions: data
    } as SolidarityActionsData,
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}