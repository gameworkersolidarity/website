import { twMerge } from 'tailwind-merge'
import {
  PayloadLexicalReactRenderer,
  PayloadLexicalReactRendererContent,
} from '@atelier-disko/payload-lexical-react-renderer'
import { LexicalContent } from '@/global-types'

export function LexicalRenderer({
  content,
  className,
  limitParagraphs,
}: {
  content?: LexicalContent | null
  className?: string
  limitParagraphs?: number
}) {
  if (!content?.root?.children?.length) {
    return null
  }
  if (limitParagraphs) {
    content = {
      ...content,
      root: {
        ...content.root,
        children: content.root.children.slice(0, limitParagraphs),
      },
    }
  }
  return (
    <div className={twMerge('lexical-content prose leading-relaxed', className)}>
      <PayloadLexicalReactRenderer content={content as PayloadLexicalReactRendererContent} />
    </div>
  )
}
