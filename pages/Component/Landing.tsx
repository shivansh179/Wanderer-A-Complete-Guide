import React, { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/pages/Component/Navbar";
import SplashScreen from "@/pages/Component/SplashScreen";
import Footer from "@/pages/Component/Footer";
import Destination from "@/pages/Destinations";
const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter(); // ✅ Corrected placement

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <Navbar />
      <div>
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row justify-center items-center px-8 py-16 bg-gradient-to-b from-gray-100 to-gray-300">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="font-extrabold text-5xl md:text-7xl leading-tight text-[#1e3a5f]">
              Discover <span className="text-[#147c8c]">Extraordinary</span> Destinations
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mt-4">
              Elevate your travel experience with handpicked destinations, tailored experiences, and seamless journeys.
            </p>
            <div className="flex justify-center md:justify-start gap-4 mt-6">
              <button className="px-6 py-3 bg-[#1e3a5f] text-white font-semibold rounded-md transition hover:bg-[#147c8c] shadow-md">
                Start Exploring
              </button>
              <button
                className="px-6 py-3 font-medium border border-blue-700 text-blue-700 rounded-lg hover:bg-blue-100 transition shadow-md"
                onClick={() => router.push("/Destinations")} // ✅ Corrected button
              >
                View Destinations
              </button>
            </div>
          </div>
          <div className="flex md:w-1/2 justify-center mt-8 md:mt-0">
            <img
              src="/traveler.jpg"
              alt="Traveler"
              className="rounded-lg w-full object-cover shadow-lg md:h-96"
            />
          </div>
        </section>

        {/* Featured Destinations */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-8">
            <h2 className="text-4xl font-semibold text-center mb-8 text-[#1e3a5f]">
              Featured Destinations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: "Paris, France", img: "/paris.jpg", desc: "Indulge in world-class art, cuisine, and architecture." },
                { name: "Kyoto, Japan", img: "/tokyo.jpg", desc: "Immerse yourself in ancient temples and timeless traditions." },
                { name: "Machu Picchu, Peru", img: "/pachu.jpg", desc: "Uncover the secrets of the lost Incan city." }
              ].map((dest, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                  <img src={dest.img} alt={dest.name} className="w-full h-56 object-cover" />
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold text-[#1e3a5f] mb-2">{dest.name}</h3>
                    <p className="text-gray-700">{dest.desc}</p>
                    <button className="mt-4 px-5 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#147c8c] transition">
                      Explore {dest.name.split(",")[0]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Adventure Section */}
        <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-300">
          <div className="container mx-auto px-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <img src="/adventure.jpg" alt="Adventure" className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96" />
              </div>
              <div className="md:w-1/2 text-center md:text-left">
                <h2 className="font-semibold text-5xl md:text-6xl text-[#1e3a5f] mb-4">
                  Embrace the Thrill of Exploration
                </h2>
                <p className="text-gray-700 text-lg">
                  Whether it’s trekking through the Himalayas or diving into coral reefs, adventure awaits.
                </p>
                <ul className="list-disc list-inside mt-4 text-gray-700">
                  <li>Expert-led expeditions</li>
                  <li>Authentic cultural experiences</li>
                  <li>Personalized travel itineraries</li>
                  <li>Sustainable and eco-friendly options</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Hidden Gems Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2 text-center md:text-left">
                <h2 className="font-semibold text-4xl md:text-6xl text-[#1e3a5f] mb-4">
                  Discover Hidden Wonders
                </h2>
                <p className="text-gray-700">
                  Venture beyond the mainstream and uncover destinations that few travelers have explored.
                </p>
              </div>
              <div className="md:w-1/2">
                <img
                  src="/trekking.jpg"
                  alt="Hidden Gems"
                  className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default Index;
