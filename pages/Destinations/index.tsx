import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "@/pages/Component/Navbar";
import Footer from "@/pages/Component/Footer";

// Dummy authentication check function (Replace with real auth logic)
const checkAuth = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("isAuthenticated") === "true";
  }
  return false;
};

// List of destinations
const destinationsList = [
  {
    name: "Paris, France",
    img: "/paris.jpg",
    desc: "Indulge in world-class art, cuisine, and architecture.",
  },
  {
    name: "Kyoto, Japan",
    img: "/tokyo.jpg",
    desc: "Immerse yourself in ancient temples and timeless traditions.",
  },
  {
    name: "Machu Picchu, Peru",
    img: "/pachu.jpg",
    desc: "Uncover the secrets of the lost Incan city.",
  },
  {
    name: "Santorini, Greece",
    img: "/greece.jpg",
    desc: "Experience breathtaking sunsets over the Aegean Sea.",
  },
  {
    name: "Bali, Indonesia",
    img: "/bali.jpg",
    desc: "Relax in paradise with pristine beaches and lush jungles.",
  },
];

const Destinations = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication when component mounts
  useEffect(() => {
    setIsAuthenticated(checkAuth());
  }, []);

  // Handle button click
  const handlePlanTrip = () => {
    if (isAuthenticated) {
      router.push("/Planner"); // Redirect to Planner if authenticated
    } else {
      router.push("/Signup"); // Redirect to Signup if not authenticated
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold text-center text-blue-900 mb-12">
            Explore Breathtaking Destinations
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinationsList.map((destination, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
              >
                <img
                  src={destination.img}
                  alt={destination.name}
                  className="w-full h-56 object-cover"
                />
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-blue-900 mb-2">
                    {destination.name}
                  </h2>
                  <p className="text-gray-700">{destination.desc}</p>
                  <button
                    onClick={handlePlanTrip}
                    className="mt-4 px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Plan Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Destinations;
