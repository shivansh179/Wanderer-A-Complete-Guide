import requests
from bs4 import BeautifulSoup
import json
import sys

# Get the location from the command line arguments
if len(sys.argv) > 1:
    location = sys.argv[1]
else:
    print(json.dumps({"error": "No location provided"}))
    sys.exit(1)

# URL of the NDTV page you want to scrape
url = f'https://ndtv.in/topic/{location}'

try:
    # Fetch the website content
    req = requests.get(url)
    req.raise_for_status()  # Raise HTTPError for bad responses
    content = BeautifulSoup(req.content, "html.parser")

    news_list = []

    # Identify the news article container
    article_list = content.find_all("li", class_="SrchLstPg-a-li")

    if article_list:
        for article in article_list:
            news = {}

            # Extract the headline title
            title_tag = article.find("a", class_="SrchLstPg_ttl")
            if title_tag:
                news['title'] = title_tag.get_text(strip=True)
                news['link'] = title_tag.get("href")

            # Extract the post description (if any available)
            desc_tag = article.find("p", class_="SrchLstPg_txt")
            if desc_tag:
                news['description'] = desc_tag.get_text(strip=True)
                
            # Extract the image URL, checking for both 'src' and lazy-load attributes like 'data-src'
            image_tag = article.find("img", class_="SrchLstPg_img-full")
            if image_tag:
                # Try data-src first (for lazy-loaded images), then fallback to src
                image_url = image_tag.get("data-src") or image_tag.get("src")
                
                # Exclude placeholder images like the transparent GIF
                if image_url and "data:image" not in image_url:
                    news['image'] = image_url

            # Add the news to the list
            if news:  # Only add if news contains valid data
                news_list.append(news)

    # Convert the news list to JSON format
    json_data = json.dumps(news_list, ensure_ascii=False, indent=4)

    # Output the scraped news data
    print(json_data)

except requests.exceptions.RequestException as e:
    print(json.dumps({"error": f"Request failed: {e}"}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"An error occurred: {e}"}))
    sys.exit(1)
