import Airtable from 'airtable'
import env from 'env-var'

export const airtableBase = new Airtable({
  apiKey: env.get('AIRTABLE_API_KEY')
    // TODO: This is wrong, but it breaks without putting something in
    .default('appeAmlnDhmq6QSDi')
    .required()
    .asString()
}).base(
  env.get('AIRTABLE_BASE_ID')
    .default('appeAmlnDhmq6QSDi')
    .required()
    .asString()
);