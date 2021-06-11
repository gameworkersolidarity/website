import { StaticPage } from './types';
import { formatBlogPost } from './blogPost';
import env from 'env-var';
import { airtableBase } from './airtable';

export const staticPageBase = () => airtableBase()<StaticPage['fields']>(
  env.get('AIRTABLE_TABLE_NAME_STATIC_PAGES').default('Static Pages').asString()
)

export async function getStaticPageLinks (): Promise<Array<StaticPage>> {
  return new Promise((resolve, reject) => {
    const staticPages: StaticPage[] = []

    staticPageBase().select({
      filterByFormula: 'AND(Public, Title!="")',
      fields: ["Title", "Slug", "Link"],
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_STATIC_PAGES').default('Main Menu Link Order').asString(),
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        staticPages.push(record._rawJson)
      });
      fetchNextPage();
    }, function done(err) {
      if (err) { reject(err); return; }
      resolve(staticPages)
    });
  })
}

export async function getSingleStaticPage (slug: string) {
  return new Promise<StaticPage>((resolve, reject) => {
    staticPageBase().select({
      filterByFormula: `AND(Public, Slug="${slug}")`,
      fields: ['Title', 'Summary', 'Slug', 'Link', 'Body'],
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_STATIC_PAGES').default('All Pages').asString(),
    }).firstPage((error, records) => {
      if (error) {
        return reject(error)
      }
      return resolve(formatBlogPost(records[0]._rawJson))
    })
  })
}