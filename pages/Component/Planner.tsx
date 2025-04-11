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
  // IMPORTANT: Add state for actual arrival/departure dates for better planning
  // const [arrivalDate, setArrivalDate] = useState(''); // Example: YYYY-MM-DD
  // const [departureDate, setDepartureDate] = useState(''); // Example: YYYY-MM-DD
  const [days, setDays] = useState(''); // Kept for now, but less ideal than dates
  const [budget, setBudget] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [ladiesCount, setLadiesCount] = useState(''); // Only used if tripForFamily=true
  const [elderlyCount, setElderlyCount] = useState(''); // Only used if tripForFamily=true
  const [childrenCount, setChildrenCount] = useState(''); // Only used if tripForFamily=true
  const [images, setImages] = useState<Image[]>([]);
  const [imagePower, setImagePower] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [locationImage, setLocationImage] = useState('');
  const [locationBio, setLocationBio] = useState('');
  const [plan, setPlan] = useState(''); // This will hold the final combined plan
  const [loading, setLoading] = useState(false); // Main loading state for plan generation
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
  const [tripForFamily, setTripForFamily] = useState(false); // To toggle family/solo input fields
  const [familyElderlyCount, setFamilyElderlyCount] = useState(''); // Specific state for family input
  const [familyLadiesCount, setFamilyLadiesCount] = useState(''); // Specific state for family input
  const [familyChildrenCount, setFamilyChildrenCount] = useState(''); // Specific state for family input
  const [familyPreferences, setFamilyPreferences] = useState(''); // Specific state for family input
  const [showModal, setShowModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [planGenerationSuccess, setPlanGenerationSuccess] = useState(false);
  const [currentTripId, setCurrentTripId] = useState('');

  // ========================================================================
  //                       *** REPLACED / NEW VALUES ***
  // ========================================================================

  // WARNING: DO NOT COMMIT YOUR REAL API KEY HERE. Use environment variables (e.g., .env.local)
  // process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k'; // <-- PASTE YOUR KEY VALUE HERE (BUT MOVE TO ENV VAR!)

  const TARGET_MODEL_NAME = 'gemini-1.5-pro-latest'; // Using the recommended model
  const API_CALL_DELAY_MS = 60000; // 60 seconds delay between API calls for rate limiting
  const CHUNK_SIZE_DAYS = 7; // Days per chunk (safeguard parameter)
  const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Keep Pexels key as is

  // Optimal Generation Parameters (from Python analysis)
  const GENERATION_CONFIG = {
    temperature: 0.3,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192, // Use max possible for flexibility within chunks
  };

  // ========================================================================
  //                          *** END REPLACEMENTS ***
  // ========================================================================


  const db = getFirestore();

  // --- Keep all existing functions (fetchUserDetailsFromFirestore, incrementPlanGenerationCount, useEffect for auth, getUserTrips, saveTrip, etc.) ---
  // --- Make sure they are compatible with any state variable changes if you add arrival/departure dates ---

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
        // If user doc doesn't exist, create it with count 1
         await setDoc(userDocRef, { planGenerationCount: 1 }, { merge: true });
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

        // Allow prasantshukla89@gmail.com unlimited access for testing
        if (planGenerationCount < 3 || authenticatedUser.email === 'prasantshukla89@gmail.com') {
          setUser(authenticatedUser);
          // Also fetch user details for later use if needed outside planFetcher
          // fetchUserDetailsFromFirestore(authenticatedUser.email);
        } else {
          setShowModal(true);
          setLoading(false); // Ensure loading stops if modal shown
           setUser(null); // Or keep user but block generation
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [db]); // Add db dependency

  // Get user trips
  const getUserTrips = async () => {
    if (!user || !user.email) {
      console.error('User not authenticated for getUserTrips');
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

   // Save trip metadata to user doc and full plan to separate doc
   const saveTrip = async (tripData: any, fullPlan: string) => {
    if (!user || !user.email) {
      console.error('User not authenticated for saveTrip');
      return null;
    }

    try {
      // Generate a unique trip ID (using timestamp is simple but consider UUID for production)
      const tripId = `${user.uid}-${new Date().getTime()}`; // Include UID for uniqueness

      // Create trip object for the user's trips array (metadata only)
      const tripToSaveInUserDoc = {
        id: tripId,
        startLocation: tripData.startLocation,
        destination: tripData.destination,
        days: tripData.days,
        budget: tripData.budget,
        peopleCount: tripData.peopleCount,
        tripForFamily: tripData.tripForFamily,
        // Only include family details if it was a family trip
        ...(tripData.tripForFamily && {
          familyElderlyCount: tripData.familyElderlyCount || '0',
          familyLadiesCount: tripData.familyLadiesCount || '0',
          familyChildrenCount: tripData.familyChildrenCount || '0',
          familyPreferences: tripData.familyPreferences || '',
        }),
        planSummary: fullPlan.substring(0, 200) + '...', // Store a brief preview
        hasPlan: true,
        feedbackSubmitted: false, // Default feedback status
        createdAt: new Date().toISOString() // ISO string format is standard
      };

      // Save metadata to user's trips array in 'users' collection
      const userDocRef = doc(db, 'users', user.email);
      // Use updateDoc with arrayUnion for atomicity, requires doc to exist
      // Consider checking existence or using setDoc with merge:true if doc might not exist
      await updateDoc(userDocRef, {
        trips: arrayUnion(tripToSaveInUserDoc)
      }).catch(async (updateError) => {
         console.warn("Failed to update existing user doc, trying setDoc:", updateError);
         // Fallback if user doc or trips array doesn't exist
         const userDocSnap = await getDoc(userDocRef);
         if(userDocSnap.exists() && !userDocSnap.data().trips) {
            await setDoc(userDocRef, { trips: [tripToSaveInUserDoc] }, { merge: true });
         } else if (!userDocSnap.exists()) {
             await setDoc(userDocRef, { trips: [tripToSaveInUserDoc] }); // Create doc if needed
         } else {
             console.error("Error adding trip to user document:", updateError);
             throw updateError; // Re-throw if it's another issue
         }
      });


      // Save the FULL plan separately in the 'plans' collection
      const planDocRef = doc(db, 'plans', tripId); // Use tripId as document ID
      await setDoc(planDocRef, {
        userId: user.email, // Link back to the user
        tripId: tripId,
        fullPlan: fullPlan, // Store the complete generated text
        createdAt: new Date().toISOString()
      });

      console.log(`Trip metadata saved for user ${user.email}, full plan saved with ID ${tripId}`);
      setCurrentTripId(tripId); // Set the current trip ID in state
      return tripId; // Return the generated trip ID

    } catch (error) {
      console.error('Error saving trip:', error);
      setError('Failed to save your trip plan. Please try generating again.'); // Inform user
      return null; // Indicate failure
    }
  };


  // Fetch full plan from separate collection
  const fetchFullPlan = async (tripId: string) => {
    if (!tripId) {
      console.error('No trip ID provided to fetchFullPlan');
      return null;
    }

    try {
      const planDocRef = doc(db, 'plans', tripId);
      const planDoc = await getDoc(planDocRef);

      if (planDoc.exists()) {
        return planDoc.data().fullPlan;
      } else {
        console.warn(`No plan document found for trip ID: ${tripId}`);
        return null; // Or return a message like 'Plan data not found.'
      }
    } catch (error) {
      console.error(`Error fetching full plan for trip ID ${tripId}:`, error);
      setError('Could not load the details for this trip.'); // Inform user
      return null;
    }
  };

  // Update feedback status for a trip
  const updateTripFeedback = async (tripId: string, feedbackData: any) => {
    if (!user || !user.email || !tripId) {
      console.error('Missing user or trip ID for updateTripFeedback');
      return false;
    }

    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && Array.isArray(userDoc.data().trips)) { // Ensure trips is an array
        const trips = userDoc.data().trips;
        let tripFound = false;
        const updatedTrips = trips.map((trip: any) => {
          if (trip.id === tripId) {
            tripFound = true;
            return {
              ...trip,
              feedbackSubmitted: true,
              // Optionally store feedback summary here too, or rely on separate collection
              // feedbackSummary: feedbackData.summary || 'Feedback received'
            };
          }
          return trip;
        });

        if (!tripFound) {
           console.warn(`Trip ID ${tripId} not found in user's trips array.`);
           return false;
        }

        // Update the user document with the modified trips array
        await updateDoc(userDocRef, { trips: updatedTrips });

        // Save detailed feedback separately in the 'feedback' collection
        const feedbackDocRef = doc(db, 'feedback', tripId); // Use tripId as doc ID
        await setDoc(feedbackDocRef, {
          userId: user.email,
          tripId: tripId,
          ...feedbackData, // Store the full feedback object
          createdAt: new Date().toISOString()
        });

        console.log(`Feedback submitted successfully for trip ID: ${tripId}`);
        setFeedbackSubmitted(true); // Update local state if needed
        return true;
      } else {
         console.warn(`User document or trips array not found for user: ${user.email}`);
         return false;
      }

    } catch (error) {
      console.error(`Error updating feedback for trip ID ${tripId}:`, error);
      setError('Failed to submit feedback.'); // Inform user
      return false;
    }
  };

  // Load previous trip details into the form and results area
  const loadPreviousTrip = async (tripId: string) => {
      setLoading(true); // Show loading state
      setError(null);
      setPlan(''); // Clear previous plan while loading

      try {
          // Get trip metadata from the user's document
          const trips = await getUserTrips();
          const selectedTrip = trips.find((trip: any) => trip.id === tripId);

          if (!selectedTrip) {
              throw new Error('Selected trip data not found.');
          }

          console.log("Loading trip data:", selectedTrip);

          // Set trip details into state variables for the form
          setStartLocation(selectedTrip.startLocation || '');
          setDestination(selectedTrip.destination || '');
          setDays(selectedTrip.days || '');
          setBudget(selectedTrip.budget || '');
          setPeopleCount(selectedTrip.peopleCount || ''); // Keep peopleCount for context if needed
          setTripForFamily(selectedTrip.tripForFamily || false);

          // Set family details only if it was a family trip
          if (selectedTrip.tripForFamily) {
              setFamilyElderlyCount(selectedTrip.familyElderlyCount || '');
              setFamilyLadiesCount(selectedTrip.familyLadiesCount || '');
              setFamilyChildrenCount(selectedTrip.familyChildrenCount || '');
              setFamilyPreferences(selectedTrip.familyPreferences || '');
          } else {
              // Clear family fields if it wasn't a family trip
              setFamilyElderlyCount('');
              setFamilyLadiesCount('');
              setFamilyChildrenCount('');
              setFamilyPreferences('');
          }

          setCurrentTripId(selectedTrip.id); // Set the active trip ID
          setFeedbackSubmitted(selectedTrip.feedbackSubmitted || false); // Set feedback status

          // Fetch the full plan text from the separate 'plans' collection
          const fullPlan = await fetchFullPlan(tripId);
          if (fullPlan) {
              setPlan(fullPlan); // Display the fetched plan
              setPlanGenerated(true); // Indicate plan is loaded
              setPlanGenerationSuccess(true); // Optional: Briefly show success indication
                setTimeout(() => setPlanGenerationSuccess(false), 1500); // Hide success indication
          } else {
              // Handle case where plan text is missing
              setPlan('Plan details could not be loaded for this trip. You might need to regenerate it.');
              setPlanGenerated(false); // No valid plan loaded
          }

          // Update other relevant state for UI consistency
          setImageFetchDestination(selectedTrip.destination || ''); // For Pexels
          setActiveSection('plan'); // Show the plan section first
          // Assuming previousValue/currentValue track destination changes for fetches
          setPreviousValue(selectedTrip.destination || '');
          setCurrentValue(selectedTrip.destination || '');
          setLocation(selectedTrip.destination || ''); // Set location for news/weather

          // Fetch auxiliary data like 'About', News, etc., for the destination
          if (selectedTrip.destination) {
              fetchAboutLocation(selectedTrip.destination);
              fetchNewsForDestination(selectedTrip.destination);
              // Optionally reset and fetch images/videos if needed immediately
               setActiveMediaType('photos'); // Reset to photos tab
               setImages([]); // Clear previous media
               setVideos([]);
               // Trigger fetch if needed: imageFetcher(selectedTrip.destination);
          }

      } catch (error: any) {
          console.error('Error loading previous trip:', error);
          setError(`Failed to load trip: ${error.message}`);
          // Reset relevant states on error
          setPlan('');
          setPlanGenerated(false);
      } finally {
          setLoading(false); // Hide loading state
      }
  };

  // ========================================================================
  //       *** REPLACED/UPDATED planFetcher function - Incorporates New Logic ***
  // ========================================================================
  const planFetcher = async () => {
    setPlan(''); // Clear previous plan
    setLoading(true); // Show loading indicator
    setError(null); // Clear previous errors
    setPlanGenerationSuccess(false); // Reset success indicator
    setPlanGenerated(true); // Mark that generation attempt started

    // Ensure user is authenticated
    if (!user || !user.email) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    // --- Start: Logic adapted from Python Cells 4 & 5 ---
    let userDetails: any = {}; // Initialize userDetails
    try {
      // Fetch user details from Firestore for context
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        // Handle case where user doc doesn't exist - perhaps create it or use defaults
        console.warn("User document not found, using defaults.");
        // Or throw new Error('Could not fetch user details.');
      } else {
         userDetails = userDoc.data();
      }


      const { name = 'N/A', religion = 'N/A', favoritePlaces = 'N/A', believerOfGod = false, age = 'N/A', planGenerationCount = 0 } = userDetails;

      // Check plan generation limit (existing logic)
      if (planGenerationCount >= 3 && user.email !== 'prasantshukla89@gmail.com') {
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Fetch about location separately (existing logic - can run concurrently or before)
       fetchAboutLocation(destination);

      // --- 1. Prepare data and calculate duration ---
      // !!! CRITICAL: Replace 'days' with actual arrival/departure date states for proper logic !!!
      // These lines using 'days' are placeholders and will NOT calculate chunk dates correctly.
      let durationDays: number;
      let arrivalDateStr = "N/A"; // Placeholder
      let departureDateStr = "N/A"; // Placeholder
      let arrivalDateObj : Date | null = null; // Use null for clarity if invalid
      let departureDateObj : Date | null = null;

      try {
         // --- Replace this block with logic using your actual date states ---
         if (!days || isNaN(parseInt(days)) || parseInt(days) <= 0) {
             throw new Error("Please provide a valid number of days for the trip.");
         }
         durationDays = parseInt(days);
         // Cannot calculate actual dates from 'days' alone. Need start date.
         // If you add `arrivalDate` state (YYYY-MM-DD string):
         // arrivalDateStr = arrivalDate;
         // arrivalDateObj = new Date(arrivalDateStr + 'T00:00:00Z'); // Use UTC
         // departureDateObj = new Date(arrivalDateObj);
         // departureDateObj.setUTCDate(arrivalDateObj.getUTCDate() + durationDays);
         // departureDateStr = departureDateObj.toISOString().split('T')[0];
         // --- End Replace Block ---

         // Check duration again after calculation if using dates
         if (durationDays <= 0) throw new Error("Duration must be at least 1 day.");

      } catch (dateError: any) {
         throw new Error(`Invalid date/duration processing: ${dateError.message}`);
      }
      // --- End Date/Duration Calculation ---

      // Parse budget safely
      const budgetAmount = parseInt(budget) || 0;
      if (budgetAmount <= 0 && budget.trim() !== '0') { // Allow 0 budget but warn on invalid non-zero
        console.warn("Budget input seems invalid, defaulting to 0.");
      }


      // --- 2. Construct Base Prompt Template (Adapted from Python Cell 4 v4) ---
      // Using the structure and details from our refined Python version
      let base_prompt_template = `
# MISSION
You are an expert, meticulous, and highly resourceful travel itinerary planner AI. Your primary mission is to generate sections of a travel plan based on comprehensive user context, leveraging the **most current and relevant information available to you** regarding locations, costs, transportation, and operational details in the destination. You must be realistic, especially concerning budget constraints, and follow formatting guidelines precisely.

# OVERALL USER CONTEXT (Apply this to all generated sections)

*   **Traveler Origin:** ${startLocation || 'N/A'}
*   **Destination:** ${destination || 'N/A'}, India (Focus planning here)
*   **Full Trip Dates:** ${arrivalDateStr} to ${departureDateStr} (${durationDays} days total)  ${/* <-- Replace with actual dates */''}
*   **Travel Party Type:** ${tripForFamily ? 'Family' : 'Alone'}`;

      // Traveler Details
      if (tripForFamily) {
          const family_members_count = parseInt(peopleCount) || (parseInt(familyLadiesCount || '0') + parseInt(familyElderlyCount || '0') + parseInt(familyChildrenCount || '0') + 1) || 1; // Estimate total count if peopleCount missing
          base_prompt_template += ` (${family_members_count} people)`;
          base_prompt_template += `\n*   **Family Composition:** (Counts: ${familyLadiesCount || 0} Ladies, ${familyElderlyCount || 0} Elders, ${familyChildrenCount || 0} Children). **Note:** Specific ages for each member would allow for much better planning.`;
          // If you collect detailed family member data (ages/sexes in an array state):
          // const member_details_str = familyMembersArray.map((m, i) => `      - Member ${i+1}: Age ${m.age}, Sex ${m.sex}`).join('\n');
          // base_prompt_template += `\n*   **Family Member Details:**\n${member_details_str}`;
      } else { // Alone
          base_prompt_template += ` (1 person)`;
          base_prompt_template += `\n*   **Traveler Details:** Age ${age || 'N/A'}, Believer: ${believerOfGod ? 'Yes' : 'No'}, Fav Places: ${favoritePlaces || 'N/A'}`; // Using fetched userDetails
      }

      // Budget, Preferences, Constraints
      base_prompt_template += `
              *   **Overall Trip Budget:** **EXTREMELY TIGHT** - ${budgetAmount.toLocaleString()} INR TOTAL. This covers *all* local expenses (accommodation, food, activities, local transport) for the entire group/person for the full ${durationDays} days. Adherence is paramount.
              *   **User Preferences:** ${tripForFamily ? (familyPreferences || 'Family Friendly Activities') : (favoritePlaces || 'General Tourist Spots')} (Prioritize Beaches & Amusement Parks if listed).
              *   **Mandatory Constraints:**
                  *   **Diet:** **Strictly VEGETARIAN** food options only.
                  *   **Interests:** Children enjoy beaches (if applicable based on familyChildrenCount > 0).
              *   **Other User Notes:** Religion: ${religion || 'N/A'}. Believer: ${believerOfGod ? 'Yes' : 'No'}. (Add any other specific important info state variable here, e.g., mobility notes).
                  
              # SPECIFIC TASK FOR THIS API CALL
              {{SPECIFIC_INSTRUCTIONS}}
                  
              # RESPONSE REQUIREMENTS (Apply to your generated output)
                  
              *   **Recency & Accuracy:** Use your latest knowledge for details like estimated costs, operating hours, transportation options (e.g., ride-sharing availability, current metro lines), hotel/restaurant recommendations. Clearly state *estimates*. Recommend checking official websites closer to travel date.
              *   **Formatting:** Use headings ('##'/'###'). Daily plans: '### Day X: YYYY-MM-DD - Theme'. Activities: '*   HH:MM AM/PM - HH:MM AM/PM: [Activity] - Desc (Est. Cost: Z INR)'. Expenditure: '*   Est Cost: Food=X INR, Transport=Y INR, Activity=Z INR | Daily Total=T INR'.
              *   **Realism:** Be direct about budget limits. Prioritize free/low-cost. Justify fees. Note difficulties (e.g., ultra-budget family accommodation).
              *   **Clarity:** Be concise and actionable.
              `;
      // --- End Base Prompt Template ---


      // --- 3. Initialize Variables for Chunking ---
      const all_itinerary_parts: string[] = [];
      const num_chunks = Math.ceil(durationDays / CHUNK_SIZE_DAYS);
      console.log(`Calculated number of chunks: ${num_chunks} for ${durationDays} days`);

      // --- 4. Loop through Chunks (Itinerary & Expenditure) ---
      console.log(`--- Starting Generation of Daily Itinerary & Expenditure (${num_chunks} Chunks) ---`);
      console.log(`*** Applying ${API_CALL_DELAY_MS / 1000}s delay between API calls ***`);

      for (let i = 0; i < num_chunks; i++) {
        const current_day_offset = i * CHUNK_SIZE_DAYS;
        const chunk_days_count = Math.min(CHUNK_SIZE_DAYS, durationDays - current_day_offset);

        // --- Calculate chunk dates (REQUIRES arrivalDateObj to be valid Date) ---
        let chunk_start_date_str = `Day ${current_day_offset + 1}`;
        let chunk_end_date_str = `Day ${current_day_offset + chunk_days_count}`;
        let chunk_date_range_str = `Days ${current_day_offset + 1} to ${current_day_offset + chunk_days_count}`;

        if (arrivalDateObj instanceof Date && !isNaN(arrivalDateObj.getTime())) { // Check if valid date
           const chunk_start_date = new Date(arrivalDateObj);
           chunk_start_date.setUTCDate(arrivalDateObj.getUTCDate() + current_day_offset);
           const chunk_end_date = new Date(chunk_start_date);
           chunk_end_date.setUTCDate(chunk_start_date.getUTCDate() + chunk_days_count - 1);

           chunk_start_date_str = chunk_start_date.toISOString().split('T')[0];
           chunk_end_date_str = chunk_end_date.toISOString().split('T')[0];
           chunk_date_range_str = `${chunk_start_date_str} to ${chunk_end_date_str}`;
        }
        // --- End Chunk Date Calculation ---


        console.log(`\nGenerating Chunk ${i + 1}/${num_chunks}: Daily plans for ${chunk_date_range_str} (${chunk_days_count} days)...`);

        // Define specific instructions for the chunk prompt
        const specific_instructions = `
Generate ONLY the following two sections for the specific date range: **${chunk_date_range_str}** (covering Day ${current_day_offset + 1} to Day ${current_day_offset + chunk_days_count} of the overall trip).

**CRITICAL REMINDERS for this chunk:**
*   Strictly adhere to user **preferences** and **constraints** (VEGETARIAN, budget).
*   Prioritize **low-cost/free** activities. Be realistic about the **extreme budget**.
*   Follow **formatting** precisely (daily headings '### Day X...', cost breakdown '* Est Cost...').

1.  **Detailed Day-by-Day Itinerary (${chunk_date_range_str}):**
    *   For EACH day in this range: Use heading '### Day [Overall Day Number]: [YYYY-MM-DD] - [Brief Theme]' (use actual date if available, otherwise day number).
    *   Include bullet points with time slots ('*   HH:MM AM/PM - HH:MM AM/PM: [Activity] - Details (Est. Cost: Z INR)').
    *   Ensure VEGETARIAN-friendly, age-suitable activities. State estimated costs clearly.

2.  **Daily Estimated Expenditure Breakdown (${chunk_date_range_str}):**
    *   For EACH day: Use format '*   Estimated Cost: Food=X INR, Transport=Y INR, Activity=Z INR | Daily Total=T INR'.
    *   Base estimates on ultra-budget options. Comment if unsustainable relative to overall budget.
`;
        // Construct the prompt for this chunk using the base template
        const final_chunk_prompt = base_prompt_template.replace('{{SPECIFIC_INSTRUCTIONS}}', specific_instructions);

        // Make the API Call for the current chunk
        try {
          const startTime = Date.now();
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
            {
              contents: [{ parts: [{ text: final_chunk_prompt }] }],
              generationConfig: GENERATION_CONFIG, // Use the defined config
              // Add safety settings if needed:
              // safetySettings: [ { category: 'HARM_CATEGORY_...', threshold: 'BLOCK_...' } ]
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 600000 // 10 minute timeout for API call
            }
          );
          const endTime = Date.now();
          // console.log(`Chunk ${i + 1} API call completed in ${(endTime - startTime) / 1000:.2f} seconds.`);

          // Process Response
          const chunk_text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || `ERROR: No text found in response for chunk ${i + 1}. Check API response.`;
          const finishReason = response.data.candidates?.[0]?.finishReason || 'UNKNOWN';

          all_itinerary_parts.push(`\n\n## Daily Plan: ${chunk_date_range_str}\n\n${chunk_text}`);
          console.log(`   Successfully stored response for chunk ${i + 1}.`);

          // Check finish reason for potential truncation
          if (finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') { // Allow MAX_TOKENS as semi-expected if chunk is large
            console.warn(`   \n!!!!!!!!!!!!!!!! WARNING: Chunk ${i + 1} finished unexpectedly! Reason: '${finishReason}'. Output may be incomplete. !!!!!!!!!!!!!!!!\n`);
          } else if (finishReason === 'MAX_TOKENS') {
             console.warn(`   \n!!!!!!!!!!!!!!!! WARNING: Chunk ${i + 1} hit MAX_TOKENS limit. Reason: '${finishReason}'. Output for this chunk IS truncated. Consider reducing CHUNK_SIZE_DAYS. !!!!!!!!!!!!!!!!\n`);
          }

        } catch (err: any) {
          // Handle API call errors (network, 4xx, 5xx)
          const status = err.response?.status;
          const errorMessage = `\n\n## ERROR: Chunk ${i + 1} (${chunk_date_range_str}) API Call Failed ##\nStatus: ${status || 'N/A'}\nError: ${err.response?.data?.error?.message || err.message}\n`;
          console.error(errorMessage);
          all_itinerary_parts.push(errorMessage); // Add error message to results
          if (status === 429) {
            console.error("   >>> Encountered 429 Quota Error. The delay might need adjustment or check billing/plan.");
          }
          // Optional: Decide whether to stop the whole process if one chunk fails
          // setError(`Failed to generate part of the plan (Chunk ${i+1}). Please try again later.`);
          // setLoading(false); // Stop loading indicator
          // return; // Exit function
        }

        // --- Apply Delay --- Only if not the last chunk
        if (i < num_chunks - 1) {
            console.log(`   --- Waiting for ${API_CALL_DELAY_MS / 1000} seconds before next chunk ---`);
            await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));
        }

      } // --- End of chunk loop ---

      const full_itinerary_text = all_itinerary_parts.join(""); // Combine all parts (including errors)
      console.log("\n--- Daily Itinerary & Expenditure Generation Complete ---");


      // --- 5. Final API Call for Overall Sections ---
      console.log("\n--- Preparing Final API Call for Overall Assessment and Strategies ---");

      // Rebuild context directly from state/user data (more robust)
      let context_details = `
**User Travel Requirements (Context):**

*   **Origin:** ${startLocation || 'N/A'}
*   **Destination City/Region:** ${destination || 'N/A'}, India
*   **Full Trip Dates:** ${arrivalDateStr} to ${departureDateStr} (${durationDays} days) ${/* <-- Replace */''}
*   **Travel Party Type:** ${tripForFamily ? 'Family' : 'Alone'}`;
      if (tripForFamily) {
          const family_members_count = parseInt(peopleCount) || (parseInt(familyLadiesCount || '0') + parseInt(familyElderlyCount || '0') + parseInt(familyChildrenCount || '0') + 1) || 1;
          context_details += ` (${family_members_count} people)`;
          context_details += `\n*   **Family Composition:** (Counts: ${familyLadiesCount || 0} L, ${familyElderlyCount || 0} E, ${familyChildrenCount || 0} C). Specific ages needed for better plan.`;
      } else {
          context_details += ` (1 person)`;
          context_details += `\n*   **Traveler Details:** Age ${age || 'N/A'}, Believer: ${believerOfGod ? 'Yes' : 'No'}, Fav Places: ${favoritePlaces || 'N/A'}`;
      }
      context_details += `
*   **EXTREMELY TIGHT Budget (Overall Trip):** Approx. ${budgetAmount.toLocaleString()} INR TOTAL.
*   **Key Preferences:** ${tripForFamily ? (familyPreferences || 'Family Friendly') : (favoritePlaces || 'General Tourist')} (Beaches/Parks priority).
*   **Mandatory Constraints:** Strictly VEGETARIAN. Children enjoy beaches (if applicable).
*   **Other User Notes:** Religion: ${religion || 'N/A'}. Believer: ${believerOfGod ? 'Yes' : 'No'}. (Add other notes).`;
      // --- End Rebuilt Context ---


      const overall_sections_prompt = `
You are an expert, meticulous, and highly realistic travel itinerary planner AI. Based ONLY on the user context below, provide the OVERALL assessment and strategy sections, leveraging your most **current knowledge** about ${destination || 'the destination'}. Do NOT generate any day-by-day itinerary details.

${context_details}

**Your Task (Generate ONLY these 6 sections using latest info where applicable):**

1.  **Budget Feasibility Assessment (Overall Trip):** Realism of ~${budgetAmount} INR budget. Suggest feasible *current* minimum budget range/day/week.
2.  **Accommodation Suggestions (Overall Trip):** 2-3 SPECIFIC types/examples of extreme budget options reflecting *current* options. Estimated *current* nightly cost range (X-Y INR). Note difficulty.
3.  **Local Transportation Strategy (Overall Trip):** MOST cost-effective practical modes based on *current* options (local buses, trains/metro, walking). Advise against frequent taxis/ride-shares.
4.  **Vegetarian & Budget Food Strategy (Overall Trip):** Overall strategy. Specific types of ultra-budget eateries reflecting *current* scene. Low-cost meal examples. Markets.
5.  **Emergency Preparedness Information (Overall Trip):** 1-2 reputable large government/charitable/lower-cost reliable hospitals. 24/7 pharmacy info.
6.  **Overall Reasoning & Final Tips:** Summarize core challenge & strategy. 1-2 crucial tips based on *current* conditions for such a trip.

**Output:** Generate only the 6 sections listed above clearly, using headings for each. Use current knowledge.
`;

      // --- Make the final API call ---
      let overall_sections_result = "## ERROR: Could not generate overall assessment. ##"; // Default
      // Apply delay before this final call too
      console.log(`--- Waiting ${API_CALL_DELAY_MS / 1000} seconds before final API call ---`);
      await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));

      console.log("--- Making Final API Call ---");
      try {
        const startTime = Date.now();
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: overall_sections_prompt }] }],
            generationConfig: GENERATION_CONFIG, // Use optimal config
          },
          {
             headers: { 'Content-Type': 'application/json' },
             timeout: 600000 // 10 min timeout
          }
        );
        const endTime = Date.now();
        // console.log(`   Overall sections API call completed in ${(endTime - startTime) / 1000:.2f} seconds.`);

        // Process response
        overall_sections_result = response.data.candidates?.[0]?.content?.parts?.[0]?.text || `ERROR: No text found in overall sections response.`;
        const finishReason = response.data.candidates?.[0]?.finishReason || 'UNKNOWN';
        console.log("   Successfully retrieved overall sections response.");
        if (finishReason !== 'STOP') {
          console.warn(`   WARNING: Overall sections response finished unexpectedly! Reason: '${finishReason}'. May be truncated.`);
        }
      } catch (err: any) {
          const status = err.response?.status;
          const errorMessage = `## ERROR: API Call for Overall Sections Failed ##\nStatus: ${status || 'N/A'}\nError: ${err.response?.data?.error?.message || err.message}\n`;
          console.error(errorMessage);
          overall_sections_result = errorMessage; // Include error in the output
           if (status === 429) {
             console.error("   >>> Encountered 429 Quota Error on final call.");
          }
      }


      // --- 6. Combine and Finalize ---
      // Structure the final output clearly
      const final_combined_result = `
--- Combined Itinerary Plan ---
Model Used: ${TARGET_MODEL_NAME} (Temp: ${GENERATION_CONFIG.temperature})
Chunk Size Parameter: ${CHUNK_SIZE_DAYS} days | API Call Delay: ${API_CALL_DELAY_MS / 1000} sec
-------------------------------------------------------

## Overall Assessment & Strategies

${overall_sections_result}

-------------------------------------------------------

## Full Day-by-Day Itinerary & Expenditure (Combined from Chunks)
${/* Check if any chunk failed - maybe add a warning here */''}
${full_itinerary_text}

-------------------------------------------------------
--- End of Combined Output ---
`;
      setPlan(final_combined_result); // Update state with the final combined plan
      setPlanGenerationSuccess(true); // Show success indicator briefly

      // Increment count and save trip (existing logic should be robust)
      incrementPlanGenerationCount(user.email);
      const tripData = { // Reconstruct tripData with state values used
        email: user.email, name: name, startLocation, destination, days, budget,
        peopleCount, tripForFamily,
        // Ensure family details are included correctly based on trip type
        ...(tripForFamily && {
           familyElderlyCount: familyElderlyCount || '0',
           familyLadiesCount: familyLadiesCount || '0',
           familyChildrenCount: familyChildrenCount || '0',
           familyPreferences: familyPreferences || '',
        })
      };
      await saveTrip(tripData, final_combined_result); // Save trip with combined plan

      // Update other UI state (existing logic)
      setImageFetchDestination(destination); // For Pexels images
      setActiveSection('plan'); // Switch view to plan
      setPreviousValue(destination); // Update values if needed for other fetches
      setCurrentValue(destination);
      setLocation(destination); // For news/weather
      fetchNewsForDestination(destination); // Fetch news


    } catch (err: any) { // Catch errors from setup, date parsing, or nested API calls
      console.error('Error during overall plan generation process:', err);
      setError(err.message || 'Failed to generate the plan. Please check inputs and try again.');
      setPlan(''); // Clear plan on error
      setPlanGenerated(false); // Reset generation status
    } finally {
      setLoading(false); // ENSURE loading indicator is always turned off
      // Hide success animation slightly later if shown
       if(planGenerationSuccess) {
           setTimeout(() => setPlanGenerationSuccess(false), 1500);
       }
    }
  }; // --- End of REPLACED/UPDATED planFetcher function ---


  // --- Keep other functions like deleteTrip, submitFeedback, fetchAboutLocation, imageFetcher, etc. ---
  // Delete a trip
    const deleteTrip = async (tripId: string) => {
        if (!user || !user.email) return false;
        setLoading(true); // Indicate activity
        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && Array.isArray(userDoc.data().trips)) {
                const updatedTrips = userDoc.data().trips.filter((trip: any) => trip.id !== tripId);
                await updateDoc(userDocRef, { trips: updatedTrips });

                // Delete the full plan document
                try {
                    const planDocRef = doc(db, 'plans', tripId);
                    await deleteDoc(planDocRef);
                     console.log(`Deleted plan document for trip ${tripId}`);
                } catch (err) {
                    console.warn(`Could not delete plan document for trip ${tripId} (might not exist):`, err);
                }

                // If the deleted trip was the currently displayed one, clear the plan area
                if (currentTripId === tripId) {
                    setPlan('');
                    setPlanGenerated(false);
                    setCurrentTripId('');
                    // Reset form fields if desired
                    // setStartLocation(''); setDestination(''); setDays(''); ... etc
                }
                console.log(`Trip ${tripId} deleted successfully.`);
                setError(null); // Clear any previous errors
                return true; // Indicate success
            } else {
                 console.warn(`User document or trips array not found for deletion, user: ${user.email}`);
                 return false;
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
            setError('Failed to delete the trip.'); // Inform user
            return false;
        } finally {
             setLoading(false); // Hide loading indicator
        }
    };

    // Submit feedback for current trip
    const submitFeedback = async (feedbackData: any) => {
        if (!currentTripId) {
            console.error('No active trip selected to submit feedback for.');
            setError('Please load a trip before submitting feedback.');
            return false;
        }
        setLoading(true);
        const result = await updateTripFeedback(currentTripId, feedbackData);
         setLoading(false);
         if(result) {
             // Maybe show a success message
             alert("Feedback submitted successfully!");
         } else {
             // Error is set within updateTripFeedback
         }
        return result;
    };


   // Fetch destination information (using the OLDER model for simplicity, consider updating)
    const fetchAboutLocation = async (location: string) => {
        // Using a temporary loading state or reusing main 'loading' could be confusing.
        // Maybe add a specific state like setLoadingAbout(true/false) if needed.
        setError(null); // Clear previous errors related to 'about'

        try {
             // Use the NEW model and key for consistency
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`, // Use new model/key
                {
                    contents: [
                        {
                            parts: [
                                { // Keep the detailed prompt for 'About' section
                                    text: `I'm planning to travel to ${location}. Could you provide a detailed guide about the place, including:

                                        1. Historical Background: Brief history, significant events, cultural shifts, famous landmarks.
                                        2. Cultural Insights: Local customs, traditions, language, important cultural aspects.
                                        3. Top Attractions: Best places (popular & hidden gems), museums, historical sites, natural wonders.
                                        4. Local Cuisine: Best local foods/dishes, famous restaurants/markets.
                                        5. Unique Experiences: Special activities (festivals, art, adventure) unique to the destination.
                                        6. Practical Travel Tips: Local transport, best time to visit, safety tips, travel regulations.

                                        Tailor to a first-time traveler wanting immersive and educational experiences.`
                                }
                            ]
                        }
                    ],
                     generationConfig: { temperature: 0.5, maxOutputTokens: 4096 } // Can use different config here
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 180000 // 3 min timeout for potentially long 'about' info
                }
            );

            setLocationBio(response.data.candidates?.[0]?.content?.parts?.[0]?.text || `Could not fetch detailed information about ${location}.`);
        } catch (err: any) {
            console.error('Error fetching location information:', err);
            setError(err.message || 'Failed to fetch location information.');
            setLocationBio(`Failed to load information about ${location}. Please try refreshing or check the location name.`); // Provide error message in the bio section
        } finally {
            // setLoadingAbout(false); // Turn off specific loading indicator if used
        }
    };

     // --- Pexels Image Fetcher (Keep existing logic) ---
    const imageFetcher = async (query: string) => {
        if (!query) return; // Don't fetch if query is empty
        setImageLoading(true);
        try {
            let url = nextPageUrl || `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`; // Use more images per page?

            const imageResponse = await axios.get(url, {
                headers: { 'Authorization': PEXELS_API_KEY }
            });

            if (imageResponse.data.photos && imageResponse.data.photos.length > 0) {
                // If it's a new search (no nextPageUrl), replace images, otherwise append.
                setImages(prevImages => nextPageUrl ? [...prevImages, ...imageResponse.data.photos] : imageResponse.data.photos);
                setNextPageUrl(imageResponse.data.next_page || '');
                setTotalResults(imageResponse.data.total_results || 0);
                setHasMore(!!imageResponse.data.next_page);
            } else {
                 if (!nextPageUrl) setImages([]); // Clear if first search yields nothing
                 console.warn("No more photos found from Pexels API.");
                 setHasMore(false);
            }

        } catch (err: any) {
            console.error('Error fetching images from Pexels:', err);
            // Don't clear images on error if appending, maybe show error message
             if (!nextPageUrl) setImages([]); // Clear on initial fetch error
             setError("Could not load images."); // Show error to user
             setHasMore(false);
        } finally {
            setImageLoading(false);
        }
    };


    // --- Pexels Video Fetcher (Keep existing logic) ---
    const fetchVideos = async () => {
         if (!destination) return; // Don't fetch if destination is empty
         setImageLoading(true); // Reuse imageLoading state for videos
         try {
             const videoResponse = await axios.get(
                 `https://api.pexels.com/videos/search?query=${encodeURIComponent(destination)}&per_page=10`,
                 { headers: { 'Authorization': PEXELS_API_KEY } }
             );

             setVideos(videoResponse.data.videos || []);
             setVideoPlaying(null); // Reset playing state

             // Pause all currently tracked videos (if any refs exist)
             Object.values(videoRefs.current).forEach((videoRef) => {
                 if (videoRef && !videoRef.paused) {
                     videoRef.pause();
                 }
             });
         } catch (err: any) {
             console.error('Error fetching videos from Pexels:', err);
             setVideos([]);
             setError("Could not load videos.");
         } finally {
             setImageLoading(false);
         }
     };


    // --- News & Weather Fetching (Keep existing API routes if they work) ---
      const fetchWeatherForDestination = async (location: string) => {
          if (!location) return;
          // setLoadingNews(true); // Consider separate loading state if needed
          // setError(null); // Maybe clear only news/weather error

          try {
              // Assuming '/api/weather' handles fetching and returns data needed
              const response = await axios.post('/api/weather', { location: location });
              console.log("Weather API response:", response.status); // Log status
              // Process weather data if needed by UI state

          } catch (error: any) {
              // setError('Failed to fetch weather.');
              console.error('Error fetching weather via /api/weather:', error);
               // Don't necessarily show a blocking error for weather failure
          }
      }

      const fetchNewsForDestination = async (location: string) => {
         if (!location) return;
         setLoadingNews(true); // Use specific loading state for news
         setError(null); // Clear previous general errors

         try {
             // Assuming '/api/news' handles fetching and returns articles array
             const response = await axios.post('/api/news', { location: location });
             if (response.status === 200 && Array.isArray(response.data.articles)) {
                 setNews(response.data.articles);
                 // Fetch weather after news successfully fetched
                 fetchWeatherForDestination(location);
             } else {
                  console.error('Failed to fetch news or invalid format:', response.status, response.data);
                  setNews([]);
                  // Optionally set a specific news error state
             }

         } catch (error: any) {
             // setError('Failed to fetch news.');
             console.error('Error fetching news via /api/news:', error);
             setNews([]);
         } finally {
             setLoadingNews(false);
         }
     };

  // Toggle image power (keep existing simple toggle)
  const isActive = () => {
    setImagePower(!imagePower);
  };

  // Load more images callback (keep existing logic)
  const loadMore = useCallback(() => {
    if (!imageLoading && hasMore && nextPageUrl && imageFetchDestination) {
      imageFetcher(imageFetchDestination);
    }
  }, [imageLoading, hasMore, nextPageUrl, imageFetchDestination]); // Add dependency


  // Effect to fetch images/videos when section/type changes (Keep existing logic)
  useEffect(() => {
    // Only fetch if plan is generated and destination is set
    if (planGenerated && imageFetchDestination) {
        if (activeSection === 'photos') {
            // Reset media when switching media types or if destination changes
             if (lastDestination !== imageFetchDestination) {
                 setImages([]);
                 setVideos([]);
                 setNextPageUrl('');
                 setHasMore(true);
             }

             if (activeMediaType === 'photos') {
                 // Fetch only if images are empty or destination changed
                 if (images.length === 0 || lastDestination !== imageFetchDestination) {
                     imageFetcher(imageFetchDestination);
                 }
             } else if (activeMediaType === 'videos') {
                  // Fetch only if videos are empty or destination changed
                 if (videos.length === 0 || lastDestination !== imageFetchDestination) {
                     fetchVideos();
                 }
             }
              setLastDestination(imageFetchDestination); // Update last fetched destination
         }
     } else {
         // If plan is cleared or no destination, clear media
          setImages([]);
          setVideos([]);
          setNextPageUrl('');
          setHasMore(true);
          setLastDestination('');
     }
  }, [activeSection, activeMediaType, planGenerated, imageFetchDestination]); // Dependencies


  // Video toggle handler (keep existing logic)
  const handleVideoToggle = (videoId: number) => {
    const currentlyPlaying = videoPlaying;
    const nextPlaying = currentlyPlaying === videoId ? null : videoId;
    setVideoPlaying(nextPlaying); // Set the new playing video ID (or null)

    // Pause the previously playing video if it exists and is different
    if (currentlyPlaying !== null && currentlyPlaying !== videoId) {
        const prevVideoRef = videoRefs.current[currentlyPlaying];
        if (prevVideoRef && !prevVideoRef.paused) {
            prevVideoRef.pause();
        }
    }

    // Play the newly selected video if it exists
    if (nextPlaying !== null) {
        const nextVideoRef = videoRefs.current[nextPlaying];
        if (nextVideoRef && nextVideoRef.paused) {
             // Attempt to play, handle potential browser restrictions
            nextVideoRef.play().catch(error => {
                console.error("Video play failed:", error);
                // Maybe reset state if play fails due to interaction rules
                setVideoPlaying(null);
            });
        }
    }
};


  // Switch media type handler (keep existing logic)
  const switchMediaType = (type: 'photos' | 'videos') => {
    if (activeMediaType !== type) { // Only switch if type is different
      setActiveMediaType(type);
      // Reset playing video when switching away from videos
       if (type === 'photos' && videoPlaying !== null) {
           handleVideoToggle(videoPlaying); // This will pause and set videoPlaying to null
       }
       // Fetching logic is handled by the useEffect hook based on activeMediaType change
    }
  };

  // Animation variants (keep existing)
  const pageTransition = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  // Modal handlers (keep existing)
  const handleSubscribe = () => {
    setModalAnimating(true);
    setTimeout(() => { router.push('/Component/Subscribe'); }, 300);
  };
  const handleClose = () => {
    setModalAnimating(true);
    setTimeout(() => { router.push('/'); }, 300);
  };

  // --- Keep existing JSX Return statement ---
  return (
    <AuthGuard>
      <Navbar />
      <div className="bg-gray-50 text-gray-900 dark:text-white bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-700 min-h-screen">
        <div className="pt-24 pb-16">
          <motion.div
            className="container mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageTransition}
          >
            {/* Conditional Rendering for Intro Text */}
            {!planGenerated && !loading && ( // Show only if no plan generated AND not loading
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                  Plan Your Perfect Journey
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Let us create a personalized travel itinerary tailored just for you. Simply fill in your travel details below.
                </p>
              </div>
            )}

            {/* Main Content Area */}
             <div className={`flex flex-wrap gap-6 transition-all duration-700 ease-in-out`}>
               {/* Input Form - Show if no plan is generated yet */}
               <AnimatePresence mode="wait">
                 {!planGenerated && ( // Render input form only if no plan generated
                   <motion.div
                     key="input-form" // Add key for proper animation
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
                         {/* Pass necessary props to InputForm */}
                         <InputForm
                           startLocation={startLocation} setStartLocation={setStartLocation}
                           destination={destination} setDestination={setDestination}
                           days={days} setDays={setDays} // Still passing days, recommend changing to dates
                           // Add arrivalDate/departureDate props if you implement them
                           budget={budget} setBudget={setBudget}
                           peopleCount={peopleCount} setPeopleCount={setPeopleCount} // Need this if family details derived
                           // Pass family-specific states
                           tripForFamily={tripForFamily} setTripForFamily={setTripForFamily}
                           familyElderlyCount={familyElderlyCount} setFamilyElderlyCount={setFamilyElderlyCount}
                           familyLadiesCount={familyLadiesCount} setFamilyLadiesCount={setFamilyLadiesCount}
                           familyChildrenCount={familyChildrenCount} setFamilyChildrenCount={setFamilyChildrenCount}
                           familyPreferences={familyPreferences} setFamilyPreferences={setFamilyPreferences}
                           // Pass loading state and submit function
                           loading={loading}
                           planFetcher={planFetcher}
                         />
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Loading State Overlay */}
               <AnimatePresence>
                 {loading && ( // Show loading overlay when loading=true
                   <motion.div
                     key="loading-overlay"
                     className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                   >
                     {/* ... (keep loading spinner content) ... */}
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
                            Creating Your Perfect Itinerary...
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            Designing a personalized travel plan for {destination}. This may take a minute or two, especially with multiple API calls...
                          </p>
                        </div>
                      </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Success Animation Overlay */}
               <AnimatePresence>
                {planGenerationSuccess && !loading && ( // Show success only when NOT loading
                  <motion.div
                    key="success-overlay"
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[51]" // Ensure higher z-index than loading
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onAnimationComplete={() => {
                      // Start fade out slightly after animation completes if needed
                      // Or rely on the state change trigger
                    }}
                  >
                     {/* ... (keep success checkmark content) ... */}
                      <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md shadow-2xl flex items-center justify-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }} // Exit animation
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                        >
                          <FaCheckCircle className="text-6xl text-green-500" />
                        </motion.div>
                      </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

               {/* Results Section - Show if plan exists */}
               {plan && planGenerated && ( // Render results only if plan exists and generation started
                 <motion.div
                   key="results-section" // Add key
                   className="w-full"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5, delay: 0.1 }} // Slight delay after input form hides
                 >
                   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                     <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                       {/* ... (keep results header content with New Plan button) ... */}
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {/* Use dynamic days if available, otherwise fallback */}
                              Your {days ? `${days}-Day ` : ''}Trip to {destination || 'Selected Destination'}
                            </h2>
                            <p className="text-blue-100 text-sm">
                              From {startLocation || 'N/A'} {budget ? `• Budget: ${parseInt(budget).toLocaleString()} INR` : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              // Reset state for a new plan
                              setPlan('');
                              setPlanGenerated(false);
                              setActiveSection('plan'); // Reset active tab
                              // Optionally clear form fields too
                               setStartLocation(''); setDestination(''); setDays(''); setBudget('');
                               setPeopleCount(''); setTripForFamily(false); setFamilyChildrenCount('');
                               setFamilyElderlyCount(''); setFamilyLadiesCount(''); setFamilyPreferences('');
                               setCurrentTripId(''); // Clear current trip ID
                            }}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium"
                          >
                            Create New Plan
                          </button>
                        </div>
                     </div>

                     {/* Pass necessary props to ResultsSection */}
                     <ResultsSection
                       loading={loading} // Pass loading for internal indicators if needed
                       error={error} // Pass error to display if needed within results
                       plan={plan} // The generated plan text
                       activeSection={activeSection} // Control tabs
                       setActiveSection={setActiveSection}
                       location={destination} // Pass current destination
                       planGenerated={planGenerated} // Indicate plan is loaded
                       // News props
                       news={news}
                       loadingNews={loadingNews} // Pass news loading state
                       // Location Bio props
                       locationBio={locationBio}
                       // Pexels props
                       images={images}
                       imageLoading={imageLoading} // Pass image loading state
                       hasMore={hasMore} // For infinite scroll
                       loadMore={loadMore} // Function to load more images
                       videos={videos}
                       videoPlaying={videoPlaying} // Pass video state
                       handleVideoToggle={handleVideoToggle} // Pass video handlers
                       videoRefs={videoRefs} // Pass video refs
                       activeMediaType={activeMediaType} // Control photo/video view
                       switchMediaType={switchMediaType} // Function to switch media
                       // Feedback props
                       currentTripId={currentTripId}
                       submitFeedback={submitFeedback}
                       feedbackSubmitted={feedbackSubmitted}
                       // Add deleteTrip prop
                       deleteTrip={deleteTrip}
                       loadPreviousTrip={loadPreviousTrip}
                       // Trip history props
                        getUserTrips={getUserTrips}
                        getTripsByFeedbackStatus={getTripsByFeedbackStatus}
                     />
                   </div>
                 </motion.div>
               )}
             </div> {/* End Main Content Flex */}
          </motion.div> {/* End Container */}
        </div> {/* End Padding Div */}
      </div> {/* End Background Div */}

      {/* Subscription Modal (Keep existing) */}
      <AnimatePresence>
        {showModal && (
          <motion.div
             key="modal-overlay"
             className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[60]" // Ensure highest z-index
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           >
             {/* ... (keep modal content) ... */}
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
                    <h2 className="text-xl font-bold">Free Plan Limit Reached</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    You've used your free itinerary generations. Subscribe to unlock unlimited planning and premium features!
                  </p>
                  {/* ... (keep premium benefits list) ... */}
                   <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Premium Benefits:</h3>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Unlimited travel plans</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Access to premium planning features</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Advanced itinerary customization</span></li>
                      <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Save and manage unlimited trips</span></li>
                       <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Priority support</span></li>
                    </ul>
                  </div>
                  <div className="flex justify-end gap-4">
                    <button onClick={handleClose} /* ... styling ... */ disabled={modalAnimating}>Maybe Later</button>
                    <button onClick={handleSubscribe} /* ... styling ... */ disabled={modalAnimating}>Subscribe Now</button>
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