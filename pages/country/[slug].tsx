import { SolidarityActionsList } from '../../components/SolidarityActions';
import { NextSeo } from 'next-seo';
import { getCountries, getCountryDataBySlug, CountryData } from '../../data/country';
import Emoji from 'a11y-react-emoji';

export default function Page({ country }: { country: CountryData }) {
  if (!country?.country?.fields) {
    return <div />
  }

  return (
    <>
      <NextSeo
        title={`${country.country.fields.Name}`}
        description={`Solidarity actions by game workers in ${country.country.fields.Name}`}
        openGraph={{
          title: `${country.country.fields.Name}`,
          description: `Solidarity actions by game workers in ${country.country.fields.Name}`
        }}
      />

      <h1 className='text-gray-200 font-bold text-4xl max-w-xl'>
        {country?.country?.fields['Name'].trim()} <Emoji symbol={country.country.emoji.emoji} label='flag' /> game worker solidarity
      </h1>

      {country.country.fields.Notes &&
        <div className='py-4'>
          <div className='prose' dangerouslySetInnerHTML={{ __html: country.country.fields.Notes}} />
        </div>
      }

      <SolidarityActionsList
        data={country?.country?.solidarityActions}
        withDialog
      />
    </>
  )
}

export async function getStaticPaths() {
  const links = await getCountries()
  return {
    paths: links.map(country => ({
      params: {
        slug: country.fields.Slug
      }
    })),
    fallback: true
  }
}

export async function getStaticProps(context) {
  const country = await getCountryDataBySlug(context.params.slug)
  return {
    props: {
      country
    },
    revalidate: process.env.NODE_ENV === 'production' ? 60 : 5, // In seconds
  }
}