import { twMerge } from 'tailwind-merge'
import {
  PayloadLexicalReactRenderer,
  PayloadLexicalReactRendererContent,
} from '@atelier-disko/payload-lexical-react-renderer'
import { StaticPage } from '@/payload-types'

export function LexicalRenderer({
  content,
  className,
}: {
  content?: StaticPage['body'] | null
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

// type LexicalNode = {
//   type: string
//   children?: LexicalNode[]
//   text?: string
//   format?: number
//   [key: string]: unknown
// }

// type LexicalRoot = {
//   root: {
//     children: LexicalNode[]
//     direction?: string | null
//     format?: string
//     indent?: number
//     version: number
//     type: string
//   }
//   [key: string]: unknown
// }

// // Simple Lexical JSON to HTML renderer
// function renderNode(node: LexicalNode): React.ReactNode {
//   const { type, text, children, format, ...rest } = node

//   // Text node
//   if (type === 'text' && text) {
//     let element: React.ReactNode = text

//     // Apply formatting
//     if (format) {
//       if (format & 1) {
//         // Bold
//         element = <strong>{element}</strong>
//       }
//       if (format & 2) {
//         // Italic
//         element = <em>{element}</em>
//       }
//       if (format & 4) {
//         // Strikethrough
//         element = <del>{element}</del>
//       }
//       if (format & 8) {
//         // Underline
//         element = <u>{element}</u>
//       }
//       if (format & 16) {
//         // Code
//         element = <code>{element}</code>
//       }
//     }

//     return element
//   }

//   // Handle block-level elements
//   if (children) {
//     const renderedChildren = children.map((child, index) => (
//       <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
//     ))

//     switch (type) {
//       case 'heading':
//         const headingTag = (rest.tag as string) || 'h1'
//         const HeadingTag = headingTag as keyof React.ElementType
//         return React.createElement(HeadingTag, null, renderedChildren)

//       case 'paragraph':
//         return <p>{renderedChildren}</p>

//       case 'list':
//         const listType = (rest.listType as string) || 'bullet'
//         if (listType === 'number') {
//           return <ol>{renderedChildren}</ol>
//         }
//         return <ul>{renderedChildren}</ul>

//       case 'listitem':
//         return <li>{renderedChildren}</li>

//       case 'quote':
//         return <blockquote>{renderedChildren}</blockquote>

//       case 'link':
//         const url = (rest.url as string) || '#'
//         return <a href={url}>{renderedChildren}</a>

//       default:
//         return <div>{renderedChildren}</div>
//     }
//   }

//   return null
// }

// export function LexicalRenderer({
//   content,
//   className,
// }: {
//   content: LexicalRoot
//   className?: string
// }) {
//   if (!content?.root?.children) {
//     return null
//   }

//   return (
//     <div className={twMerge('lexical-content', className)}>
//       {content.root.children.map((child, index) => (
//         <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
//       ))}
//     </div>
//   )
// }
