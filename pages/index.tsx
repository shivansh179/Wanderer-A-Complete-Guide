import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import InputForm from './Component/InputForm';
import ResultsSection from './Component/ResultsSection';
import { Image, NewsItem, Video } from '@/types/types';
import { motion } from 'framer-motion';

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
    const [imageFetchDestination, setImageFetchDestination] = useState(''); // Separate state for image fetch

    const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';
    const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Replace with your actual API key

    const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
    const [planGenerated, setPlanGenerated] = useState(false);
    const [lastDestination, setLastDestination] = useState(''); // Store the last destination for which images/videos were fetched

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
            setImageFetchDestination(destination); // Set the destination for image fetching
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
            console.log("API Response:", imageResponse.data); // Inspect the entire response
            console.log("Photos Length:", imageResponse.data.photos?.length);
            console.log("Next Page URL:", imageResponse.data.next_page);
            console.log("Total Results:", imageResponse.data.total_results);

            if (imageResponse.data.photos && imageResponse.data.photos.length > 0) {
                setImages((prevImages) => [...prevImages, ...imageResponse.data.photos]);
            } else {
                console.warn("No photos found in API response.");
                setHasMore(false); //If there no photos found then set hasMore to false so that load more button dissapear
            }

            setNextPageUrl(imageResponse.data.next_page || ''); // Set or clear next page URL from API response
            setTotalResults(imageResponse.data.total_results || 0);
            setHasMore(!!imageResponse.data.next_page); // Update based on existence of next_page URL
            console.log("Has More: ", hasMore);

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


    // Load more images
    const loadMore = useCallback(() => {
        console.log("Load More Clicked");  // Check if the function is called
        console.log("imageLoading:", imageLoading, "hasMore:", hasMore, "nextPageUrl:", nextPageUrl); // Check the values

        if (!imageLoading && hasMore && nextPageUrl) {
            imageFetcher(imageFetchDestination);
        } else {
          console.log("Load More condition not met.");
        }
    }, [imageLoading, hasMore, nextPageUrl, imageFetchDestination]);

    // Initial image load and media type selection
    useEffect(() => {
        // Fetch images/videos only if destination has changed or when the component initially loads after plan generation.
        if (activeSection === 'photos' && planGenerated) {
            console.log("destination: ", destination, "lastDestination: ", lastDestination, "imageFetchDestination: ", imageFetchDestination);
            if (activeMediaType === 'photos') {
                setImages([]); // Clear existing images
                setNextPageUrl(''); // Reset pagination
                imageFetcher(imageFetchDestination);
            } else if (activeMediaType === 'videos') {
                setVideos([]); // Clear existing videos
                fetchVideos();
            }
            setLastDestination(destination); // Update last destination
        }
        // If destination hasn't changed but we want to load more, call loadMore or fetchVideos directly from loadMore button
    }, [activeSection, activeMediaType, planGenerated, imageFetchDestination]);


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
                imageFetcher(imageFetchDestination);
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
                                {/* <motion.button
                                    className={`py-2 px-4 rounded-full text-base font-medium ${activeSection === section ? 'text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
                                    onClick={() => setActiveSection(section as 'plan' | 'about' | 'photos' | 'news')}
                                    disabled={loading || (section === 'news' && !planGenerated)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {section.charAt(0).toUpperCase() + section.slice(1)}
                                </motion.button> */}
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 mt-10">
                        {/* Left Column - Input Form */}
                        <InputForm
                            startLocation={startLocation}
                            setStartLocation={setStartLocation}
                            destination={destination}
                            setDestination={setDestination}
                            days={days}
                            setDays={setDays}
                            budget={budget}
                            setBudget={setBudget}
                            peopleCount={peopleCount}
                            setPeopleCount={setPeopleCount}
                            ladiesCount={ladiesCount}
                            setLadiesCount={setLadiesCount}
                            elderlyCount={elderlyCount}
                            setElderlyCount={setElderlyCount}
                            childrenCount={childrenCount}
                            setChildrenCount={setChildrenCount}
                            loading={loading}
                            planFetcher={planFetcher}
                            imageLoading={imageLoading}
                        />

                        {/* Right Column - Results */}
                        <ResultsSection
                            loading={loading}
                            error={error}
                            plan={plan}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            planGenerated={planGenerated}
                            news={news}
                            locationImage={locationImage}
                            locationBio={locationBio}
                            images={images}
                            imageLoading={imageLoading}
                            hasMore={hasMore}
                            loadMore={loadMore}
                            fetchNewsForDestination={fetchNewsForDestination}
                            destination={destination}
                            videos={videos}
                            fetchVideos={fetchVideos}
                            previousValue={previousValue}
                            activeMediaType={activeMediaType}
                            switchMediaType={switchMediaType}
                        />
                    </div>
                    </div>
                </motion.div>
        </>
    );
};

export default Index;