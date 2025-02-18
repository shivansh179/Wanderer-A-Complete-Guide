import requests
from bs4 import BeautifulSoup
import json
import sys  # Import the sys module

# Get the location from the command line arguments
if len(sys.argv) > 1:
    location = sys.argv[1]
else:
    print(json.dumps({"error": "No location provided"}))  # Return JSON error
    sys.exit(1)  # Exit with an error code


# URL of the page you want to scrape
url = f'https://www.aajtak.in/topic/{location}'

try:
    # Fetch the website content
    req = requests.get(url)
    req.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
    content = BeautifulSoup(req.content, "html.parser")

    news_list = []

    # Identify the news article container
    article_list = content.find("ul", class_="topicsearchli")
    if article_list:
        articles = article_list.find_all("li")

        # Loop through each article and extract the relevant data
        for article in articles:
            news = {}

            # Extract the title
            title_tag = article.find("a")
            if title_tag:
                news['title'] = title_tag.get('title')
                news['link'] = title_tag.get('href')

            # Extract the description
            desc_tag = article.find("p", class_="hideKickerOnMobile")
            if desc_tag:
                news['description'] = desc_tag.text.strip()

            # Add the news to the list
            if news:  # Only add news if it has content
                news_list.append(news)

    # Extract image and <p> tag content from the location page
    topic_section = content.find("div", class_="search_main")
    if topic_section:
        # Extract the image
        image_section = topic_section.find("div", class_="topicImg")
        if image_section:
            img_tag = image_section.find("img")
            if img_tag:
                img_url = img_tag.get("data-src") or img_tag.get("src")
                news_list.append({
                    "image": {
                        "url": img_url,
                        "alt": img_tag.get("alt", ""),
                        "title": img_tag.get("title", "")
                    }
                })

        # Extract the text content from <p> tags inside the bio
        bio_section = topic_section.find("div", class_="topic-bio")
        if bio_section:
            paragraphs = bio_section.find_all("p")
            bio_content = "\n\n".join(p.text.strip() for p in paragraphs if p.text.strip())
            if bio_content:
                news_list.append({
                    "bio": bio_content
                })

    # Convert the news list to JSON format
    json_data = json.dumps(news_list, ensure_ascii=False, indent=4)

    # Output the scraped news data
    print(json_data)

except requests.exceptions.RequestException as e:
    print(json.dumps({"error": f"Request failed: {e}"}))  # JSON error
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"An error occurred: {e}"}))  # JSON error
    sys.exit(1)
