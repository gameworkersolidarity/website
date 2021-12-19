
import { getServerSideSitemap } from 'next-sitemap'
import { GetServerSideProps } from 'next'
import { actionUrl, getLiveSolidarityActions } from '../../data/solidarityAction'
import { projectStrings } from '../../data/site'
import { getOrganisingGroups } from '../../data/organisingGroup'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const groups = await getOrganisingGroups()
  const actions = await getLiveSolidarityActions()

  const fields = [
    ...groups.map(action => (
      {
        loc: `${projectStrings.baseUrl}/group/${action.slug}`,
        lastmod: new Date(action.fields.LastModified).toISOString(),
      }
    )),
    ...actions.map(action => (
    {
      loc: `${projectStrings.baseUrl}${actionUrl(action)}`,
      lastmod: new Date(action.fields.LastModified).toISOString(),
    }
    ))
  ]

  return getServerSideSitemap(ctx, fields)
}

export default function Sitemap () {}