import { projectStrings } from '@/project-strings'
import { notFound } from 'next/navigation'
import { payloadUserGlobalQuery } from '@/utils/payload.server'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import type { Metadata } from 'next'
import { DataPageClient } from './DataPage.client'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const dataPageData = await payloadUserGlobalQuery({
      slug: 'dataPage',
    })

    const title = 'Get the data'
    const description =
      (dataPageData?.description ? lexicalToPlainText(dataPageData.description) : '') ||
      'Get the data from the Game Workers Solidarity Platform'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  } catch (error) {
    const title = 'Get the data'
    const description = 'Get the data from the Game Workers Solidarity Platform'
    const shareImage = `${projectStrings.baseUrl}/icon/icon.png`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: shareImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shareImage],
      },
    }
  }
}

export default async function DataPage() {
  let dataPageData

  try {
    // Fetch the global data for the description
    dataPageData = await payloadUserGlobalQuery({
      slug: 'dataPage',
    })
  } catch (error) {
    return notFound()
  }

  if (!dataPageData) {
    return notFound()
  }

  return <DataPageClient initialData={dataPageData} />
}
