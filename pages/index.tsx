import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IoIosArrowDown } from "react-icons/io";
import rehypeRaw from 'rehype-raw';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { FaLink, FaUser, FaVideo, FaPlay, FaPause, FaCamera } from 'react-icons/fa'; // Import icons

interface Image {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    }
}

interface NewsItem {
    [x: string]: any;
    title: string;
    link: string;
    description: string;
}

interface Video {
    id: number;
    width: number;
    height: number;
    url: string;
    image: string;
    duration: number;
    user: {
        id: number;
        name: string;
        url: string;
    };
    video_files: {
        id: number;
        quality: string;
        file_type: string;
        width: number | null;
        height: number | null;
        link: string;
    }[];
}

const Index = () => {

 

    const [startLocation, setStartLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [peopleCount, setPeopleCount] = useState('');
    const [ladiesCount, setLadiesCount] = useState('');
    const [elderlyCount, setElderlyCount] = useState('');
    const [childrenCount, setChildrenCount] = useState('');
    const [images, setImages] = useState<Image[]>([]);
    const [imagePower, setImagePower] = useState(false);
    const [loadingNews, setLoadingNews] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [locationImage, setLocationImage] = useState('');
    const [locationBio, setLocationBio] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextPageUrl, setNextPageUrl] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [activeMediaType, setActiveMediaType] = useState<'photos' | 'videos'>('photos');
    const [videos, setVideos] = useState<Video[]>([]);
    const [videoPlaying, setVideoPlaying] = useState<number | null>(null); // To track which video is playing
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
    const [currentValue, setCurrentValue] = useState('');
    const [previousValue, setPreviousValue] = useState('');

    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW';

    const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
    const [planGenerated, setPlanGenerated] = useState(false);
    const [lastDestination, setLastDestination] = useState(''); // Store the last destination for which images/videos were fetched

    // Animation for active section underline
    const underlineAnimation = useSpring({
        width: activeSection ? '100%' : '0%',
        config: { tension: 300, friction: 20 },
    });


    const planFetcher = async () => {
        setLoading(true);
        setError(null);
        setPlanGenerated(true);
        
        try {   
            if (!GEMINI_API_KEY) {
                throw new Error("Gemini API key is missing. Please set the NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
            }

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `I am planning a ${days}-day trip from ${startLocation} to ${destination} and we are total ${peopleCount}, where the ladies are ${ladiesCount}, elders are ${elderlyCount}, and children are ${childrenCount}. My budget is ${budget}. Please provide a detailed itinerary, including travel routes, must-visit places, activities, and an estimated budget breakdown. Ensure it fits within my budget and provide links to relevant images. Also Provide if in this query if i provide ladies and children count > 0 then tell me the safety concerns too regarding that desitnation`
                                }
                            ]
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            const extractedPlan = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No plan generated.';
            setPlan(extractedPlan);

            // Reset image and video pagination when a new plan is fetched
            setImages([]);
            setNextPageUrl('');
            setTotalResults(0);
            setHasMore(true);
            setVideos([]);
            setActiveMediaType('photos');
            setVideoPlaying(null); // Reset video playing state
             // Clear video refs
             videoRefs.current = {};

            // Only fetch images when plan is fetched
            await imageFetcher(destination);
            setLastDestination(destination); // Update last destination
            setActiveSection('plan');
            setPreviousValue(destination);
            setCurrentValue(destination);
        } catch (err: any) {
            console.error('Error fetching the plan:', err);
            setError(err.message || 'Failed to fetch the plan. Please try again.');
            setPlan('');
        } finally {
            setLoading(false);
        }
    };

    const imageFetcher = async (query: string) => {
        setImageLoading(true);
        try {
            let imageResponse;
    
            if (nextPageUrl) {
                // Use the existing nextPageUrl if it exists
                imageResponse = await axios.get(nextPageUrl, {
                    headers: {
                        'Authorization': PEXELS_API_KEY,
                    }
                });
            } else {
                // Use the query to build the initial URL
                imageResponse = await axios.get(`https://api.pexels.com/v1/search?query=${query}`, {
                    headers: {
                        'Authorization': PEXELS_API_KEY,
                    }
                });
            }
    
            console.log("imageResponse: ", imageResponse);
    
            if (imageResponse.data.photos && imageResponse.data.photos.length > 0) {
                setImages((prevImages) => [...prevImages, ...imageResponse.data.photos]);
            }
    
            setNextPageUrl(imageResponse.data.next_page || ''); // Set or clear next page URL from API response
            setTotalResults(imageResponse.data.total_results || 0);
            setHasMore(!!imageResponse.data.next_page); // Update based on existence of next_page URL
    
        } catch (err: any) {
            console.error('Error fetching images:', err);
            setImages([]);
            setNextPageUrl('');
            setTotalResults(0);
            setHasMore(false);
        } finally {
            setImageLoading(false);
        }
    };

    const fetchVideos = async () => {
        setImageLoading(true);
        try {
            const videoResponse = await axios.get(
                `https://api.pexels.com/videos/search?query=${destination}&per_page=10`,
                {
                    headers: {
                        'Authorization': PEXELS_API_KEY,
                    }
                }
            );

            console.log("videoResponse: ", videoResponse);
            setVideos(videoResponse.data.videos || []);
            setVideoPlaying(null); // Reset video playing state when loading new videos
              // Pause all videos when loading new videos
              Object.values(videoRefs.current).forEach((videoRef) => {
                if (videoRef) {
                    videoRef.pause();
                }
            });
        } catch (err: any) {
            console.error('Error fetching videos:', err);
            setVideos([]);
        } finally {
            setImageLoading(false);
        }
    };


    const fetchNewsForDestination = async (destination: string) => {
        setLoadingNews(true);
        setError(null);

        try {
            const response = await axios.post('/api/news', { location: destination });
            if (response.status === 500) {
                alert("It is just a reminder !!! Try providing the complete name of destination for better experience");
            }
            if (response.status === 200) {
                setNews(response.data);
                console.log("the news are ", response.data);
                // Extract image and bio from the end of the array
                const lastItem = response.data[response.data.length - 2];
                const secondLastItem = response.data[response.data.length - 1];

                if (lastItem && lastItem.image) {
                    setLocationImage(lastItem.image.url);
                }

                if (secondLastItem && secondLastItem.bio) {
                    setLocationBio(secondLastItem.bio);
                }
            } else {
                setError('Failed to fetch news.');
                console.error('Error fetching news:', response.status, response.data);
                setNews([]);
            }
        } catch (error) {
            setError('Failed to fetch news.');
            console.error('Error fetching news:', error);
            setNews([]);
        } finally {
            setLoadingNews(false);
        }
    };

    useEffect(() => {
        if (planGenerated && destination) {
            fetchNewsForDestination(destination);
        }
    }, [destination, planGenerated]);

    const isActive = () => {
        setImagePower(!imagePower);
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    // Load more images
    const loadMore = useCallback(() => {
        if (!imageLoading && hasMore && nextPageUrl) {
            imageFetcher(destination);
        }
    }, [imageLoading, hasMore, nextPageUrl, destination]);

    // Initial image load and media type selection
    useEffect(() => {
        // Fetch images/videos only if destination has changed or when the component initially loads after plan generation.
        if (activeSection === 'photos' && planGenerated && (destination !== lastDestination)) {
            if (activeMediaType === 'photos') {
                setImages([]); // Clear existing images
                setNextPageUrl(''); // Reset pagination
                imageFetcher(destination);
            } else if (activeMediaType === 'videos') {
                setVideos([]); // Clear existing videos
                fetchVideos();
            }
            setLastDestination(destination); // Update last destination
        }
        // If destination hasn't changed but we want to load more, call loadMore or fetchVideos directly from loadMore button
    }, [activeSection, activeMediaType, planGenerated, lastDestination]);


    //Video PAUSE and video
    const handleVideoToggle = (videoId: number) => {
        setVideoPlaying((prevVideoId) => (prevVideoId === videoId ? null : videoId));

        // Access the video ref
        const videoRef = videoRefs.current[videoId];

        if (videoRef) {
            if (videoPlaying === videoId) {
                videoRef.pause();
            } else {
                videoRef.play();
            }
        }
    };

     // Function to switch between photos and videos
     const switchMediaType = (type: 'photos' | 'videos') => {
        setActiveMediaType(type);
        if (type === 'photos') {
            if (images.length === 0) {
                imageFetcher(destination);
            }
        } else if (type === 'videos') {
            if (videos.length === 0) {
                fetchVideos();
            }
        }
    };

    return (
        <>
            <Navbar />
            <motion.div
                className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Navigation Bar for Mobile */}
                    <div className="lg:hidden bg-white p-4 shadow-md flex justify-around items-center sticky top-0 z-50 rounded-b-lg">
                        {['plan', 'about', 'photos', 'news'].map((section) => (
                            <div key={section} className="relative">
                                <motion.button
                                    className={`py-2 px-4 rounded-full text-base font-medium ${activeSection === section ? 'text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
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

                    <div className="grid lg:grid-cols-2 gap-6 mt-10">
                        {/* Left Column - Input Form */}
                        <motion.div
                            className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300"
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">
                                    Dream Weaver: Your AI Trip Planner
                                </h1>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    Unlock unforgettable journeys with personalized AI-powered itineraries.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Hero Section Look for Starting Point and Destination */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                                            value={startLocation}
                                            onChange={(e) => setStartLocation(e.target.value)}
                                            placeholder="Enter your starting location"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Enter your destination"
                                        />
                                    </div>
                                </div>

                                {/* Rest of the Inputs */}
                                {[
                                    { label: "Trip Duration (Days)", state: days, setState: setDays, type: "number" },
                                    { label: "Total Budget", state: budget, setState: setBudget, type: "number" },
                                    { label: "Total Travelers", state: peopleCount, setState: setPeopleCount, type: "number" },
                                    { label: "Female Travelers", state: ladiesCount, setState: setLadiesCount, type: "number" },
                                    { label: "Senior Travelers", state: elderlyCount, setState: setElderlyCount, type: "number" },
                                    { label: "Children", state: childrenCount, setState: setChildrenCount, type: "number" }
                                ].map(({ label, state, setState, type = "text" }, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            placeholder={`Enter your ${label.toLowerCase()}`}
                                        />
                                    </div>
                                ))}

                                <motion.button
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    onClick={planFetcher}
                                    disabled={loading || imageLoading}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {loading ? (
                                        <ThreeDots height="24" width="24" color="#ffffff" />
                                    ) : (
                                        'Craft My Adventure'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Right Column - Results */}
                        <div className="space-y-6">
                            {/* Navigation Bar for Desktop */}
                            <div className="lg:flex bg-white rounded-3xl hidden shadow-md p-4 space-x-4 items-center">
                                {['plan', 'about', 'photos', 'news'].map((section) => (
                                    <div key={section} className="relative">
                                        <motion.button
                                            className={`py-2 px-4 rounded-full text-base font-medium ${activeSection === section ? 'text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
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
                                                // className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full"
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
                                        <ThreeDots height="40" width="40" color="#6366F1" />
                                        <p className="mt-4 text-gray-600 text-lg">
                                            Summoning the travel spirits...
                                        </p>
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

                            {/* Plan Section */}
                            {activeSection === 'plan' && plan && (
                                <motion.div
                                    className="bg-white rounded-3xl shadow-md p-6 overflow-auto"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                >
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-4">
                                        Your Personalized Itinerary
                                    </h2>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        className="prose max-w-none"
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-700 mb-3" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-blue-600 mt-4 mb-2" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-semibold text-blue-800" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                                        }}
                                    >
                                        {plan}
                                    </ReactMarkdown>
                                </motion.div>
                            )}

                            {/* Photos Section */}
                            {activeSection === 'photos' && (
                                <motion.div
                                    className="bg-white rounded-3xl shadow-md p-6 h-120 overflow-auto"
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

                                    {/* Photos Grid */}
                                    {activeMediaType === 'photos' && images.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
                                            {images.map((image, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                                                    whileHover={{ scale: 1.05 }}
                                                >
                                                    <img src={image.src.large2x} alt={image.photographer} className="w-full h-auto object-cover" />
                                                    {/* Photographer Credit */}
                                                    <div className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <FaUser className="text-gray-500" />
                                                            <span className="text-sm text-gray-700">{image.photographer}</span>
                                                        </div>
                                                        <a href={image.photographer_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center space-x-1">
                                                            <FaLink className="text-gray-500" />
                                                            <span className="text-sm">Pexels</span>
                                                        </a>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Videos List */}
                                    {activeMediaType === 'videos' && videos.length > 0 && (
                                        <div className="space-y-4 h-100">
                                            {videos.map((video) => {
                                                return(
                                                    <div key={video.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative">
                                                        <video
                                                            width="100%"
                                                            controls={false} // Remove default controls
                                                            onClick={() => handleVideoToggle(video.id)}
                                                            loop
                                                            muted={videoPlaying !== video.id} // Mute when not playing
                                                            // ref={(el: HTMLVideoElement | null) => (videoRefs.current[video.id] = el)}
                                                            
                                                            >
                                                            <source src={video.video_files[0].link} type="video/mp4" />
                                                            Your browser does not support the video tag.
                                                        </video>

                                                        {/* Play/Pause Button */}
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-4xl cursor-pointer opacity-70 hover:opacity-100 transition duration-300">
                                                            {videoPlaying === video.id ? (
                                                                <FaPause onClick={() => handleVideoToggle(video.id)} size="3em" />
                                                            ) : (
                                                                <FaPlay onClick={() => handleVideoToggle(video.id)} size="3em" />
                                                            )}
                                                        </div>
                                                        {/* video Creadit */}
                                                        <div className="p-4 flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <FaUser className="text-gray-500" />
                                                                <span className="text-sm text-gray-700">{video.user.name}</span>
                                                            </div>
                                                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center space-x-1">
                                                                <FaLink className="text-gray-500" />
                                                                <span className="text-sm">Pexels</span>
                                                            </a>
                                                        </div>

                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Loading indicator */}
                                    {imageLoading && (
                                        <div className="flex justify-center py-4">
                                            <ThreeDots height="30" width="30" color="#6366F1" />
                                        </div>
                                    )}

                                    {/* "Load More" button for photos*/}
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

                                     {/* "Load More" button for vedios*/}
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
                            )}

                            {/* About Section */}
                            {activeSection === 'about' && !loadingNews && locationBio && (
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
                            )}

                            {/* News Section */}
                            {activeSection === 'news' && !loadingNews && news.length > 0 && (
                                <motion.div
                                    className="bg-white rounded-3xl shadow-md p-6 overflow-auto"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                >
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-4">
                                        What's Happening in {destination}
                                    </h2>
                                    <ul className="space-y-4">
                                        {news.map((item, index) => (
                                            <li key={index} className="flex items-start space-x-3">
                                                <IoIosArrowDown className="mt-1 text-blue-500 text-xl" />
                                                <div>
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-blue-600 hover:underline text-lg"
                                                    >
                                                        {item.title}
                                                    </a>
                                                    <p className="text-gray-600 text-base leading-relaxed">
                                                        {item.description}
                                                    </p>                                       
                                                 </div>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Index;