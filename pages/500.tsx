import { NextSeo } from 'next-seo';
import { useRouter } from 'next/dist/client/router';
import PageLayout from '../components/PageLayout';

export default function Page({ message }: { message?: string }) {
  return (
    <PageLayout>
      <NextSeo
        title={`Something Went Wrong`}
        openGraph={{
          title: `Something Went Wrong`
        }}
      />

      <div className='content-wrapper my-5 space-y-3'>
        <h1 className='font-identity text-9xl text-center py-5 text-gray-300'>
          500
        </h1>
        {message && <h2 className='text-3xl text-center'>{message}</h2>}
      </div>
    </PageLayout>
  )
}