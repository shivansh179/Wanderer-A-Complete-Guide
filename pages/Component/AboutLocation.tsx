import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import remarkGfm from 'remark-gfm';
import { FaMapMarkerAlt, FaGlobe, FaChevronRight } from 'react-icons/fa';
import { useMemo } from 'react';
import axios from 'axios';

interface AboutLocationProps {
    destination: string;
    locationBio: string;
    sectionVariants: any;
    imageAlt?: string;
}

const AboutLocation: React.FC<AboutLocationProps> = ({ 
    destination, 
    locationBio, 
    sectionVariants, 
    imageAlt
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [destinationImage, setDestinationImage] = useState<string>('');
    const fallbackImage = "/images/default-location.jpg";
    const safeDestination = destination || "Unknown Location";

    // Fetch the destination image from an API (e.g., Pixabay)
    useEffect(() => {
        fetchAboutImage();
    }, [destination]);

    const fetchAboutImage = async () => {
        setDestinationImage(''); // Reset image while loading
        try {
            const response = await axios.get('https://pixabay.com/api/', {
                params: {
                    key: '33588047-ab7f2d7ec2a21089a0a35ce9f', 
                    q: destination,
                    image_type: 'photo'
                }
            });

            if (response.data.hits && response.data.hits.length > 0) {
                const imageUrl = response.data.hits[0].webformatURL;
                setDestinationImage(imageUrl);
            } else {
                setDestinationImage(fallbackImage); // Fallback if no images are found
            }
        } catch (error) {
            console.error("Error fetching image:", error);
            setDestinationImage(fallbackImage); // Use fallback in case of an error
        }
        setIsLoading(false); // Set loading to false after the request is done
    };

    // Memoize markdown rendering to prevent unnecessary re-renders
    const markdownContent = useMemo(() => (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {locationBio || "No bio available."}
        </ReactMarkdown>
    ), [locationBio]);

    const altText = imageAlt || `Image of ${safeDestination}`;

    return (
        <motion.div
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-3xl shadow-xl p-8 overflow-auto max-w-4xl mx-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-800 text-left">
                    <FaMapMarkerAlt className="inline-block mr-1 text-cyan-500" />
                    Discover {safeDestination}
                </h2>
            </div>

            <div className="flex flex-col items-center mb-8">
                {isLoading ? (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-cyan-200 rounded-full flex items-center justify-center">
                        <span className="text-cyan-800">Loading...</span>
                    </div>
                ) : (
                    <motion.img
                        src={destinationImage}
                        alt={altText}
                        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full shadow-lg border-4 border-cyan-200"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImage;
                        }}
                    />
                )}
                <p className="text-lg mt-2 font-semibold text-cyan-600">A Glimpse of Paradise</p>
            </div>

            <div className="text-gray-800 text-lg leading-relaxed prose prose-cyan max-w-none">
                {markdownContent}
            </div>

            <div className="mt-8 text-center">
                <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(safeDestination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300"
                >
                    Explore More <FaChevronRight className="ml-2" />
                </a>

                {locationBio && locationBio.includes('http') && (
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
