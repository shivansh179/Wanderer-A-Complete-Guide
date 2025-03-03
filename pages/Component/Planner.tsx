
    import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged
    import Navbar from '@/pages/Component/Navbar';
    import axios from 'axios';
    import { auth } from '@/FirebaseCofig'; // Import the auth instance
    import InputForm from './InputForm';
    import ResultsSection from './ResultsSection';
    import { Image, NewsItem, Video } from '@/types/types';
    import { motion } from 'framer-motion';
    import AuthGuard from '../AuthGuard/AuthGuard';
    import { collection, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
    import { doc, getDoc } from 'firebase/firestore';
    import router from 'next/router';

    const Index = () => {
        const [user, setUser] = useState<any>(null); // State for storing the authenticated user
        const [startLocation, setStartLocation] = useState('');
        const [destination, setDestination] = useState('');
        const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
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
        const [location, setLocation] = useState('');
        const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';
        const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Replace with your actual API key

        const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
        const [planGenerated, setPlanGenerated] = useState(false);
        const [lastDestination, setLastDestination] = useState(''); // Store the last destination for which images/videos were fetched

        const [tripForFamily, setTripForFamily] = useState(false); // Track if the trip is for family
        const [familyElderlyCount, setFamilyElderlyCount] = useState('');
        const [familyLadiesCount, setFamilyLadiesCount] = useState('');
        const [familyChildrenCount, setFamilyChildrenCount] = useState('');
        const [familyPreferences, setFamilyPreferences] = useState('');
        const [showModal, setShowModal] = useState(false);
        

        // Fetch user details from Firestore based on authenticated user email
        const fetchUserDetailsFromFirestore = async (userEmail: string) => {
            const db = getFirestore(); // Get Firestore instance
            const userDocRef = doc(db, 'users', userEmail); // Assuming the document ID is user's email
            const docSnapshot = await getDoc(userDocRef);
        
            if (docSnapshot.exists()) {
            return docSnapshot.data();
            } else {
            console.warn("No user data found in Firestore.");
            return null;
            }
        };
        
        const db = getFirestore();

        const incrementPlanGenerationCount = async (userEmail: string) => {
            const userDocRef = doc(db, 'users', userEmail);  // Reference to the user's document
            
            try {
            const userDoc = await getDoc(userDocRef); // Get the user's document
            
            if (userDoc.exists()) {
                const currentCount = userDoc.data()?.planGenerationCount || 0; // Default to 0 if not set
                await updateDoc(userDocRef, {
                planGenerationCount: currentCount + 1,  // Increment the count
                });
                console.log('Plan count updated successfully');
            } else {
                // If the user doesn't have the field, initialize it
                await updateDoc(userDocRef, {
                planGenerationCount: 1,  // Initialize the count if the document exists but the count is missing
                });
                console.log('Initialized plan count');
            }
            } catch (error) {
            console.error('Error updating plan generation count:', error);
            }
        };

        // Fetch user data once the user is authenticated
        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
            if (authenticatedUser && authenticatedUser.email) {
                const userDocRef = doc(db, 'users', authenticatedUser.email);
                const userDoc = await getDoc(userDocRef);
                
                let planGenerationCount = 0;  // Default count
                if (userDoc.exists()) {
                planGenerationCount = userDoc.data()?.planGenerationCount || 0; // Retrieve the count or default to 0
                }
        
                // If the count exceeds the limit (3), show the modal
                if (planGenerationCount <= 3 || authenticatedUser.email === 'prasantshukla89@gmail.com') {
                setUser(authenticatedUser); // Set the authenticated user to state
                } else {
                setShowModal(true);  // Show subscription modal
                setLoading(false);  // Stop loading
                return;
                }
            } else {
                setUser(null); // Clear user state if not authenticated
            }
            });
            
            return unsubscribe;
        }, []);
        

        const planFetcher = async () => {
            setPlan('');
            setLoading(true);
            setError(null);
            setPlanGenerated(true);
          
            if (!user) {
              setError('User not authenticated.');
              setLoading(false);
              return;
            }
          
            try {
              // Fetch user details from the Firestore 'users' collection using the email ID
              const userDocRef = doc(db, 'users', user.email);
              const userDoc = await getDoc(userDocRef);
          
              if (!userDoc.exists()) {
                setError('Could not fetch user details. Please make sure you are logged in.');
                setLoading(false);
                return;
              }
          
              const userDetails = userDoc.data();
              console.log(userDetails);
          
              // Extract necessary fields from user details
              const { name, religion, favoritePlaces, believerOfGod, age, planGenerationCount = 0 } = userDetails;
          
              // Check plan generation limit (unless user is 'prasantshukla89@gmail.com')
              if (planGenerationCount >= 3 && user.email !== 'prasantshukla89@gmail.com') {
                setShowModal(true);
                setLoading(false);
                return;
              }
          
              // Fetch about the location
              fetchAboutLocation(destination);
          
              const userSpecificDetails = `
                Name: ${name}
                Religion: ${religion}
                Favorite Places: ${favoritePlaces}
                Believer of God: ${believerOfGod ? 'Yes' : 'No'}
                Age: ${age}
              `;
          
              let travelPlanPrompt = '';
          
              if (tripForFamily) {
                travelPlanPrompt = `I am planning a ${days}-day trip from ${startLocation} to ${destination} for my family. 
                They are ${peopleCount} people in total, with ${familyLadiesCount} ladies, ${familyElderlyCount} elders, and ${familyChildrenCount} children. 
                Total budget is ${budget}. Please consider the following family preferences for travel to create a detailed itinerary: 
                ${familyPreferences}
                The itinerary should include family-friendly travel routes, must-visit places, activities, and an estimated budget breakdown. 
                Additionally, if any members have special needs, include safety tips for elderly, ladies, and children.`;
              } else {
                travelPlanPrompt = `I am planning a ${days}-day trip from ${startLocation} to ${destination} for myself. 
                I am traveling alone. My budget is ${budget}. Please consider the following personal details to create a detailed itinerary: 
                ${userSpecificDetails}
                The itinerary should include travel routes, must-visit places, activities, and an estimated budget breakdown.`;
              }
          
              // Make API request to Gemini for travel plan generation
              const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                  contents: [
                    {
                      parts: [
                        {
                          text: travelPlanPrompt
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
          
              setImages([]);
              setNextPageUrl('');
              setTotalResults(0);
              setHasMore(true);
              setVideos([]);
              setActiveMediaType('photos');
              setVideoPlaying(null);
              videoRefs.current = {};
          
              setImageFetchDestination(destination);
              setActiveSection('plan');
              setPreviousValue(destination);
              setCurrentValue(destination);
              setLocation(destination);
          
              if (destination === location) {
                fetchNewsForDestination(location);
              } else {
                fetchNewsForDestination(destination);
              }
          
              // Increment plan generation count in Firestore
              incrementPlanGenerationCount(user.email);
          
              // Save trip data to Firestore
              const tripData = {
                email: user.email,
                name,
                startLocation,
                destination,
                days,
                budget,
                peopleCount,
                tripForFamily,
                familyElderlyCount,
                familyLadiesCount,
                familyChildrenCount,
                familyPreferences,
                generatedPlan: extractedPlan,
                feedbackSubmitted,
                createdAt: new Date().toISOString()
              };
          
              const tripRef = doc(collection(db, "trip"), user.email);
              await setDoc(tripRef, tripData, { merge: true });
          
              console.log("Trip data saved successfully!");
          
            } catch (err: any) {
              console.error('Error fetching the plan:', err);
              setError(err.message || 'Failed to fetch the plan. Please try again.');
              setPlan('');
            } finally {
              setLoading(false);
            }
          };
          


        const fetchAboutLocation = async (location: string) => {
            setLoading(true);
            setError(null);
        
            try {
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `I’m planning to travel to ${location}. Could you provide a detailed guide about the place, including:
        
                                                1. Historical Background:
                                                * A brief history of the city/country, including significant events, cultural shifts, and famous historical landmarks.
                                                
                                                2. Cultural Insights:
                                                    * Local customs, traditions, language, and important cultural aspects that would enrich my understanding and    interaction with locals.
                                                
                                                3. Top Attractions:
                                                * The best places to visit, including popular tourist destinations, hidden gems, and landmarks that reflect the city's heritage and culture.
                                                * Details on must-see museums, historical sites, and natural wonders in and around the destination.
                                                
                                                4. Local Cuisine:
                                                    * The best local foods and dishes to try, including any famous restaurants or markets known for authentic culinary experiences.
        
                                                5. Unique Experiences:
                                                    * Special activities or experiences unique to the destination (festivals, art scenes, adventure sports, etc.) that should not be missed.
                                                
                                                6. Practical Travel Tips:
                                                    * Local transportation options, the best time to visit (season/weather), safety tips, and any important travel regulations or recommendations for tourists.
                                                
                                                Please tailor the information to a first-time traveler who wants to explore both the well-known and off-the-beaten-path experiences, focusing on immersive and educational travel.`
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
        
                setLocationBio(response.data.candidates[0].content.parts[0].text);
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
        
        const fetchWeatherForDestination = async (location : string) => {
            setLoadingNews(true);
            setError(null);

            try {
                const response = await axios.post('/api/weather', { location: location });
            
                // Check if the API returns an error
                if (response.status === 500) {
                alert("Reminder: Try providing the complete name of the location for a better experience.");
                }
            
                if (response.status === 200) {
                    console.log(response);
                } else {
                setError('Failed to fetch weather data.');
                console.error('Error fetching weather:', response.status, response.data);
                }
            
            } catch (error) {
                setError('Failed to fetch weather.');
                console.error('Error fetching weather:', error);
            }
        }

        const fetchNewsForDestination = async (location: string) => {
            setLoadingNews(true);
            setError(null);

            try {
                    const response = await axios.post('/api/news', { location: location });
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

        // useEffect(() => {
        //     if (planGenerated && destination) {
        //         fetchNewsForDestination(destination);
        //     }
        // }, [destination, planGenerated]);

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
            <AuthGuard>
                <Navbar />
                <motion.div
                    className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`flex gap-6 mt-10 transition-all duration-700 ease-in-out`}>
                            {/* Left Column - Input Form */}
                            <div
                                className={`transition-all duration-700 ease-in-out ${
                                    plan ? 'w-full lg:w-1/2' : 'w-full lg:w-full'
                                }`}
                            >
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
                                    setTripForFamily={setTripForFamily}
                                    familyElderlyCount={familyElderlyCount}
                                    setFamilyElderlyCount={setFamilyElderlyCount}
                                    familyLadiesCount={familyLadiesCount}
                                    setFamilyLadiesCount={setFamilyLadiesCount}
                                    familyChildrenCount={familyChildrenCount}
                                    setFamilyChildrenCount={setFamilyChildrenCount}
                                    familyPreferences={familyPreferences}
                                    setFamilyPreferences={setFamilyPreferences}
                                />
                            </div>

                            {/* Right Column - Results */}
                            {plan && (
                                <div className={`transition-all duration-700 ease-in-out lg:w-1/2`}>
                                    <ResultsSection
                                        loading={loading}
                                        error={error}
                                        plan={plan}
                                        activeSection={activeSection}
                                        setActiveSection={setActiveSection}
                                        location={location}
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
                            )}
                        </div>
                    </div>
                </motion.div>


                {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                <h2 className="text-lg font-semibold text-gray-800">Subscription Expired</h2>
                <p className="text-gray-600 mt-2">Your free trial is over. Please subscribe to continue using the service.</p>
                <div className="mt-4 flex justify-end">
                <button className="ml-2 px-4 py-2 text-white bg-indigo-500 border rounded-md hover:bg-cyan-900  hover:text-black transition" onClick={() => router.push('/Component/Subscribe')}>
                    Subscribe
                </button>
                <button className="ml-2 px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition" onClick={() => router.push('/')}>
                    Close
                </button>
                </div>
            </div>
            </div>
        )}

            </AuthGuard>
        );
    };

    export default Index;