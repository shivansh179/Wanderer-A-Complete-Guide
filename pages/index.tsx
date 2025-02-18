import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IoIosArrowDown } from "react-icons/io";
import rehypeRaw from 'rehype-raw';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';

interface Image {
  largeImageURL: string;
  tags: string;
}

interface NewsItem {
  [x: string]: any;
  title: string;
  link: string;
  description: string;
}

const Index = () => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [budget, setBudget] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [ladiesCount, setLadiesCount] = useState('');
  const [elderlyCount, setElderlyCount] = useState('');
  const [childrenCount, setChildrenCount] = useState('');
  const [images, setImages] = useState<Image[]>([]);
  const [imagePower, setImagePower] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [locationImage, setLocationImage] = useState('');
  const [locationBio, setLocationBio] = useState('');

  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
  const [planGenerated, setPlanGenerated] = useState(false);

  // Animation for active section underline
  const underlineAnimation = useSpring({
    width: activeSection ? '100%' : '0%',
    config: { tension: 300, friction: 20 },
  });

  const planFetcher = async () => {
    setLoading(true);
    setError(null);
    setPlanGenerated(true);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing. Please set the NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `I am planning a ${days}-day trip from ${startLocation} to ${destination} and we are total ${peopleCount}, where the ladies are ${ladiesCount}, elders are ${elderlyCount}, and children are ${childrenCount}. My budget is ${budget}. Please provide a detailed itinerary, including travel routes, must-visit places, activities, and an estimated budget breakdown. Ensure it fits within my budget and provide links to relevant images.`
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const extractedPlan = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No plan generated.';
      setPlan(extractedPlan);

      await imageFetcher(destination);
      setActiveSection('plan');
    } catch (err: any) {
      console.error('Error fetching the plan:', err);
      setError(err.message || 'Failed to fetch the plan. Please try again.');
      setPlan('');
    } finally {
      setLoading(false);
    }
  };

  const imageFetcher = async (query: string) => {
    try {
      const imageResponse = await axios.get(
        `https://pixabay.com/api/?key=33588047-ab7f2d7ec2a21089a0a35ce9f&q=${query}&image_type=photo`
      );
      setImages(imageResponse.data.hits || []);
      fetchNewsForDestination(destination);
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setImages([]);
    }
  };

  const fetchNewsForDestination = async (destination: string) => {
    setLoadingNews(true);
    setError(null);

    try {
      const response = await axios.post('/api/news', { location: destination });
      if(response.status === 500){
          alert("It is just a reminder !!! Try providing the complete name of destination for better experience");
      }
      if (response.status === 200) {
        setNews(response.data);
        console.log("the news are ", response.data);
        // Extract image and bio from the end of the array
        const lastItem = response.data[response.data.length - 2];
        const secondLastItem = response.data[response.data.length - 1];

        if (lastItem && lastItem.image) {
          setLocationImage(lastItem.image.url);
        }

        if (secondLastItem && secondLastItem.bio) {
          setLocationBio(secondLastItem.bio);
        }
      } else {
        setError('Failed to fetch news.');
        console.error('Error fetching news:', response.status, response.data);
        setNews([]);
      }
    } catch (error) {
      setError('Failed to fetch news.');
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    if (planGenerated && destination) {
      fetchNewsForDestination(destination);
    }
  }, [destination, planGenerated]);

  const isActive = () => {
    setImagePower(!imagePower);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>      
      <Navbar />
      <motion.div
        className="min-h-screen bg-gradient-to-br sm:w-full from-blue-50 to-blue-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Navigation Bar for Mobile */}
        <div className="lg:hidden bg-white  p-6 shadow-lg flex justify-center space-x-3 items-center sticky top-0 z-50">
          {['plan', 'about', 'photos', 'news'].map((section) => (
            <div key={section} className="relative">
              <motion.button
                className={`py-3 px-6 rounded-full text-lg font-semibold ${activeSection === section ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
                onClick={() => setActiveSection(section as 'plan' | 'about' | 'photos' | 'news')}
                disabled={loading || (section === 'news' && !planGenerated)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </motion.button>
              {activeSection === section && (
                <animated.div
                  style={underlineAnimation}
                  // className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full"
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 p-8 max-w-7xl mx-auto">
          {/* Left Column - Input Form */}
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 h-fit"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">
                Dream Weaver: Your AI Trip Planner
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Unlock unforgettable journeys with personalized AI-powered itineraries.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { label: "Starting Point", state: startLocation, setState: setStartLocation },
                { label: "Destination", state: destination, setState: setDestination },
                { label: "Trip Duration (Days)", state: days, setState: setDays, type: "number" },
                { label: "Total Budget", state: budget, setState: setBudget, type: "number" },
                { label: "Total Travelers", state: peopleCount, setState: setPeopleCount, type: "number" },
                { label: "Female Travelers", state: ladiesCount, setState: setLadiesCount, type: "number" },
                { label: "Senior Travelers", state: elderlyCount, setState: setElderlyCount, type: "number" },
                { label: "Children", state: childrenCount, setState: setChildrenCount, type: "number" }
              ].map(({ label, state, setState, type = "text" }, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input
                    type={type}
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                  />
                </div>
              ))}

              <motion.button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={planFetcher}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <ThreeDots height="28" width="28" color="#ffffff" />
                ) : (
                  'Craft My Adventure'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <div className="space-y-8 lg:ml-5">
            {/* Navigation Bar for Desktop */}
            <div className="lg:flex bg-white rounded-3xl hidden shadow-2xl p-6  space-x-5 items-center">
              {['plan', 'about', 'photos', 'news'].map((section) => (
                <div key={section} className="relative">
                  <motion.button
                    className={`py-3 px-6 rounded-full text-lg font-semibold ${activeSection === section ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
                    onClick={() => setActiveSection(section as 'plan' | 'about' | 'photos' | 'news')}
                    disabled={loading || (section === 'news' && !planGenerated)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </motion.button>
                  {activeSection === section && (
                    <animated.div
                      style={underlineAnimation}
                      // className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 text-center"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="flex flex-col items-center justify-center h-64">
                  <ThreeDots height="50" width="50" color="#6366F1" />
                  <p className="mt-5 text-gray-600 text-lg">
                    Summoning the travel spirits...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 text-center"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <p className="text-red-500 font-medium text-lg">
                  Oops! Something went wrong: {error}
                </p>
              </motion.div>
            )}

            {/* Plan Section */}
            {activeSection === 'plan' && plan && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 w-full h-120 max-w-4xl overflow-auto"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-3xl font-semibold text-blue-700 mb-6">
                  Your Personalized Itinerary
                </h2>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="prose max-w-none"
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-blue-700 mb-5" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-blue-600 mt-5 mb-3" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-8 mb-5 space-y-3" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-8 mb-5 space-y-3" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-blue-800" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                  }}
                >
                  {plan}
                </ReactMarkdown>
              </motion.div>
            )}

            {/* Photos Section */}
            {activeSection === 'photos' && !loading && images.length > 0 && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 h-120 overflow-auto"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-3xl font-semibold text-blue-700 mb-6">
                  {destination.charAt(0).toUpperCase()+destination.slice(1)} Through the Lens
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <img src={image.largeImageURL} alt={image.tags} className="w-full h-auto object-cover" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* About Section */}
            {activeSection === 'about' && !loadingNews && locationBio && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 h-120 overflow-auto"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-3xl font-semibold text-blue-700 mb-6">
                  Discover {destination}
                </h2>
                <div className="flex flex-col items-center">
                  <motion.img
                    src={locationImage}
                    alt={`${destination} image`}
                    className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-full shadow-md mb-5"
                    whileHover={{ scale: 1.1 }}
                  />
                  <p className="text-gray-600 text-center text-lg leading-relaxed">
                    {locationBio}
                  </p>
                </div>
              </motion.div>
            )}

            {/* News Section */}
            {activeSection === 'news' && !loadingNews && news.length > 0 && (
              <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 h-120 overflow-auto"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-3xl font-semibold text-blue-700 mb-6">
                  What's Happening in {destination}
                </h2>
                <ul className="space-y-5">
                  {news.map((item, index) => (
                    <li key={index} className="flex items-start space-x-4">
                      <IoIosArrowDown className="mt-1 text-blue-500 text-xl" />
                      <div>
                        <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-blue-600 hover:underline text-lg"
                      >
                        {item.title}
                      </a>
                      <p className="text-gray-600 text-base leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default Index;