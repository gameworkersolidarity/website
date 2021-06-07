import type { NextApiRequest, NextApiResponse } from 'next'
import { BlogPost } from '../../data/types';
import { getBlogPosts } from '../../data/blogPost';

export type BlogPostsData = {
  blogPosts: BlogPost[]
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<BlogPostsData>) {
  const blogPosts = await getBlogPosts()
  res.json({ blogPosts })
}