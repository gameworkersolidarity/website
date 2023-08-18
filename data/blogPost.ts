import { BlogPost, BlogPostAirtableRecord, StaticPage } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { blogPostSchema } from './schema';
import { parseMarkdown } from './markdown';
import { generateCDNMap } from './cloudinary';
import { RecordData } from 'airtable';

export const formatBlogPost = (blogRecord: BlogPostAirtableRecord): BlogPost | undefined => {
  let blog: Omit<Partial<BlogPost>, 'cdnMap'> & { cdnMap?: BlogPost['cdnMap'] } = { ...blogRecord }
  blog.body = parseMarkdown(blogRecord.fields.Body || '')
  blog.cdnMap = generateCDNMap(blogRecord)

  // Remove any keys not expected by the parser
  const validatedBlog = blogPostSchema.safeParse(blog)
  if (validatedBlog.success) {
    console.log({ blog, validated: validatedBlog.data })
    return validatedBlog.data as BlogPost
  } else {
    console.error(validatedBlog.error)
  }
}

const blogPostFields = ['Title', 'ByLine', 'Image', 'Body', 'Public', 'Summary', 'Date', 'Slug', 'cdn_urls'] as Array<keyof BlogPost['fields']>

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
          const blogPost = formatBlogPost(record._rawJson)
          if (blogPost) {
            blogPosts.push(blogPost)
          }
        });
        fetchNextPage();
      } catch (e) {
        reject(e)
      }
    }, function done(err) {
      try {
        if (err) { reject(err); return; }
        resolve(
          blogPosts.filter(a => {
            const validation = blogPostSchema.safeParse(a)
            console.error(a, validation)
            return validation.success
          })
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
        const blogPost = formatBlogPost(records[0]._rawJson)
        if (blogPost) {
          return resolve(blogPost)
        }
      } catch(e) {
        reject(e)
      }
    })
  })
}

export async function updateBlogPosts(updates: RecordData<any>[]) {
  return new Promise<BlogPostAirtableRecord[]>((resolve, reject) => {
    blogPostBase().update(updates, function (err, records) {
      if (err) reject(err)
      resolve(records)
    });
  })
}