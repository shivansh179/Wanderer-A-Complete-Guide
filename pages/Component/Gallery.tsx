import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaLink, FaUser, FaCamera, FaVideo } from 'react-icons/fa';

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

  // Append images when new images are fetched instead of replacing them
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImages((prevImages) => [...prevImages, ...images]);
    }
  }, [images]);

  useEffect(() => {
    if (videos.length > 0) {
      setCurrentVideos((prevVideos) => [...prevVideos, ...videos]);
    }
  }, [videos]);


  return (
    <motion.div
      className="bg-white rounded-3xl shadow-md p-6 h-120 overflow-y-auto"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-4">
        {destination === previousValue ?
          destination.charAt(0).toUpperCase() + destination.slice(1)
          : previousValue} Through the Lens
      </h2>

      {/* Media Type Toggle Buttons */}
      <div className="flex space-x-4 mb-4">
        <motion.button
          className={`py-2 px-4 rounded-full text-base font-medium flex items-center space-x-2 ${activeMediaType === 'photos' ? 'bg-blue-200 text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
          onClick={() => switchMediaType('photos')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCamera />
          <span>Photos</span>
        </motion.button>
        <motion.button
          className={`py-2 px-4 rounded-full text-base font-medium flex items-center space-x-2 ${activeMediaType === 'videos' ? 'bg-blue-200 text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
          onClick={() => switchMediaType('videos')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaVideo />
          <span>Videos</span>
        </motion.button>
      </div>

      {/* Photo List */}
      {activeMediaType === 'photos' && currentImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentImages.map((image, index) => (
            <motion.div
              key={index}
              className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={image.src.large2x}
                alt={image.photographer}
                className="w-full h-full object-cover block"
              />
              {/* Photographer Credit and Pexels Link - On Image */}
              <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end text-white bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent">
                <div className="flex items-center space-x-2 text-sm">
                  <FaUser className="text-gray-300" />
                  <span>{image.photographer}</span>
                </div>
                <a href={image.photographer_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm">
                  Pexels
                  <FaLink className="inline-block ml-1 text-gray-300" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Videos List */}
      {activeMediaType === 'videos' && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => (
            <motion.div
              key={index}
              className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative"
              whileHover={{ scale: 1.05 }}
            >
              <video
                src={video.video_files[0].link}
                controls
                className="w-full h-full object-cover block"
              />
              <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end text-white bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent">
                <div className="flex items-center space-x-2 text-sm">
                  <FaUser className="text-gray-300" />
                  <span>{video.user.name}</span>
                </div>
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm">
                  Pexels
                  <FaLink className="inline-block ml-1 text-gray-300" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      

      {/* Loading indicator */}
      {imageLoading && (
        <div className="flex justify-center py-4">
          Loading...
        </div>
      )}

      {/* "Load More" button for photos */}
      {activeMediaType === 'photos' && hasMore && !imageLoading && (
        <div className="flex justify-center py-4">
          <motion.button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={loadMore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Load More
          </motion.button>
        </div>
      )}

      {/* "Load More" button for videos */}
      {activeMediaType === 'videos' && hasMore && !imageLoading && (
        <div className="flex justify-center py-4">
          <motion.button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={fetchVideos}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Load More
          </motion.button>
        </div>
      )}

      {/* No more Photo message */}
      {activeMediaType === 'photos' && !hasMore && !imageLoading && (
        <div className="flex justify-center py-4 text-gray-500">
          No more photos to load.
        </div>
      )}
    </motion.div>
  );
};

export default PhotoGallery;