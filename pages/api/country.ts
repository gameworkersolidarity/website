import type { NextApiRequest, NextApiResponse } from 'next'
import { SolidarityAction, Country } from '../../data/types';
import { getSolidarityActionsByCountry } from '../../data/solidarityAction';
import { corsGET, runMiddleware } from '../../utils/cors';
import { getCountry } from '../../data/country';

export type CountryData = {
  country: Country
}

export const getCountryData = async (iso2: string): Promise<CountryData> => {
  if (!iso2 || !/[A-Za-z]{2}/.test(iso2)) {
    throw new Error("A two-digit ISO3166a2 country code must be provided.")
  }
  const country = await getCountry(iso2)
  if (!country) {
    throw new Error("No such country found for this country code.")
  }

  const solidarityActions = await getSolidarityActionsByCountry(iso2)

  return {
    country: {
      ...country,
      solidarityActions
    }
  }
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<CountryData>) {
  await runMiddleware(req, res, corsGET)
  let { iso2 } = req.query
  try {
    if (!iso2) {
      throw new Error("You must provide the iso2 query parameter")
    }
    const data = await getCountryData(String(iso2))
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.toString() } as any)
  }
}