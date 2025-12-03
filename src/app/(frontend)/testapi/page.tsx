'use client'

import { Button } from '@/components/ui/button'
import { payloadClient } from '@/utils/payload'
import { useState } from 'react'
import useSWR from 'swr'

export default function TestAPI() {
  const [config, setConfig] = useState(`{
    "collection": "events",
    "where": {
      "companies": {
        "equals": "692ed39bd3391f5d5c4f3447"
      },
      "id": {
        "not_equals": "692ed3f0d3391f5d5c4f471c"
      }
    },
    "select": {
      "name": true,
      "id": true,
      "date": true
    },
    "depth": 0,
    "sort": "date"
  }`)

  const request = useSWR(config, async () => {
    try {
      const parsed = JSON.parse(config)
      const res = await payloadClient.find(parsed as any)
      return res
    } catch (error) {
      console.error(error)
      return null
    }
  })

  return (
    <div className="flex flex-col gap-4 mx-auto max-w-4xl py-6 text-sm">
      <h1 className="text-2xl font-bold">Test API</h1>
      <div className="grid grid-cols-2 gap-4">
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          rows={25}
          className="w-full border p-2"
        />
        <div className="flex flex-col gap-2">
          <Button disabled={request.isLoading} onClick={() => request.mutate()}>
            Reload
          </Button>
          <pre>{JSON.stringify(request || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
