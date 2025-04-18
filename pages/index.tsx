"use client"

import LandingPage from "./Component/Landing";

// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import Navbar from '@/pages/Component/Navbar';
// import axios from 'axios';
// import InputForm from './Component/InputForm';
// import ResultsSection from './Component/ResultsSection';
// import { Image, NewsItem, Video } from '@/types/types';
// import { motion } from 'framer-motion';


// // const Index = () => {
// //     const [startLocation, setStartLocation] = useState('');
// //     const [destination, setDestination] = useState('');
// //     const [days, setDays] = useState('');
// //     const [budget, setBudget] = useState('');
// //     const [peopleCount, setPeopleCount] = useState('');
// //     const [ladiesCount, setLadiesCount] = useState('');
// //     const [elderlyCount, setElderlyCount] = useState('');
// //     const [childrenCount, setChildrenCount] = useState('');
// //     const [images, setImages] = useState<Image[]>([]);
// //     const [imagePower, setImagePower] = useState(false);
// //     const [loadingNews, setLoadingNews] = useState(false);
// //     const [news, setNews] = useState<NewsItem[]>([]);
// //     const [locationImage, setLocationImage] = useState('');
// //     const [locationBio, setLocationBio] = useState('');
// //     const [plan, setPlan] = useState('');
// //     const [loading, setLoading] = useState(false);
// //     const [error, setError] = useState<string | null>(null);
// //     const [imageLoading, setImageLoading] = useState(false);
// //     const [hasMore, setHasMore] = useState(true);
// //     const [nextPageUrl, setNextPageUrl] = useState('');
// //     const [totalResults, setTotalResults] = useState(0);
// //     const [activeMediaType, setActiveMediaType] = useState<'photos' | 'videos'>('photos');
// //     const [videos, setVideos] = useState<Video[]>([]);
// //     const [videoPlaying, setVideoPlaying] = useState<number | null>(null); // To track which video is playing
// //     const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
// //     const [currentValue, setCurrentValue] = useState('');
// //     const [previousValue, setPreviousValue] = useState('');
// //     const [imageFetchDestination, setImageFetchDestination] = useState(''); // Separate state for image fetch

// //     const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';
// //     const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Replace with your actual API key

// //     const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
// //     const [planGenerated, setPlanGenerated] = useState(false);
// //     const [lastDestination, setLastDestination] = useState(''); // Store the last destination for which images/videos were fetched

// //     const planFetcher = async () => {
// //         setLoading(true);
// //         setError(null);
// //         setPlanGenerated(true);

// //         try {
            

// //             const response = await axios.post(
// //                 `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
// //                 {
// //                     contents: [
// //                         {
// //                             parts: [
// //                                 {
// //                                     text: `I am planning a ${days}-day trip from ${startLocation} to ${destination} and we are total ${peopleCount}, where the ladies are ${ladiesCount}, elders are ${elderlyCount}, and children are ${childrenCount}. My budget is ${budget}. Please provide a detailed itinerary, including travel routes, must-visit places, activities, and an estimated budget breakdown. Ensure it fits within my budget and provide links to relevant images. Also Provide if in this query if i provide ladies and children count > 0 then tell me the safety concerns too regarding that desitnation`
// //                                 }
// //                             ]
// //                         }
// //                     ]
// //                 },
// //                 {
// //                     headers: {
// //                         'Content-Type': 'application/json',
// //                     }
// //                 }
// //             );

// //             const extractedPlan = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No plan generated.';
// //             setPlan(extractedPlan);

// //             // Reset image and video pagination when a new plan is fetched
// //             setImages([]);
// //             setNextPageUrl('');
// //             setTotalResults(0);
// //             setHasMore(true);
// //             setVideos([]);
// //             setActiveMediaType('photos');
// //             setVideoPlaying(null); // Reset video playing state
// //             // Clear video refs
// //             videoRefs.current = {};

// //             // Only fetch images when plan is fetched
// //             setImageFetchDestination(destination); // Set the destination for image fetching
// //             setActiveSection('plan');
// //             setPreviousValue(destination);
// //             setCurrentValue(destination);
// //         } catch (err: any) {
// //             console.error('Error fetching the plan:', err);
// //             setError(err.message || 'Failed to fetch the plan. Please try again.');
// //             setPlan('');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const imageFetcher = async (query: string) => {
// //         setImageLoading(true);
// //         try {
// //             let imageResponse;

// //             if (nextPageUrl) {
// //                 // Use the existing nextPageUrl if it exists
// //                 imageResponse = await axios.get(nextPageUrl, {
// //                     headers: {
// //                         'Authorization': PEXELS_API_KEY,
// //                     }
// //                 });
// //             } else {
// //                 // Use the query to build the initial URL
// //                 imageResponse = await axios.get(`https://api.pexels.com/v1/search?query=${query}`, {
// //                     headers: {
// //                         'Authorization': PEXELS_API_KEY,
// //                     }
// //                 });
// //             }

// //             console.log("imageResponse: ", imageResponse);
// //             console.log("API Response:", imageResponse.data); // Inspect the entire response
// //             console.log("Photos Length:", imageResponse.data.photos?.length);
// //             console.log("Next Page URL:", imageResponse.data.next_page);
// //             console.log("Total Results:", imageResponse.data.total_results);

// //             if (imageResponse.data.photos && imageResponse.data.photos.length > 0) {
// //                 setImages((prevImages) => [...prevImages, ...imageResponse.data.photos]);
// //             } else {
// //                 console.warn("No photos found in API response.");
// //                 setHasMore(false); //If there no photos found then set hasMore to false so that load more button dissapear
// //             }

// //             setNextPageUrl(imageResponse.data.next_page || ''); // Set or clear next page URL from API response
// //             setTotalResults(imageResponse.data.total_results || 0);
// //             setHasMore(!!imageResponse.data.next_page); // Update based on existence of next_page URL
// //             console.log("Has More: ", hasMore);

// //         } catch (err: any) {
// //             console.error('Error fetching images:', err);
// //             setImages([]);
// //             setNextPageUrl('');
// //             setTotalResults(0);
// //             setHasMore(false);
// //         } finally {
// //             setImageLoading(false);
// //         }
// //     };

// //     const fetchVideos = async () => {
// //         setImageLoading(true);
// //         try {
// //             const videoResponse = await axios.get(
// //                 `https://api.pexels.com/videos/search?query=${destination}&per_page=10`,
// //                 {
// //                     headers: {
// //                         'Authorization': PEXELS_API_KEY,
// //                     }
// //                 }
// //             );

// //             console.log("videoResponse: ", videoResponse);
// //             setVideos(videoResponse.data.videos || []);
// //             setVideoPlaying(null); // Reset video playing state when loading new videos
// //             // Pause all videos when loading new videos
// //             Object.values(videoRefs.current).forEach((videoRef) => {
// //                 if (videoRef) {
// //                     videoRef.pause();
// //                 }
// //             });
// //         } catch (err: any) {
// //             console.error('Error fetching videos:', err);
// //             setVideos([]);
// //         } finally {
// //             setImageLoading(false);
// //         }
// //     };


// //     const fetchNewsForDestination = async (destination: string) => {
// //         setLoadingNews(true);
// //         setError(null);

// //         try {
// //             const response = await axios.post('/api/news', { location: destination });
// //             if (response.status === 500) {
// //                 alert("It is just a reminder !!! Try providing the complete name of destination for better experience");
// //             }
// //             if (response.status === 200) {
// //                 setNews(response.data);
// //                 console.log("the news are ", response.data);
// //                 // Extract image and bio from the end of the array
// //                 const lastItem = response.data[response.data.length - 2];
// //                 const secondLastItem = response.data[response.data.length - 1];

// //                 if (lastItem && lastItem.image) {
// //                     setLocationImage(lastItem.image.url);
// //                 }

// //                 if (secondLastItem && secondLastItem.bio) {
// //                     setLocationBio(secondLastItem.bio);
// //                 }
// //             } else {
// //                 setError('Failed to fetch news.');
// //                 console.error('Error fetching news:', response.status, response.data);
// //                 setNews([]);
// //             }
// //         } catch (error) {
// //             setError('Failed to fetch news.');
// //             console.error('Error fetching news:', error);
// //             setNews([]);
// //         } finally {
// //             setLoadingNews(false);
// //         }
// //     };

// //     useEffect(() => {
// //         if (planGenerated && destination) {
// //             fetchNewsForDestination(destination);
// //         }
// //     }, [destination, planGenerated]);

// //     const isActive = () => {
// //         setImagePower(!imagePower);
// //     };


// //     // Load more images
// //     const loadMore = useCallback(() => {
// //         console.log("Load More Clicked");  // Check if the function is called
// //         console.log("imageLoading:", imageLoading, "hasMore:", hasMore, "nextPageUrl:", nextPageUrl); // Check the values

// //         if (!imageLoading && hasMore && nextPageUrl) {
// //             imageFetcher(imageFetchDestination);
// //         } else {
// //           console.log("Load More condition not met.");
// //         }
// //     }, [imageLoading, hasMore, nextPageUrl, imageFetchDestination]);

// //     // Initial image load and media type selection
// //     useEffect(() => {
// //         // Fetch images/videos only if destination has changed or when the component initially loads after plan generation.
// //         if (activeSection === 'photos' && planGenerated) {
// //             console.log("destination: ", destination, "lastDestination: ", lastDestination, "imageFetchDestination: ", imageFetchDestination);
// //             if (activeMediaType === 'photos') {
// //                 setImages([]); // Clear existing images
// //                 setNextPageUrl(''); // Reset pagination
// //                 imageFetcher(imageFetchDestination);
// //             } else if (activeMediaType === 'videos') {
// //                 setVideos([]); // Clear existing videos
// //                 fetchVideos();
// //             }
// //             setLastDestination(destination); // Update last destination
// //         }
// //         // If destination hasn't changed but we want to load more, call loadMore or fetchVideos directly from loadMore button
// //     }, [activeSection, activeMediaType, planGenerated, imageFetchDestination]);


// //     //Video PAUSE and video
// //     const handleVideoToggle = (videoId: number) => {
// //         setVideoPlaying((prevVideoId) => (prevVideoId === videoId ? null : videoId));

// //         // Access the video ref
// //         const videoRef = videoRefs.current[videoId];

// //         if (videoRef) {
// //             if (videoPlaying === videoId) {
// //                 videoRef.pause();
// //             } else {
// //                 videoRef.play();
// //             }
// //         }
// //     };

// //     // Function to switch between photos and videos
// //     const switchMediaType = (type: 'photos' | 'videos') => {
// //         setActiveMediaType(type);
// //         if (type === 'photos') {
// //             if (images.length === 0) {
// //                 imageFetcher(imageFetchDestination);
// //             }
// //         } else if (type === 'videos') {
// //             if (videos.length === 0) {
// //                 fetchVideos();
// //             }
// //         }
// //     };

// //     return (
// //         <>
// //             <Navbar />
// //             <motion.div
// //                 className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-6"
// //                 initial={{ opacity: 0 }}
// //                 animate={{ opacity: 1 }}
// //                 exit={{ opacity: 0 }}
// //                 transition={{ duration: 0.5 }}
// //             >
// //                 <div className="container mx-auto px-4 sm:px-6 lg:px-8">
// //                     {/* Navigation Bar for Mobile */}
// //                     <div className="lg:hidden bg-white p-4 shadow-md flex justify-around items-center sticky top-0 z-50 rounded-b-lg">
// //                         {['plan', 'about', 'photos', 'news'].map((section) => (
// //                             <div key={section} className="relative">
// //                                 <motion.button
// //                                     className={`py-2 px-4 rounded-full text-base font-medium ${activeSection === section ? 'text-blue-700' : 'text-gray-600 hover:text-blue-500'} transition-colors duration-300 focus:outline-none`}
// //                                     onClick={() => setActiveSection(section as 'plan' | 'about' | 'photos' | 'news')}
// //                                     disabled={loading || (section === 'news' && !planGenerated)}
// //                                     whileHover={{ scale: 1.1 }}
// //                                     whileTap={{ scale: 0.95 }}
// //                                 >
// //                                     {section.charAt(0).toUpperCase() + section.slice(1)}
// //                                 </motion.button>
// //                             </div>
// //                         ))}
// //                     </div>

// //                     <div className="grid lg:grid-cols-2 gap-6 mt-10">
// //                         {/* Left Column - Input Form */}
// //                         <InputForm
// //                             startLocation={startLocation}
// //                             setStartLocation={setStartLocation}
// //                             destination={destination}
// //                             setDestination={setDestination}
// //                             days={days}
// //                             setDays={setDays}
// //                             budget={budget}
// //                             setBudget={setBudget}
// //                             peopleCount={peopleCount}
// //                             setPeopleCount={setPeopleCount}
// //                             ladiesCount={ladiesCount}
// //                             setLadiesCount={setLadiesCount}
// //                             elderlyCount={elderlyCount}
// //                             setElderlyCount={setElderlyCount}
// //                             childrenCount={childrenCount}
// //                             setChildrenCount={setChildrenCount}
// //                             loading={loading}
// //                             planFetcher={planFetcher}
// //                             imageLoading={imageLoading}
// //                         />

// //                         {/* Right Column - Results */}
// //                         <ResultsSection
// //                             loading={loading}
// //                             error={error}
// //                             plan={plan}
// //                             activeSection={activeSection}
// //                             setActiveSection={setActiveSection}
// //                             planGenerated={planGenerated}
// //                             news={news}
// //                             locationImage={locationImage}
// //                             locationBio={locationBio}
// //                             images={images}
// //                             imageLoading={imageLoading}
// //                             hasMore={hasMore}
// //                             loadMore={loadMore}
// //                             fetchNewsForDestination={fetchNewsForDestination}
// //                             destination={destination}
// //                             videos={videos}
// //                             fetchVideos={fetchVideos}
// //                             previousValue={previousValue}
// //                             activeMediaType={activeMediaType}
// //                             switchMediaType={switchMediaType}
// //                         />
// //                     </div>
// //                     </div>
// //                 </motion.div>
// //         </>
// //     );
// // };

// // export default Index;


// const index = () => {
//   return (
//     <>
//       <Navbar />
//       <div>
//         <div className="flex flex-col md:flex-row justify-center items-center px-4 py-10">
//           <div className="md:w-1/2 gap-6 md:gap-8 text-center ml-20 mt-40 md:text-left">
//             <h1 className="font-bold text-4xl md:text-6xl leading-tight">
//               Let's Explore <br />
//               <span className="text-cyan-600">Wonderful</span> <br /> World's Beauty
//             </h1>
//             <p className="text-lg md:text-2xl text-gray-700 mt-4">
//               Uncover hidden gems and create unforgettable memories. Your journey starts here.  We offer curated travel experiences to inspire and delight.
//             </p>
//             <div className="flex justify-center md:justify-start gap-4 mt-6">
//               <button className="px-6 py-3 bg-cyan-600 text-white rounded-full transition hover:bg-cyan-500">
//                 Book Now
//               </button>
//               <button className="px-6 py-3 font-medium border border-cyan-600 rounded-full text-cyan-600 hover:bg-cyan-100 transition">
//                 More Destinations
//               </button>
//             </div>
//           </div>
//           <div className="flex md:w-1/2 justify-center mt-8 md:mt-0">
//             <img
//               src="/traveler.jpg"
//               alt="Traveler"
//               className="rounded-lg h-full w-full md:h-96 object-cover shadow-lg mt-40"
//             />
//           </div>
//         </div>

//         {/*  Section 2: Featured Destinations */}
//         <section className="bg-gray-50 py-16">
//           <div className="container mx-auto px-4">
//             <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
//               Featured Destinations
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

//               {/* Destination 1 */}
//               <div className="bg-white rounded-lg shadow-md overflow-hidden">
//                 <img
//                   src="/paris.jpg"
//                   alt="Destination 1"
//                   className="w-full h-56 object-cover"
//                 />
//                 <div className="p-4">
//                   <h3 className="text-xl font-semibold text-gray-800 mb-2">Paris, France</h3>
//                   <p className="text-gray-700">
//                     Experience the romance of the Eiffel Tower and the charm of Parisian cafes.
//                   </p>
//                   <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
//                     Explore Paris
//                   </button>
//                 </div>
//               </div>

//               {/* Destination 2 */}
//               <div className="bg-white rounded-lg shadow-md overflow-hidden">
//                 <img
//                   src="/tokyo.jpg"
//                   alt="Destination 2"
//                   className="w-full h-56 object-cover"
//                 />
//                 <div className="p-4">
//                   <h3 className="text-xl font-semibold text-gray-800 mb-2">Kyoto, Japan</h3>
//                   <p className="text-gray-700">
//                     Discover ancient temples, serene gardens, and the beauty of Japanese culture.
//                   </p>
//                   <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
//                     Explore Kyoto
//                   </button>
//                 </div>
//               </div>

//               {/* Destination 3 */}
//               <div className="bg-white rounded-lg shadow-md overflow-hidden">
//                 <img
//                   src="/pachu.jpg"
//                   alt="Destination 3"
//                   className="w-full h-56 object-cover"
//                 />
//                 <div className="p-4">
//                   <h3 className="text-xl font-semibold text-gray-800 mb-2">Machu Picchu, Peru</h3>
//                   <p className="text-gray-700">
//                     Hike through breathtaking landscapes to the lost city of the Incas.
//                   </p>
//                   <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
//                     Explore Machu Picchu
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Section 3:  Image and Text (Alternating Layout) */}
//         <section className="py-16">
//           <div className="container mx-auto px-4">
//             <div className="flex flex-col md:flex-row items-center gap-8">
//               <div className="md:w-1/2">
//                 <img
//                   src="/adventure.jpg"
//                   alt="Adventure 1"
//                   className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96"
//                 />
//               </div>
//               <div className="md:w-1/2">
//                 <h2 className="text-6xl font-semibold text-gray-800 mb-4">
//                   Unleash Your Inner Adventurer
//                 </h2>
//                 <p className="text-gray-700 font-bold leading-relaxed">
//                   Embark on thrilling adventures that will push your limits and create lasting memories.  From hiking through rainforests to exploring ancient ruins, we have an adventure for everyone.
//                 </p>
//                 <ul className="list-disc list-inside mt-4 text-gray-700">
//                   <li>Guided Tours</li>
//                   <li>Expert Local Guides</li>
//                   <li>Customizable Itineraries</li>
//                   <li>Sustainable Travel Practices</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Section 4: Another Image and Text (Reverse Order) */}
//         <section className="py-16 bg-gray-50">
//           <div className="container mx-auto px-4">
//             <div className="flex flex-col md:flex-row items-center gap-8">
//               <div className="md:w-1/2 order-2 md:order-1">
//                 <h2 className="text-6xl font-semibold text-gray-800 mb-4">
//                   Discover Hidden Gems
//                 </h2>
//                 <p className="text-gray-700 font-bold leading-relaxed">
//                   Venture off the beaten path and discover the world's best-kept secrets.  Our local experts will guide you to unique and authentic experiences.
//                 </p>
//                 <p className="text-gray-700 mt-4 leading-relaxed">
//                   Support local communities and immerse yourself in the culture of your destination.
//                 </p>
//               </div>
//               <div className="md:w-1/2 order-1 md:order-2">
//                 <img
//                   src="/trekking.jpg"
//                   alt="Culture 1"
//                   className="rounded-lg shadow-lg w-full object-cover h-64 md:h-96"
//                 />
//               </div>
//             </div>
//           </div>
//         </section>

//       </div>
//       {/* <Footer /> */}
//     </>
//   );
// };

// export default index;


import React from 'react'
import LoginPage from './Component/Login'
// import Subscribe from './Component/Subscribe'

const index = () => {
  return (
    <>
       <LandingPage /> 
       {/* <Subscribe /> */}
    </>
  )
}

export default index
