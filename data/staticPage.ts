import { StaticPage } from './types';
import env from 'env-var';
import { airtableBase } from './airtable';
import { parseMarkdown } from './markdown';
import { staticPageSchema } from './schema';

export const formatStaticPage = (staticPage: StaticPage): StaticPage => {
  staticPage.body = parseMarkdown(staticPage.fields.Body || '')

  try {
    // Remove any keys not expected by the parser
    staticPage = staticPageSchema.parse(staticPage)
  } catch(e) {
    console.error(JSON.stringify(staticPage), e)
  }
  return staticPage
}

export const staticPageBase = () => airtableBase()<StaticPage['fields']>(
  env.get('AIRTABLE_TABLE_NAME_STATIC_PAGES').default('Static Pages').asString()
)

export async function getStaticPageLinks (): Promise<Array<StaticPage>> {
  return new Promise((resolve, reject) => {
    const staticPages: StaticPage[] = []

    staticPageBase().select({
      filterByFormula: 'AND(Public, Title!="")',
      fields: ['Title', 'Summary', 'Slug', 'Link', 'Body', 'Public'],
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
      fields: ['Title', 'Summary', 'Slug', 'Link', 'Body', 'Public'],
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_STATIC_PAGES').default('All Pages').asString(),
    }).firstPage((error, records) => {
      if (error || !records) {
        return reject(error || `No record found for slug ${slug}`)
      }
      return resolve(formatStaticPage(records[0]._rawJson))
    })
  })
}