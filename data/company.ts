import { Company } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { companySchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByCompanyId } from './solidarityAction';
import { parseMarkdown } from './markdown';

export const formatCompany = (company: Company) => {
  company.fields.Name.trim()

  company.summary = parseMarkdown(company.fields.Summary || '')

  try {
    // Remove any keys not expected by the parser
    company = companySchema.parse(company)
  } catch(e) {
    console.error(JSON.stringify(company), e)
  }
  return company
}

const fields: Array<keyof Company['fields']> = ['Name', 'Summary', 'Solidarity Actions']

export const companyBase = () => airtableBase()<Company['fields']>(
  env.get('AIRTABLE_TABLE_NAME_COMPANIES').default('Companies').asString()
)

export async function getCompanies (selectArgs: QueryParams<Company['fields']> = {}): Promise<Array<Company>> {
  return new Promise((resolve, reject) => {
    const companies: Company[] = []

    function finish () {
      try {
        resolve(
          companies.filter(a =>
            companySchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    }

    companyBase().select({
      sort: [
        { field: "Name", direction: "asc", },
      ],
      fields: fields,
      maxRecords: 1000,
      // view: env.get('AIRTABLE_TABLE_VIEW_COMPANIES').default('Grid view').asString(),
      filterByFormula: 'COUNTA({Solidarity Actions}) > 0',
      ...selectArgs
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          companies.push(formatCompany(record._rawJson))
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

export async function getCompanyBy (selectArgs: QueryParams<Company['fields']> = {}, description?: string) {
  return new Promise<Company>((resolve, reject) => {
    companyBase().select({
      // sort: [
      //   { field: "Name", direction: "asc", },
      // ],
      fields: fields,
      maxRecords: 1,
      // view: env.get('AIRTABLE_TABLE_VIEW_COMPANIES').default('Grid view').asString(),
      ...selectArgs
    }).firstPage(function page(error, records) {
      try {
        if (error) console.error(error)
        if (error || !records?.length) {
          return reject(`No companies was found for filter ${JSON.stringify(selectArgs)}`)
        }
        const company = records?.[0]._rawJson
        resolve(formatCompany(company))
      } catch(e) {
        reject(e)
      }
    })
  })
}

export async function getCompanyByName (name: string) {
  return getCompanyBy({
    filterByFormula: `{Name}="${name}"`
  })
}

export type CompanyData = {
  company: Company
}

export const getCompanyDataByCode = async (name: string): Promise<CompanyData> => {
  const company = await getCompanyByName(name)
  if (!company) {
    throw new Error("No such company was found for this company code.")
  }

  const solidarityActions = await getLiveSolidarityActionsByCompanyId(company.id)

  return {
    company: {
      ...company,
      solidarityActions
    }
  }
}