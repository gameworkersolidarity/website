import type { NextApiRequest, NextApiResponse } from 'next'
import { airtableBase } from '../../data/airtable';
import env from 'env-var';
import { BlogPost } from '../../data/types';
import { blogPostSchema } from '../../data/schema';
import { formatBlogPost } from '../../data/blogPost';

export type BlogPostsData = {
  blogPost: BlogPost
}

export default async (req: NextApiRequest, res: NextApiResponse<BlogPostsData>) => {
  const blogPost = await getSingleBlogPost(String(req.query?.slug))

  res.json({ blogPost })
}

export async function getSingleBlogPost (slug: string): Promise<BlogPost> {
  const filterByFormula = `Slug=${slug}`

  return new Promise((resolve, reject) => {
    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').required().asString()
    ).select({
        filterByFormula,
        maxRecords: 1,
        view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
          if (blogPostSchema.safeParse(record).success === true) {
            console.log(`Found record: ${filterByFormula}`)
            resolve(formatBlogPost(record._rawJson))
          } else {
            console.log(`No such record: ${filterByFormula}`)
            reject(`No such record: ${filterByFormula}`)
          }
        })
      })
  })
}