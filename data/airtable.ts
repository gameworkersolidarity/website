import Airtable from 'airtable'
import env from 'env-var'

export const airtableBase = new Airtable({
  apiKey: env.get('AIRTABLE_API_KEY')
    .default('appeAmlnDhmq6QSDi')
    .required()
    .asString()
}).base(
  env.get('AIRTABLE_BASE_ID')
    .required()
    .asString()
);