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
// --- Toastify Imports ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS


 

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [days, setDays] = useState('');
  const [budget, setBudget] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [ladiesCount, setLadiesCount] = useState(''); // Note: Consider removing if only using family counts
  const [elderlyCount, setElderlyCount] = useState(''); // Note: Consider removing if only using family counts
  const [childrenCount, setChildrenCount] = useState(''); // Note: Consider removing if only using family counts
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

  // IMPORTANT: Store API keys securely, preferably in environment variables
  // For demonstration purposes, they are here. Replace with process.env.REACT_APP_GEMINI_API_KEY etc.
  const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU'; // Your primary key
  const FALLBACK_GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k'; // Your fallback key
  const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Your Pexels key

  const db = getFirestore();

  // --- Firestore Functions (Mostly Unchanged) ---

  const fetchUserDetailsFromFirestore = async (userEmail: string) => {
    // ... (keep existing implementation)
     const userDocRef = doc(db, 'users', userEmail);
    const docSnapshot = await getDoc(userDocRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    } else {
      console.warn("No user data found in Firestore.");
      return null;
    }
  };

  const incrementPlanGenerationCount = async (userEmail: string) => {
    // ... (keep existing implementation)
    const userDocRef = doc(db, 'users', userEmail);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const currentCount = userDoc.data()?.planGenerationCount || 0;
        await updateDoc(userDocRef, {
          planGenerationCount: currentCount + 1,
        });
      } else {
        // If user doc doesn't exist, create it with count 1
         await setDoc(userDocRef, {
          planGenerationCount: 1,
          // Add other default fields if necessary upon first plan generation
        }, { merge: true }); // Use merge: true to avoid overwriting if created concurrently
      }
    } catch (error) {
      console.error('Error updating plan generation count:', error);
    }
  };

  const saveTrip = async (tripData: any, fullPlan: string) => {
    // ... (keep existing implementation)
    if (!user || !user.email) {
      console.error('User not authenticated');
      return null;
    }

    try {
      const tripId = new Date().getTime().toString();
      const tripToSave = {
        id: tripId,
        ...tripData,
        planSummary: fullPlan.substring(0, 200) + '...',
        hasPlan: true,
        feedbackSubmitted: false,
        createdAt: new Date().toISOString()
      };

      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

       if (userDoc.exists()) {
            // Use arrayUnion to add the new trip without overwriting existing ones
            await updateDoc(userDocRef, {
                trips: arrayUnion(tripToSave)
            });
        } else {
            // If the document doesn't exist, create it with the trips array
            await setDoc(userDocRef, {
                trips: [tripToSave]
                // Add other initial user fields if necessary
            });
        }

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

  const fetchFullPlan = async (tripId: string) => {
    // ... (keep existing implementation)
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

   const getUserTrips = async () => {
        if (!user || !user.email) {
            console.error('User not authenticated');
            return [];
        }

        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().trips) {
                // Ensure trips is an array before sorting
                const tripsArray = Array.isArray(userDoc.data().trips) ? userDoc.data().trips : [];
                // Sort by creation date (newest first)
                return [...tripsArray].sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            }

            return [];
        } catch (error) {
            console.error('Error fetching user trips:', error);
            return [];
        }
    };

    const getTripsByFeedbackStatus = async (hasFeedback: boolean) => {
        try {
            const allTrips = await getUserTrips();
            // Ensure trip.feedbackSubmitted exists before comparing
            return allTrips.filter((trip: any) => !!trip.feedbackSubmitted === hasFeedback);
        } catch (error) {
            console.error('Error filtering trips by feedback status:', error);
            return [];
        }
    };


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
                            feedbackData // Store feedback data directly if needed, or just the status
                        };
                    }
                    return trip;
                });

                await updateDoc(userDocRef, { trips: updatedTrips });

                // Optionally save feedback separately if detailed feedback needs querying
                const feedbackDocRef = doc(db, 'feedback', tripId);
                await setDoc(feedbackDocRef, {
                    userId: user.email,
                    tripId,
                    ...feedbackData,
                    createdAt: new Date().toISOString()
                });

                setFeedbackSubmitted(true); // Update local state
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error updating feedback:', error);
            return false;
        }
    };


    const deleteTrip = async (tripId: string) => {
        if (!user || !user.email) return false;

        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().trips) {
                const updatedTrips = userDoc.data().trips.filter((trip: any) => trip.id !== tripId);
                await updateDoc(userDocRef, { trips: updatedTrips });

                // Delete the associated plan document
                try {
                    const planDocRef = doc(db, 'plans', tripId);
                    await deleteDoc(planDocRef);
                } catch (err) {
                    console.warn('Could not delete plan document (might not exist or already deleted):', err);
                }
                 // Optionally delete feedback document too
                try {
                    const feedbackDocRef = doc(db, 'feedback', tripId);
                    await deleteDoc(feedbackDocRef);
                } catch (err) {
                     console.warn('Could not delete feedback document (might not exist or already deleted):', err);
                }


                return true;
            }

            return false; // User document or trips array doesn't exist
        } catch (error) {
            console.error('Error deleting trip:', error);
            return false;
        }
    };


    const submitFeedback = async (feedbackData: any) => {
        if (!currentTripId) {
            console.error('No active trip selected for feedback');
            toast.error("Cannot submit feedback: No trip is currently selected.");
            return false;
        }

        const result = await updateTripFeedback(currentTripId, feedbackData);
        if (result) {
            toast.success("Feedback submitted successfully!");
        } else {
            toast.error("Failed to submit feedback. Please try again.");
        }
        return result;
    };


    const loadPreviousTrip = async (tripId: string) => {
        setLoading(true); // Show loading indicator while loading
        setError(null);
        setPlan(''); // Clear current plan before loading
        try {
            const trips = await getUserTrips();
            const selectedTrip = trips.find((trip: any) => trip.id === tripId);

            if (!selectedTrip) {
                console.error('Trip not found:', tripId);
                setError('Selected trip could not be found.');
                toast.error('Selected trip could not be found.');
                setLoading(false);
                return;
            }

            // Fetch the full plan first
            const fullPlan = await fetchFullPlan(tripId);

            if (!fullPlan) {
                console.warn('Full plan details not available for trip:', tripId);
                // Decide how to handle missing plan: Show error, allow regeneration?
                // For now, set a placeholder and allow UI to render
                setPlan('Plan details not available. You might need to regenerate this plan if needed.');
                 toast.warn('Plan details not available for this trip.');
            } else {
                 setPlan(fullPlan);
            }


            // Set state based on the loaded trip
            setStartLocation(selectedTrip.startLocation || '');
            setDestination(selectedTrip.destination || '');
            setDays(selectedTrip.days || '');
            setBudget(selectedTrip.budget || '');
            setPeopleCount(selectedTrip.peopleCount || '');
            setTripForFamily(selectedTrip.tripForFamily || false);
            setFamilyElderlyCount(selectedTrip.familyElderlyCount || '');
            setFamilyLadiesCount(selectedTrip.familyLadiesCount || '');
            setFamilyChildrenCount(selectedTrip.familyChildrenCount || '');
            setFamilyPreferences(selectedTrip.familyPreferences || '');
            setCurrentTripId(selectedTrip.id); // Set the current trip ID
            setFeedbackSubmitted(selectedTrip.feedbackSubmitted || false); // Update feedback status
            setPlanGenerated(true); // Mark plan as "generated" (loaded)

            // Update UI related states
            const currentDestination = selectedTrip.destination || '';
            setImageFetchDestination(currentDestination);
            setActiveSection('plan'); // Default to plan view
            setPreviousValue(currentDestination); // For potential comparison later
            setCurrentValue(currentDestination); // For potential comparison later
            setLocation(currentDestination); // Used by ResultsSection

            // Fetch associated data if destination exists
            if (currentDestination) {
                fetchAboutLocation(currentDestination);
                fetchNewsForDestination(currentDestination);
                // Reset and potentially fetch media if needed immediately
                setImages([]);
                setVideos([]);
                setNextPageUrl('');
                setHasMore(true);
                 // Decide if you want to auto-load photos/videos here or wait for user interaction
                 // Example: Trigger photo fetch if photos tab is active by default
                // if (activeSection === 'photos') {
                //    imageFetcher(currentDestination);
                // }
            } else {
                // Handle case where destination might be missing in old data
                console.warn("Loaded trip is missing destination information.");
                 setError("Loaded trip is missing destination information.");
                 toast.warn("Loaded trip data is incomplete (missing destination).");
            }


        } catch (error) {
            console.error('Error loading previous trip:', error);
            setError('Failed to load the selected trip. Please try again.');
             toast.error('Failed to load the selected trip.');
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };


  // --- Auth State Change ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser && authenticatedUser.email) {
        const userDocRef = doc(db, 'users', authenticatedUser.email);
        try {
          const userDoc = await getDoc(userDocRef);
          let planGenerationCount = 0;
          if (userDoc.exists()) {
            planGenerationCount = userDoc.data()?.planGenerationCount || 0;
          }

          // Allow admins or users within the limit
          if (planGenerationCount < 3 || authenticatedUser.email === 'prasantshukla89@gmail.com') {
             setUser(authenticatedUser);
             setShowModal(false); // Ensure modal is hidden if user becomes eligible
          } else {
            console.log(`User ${authenticatedUser.email} reached plan limit (${planGenerationCount}). Showing modal.`);
            setUser(authenticatedUser); // Keep user object but show modal
            setShowModal(true);
            setLoading(false); // Stop any loading process
          }
        } catch (error) {
           console.error("Error fetching user data during auth check:", error);
            setUser(null); // Log out user if data fetch fails? Or handle differently?
             toast.error("Could not verify your plan usage. Please try again.");
        }

      } else {
        setUser(null);
        setShowModal(false); // Hide modal if user logs out
      }
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [db]); // Add db dependency


  // --- Plan Generation ---
  const planFetcher = async () => {
    setPlan('');
    setLoading(true);
    setError(null);
    setPlanGenerationSuccess(false);
    setPlanGenerated(false); // Reset generated state

    if (!user || !user.email) {
      setError('User not authenticated. Please log in.');
      toast.error('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    let userDetails: any;
    let planGenerationCount = 0;

    try {
      // Fetch user details and count *before* proceeding
       const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // Handle case where user doc might not exist yet (e.g., first time user just signed up)
            // Option 1: Create a basic doc here
            // Option 2: Rely on profile completion step elsewhere
             console.warn(`User document for ${user.email} not found. Creating or using defaults.`);
             // Create a default structure if needed, or ensure profile completion redirects
             // For now, assume defaults or that required fields are handled elsewhere
             userDetails = { name: user.displayName || "User", /* other defaults */ };
             // If creating here: await setDoc(userDocRef, { email: user.email, planGenerationCount: 0, createdAt: new Date().toISOString() });
        } else {
            userDetails = userDoc.data();
            planGenerationCount = userDetails?.planGenerationCount || 0;
        }


      // Check plan generation limit AGAIN (important safety check)
      if (planGenerationCount >= 3 && user.email !== 'prasantshukla89@gmail.com') {
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Fetch about location concurrently (optional optimization)
       fetchAboutLocation(destination); // Start fetching about info

      const userSpecificDetails = `
        Name: ${userDetails?.name || user.displayName || 'N/A'}
        Religion: ${userDetails?.religion || 'N/A'}
        Favorite Places: ${userDetails?.favoritePlaces || 'N/A'}
        Believer of God: ${userDetails?.believerOfGod ? 'Yes' : 'No'}
        Age: ${userDetails?.age || 'N/A'}
      `;

      let travelPlanPrompt = '';
      let fallBackPrompt = ''; // Define fallback prompt structure

        if (tripForFamily) {
            travelPlanPrompt = `I am planning a ${days}-day trip from ${startLocation} to ${destination} for my family.
            They are ${peopleCount} people in total, with ${familyLadiesCount || 0} ladies, ${familyElderlyCount || 0} elders, and ${familyChildrenCount || 0} children.
            Total budget is ${budget}. Please consider the following family preferences for travel to create a detailed itinerary:
            ${familyPreferences || 'No specific preferences mentioned.'}
            The itinerary should include family-friendly travel routes, must-visit places, activities, and an estimated budget breakdown.
            Additionally, if any members have special needs, include safety tips for elderly, ladies, and children. Focus on realistic options within the budget.`;

            fallBackPrompt = `Generate a detailed ${days}-day family travel itinerary from ${startLocation} to ${destination}.
            Budget: ${budget}.
            Group: ${peopleCount} total (${familyLadiesCount || 0} ladies, ${familyElderlyCount || 0} elders, ${familyChildrenCount || 0} children).
            Preferences: ${familyPreferences || 'General family-friendly activities'}.
            Include: Daily plan (timing, activity, est. cost), transport, accommodation ideas (budget-friendly), safety tips. Use markdown format.`;
        } else {
             travelPlanPrompt = `I am planning a ${days}-day solo trip from ${startLocation} to ${destination}.
             My budget is ${budget}. Please consider the following personal details to create a detailed itinerary:
             ${userSpecificDetails}
             The itinerary should include travel routes, must-visit places, activities suited to my profile, and an estimated budget breakdown. Focus on realistic options within the budget.`;

              fallBackPrompt = `Generate a detailed ${days}-day solo travel itinerary from ${startLocation} to ${destination}.
              Budget: ${budget}.
              Traveler Profile: ${userSpecificDetails}.
              Include: Daily plan (timing, activity, est. cost), transport, accommodation ideas (budget/solo-friendly), relevant activities based on profile. Use markdown format.`;
        }


      let extractedPlan = '';
      let primaryModelFailed = false;

      // --- Attempt 1: Primary Model (Gemini 1.5 Flash) ---
      try {
        console.log("Attempting plan generation with Primary Model...");
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: travelPlanPrompt }] }] },
          { headers: { 'Content-Type': 'application/json' }, timeout: 45000 } // Added timeout
        );

        // Check response carefully
        extractedPlan = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!extractedPlan || extractedPlan.trim().length < 150) { // Stricter check
          console.warn("Primary model response was insufficient.");
          primaryModelFailed = true;
        } else {
          console.log("Primary model succeeded.");
        }

      } catch (err: any) {
        console.error('Error calling Primary Model:', err.response?.data || err.message);
        primaryModelFailed = true; // Mark primary as failed on error
         // Optionally, show a less alarming message if it's just a timeout or rate limit
         if (axios.isCancel(err)) {
             console.log('Primary request canceled:', err.message);
         } else if (err.code === 'ECONNABORTED') {
             console.warn('Primary model request timed out.');
         } else {
            // Keep generic error for other issues
            //setError('An issue occurred with the primary AI. Trying backup...'); // Set temporary error
         }
      }

      // --- Attempt 2: Fallback Model (Gemma) ---
      if (primaryModelFailed) {
        setError(null); // Clear temporary error if any
        console.warn("Switching to Fallback Model...");
        toast.info("Primary AI is busy or unavailable. Trying backup...", { autoClose: 3500 }); // Show toast

        try {
          const fallbackResponse = await axios.post(
            // --- Ensure correct endpoint for Gemma 3 ---
             // Check Google AI Studio or docs for the exact endpoint if this changes
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${FALLBACK_GEMINI_API_KEY}`, // Example using Gemma 2 27b
            { contents: [{ parts: [{ text: fallBackPrompt }] }] }, // Using the simplified fallback prompt
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 } // Longer timeout for potentially slower model
          );

          extractedPlan = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!extractedPlan || extractedPlan.trim().length < 100) {
            console.error("Fallback model also provided insufficient response.");
            setError('Failed to generate plan using both primary and backup AI models. Please try again later.');
            toast.error('Sorry, we could not generate the plan right now.');
            setPlan(''); // Ensure plan is empty
          } else {
            console.log("Fallback model succeeded.");
            setError(null); // Clear any previous errors if fallback works
          }
        } catch (fallbackErr: any) {
          console.error('Error calling Fallback Model:', fallbackErr.response?.data || fallbackErr.message);
          setError('Failed to generate plan. Both AI models encountered issues.');
          toast.error('Sorry, plan generation failed completely.');
          setPlan(''); // Ensure plan is empty
        }
      }

       if (extractedPlan && extractedPlan.trim().length >= 100) {
         setPlan(extractedPlan);
         setPlanGenerationSuccess(true);  
         setPlanGenerated(true); 

           setImages([]);
         setNextPageUrl('');
         setTotalResults(0);
         setHasMore(true);
         setVideos([]);
         setActiveMediaType('photos'); // Default to photos
         setVideoPlaying(null);
         videoRefs.current = {};

         // Update UI state values for the new plan
         setImageFetchDestination(destination);
         setActiveSection('plan'); // Show the plan first
         setPreviousValue(currentValue); // Store old destination if needed
         setCurrentValue(destination);
         setLocation(destination); // Update location for other components
         setLastDestination(destination); // Track last destination for media fetches

          fetchNewsForDestination(destination);

          await incrementPlanGenerationCount(user.email);

          const tripData = {
             email: user.email,
             name: userDetails?.name || user.displayName || 'User',
             startLocation,
             destination,
             days,
             budget,
             peopleCount,
             tripForFamily,
             familyElderlyCount: tripForFamily ? familyElderlyCount : '', // Only save family details if it's a family trip
             familyLadiesCount: tripForFamily ? familyLadiesCount : '',
             familyChildrenCount: tripForFamily ? familyChildrenCount : '',
             familyPreferences: tripForFamily ? familyPreferences : '',
          };


         // Save the trip metadata and link to the full plan
         const savedTripId = await saveTrip(tripData, extractedPlan);
          if (!savedTripId) {
                console.error("Failed to save the generated trip to database.");
                 toast.error("Plan generated, but failed to save the trip. Please try saving manually if needed.");
            }

       } else if (!error) {
           // This case handles where both models returned insufficient content but didn't throw an error
           setError('The AI could not generate a detailed plan with the provided information. Please try adjusting your request.');
           toast.warn('Could not generate a detailed plan. Try being more specific or adjusting the parameters.');
       }


    } catch (err: any) {
       // Catch any unexpected errors during the process (e.g., Firestore access)
       console.error('Unhandled error during plan generation process:', err);
       setError(err.message || 'An unexpected error occurred during plan generation.');
        toast.error('An unexpected error occurred. Please try again.');
       setPlan('');
    } finally {
      setLoading(false); // Ensure loading is always turned off
    }
  };


  // --- Fetch About Location (with fallback) ---
  const fetchAboutLocation = async (locationName: string) => {
      // setLoading(true); // Consider a separate loading state for 'about' section if needed
      setError(null); // Clear previous errors specific to location info
      setLocationBio(''); // Clear previous bio

      if (!locationName) {
          console.warn("fetchAboutLocation called with empty location");
          return;
      }

      const locationPrompt = `
      You are a travel assistant. Create a **comprehensive travel guide** for a traveler visiting ${destination}. The guide should be informative, user-friendly, and clearly formatted using markdown. Cover the following points:
      
      ## 🗺️ 1. Overview & Historical Significance
      - Provide a brief history of the location.
      - Include any cultural, political, or spiritual importance the place holds.
      
      ## 🌍 2. Culture & Local Customs
      - Key cultural aspects and traditions.
      - Language(s) spoken and 5-10 useful phrases with English translations.
      - Important etiquette and behavior tips for visitors (e.g., dress code, gestures to avoid).
      
      ## 📸 3. Top 5 Must-Visit Attractions
      - Include a mix of popular landmarks and hidden gems.
      - Provide brief descriptions and what makes each spot unique.
      
      ## 🍽️ 4. Must-Try Local Cuisine
      - List 3–5 iconic dishes or drinks with a short description.
      - Mention any food etiquette if important.
      
      ## 🎉 5. Unique Local Experiences
      - Include festivals, workshops, traditional markets, or seasonal events.
      - Suggest immersive cultural activities travelers can join.
      
      ## 🧭 6. Travel Tips & Practical Info
      - Best time of year to visit (weather, festivals, crowds).
      - Overview of local transportation options (e.g., tuk-tuks, metro, local buses).
      - Safety tips (e.g., areas to avoid, common scams).
      - Dress code or modesty expectations if relevant.
      - Accessibility tips for travelers with disabilities.
      
      ## 💰 7. Currency & Cost Expectations
      - Name and abbreviation of local currency.
      - General cost of meals, transport, and accommodation (budget-midrange).
      
      ## 🌤️ 8. Weather & Climate
      - General climate type (tropical, arid, temperate, etc.).
      - Typical weather during current season.
      
      ## 🚨 9. Emergency Contacts
      - General emergency number (police, ambulance, fire).
      - Tourist police contact if available.
      - Local woman helpline number.
      - Child helpline number.
      
      ## 🏥 10. Hospitals & Clinics
      - List 2–3 well-known hospitals or clinics (with names and general locations).
      
      ## 📱 11. SIM Cards & Internet
      - Best options for tourists (prepaid SIM cards, eSIMs, top providers).
      - Where to buy and typical costs.
      
      ## 🔗 12. Additional Resources & References
      - Suggest 3–5 reliable **YouTube channels**, **websites**, or **blogs** that provide visual tours, travel tips, or cultural insights about the place.
      
      ## ✅ Format Notes:
      - Use clear markdown headings (## or ###).
      - Use bullet points or numbered lists where appropriate.
      - Be concise but informative. Prioritize traveler usefulness.
      - Feel free to add anything region-specific that would help tourists enjoy and respect the destination.
      `;
      

      let bioText = '';
      let primaryFailed = false;

      // Attempt 1: Primary Model
       try {
            console.log(`Fetching 'About' for ${locationName} with Primary Model...`);
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: locationPrompt }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
            );
            bioText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
             if (!bioText || bioText.trim().length < 100) {
                console.warn("Primary model 'About' response insufficient.");
                primaryFailed = true;
            } else {
                 console.log("Primary model 'About' fetch succeeded.");
            }
        } catch (err: any) {
             console.error(`Error fetching 'About' with Primary Model for ${locationName}:`, err.response?.data || err.message);
            primaryFailed = true;
        }


      // Attempt 2: Fallback Model
      if (primaryFailed) {
          console.warn(`Switching to Fallback Model for 'About' ${locationName}...`);
          toast.info(`Fetching location details using backup...`, { autoClose: 2000 });

          try {
               const fallbackResponse = await axios.post(
                // Use the appropriate endpoint for your fallback model
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${FALLBACK_GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: locationPrompt }] }] }, // Can reuse the same prompt
                { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
            );
             bioText = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!bioText || bioText.trim().length < 100) {
                 console.error("Fallback 'About' model also provided insufficient response.");
                  setLocationBio('Could not retrieve detailed information about this location at the moment.');
                 // Optionally set an error state if needed
             } else {
                  console.log("Fallback model 'About' fetch succeeded.");
             }

          } catch (fallbackErr: any) {
              console.error(`Error fetching 'About' with Fallback Model for ${locationName}:`, fallbackErr.response?.data || fallbackErr.message);
              setLocationBio('Error retrieving location information.'); // Set error message in bio
          }
      }


      setLocationBio(bioText || 'No detailed information available.'); // Set final bio text

      // setLoading(false); // Turn off 'about' loading state if used
  };


  // --- Media Fetching (Images/Videos - Unchanged logic, added safety) ---
  const imageFetcher = async (query: string, isLoadMore = false) => {
      if (!query) {
          console.warn("Image fetcher called with empty query.");
          return;
      }
      if (imageLoading && isLoadMore) return; // Prevent multiple simultaneous loads

      console.log(`Fetching images for: ${query}, Load More: ${isLoadMore}`);
      setImageLoading(true);
      setError(null); // Clear media-specific errors

      const url = isLoadMore && nextPageUrl
          ? nextPageUrl
          : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`; // Fetch 15 initially

      try {
          const imageResponse = await axios.get(url, {
              headers: { 'Authorization': PEXELS_API_KEY },
              timeout: 15000 // Add timeout
          });

          if (imageResponse.data?.photos && imageResponse.data.photos.length > 0) {
               setImages((prevImages) => isLoadMore ? [...prevImages, ...imageResponse.data.photos] : imageResponse.data.photos);
               setNextPageUrl(imageResponse.data.next_page || '');
               setTotalResults(imageResponse.data.total_results || 0);
               setHasMore(!!imageResponse.data.next_page);
          } else {
               console.warn("No more photos found or empty response from Pexels.");
               if (!isLoadMore) setImages([]); // Clear images if initial search yields nothing
                setHasMore(false);
               setNextPageUrl(''); // Ensure next page is cleared
          }

      } catch (err: any) {
          console.error('Error fetching images:', err.response?.data || err.message);
          setError('Failed to load images from Pexels.');
          toast.error('Could not load images.');
          // Don't clear existing images on error during load more
          if (!isLoadMore) setImages([]);
           setHasMore(false); // Stop further loading attempts on error
          setNextPageUrl('');
      } finally {
          setImageLoading(false);
      }
  };


  const fetchVideos = async () => {
     if (!destination) {
          console.warn("fetchVideos called without a destination.");
          return;
      }
      if (imageLoading) return; // Use same loading flag for simplicity

      console.log(`Fetching videos for: ${destination}`);
      setImageLoading(true); // Reuse imageLoading state
      setError(null);
      setVideos([]); // Clear previous videos

      try {
          const videoResponse = await axios.get(
              `https://api.pexels.com/videos/search?query=${encodeURIComponent(destination)}&per_page=10`,
              {
                  headers: { 'Authorization': PEXELS_API_KEY },
                  timeout: 20000 // Video search might take longer
              }
          );

           const fetchedVideos = videoResponse.data?.videos || [];
           setVideos(fetchedVideos);
            if (fetchedVideos.length === 0) {
                 console.warn("No videos found for this destination on Pexels.");
                 // Optionally show a message in the UI instead of just empty
             }

          setVideoPlaying(null); // Reset playing state

          // Pause any potentially playing videos from previous load
          Object.values(videoRefs.current).forEach((videoRef) => {
              if (videoRef && !videoRef.paused) {
                  videoRef.pause();
              }
          });

      } catch (err: any) {
          console.error('Error fetching videos:', err.response?.data || err.message);
          setError('Failed to load videos from Pexels.');
          toast.error('Could not load videos.');
          setVideos([]); // Ensure videos are cleared on error
      } finally {
          setImageLoading(false);
      }
  };


  // --- News & Weather Fetching (Using API Routes - Assumed to be working) ---
  const fetchWeatherForDestination = async (locationName: string) => {
       if (!locationName) return;
       // setLoadingNews(true); // Use a specific loading state if needed
       // setError(null);

       try {
           console.log(`Fetching weather for ${locationName}...`);
           const response = await axios.post('/api/weather', { location: locationName });

           // Assuming your API route returns weather data on success (200)
           // and handles errors by returning non-200 status codes
           if (response.status !== 200) {
                console.warn(`Weather API responded with status ${response.status}:`, response.data);
                 toast.warn(`Could not fetch precise weather for ${locationName}.`);
                // Handle specific errors if your API provides them
                if (response.status === 500 && response.data?.error?.includes("complete name")) {
                   toast.info("Try providing a more specific location name for better weather results.", { autoClose: 5000 });
               }
           } else {
               console.log("Weather data received (processing happens in API route or another component).");
               // Process weather data if returned directly, otherwise assume UI updates elsewhere
           }

       } catch (error: any) {
           console.error('Error calling /api/weather:', error.response?.data || error.message);
           //setError('Failed to fetch weather information.');
           toast.error(`Failed to fetch weather for ${locationName}.`);
       } finally {
            // setLoadingNews(false);
       }
   };


   const fetchNewsForDestination = async (locationName: string) => {
       if (!locationName) return;
       setLoadingNews(true);
       setError(null);
       setNews([]); // Clear previous news

       try {
           console.log(`Fetching news for ${locationName}...`);
           const response = await axios.post('/api/news', { location: locationName });

           if (response.status === 200 && response.data?.articles) {
               setNews(response.data.articles);
                if (response.data.articles.length === 0) {
                     console.log(`No news articles found for ${locationName}.`);
                     // Optionally inform user, e.g., toast.info(`No recent news found for ${locationName}.`);
                 }
               // Call weather fetch after successful news fetch (if desired)
                // Consider if these should be independent or sequential
               // fetchWeatherForDestination(locationName);
           } else {
               console.error('Error fetching news - API response:', response.status, response.data);
                setError('Failed to fetch news articles.');
                toast.error(`Could not fetch news for ${locationName}.`);
               setNews([]);
           }

       } catch (error: any) {
           console.error('Error calling /api/news:', error.response?.data || error.message);
           setError('Failed to fetch news information.');
            toast.error(`Failed to fetch news for ${locationName}.`);
           setNews([]);
       } finally {
           setLoadingNews(false);
       }
   };



  // --- UI Handlers & Effects ---

   const isActive = () => { // Consider renaming, e.g., toggleImagePower
    setImagePower(!imagePower);
   };


  const loadMore = useCallback(() => {
      // Only load more if 'photos' tab is active, there's a next page, and not already loading
      if (activeSection === 'photos' && activeMediaType === 'photos' && !imageLoading && hasMore && nextPageUrl && imageFetchDestination) {
          console.log("Loading more images...");
          imageFetcher(imageFetchDestination, true); // Pass true for loadMore
      } else if (activeSection === 'photos' && activeMediaType === 'photos' && !hasMore) {
           console.log("No more images to load.");
           // Optionally show a toast or message: toast("You've reached the end of the images.");
       }
  }, [activeSection, activeMediaType, imageLoading, hasMore, nextPageUrl, imageFetchDestination]); // Include all dependencies


  // Effect to fetch media when the active section/media type changes
   useEffect(() => {
        // Only fetch if a plan is generated and the destination is set
        if (planGenerated && imageFetchDestination) {
             console.log(`Effect triggered: section=${activeSection}, mediaType=${activeMediaType}, destination=${imageFetchDestination}`);
             // Check if the destination context has changed since last media fetch
             const destinationChanged = lastDestination !== imageFetchDestination;

             if (activeSection === 'photos') {
                 if (activeMediaType === 'photos') {
                     // Fetch photos if they are empty OR if the destination changed
                     if (images.length === 0 || destinationChanged) {
                          console.log("Fetching initial photos...");
                          setImages([]); // Clear previous images before new fetch
                          setNextPageUrl(''); // Reset pagination
                          setHasMore(true);
                          imageFetcher(imageFetchDestination);
                     }
                 } else if (activeMediaType === 'videos') {
                     // Fetch videos if they are empty OR if the destination changed
                     if (videos.length === 0 || destinationChanged) {
                         console.log("Fetching videos...");
                         setVideos([]); // Clear previous videos
                          fetchVideos();
                     }
                 }
                 // Update the last destination tracker *after* deciding to fetch
                if (destinationChanged) {
                    setLastDestination(imageFetchDestination);
                 }
             }
        }
    }, [activeSection, activeMediaType, planGenerated, imageFetchDestination, lastDestination]); // Add lastDestination



  const handleVideoToggle = (videoId: number) => {
    const currentlyPlaying = videoPlaying === videoId;
    const videoRef = videoRefs.current[videoId];

    // Pause the currently playing video if it's different from the clicked one
     if (videoPlaying !== null && videoPlaying !== videoId && videoRefs.current[videoPlaying]) {
         videoRefs.current[videoPlaying]?.pause();
     }

    // Toggle the clicked video
    if (videoRef) {
      if (currentlyPlaying) {
        videoRef.pause();
        setVideoPlaying(null);
      } else {
        videoRef.play().catch(err => console.error("Video play failed:", err)); // Handle potential play errors
        setVideoPlaying(videoId);
      }
    }
  };


  const switchMediaType = (type: 'photos' | 'videos') => {
     console.log(`Switching media type to: ${type}`);
     if (activeMediaType === type) return; // No change if already active

     setActiveMediaType(type);
      setVideoPlaying(null); // Stop any playing video when switching tabs

     // No need to pre-fetch here, the useEffect hook handles fetching
     // when activeMediaType changes if needed.
  };

  // Animation variants (Unchanged)
  const pageTransition = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  // Modal handlers (Unchanged)
  const handleSubscribe = () => {
    setModalAnimating(true);
    setTimeout(() => {
      router.push('/Component/Subscribe'); // Ensure this route exists
    }, 300);
  };

  const handleClose = () => {
    setModalAnimating(true);
    setTimeout(() => {
       setShowModal(false); // Just close the modal
       setModalAnimating(false);
       // router.push('/'); // Redirecting home might be disruptive, let user stay
    }, 300);
  };

  // --- JSX Return ---
  return (
    <AuthGuard>
      {/* --- Add Toast Container Here --- */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Use 'colored' for info/error distinction
      />
      <Navbar />
      <div className="bg-gray-50 text-gray-900 dark:text-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="pt-24 pb-16">
          <motion.div
            className="container mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageTransition}
          >
            {/* Conditional Title */}
            {!planGenerated && !loading && ( // Show title only if no plan generated and not loading
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
                {/* Show input form if no plan is generated OR if loading is finished */}
                {!planGenerated && !loading && (
                  <motion.div
                    key="input-form" // Add key for AnimatePresence
                    className="w-full lg:w-2/3 mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <h2 className="text-2xl font-bold text-white">Travel Details</h2>
                        <p className="text-blue-100 mt-1">Tell us about your upcoming adventure</p>
                      </div>

                       <div className="p-6 md:p-8">
                          {/* Pass all necessary props to InputForm */}
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
                          // Pass down the relevant state setters based on tripForFamily logic handled inside InputForm
                          tripForFamily={tripForFamily}
                          setTripForFamily={setTripForFamily}
                          familyElderlyCount={familyElderlyCount}
                          setFamilyElderlyCount={setFamilyElderlyCount}
                          familyLadiesCount={familyLadiesCount}
                          setFamilyLadiesCount={setFamilyLadiesCount}
                          familyChildrenCount={familyChildrenCount}
                          setFamilyChildrenCount={setFamilyChildrenCount}
                          familyPreferences={familyPreferences}
                          setFamilyPreferences={setFamilyPreferences}
                          // Pass loading state and the fetcher function
                          loading={loading} // Pass the main loading state
                          planFetcher={planFetcher} ladiesCount={''} setLadiesCount={function (value: string): void {
                            throw new Error('Function not implemented.');
                          } } elderlyCount={''} setElderlyCount={function (value: string): void {
                            throw new Error('Function not implemented.');
                          } } childrenCount={''} setChildrenCount={function (value: string): void {
                            throw new Error('Function not implemented.');
                          } } imageLoading={false}                           // Add other props if needed by InputForm
                         />
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

             {/* Loading State Indicator */}
               <AnimatePresence>
                 {loading && (
                   <motion.div
                     key="loading-indicator" // Key for AnimatePresence
                     className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-75 z-50"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.3 }}
                   >
                     <motion.div
                       className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-11/12 mx-4 shadow-2xl text-center"
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.9, opacity: 0 }}
                       transition={{ type: "spring", stiffness: 200, damping: 20 }}
                     >
                       <div className="flex justify-center mb-5">
                         <motion.div
                           animate={{ rotate: 360 }}
                           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                         >
                           <FaSpinner className="text-5xl text-blue-600 dark:text-blue-400" />
                         </motion.div>
                       </div>
                       <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                         Crafting Your Adventure...
                       </h3>
                       <p className="text-gray-600 dark:text-gray-300 px-4">
                         {destination ? `We're designing your personalized plan for ${destination}.` : 'Getting things ready.'} This might take a moment.
                       </p>
                       {/* Optional: Add progress steps or messages here */}
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>


               {/* Plan Generation Success Animation */}
               <AnimatePresence>
                 {planGenerationSuccess && !loading && (
                   <motion.div
                     key="success-animation"
                     className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]" // Higher z-index
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.3 }}
                     // Automatically dismiss after a short delay
                     onAnimationComplete={() => {
                       setTimeout(() => {
                         setPlanGenerationSuccess(false);
                       }, 1200); // Duration visible
                     }}
                   >
                     <motion.div
                       className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-2xl flex items-center justify-center aspect-square"
                       initial={{ scale: 0.5, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 250, damping: 15, delay: 0.1 } }}
                       exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.4 } }}
                     >
                       <FaCheckCircle className="text-7xl text-green-500" />
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>


              {/* Results Section */}
              {/* Show results if a plan exists (planGenerated is true) AND not currently loading a new plan */}
                {planGenerated && !loading && plan && (
                 <motion.div
                   key="results-section" // Key for AnimatePresence if needed
                   className="w-full"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.1 }} // Slight delay after loading finishes
                 >
                   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                     {/* Results Header */}
                     <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                         <div>
                           <h2 className="text-2xl font-bold text-white">
                             {/* Dynamically display title based on loaded data */}
                             Your {days || 'Custom'} Day Trip to {destination || 'Selected Destination'}
                           </h2>
                           <p className="text-blue-100 mt-1 text-sm">
                              {startLocation && `From ${startLocation}`} {budget && `• Budget: ${budget}`} {peopleCount && `• ${peopleCount} Traveler(s)`}
                           </p>
                         </div>
                         <button
                           onClick={() => {
                             // Reset state to allow new plan generation
                              setPlan('');
                              setPlanGenerated(false);
                              setDestination(''); // Clear destination to force re-entry?
                              setStartLocation('');
                              setDays('');
                              setBudget('');
                              setPeopleCount('');
                              setTripForFamily(false);
                              setFamilyChildrenCount('');
                              setFamilyElderlyCount('');
                              setFamilyLadiesCount('');
                              setFamilyPreferences('');
                              setImages([]);
                              setVideos([]);
                              setNews([]);
                              setLocationBio('');
                              setActiveSection('plan'); // Reset to plan tab if needed elsewhere
                              setError(null);
                              setCurrentTripId(''); // Clear current trip ID
                              setFeedbackSubmitted(false);
                              // Optional: Scroll to top
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium shrink-0"
                         >
                           Create New Plan
                         </button>
                       </div>
                     </div>

                      {/* Pass updated/correct props to ResultsSection */}
                     <ResultsSection
                      loading={loading} // Pass the main loading state
                      error={error}
                      plan={plan}
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                      location={destination} // Use destination from state
                      planGenerated={planGenerated}
                      news={news}
                      loadingNews={loadingNews} // Pass news loading state

                      // locationImage={locationImage} // Pass if used
                      locationBio={locationBio} // Pass fetched bio
                      images={images}
                      imageLoading={imageLoading} // Pass media loading state
                      hasMore={hasMore}
                      loadMore={loadMore} // Pass load more function

                      // fetchNewsForDestination={fetchNewsForDestination} // Pass if needed inside results
                      destination={destination} // Pass destination
                      videos={videos}
                      // fetchVideos={fetchVideos} // Pass if needed inside results
                      // previousValue={previousValue} // Pass if used
                      activeMediaType={activeMediaType}
                      switchMediaType={switchMediaType} // Pass media type switcher

                      // Pass video refs and handlers
                      videoRefs={videoRefs}
                      videoPlaying={videoPlaying}
                      handleVideoToggle={handleVideoToggle}
                      // Pass feedback state and handlers
                      feedbackSubmitted={feedbackSubmitted}
                      submitFeedback={submitFeedback} // Pass the submit function
                      currentTripId={currentTripId} // Pass current trip ID for context
                      locationImage={''} fetchNewsForDestination={function (destination: string): Promise<void> {
                        throw new Error('Function not implemented.');
                      } } previousValue={''} fetchVideos={function (): Promise<void> {
                        throw new Error('Function not implemented.');
                      } }                     />
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
             key="subscription-modal"
             className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[70]" // Ensure high z-index
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
             <motion.div
               className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-11/12 mx-4"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                exit={{ scale: 0.9, opacity: 0, y: 20, transition: { duration: 0.2 } }}
             >
               <div className="bg-gradient-to-r from-orange-500 to-red-600 p-5 text-white">
                 <div className="flex items-center gap-3">
                   <FaLock className="text-2xl" />
                   <h2 className="text-xl font-semibold">Unlock Full Access</h2>
                 </div>
               </div>

               <div className="p-6">
                 <p className="text-gray-700 dark:text-gray-300 mb-5 text-base">
                   You've used your free plan generations. Subscribe to our premium plan for unlimited travel planning and exclusive features!
                 </p>

                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg mb-6 border border-blue-200 dark:border-gray-600">
                   <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-center text-lg">Premium Benefits Include:</h3>
                   <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <li className="flex items-center gap-2">
                       <FaCheckCircle className="text-green-500 flex-shrink-0" />
                       <span>Unlimited AI Itineraries</span>
                     </li>
                      <li className="flex items-center gap-2">
                         <FaCheckCircle className="text-green-500 flex-shrink-0" />
                         <span>Advanced Customization</span>
                     </li>
                      <li className="flex items-center gap-2">
                         <FaCheckCircle className="text-green-500 flex-shrink-0" />
                         <span>Priority Support</span>
                     </li>
                     <li className="flex items-center gap-2">
                       <FaCheckCircle className="text-green-500 flex-shrink-0" />
                       <span>Exclusive Travel Tips</span>
                     </li>
                     <li className="flex items-center gap-2">
                       <FaCheckCircle className="text-green-500 flex-shrink-0" />
                       <span>Save & Manage Trips</span>
                     </li>
                      <li className="flex items-center gap-2">
                         <FaCheckCircle className="text-green-500 flex-shrink-0" />
                         <span>Offline Plan Access</span>
                     </li>
                   </ul>
                 </div>

                 <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                   <button
                     onClick={handleClose}
                     className={`w-full sm:w-auto px-5 py-2.5 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg transition text-sm font-medium ${
                       modalAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-500'
                     }`}
                     disabled={modalAnimating}
                   >
                     Maybe Later
                   </button>
                   <button
                     onClick={handleSubscribe}
                     className={`w-full sm:w-auto px-6 py-2.5 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md transition text-sm ${
                       modalAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
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