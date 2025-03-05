import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLink, 
  FaUser, 
  FaCamera, 
  FaVideo, 
  FaPlay, 
  FaPause, 
  FaExpand, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight,
  FaDownload,
  FaShareAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MdOutlineCollections } from 'react-icons/md';

interface PhotoGalleryProps {
  images: any[]; // Replace any with your Image interface
  imageLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  destination: string;
  videos: any[];
  fetchVideos: () => void;
  previousValue: string;
  activeMediaType: 'photos' | 'videos';
  switchMediaType: (type: 'photos' | 'videos') => void;
  sectionVariants: any;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  images,
  imageLoading,
  hasMore,
  loadMore,
  destination = '',
  videos,
  fetchVideos,
  previousValue = '',
  activeMediaType,
  switchMediaType,
  sectionVariants,
}) => {
  const [currentImages, setCurrentImages] = useState<any[]>(images);
  const [currentVideos, setCurrentVideos] = useState<any[]>(videos);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState<number | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<boolean>(false);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('grid');
  
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const lightboxVideoRef = useRef<HTMLVideoElement | null>(null);
  
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
  
  const lightboxVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Format display name for the destination
  const displayName = () => {
    const name = destination === previousValue ? destination : previousValue;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Append images when new images are fetched
  useEffect(() => {
    if (images?.length > 0) {
      setCurrentImages(prevImages => {
        // Check if we already have these images to avoid duplicates
        const existingIds = new Set(prevImages.map(img => img.id));
        const newImages = images.filter(img => !existingIds.has(img.id));
        return [...prevImages, ...newImages];
      });
    }
  }, [images]);

  // Update videos when new ones are fetched
  useEffect(() => {
    if (videos.length > 0) {
      setCurrentVideos(prevVideos => {
        // Check if we already have these videos to avoid duplicates
        const existingIds = new Set(prevVideos.map(vid => vid.id));
        const newVideos = videos.filter(vid => !existingIds.has(vid.id));
        return [...prevVideos, ...newVideos];
      });
    }
  }, [videos]);

  // Handle video play/pause in the gallery
  const handleVideoToggle = (index: number) => {
    const videoRef = videoRefs.current[index];
    
    if (videoPlaying === index) {
      if (videoRef) videoRef.pause();
      setVideoPlaying(null);
    } else {
      // Pause any currently playing video
      if (videoPlaying !== null && videoRefs.current[videoPlaying]) {
        videoRefs.current[videoPlaying]?.pause();
      }
      
      if (videoRef) {
        videoRef.play();
        setVideoPlaying(index);
      }
    }
  };

  // Open lightbox for a specific image or video
  const openLightbox = (index: number, isVideo: boolean = false) => {
    setLightboxIndex(index);
    setLightboxVideo(isVideo);
    setLightboxOpen(true);
    
    // If it's a video, pause the gallery video first
    if (isVideo && videoPlaying !== null) {
      const videoRef = videoRefs.current[videoPlaying];
      if (videoRef) videoRef.pause();
      setVideoPlaying(null);
    }
  };

  // Navigate to previous item in lightbox
  const prevLightboxItem = () => {
    if (lightboxVideo) {
      const newIndex = (lightboxIndex - 1 + currentVideos?.length) % currentVideos?.length;
      setLightboxIndex(newIndex);
      
      // Reset video playing state when changing videos
      if (lightboxVideoRef.current) {
        lightboxVideoRef.current.pause();
        lightboxVideoRef.current.currentTime = 0;
      }
    } else {
      setLightboxIndex((lightboxIndex - 1 + currentImages?.length) % currentImages?.length);
    }
  };

  // Navigate to next item in lightbox
  const nextLightboxItem = () => {
    if (lightboxVideo) {
      const newIndex = (lightboxIndex + 1) % currentVideos?.length;
      setLightboxIndex(newIndex);
      
      // Reset video playing state when changing videos
      if (lightboxVideoRef.current) {
        lightboxVideoRef.current.pause();
        lightboxVideoRef.current.currentTime = 0;
      }
    } else {
      setLightboxIndex((lightboxIndex + 1) % currentImages.length);
    }
  };

  // Close the lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    // If it's a video, pause it
    if (lightboxVideo && lightboxVideoRef.current) {
      lightboxVideoRef.current.pause();
    }
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevLightboxItem();
          break;
        case 'ArrowRight':
          nextLightboxItem();
          break;
        case 'Escape':
          closeLightbox();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, lightboxVideo, currentImages?.length, currentVideos?.length]);

  // Get the current item for lightbox display
  const getCurrentLightboxItem = () => {
    if (lightboxVideo) {
      return currentVideos[lightboxIndex];
    } else {
      return currentImages[lightboxIndex];
    }
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
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <MdOutlineCollections className="mr-2" />
              {displayName()} Gallery
            </h2>
            
            {/* Media Type Toggle Buttons */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                className={`py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeMediaType === 'photos' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={() => switchMediaType('photos')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCamera />
                <span>Photos</span>
              </motion.button>
              
              <motion.button
                className={`py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeMediaType === 'videos' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={() => switchMediaType('videos')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaVideo />
                <span>Videos</span>
              </motion.button>
              
              {/* Layout toggle button */}
              <motion.button
                className="py-2 px-4 rounded-lg text-sm font-medium bg-white/20 text-white hover:bg-white/30 flex items-center gap-2 transition-colors"
                onClick={() => setLayoutMode(layoutMode === 'grid' ? 'masonry' : 'grid')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  {layoutMode === 'grid' ? (
                    <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm11 4h-4v8h4V7zm-6-2v12H5V5h5z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{layoutMode === 'grid' ? 'Masonry' : 'Grid'}</span>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Gallery content section */}
        <div className="p-6">
          {/* Photo Gallery */}
          {activeMediaType === 'photos' && (
            <>
              {currentImages?.length === 0 && !imageLoading ? (
                <div className="text-center py-12">
                  <FaCamera className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No photos available for {displayName()}.</p>
                </div>
              ) : (
                <motion.div
                  className={`${
                    layoutMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
                      : 'columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4'
                  }`}
                  variants={containerVariants}
                >
                  {currentImages.map((image, index) => (
                    <motion.div
                      key={`image-${image.id || index}`}
                      className={`relative rounded-xl overflow-hidden shadow-md ${
                        layoutMode === 'masonry' ? 'break-inside-avoid mb-4' : ''
                      }`}
                      variants={itemVariants}
                      onMouseEnter={() => setHoveredImageIndex(index)}
                      onMouseLeave={() => setHoveredImageIndex(null)}
                    >
                      <img
                        src={image.src.large2x}
                        alt={image.alt || `Photo by ${image.photographer}`}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                      />
                      
                      {/* Hover overlay with actions */}
                      <AnimatePresence>
                        {hoveredImageIndex === index && (
                          <motion.div
                            className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-between p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {/* Top action buttons */}
                            <div className="flex justify-end">
                              <button
                                className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition"
                                onClick={() => openLightbox(index)}
                              >
                                <FaExpand size={14} />
                              </button>
                            </div>
                            
                            {/* Bottom info and credit */}
                            <div className="text-white">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                    <FaUser className="text-sm" />
                                  </div>
                                  <span className="text-sm font-medium">{image.photographer}</span>
                                </div>
                                <a
                                  href={image.photographer_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-white bg-opacity-20 py-1 px-2 rounded hover:bg-opacity-30 transition flex items-center"
                                >
                                  <span>Pexels</span>
                                  <FaLink className="ml-1 text-xs" />
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Load more photos button */}
              {hasMore && !imageLoading && (
                <div className="text-center mt-8">
                  <motion.button
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition flex items-center gap-2 mx-auto"
                    onClick={loadMore}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Load More Photos
                  </motion.button>
                </div>
              )}
              
              {/* No more photos message */}
              {!hasMore && currentImages?.length > 0 && !imageLoading && (
                <div className="text-center mt-6 text-gray-500 dark:text-gray-400">
                  You've reached the end of the collection.
                </div>
              )}
            </>
          )}
          
          {/* Video Gallery */}
          {activeMediaType === 'videos' && (
            <>
              {currentVideos?.length === 0 && !imageLoading ? (
                <div className="text-center py-12">
                  <FaVideo className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No videos available for {displayName()}.</p>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={containerVariants}
                >
                  {currentVideos.map((video, index) => (
                    <motion.div
                      key={`video-${video.id || index}`}
                      className="relative rounded-xl overflow-hidden shadow-md aspect-video"
                      variants={itemVariants}
                    >
                      <video
                        // ref={(el: HTMLVideoElement | null) => videoRefs.current[index] = el}
                        src={video.video_files[0].link}
                        poster={video.image}
                        className="w-full h-full object-cover"
                        onClick={() => handleVideoToggle(index)}
                      />
                      
                      {/* Video controls overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <button
                          className="p-4 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition"
                          onClick={() => handleVideoToggle(index)}
                        >
                          {videoPlaying === index ? (
                            <FaPause size={20} />
                          ) : (
                            <FaPlay size={20} />
                          )}
                        </button>
                        
                        {/* Expand button */}
                        <button
                          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition"
                          onClick={() => openLightbox(index, true)}
                        >
                          <FaExpand size={14} />
                        </button>
                      </div>
                      
                      {/* Video info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                        <div className="flex justify-between items-center text-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <FaUser className="text-sm" />
                            </div>
                            <span className="text-sm font-medium">{video.user.name}</span>
                          </div>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white bg-opacity-20 py-1 px-2 rounded hover:bg-opacity-30 transition flex items-center"
                            onClick={e => e.stopPropagation()}
                          >
                            <span>Pexels</span>
                            <FaLink className="ml-1 text-xs" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Load more videos button */}
              {!imageLoading && currentVideos?.length > 0 && (
                <div className="text-center mt-8">
                  <motion.button
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition flex items-center gap-2 mx-auto"
                    onClick={fetchVideos}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Load More Videos
                  </motion.button>
                </div>
              )}
            </>
          )}
          
          {/* Loading indicator */}
          {imageLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {!lightboxVideo && (
                <>
                  <a
                    href={getCurrentLightboxItem()?.src?.original}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
                    onClick={e => e.stopPropagation()}
                  >
                    <FaDownload size={18} />
                  </a>
                  <button
                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
                    onClick={e => {
                      e.stopPropagation();
                      // Here you would implement sharing functionality
                      alert('Share functionality would go here');
                    }}
                  >
                    <FaShareAlt size={18} />
                  </button>
                </>
              )}
              <button
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
                onClick={closeLightbox}
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition z-10"
              onClick={e => {
                e.stopPropagation();
                prevLightboxItem();
              }}
            >
              <FaChevronLeft size={18} />
            </button>
            
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition z-10"
              onClick={e => {
                e.stopPropagation();
                nextLightboxItem();
              }}
            >
              <FaChevronRight size={18} />
            </button>
            
            <div className="max-w-screen-lg max-h-screen p-4 relative" onClick={closeLightbox}>
              {lightboxVideo ? (
                <video
                  // ref={lightboxVideoRef}
                  src={getCurrentLightboxItem()?.video_files[0].link}
                  controls
                  autoPlay
                  className="max-w-full max-h-[calc(100vh-8rem)] mx-auto"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <img
                  src={getCurrentLightboxItem()?.src?.large2x}
                  alt={getCurrentLightboxItem()?.alt || `Photo by ${getCurrentLightboxItem()?.photographer}`}
                  className="max-w-full max-h-[calc(100vh-8rem)] mx-auto"
                  onClick={e => e.stopPropagation()}
                />
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <FaUser />
                    </div>
                    <span>
                      {lightboxVideo 
                        ? getCurrentLightboxItem()?.user?.name 
                        : getCurrentLightboxItem()?.photographer}
                    </span>
                  </div>
                  <a
                    href={lightboxVideo 
                      ? getCurrentLightboxItem()?.url 
                      : getCurrentLightboxItem()?.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-white bg-opacity-20 py-1 px-2 rounded hover:bg-opacity-30 transition flex items-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <span>View on Pexels</span>
                    <FaExternalLinkAlt className="ml-1 text-xs" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotoGallery;