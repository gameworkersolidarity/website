import { SolidarityActionsList } from '../../components/SolidarityActions';
import { NextSeo } from 'next-seo';
import { getCountries, getCountryDataBySlug, CountryData } from '../../data/country';
import Emoji from 'a11y-react-emoji';
import Link from 'next/link';
import { projectStrings } from '../../data/site';
import { CumulativeMovementChart } from '../../components/ActionChart';
import env from 'env-var';
import { GetStaticPaths, GetStaticProps } from 'next';
import ErrorPage from '../404'
import PageLayout from '../../components/PageLayout';
import { useCanonicalURL } from '../../data/seo';
import { useRouter } from 'next/dist/client/router';

type PageProps = { country: CountryData | null, errorMessage?: string }
type PageParams = { countryNameSlug: string }

export default function Page({ country, errorMessage }: PageProps) {
  if (!country?.country?.fields) {
    return <ErrorPage message={errorMessage} />
  }

  const router = useRouter()
  const canonicalURL = useCanonicalURL(router.asPath.toLowerCase())

  return (
    <PageLayout>
      <NextSeo
        title={country.country.fields.Name}
        openGraph={{
          title: `Game worker solidarity in ${country.country.fields.Name}`,
        }}
        canonical={canonicalURL}
      />

      <div className='content-wrapper'>
        <h1 className=' font-bold text-4xl max-w-xl'>
          {country?.country?.fields['Name'].trim()} <Emoji symbol={country.country.emoji.emoji} label='flag' /> game worker solidarity
        </h1>

        <div className='my-4'>
          {country.country.fields.Summary &&<div className='prose' dangerouslySetInnerHTML={{ __html: country.country.summary.html }} />}
        </div>

        <div className='my-4 mb-6'>
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

        {country?.country?.solidarityActions?.length
          && <CumulativeMovementChart data={country?.country?.solidarityActions || []} />
        }

        {country?.country?.solidarityActions && <SolidarityActionsList
          data={country?.country?.solidarityActions}
          withDialog
        />}

        <Link href='/'>
          <div className='link  text-sm mt-4'>
            &larr; All actions
          </div>
        </Link>
      </div>
    </PageLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const links = await getCountries()
  return {
    paths: links.map(country => ({
      params: {
        countryNameSlug: country.fields.Slug
      }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<
  PageProps, PageParams
> = async (context) => {
  if (!context?.params?.countryNameSlug) throw new Error()

  let country
  let errorMessage = ''
  try {
    country = await getCountryDataBySlug(context.params.countryNameSlug) || null
  } catch (e) {
    console.error("No country was found", e)
    country = null
    errorMessage = e.toString()
  }

  return {
    props: {
      country,
      errorMessage
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}