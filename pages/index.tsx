import { SolidarityActionsFullList } from '../components/SolidarityActions';
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction } from '../data/types';
import { format } from 'date-fns';
import { SolidarityActionsData } from './api/solidarityActions';

export default function Page({ solidarityActions }: { solidarityActions: SolidarityAction[] }) {
  const latestYear = parseInt(format(new Date(solidarityActions[solidarityActions.length - 1].fields.Date), 'yyyy'))
  const earliestYear = parseInt(format(new Date(solidarityActions[0].fields.Date), 'yyyy'))

  return (
    <>
      <h1 className='text-2xl font-bold'>
        <div>Timeline of solidarity actions</div>
        <div className='text-gray-400'>
          {earliestYear} &rarr; {latestYear}
        </div>
      </h1>

      <div className='py-4' />

      <section>
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

export async function getStaticProps() {
  const data = await getSolidarityActions()
  return {
    props: {
      solidarityActions: data
    } as SolidarityActionsData,
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}