import jsonfeedToRSS from 'jsonfeed-to-rss'
import { getBlogPosts } from '../data/blogPost';
import { formatRFC3339 } from 'date-fns';

// https://jsonfeed.org/version/1.1
export const generateJSONFeed = async () => {
  const articles = getBlogPosts()
  return {
    "version": "https://jsonfeed.org/version/1",
    "title": "Game Worker Solidarity",
    "home_page_url": "https://gameworkersolidarity.com",
    "description": "Preserving the history of video game worker solidarity",
    "feed_url": "http://gameworkersolidarity.com/feed.json",
    "items": (await articles).map(article => ({
      "title": article.fields.Title,
      "summary": article.fields.Summary,
      "date_published": formatRFC3339(new Date(article.fields.Date)),
      "content_html": article.body.html,
      "url": `https://gameworkersolidarity.com/analysis/${article.fields.Slug}`,
      "id": `https://gameworkersolidarity.com/analysis/${article.fields.Slug}`,
    }))
  }
}

export default function Page() {
  return null
}

export async function getServerSideProps(context) {
  const res = context.res;
  if (!res) {
    return;
  }
  const feed = await generateJSONFeed()
  res.setHeader("Content-Type", "application/feed+json");
  res.write(JSON.stringify(feed));
  res.end();
}