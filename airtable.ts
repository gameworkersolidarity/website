import Airtable from 'airtable/lib/airtable.js'
import env from 'env-var'
import 'dotenv/config'

export const airtableBase = () =>
  new Airtable({
    apiKey: env.get('AIRTABLE_API_KEY').required().asString(),
  }).base(env.get('AIRTABLE_BASE_ID').default('appeAmlnDhmq6QSDi').required().asString())
