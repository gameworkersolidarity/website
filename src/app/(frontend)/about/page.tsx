import { OpenUniversityLogo } from '@/components/OpenUniversityLogo'
import { notFound } from 'next/navigation'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { payloadUserGlobalQuery } from '@/utils/payload.server'
import { lexicalToPlainText } from '@/utils/lexicalToHTML'
import { projectStrings } from '@/project-strings'
import type { Metadata } from 'next'

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
  try {
    // Fetch the global data for the description
    const aboutPageData = await payloadUserGlobalQuery({
      slug: 'aboutPage',
    })

    if (!aboutPageData) {
      return notFound()
    }

    return (
      <article className="content-wrapper p-4 md:p-6 lg:p-8 space-y-2">
        <div className="grid md:grid-cols-2 gap-6">
          <article>
            <h1 className="font-identity text-4xl lg:text-5xl font-bold pb-3">About the project</h1>
            <LexicalRenderer content={aboutPageData?.description} />
          </article>
          <aside className="xl:columns-2 gap-6">
            <LexicalRenderer content={aboutPageData?.credits} />
          </aside>
        </div>
      </article>
    )
  } catch (error) {
    return notFound()
  }
}
