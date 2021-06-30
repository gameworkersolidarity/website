import { NextSeo } from 'next-seo';
import PageLayout from '../components/PageLayout';

export default function Page({ message }: { message?: string }) {
  message = message?.replace(/^Error:?[ ]*/, '')

  return (
    <PageLayout>
      <NextSeo
        title={"Page Not Found"}
        openGraph={{
          title: "Page Not Found"
        }}
      />

      <div className='content-wrapper my-5 space-y-3'>
        <h1 className='font-identity text-9xl text-center text-gray-300'>
          404
        </h1>
        {message && <h2 className='text-3xl text-center'>{message}</h2>}
      </div>
    </PageLayout>
  )
}