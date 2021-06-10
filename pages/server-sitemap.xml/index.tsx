
import { getServerSideSitemap } from 'next-sitemap'
import { GetServerSideProps } from 'next'
import { getSolidarityActions } from '../../data/solidarityAction'
import { projectStrings } from '../../data/site'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const actions = await getSolidarityActions()

  const fields = actions.map(action => (
    {
      loc: `${projectStrings.baseUrl}/action/${action.id}`,
      lastmod: new Date(action.fields.LastModified).toISOString(),
    }
  ))

  return getServerSideSitemap(ctx, fields)
}

export default () => {}