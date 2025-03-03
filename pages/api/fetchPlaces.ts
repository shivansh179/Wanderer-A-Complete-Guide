// pages/api/fetchPlaces.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

interface Place {
  name: string;
  imageUrl: string;
  address: string;
  description: string;
  time: string;
  link: string;
  category: string; // Added category field to track the source
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
    const formattedCity = cityName.toLowerCase();
    const url = urlPattern.replace('{city}', formattedCity);
    
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
    
    // Process all place cards on the page
    $('[class*="MostLovedPlaceCard__Container"]').each((_, element) => {
      try {
        // Use the DOM structure to extract data
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
        
        // Only add if we have at least a name
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
        // Continue with the next element even if one fails
      }
    });
    
    return places;
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  const cityName = city as string;

  try {
    console.log(`Fetching city guide data for: ${cityName}`);
    
    // Define the URL patterns for different categories
    const urlPatterns = {
      places: 'https://www.makemytrip.com/tripideas/places-to-visit-in-{city}',
      food: 'https://www.makemytrip.com/tripideas/foodie-hotspots-{city}',
      experiences: 'https://www.makemytrip.com/tripideas/memorable-experiences-{city}',
      museums: 'https://www.makemytrip.com/tripideas/museums-{city}'
    };
    
    // Fetch data for all categories in parallel
    const results = await Promise.allSettled([
      fetchCategoryData(cityName, 'places', urlPatterns.places),
      fetchCategoryData(cityName, 'food', urlPatterns.food),
      fetchCategoryData(cityName, 'experiences', urlPatterns.experiences),
      fetchCategoryData(cityName, 'museums', urlPatterns.museums)
    ]);
    
    // Process results
    const places = results[0].status === 'fulfilled' ? results[0].value : [];
    const food = results[1].status === 'fulfilled' ? results[1].value : [];
    const experiences = results[2].status === 'fulfilled' ? results[2].value : [];
    const museums = results[3].status === 'fulfilled' ? results[3].value : [];
    
    // Calculate total items
    const totalItems = places.length + food.length + experiences.length + museums.length;
    
    // Create API response
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
    
    console.log(`Found ${totalItems} total items for ${cityName}`);
    console.log(`Places: ${places.length}, Food: ${food.length}, Experiences: ${experiences.length}, Museums: ${museums.length}`);
    
    // Log an example item from each category for debugging
    if (places.length > 0) console.log('Places example:', places[0].name);
    if (food.length > 0) console.log('Food example:', food[0].name);
    if (experiences.length > 0) console.log('Experiences example:', experiences[0].name);
    if (museums.length > 0) console.log('Museums example:', museums[0].name);
    
    res.status(200).json(apiResponse);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}