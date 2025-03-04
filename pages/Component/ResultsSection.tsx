"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import PlanDisplay from './PlanDisplay';
import PhotoGallery from './Gallery';
import NewsDisplay from './NewsDisplay';
import AboutLocation from './AboutLocation';

interface ResultsSectionProps {
    loading: boolean;
    error: string | null;
    plan: string;
    activeSection: 'plan' | 'about' | 'photos' | 'news';
    setActiveSection: (section: 'plan' | 'about' | 'photos' | 'news') => void;
    planGenerated: boolean;
    news: any[]; // Replace `any` with the actual type of your news data
    locationImage: string;
    locationBio: string;
    location: string;
    images: any[]; // Replace `any` with the actual type of your image data
    imageLoading: boolean;
    hasMore: boolean;
    loadMore: () => void;
    fetchNewsForDestination: (destination: string) => Promise<void>;
    destination: string;
    videos: any[];    previousValue:string;
    fetchVideos: () => Promise<void>;
    activeMediaType: 'photos' | 'videos';
    switchMediaType: (type: 'photos' | 'videos') => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
    loading,
    error,
    plan,
    activeSection,
    setActiveSection,
    location,
    planGenerated,
    news,
    locationImage,
    locationBio,
    images,
    imageLoading,
    hasMore,
    loadMore,
    fetchNewsForDestination,
    destination,
    videos,
    fetchVideos,
    previousValue,
    activeMediaType,
    switchMediaType,
}) => {

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const underlineAnimation = useSpring({
        width: activeSection ? '100%' : '0%',
        config: { tension: 300, friction: 20 },
    });

    return (
        <div className="space-y-6">
            {/* Navigation Bar for Desktop */}
            <div className="flex bg-white rounded-3xl dark:bg-gray-800 shadow-md p-4 space-x-2 items-center">
                {['plan', 'about', 'photos', 'news'].map((section) => (
                    <div key={section} className="relative">
                        <motion.button
                            className={`py-2 px-4 rounded-full dark:text-cyan-400 text-base font-medium ${activeSection === section ? 'text-cyan-300 font-bold' : 'text-gray-600 hover:text-cyan-500'} transition-colors duration-300 focus:outline-none`}
                            onClick={() => setActiveSection(section as 'plan' | 'about' | 'photos' | 'news')}
                            disabled={loading || (section === 'news' && !planGenerated)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                        </motion.button>
                        {activeSection === section && (
                            <animated.div
                                style={underlineAnimation}
                            />
                        )}
                    </div>
                ))}
            </div>
             {/* Loading State */}
             {loading && (
                <motion.div
                    className="bg-white rounded-3xl shadow-md p-6 text-center"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <div className="flex flex-col items-center justify-center h-48">
                        {/* <ThreeDots height="40" width="40" color="#6366F1" />
                        <p className="mt-4 text-gray-600 text-lg">
                            Summoning the travel spirits...
                        </p> */}
                        Loading...
                    </div>
                </motion.div>
            )}
            {/* Error State */}
            {error && (
                <motion.div
                    className="bg-white rounded-3xl shadow-md p-6 text-center"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <p className="text-red-500 font-medium text-lg">
                        Oops! Something went wrong: {error}
                    </p>
                </motion.div>
            )}

            {activeSection === 'plan' && plan && (
                <PlanDisplay plan={plan} sectionVariants={sectionVariants} destination={destination}/>
            )}

            {activeSection === 'photos' && (
                <PhotoGallery
                    images={images}
                    imageLoading={imageLoading}
                    hasMore={hasMore}
                    loadMore={loadMore}
                    destination={destination}
                    videos={videos}
                    fetchVideos={fetchVideos}
                    previousValue={previousValue}
                    activeMediaType={activeMediaType}
                    switchMediaType={switchMediaType}
                    sectionVariants={sectionVariants}
                />
            )}

            {activeSection === 'about' && !loading && locationBio && (
                <AboutLocation
                     destination={destination}
                    locationBio={locationBio}
                    sectionVariants={sectionVariants}
                />
            )}

            {activeSection === 'news' && !loading && news.length > 0 && (
                <NewsDisplay news={news} destination={location} sectionVariants={sectionVariants} />
            )}

        </div>
    );
};

export default ResultsSection;