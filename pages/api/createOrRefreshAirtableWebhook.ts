import type {
  NextApiRequest,
  NextApiResponse
} from 'next'
import {
  corsGET,
  runMiddleware
} from '../../utils/cors';
import {
  getCountryDataByCode,
  CountryData
} from '../../data/country';
import env from 'env-var';
import isEqual from 'lodash.isequal';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsGET)

  // List Airtable webhooks
  // curl "https://api.airtable.com/v0/bases/{baseID}/webhooks" -H "Authorization: Bearer YOUR_TOKEN"
  const baseID = env.get('AIRTABLE_BASE_ID').default('appeAmlnDhmq6QSDi').required().asString()
  const tableID = env.get('AIRTABLE_CDN_TABLE_ID').default('tblimUv6XyFqqxG2p').required().asString()
  const apiKey = env.get('AIRTABLE_API_KEY').required().asString()
  const baseURL = env.get('BASE_URL').required().asString()

  // Get a ping whenever solidarity actions are updated
  // Docs: https://airtable.com/developers/web/api/model/webhooks-specification
  const webhookSpecification = {
    "options": {
      "filters": {
        "fromSources": [
          "client",
          "formSubmission"
        ],
        "dataTypes": [
          "tableData"
        ],
        "recordChangeScope": tableID
      }
    }
  }

  const webhooks = await fetch(`https://api.airtable.com/v0/bases/${baseID}/webhooks`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => res.json())

  // Find a webhook that exists with the same specification as `webhookSpecification`
  const webhook = webhooks.webhooks?.find(webhook => isEqual(webhook.specification, webhookSpecification))

  if (webhook) {
    // Refresh it
    // curl -X POST "https://api.airtable.com/v0/bases/{baseID}/webhooks/{webhookId}/refresh" \ -H "Authorization: Bearer YOUR_TOKEN"
    const refreshRes = await fetch(`https://api.airtable.com/v0/bases/${baseID}/webhooks/${webhook.id}/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }).then(res => res.json())

    // Clean up other webhooks
    await Promise.all(webhooks.webhooks?.filter(otherWebhook => otherWebhook.id !== webhook.id).map(otherWebhook =>
      fetch(`https://api.airtable.com/v0/bases/${baseID}/webhooks/${otherWebhook.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })
    ))

    // Return status 200 with webhook ID
    return res.status(200).json({
      refreshRes
    })
  } else {
    // If webhook doesn't exist, create it
    const createRes = await fetch(`https://api.airtable.com/v0/bases/${baseID}/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "notificationUrl": (new URL('/api/syncToCDN', baseURL)).href,
        "specification": webhookSpecification
      })
    }).then(res => res.json())

    // Return status 200 with webhook ID
    return res.status(200).json({
      createRes
    })
  }
}