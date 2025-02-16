import React, { ReactNode, useState } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IoIosArrowDown, IoIosArrowDropup, IoIosArrowUp } from "react-icons/io";
import { IoIosArrowDropdown } from "react-icons/io";
import rehypeRaw from 'rehype-raw';
import xml2js from 'xml2js';
import Link from 'next/link';
import { Url } from 'url';


interface Image {
  largeImageURL: string;
  tags: string;
}

interface NewsItem {
  URL: Url;
  News: ReactNode;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
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
  const [imagePower, setImagePower] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);

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
      await fetchNews();
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setImages([]); // Clear images to indicate an error state
    }
  };

  const fetchNews = async () => {
    try {
      const response = await axios.get('https://www.amarujala.com/rss.xml'); // Call the API route
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);


      
      setNews(result.data.row);
      console.log("the news is ", result.data.row);

      setError(null);
    } catch (err) {
      setError('Failed to fetch RSS feed.');
    }
    setLoading(false);
  };


  const isActive = () =>{
    if(imagePower){
      setImagePower(false);
    }else{
      setImagePower(true);
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="grid lg:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto">
        {/* Left Column - Input Form */}
        <div className="bg-white rounded-xl shadow-xl p-6 h-fit">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Travel Planner</h1>
            <p className="text-gray-500">Craft your perfect itinerary with AI-powered suggestions</p>
          </div>

          <div className="space-y-5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={label}
                />
              </div>
            ))}

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              onClick={planFetcher}
              disabled={loading}
            >
              {loading ? (
                <ThreeDots height="24" width="24" color="#ffffff" />
              ) : (
                'Generate Travel Plan'
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-8">
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-xl p-8 text-center">
              <div className="flex flex-col items-center justify-center h-64">
                <ThreeDots height="40" width="40" color="#3b82f6" />
                <p className="mt-4 text-gray-600">Analyzing destinations and crafting your perfect itinerary...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-red-600 font-semibold mb-2">Error Generating Plan</h3>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Travel Plan */}
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


          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <button 
                onClick={isActive}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-700">
                  Destination Photos ({images.length})
                </span>
                {imagePower ? (
                  <IoIosArrowUp className="text-gray-500" />
                ) : (
                  <IoIosArrowDown className="text-gray-500" />
                )}
              </button>

              {imagePower && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={image.largeImageURL}
                          alt={image.tags}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
            </div>
          )}
            <div>
                  {news.map((data) => (
                    <div className='border-2 p-4 bg-indigo-400'>
                      <Link href={data.URL}>
                        <ol className='font-semibold '>{data.News}</ol>
                     </Link>
                    </div>
                  ))}
                </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
