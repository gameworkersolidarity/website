
import { getServerSideSitemap } from 'next-sitemap'
import { GetServerSideProps } from 'next'
import { getSolidarityActions } from '../../data/solidarityAction'
import { projectStrings } from '../../data/site'
import { getOrganisingGroups } from '../../data/organisingGroup'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const groups = await getOrganisingGroups()
  const actions = await getSolidarityActions()

  const fields = [
    ...groups.map(action => (
      {
        loc: `${projectStrings.baseUrl}/group/${action.slug}`,
        lastmod: new Date(action.fields.LastModified).toISOString(),
      }
    )),
    ...actions.map(action => (
    {
      loc: `${projectStrings.baseUrl}/action/${action.slug}`,
      lastmod: new Date(action.fields.LastModified).toISOString(),
    }
    ))
  ]

  return getServerSideSitemap(ctx, fields)
}

export default () => {}