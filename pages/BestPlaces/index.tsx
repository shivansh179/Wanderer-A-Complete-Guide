import { useState } from 'react';
import Navbar from '../Component/Navbar/index';
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

const Home = () => {
  const [city, setCity] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('places');

  const handleSearch = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`/api/fetchPlaces?city=${encodeURIComponent(city)}`);
      
      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        setResponse(data);
        if (data.total_items === 0) {
          setError('No data found for this city. Try another city or check the spelling.');
        } else {
          // Set active tab to the first non-empty category
          const categories = ['places', 'food', 'experiences', 'museums'];
          for (const category of categories) {
            if (data.categories[category].count > 0) {
              setActiveTab(category);
              break;
            }
          }
        }
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error during fetch:', err);
      setError('Something went wrong! Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Find the currently active items based on the selected tab
  const activeItems = response?.categories[activeTab as keyof typeof response.categories]?.items || [];
  
  // Calculate how many items are in each category
  const getCategoryCount = (category: string) => {
    return response?.categories[category as keyof typeof response.categories]?.count || 0;
  };

  // Check if a category has any items
  const hasCategoryItems = (category: string) => {
    return getCategoryCount(category) > 0;
  };

  return (
    <>  
    <Navbar/>
    
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-cyan-700 font-bold mb-4">Enter your current city :</h1>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name (e.g., lucknow, delhi, goa)"
          className="border p-2 rounded-l w-full"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          className="bg-cyan-800 hover:bg-cyan-500 text-white p-2 rounded-r"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <p className="text-center my-8">Loading data from MakeMyTrip...</p>}
      {error && <p className="text-red-500 my-4">{error}</p>}

      {response && response.total_items > 0 && (
        <div>
          <div className="city-info mb-4">
            <h2 className="text-xl font-semibold">
              {city.charAt(0).toUpperCase() + city.slice(1)} ({response.total_items} items found)
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="mb-6 border-b">
            <nav className="flex -mb-px">
              {['places', 'food', 'experiences', 'museums'].map((category) => (
                <button
                  key={category}
                  onClick={() => hasCategoryItems(category) && setActiveTab(category)}
                  className={`mr-2 py-2 px-4 text-center ${
                    activeTab === category 
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                      : 'text-gray-500 hover:text-gray-700'
                  } ${!hasCategoryItems(category) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!hasCategoryItems(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({getCategoryCount(category)})
                </button>
              ))}
            </nav>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeItems.map((place, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-lg">
                {place.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={place.imageUrl} 
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-2">{place.name}</h2>
                  <p className="text-gray-600 font-medium mb-2">{place.address}</p>
                  <p className="text-sm mb-3">{place.description}</p>
                  {place.time && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Suggested time:</span> {place.time}
                    </p>
                  )}
                  {place.link && (
                    <a 
                      href={place.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-500 hover:underline"
                    >
                      View details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && !response && !error && (
        <p className="text-center text-gray-500 my-8">
          Enter a city name and click Search to find places to visit, food spots, experiences, and museums.
        </p>
      )}
    </div>
    </>
  );
};

export default Home;