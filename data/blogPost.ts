import MarkdownIt from 'markdown-it'
import { BlogPost, StaticPage } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { blogPostSchema } from './schema';

const markdown = new MarkdownIt();

export const formatBlogPost = (blog: BlogPost): BlogPost => {
  blog.fields.Body = markdown.render(blog.fields.Body)
  return blog
}

const blogPostFields = ['Title', 'Body', 'Public', 'Summary', 'Date', 'Slug'] as Array<keyof BlogPost['fields']>

export const blogPostBase = () => airtableBase<BlogPost['fields']>(
  env.get('AIRTABLE_TABLE_NAME_BLOG_POSTS').default('Blog Posts').required().asString()
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
    blogPostBase().select({
      filterByFormula: `AND(Public, Slug="${slug}")`,
      fields: blogPostFields,
      maxRecords: 1,
      view: env.get('AIRTABLE_TABLE_VIEW_BLOG_POSTS').default('Grid view').required().asString(),
    }).firstPage((error, records) => {
      if (error) {
        return reject(error)
      }
      return resolve(formatBlogPost(records[0]._rawJson))
    })
  })
}