import { SolidarityActionsList } from '../components/SolidarityActions'
import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction } from '../data/types';
import { format } from 'date-fns';

export default function Page({ solidarityActions }: { solidarityActions: SolidarityAction[] }) {
  const earliestYear = format(new Date(solidarityActions[solidarityActions.length - 1].fields.Date), 'yyyy')

  return (
    <>
      <h1 className='text-2xl font-bold'>
        <div>Timeline of solidarity actions</div>
        <div className='text-gray-400'>
          {earliestYear} &rarr; present
        </div>
      </h1>

      <div className='py-4' />

      <section>
        <SolidarityActionsList />
      </section>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      solidarityActions: await getSolidarityActions(),
    },
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}