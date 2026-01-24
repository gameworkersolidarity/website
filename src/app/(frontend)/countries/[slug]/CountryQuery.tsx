'use client'

import { payloadClient } from '@/utils/payload'
import { useAsync } from '@/utils/query'

export function CountryQuery({ countryId }: { countryId: string }) {
  const request = useAsync(`/api/countries/${countryId}`, () =>
    payloadClient.find({ collection: 'countries', where: { id: { equals: countryId } } }),
  )

  return (
    <div>
      <pre>{JSON.stringify(request.data || {}, null, 2)}</pre>
    </div>
  )
}
