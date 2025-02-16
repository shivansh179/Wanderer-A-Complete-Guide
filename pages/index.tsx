import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism/dracula';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';


interface images {
  largeImageURL: string;
  tags: string;
   
}



const Index = () => {
 
  // State for form inputs
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [budget, setBudget] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [ladiesCount, setLadiesCount] = useState('');
  const [elderlyCount, setElderlyCount] = useState('');
  const [childrenCount, setChildrenCount] = useState('');
  const [images, setImages] = useState([]);

  // State for API response and loading
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Function to fetch the travel plan
  const planFetcher = async () => {
    setLoading(true);
    setError(null);
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
                  text: `I am planning a ${days}-day trip from ${startLocation} to ${destination} and we are total ${peopleCount} where the ladies are ${ladiesCount}, elders are ${elderlyCount} and childrens are ${childrenCount} and my budget is ${budget}. Please provide a detailed itinerary, including the best travel routes (by car, train, or flight), recommendations for must-visit places in ${destination}, the best activities to do in each location (e.g., sightseeing, adventure sports, cultural experiences), and an estimated budget breakdown for accommodation, transportation, food, and activities. Ensure the recommendations are suitable for a moderate budget traveler, considering all essential costs. Avoid vague or unrealistic suggestions. Reminder the plan should be under my budget.  Provide link of best images of ${destination}`
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

      const imageReponse = await axios.get(`https://pixabay.com/api/?key=33588047-ab7f2d7ec2a21089a0a35ce9f&q=${destination}&image_type=photo)`);
      console.log("imageResponse is ", imageReponse.data.hits);
      setImages(imageReponse.data.hits)
      
      const extractedPlan = response.data.candidates[0].content.parts[0].text;
      setPlan(extractedPlan);
    } catch (err: any) {
      console.error('Error fetching the plan:', err);
      setError(err.message || 'Failed to fetch the plan. Please try again.');
      setPlan(''); // Clear the plan to indicate an error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Gemini API key is missing. Please set the NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-10 p-4">
        <h1 className="text-white text-4xl font-bold mb-6">Plan Your Perfect Trip</h1>

        {/* Input Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Trip Details</h2>
          <div className="space-y-4">
            {/* Start Location */}
            <div>
              <label htmlFor="start" className="block text-gray-700 font-semibold mb-1">
                Start Location
              </label>
              <input
                type="text"
                id="start"
                placeholder="Enter your start location"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-gray-700 font-semibold mb-1">
                Destination
              </label>
              <input
                type="text"
                id="destination"
                placeholder="Enter your destination"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            {/* Days */}
            <div>
              <label htmlFor="days" className="block text-gray-700 font-semibold mb-1">
                Number of Days
              </label>
              <input
                type="text"
                id="days"
                placeholder="Enter number of days"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-gray-700 font-semibold mb-1">
                Budget
              </label>
              <input
                type="text"
                id="budget"
                placeholder="Enter your budget"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            {/* People Count */}
            <div>
              <label htmlFor="peopleCount" className="block text-gray-700 font-semibold mb-1">
                Number of People
              </label>
              <input
                type="text"
                id="peopleCount"
                placeholder="Enter number of people"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
              />
            </div>

            {/* Ladies Count */}
            <div>
              <label htmlFor="ladiesCount" className="block text-gray-700 font-semibold mb-1">
                Number of Ladies
              </label>
              <input
                type="text"
                id="ladiesCount"
                placeholder="Enter number of ladies"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={ladiesCount}
                onChange={(e) => setLadiesCount(e.target.value)}
              />
            </div>

            {/* Elderly Count */}
            <div>
              <label htmlFor="elderlyCount" className="block text-gray-700 font-semibold mb-1">
                Number of Elderly
              </label>
              <input
                type="text"
                id="elderlyCount"
                placeholder="Enter number of elderly"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={elderlyCount}
                onChange={(e) => setElderlyCount(e.target.value)}
              />
            </div>

            {/* Children Count */}
            <div>
              <label htmlFor="childrenCount" className="block text-gray-700 font-semibold mb-1">
                Number of Children
              </label>
              <input
                type="text"
                id="childrenCount"
                placeholder="Enter number of children"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition duration-300"
              onClick={planFetcher}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 flex flex-col items-center">
            <ThreeDots
              height="80"
              width="80"
              radius="9"
              color="#ffffff"
              ariaLabel="three-dots-loading"
              visible={true}
            />
            <p className="text-white mt-4">Generating your trip plan...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-8 bg-red-200 border border-red-500 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Plan Display */}
        {plan && !loading && !error && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter
                      style={dracula}
                      language={match[1]}
                      PreTag="div"
                       {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
              
            >
              {plan}
            </ReactMarkdown>
          </div>
        )}
      
      {images.length >0 ? (
      <h1 className='font-bold text-violet-200  text-3xl mt-10'>Some Glimpse about your destination</h1>
      ):(
        " "
      )}

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
    {images.map((image: images, index) => (
            <div key={index} className="overflow-hidden rounded-lg shadow-lg">
              <img src={image.largeImageURL} alt={image.tags} className="w-full h-full object-cover" />
            </div>
          ))}
    </div>


      </div>
    </div>
  );
};

export default Index;
