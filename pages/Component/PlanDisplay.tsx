"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { FaInfoCircle, FaQuoteLeft, FaQuoteRight, FaRegStar, FaStar, FaMapMarkedAlt, FaCalendarAlt, FaPrint, FaChevronDown, FaChevronUp, FaSearch, FaCloudSun, FaUmbrella, FaExclamationTriangle, FaCheckCircle, FaCloud, FaCloudRain, FaSun, FaSnowflake, FaWind } from 'react-icons/fa';
import { MdFeedback, MdClose, MdFilterList } from 'react-icons/md';
import { IoChatbubblesOutline, IoThermometer } from 'react-icons/io5';
import { WiHumidity, WiStrongWind } from 'react-icons/wi';
import axios from 'axios';

interface PlanDisplayProps {
  plan: string;
  sectionVariants: any;
  destination: string;
}

interface Feedback {
  id?: string;
  feedback: string;
  email?: string;
  date?: string;
  destination?: string;
  rating?: number;
  source?: string;
  createdAt?: any;
}

interface WeatherData {
  current: {
    temp_c: number;
    condition: string;
    humidity?: number;
    wind_kph?: number;
  };
  forecast: Array<{
    date: string;
    day: {
      maxtemp_c: number;
      mintemp_c: number;
      condition: string;
      daily_chance_of_rain?: number;
    }
  }>;
}

// This is a mock function for demonstration purposes
// In a real application, you would implement actual scraping logic
const scrapeWeatherData = async (destination: string): Promise<WeatherData | null> => {
  try {
    // For demo purposes, let's say we're scraping data from weather.com or similar
    // We'll simulate the scraping process with a proxy service
    
    // In a real application, you might use a proxy service like this:
    // const response = await axios.get('https://api.allorigins.win/raw?url=' + 
    //   encodeURIComponent(`https://weather.com/weather/tenday/l/${encodeURIComponent(destination)}`));
    
    // Since we can't actually make the request in this demo, we'll simulate the response
    // This would be replaced with actual scraping logic in production
    
    // Simulate different weather conditions based on the destination name's length
    const seed = destination.length;
    const today = new Date();
    
    // Generate random but consistent weather data
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Create some variety based on the day and destination
      const tempVariation = (seed + i) % 10;
      const rainChance = ((seed * i) % 100);
      
      const conditions = [
        "Sunny", "Partly Cloudy", "Cloudy", "Light Rain", 
        "Rain", "Thunderstorm", "Clear", "Overcast"
      ];
      
      // Select a condition based on seed and day
      const conditionIndex = (seed + i) % conditions.length;
      
      return {
        date: date.toISOString().split('T')[0],
        day: {
          maxtemp_c: 20 + tempVariation,
          mintemp_c: 10 + (tempVariation / 2),
          condition: conditions[conditionIndex],
          daily_chance_of_rain: rainChance
        }
      };
    });
    
    // Current conditions
    const current = {
      temp_c: 15 + (seed % 15),
      condition: forecast[0].day.condition,
      humidity: 40 + (seed % 40),
      wind_kph: 5 + (seed % 20)
    };
    
    return {
      current,
      forecast
    };
        
  } catch (error) {
    console.error("Error scraping weather data:", error);
    return null;
  }
};

// In a real implementation, you would implement your actual web scraping here
// For different destination types

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, sectionVariants, destination }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sections extracted from plan
  const [sections, setSections] = useState<{ title: string; id: string }[]>([]);
  
  // Process plan to extract sections
  useEffect(() => {
    if (plan) {
      const lines = plan.split('\n');
      const extractedSections: { title: string; id: string }[] = [];
      
      lines.forEach(line => {
        if (line.startsWith('# ')) {
          const title = line.replace('# ', '');
          const id = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
          extractedSections.push({ title, id });
        } else if (line.startsWith('## ') && extractedSections.length === 0) {
          // If no main headers, use subheaders
          const title = line.replace('## ', '');
          const id = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
          extractedSections.push({ title, id });
        }
      });
      
      setSections(extractedSections);
    }
  }, [plan]);

  // Fetch feedbacks from Firestore
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const db = getFirestore();
        const feedbacksRef = collection(db, 'feedbacks');
        
        // Create a query against the feedbacks collection
        const q = query(
          feedbacksRef, 
          where('destination', '==', destination)
        );
        
        const querySnapshot = await getDocs(q);

        const feedbackList: Feedback[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.feedback) {
            feedbackList.push({
              id: doc.id,
              feedback: data.feedback,
              email: data.email || 'Anonymous traveler',
              date: data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleDateString() : 'Recent',
              rating: data.rating || 5,
              destination: data.destination,
              source: data.source,
              createdAt: data.createdAt
            });
          }
        });
        
        // Sort by date (newest first by default)
        const sortedFeedbacks = feedbackList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setFeedbacks(sortedFeedbacks);
        setFilteredFeedbacks(sortedFeedbacks);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setError('Error fetching feedbacks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      
      try {
        // Using our scraping function instead of an API
        const data = await scrapeWeatherData(destination);
        if (data) {
          setWeatherData(data);
        } else {
          setWeatherError("Unable to fetch weather data for this location.");
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setWeatherError("Failed to load weather data.");
      } finally {
        setWeatherLoading(false);
      }
    };

    if (destination) {
      fetchFeedbacks();
      fetchWeather();
    }
  }, [destination]);

  // Filter and sort feedbacks
  useEffect(() => {
    let result = [...feedbacks];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(feedback => 
        feedback.feedback.toLowerCase().includes(query) ||
        (feedback.email && feedback.email.toLowerCase().includes(query)) ||
        (feedback.source && feedback.source.toLowerCase().includes(query))
      );
    }
    
    // Apply rating filter
    if (filterRating !== null) {
      result = result.filter(feedback => 
        feedback.rating === filterRating
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt).getTime() : 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else { // rating
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      }
    });
    
    setFilteredFeedbacks(result);
  }, [feedbacks, searchQuery, sortBy, sortOrder, filterRating]);

  // Handle scrolling to sections
  const scrollToSection = (id: string) => {
    setCurrentSection(id);
    if (id === 'all') {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Toggle dialog visibility
  const toggleDialog = () => {
    setShowDialog(prev => !prev);
    // Reset filters when opening dialog
    if (!showDialog) {
      setSearchQuery('');
      setFilterRating(null);
      setSortBy('date');
      setSortOrder('desc');
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  // Toggle weather widget
  const toggleWeather = () => {
    setShowWeather(prev => !prev);
  };

  // Handle print function
  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #0369a1; margin-bottom: 20px;">${destination} Itinerary</h1>
        <div>${plan.replace(/\n/g, '<br>')}</div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Itinerary</title></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Change sort by
  const changeSortBy = (sort: 'date' | 'rating') => {
    setSortBy(sort);
  };

  // Set rating filter
  const setRatingFilter = (rating: number | null) => {
    setFilterRating(prev => prev === rating ? null : rating);
  };

  // Render star rating
  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex items-center text-yellow-500">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < rating ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
      </div>
    );
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <FaSun className="text-yellow-500" />;
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return <FaCloud className="text-gray-400" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
      return <FaCloudRain className="text-blue-400" />;
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet') || conditionLower.includes('ice')) {
      return <FaSnowflake className="text-blue-300" />;
    } else if (conditionLower.includes('wind') || conditionLower.includes('gale')) {
      return <FaWind className="text-gray-500" />;
    } else {
      return <FaCloudSun className="text-gray-500" />;
    }
  };

  // Get day of the week
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  };

  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  // Analyze weather conditions to provide travel recommendations
  const getTravelRecommendation = () => {
    if (!weatherData || !weatherData.forecast) return null;
    
    // Basic algorithm to determine if weather is good for travel
    const forecast = weatherData.forecast;
    const badWeatherDays = forecast.filter(day => {
      const condition = day.day.condition.toLowerCase();
      const rainChance = day.day.daily_chance_of_rain || 0;
      
      return (
        condition.includes('rain') || 
        condition.includes('storm') || 
        condition.includes('snow') ||
        rainChance > 60
      );
    });
    
    const goodDaysCount = forecast.length - badWeatherDays.length;
    
    if (badWeatherDays.length === 0) {
      return {
        recommendation: 'Great time to visit!',
        message: `The next ${forecast.length} days show excellent weather conditions for exploring ${destination}.`,
        icon: <FaCheckCircle className="text-green-500" />,
        className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      };
    } else if (badWeatherDays.length <= forecast.length / 3) {
      return {
        recommendation: 'Good time to visit with some caution',
        message: `Most days look good, but check the forecast for ${badWeatherDays.map(day => getDayOfWeek(day.date)).join(', ')} as weather may not be ideal.`,
        icon: <FaInfoCircle className="text-blue-500" />,
        className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      };
    } else if (badWeatherDays.length <= forecast.length / 2) {
      return {
        recommendation: 'Consider rescheduling some activities',
        message: `Several days have unfavorable weather. Plan indoor activities for ${badWeatherDays.map(day => getDayOfWeek(day.date)).join(', ')}.`,
        icon: <FaUmbrella className="text-yellow-500" />,
        className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      };
    } else {
      return {
        recommendation: 'Not the best time to visit',
        message: `Weather conditions look unfavorable for most of the next ${forecast.length} days. Consider postponing your trip if possible.`,
        icon: <FaExclamationTriangle className="text-red-500" />,
        className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      };
    }
  };

  // Animation variants
  const dialogVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 500 } },
    exit: { opacity: 0, y: 50 }
  };

  const feedbackItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  const weatherVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      marginTop: 16,
      transition: { duration: 0.3 } 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginTop: 0,
      transition: { duration: 0.3 } 
    }
  };

  const travelRecommendation = getTravelRecommendation();

  return (
    <>
      <motion.div
        className={`bg-gray-50 text-gray-900 dark:text-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden transition-all duration-500 ${expanded ? 'fixed inset-4 z-50 mt-16' : 'relative'}`}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        layout
      >
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FaMapMarkedAlt className="text-white text-2xl mr-3" />
              <h2 className="text-xl font-bold text-white">
                Your {destination} Itinerary
              </h2>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={toggleWeather}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title="Weather Forecast"
              >
                <FaCloudSun />
              </button>
              
              <button
                onClick={toggleExpanded}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title={expanded ? "Minimize" : "Expand"}
              >
                {expanded ? <FaChevronDown /> : <FaChevronUp />}
              </button>
              
              <button
                onClick={toggleDialog}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title="User Feedback"
              >
                <IoChatbubblesOutline />
                {feedbacks.length > 0 && (
                  <span className="ml-1 text-xs bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center">
                    {feedbacks.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title="Print Itinerary"
              >
                <FaPrint />
              </button>
            </div>
          </div>
          
          {/* Table of contents */}
          {sections.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => scrollToSection('all')}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                    currentSection === 'all' 
                      ? 'bg-white text-blue-600 font-medium' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Overview
                </button>
                
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                      currentSection === section.id 
                        ? 'bg-white text-blue-600 font-medium' 
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Weather Forecast Section */}
        <AnimatePresence>
          {showWeather && (
            <motion.div
              variants={weatherVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mx-6 overflow-hidden"
            >
              <div className="rounded-lg border border-blue-200 dark:border-blue-900">
                {weatherLoading ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : weatherError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300 text-center">
                    {weatherError}
                  </div>
                ) : weatherData ? (
                  <div className="overflow-hidden">
                    {/* Current Weather */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-full p-2 w-12 h-12 shadow-sm mr-4">
                            {getWeatherIcon(weatherData.current.condition)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Current Weather in {destination}</h3>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center flex-wrap">
                              <span className="mr-2">{weatherData.current.condition}</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <IoThermometer className="mr-1 text-red-500" />
                              <span>{weatherData.current.temp_c.toFixed(1)}°C</span>
                              
                              {weatherData.current.humidity && (
                                <>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <WiHumidity className="mr-1 text-blue-500 text-lg" />
                                  <span>{weatherData.current.humidity}%</span>
                                </>
                              )}
                              
                              {weatherData.current.wind_kph && (
                                <>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <WiStrongWind className="mr-1 text-gray-500 text-lg" />
                                  <span>{weatherData.current.wind_kph} km/h</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0">
                          <button 
                            onClick={toggleWeather}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                          >
                            Hide Forecast
                          </button>
                        </div>
                      </div>
                      
                      {/* 7-day forecast */}
                      <div className="mt-4 overflow-x-auto pb-2">
                        <div className="flex space-x-2 md:space-x-4">
                          {weatherData.forecast.map((day, index) => (
                            <div 
                              key={day.date}
                              className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 w-20 md:w-24 text-center"
                            >
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {index === 0 ? 'Today' : getDayOfWeek(day.date)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getFormattedDate(day.date)}
                              </p>
                              <div className="my-1 flex justify-center">
                                {getWeatherIcon(day.day.condition)}
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-blue-600 dark:text-blue-400">{day.day.mintemp_c.toFixed(0)}°</span>
                                <span className="text-red-600 dark:text-red-400">{day.day.maxtemp_c.toFixed(0)}°</span>
                              </div>
                              {day.day.daily_chance_of_rain && day.day.daily_chance_of_rain > 20 && (
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                  <FaUmbrella className="mr-1" />
                                  {day.day.daily_chance_of_rain}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Travel recommendation */}
                      {travelRecommendation && (
                        <div className={`mt-4 p-3 rounded-lg border ${travelRecommendation.className}`}>
                          <div className="flex items-start">
                            <div className="mr-3 mt-1">
                              {travelRecommendation.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {travelRecommendation.recommendation}
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {travelRecommendation.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div 
          // ref={contentRef}
          className={`p-6 overflow-auto ${expanded ? 'h-[calc(className={`p-6 overflow-auto ${expanded ? h-[calc(100%-12rem)]' : 'max-h-[700px]'}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            className="prose max-w-none dark:prose-invert prose-headings:scroll-mt-20"
            components={{
              h1: ({ node, ...props }) => <h1 id={props.children?.toString().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')} className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
              h2: ({ node, ...props }) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')} className="text-xl font-semibold text-blue-600 dark:text-blue-300 mt-6 mb-3" {...props} />,
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
              code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" {...props} />,
              pre: ({ node, ...props }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm my-4" {...props} />,
            }}
          >
            {plan}
          </ReactMarkdown>
          </div>

          {/* Quick feedback section at the bottom */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                <MdFeedback className="mr-2" /> 
                Traveler Feedback
              </h3>
              
              {loading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {error && <p className="text-red-500 mt-2">{error}</p>}
              
              {!loading && feedbacks.length === 0 && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  No feedback available for {destination} yet. Be the first to share your experience!
                </p>
              )}
              
              {!loading && feedbacks.length > 0 && (
                <div className="mt-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start mb-2">
                      <FaQuoteLeft className="text-blue-400 text-sm mt-1 mr-2 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        {feedbacks[0].feedback}
                      </p>
                      <FaQuoteRight className="text-blue-400 text-sm mt-1 ml-2 flex-shrink-0" />
                    </div>
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
                      <div className="flex items-center">
                        {renderStars(feedbacks[0].rating)}
                      </div>
                      <div>
                        — {feedbacks[0].email}, {feedbacks[0].date}
                      </div>
                    </div>
                  </div>
                  
                  {feedbacks.length > 1 && (
                    <button 
                      onClick={toggleDialog}
                      className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center justify-center w-full"
                    >
                      View all {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
      
      </motion.div>

      {/* Feedback Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDialog}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[80vh]"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <IoChatbubblesOutline className="mr-2" />
                  {feedbacks.length} Traveler Experience{feedbacks.length !== 1 ? 's' : ''} in {destination}
                </h2>
                <button 
                  onClick={toggleDialog}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <MdClose size={24} />
                </button>
              </div>
              
              {/* Search and filters */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        onChange={(e) => changeSortBy(e.target.value as 'date' | 'rating')}
                        value={sortBy}
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="date">Sort by date</option>
                        <option value="rating">Sort by rating</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <FaChevronDown className="text-gray-400 text-xs" />
                      </div>
                    </div>
                    
                    <button
                      onClick={toggleSortOrder}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sortOrder === 'desc' ? (
                        <FaChevronDown className="text-gray-500 dark:text-gray-300" />
                      ) : (
                        <FaChevronUp className="text-gray-500 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Rating filters */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 self-center mr-1">Filter by rating:</span>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setRatingFilter(rating)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 transition
                        ${filterRating === rating 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
                    >
                      <span>{rating}</span>
                      <FaStar className="text-yellow-500" />
                    </button>
                  ))}
                  
                  {filterRating !== null && (
                    <button
                      onClick={() => setRatingFilter(null)}
                      className="px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center space-x-1"
                    >
                      <span>Clear</span>
                      <MdClose />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-12rem)]">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {filteredFeedbacks.length === 0 ? (
                      <div className="text-center py-12">
                        {searchQuery || filterRating !== null ? (
                          <div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                              No feedbacks match your search criteria.
                            </p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setFilterRating(null);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              Clear filters
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            No feedbacks available for {destination} yet.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Showing {filteredFeedbacks.length} of {feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''}
                        </div>
                        <div className="space-y-4">
                          {filteredFeedbacks.map((feedback, index) => (
                            <motion.div
                              key={feedback.id || index}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                              variants={feedbackItemVariants}
                              initial="hidden"
                              animate="visible"
                              custom={index}
                            >
                              <div className="flex items-start mb-3">
                                <div className="bg-blue-500 text-white rounded-full p-2 mr-3 flex-shrink-0">
                                  {feedback.email?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {feedback.email}
                                    </p>
                                    <div className="flex items-center text-yellow-500">
                                      {renderStars(feedback.rating)}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    <span>{feedback.date}</span>
                                    {feedback.source && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                                          From: {feedback.source}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{feedback.feedback}</p>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PlanDisplay;