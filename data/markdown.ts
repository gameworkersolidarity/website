import MarkdownIt from 'markdown-it'
import removeMd from 'remove-markdown'
const markdown = new MarkdownIt();

export function parseMarkdown(md: string) {
  const html = markdown.render(md)
  return {
    html: html as string,
    plaintext: removeMd(html) as string
  }
}