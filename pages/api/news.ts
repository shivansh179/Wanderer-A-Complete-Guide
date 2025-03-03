// api/news.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// Function to scrape news directly in JavaScript instead of using Python
async function scrapeNews(location: string) {
  try {
    const formattedLocation = location.toLowerCase().replace(/\s+/g, '-');
    
    // Define potential news sources based on location
    const newsUrls = [
      `https://news.google.com/search?q=${encodeURIComponent(location)}`,
      `https://www.bing.com/news/search?q=${encodeURIComponent(location)}+news`,
      `https://timesofindia.indiatimes.com/searchresult.cms?query=${encodeURIComponent(location)}`
    ];
    
    // Try each source until we get results
    for (const url of newsUrls) {
      console.log(`Scraping news from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        console.warn(`HTTP error! Status: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // News article selectors
      const newsArticles: { title: string; link: string; source: string; time: string; imageUrl: string; description: string; }[] = [];
      
      if (url.includes('google.com')) {
        // Google News selectors
        $('article').each((_, element) => {
          try {
            const titleElement = $(element).find('h3');
            const linkElement = $(element).find('a');
            const sourceElement = $(element).find('time').parent();
            // const descriptionElement = $(element).find('div');

            const description = $(element).find('.snippet').attr('title') || ''
            const title = titleElement.text().trim();
            const link = linkElement.attr('href');
            const source = sourceElement.text().trim();
            const time = $(element).find('time').text().trim();
            
            // Find image - try different selectors
            let imageUrl = '';
            
            // Try data-src attribute first (often contains the real image URL)
            const imgWithDataSrc = $(element).find('img[data-src]');
            if (imgWithDataSrc.length > 0) {
                imageUrl = imgWithDataSrc.attr('data-src') || '';
            }
            
            // If not found, try figure with background image
            if (!imageUrl || imageUrl.includes('data:image')) {
                const figure = $(element).find('figure');
                const style = figure.attr('style') || '';
                const bgMatch = style.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/);
                if (bgMatch && bgMatch[1]) {
                    imageUrl = bgMatch[1];
                }
            }
            
            // If still not found, try regular img tag
            if (!imageUrl || imageUrl.includes('data:image')) {
                const img = $(element).find('img[src]:not([src^="data:"])');
                if (img.length > 0) {
                    imageUrl = img.attr('src') || '';
                }
            }
            
            // Skip placeholder or tiny images
            if (imageUrl && (imageUrl.includes('data:image') || imageUrl.includes('1x1.gif'))) {
                imageUrl = '';
            }
            
            if (title && (title.toLowerCase().includes(location.toLowerCase()) || 
                source.toLowerCase().includes(location.toLowerCase()))) {
              newsArticles.push({
                title,
                link: link ? `https://news.google.com${link.replace('./', '/')}` : '',
                source,
                time,
                imageUrl: imageUrl ? new URL(imageUrl, url).href : '',
                description,
              });
            }
          } catch (err) {
            console.error('Error processing news article:', err);
          }
        });
      } else if (url.includes('bing.com')) {
        // Bing News selectors
        $('.news-card').each((_, element) => {
          try {
            const title = $(element).find('.title').text().trim();
            const link = $(element).find('a.title').attr('href') || '';
            const source = $(element).find('.source').text().trim();
            const time = $(element).find('.time').text().trim();
            const description = $(element).find('.snippet').attr('title') || ''
            // Try multiple image selectors for Bing News
            let imageUrl = '';
            
            // Try data-src attribute first
            const imgWithDataSrc = $(element).find('img[data-src]');
            if (imgWithDataSrc.length > 0) {
                imageUrl = imgWithDataSrc.attr('data-src') || '';
            }
            
            // Then try regular image with src
            if (!imageUrl || imageUrl.includes('data:image')) {
                const img = $(element).find('.news-card-thumbnail img[src]:not([src^="data:"]), .image img[src]:not([src^="data:"])');
                if (img.length > 0) {
                    imageUrl = img.attr('src') || '';
                }
            }
            
            // Look for lazy-loaded images
            if (!imageUrl || imageUrl.includes('data:image')) {
                const lazyImg = $(element).find('img[data-bm], img[data-src-hq]');
                if (lazyImg.length > 0) {
                    imageUrl = lazyImg.attr('data-bm') || lazyImg.attr('data-src-hq') || '';
                }
            }
            
            // Skip placeholder images
            if (imageUrl && (imageUrl.includes('data:image') || imageUrl.includes('1x1.gif'))) {
                imageUrl = '';
            }
            
            if (title) {
              newsArticles.push({
                title,
                link,
                source,
                time,
                imageUrl,
                description,
              });
            }
          } catch (err) {
            console.error('Error processing news article:', err);
          }
        });
      } else if (url.includes('timesofindia')) {
        // Times of India selectors
        $('.article').each((_, element) => {
          try {
            const title = $(element).find('.title').text().trim();
            const link = $(element).find('a').attr('href') || '';
            const timeElement = $(element).find('.time');
            const sourceElement = $(element).find('.source');
            const description = $(element).find('.snippet').attr('title') || ''
            
            // Extract image with proper attributes for Times of India
            let imageUrl = '';
            
            // Try data-src first (for lazy loading)
            const imgWithDataSrc = $(element).find('img[data-src]');
            if (imgWithDataSrc.length > 0) {
                imageUrl = imgWithDataSrc.attr('data-src') || '';
            }
            
            // Then try regular src
            if (!imageUrl || imageUrl.includes('data:image')) {
                const img = $(element).find('img[src]:not([src^="data:"])');
                if (img.length > 0) {
                    imageUrl = img.attr('src') || '';
                }
            }
            
            // Skip placeholder or tiny images
            if (imageUrl && (imageUrl.includes('data:image') || imageUrl.includes('1x1.gif'))) {
                imageUrl = '';
            }
            
            const fullLink = link.startsWith('http') ? link : `https://timesofindia.indiatimes.com${link}`;
            
            if (title) {
              newsArticles.push({
                title,
                link: fullLink,
                source: sourceElement.text().trim() || 'Times of India',
                time: timeElement.text().trim() || '',
                imageUrl,
                description,
              });
            }
          } catch (err) {
            console.error('Error processing news article:', err);
          }
        });
      }
      
      // If we found news, return them
      if (newsArticles.length > 0) {
        // For articles that don't have images, we'll need to fetch the actual article page
        // and extract images from there
        const articlesWithImages = await Promise.all(
          newsArticles.map(async (article) => {
            // If we already have an image URL, return as is
            if (article.imageUrl && !article.imageUrl.includes('data:image')) {
              return article;
            }
            
            // Otherwise, try to fetch the article page to extract the image
            try {
              // Only attempt for direct news site links, not for Google News redirects
              if (article.link && !article.link.includes('news.google.com')) {
                const articleResponse = await fetch(article.link, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  }
                });
                
                if (articleResponse.ok) {
                  const articleHtml = await articleResponse.text();
                  const $article = cheerio.load(articleHtml);
                  
                  // Try to find meta og:image first (common on news sites)
                  const ogImage = $article('meta[property="og:image"]').attr('content');
                  if (ogImage) {
                    article.imageUrl = ogImage;
                  } else {
                    // Try to find the first large image in the article
                    const articleImages = $article('article img[src], .article-body img[src], .story-body img[src]')
                      .filter((_, img) => {
                        const src = $article(img).attr('src') || '';
                        // Filter out small icons, avatars, and ad images
                        return !src.includes('data:image') && 
                               !src.includes('icon') && 
                               !src.includes('logo') && 
                               !src.includes('avatar') && 
                               !src.includes('1x1') &&
                               !src.includes('pixel.gif');
                      });
                    
                    if (articleImages.length > 0) {
                      const imgSrc = articleImages.first().attr('src');
                      article.imageUrl = imgSrc ? new URL(imgSrc, article.link).href : '';
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching article for image:', err);
            }
            
            // If still no image, use placeholder
            if (!article.imageUrl || article.imageUrl.includes('data:image')) {
              article.imageUrl = `/api/placeholder/300/200?text=${encodeURIComponent(article.source || 'News')}`;
            }
            
            return article;
          })
        );
        
        return {
          location,
          count: articlesWithImages.length,
          articles: articlesWithImages.slice(0, 10), // Limit to 10 articles
          source: url.includes('google.com') ? 'Google News' : 
                 url.includes('bing.com') ? 'Bing News' : 'Times of India'
        };
      }
    }
    
    // If we get here, we couldn't find news from any source
    return {
      location,
      count: 0,
      articles: [],
      error: 'No news found for this location'
    };
  } catch (error) {
    console.error('Error scraping news:', error);
    return {
      location,
      count: 0,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Proxy endpoint to fetch images and avoid CORS issues
app.get('/fetch-image', async (c) => {
  try {
    const imageUrl = c.req.query('url');
    
    if (!imageUrl) {
      return c.json({ error: 'Image URL is required' }, 400);
    }
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    if (!response.ok) {
      return c.json({ error: `Failed to fetch image: ${response.status}` }, 500);
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();
    
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return c.json({
      error: 'Failed to fetch image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/news', async (c) => {
  try {
    const { location } = await c.req.json();
    
    if (!location) {
      return c.json({ error: 'Location is required' }, 400);
    }
    
    console.log(`Processing news request for location: ${location}`);
    const newsData = await scrapeNews(location);
    
    return c.json(newsData);
  } catch (error) {
    console.error('API handler error:', error);
    return c.json({
      error: 'Failed to fetch news',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default handle(app);