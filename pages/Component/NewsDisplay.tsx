import React from 'react';
import { motion } from 'framer-motion';
import { IoIosArrowDown } from "react-icons/io";

interface NewsDisplayProps {
    news: any[]; // Replace `any` with your NewsItem interface
    destination: string;
    sectionVariants: any;
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({ news = [], destination, sectionVariants }) => { // Provide a default value
    return (
        <motion.div
            className="bg-white rounded-3xl shadow-md p-6  h-108 overflow-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <h2 className="text-2xl sm:text-3xl font-semibold text-cyan-700 mb-4">
                What's Happening in {destination}
            </h2>
            <ul className="space-y-4">
                {news.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                        <div className='flex gap-2'>
                        <img src={item.image} alt="" className='rounded-lg h-48'/>
                       
                        <div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-cyan-600 hover:underline text-lg"
                            >
                                {item.title}
                            </a>
                            <p className="text-gray-600 text-base leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                         </div>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

export default NewsDisplay;