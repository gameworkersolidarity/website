import { SolidarityActionsList } from '../../components/SolidarityActions';
import { NextSeo } from 'next-seo';
import { getCountries, getCountryDataBySlug, CountryData } from '../../data/country';
import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { projectStrings } from '../../data/site';
import { CumulativeMovementChart } from '../../components/ActionChart';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';

export default function Page({ country }: { country: CountryData }) {
  if (!country?.country?.fields) {
    return <div />
  }

  return (
    <>
      <NextSeo
        title={country.country.fields.Name}
        openGraph={{
          title: `Game worker solidarity in ${country.country.fields.Name}`,
        }}
      />

      <h1 className='text-gray-200 font-bold text-4xl max-w-xl'>
        {country?.country?.fields['Name'].trim()} <Emoji symbol={country.country.emoji.emoji} label='flag' /> game worker solidarity
      </h1>

      <div className='my-4'>
        {country.country.fields.Notes &&<div className='prose' dangerouslySetInnerHTML={{ __html: country.country.notes.html }} />}
      </div>

      {country?.country?.solidarityActions?.length > 2
        && <CumulativeMovementChart data={country?.country?.solidarityActions} />
      }


      <div className='mb-5 mt-2'>
        <p>Can you contribute more info about game worker organising in {country.country.fields.Name}?</p>
        <div className='space-x-2'>
          <Link href='/submit'>
            <span className='button'>
              Submit a solidarity action
            </span>
          </Link>
          <a className='button' href={`mailto:${projectStrings.email}`}>
            Contact us
          </a>
        </div>
      </div>

      <SolidarityActionsList
        data={country?.country?.solidarityActions}
        withDialog
      />

      <Link href='/'>
        <div className='link text-gray-300 text-sm mt-4'>
          &larr; All actions
        </div>
      </Link>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
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

export const getStaticProps: GetStaticProps<
  { country: CountryData }, { slug: string }
> = async (context) => {
  const country = await getCountryDataBySlug(context.params.slug)

  return {
    props: {
      country
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}