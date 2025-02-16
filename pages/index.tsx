import React, { useState } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Image {
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
  const [images, setImages] = useState<Image[]>([]);

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

      // Fetch images for the destination
      await imageFetcher(destination);
    } catch (err: any) {
      console.error('Error fetching the plan:', err);
      setError(err.message || 'Failed to fetch the plan. Please try again.');
      setPlan(''); // Clear the plan to indicate an error state
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
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setImages([]); // Clear images to indicate an error state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-10 p-4">
        <h1 className="text-white text-4xl font-bold mb-6">Plan Your Perfect Trip</h1>

        {/* Input Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Trip Details</h2>
          <div className="space-y-4">
            {[{ label: "Start Location", state: startLocation, setState: setStartLocation },
              { label: "Destination", state: destination, setState: setDestination },
              { label: "Number of Days", state: days, setState: setDays },
              { label: "Budget", state: budget, setState: setBudget },
              { label: "Number of People", state: peopleCount, setState: setPeopleCount },
              { label: "Number of Ladies", state: ladiesCount, setState: setLadiesCount },
              { label: "Number of Elderly", state: elderlyCount, setState: setElderlyCount },
              { label: "Number of Children", state: childrenCount, setState: setChildrenCount }
            ].map(({ label, state, setState }, index) => (
              <div key={index}>
                <label className="block text-gray-700 font-semibold mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            ))}

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
            <ThreeDots height="80" width="80" radius="9" color="#ffffff" ariaLabel="three-dots-loading" visible={true} />
            <p className="text-white mt-4">Generating your trip plan...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 bg-red-200 border border-red-500 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Plan Display */}
        {plan && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose max-w-none"
              components={{
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-600 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-blue-500 mt-4 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-blue-800" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              }}
            >
              {plan}
            </ReactMarkdown>
          </div>
        )}


        {/* Image Section */}
        {images.length > 0 && (
          <>
            <h1 className="font-bold text-violet-200 text-3xl mt-10">Some Glimpse about your destination</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 p-4 sm:p-8">
              {images.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                    <img
                    src={image.largeImageURL}
                     alt={image.tags}
                    className="w-full cursor-pointer h-full object-cover rounded-lg hover:scale-110 transition-transform duration-300"
                    />      
                                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
