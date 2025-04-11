import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import remarkGfm from 'remark-gfm';
import { 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaChevronRight, 
  FaInfoCircle, 
  FaUtensils, 
  FaUmbrellaBeach, 
  FaHistory, 
  FaUserFriends, 
  FaRegCalendarAlt, 
  FaExchangeAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MdOutlineAttractions } from 'react-icons/md';
import axios from 'axios';

interface AboutLocationProps {
  destination: string;
  locationBio: string;
  sectionVariants: any;
  imageAlt?: string;
}

const AboutLocation: React.FC<AboutLocationProps> = ({ 
  destination, 
  locationBio, 
  sectionVariants, 
  imageAlt
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [destinationImage, setDestinationImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showFullImage, setShowFullImage] = useState<boolean>(false);
  const [weather, setWeather] = useState<any>(null);
  const [currency, setCurrency] = useState<any>(null);
  const [parsedSections, setParsedSections] = useState<Record<string, string>>({});
  const fallbackImage = "/pachu.jpg";
  const safeDestination = destination || "Unknown Location";

  // Key sections from the bio
  const sections = useMemo(() => {
    return [
      { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
      { id: 'history', label: 'History', icon: <FaHistory /> },
      { id: 'attractions', label: 'Attractions', icon: <MdOutlineAttractions /> },
      { id: 'food', label: 'Cuisine', icon: <FaUtensils /> },
      { id: 'activities', label: 'Activities', icon: <FaUmbrellaBeach /> },
      { id: 'tips', label: 'Travel Tips', icon: <FaUserFriends /> }
    ];
  }, []);

  // Fetch the destination image from Pixabay
  useEffect(() => {
    fetchAboutImage();
    fetchWeather();
    fetchCurrencyInfo();
  }, [destination]);

  // Parse locationBio into sections
  useEffect(() => {
    if (locationBio) {
      const sectionContent = extractSections(locationBio);
      setParsedSections(sectionContent);
    }
  }, [locationBio]);

  const fetchAboutImage = async () => {
    setIsLoading(true);
    setDestinationImage('');
    try {
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: '33588047-ab7f2d7ec2a21089a0a35ce9f', 
          q: destination,
          image_type: 'photo',
          orientation: 'horizontal',
          per_page: 3
        }
      });

      if (response.data.hits && response.data.hits.length > 0) {
        // Get a random image from the top results
        const randomIndex = Math.floor(Math.random() * Math.min(3, response.data.hits.length));
        const imageUrl = response.data.hits[randomIndex].largeImageURL;
        setDestinationImage(imageUrl);
      } else {
        setDestinationImage(fallbackImage);
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      setDestinationImage(fallbackImage);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated weather fetch (normally would use a real weather API)
  const fetchWeather = async () => {
    // This is a placeholder - in production, you would use a real weather API
    setTimeout(() => {
      setWeather({
        temp: Math.floor(Math.random() * 15) + 15, // Random temp between 15-30°C
        condition: ['Sunny', 'Partly Cloudy', 'Rainy', 'Clear'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40, // Random humidity between 40-80%
        wind: Math.floor(Math.random() * 20) + 5, // Random wind speed between 5-25 km/h
      });
    }, 1000);
  };

  // Simulated currency info fetch
  const fetchCurrencyInfo = async () => {
    // This is a placeholder - in production, you would use a real currency API
    setTimeout(() => {
      setCurrency({
        local: ['EUR', 'USD', 'GBP', 'JPY', 'AUD'][Math.floor(Math.random() * 5)],
        rate: (Math.random() * 1.5 + 0.5).toFixed(2) // Random exchange rate
      });
    }, 1500);
  };

  // Extract meaningful sections from the markdown content
  const extractSections = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {
      overview: '',
      history: '',
      attractions: '',
      food: '',
      activities: '',
      tips: ''
    };
    
    // Default to showing everything in overview if we can't parse properly
    sections.overview = content;
    
    // Simple parsing based on markdown headers
    try {
      // Split content by headers
      const lines = content.split('\n');
      let currentSection = 'overview';
      let headerPattern = /^#+\s+(.+)$/;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(headerPattern);
        
        if (headerMatch) {
          const header = headerMatch[1].toLowerCase();
          
          // Map header to section
          if (header.includes('history') || header.includes('background') || header.includes('past')) {
            currentSection = 'history';
          } else if (header.includes('attraction') || header.includes('sights') || header.includes('landmark') 
                   || header.includes('places to visit') || header.includes('monuments')) {
            currentSection = 'attractions';
          } else if (header.includes('food') || header.includes('cuisine') || header.includes('dishes')
                   || header.includes('eat') || header.includes('dining')) {
            currentSection = 'food';
          } else if (header.includes('activit') || header.includes('experience') || header.includes('adventure')
                   || header.includes('things to do') || header.includes('entertainment')) {
            currentSection = 'activities';
          } else if (header.includes('tip') || header.includes('guide') || header.includes('advice')
                   || header.includes('recommendation') || header.includes('practical')
                   || header.includes('travel information')) {
            currentSection = 'tips';
          }
        }
        
        // Add line to the current section
        sections[currentSection] += line + '\n';
      }
      
      // If a section is empty, assign a default placeholder message
      Object.keys(sections).forEach(key => {
        if (!sections[key].trim()) {
          sections[key] = `No specific information available about ${key} for ${safeDestination}. Please check the overview section for general information.`;
        }
      });
      
      return sections;
    } catch (error) {
      console.error("Error parsing content into sections:", error);
      return { overview: content };
    }
  };

  // Get content for the active tab
  const getActiveContent = () => {
    return parsedSections[activeTab] || "No information available for this section.";
  };

  const altText = imageAlt || `Scenic view of ${safeDestination}`;

  // Animation variants
  const imageVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
    exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } }
  };

  const fullImageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // Function to get weather icon (placeholder - would be based on actual weather data)
  const getWeatherIcon = () => {
    if (!weather) return null;
    
    switch(weather.condition) {
      case 'Sunny': return '☀️';
      case 'Partly Cloudy': return '⛅';
      case 'Rainy': return '🌧️';
      case 'Clear': return '🌤️';
      default: return '🌡️';
    }
  };

  return (
    <>
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Header with destination image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              <motion.img
                src={destinationImage}
                alt={altText}
                className="w-full h-full object-cover"
                variants={imageVariants}
                initial="initial"
                animate="animate"
                onClick={() => setShowFullImage(true)}
                style={{ cursor: 'pointer' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackImage;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{safeDestination}</h1>
                <p className="text-lg text-blue-100 flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  Discover the magic of this extraordinary destination
                </p>
              </div>
            </>
          )}
        </div>

        Quick info cards
        <div className="px-6 -mt-6 relative z-10">
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Weather card */}
            {/* <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 flex items-center w-full md:w-auto md:flex-1">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
                <span className="text-xl">{getWeatherIcon()}</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Weather</h3>
                {weather ? (
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {weather.temp}°C, {weather.condition}
                  </p>
                ) : (
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                )}
              </div>
            </div> */}
            
            {/* Best time to visit */}
            {/* <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 flex items-center w-full md:w-auto md:flex-1">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 mr-3">
                <FaRegCalendarAlt className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Best Time to Visit</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Apr - Oct
                </p>
              </div>
            </div> */}
            
            {/* Currency */}
            {/* <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 flex items-center w-full md:w-auto md:flex-1">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 mr-3">
                <FaExchangeAlt className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Local Currency</h3>
                {currency ? (
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currency.local} (1 USD ≈ {currency.rate})
                  </p>
                ) : (
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                )}
              </div>
            </div> */}
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="px-6 mt-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`flex items-center px-4 py-2 whitespace-nowrap font-medium text-sm rounded-t-lg transition ${
                  activeTab === section.id 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mt-6 mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2" {...props} />,
                  p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 italic text-gray-700 dark:text-gray-300 rounded-r" {...props} />
                  ),
                }}
              >
                {getActiveContent()}
              </ReactMarkdown>
            </motion.div>
          </AnimatePresence>
          
          {/* Bottom action buttons */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            <a
              href={`https://www.google.com/maps/place/${encodeURIComponent(safeDestination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition"
            >
              <FaMapMarkerAlt className="mr-2" />
              View on Map
            </a>
            
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`travel to ${safeDestination}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition"
            >
              <FaGlobe className="mr-2" />
              Explore More
            </a>
            
            <a
              href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(safeDestination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition"
            >
              <MdOutlineAttractions className="mr-2" />
              Find Activities
            </a>
          </div>
        </div>
      </motion.div>

      {/* Full screen image modal */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            variants={fullImageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh]">
              <img 
                src={destinationImage} 
                alt={altText}
                className="w-full h-full object-contain"
              />
              <button 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullImage(false);
                }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium bg-black/50 inline-block px-4 py-2 rounded-lg">
                  {safeDestination}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AboutLocation;