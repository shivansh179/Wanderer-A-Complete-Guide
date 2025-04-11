"use client"
"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { auth } from '@/FirebaseCofig';
import InputForm from './InputForm';
import ResultsSection from './ResultsSection';
import { Image, NewsItem, Video } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '../AuthGuard/AuthGuard';
import { collection, getFirestore, setDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import router from 'next/router';
import { FaSpinner, FaLock, FaCheckCircle } from 'react-icons/fa';

const Index = () => {
  const [user, setUser] = useState<any>(null);
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
  const [videoPlaying, setVideoPlaying] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [currentValue, setCurrentValue] = useState('');
  const [previousValue, setPreviousValue] = useState('');
  const [imageFetchDestination, setImageFetchDestination] = useState('');
  const [location, setLocation] = useState('');
  const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
  const [planGenerated, setPlanGenerated] = useState(false);
  const [lastDestination, setLastDestination] = useState('');
  const [tripForFamily, setTripForFamily] = useState(false);
  const [familyElderlyCount, setFamilyElderlyCount] = useState('');
  const [familyLadiesCount, setFamilyLadiesCount] = useState('');
  const [familyChildrenCount, setFamilyChildrenCount] = useState('');
  const [familyPreferences, setFamilyPreferences] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [planGenerationSuccess, setPlanGenerationSuccess] = useState(false);
  const [currentTripId, setCurrentTripId] = useState('');
  
  const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';
  const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW';
  const db = getFirestore();

  // Fetch user details from Firestore
  const fetchUserDetailsFromFirestore = async (userEmail: string) => {
    const userDocRef = doc(db, 'users', userEmail);
    const docSnapshot = await getDoc(userDocRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    } else {
      console.warn("No user data found in Firestore.");
      return null;
    }
  };

  // Increment plan generation count
  const incrementPlanGenerationCount = async (userEmail: string) => {
    const userDocRef = doc(db, 'users', userEmail);
    
    try {
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const currentCount = userDoc.data()?.planGenerationCount || 0;
        await updateDoc(userDocRef, {
          planGenerationCount: currentCount + 1,
        });
      } else {
        await updateDoc(userDocRef, {
          planGenerationCount: 1,
        });
      }
    } catch (error) {
      console.error('Error updating plan generation count:', error);
    }
  };

  // Check user authentication and plan generation count
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser && authenticatedUser.email) {
        const userDocRef = doc(db, 'users', authenticatedUser.email);
        const userDoc = await getDoc(userDocRef);
        
        let planGenerationCount = 0;
        if (userDoc.exists()) {
          planGenerationCount = userDoc.data()?.planGenerationCount || 0;
        }

        if (planGenerationCount <= 3 || authenticatedUser.email === 'prasantshukla89@gmail.com') {
          setUser(authenticatedUser);
        } else {
          setShowModal(true);
          setLoading(false);
          return;
        }
      } else {
        setUser(null);
      }
    });
    
    return unsubscribe;
  }, []);

  // Get user trips
  const getUserTrips = async () => {
    if (!user || !user.email) {
      console.error('User not authenticated');
      return [];
    }
    
    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().trips) {
        // Sort by creation date (newest first)
        return [...userDoc.data().trips].sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user trips:', error);
      return [];
    }
  };

  // Get trips by feedback status
  const getTripsByFeedbackStatus = async (hasFeedback: boolean) => {
    try {
      const allTrips = await getUserTrips();
      return allTrips.filter((trip: any) => trip.feedbackSubmitted === hasFeedback);
    } catch (error) {
      console.error('Error filtering trips by feedback status:', error);
      return [];
    }
  };

  // Save trip to Firebase
  const saveTrip = async (tripData: any, fullPlan: string) => {
    if (!user || !user.email) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      // Generate a unique trip ID
      const tripId = new Date().getTime().toString();
      
      // Create trip object without the full plan
      const tripToSave = {
        id: tripId,
        ...tripData,
        planSummary: fullPlan.substring(0, 200) + '...', // Just a preview
        hasPlan: true,
        feedbackSubmitted: false,
        createdAt: new Date().toISOString()
      };
      
      // Save to user's trips array
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        if (userDoc.data().trips) {
          await updateDoc(userDocRef, {
            trips: arrayUnion(tripToSave)
          });
        } else {
          await updateDoc(userDocRef, {
            trips: [tripToSave]
          });
        }
      } else {
        await setDoc(userDocRef, {
          trips: [tripToSave]
        });
      }
      
      // Save full plan separately
      const planDocRef = doc(db, 'plans', tripId);
      await setDoc(planDocRef, {
        userId: user.email,
        tripId,
        fullPlan,
        createdAt: new Date().toISOString()
      });
      
      setCurrentTripId(tripId);
      return tripId;
    } catch (error) {
      console.error('Error saving trip:', error);
      return null;
    }
  };

  // Fetch full plan from separate collection
  const fetchFullPlan = async (tripId: string) => {
    if (!tripId) {
      console.error('No trip ID provided');
      return null;
    }
    
    try {
      const planDocRef = doc(db, 'plans', tripId);
      const planDoc = await getDoc(planDocRef);
      
      if (planDoc.exists()) {
        return planDoc.data().fullPlan;
      } else {
        console.warn('No plan document found for this trip');
        return null;
      }
    } catch (error) {
      console.error('Error fetching full plan:', error);
      return null;
    }
  };

  // Update feedback status for a trip
  const updateTripFeedback = async (tripId: string, feedbackData: any) => {
    if (!user || !user.email || !tripId) {
      console.error('Missing user or trip ID');
      return false;
    }
    
    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().trips) {
        const trips = userDoc.data().trips;
        const updatedTrips = trips.map((trip: any) => {
          if (trip.id === tripId) {
            return {
              ...trip,
              feedbackSubmitted: true,
              feedbackData
            };
          }
          return trip;
        });
        
        await updateDoc(userDocRef, { trips: updatedTrips });
        
        // Save feedback separately if needed
        const feedbackDocRef = doc(db, 'feedback', tripId);
        await setDoc(feedbackDocRef, {
          userId: user.email,
          tripId,
          ...feedbackData,
          createdAt: new Date().toISOString()
        });
        
        setFeedbackSubmitted(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating feedback:', error);
      return false;
    }
  };


 
  

  // Load previous trip
  const loadPreviousTrip = async (tripId: string) => {
    try {
      // Get trip metadata
      const trips = await getUserTrips();
      const selectedTrip = trips.find((trip: any) => trip.id === tripId);
      
      if (!selectedTrip) {
        console.error('Trip not found');
        return;
      }
      
      // Set trip details
      setStartLocation(selectedTrip.startLocation);
      setDestination(selectedTrip.destination);
      setDays(selectedTrip.days);
      setBudget(selectedTrip.budget);
      setPeopleCount(selectedTrip.peopleCount);
      setTripForFamily(selectedTrip.tripForFamily);
      setFamilyElderlyCount(selectedTrip.familyElderlyCount || '');
      setFamilyLadiesCount(selectedTrip.familyLadiesCount || '');
      setFamilyChildrenCount(selectedTrip.familyChildrenCount || '');
      setFamilyPreferences(selectedTrip.familyPreferences || '');
      setCurrentTripId(selectedTrip.id);
      setFeedbackSubmitted(selectedTrip.feedbackSubmitted);
      setPlanGenerated(true);
      
      // Fetch the full plan from separate storage
      const fullPlan = await fetchFullPlan(tripId);
      if (fullPlan) {
        setPlan(fullPlan);
      } else {
        setPlan('Plan details not available. You may need to regenerate this plan.');
      }
      
      // Update other state values
      setImageFetchDestination(selectedTrip.destination);
      setActiveSection('plan');
      setPreviousValue(selectedTrip.destination);
      setCurrentValue(selectedTrip.destination);
      setLocation(selectedTrip.destination);
      
      // Fetch additional data
      fetchAboutLocation(selectedTrip.destination);
      fetchNewsForDestination(selectedTrip.destination);
    } catch (error) {
      console.error('Error loading trip:', error);
    }
  };

  // Generate travel plan
  const planFetcher = async () => {
    setPlan('');
    setLoading(true);
    setError(null);
    setPlanGenerationSuccess(false);
    setPlanGenerated(true);
  
    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
  
    try {
      // Fetch user details
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        setError('Could not fetch user details. Please make sure you are logged in.');
        setLoading(false);
        return;
      }
  
      const userDetails = userDoc.data();
      const { name, religion, favoritePlaces, believerOfGod, age, planGenerationCount = 0 } = userDetails;
  
      // Check plan generation limit
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
  
      // Make API request to Gemini
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
      setPlanGenerationSuccess(true);
  
      // Reset media states
      setImages([]);
      setNextPageUrl('');
      setTotalResults(0);
      setHasMore(true);
      setVideos([]);
      setActiveMediaType('photos');
      setVideoPlaying(null);
      videoRefs.current = {};
  
      // Update state values
      setImageFetchDestination(destination);
      setActiveSection('plan');
      setPreviousValue(destination);
      setCurrentValue(destination);
      setLocation(destination);
  
      // Fetch news
      if (destination === location) {
        fetchNewsForDestination(location);
      } else {
        fetchNewsForDestination(destination);
      }
  
      // Increment plan generation count
      incrementPlanGenerationCount(user.email);
  
      // Create trip data object WITHOUT the full plan
      const tripData = {
        email: user.email,
        name: userDetails.name,
        startLocation,
        destination,
        days,
        budget,
        peopleCount,
        tripForFamily,
        familyElderlyCount: familyElderlyCount || '',
        familyLadiesCount: familyLadiesCount || '',
        familyChildrenCount: familyChildrenCount || '',
        familyPreferences: familyPreferences || '',
      };
  
      // Save the trip to Firestore (without full plan in trips array)
      await saveTrip(tripData, extractedPlan);
  
    } catch (err: any) {
      console.error('Error fetching the plan:', err);
      setError(err.message || 'Failed to fetch the plan. Please try again.');
      setPlan('');
    } finally {
      setLoading(false);
    }
  };

  // Delete a trip
  const deleteTrip = async (tripId: string) => {
    if (!user || !user.email) return false;
    
    try {
      // First, get all user trips
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().trips) {
        // Filter out the trip to delete
        const updatedTrips = userDoc.data().trips.filter((trip: any) => trip.id !== tripId);
        
        // Update the user document with the filtered trips
        await updateDoc(userDocRef, { trips: updatedTrips });
        
        // Delete the full plan document
        try {
          const planDocRef = doc(db, 'plans', tripId);
          await deleteDoc(planDocRef);
        } catch (err) {
          console.warn('Could not delete plan document (might not exist)');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting trip:', error);
      return false;
    }
  };

  // Submit feedback for current trip
  const submitFeedback = async (feedbackData: any) => {
    if (!currentTripId) {
      console.error('No active trip selected');
      return false;
    }
    
    const result = await updateTripFeedback(currentTripId, feedbackData);
    return result;
  };

  // Fetch destination information
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
                  text: `I'm planning to travel to ${location}. Could you provide a detailed guide about the place, including:

                          1. Historical Background:
                          * A brief history of the city/country, including significant events, cultural shifts, and famous historical landmarks.
                          
                          2. Cultural Insights:
                          * Local customs, traditions, language, and important cultural aspects that would enrich my understanding and interaction with locals.
                          
                          3. Top Attractions:
                          * The best places to visit, including popular tourist destinations, hidden gems, and landmarks that reflect the city's heritage and culture.
                          * Details on must-see museums, historical sites, and natural wonders in and around the destination.
                          
                          4. Local Cuisine:
                          * The best local foods and dishes to try, including any famous restaurants or markets known for authentic culinary experiences.

                          5. Unique Experiences:
                          * Special activities or experiences unique to the destination (festivals, art scenes, adventure sports, etc.) that should not be missed.
                          
                          6. Practical Travel Tips:
                          * Local transportation options, the best time to visit (season/weather), safety tips, and any important travel regulations or recommendations for tourists.

                          7. Provide currency and weather forecast of that place. 

                          8. Also Provide Links and docs of some youtube channels and docs one can go through about that place.

                          9. Provide some hospitals, medical stores and emergency helpline numbers of the destination.
                          
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
      console.error('Error fetching location information:', err);
      setError(err.message || 'Failed to fetch location information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch images
  const imageFetcher = async (query: string) => {
    setImageLoading(true);
    try {
      let imageResponse;

      if (nextPageUrl) {
        imageResponse = await axios.get(nextPageUrl, {
          headers: {
            'Authorization': PEXELS_API_KEY,
          }
        });
      } else {
        imageResponse = await axios.get(`https://api.pexels.com/v1/search?query=${query}`, {
          headers: {
            'Authorization': PEXELS_API_KEY,
          }
        });
      }

      if (imageResponse.data.photos && imageResponse.data.photos.length > 0) {
        setImages((prevImages) => [...prevImages, ...imageResponse.data.photos]);
      } else {
        console.warn("No photos found in API response.");
        setHasMore(false);
      }

      setNextPageUrl(imageResponse.data.next_page || '');
      setTotalResults(imageResponse.data.total_results || 0);
      setHasMore(!!imageResponse.data.next_page);

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

  // Fetch videos
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

      setVideos(videoResponse.data.videos || []);
      setVideoPlaying(null);
      
      // Pause all videos
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

  // Fetch weather
  const fetchWeatherForDestination = async (location: string) => {
    setLoadingNews(true);
    setError(null);

    try {
      const response = await axios.post('/api/weather', { location: location });
    
      if (response.status === 500) {
        alert("Reminder: Try providing the complete name of the location for a better experience.");
      }

    } catch (error) {
      setError('Failed to fetch weather.');
      console.error('Error fetching weather:', error);
    }
  }

  // Fetch news
  const fetchNewsForDestination = async (location: string) => {
    setLoadingNews(true);
    setError(null);

    try {
      const response = await axios.post('/api/news', { location: location });
      if (response.status === 200) {
        setNews(response.data.articles);
        fetchWeatherForDestination(destination);
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

  // Toggle image power
  const isActive = () => {
    setImagePower(!imagePower);
  };

  // Load more images
  const loadMore = useCallback(() => {
    if (!imageLoading && hasMore && nextPageUrl) {
      imageFetcher(imageFetchDestination);
    }
  }, [imageLoading, hasMore, nextPageUrl, imageFetchDestination]);

  // Initial image load and media type selection
  useEffect(() => {
    if (activeSection === 'photos' && planGenerated) {
      if (activeMediaType === 'photos') {
        setImages([]);
        setNextPageUrl('');
        imageFetcher(imageFetchDestination);
      } else if (activeMediaType === 'videos') {
        setVideos([]);
        fetchVideos();
      }
      setLastDestination(destination);
    }
  }, [activeSection, activeMediaType, planGenerated, imageFetchDestination]);

  // Video toggle
  const handleVideoToggle = (videoId: number) => {
    setVideoPlaying((prevVideoId) => (prevVideoId === videoId ? null : videoId));

    const videoRef = videoRefs.current[videoId];

    if (videoRef) {
      if (videoPlaying === videoId) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
    }
  };

  // Switch media type
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

  // Animation variants
  const pageTransition = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.4
      }
    }
  };

  // Close subscription modal and redirect
  const handleSubscribe = () => {
    setModalAnimating(true);
    setTimeout(() => {
      router.push('/Component/Subscribe');
    }, 300);
  };

  // Close subscription modal and go home
  const handleClose = () => {
    setModalAnimating(true);
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  return (
    <AuthGuard>
      <Navbar />
      <div className="bg-gray-50 text-gray-900 dark:text-white  bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-700 min-h-screen">
        <div className="pt-24 pb-16">
          <motion.div
            className="container mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageTransition}
          >
            {!plan && (
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                  Plan Your Perfect Journey
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Let us create a personalized travel itinerary tailored just for you. Simply fill in your travel details below.
                </p>
              </div>
            )}

            <div className={`flex flex-wrap gap-6 transition-all duration-700 ease-in-out`}>
              {/* Input Form */}
              <AnimatePresence mode="wait">
                {!plan && (
                  <motion.div
                    className="w-full lg:w-2/3 mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <h2 className="text-2xl font-bold text-white">Travel Details</h2>
                        <p className="text-blue-100">Tell us about your upcoming adventure</p>
                      </div>
                      
                      <div className="p-6">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div 
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div 
                      className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <FaSpinner className="text-4xl text-blue-600 dark:text-blue-400" />
                          </motion.div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Creating Your Perfect Itinerary
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          We're designing a personalized travel plan for your journey to {destination}. This may take a moment...
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Animation */}
              <AnimatePresence>
                {planGenerationSuccess && !loading && (
                  <motion.div 
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onAnimationComplete={() => {
                      setTimeout(() => {
                        setPlanGenerationSuccess(false);
                      }, 1500);
                    }}
                  >
                    <motion.div 
                      className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md shadow-2xl flex items-center justify-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.1, opacity: 0 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                      >
                        <FaCheckCircle className="text-6xl text-green-500" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results Section */}
              {plan && (
                <motion.div 
                  className="w-full"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            Your {days}-Day Trip to {destination}
                          </h2>
                          <p className="text-blue-100">
                            From {startLocation} • Budget: {budget}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setPlan('');
                            setPlanGenerated(false);
                          }}
                          className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition"
                        >
                          New Plan
                        </button>
                      </div>
                    </div>
                    
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
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <FaLock className="text-2xl" />
                  <h2 className="text-xl font-bold">Premium Feature</h2>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You've reached the limit of your free trial. Unlock unlimited travel planning by subscribing to our premium plan.
                </p>
                
                <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Premium Benefits:</h3>
                  <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Unlimited travel plans</span>
                    </li><li className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Unlimited travel plans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Access to premium destinations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Advanced itinerary customization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 flex-shrink-0" />
                      <span>Offline access to your plans</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    onClick={handleClose}
                    className={`px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg transition ${
                      modalAnimating ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    disabled={modalAnimating}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleSubscribe}
                    className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md transition ${
                      modalAnimating ? 'opacity-50 pointer-events-none' : 'hover:from-blue-700 hover:to-indigo-700'
                    }`}
                    disabled={modalAnimating}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthGuard>
  );
};

export default Index;