import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import json

def scrape_weather(location):
    # URL for weather data
    url = f"https://www.timeanddate.com/weather/india/{location}/ext"
    
    try:
        # Set up Chrome driver
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")  # Run in headless mode (no browser window)
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        # Open the page
        driver.get(url)
        
        # Wait for the content to load (adjust time if needed)
        time.sleep(5)

        # Get the page source after JavaScript has rendered the page
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Initialize a dictionary to store the weather data
        weather_data = {}

        # Find the main weather container
        temp_block = soup.find('div', class_='tempblock')

        if temp_block:
            # Extracting temperature
            temperature = temp_block.find('div', class_='temp').get_text(strip=True)
            weather_data['temperature'] = temperature

            # Extracting weather description
            weather_desc = temp_block.find('div', class_='wdesc').get_text(strip=True)
            weather_data['weather_desc'] = weather_desc

            # Extracting feels like temperature
            feels_like_div = temp_block.find('span', text='Feels Like:')
            feels_like = feels_like_div.find_next('div').get_text(strip=True) if feels_like_div else "N/A"
            weather_data['feels_like'] = feels_like

            # Extracting humidity
            humidity_div = temp_block.find('span', text='Humidity:')
            humidity = humidity_div.find_next('div').get_text(strip=True) if humidity_div else "N/A"
            weather_data['humidity'] = humidity

            # Extracting wind speed
            wind_speed_div = temp_block.find('span', text='Wind:')
            wind_speed = wind_speed_div.find_next('div').get_text(strip=True) if wind_speed_div else "N/A"
            weather_data['wind_speed'] = wind_speed

            # Extracting precipitation data
            precipitation_div = temp_block.find('div', text='Precipitation:')
            precipitation = precipitation_div.get_text(strip=True) if precipitation_div else "N/A"
            weather_data['precipitation'] = precipitation

            # Extracting precipitation chance
            precip_chance_div = temp_block.find('div', text='Precipitation Chance:')
            precip_chance = precip_chance_div.get_text(strip=True) if precip_chance_div else "N/A"
            weather_data['precipitation_chance'] = precip_chance

            # Output the data as JSON
            print(json.dumps(weather_data, indent=4))

        else:
            # Handle case when weather data is not found
            print(json.dumps({"error": "Weather data not found"}))

        # Close the browser
        driver.quit()

    except Exception as e:
        # Handle any errors
        print(json.dumps({"error": f"An error occurred: {e}"}))

if __name__ == "__main__":
    # Location is passed as a command-line argument
    if len(sys.argv) > 1:
        location = sys.argv[1]
        scrape_weather(location)
    else:
        print(json.dumps({"error": "No location provided"}))
