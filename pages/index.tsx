import { getLiveSolidarityActions } from '../data/solidarityAction';
import { SolidarityAction, Company, Category, Country, OrganisingGroup } from '../data/types';
import env from 'env-var';
import { GetStaticProps } from 'next';
import PageLayout from '../components/PageLayout';
import { getCompanies } from '../data/company';
import { getCategories } from '../data/category';
import { getCountries } from '../data/country';
import { SolidarityActionsTimeline } from '../components/Timeline';
import { getOrganisingGroups } from '../data/organisingGroup';
import { createContext } from 'react';

type PageProps = {
  actions: SolidarityAction[],
  companies: Company[],
  categories: Category[],
  countries: Country[],
  groups: OrganisingGroup[]
}

export const ActionsContext = createContext<PageProps>({
  actions: [],
  companies: [],
  categories: [],
  countries: [],
  groups: []
})

export default function Page({ actions, companies, categories, countries, groups }: PageProps) {
  return (
    <PageLayout>
      {/* <ActionsContext.Provider value={{
        actions,
        companies,
        categories,
        countries,
        groups,
      }}> */}
        <SolidarityActionsTimeline
          actions={actions}
          companies={companies}
          categories={categories}
          countries={countries}
          groups={groups}
        />
      {/* </ActionsContext.Provider> */}
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps<
  PageProps,
  {}
> = async (context) => {
  return {
    props: {
      actions: await getLiveSolidarityActions(),
      companies: await getCompanies(),
      categories: await getCategories(),
      countries: await getCountries(),
      groups: await getOrganisingGroups()
    },
    revalidate: env.get('PAGE_TTL').default(
      env.get('NODE_ENV').asString() === 'production' ? 60 : 5
    ).asInt(), // In seconds
  }
}