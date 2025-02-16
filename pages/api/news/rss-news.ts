// pages/api/rss.js

import axios from 'axios';
import xml2js from 'xml2js';

export default async function handler(req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { news?: any; error?: string; }): void; new(): any; }; }; }) {
  const rssUrl = 'https://www.amarujala.com/rss.xml'; // RSS Feed URL

  try {
    // Fetch the RSS feed from the URL
    const response = await axios.get(rssUrl, { responseType: 'text' });

    // Parse the XML data to JSON using xml2js
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    // Extract items (news articles) from the RSS feed
    const newsItems = result.rss.channel.item.map((item: { title: any; link: any; description: any; pubDate: any; }) => ({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    }));

    // Return the parsed RSS feed as JSON
    res.status(200).json({ news: newsItems });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
}
