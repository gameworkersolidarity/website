import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
// Make sure you have jsdom and @types/jsdom installed
import { JSDOM } from 'jsdom'
import config from '@/payload.config'
import { LexicalContent } from '@/global-types'

export async function htmlToLexical(html: string) {
  const conf = await config
  const lexicalContent = convertHTMLToLexical({
    editorConfig: await editorConfigFactory.default({
      config: conf, // Your Payload Config
    }),
    html,
    JSDOM, // Pass in the JSDOM import; it's not bundled to keep package size small
  })

  return lexicalContent as NonNullable<LexicalContent>
}
