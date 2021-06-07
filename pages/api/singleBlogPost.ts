import type { NextApiRequest, NextApiResponse } from 'next'
import { BlogPost } from '../../data/types';
import { getSingleBlogPost } from '../../data/blogPost';

export type BlogPostsData = {
  blogPost: BlogPost
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<BlogPostsData>) {
  const blogPost = await getSingleBlogPost(String(req.query?.slug))
  res.json({ blogPost })
}