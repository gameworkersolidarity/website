import { MenuItem } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { menuItemSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';

export const formatMenuItem = (blog: MenuItem): MenuItem => {
  try {
    // Remove any keys not expected by the parser
    blog = menuItemSchema.parse(blog)
  } catch(e) {
    console.error(JSON.stringify(blog), e)
  }
  return blog
}

const menuItemFields = ['label', 'placement', 'url'] as Array<keyof MenuItem['fields']>

export const menuItemBase = () => airtableBase()<MenuItem['fields']>(
  env.get('AIRTABLE_TABLE_NAME_MENUS').default('Menus').asString()
)

export async function getMenuItems (selectArgs: QueryParams<MenuItem['fields']> = {}) {
  return new Promise<MenuItem[]>((resolve, reject) => {
    const menuItems: MenuItem[] = []

    menuItemBase().select({
      fields: menuItemFields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_MENU_ITEMS').default('All menu items').asString(),
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          menuItems.push(formatMenuItem(record._rawJson))
        });
        fetchNextPage();
      } catch (e) {
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(
          menuItems.filter(a =>
            menuItemSchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    });
  })
}

export async function getMenuItemsForSection (sectionName: MenuItem['fields']['placement'][0]) {
  const filterByFormula = `FIND("${sectionName}", ARRAYJOIN({placement})) > 0`
  return getMenuItems({ filterByFormula, view: sectionName })
}

export async function getSingleMenuItem (slug: string): Promise<MenuItem> {
  return new Promise((resolve, reject) => {
    menuItemBase().select({
      fields: menuItemFields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_MENU_ITEMS').default('All menu items').asString(),
    }).firstPage((error, records) => {
      try {
        if (error || !records?.length) {
          return reject(error || `No record found for slug ${slug}`)
        }
        return resolve(formatMenuItem(records[0]._rawJson))
      } catch(e) {
        reject(e)
      }
    })
  })
}