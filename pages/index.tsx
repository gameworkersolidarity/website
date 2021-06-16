import { SolidarityActionsFullList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction } from '../data/types';
import { format } from 'date-fns';
import { SolidarityActionsData } from './api/solidarityActions';
import Link from 'next/link';
import { projectStrings } from '../data/site';
import { CumulativeMovementChart } from '../components/ActionChart';
import { Map } from '../components/Map';
import env from 'env-var';
import { GetStaticProps } from 'next';

export default function Page({ solidarityActions }: { solidarityActions: SolidarityAction[] }) {
  if (!solidarityActions.length) {
    return <div>Loading...</div>
  }

  const latestYear = parseInt(format(new Date(solidarityActions[solidarityActions.length - 1].fields.Date), 'yyyy'))
  const earliestYear = parseInt(format(new Date(solidarityActions[0].fields.Date), 'yyyy'))

  return (
    <>
      <h1 className='text-4xl font-bold'>
        <div>Documenting years of solidarity</div>
        <div className='text-gray-500 font-normal'>
          {earliestYear} &rarr; {latestYear}
        </div>
      </h1>

      <p className='my-4 max-w-xl text-gray-200'>The Game Worker Solidarity Project is mapping and documenting collective movements by game workers striving to improve their working conditions.</p>
      <p className='my-4 max-w-xl text-gray-200'>We're collecting materials created by workers for these movements and aim to document the longer history of resistance in the industry which goes back to its formation.</p>

      <div className='w-7 border border-gray-800 my-5' />

      <section className='my-4 mb-5'>
        <Map data={solidarityActions} />
      </section>

      <section className='my-4'>
        <SolidarityActionsFullList />
      </section>

      <div className='my-5'>
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
    </>
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