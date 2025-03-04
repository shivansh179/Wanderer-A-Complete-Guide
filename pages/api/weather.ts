// api/weather.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// Function to scrape weather directly in JavaScript instead of using Python
async function scrapeWeather(location: string) {
  try {
    const formattedLocation = location.toLowerCase().replace(/\s+/g, '+');
    
    // Define potential weather sources
    const weatherUrls = [
      // `https://www.weather.com/weather/today/l/${encodeURIComponent(formattedLocation)}`,
      `https://www.accuweather.com/en/search-locations?query=${encodeURIComponent(location)}`
    ];
    
    // Try each source until we get results
    for (const url of weatherUrls) {
      // console.log(`Scraping weather from: ${url}`);
      
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
      // console.log("weather news is " ,response);
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Different parsing logic based on source
      if (url.includes('weather.com')) {
        // Weather.com parsing
        const currentTemp = $('[data-testid="TemperatureValue"]').first().text().trim();
        const condition = $('[data-testid="wxPhrase"]').first().text().trim();
        const feelsLike = $('[data-testid="FeelsLikeSection"]').text().trim().replace('Feels Like', '').trim();
        const humidity = $('[data-testid="wxData"] [data-testid="PercentageValue"]').text().trim();
        const wind = $('[data-testid="Wind"]').text().trim().replace('Wind', '').trim();
        
        if (currentTemp) {
          return {
            location,
            current: {
              temperature: currentTemp,
              condition,
              feelsLike,
              humidity,
              wind
            },
            forecast: [],
            source: 'Weather.com'
          };
        }
      } else if (url.includes('accuweather.com')) {
        // AccuWeather parsing - first get location link
        const locationLink = $('.subnav-item').first().attr('href');
        
        if (locationLink) {
          const fullLink = `https://www.accuweather.com${locationLink}`;
          // console.log(`Following AccuWeather location link: ${fullLink}`);
          
          const detailResponse = await fetch(fullLink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
          });
          
          if (detailResponse.ok) {
            const detailHtml = await detailResponse.text();
            const $detail = cheerio.load(detailHtml);
            

            // console.log("html is ", $detail);
            
            const currentTemp = $detail('.temp').first().text().trim();

            // console.log("current temp is  ", currentTemp);

            const condition = $detail('.body-item').first().text().trim();

            // console.log("current condition is  ", condition);

            
            if (currentTemp) {
              return {
                location,
                current: {
                  temperature: `${currentTemp}°`,
                  condition,
                  feelsLike: $detail('.real-feel').text().trim()
                },
                forecast: [],
                source: 'AccuWeather'
              };
            }
          }
        }
      }
    }
    
    // If we get here, we couldn't find weather from any source
    return {
      location,
      error: 'No weather data found for this location'
    };
  } catch (error) {
    console.error('Error scraping weather:', error);
    return {
      location,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

app.post('/weather', async (c) => {
  try {
    const { location } = await c.req.json();
    
    if (!location) {
      return c.json({ error: 'Location is required' }, 400);
    }
    
    // console.log(`Processing weather request for location: ${location}`);
    const weatherData = await scrapeWeather(location);
    
    return c.json(weatherData);
  } catch (error) {
    console.error('API handler error:', error);
    return c.json({
      error: 'Failed to fetch weather',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default handle(app);