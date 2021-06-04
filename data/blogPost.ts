import MarkdownIt from 'markdown-it'
import { BlogPost } from './types';

const markdown = new MarkdownIt();

export const formatBlogPost = (blog: BlogPost): BlogPost => {
  blog.fields.Body = markdown.render(blog.fields.Body)
  return blog
}