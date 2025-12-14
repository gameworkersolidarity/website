import { projectStrings } from '@/project-strings'
import { OpenUniversityLogo } from '@/components/OpenUniversityLogo'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { draftMode } from 'next/headers'

export default async function Page() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const isDraftMode = (await draftMode()).isEnabled

  try {
    // Fetch the global data for the description
    const aboutPageData = await payload.findGlobal({
      slug: 'aboutPage',
      draft: isDraftMode,
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
