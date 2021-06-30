import { NextSeo } from 'next-seo';
import { useRouter } from 'next/dist/client/router';
import PageLayout from '../components/PageLayout';

export default function Page({ message = 'Page Not Found' }: { message?: string }) {
  const router = useRouter()

  return (
    <PageLayout>
      <NextSeo
        title={`${router.asPath}: Page Not Found`}
        openGraph={{
          title: `${router.asPath}: Page Not Found`
        }}
      />

      <div className='content-wrapper'>
        <h1 className='font-identity text-8xl text-center py-5'>
          404: {message}
        </h1>
      </div>
    </PageLayout>
  )
}