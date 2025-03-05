"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CiImageOn } from "react-icons/ci";
import { FaRegNewspaper, FaExternalLinkAlt, FaRegBookmark, FaBookmark, FaShare, FaCalendarAlt, FaRegClock, FaChevronRight } from "react-icons/fa";
import { MdTravelExplore } from "react-icons/md";

interface NewsItem {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  source?: string;
  publishedAt?: string;
}

interface NewsDisplayProps {
  news: NewsItem[];
  destination?: string;
  sectionVariants: any;
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({ news = [], destination = "your area", sectionVariants }) => {
  const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'empty'>('loading');
  const [imageErrorStates, setImageErrorStates] = useState<boolean[]>([]); // State to track image errors for each news item

  // Initialize image error states when news items change
  useEffect(() => {
    setImageErrorStates(new Array(news.length).fill(false));
  }, [news]);


  // Simulate loading state for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingState(news.length > 0 ? 'success' : 'empty');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [news]);

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Recent';
    }
  };

  // Toggle saving an article
  const toggleSaveArticle = (index: number) => {
    const newSaved = new Set(savedArticles);
    if (newSaved.has(index)) {
      newSaved.delete(index);
    } else {
      newSaved.add(index);
    }
    setSavedArticles(newSaved);
  };

  // Open article modal
  const openArticleModal = (article: NewsItem) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  // Close article modal
  const closeArticleModal = () => {
    setIsArticleModalOpen(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  const handleImageError = (index: number) => {
    setImageErrorStates(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };


  return (
    <>
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Header with destination name */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center">
            <FaRegNewspaper className="text-white text-2xl mr-3" />
            <h2 className="text-xl font-bold text-white">
              Latest News from {destination}
            </h2>
          </div>
        </div>

        {/* News content */}
        <div className="p-6">
          {/* Loading state */}
          {loadingState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading latest news...</p>
            </div>
          )}

          {/* Empty state */}
          {loadingState === 'empty' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-6 mb-4">
                <FaRegNewspaper className="text-blue-500 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No News Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                We couldn't find any recent news for {destination}. Please check back later for updates.
              </p>
              <a 
                href={`https://news.google.com/search?q=${encodeURIComponent(destination)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center"
              >
                <MdTravelExplore className="mr-2" />
                Search on Google News
              </a>
            </div>
          )}

          {/* News items */}
          {loadingState === 'success' && (
            <motion.div
              className="space-y-6"
              variants={containerVariants}
            >
              {news.map((item, index) => {
                const imageUrl = item.imageUrl.startsWith('//th')
                  ? `https:${item.imageUrl}`
                  : item.imageUrl.startsWith('/')
                    ? `https://www.bing.com${item.imageUrl}`
                    : item.imageUrl;

                return (
                  <motion.div 
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    variants={itemVariants}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-1/3 relative">
                        {!imageErrorStates[index] ? (
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-48 md:h-full object-cover"
                            loading="lazy"
                            onError={() => handleImageError(index)}
                          />
                        ) : (
                          <div className="w-full h-48 md:h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <CiImageOn className="text-gray-400 dark:text-gray-500 text-5xl" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="md:w-2/3 p-4 md:p-6 flex flex-col h-full">
                        {/* Source and date */}
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {item.source && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium mr-2">
                              {item.source}
                            </span>
                          )}
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 text-xs" />
                            <span>{formatDate(item.publishedAt)}</span>
                          </div>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                          {item.description}
                        </p>
                        
                        {/* Actions */}
                        <div className="mt-auto flex justify-between items-center">
                          <button
                            onClick={() => openArticleModal(item)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center"
                          >
                            Read More
                            <FaChevronRight className="ml-1 text-xs" />
                          </button>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleSaveArticle(index)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              aria-label={savedArticles.has(index) ? "Unsave article" : "Save article"}
                            >
                              {savedArticles.has(index) ? <FaBookmark /> : <FaRegBookmark />}
                            </button>
                            
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              aria-label="Open in new tab"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* View all news link */}
          {loadingState === 'success' && news.length > 0 && (
            <div className="flex justify-center mt-8">
              <a
                href={`https://news.google.com/search?q=${encodeURIComponent(destination)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition flex items-center"
              >
                View all news about {destination}
                <FaExternalLinkAlt className="ml-2 text-xs" />
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Article Modal */}
      <AnimatePresence>
        {isArticleModalOpen && selectedArticle && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeArticleModal}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-3xl w-full"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold truncate pr-4">
                  {selectedArticle.title}
                </h2>
                <button 
                  onClick={closeArticleModal}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                {selectedArticle.imageUrl && (
                  <img
                    src={selectedArticle.imageUrl.startsWith('//th')
                      ? `https:${selectedArticle.imageUrl}`
                      : selectedArticle.imageUrl.startsWith('/')
                        ? `https://www.bing.com${selectedArticle.imageUrl}`
                        : selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                    onError={() => {}}
                  />
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {selectedArticle.source && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium mr-2">
                      {selectedArticle.source}
                    </span>
                  )}
                  <div className="flex items-center">
                    <FaRegClock className="mr-1 text-xs" />
                    <span>{formatDate(selectedArticle.publishedAt)}</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedArticle.title}
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {selectedArticle.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <a
                    href={selectedArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition flex items-center"
                  >
                    Read Full Article
                    <FaExternalLinkAlt className="ml-2 text-xs" />
                  </a>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      aria-label="Save article"
                    >
                      <FaRegBookmark />
                    </button>
                    
                    <button
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      aria-label="Share article"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NewsDisplay;