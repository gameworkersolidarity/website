import env from 'env-var'
import type { NextApiRequest, NextApiResponse } from 'next'
import { blogPostSchema } from '../../data/schema';
import { BlogPost } from '../../data/types';
import { airtableBase } from '../../data/airtable';
import { formatBlogPost } from '../../data/blogPost';

export type BlogPostsData = {
  blogPosts: BlogPost[]
}

export default async (req: NextApiRequest, res: NextApiResponse<BlogPostsData>) => {
  const blogPosts = await getBlogPosts()

  res.json({ blogPosts })
}

export async function getBlogPosts (): Promise<Array<BlogPost>> {
  return new Promise((resolve, reject) => {
    const blogPosts: BlogPost[] = []

    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').required().asString()
    ).select({
        sort: [
          { field: "Date", direction: "desc", },
        ],
        maxRecords: 1000,
        view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function(record) {
            blogPosts.push(record._rawJson)
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { reject(err); return; }
        resolve(
          blogPosts.filter(a =>
            blogPostSchema.safeParse(a).success === true
          ).map(formatBlogPost)
        )
    });
  })
}