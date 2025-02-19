import React from 'react';
import { motion } from 'framer-motion';

interface AboutLocationProps {
    locationImage: string;
    destination: string;
    locationBio: string;
    sectionVariants: any;
}

const AboutLocation: React.FC<AboutLocationProps> = ({ locationImage, destination, locationBio, sectionVariants }) => {
    return (
        <motion.div
            className="bg-white rounded-3xl shadow-md p-6 overflow-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-4">
                Discover {destination}
            </h2>
            <div className="flex flex-col items-center">
                <motion.img
                    src={locationImage}
                    alt={`${destination} image`}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full shadow-md mb-4"
                    whileHover={{ scale: 1.1 }}
                />
                <p className="text-gray-600 text-center text-lg leading-relaxed">
                    {locationBio}
                </p>
            </div>
        </motion.div>
    );
};

export default AboutLocation;