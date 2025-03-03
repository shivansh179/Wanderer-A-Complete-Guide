import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import quote

def scrape_places_to_visit(city_name):
    """
    Scrape information about places to visit in a specific city from MakeMyTrip.
    
    Args:
        city_name (str): Name of the city to search for
        
    Returns:
        list: List of dictionaries containing information about each place
    """
    # Format the URL with the city name
    encoded_city = quote(city_name.lower())
    
    # Define all URLs to scrape
    urls = {
        'places': f'https://www.makemytrip.com/tripideas/places-to-visit-in-{encoded_city}',
        'food': f'https://www.makemytrip.com/tripideas/foodie-hotspots-{encoded_city}',
        'experiences': f'https://www.makemytrip.com/tripideas/memorable-experiences-{encoded_city}',
        'museums': f'https://www.makemytrip.com/tripideas/museums-{encoded_city}'
    }
    
    # Set up headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
    
    all_data = {}
    
    for category, url in urls.items():
        try:
            # Send request to the website
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Parse the HTML content
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all place cards based on the class pattern
            place_cards = soup.find_all('div', class_=lambda c: c and 'MostLovedPlaceCard__Container' in c)
            
            places_data = []
            
            for card in place_cards:
                place_info = {}
                
                # Extract place name
                name_element = card.find('h3', class_=lambda c: c and 'MostLovedPlaceCard__Heading' in c)
                if name_element:
                    place_info['name'] = name_element.text.strip()
                
                # Extract place address/type
                address_element = card.find('h5', class_=lambda c: c and 'MostLovedPlaceCard__Address' in c)
                if address_element:
                    place_info['address'] = address_element.text.strip()
                
                # Extract place description
                desc_element = card.find('div', class_=lambda c: c and 'MostLovedPlaceCard__Desc' in c)
                if desc_element:
                    place_info['description'] = desc_element.text.strip()
                
                # Extract time information
                time_element = card.find('span', class_=lambda c: c and 'MostLovedPlaceCard__NewPrice' in c)
                if time_element:
                    place_info['time'] = time_element.text.strip()
                
                # Extract image URL
                img_element = card.find('img')
                if img_element and img_element.has_attr('src'):
                    place_info['image_url'] = img_element['src']
                
                # Extract link URL
                link_element = card.find('a', href=True)
                if link_element:
                    place_info['link'] = 'https://www.makemytrip.com' + link_element['href'] if link_element['href'].startswith('/') else link_element['href']
                
                # Add category information
                place_info['category'] = category
                
                # Add the place data if we have at least some information
                if place_info:
                    places_data.append(place_info)
            
            # Add data to the category in all_data
            all_data[category] = places_data
            print(f"Scraped {len(places_data)} items from {category} category")
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for {category}: {e}")
            all_data[category] = []
        except Exception as e:
            print(f"Error parsing data for {category}: {e}")
            all_data[category] = []
    
    return all_data

def save_to_json(data, city_name):
    """Save the scraped data to a JSON file."""
    filename = f"{city_name.lower()}_city_guide.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Data saved to {filename}")

def create_api_response(data, city_name):
    """Create a structured API response from the scraped data."""
    total_count = sum(len(places) for places in data.values())
    
    api_response = {
        "city": city_name,
        "total_items": total_count,
        "categories": {
            "places": {
                "count": len(data.get('places', [])),
                "items": data.get('places', [])
            },
            "food": {
                "count": len(data.get('food', [])),
                "items": data.get('food', [])
            },
            "experiences": {
                "count": len(data.get('experiences', [])),
                "items": data.get('experiences', [])
            },
            "museums": {
                "count": len(data.get('museums', [])),
                "items": data.get('museums', [])
            }
        },
        "status": "success" if total_count > 0 else "no_data"
    }
    
    return api_response

def main():
    city = input("Enter city name (e.g., lucknow): ")
    print(f"Scraping city guide data for {city}...")
    
    city_data = scrape_places_to_visit(city)
    
    # Create API response
    api_response = create_api_response(city_data, city)
    
    # Save all data to JSON
    save_to_json(api_response, city)
    
    # Print summary
    print("\nScraping Summary:")
    for category, places in city_data.items():
        print(f"{category.capitalize()}: {len(places)} items")
    
    print(f"\nTotal items: {api_response['total_items']}")
    print(f"API response saved to {city.lower()}_city_guide.json")

if __name__ == "__main__":
    main()