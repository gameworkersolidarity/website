import { notFound } from 'next/navigation'
import { payloadUserGlobalQuery } from '@/utils/payload.server'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'
import { AboutPageClient } from './AboutPage.client'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const aboutPageData = await payloadUserGlobalQuery({
      slug: 'aboutPage',
    })

    const title = 'About the project'
    const description =
      (aboutPageData?.description ? lexicalToPlainText(aboutPageData.description) : '') ||
      projectStrings.description
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
    const title = 'About the project'
    const description = projectStrings.description
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

export default async function Page() {
  let aboutPageData

  try {
    // Fetch the global data for the description
    aboutPageData = await payloadUserGlobalQuery({
      slug: 'aboutPage',
    })
  } catch (error) {
    return notFound()
  }

  if (!aboutPageData) {
    return notFound()
  }

  return <AboutPageClient initialData={aboutPageData} />
}
