import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from '@/payload-types'
import { projectStrings } from '@/project-strings'

export function parseHTMLAsLexicalRichText(html: string) {
  // Convert HTML to a simple Lexical JSON structure
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '' as const,
              text: html.replace(/<[^>]*>/g, ''), // Strip HTML tags
              type: 'text' as const,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          type: 'paragraph' as const,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root' as const,
      version: 1,
    },
  }
}

// Pass your config from generated types as generic
export const payloadClient = new PayloadSDK<Config>({
  baseURL: '/api',
})
