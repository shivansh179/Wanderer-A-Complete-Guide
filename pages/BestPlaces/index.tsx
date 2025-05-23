"use client"

import { useState } from 'react';
import Navbar from '../Component/Navbar/index'; // Assuming Navbar is correctly placed
import { Search, MapPin } from 'lucide-react'; // Added MapPin for potential use

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
    [key: string]: CategoryData; // More flexible category typing
    places: CategoryData;
    food: CategoryData;
    experiences: CategoryData;
    museums: CategoryData;
  };
  status: string;
}

const SUGGESTED_CITIES = ['Lucknow', 'Delhi', 'Goa', 'Paris', 'Tokyo'];

const Home = () => {
  const [city, setCity] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('places');

  const handleSearch = async (searchCityOverride?: string) => {
    const cityToSearch = searchCityOverride || city;
    if (!cityToSearch) return;

    setLoading(true);
    setError(null);
    setResponse(null); // Clear previous response

    try {
      const apiResponse = await fetch(`/api/fetchPlaces?city=${encodeURIComponent(cityToSearch)}`);
      const data: ApiResponse | { error: string } = await apiResponse.json();

      if (apiResponse.ok && 'categories' in data) {
        setResponse(data);
        if (data.total_items === 0) {
          setError(`No data found for "${cityToSearch}". Try another city or check the spelling.`);
        } else {
          const categoriesOrder = ['places', 'food', 'experiences', 'museums'];
          let foundActiveTab = false;
          for (const categoryKey of categoriesOrder) {
            if (data.categories[categoryKey] && data.categories[categoryKey].count > 0) {
              setActiveTab(categoryKey);
              foundActiveTab = true;
              break;
            }
          }
          if (!foundActiveTab) setActiveTab('places'); // Default if all are empty (edge case)
        }
      } else if ('error' in data) {
        setError(data.error || 'Failed to fetch data');
      } else {
        setError('Received unexpected data format from API.');
      }
    } catch (err) {
      console.error('Error during fetch:', err);
      setError('Something went wrong! Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedCityClick = (suggestedCity: string) => {
    setCity(suggestedCity); // Update input field
    handleSearch(suggestedCity); // Trigger search
  };
  
  const activeItems = response?.categories[activeTab]?.items || [];
  
  const getCategoryCount = (categoryKey: string) => {
    return response?.categories[categoryKey]?.count || 0;
  };

  const hasCategoryItems = (categoryKey: string) => {
    return getCategoryCount(categoryKey) > 0;
  };

  const categoryKeys = response ? Object.keys(response.categories) : ['places', 'food', 'experiences', 'museums'];


  return (
    <>  
      <Navbar/>
      {/* Main content container */}
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 min-h-[calc(100vh-NAVBAR_HEIGHT)]"> {/* Replace NAVBAR_HEIGHT or ensure Navbar is outside flow */}
        <div className="max-w-5xl mx-auto">
          
          {/* Search Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-cyan-300 mb-3 text-center sm:text-left">
              Explore a City
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center sm:text-left">
              Discover top attractions, restaurants, and experiences.
            </p>
            <div className="flex flex-col sm:flex-row">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="E.g., Lucknow, Delhi, Paris"
                className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-black dark:text-cyan-200 rounded-t-md sm:rounded-l-md sm:rounded-t-none w-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={() => handleSearch()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-b-md sm:rounded-r-md sm:rounded-b-none font-semibold transition-colors duration-150 ease-in-out w-full sm:w-auto"
                disabled={loading || !city.trim()}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center my-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500"></div>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading data, please wait...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="my-8 p-6 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 rounded-md shadow-md">
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Oops! Something went wrong.</h3>
              <p className="text-red-600 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Response Data Display */}
          {response && response.total_items > 0 && !loading && !error && (
            <div>
              <div className="city-info mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-cyan-400">
                  Discovering <span className="text-cyan-600 dark:text-cyan-300 capitalize">{response.city}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400">{response.total_items} interesting items found!</p>
              </div>

              {/* Category Tabs - Horizontally Scrollable */}
              <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto pb-1 whitespace-nowrap" aria-label="Tabs">
                  {categoryKeys.map((categoryKey) => (
                    <button
                      key={categoryKey}
                      onClick={() => hasCategoryItems(categoryKey) && setActiveTab(categoryKey)}
                      className={`shrink-0 py-3 px-3 sm:px-4 text-sm sm:text-base font-medium rounded-t-md
                        ${activeTab === categoryKey 
                          ? 'border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        } 
                        ${!hasCategoryItems(categoryKey) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!hasCategoryItems(categoryKey)}
                    >
                      {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} ({getCategoryCount(categoryKey)})
                    </button>
                  ))}
                </nav>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeItems.map((place, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl flex flex-col">
                    {place.imageUrl && (
                      <div className="h-48 sm:h-56 w-full overflow-hidden">
                        <img 
                          src={place.imageUrl} 
                          alt={place.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-cyan-400 mb-2">{place.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 flex items-start">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500 dark:text-gray-400 shrink-0" />
                        {place.address}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 flex-grow min-h-[60px]">{place.description}</p>
                      {place.time && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span className="font-medium">Suggested time:</span> {place.time}
                        </p>
                      )}
                      {place.link && (
                        <a 
                          href={place.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-auto inline-block text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 font-medium text-sm pt-2"
                        >
                          Explore Details →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Initial Empty State (No Search Yet) */}
          {!loading && !response && !error && (
            <div className="text-center py-12 sm:py-20">
              <Search className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-cyan-400 dark:text-cyan-500 mb-6 opacity-70" />
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-cyan-300 mb-3">
                Ready for an Adventure?
              </h2>
              <p className="text-md sm:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                Enter a city name above to find amazing places, food, experiences, and museums.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTED_CITIES.map(suggestedCity => (
                  <button
                    key={suggestedCity}
                    onClick={() => handleSuggestedCityClick(suggestedCity)}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    Try "{suggestedCity}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;