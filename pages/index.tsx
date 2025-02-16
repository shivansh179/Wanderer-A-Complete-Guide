import React, { useState } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner'; // Add a loading spinner package if needed

const Index = () => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('');
  const [plan, setPlan] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';


  
  const planFetcher = async () => {
    setLoading(true); // Start loading animation
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `I am planning a ${days}-day trip from ${startLocation} to ${destination} and my budget is ${budget}. Please provide a detailed itinerary, including the best travel routes (by car, train, or flight), recommendations for must-visit places in ${destination}, the best activities to do in each location (e.g., sightseeing, adventure sports, cultural experiences), and an estimated budget breakdown for accommodation, transportation, food, and activities. Ensure the recommendations are suitable for a moderate budget traveler, considering all essential costs. Avoid vague or unrealistic suggestions. Reminder the plan should be under my budget.`
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
      // Extracting the content correctly
      const extractedPlan = response.data.candidates[0].content.parts[0].text;
      setPlan(extractedPlan);
    } catch (error) {
      console.error('Error fetching the plan:', error);
      setPlan('Failed to fetch the plan. Please try again.');
    }
    setLoading(false); // Stop loading animation
  };

  const weatherFetcher = async () => {
        try{
              const response = axios.get(
                `https://meteostat.p.rapidapi.com/point/monthly`,

              )
        }catch{

        }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-10">
        <h1 className="text-red text-4xl font-bold mb-6">Find Your Plan</h1>

        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
          <div className="mb-6">
            <label htmlFor="start" className="block text-gray-700 font-semibold mb-2">
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

          <div className="mb-6">
            <label htmlFor="destination" className="block text-gray-700 font-semibold mb-2">
              Destination Location
            </label>
            <input
              type="text"
              id="destination"
              placeholder="Enter your destination location"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="days" className="block text-gray-700 font-semibold mb-2">
              Enter Staying Days
            </label>
            <input
              type="text"
              id="days"
              placeholder="Enter your staying days"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="days" className="block text-gray-700 font-semibold mb-2">
              Enter Your Budget
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

          <button
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition duration-300"
            onClick={planFetcher}
          >
            Find Plan
          </button>
        </div>

        {loading ? (
          <div className="mt-8">
            <ThreeDots 
              height="80" 
              width="80" 
              radius="9"
              color="#ffffff"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
            />
            <p className="text-white mt-4">Loading your trip plan...</p>
          </div>
        ) : (
          plan && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Your Travel Plan</h2>
              <p className="text-gray-600 whitespace-pre-line">{plan}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  return {
    props: {
      initialPlan: '',
    }
  };
}

export default Index;

