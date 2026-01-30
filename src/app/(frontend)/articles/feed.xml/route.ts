import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@/payload.config'
import { getMediaUrl } from '@/utils/media'

type LexicalNode = {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  [key: string]: unknown
}

type LexicalRoot = {
  root: {
    children: LexicalNode[]
  }
}

// Convert Lexical node to HTML string
function lexicalNodeToHtml(node: LexicalNode): string {
  const { type, text, children, format, ...rest } = node

  // Text node
  if (type === 'text' && text) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Apply formatting
    if (format) {
      if (format & 1) {
        // Bold
        html = `<strong>${html}</strong>`
      }
      if (format & 2) {
        // Italic
        html = `<em>${html}</em>`
      }
      if (format & 4) {
        // Strikethrough
        html = `<del>${html}</del>`
      }
      if (format & 8) {
        // Underline
        html = `<u>${html}</u>`
      }
      if (format & 16) {
        // Code
        html = `<code>${html}</code>`
      }
    }

    return html
  }

  // Handle block-level elements
  if (children) {
    const childHtml = children.map(lexicalNodeToHtml).join('')

    switch (type) {
      case 'heading':
        const headingTag = (rest.tag as string) || 'h1'
        return `<${headingTag}>${childHtml}</${headingTag}>`

      case 'paragraph':
        return `<p>${childHtml}</p>`

      case 'list':
        const listType = (rest.listType as string) || 'bullet'
        const listTag = listType === 'number' ? 'ol' : 'ul'
        return `<${listTag}>${childHtml}</${listTag}>`

      case 'listitem':
        return `<li>${childHtml}</li>`

      case 'quote':
        return `<blockquote>${childHtml}</blockquote>`

      case 'link':
        const url = (rest.url as string) || '#'
        const escapedUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        return `<a href="${escapedUrl}">${childHtml}</a>`

      default:
        return `<div>${childHtml}</div>`
    }
  }

  return ''
}

// Convert Lexical content to HTML string
function lexicalToHtml(content: LexicalRoot | null | undefined): string {
  if (!content?.root?.children) {
    return ''
  }

  return content.root.children.map(lexicalNodeToHtml).join('')
}

// Format date for RSS (RFC 822)
function formatRssDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toUTCString()
}

// Escape XML entities
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Get base URL from request headers
async function getBaseUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  return `${protocol}://${host}`
}

export async function GET() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const baseUrl = await getBaseUrl()

  // Fetch all published blog posts
  const blogPostsResult = await payload.find({
    collection: 'blogPosts',
    depth: 2, // Include image relation
    pagination: false,
    sort: '-createdAt', // Sort by createdAt, newest first
    limit: 50, // Limit to 50 most recent posts
  })

  const posts = blogPostsResult.docs

  // Build RSS XML
  const rssItems = posts
    .map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`
      const pubDate = post.createdAt
        ? formatRssDate(post.createdAt as string)
        : formatRssDate(post.createdAt)
      const title = escapeXml(post.title as string)

      // Use Summary if available, otherwise generate description from body
      let description = ''
      if (post.body) {
        const bodyHtml = lexicalToHtml(post.body as LexicalRoot)
        // Strip HTML tags and limit length
        const plainText = bodyHtml.replace(/<[^>]*>/g, '').trim()
        description = plainText.substring(0, 500)
        if (plainText.length > 500) {
          description += '...'
        }
        description = escapeXml(description)
      }

      // Full HTML content for content:encoded
      const fullContent = post.body ? lexicalToHtml(post.body as LexicalRoot) : ''

      const imageUrl = typeof post.image === 'object' ? getMediaUrl(post.image, { baseUrl }) : null

      let itemXml = `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>`

      if (fullContent) {
        itemXml += `
      <content:encoded><![CDATA[${fullContent}]]></content:encoded>`
      }

      if (imageUrl) {
        itemXml += `
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" />`
      }

      itemXml += `
    </item>`

      return itemXml
    })
    .join('\n')

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Game Worker Solidarity - Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Latest blog posts from Game Worker Solidarity</description>
    <language>en-US</language>
    <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>
    <generator>Game Worker Solidarity</generator>
${rssItems}
  </channel>
</rss>`

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
