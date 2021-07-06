import { getSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, Company, Category, Country } from '../data/types';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import { getCompanies } from '../data/company';
import { getCategories } from '../data/category';
import { getCountries } from '../data/country';
import { SolidarityActionsTimeline } from '../components/Timeline';

type PageProps = {
  actions: SolidarityAction[],
  companies: Company[],
  categories: Category[],
  countries: Country[]
}

export default function Page({ actions, companies, categories, countries }: PageProps) {
  return (
    <PageLayout fullWidth>
      <SolidarityActionsTimeline
        actions={actions}
        companies={companies}
        categories={categories}
        countries={countries}
      />
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps<
  PageProps,
  {}
> = async (context) => {
  const actions = await getSolidarityActions()
  const companies = await getCompanies()
  const categories = await getCategories()
  const countries = await getCountries()
  return {
    props: {
      actions,
      companies,
      categories,
      countries
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}