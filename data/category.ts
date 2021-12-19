import { Category } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { categorySchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByCategoryId } from './solidarityAction';
import { parseMarkdown } from './markdown';

export const formatCategory = (category: Category) => {
  category.fields.Name.trim()

  category.summary = parseMarkdown(category.fields.Summary || '')

  try {
    // Remove any keys not expected by the parser
    category = categorySchema.parse(category)
  } catch(e) {
    console.error(JSON.stringify(category), e)
  }
  return category
}

const fields: Array<keyof Category['fields']> = ['Name', 'Summary', 'Emoji', 'Solidarity Actions']

export const categoryBase = () => airtableBase()<Category['fields']>(
  env.get('AIRTABLE_TABLE_NAME_CATEGORIES').default('Categories').asString()
)

export async function getCategories (selectArgs: QueryParams<Category['fields']> = {}): Promise<Array<Category>> {
  return new Promise((resolve, reject) => {
    const categories: Category[] = []

    function finish () {
      try {
        resolve(
          categories.filter(a =>
            categorySchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    }

    categoryBase().select({
      sort: [
        { field: "Name", direction: "asc", },
      ],
      fields: fields,
      maxRecords: 1000,
      // view: env.get('AIRTABLE_TABLE_VIEW_CATEGORIES').default('Grid view').asString(),
      filterByFormula: 'COUNTA({Solidarity Actions}) > 0',
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          categories.push(formatCategory(record._rawJson))
        });
        fetchNextPage();
      } catch(e) {
        finish()
      }
    }, function done(err) {
      if (err) { reject(err); return; }
      finish()
    });
  })
}

export async function getCategoryBy (selectArgs: QueryParams<Category['fields']> = {}, description?: string) {
  return new Promise<Category>((resolve, reject) => {
    categoryBase().select({
      // sort: [
      //   { field: "Name", direction: "asc", },
      // ],
      fields: fields,
      maxRecords: 1,
      // view: env.get('AIRTABLE_TABLE_VIEW_CATEGORIES').default('Grid view').asString(),
      ...selectArgs
    }).firstPage(function page(error, records) {
      try {
        if (error) console.error(error)
        if (error || !records?.length) {
          return reject(`No categories was found for filter ${JSON.stringify(selectArgs)}`)
        }
        const category = records?.[0]._rawJson
        resolve(formatCategory(category))
      } catch(e) {
        reject(e)
      }
    })
  })
}

export async function getCategoryByName (name: string) {
  return getCategoryBy({
    filterByFormula: `{Name}="${name}"`
  })
}

export type CategoryData = {
  category: Category
}

export const getCategoryDataByCode = async (name: string): Promise<CategoryData> => {
  const category = await getCategoryByName(name)
  if (!category) {
    throw new Error("No such category was found for this category code.")
  }

  const solidarityActions = await getLiveSolidarityActionsByCategoryId(category.id)

  return {
    category: {
      ...category,
      solidarityActions
    }
  }
}