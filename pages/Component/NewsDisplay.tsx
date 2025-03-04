"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CiImageOn } from "react-icons/ci";

interface NewsItem {
    title: string;
    description: string;
    imageUrl: string;
    link: string;
}

interface NewsDisplayProps {
    news: NewsItem[];
    destination?: string;
    sectionVariants: any;
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({ news = [], destination = "your area", sectionVariants }) => {
    return (
        <motion.div
            className="bg-white rounded-3xl shadow-md p-6 h-auto overflow-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <h2 className="text-2xl sm:text-3xl font-semibold text-cyan-700 mb-4">
                What's Happening in {destination}
            </h2>
            <ul className="space-y-4">
                {news.map((item, index) => {
                    const [imageError, setImageError] = useState(false);
                    const imageUrl = item.imageUrl.startsWith('//th')
                        ? `https:${item.imageUrl}`
                        : `https://www.bing.com${item.imageUrl}`;

                    return (
                        <li key={index} className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex gap-2 sm:w-1/3 justify-center">
                                {!imageError ? (
                                    <img
                                        src={imageUrl}
                                        alt="News"
                                        className="rounded-lg w-full sm:w-48 h-48 object-cover"
                                        loading="lazy"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="border-2 rounded-lg border-gray-600 p-24">
                                        <CiImageOn className="text-gray-400 text-6xl" />
                                    </div>
                                )}
                            </div>
                            <div className="sm:w-2/3">
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-cyan-600 hover:underline text-lg sm:text-xl"
                                >
                                    {item.title}
                                </a>
                                <p className="text-gray-600 text-base leading-relaxed mt-2 sm:text-lg">
                                    {item.description}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </motion.div>
    );
};

export default NewsDisplay;
