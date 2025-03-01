import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import remarkGfm from 'remark-gfm';
import { FaMapMarkerAlt, FaGlobe, FaChevronRight } from 'react-icons/fa'; // React Icons
import { useMemo } from 'react'; // For memoization
import Image from 'next/image'; // Next.js Image optimization (if using Next.js)

interface AboutLocationProps {
    locationImage: string;
    destination: string;
    locationBio: string;
    sectionVariants: any;
    imageAlt?: string; // Optional image description for accessibility
}

const AboutLocation: React.FC<AboutLocationProps> = ({ locationImage, destination, locationBio, sectionVariants, imageAlt }) => {

    const fallbackImage = "/images/default-location.jpg";  // Store fallback image URL
    const safeDestination = destination || "Unknown Location"; // Store default value for destination

    // Memoize markdown rendering to prevent unnecessary re-renders
    const markdownContent = useMemo(() => (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {locationBio || "No bio available."}
        </ReactMarkdown>
    ), [locationBio]);

    const altText = imageAlt || `Image of ${safeDestination}`; //Use imageAlt prop or fall back on Destination value

    return (
        <motion.div
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-3xl shadow-xl p-8 overflow-auto max-w-4xl mx-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div className="flex items-center justify-between mb-6"> {/* Flex container for title and icon */}
                <h2 className="text-3xl sm:text-4xl font-extrabold text-cyan-800 text-left">
                    <FaMapMarkerAlt className="inline-block mr-2 text-cyan-500" /> {/* Map icon */}
                    Discover {safeDestination}
                </h2>
            </div>

            <div className="flex flex-col items-center mb-8">
              {/* Conditional rendering based on Next.js usage */}
              {typeof Image === 'undefined' ? (
                    <motion.img
                        src={locationImage || fallbackImage}
                        alt={altText}
                        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full shadow-lg border-4 border-cyan-200"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                            e.currentTarget.onerror = null; // prevents looping
                            e.currentTarget.src=fallbackImage;
                        }}
                    />
                ) : (
                    <motion.div
                        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-lg border-4 border-cyan-200"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* <Image
                            src="https://indiano.travel/wp-content/uploads/2022/09/Beautiful-View-of-Gulmarg-Town.jpg"
                            alt={altText}
                            layout="fill"
                            objectFit="cover"
                            onError={(e) => {
                                e.currentTarget.onerror = null; // prevents looping
                                (e.currentTarget as HTMLImageElement).src=fallbackImage;
                            }}
                        /> */}
                    </motion.div>
                )}
                <p className="text-lg mt-2 font-semibold text-cyan-600">A Glimpse of Paradise</p>
            </div>

            <div className="text-gray-800 text-lg leading-relaxed prose prose-cyan max-w-none">
                {markdownContent}
            </div>

            <div className="mt-8 text-center">
                <a
                    href={`https://www.google.com/search?q=${safeDestination}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300"
                >
                    Explore More <FaChevronRight className="ml-2" />
                </a>

                {/* Optional external link */}
                {locationBio && locationBio.includes('http') && (  // Ensure locationBio exists before using includes
                  <a
                    href={locationBio.match(/(https?:\/\/[^\s]+)/)?.[0] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ml-4"
                  >
                    Visit Website <FaGlobe className="ml-2" />
                  </a>
                )}
            </div>
        </motion.div>
    );
};

export default AboutLocation;
