// server.ts - Hono API endpoint for image scraping
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import axios from 'axios';

const app = new Hono();

// Enable CORS
app.use('/api/aboutImage', cors());

// Cache results for 1 hour to reduce load on Unsplash
app.use('/api/aboutImage/*', cache({
  cacheName: 'aboutImage',
  cacheControl: 'max-age=3600'
}));

// API endpoint to get the first image for a location
app.get('/api/aboutImage/:destination', async (c) => {
  const destination = c.req.param('destination');
  
  if (!destination) {
    return c.json({ error: 'Destination parameter is required' }, 400);
  }
  
  try {
    // Fetch the Unsplash search page for the destination
    const response = await fetch(`https://unsplash.com/s/photos/${encodeURIComponent(destination)}`);
    const html = await response.text();
    
    // Simple HTML parsing to find the first image
    // Look for the first image in the search results
    const imgRegex = /<img[^>]+class="[^"]*tzC2N[^"]*"[^>]+src="([^"]+)"/i;
    const match = html.match(imgRegex);
    
    if (match && match[1]) {
      // Extract the URL of the highest resolution image from the srcset
      const srcsetRegex = /srcset="([^"]+)"/i;
      const srcsetMatch = html.match(srcsetRegex);
      
      if (srcsetMatch && srcsetMatch[1]) {
        // Parse the srcset to get the highest resolution URL
        const srcset = srcsetMatch[1];
        const srcsetParts = srcset.split(',').map(part => part.trim());
        const lastPart = srcsetParts[srcsetParts.length - 1];
        const url = lastPart.split(' ')[0];
        
        return c.json({ imageUrl: url });
      }
      
      // Fallback to the src if srcset parsing fails
      return c.json({ imageUrl: match[1] });
    }
    
    // No image found, return error
    return c.json({ error: 'No image found for this destination' }, 404);
  } catch (error) {
    console.error('Error fetching image:', error);
    return c.json({ error: 'Failed to fetch image' }, 500);
  }
});

export default app;