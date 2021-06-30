import { NextSeo } from 'next-seo';
import { useRouter } from 'next/dist/client/router';
import PageLayout from '../components/PageLayout';

export default function Page() {
  const router = useRouter()

  return (
    <PageLayout>
      <NextSeo
        title={`${router.asPath}: Something Went Wrong`}
        openGraph={{
          title: `${router.asPath}: Something Went Wrong`
        }}
      />

      <h1 className='font-identity text-8xl text-center py-5'>
        500: Something Went Wrong
      </h1>
    </PageLayout>
  )
}