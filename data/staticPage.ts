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

const fields: Array<keyof StaticPage['fields']> = ['Title', 'Summary', 'Slug', 'Body', 'Public']

export async function getStaticPages (): Promise<Array<StaticPage>> {
  return new Promise((resolve, reject) => {
    const staticPages: StaticPage[] = []

    staticPageBase().select({
      filterByFormula: 'AND(Public, Title!="")',
      fields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_STATIC_PAGES').default('All Pages').asString(),
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          staticPages.push(record._rawJson)
        });
        fetchNextPage();
      } catch(e) {
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(staticPages)
      } catch (e) {
        reject(e)
      }
    });
  })
}

export async function getSingleStaticPage (slug: string) {
  return new Promise<StaticPage | null>((resolve, reject) => {
    staticPageBase().select({
      filterByFormula: `AND(Public, Slug="${slug}")`,
      fields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_STATIC_PAGES').default('All Pages').asString(),
    }).firstPage((error, records) => {
      try {
        if (error) console.error(error)
        if (error || !records?.length) {
          return reject(`There's no page here`)
        }
        return resolve(formatStaticPage(records[0]._rawJson))
      } catch (e) {
        reject(e)
      }
    })
  })
}