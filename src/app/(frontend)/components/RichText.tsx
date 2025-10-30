import React from 'react'

interface LexicalNode {
  children?: LexicalNode[]
  text?: string
  type?: string
  [key: string]: any
}

interface LexicalRoot {
  root: {
    children: LexicalNode[]
    [key: string]: any
  }
}

interface RichTextProps {
  data: LexicalRoot | string | null | undefined
}

/**
 * Simple rich text renderer for Lexical content
 * This is a basic implementation that handles common cases
 * For full support, consider using @payloadcms/richtext-lexical serializer
 */
export function RichText({ data }: RichTextProps) {
  if (!data) return null

  // If it's already a string (fallback), render it
  if (typeof data === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: data }} />
  }

  // Handle Lexical JSON structure
  if (typeof data === 'object' && data.root) {
    const renderNode = (node: LexicalNode, index: number): React.ReactNode => {
      if (node.text) {
        // Text node
        let element: React.ReactNode = node.text

        // Apply formatting
        if (node.format) {
          if (node.format & 1) {
            // Bold
            element = <strong key={index}>{element}</strong>
          }
          if (node.format & 2) {
            // Italic
            element = <em key={index}>{element}</em>
          }
        }

        return element
      }

      if (node.children) {
        // Container node
        const children = node.children.map((child, i) => renderNode(child, i))

        switch (node.type) {
          case 'heading':
            const level = (node.tag || node.headingSize || 'h2') as string
            const HeadingTag = level as keyof JSX.IntrinsicElements
            return React.createElement(HeadingTag, { key: index }, children)

          case 'paragraph':
            return <p key={index}>{children}</p>

          case 'list':
            const ListTag = node.listType === 'number' ? 'ol' : 'ul'
            return React.createElement(ListTag, { key: index }, children)

          case 'listitem':
            return <li key={index}>{children}</li>

          case 'link':
            return (
              <a
                key={index}
                href={node.url || '#'}
                target={node.rel === 'nofollow' ? undefined : '_blank'}
                rel={node.rel || 'noopener noreferrer'}
              >
                {children}
              </a>
            )

          default:
            return <div key={index}>{children}</div>
        }
      }

      return null
    }

    const nodes = data.root.children?.map((child, index) => renderNode(child, index))

    return <div className="rich-text-content">{nodes}</div>
  }

  // Fallback: stringify if unknown format
  return <div>{JSON.stringify(data)}</div>
}
