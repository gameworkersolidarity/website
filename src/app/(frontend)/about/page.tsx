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
        <h1 className="font-identity text-4xl lg:text-5xl font-bold pb-3">About the project</h1>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          <LexicalRenderer content={aboutPageData?.description} className="md:col-span-2" />
          <div className="grid lg:grid-cols-2 lg:col-span-2 gap-6">
            <div className="space-y-5">
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Team</h2>
                <p>
                  Austin Kelmore, Game worker and union organizer, IWGB.&nbsp;
                  <a href="https://bsky.app/profile/austinkelmore.com" className="link">
                    @austinkelmore.com
                  </a>
                </p>
                <p>
                  Jamie Woodcock, Senior Lecturer, King&apos;s College London.&nbsp;
                  <a href="https://twitter.com/jamie_woodcock" className="link">
                    @jamie_woodcock
                  </a>
                </p>
                <p>
                  Common Knowledge.&nbsp;
                  <a href="https://twitter.com/commonknowledge" className="link">
                    @commonknowledge
                  </a>
                </p>
                <p>
                  Shauna Buckley, Designer. &nbsp;
                  <a href="https://twitter.com/_ShaunaBuckley" className="link">
                    @_ShaunaBuckley
                  </a>
                </p>
              </section>
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Additional Help From</h2>
                <p>
                  Pablo Lopez Soriano, Game worker and union organizer, IWGB.&nbsp;
                  <a href="https://fosstodon.org/@kednar" className="link">
                    @kednar
                  </a>
                </p>
                <p>
                  Michelle Phan, Research Assistant, University of Toronto.&nbsp;
                  <a href="https://twitter.com/phanny" className="link">
                    @phanny
                  </a>
                </p>
              </section>
              <section className="space-y-3">
                <h2 className="font-semibold text-lg">Contact Us</h2>
                <p>
                  <a className="link" href={`mailto:${projectStrings.email}`}>
                    Email
                  </a>
                </p>
                <p>
                  <a className="link" href={`${projectStrings.blueskyProfile}`}>
                    Bluesky
                  </a>
                </p>
                <p>
                  <a className="link" href={`https://twitter.com/${projectStrings.twitterHandle}`}>
                    Twitter
                  </a>
                </p>
                <p>
                  <a className="link" href={projectStrings.github}>
                    GitHub
                  </a>
                </p>
              </section>
            </div>
            <section className="space-y-3">
              <h2 className="font-semibold text-lg">Credits</h2>
              <p>
                This website was developed as part of the{' '}
                <em>Mapping labour organising in games industry: past, present, and future</em>{' '}
                project, funded by PVC-RES at The Open University
              </p>
              <a href="https://www.open.ac.uk/" className="block">
                <OpenUniversityLogo />
              </a>
            </section>
          </div>
        </div>
      </article>
    )
  } catch (error) {
    return notFound()
  }
}
