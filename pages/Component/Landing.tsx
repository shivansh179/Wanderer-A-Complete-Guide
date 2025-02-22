import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import InputForm from './InputForm';
import ResultsSection from './ResultsSection';
import { Image, NewsItem, Video } from '@/types/types';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <>
      <Navbar />
      <div>
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-center items-center px-4 py-10">
          <div className="md:w-1/2 gap-6 md:gap-8 text-center md:text-left md:ml-20 ">
            <h1 className="font-bold text-4xl md:text-6xl leading-tight">
              Let's Explore <br />
              <span className="text-cyan-600">Wonderful</span> <br /> World's Beauty
            </h1>
            <p className="text-lg md:text-2xl text-gray-700 mt-4">
              Uncover hidden gems and create unforgettable memories. Your journey starts here. We offer curated travel experiences to inspire and delight.
            </p>
            <div className="flex justify-center md:justify-start gap-4 mt-6">
              <button className="px-6 py-3 bg-cyan-600 text-white rounded-full transition hover:bg-cyan-500">
                Book Now
              </button>
              <button className="px-6 py-3 font-medium border border-cyan-600 rounded-full text-cyan-600 hover:bg-cyan-100 transition">
                More Destinations
              </button>
            </div>
          </div>
          <div className="flex md:w-1/2 justify-center mt-8 md:mt-0">
            <img
              src="/traveler.jpg"
              alt="Traveler"
              className="rounded-lg w-full object-cover shadow-lg md:h-96 md:mt-40"
            />
          </div>
        </div>

        {/* Section 2: Featured Destinations */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
              Featured Destinations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Destination 1 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/paris.jpg"
                  alt="Destination 1"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Paris, France</h3>
                  <p className="text-gray-700">
                    Experience the romance of the Eiffel Tower and the charm of Parisian cafes.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Paris
                  </button>
                </div>
              </div>

              {/* Destination 2 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/tokyo.jpg"
                  alt="Destination 2"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Kyoto, Japan</h3>
                  <p className="text-gray-700">
                    Discover ancient temples, serene gardens, and the beauty of Japanese culture.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Kyoto
                  </button>
                </div>
              </div>

              {/* Destination 3 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/pachu.jpg"
                  alt="Destination 3"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Machu Picchu, Peru</h3>
                  <p className="text-gray-700">
                    Hike through breathtaking landscapes to the lost city of the Incas.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Machu Picchu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Image and Text (Alternating Layout) */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <img
                  src="/adventure.jpg"
                  alt="Adventure 1"
                  className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96"
                />
              </div>
              <div className="md:w-1/2 text-center md:text-left">
                <h2 className="font-semibold text-4xl md:text-6xl text-gray-800 mb-4">
                  Unleash Your Inner Adventurer
                </h2>
                <p className="text-gray-700 font-bold leading-relaxed">
                  Embark on thrilling adventures that will push your limits and create lasting memories. From hiking through rainforests to exploring ancient ruins, we have an adventure for everyone.
                </p>
                <ul className="list-disc list-inside mt-4 text-gray-700">
                  <li>Guided Tours</li>
                  <li>Expert Local Guides</li>
                  <li>Customizable Itineraries</li>
                  <li>Sustainable Travel Practices</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Image and Text (Reverse Order) */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2 order-2 md:order-1 text-center md:text-left">
                <h2 className="font-semibold text-4xl md:text-6xl text-gray-800 mb-4">
                  Discover Hidden Gems
                </h2>
                <p className="text-gray-700 font-bold leading-relaxed">
                  Venture off the beaten path and discover the world's best-kept secrets. Our local experts will guide you to unique and authentic experiences.
                </p>
                <p className="text-gray-700 mt-4 leading-relaxed">
                  Support local communities and immerse yourself in the culture of your destination.
                </p>
              </div>
              <div className="md:w-1/2 order-1 md:order-2">
                <img
                  src="/trekking.jpg"
                  alt="Culture 1"
                  className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default Index;
