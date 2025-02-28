import React, { useEffect, useState } from "react";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeOut(true), 3500); // Start fading out
    setTimeout(onFinish, 3000); // Hide after animation
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#D4F1F9] to-[#A6E1FA] transition-opacity duration-1000 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full animate-wave bg-wave opacity-10"></div>
      </div>

      {/* Logo & Text */}
      <div className="text-center relative z-10">
        <h1
          className="text-7xl md:text-8xl font-extrabold tracking-wide text-[#3d6384] relative"
          style={{
            textShadow: "0px 0px 15px rgba(255, 255, 255, 0.9)", // Glow effect
            WebkitTextStroke: "2px #ffffff", // White stroke for contrast
          }}
        >
          Wanderer
        </h1>
        <p className="text-lg text-gray-700 mt-4 opacity-80">Explore the world with us...</p>

        {/* Glassmorphism Effect */}
        <div className="mt-6 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-blue-900 shadow-lg">
          <p className="text-sm">Finding destinations...</p>
        </div>

        {/* Loading Dots Animation */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-3 h-3 bg-[#6099ca] rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#A6E1FA] rounded-full animate-bounce delay-150"></div>
          <div className="w-3 h-3 bg-[#D4F1F9] rounded-full animate-bounce delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
