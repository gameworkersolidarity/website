import MarkdownIt from 'markdown-it'
import { BlogPost } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { blogPostSchema } from './schema';

const markdown = new MarkdownIt();

export const formatBlogPost = (blog: BlogPost): BlogPost => {
  blog.fields.Body = markdown.render(blog.fields.Body)
  return blog
}

const validBlogPostFilter = 'AND(Public, Title!="", Summary!="", Date!="", Body!="")'
const blogPostFields = ['Title', 'Body', 'Public', 'Summary', 'Date','Slug']

export async function getBlogPosts (): Promise<Array<BlogPost>> {
  return new Promise((resolve, reject) => {
    const blogPosts: BlogPost[] = []

    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').required().asString()
    ).select({
      sort: [
        { field: "Date", direction: "desc", },
      ],
      filterByFormula: validBlogPostFilter,
      fields: blogPostFields,
      maxRecords: 1000,
      view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        blogPosts.push(record._rawJson)
      });
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

export async function getSingleBlogPost (slug: string): Promise<BlogPost> {
  return new Promise((resolve, reject) => {
    airtableBase(
      env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').required().asString()
    ).select({
      filterByFormula: validBlogPostFilter,
      fields: blogPostFields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').required().asString(),
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        if (blogPostSchema.safeParse(record).success === true) {
          resolve(formatBlogPost(record._rawJson))
        } else {
          reject()
        }
      })
    })
  })
}