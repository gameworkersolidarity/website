import { z } from "zod"
import { airtableCDNMapSchema } from "./schema"
import { BaseRecord } from "./types"

export function generateCDNMap (airtableRow: BaseRecord & { fields: { cdn_urls?: string } }) {
  if (!airtableRow.fields.cdn_urls) return []
  try {
    // Parse and verify the JSON we store in the Airtable
    const cdnMap = JSON.parse(airtableRow.fields.cdn_urls)
    const validation = z.array(airtableCDNMapSchema).safeParse(cdnMap)
    if (validation.success) {
      return validation.data
    } else {
      console.error(validation.error)
    }
  } catch (e) {
    console.error(e)
  }
  return []
}