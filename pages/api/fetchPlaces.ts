// api/index.ts - Edge runtime compatible API route
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

interface Place {
  name: string;
  imageUrl: string;
  address: string;
  description: string;
  time: string;
  link: string;
  category: string;
}

interface CategoryData {
  count: number;
  items: Place[];
}

interface ApiResponse {
  city: string;
  total_items: number;
  categories: {
    places: CategoryData;
    food: CategoryData;
    experiences: CategoryData;
    museums: CategoryData;
  };
  status: string;
}

const fetchCategoryData = async (cityName: string, category: string, urlPattern: string): Promise<Place[]> => {
  try {
    const formattedCity = cityName.toLowerCase().replace(/\s+/g, '-');
    const url = urlPattern.replace('{city}', formattedCity);
    
    // console.log(`Fetching ${category} data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.warn(`HTTP error for ${category}! Status: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const places: Place[] = [];
    
    $('[class*="MostLovedPlaceCard__Container"]').each((_, element) => {
      try {
        const imgElement = $(element).find('[class*="MostLovedPlaceCard__ImgCont"] img');
        const imageUrl = imgElement.attr('src') || '';
        
        const name = $(element).find('[class*="MostLovedPlaceCard__Heading"]').text().trim();
        const address = $(element).find('[class*="MostLovedPlaceCard__Address"]').text().trim();
        const description = $(element).find('[class*="MostLovedPlaceCard__Desc"]').text().trim();
        
        const time = $(element).find('[class*="MostLovedPlaceCard__NewPrice"]').text().trim();
        
        const linkElement = $(element).find('a[href^="/tripideas/"]');
        const link = linkElement.attr('href') ? 
          `https://www.makemytrip.com${linkElement.attr('href')}` : 
          '';
        
        if (name) {
          places.push({
            name,
            imageUrl,
            address,
            description,
            time,
            link,
            category
          });
        }
      } catch (err) {
        console.error(`Error processing a ${category} card:`, err);
      }
    });
    
    // console.log(`Found ${places.length} ${category} for ${cityName}`);
    return places;
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error);
    return [];
  }
};

app.get('/fetchPlaces', async (c) => {
  const city = c.req.query('city');
  
  if (!city) {
    return c.json({ error: 'City name is required' }, 400);
  }

  const cityName = city.toString();
  // console.log(`Processing request for city: ${cityName}`);

  try {
    const urlPatterns = {
      places: 'https://www.makemytrip.com/tripideas/places-to-visit-in-{city}',
      food: 'https://www.makemytrip.com/tripideas/foodie-hotspots-{city}',
      experiences: 'https://www.makemytrip.com/tripideas/memorable-experiences-{city}',
      museums: 'https://www.makemytrip.com/tripideas/museums-{city}'
    };

    // Use Promise.all instead of Promise.allSettled for better error handling in edge functions
    const [places, food, experiences, museums] = await Promise.all([
      fetchCategoryData(cityName, 'places', urlPatterns.places),
      fetchCategoryData(cityName, 'food', urlPatterns.food),
      fetchCategoryData(cityName, 'experiences', urlPatterns.experiences),
      fetchCategoryData(cityName, 'museums', urlPatterns.museums)
    ]);

    const totalItems = places.length + food.length + experiences.length + museums.length;

    const apiResponse: ApiResponse = {
      city: cityName,
      total_items: totalItems,
      categories: {
        places: {
          count: places.length,
          items: places
        },
        food: {
          count: food.length,
          items: food
        },
        experiences: {
          count: experiences.length,
          items: experiences
        },
        museums: {
          count: museums.length,
          items: museums
        }
      },
      status: totalItems > 0 ? 'success' : 'no_data'
    };

    return c.json(apiResponse);
  } catch (error) {
    console.error('API handler error:', error);
    return c.json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default handle(app);