import { BlogPost, StaticPage } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { blogPostSchema } from './schema';
import { parseMarkdown } from './markdown';

export const formatBlogPost = (blog: BlogPost): BlogPost => {
  blog.body = parseMarkdown(blog.fields.Body || '')

  try {
    // Remove any keys not expected by the parser
    blog = blogPostSchema.parse(blog)
  } catch(e) {
    console.error(JSON.stringify(blog), e)
  }
  return blog
}

const blogPostFields = ['Title', 'ByLine', 'Image', 'Body', 'Public', 'Summary', 'Date', 'Slug'] as Array<keyof BlogPost['fields']>

export const blogPostBase = () => airtableBase()<
  // @ts-ignore
  BlogPost['fields']
>(
  env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').asString()
)

export async function getBlogPosts (): Promise<Array<BlogPost>> {
  return new Promise((resolve, reject) => {
    const blogPosts: BlogPost[] = []

    blogPostBase().select({
      sort: [
        { field: "Date", direction: "desc", },
      ],
      filterByFormula: 'AND(Public, Title!="", Summary!="", Date!="", Body!="", Slug!="")',
      fields: blogPostFields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').asString(),
    }).eachPage(function page(records, fetchNextPage) {
      try {
        records.forEach(function(record) {
          blogPosts.push(formatBlogPost(record._rawJson))
        });
        fetchNextPage();
      } catch (e) {
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(
          blogPosts.filter(a =>
            blogPostSchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    });
  })
}

export async function getSingleBlogPost (slug: string): Promise<BlogPost> {
  return new Promise((resolve, reject) => {
    blogPostBase().select({
      filterByFormula: `AND(Public, Slug="${slug}")`,
      fields: blogPostFields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').asString(),
    }).firstPage((error, records) => {
      try {
        if (error || !records?.length) {
          return reject(error || `No record found for slug ${slug}`)
        }
        return resolve(formatBlogPost(records[0]._rawJson))
      } catch(e) {
        reject(e)
      }
    })
  })
}