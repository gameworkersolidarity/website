import { twMerge } from 'tailwind-merge'
import {
  PayloadLexicalReactRenderer,
  PayloadLexicalReactRendererContent,
} from '@atelier-disko/payload-lexical-react-renderer'
import { LexicalContent } from '@/types'

export function LexicalRenderer({
  content,
  className,
}: {
  content?: LexicalContent | null
  className?: string
}) {
  if (!content?.root?.children?.length) {
    return null
  }
  return (
    <div className={twMerge('lexical-content prose leading-relaxed', className)}>
      <PayloadLexicalReactRenderer content={content as PayloadLexicalReactRendererContent} />
    </div>
  )
}
