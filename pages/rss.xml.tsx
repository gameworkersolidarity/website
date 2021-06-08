import jsonfeedToRSS from 'jsonfeed-to-rss'
import { generateJSONFeed } from './feed.json';

export default function Page () {
  return null
}

export async function getServerSideProps(context) {
  const res = context.res;
  if (!res) {
    return;
  }
  // fetch your RSS data from somewhere here
  const JSONFeed = await generateJSONFeed()
  const blogPosts = jsonfeedToRSS(JSONFeed);
  res.setHeader("Content-Type", "text/xml");
  res.write(blogPosts);
  res.end();
}