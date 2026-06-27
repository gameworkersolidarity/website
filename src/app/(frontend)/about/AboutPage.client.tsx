'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { LexicalRenderer } from '../components/LexicalRenderer'
import { projectStrings } from '@/project-strings'
import type { AboutPage } from '@/payload-types'
import { AdminEditBanner } from '@/components/Me'

export function AboutPageClient({ initialData }: { initialData: AboutPage }) {
  const { data: page } = useLivePreview({
    initialData,
    serverURL: projectStrings.baseUrl,
    depth: 2,
  })

  return (
    <>
      <AdminEditBanner page={{ adminPath: '/admin/globals/aboutPage', id: page.id }} />
      <article className="content-wrapper p-4 md:p-6 lg:p-8 space-y-2">
        <div className="grid md:grid-cols-2 gap-6">
          <article>
            <h1 className="font-identity text-4xl lg:text-5xl font-bold pb-3">About the project</h1>
            <LexicalRenderer content={page?.description} />
          </article>
          <aside className="xl:columns-2 gap-6">
            <LexicalRenderer content={page?.credits} />
          </aside>
        </div>
      </article>
    </>
  )
}
