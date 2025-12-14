import { LexicalContent } from '@/global-types'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { convert } from 'html-to-text'

export function lexicalToHtml(content: NonNullable<LexicalContent>) {
  return convertLexicalToHTML({
    data: content,
    className: 'lexical-content prose leading-relaxed',
  })
}

export function lexicalToPlainText(content: NonNullable<LexicalContent>) {
  const html = lexicalToHtml(content)
  return convert(html, {
    wordwrap: false,
  })
}
