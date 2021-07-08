import { getSingleOrganisingGroup, getOrganisingGroups } from '../../data/organisingGroup';
import { OrganisingGroup } from '../../data/types';
import Link from 'next/link';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';
import ErrorPage from '../404'
import PageLayout from '../../components/PageLayout';
import { OrganisingGroupCard } from '../../components/OrganisingGroup';

type PageProps = { group: OrganisingGroup | null, errorMessage?: string }
type PageParams = { groupId: string }

export default function Page({ group, errorMessage }: PageProps) {
  if (!group) return <ErrorPage message={errorMessage} />

  return (
    <PageLayout>
      <div className='bg-gwOrangeLight' style={{ minHeight: '66vh' }}>
        <div className='max-w-4xl mx-auto py-5 px-4'>
          <OrganisingGroupCard
            data={group}
          />
        </div>
      </div>
    </PageLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = await getOrganisingGroups()
  return {
    paths: links.map(page => ({
      params: {
        groupId: page.id
      }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<
  PageProps, PageParams
> = async (context) => {
  if (!context?.params?.groupId) throw new Error()

  let group
  let errorMessage = ''
  try {
    group = await getSingleOrganisingGroup(context.params.groupId) || null
  } catch (e) {
    console.error("No group was found", e)
    errorMessage = e.toString()
    group = null
  }

  return {
    props: {
      group,
      errorMessage
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}