// --- START OF UPDATED FILE Planner.tsx ---

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
  // Removed ladiesCount, elderlyCount, childrenCount as separate states - using family counts instead
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
  // Renamed family states for clarity matching InputForm
  const [familyElderlyCount, setFamilyElderlyCount] = useState('');
  const [familyLadiesCount, setFamilyLadiesCount] = useState(''); // Kept if InputForm still uses it
  const [familyChildrenCount, setFamilyChildrenCount] = useState('');
  const [familyPreferences, setFamilyPreferences] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [planGenerationSuccess, setPlanGenerationSuccess] = useState(false);
  const [currentTripId, setCurrentTripId] = useState('');

  // --- Keep API Keys Hardcoded as requested ---
  const GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k'; // Replace with your actual key if needed
  const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Replace if needed
  // --- ---

  const db = getFirestore();

  // --- Functions (fetchUserDetailsFromFirestore, incrementPlanGenerationCount, getUserTrips, etc.) ---
  // --- Keep all existing functions related to Firebase, Pexels, UI state, etc. unchanged ---
  // ... (fetchUserDetailsFromFirestore function as before) ...
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

  // ... (incrementPlanGenerationCount function as before) ...
    const incrementPlanGenerationCount = async (userEmail: string) => {
    const userDocRef = doc(db, 'users', userEmail);
    try {
      const userDoc = await getDoc(userDocRef);
      const currentCount = userDoc.exists() ? (userDoc.data()?.planGenerationCount || 0) : 0;
      await setDoc(userDocRef, { planGenerationCount: currentCount + 1 }, { merge: true }); // Use setDoc with merge for safety
    } catch (error) {
      console.error('Error updating plan generation count:', error);
    }
  };
  // ... (useEffect for auth check as before) ...
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser && authenticatedUser.email) {
        const userDocRef = doc(db, 'users', authenticatedUser.email);
        try {
            const userDoc = await getDoc(userDocRef);
            let planGenerationCount = 0;
            if (userDoc.exists()) {
              planGenerationCount = userDoc.data()?.planGenerationCount || 0;
            } else {
              // Optional: Create user doc if it doesn't exist
              await setDoc(userDocRef, { email: authenticatedUser.email, createdAt: new Date().toISOString() });
            }

            // Allow specific user OR if count is within limit
            if (planGenerationCount < 3 || authenticatedUser.email === 'prasantshukla89@gmail.com') {
               setUser(authenticatedUser);
            } else {
               setShowModal(true);
               setLoading(false); // Stop loading if limit reached
               setUser(null); // Ensure user is nullified if blocked
               return; // Exit early
            }
        } catch (error) {
             console.error("Error fetching user document:", error);
             setUser(null); // Handle error by setting user to null
        }

      } else {
        setUser(null);
        // Reset relevant state if needed when user logs out
        setPlan('');
        setPlanGenerated(false);
        // etc.
      }
    });

    return unsubscribe; // Cleanup subscription
  }, [db]); // Add db dependency

  // ... (getUserTrips function as before) ...
    const getUserTrips = async () => {
    if (!user || !user.email) {
      console.error('User not authenticated for getUserTrips');
      return [];
    }
    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().trips) {
        // Ensure createdAt is valid before sorting
        return [...userDoc.data().trips].sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Newest first
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching user trips:', error);
      return [];
    }
  };

  // ... (getTripsByFeedbackStatus function as before) ...
    const getTripsByFeedbackStatus = async (hasFeedback: boolean) => {
    try {
      const allTrips = await getUserTrips();
      return allTrips.filter((trip: any) => (!!trip.feedbackSubmitted) === hasFeedback);
    } catch (error) {
      console.error('Error filtering trips by feedback status:', error);
      return [];
    }
  };
  // ... (saveTrip function as before) ...
    const saveTrip = async (tripData: any, fullPlan: string) => {
    if (!user || !user.email) {
      console.error('User not authenticated for saveTrip');
      return null;
    }

    try {
      const tripId = `${user.uid}_${new Date().getTime()}`; // More robust unique ID
      const tripToSave = {
        id: tripId,
        ...tripData,
        planSummary: fullPlan ? (fullPlan.substring(0, 200) + (fullPlan.length > 200 ? '...' : '')) : 'Plan not available',
        hasPlan: !!fullPlan,
        feedbackSubmitted: false,
        createdAt: new Date().toISOString()
      };

      const userDocRef = doc(db, 'users', user.email);
      // Use updateDoc with arrayUnion for adding to existing array, or setDoc if initializing
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().trips) {
           await updateDoc(userDocRef, { trips: arrayUnion(tripToSave) });
      } else {
           // If user doc exists but no trips array, or if doc doesn't exist yet
           await setDoc(userDocRef, { trips: [tripToSave] }, { merge: true });
      }


      // Save full plan separately
      const planDocRef = doc(db, 'plans', tripId);
      await setDoc(planDocRef, {
        userId: user.email,
        tripId,
        fullPlan,
        createdAt: new Date().toISOString()
      });

      setCurrentTripId(tripId); // Set the ID of the newly saved trip
      console.log("Trip saved successfully with ID:", tripId);
      return tripId;
    } catch (error) {
      console.error('Error saving trip:', error);
      setError('Failed to save trip details.');
      return null;
    }
  };

  // ... (fetchFullPlan function as before) ...
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
        console.warn('No plan document found for trip ID:', tripId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching full plan:', error);
      return null;
    }
  };

  // ... (updateTripFeedback function as before) ...
    const updateTripFeedback = async (tripId: string, feedbackData: any) => {
    if (!user || !user.email || !tripId) {
      console.error('Missing user or trip ID for updateTripFeedback');
      return false;
    }

    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().trips) {
        const trips = userDoc.data().trips;
        let tripUpdated = false;
        const updatedTrips = trips.map((trip: any) => {
          if (trip.id === tripId) {
            tripUpdated = true;
            return { ...trip, feedbackSubmitted: true, /* optionally store feedbackData here too */ };
          }
          return trip;
        });

        if (tripUpdated) {
            await updateDoc(userDocRef, { trips: updatedTrips });

            // Save feedback separately (optional but good practice)
            const feedbackDocRef = doc(db, 'feedback', tripId); // Assumes 'feedback' collection
            await setDoc(feedbackDocRef, {
              userId: user.email,
              tripId,
              ...feedbackData, // Spread the feedback data received
              createdAt: new Date().toISOString()
            });

            setFeedbackSubmitted(true); // Update local state
            return true;
        } else {
             console.warn("Trip ID not found in user's trips array for feedback update.");
             return false;
        }
      }
      console.warn("User document or trips array not found for feedback update.");
      return false;
    } catch (error) {
      console.error('Error updating feedback:', error);
      return false;
    }
  };

  // ... (loadPreviousTrip function as before) ...
    const loadPreviousTrip = async (tripId: string) => {
        setLoading(true); // Indicate loading
        setError(null);
        try {
          const trips = await getUserTrips();
          const selectedTrip = trips.find((trip: any) => trip.id === tripId);

          if (!selectedTrip) {
            setError('Selected trip data not found.');
            setLoading(false);
            return;
          }

          // --- Populate State from selectedTrip ---
          setStartLocation(selectedTrip.startLocation || '');
          setDestination(selectedTrip.destination || '');
          setDays(selectedTrip.days || '');
          setBudget(selectedTrip.budget || '');
          setPeopleCount(selectedTrip.peopleCount || '');
          setTripForFamily(selectedTrip.tripForFamily || false);
          setFamilyElderlyCount(selectedTrip.familyElderlyCount || '');
          setFamilyLadiesCount(selectedTrip.familyLadiesCount || ''); // Ensure consistency with InputForm
          setFamilyChildrenCount(selectedTrip.familyChildrenCount || '');
          setFamilyPreferences(selectedTrip.familyPreferences || '');
          setCurrentTripId(selectedTrip.id);
          setFeedbackSubmitted(selectedTrip.feedbackSubmitted || false);
          setPlanGenerated(true); // Mark plan as 'generated' (loaded)

          // Fetch the full plan
          const fullPlan = await fetchFullPlan(tripId);
          setPlan(fullPlan || 'Could not load the detailed plan for this trip.');

          // Update other relevant state for UI consistency
          setImageFetchDestination(selectedTrip.destination || ''); // For Pexels
          setActiveSection('plan'); // Default to plan view
          setPreviousValue(selectedTrip.destination || '');
          setCurrentValue(selectedTrip.destination || '');
          setLocation(selectedTrip.destination || ''); // For About/News sections

          // Fetch supplementary data if needed
          if (selectedTrip.destination) {
              fetchAboutLocation(selectedTrip.destination);
              fetchNewsForDestination(selectedTrip.destination);
          } else {
               console.warn("No destination found in selected trip to fetch additional data.");
          }

        } catch (error) {
          console.error('Error loading previous trip:', error);
          setError('Failed to load the selected trip.');
        } finally {
           setLoading(false); // Stop loading indicator
        }
  };


  // --- *** MODIFIED planFetcher Function START *** ---
  const planFetcher = async () => {
    setPlan(''); // Clear previous plan
    setLoading(true);
    setError(null);
    setPlanGenerationSuccess(false);
    setPlanGenerated(false); // Mark as not generated until success
    setCurrentTripId(''); // Reset current trip ID for new plan

    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      // Fetch user details (as before, necessary for context/limits)
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setError('Could not fetch user details. Please ensure you are logged in.');
        setLoading(false);
        return;
      }

      const userDetails = userDoc.data();
      const planGenerationCount = userDetails?.planGenerationCount || 0;

      // Check plan generation limit (as before)
      if (planGenerationCount >= 3 && user.email !== 'prasantshukla89@gmail.com') {
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Fetch about the location (can run in parallel or before)
      fetchAboutLocation(destination);
      fetchNewsForDestination(destination); // Fetch news as well

      // --- *** NEW PROMPT CONSTRUCTION START *** ---
      // Using variables available in this component's state
      let systemPrompt = `# MISSION
You are an expert, meticulous, and highly resourceful travel itinerary planner AI. Your primary mission is to generate a COMPLETE and detailed travel plan based on comprehensive user context, leveraging the **most current and relevant information available to you** regarding locations, costs, transportation, and operational details in the destination. You must be realistic, especially concerning budget constraints, and follow formatting guidelines precisely. You MUST generate all requested sections in a single response.

# OVERALL USER CONTEXT

*   **Traveler Origin:** ${startLocation || 'Not Specified'}, India
*   **Destination:** ${destination || 'Not Specified'}, India
*   **Trip Duration:** ${days || 'Not Specified'} days
`;

      // Add Travel Party Details based on tripForFamily state
      if (tripForFamily) {
        systemPrompt += `*   **Travel Party:** Family (${peopleCount || 'N/A'} people total`;
        if (familyLadiesCount) systemPrompt += `, ${familyLadiesCount} ladies`;
        if (familyElderlyCount) systemPrompt += `, ${familyElderlyCount} elders`;
        if (familyChildrenCount) systemPrompt += `, ${familyChildrenCount} children`;
        systemPrompt += `)\n`;
      } else {
         // Include fetched user details for solo traveler if needed (optional)
         const soloAge = userDetails?.age || 'Not Specified';
         systemPrompt += `*   **Travel Party:** Solo Traveler (1 person, Age: ${soloAge})\n`;
      }

      // Budget, Preferences, Constraints
      systemPrompt += `*   **Overall Trip Budget:** Constraint - ${budget || 'Not Specified'} INR TOTAL for *all* local expenses (accommodation, food, activities, local transport) for the entire group/person for the full duration. Prioritize budget-friendliness.
*   **User Preferences:** ${tripForFamily ? (familyPreferences || 'General family activities') : (userDetails?.favoritePlaces || 'General sightseeing')} (Prioritize these interests).
*   **Mandatory Constraints:** Strictly VEGETARIAN diet is required for all food suggestions. Consider needs of children/elders if specified in the travel party.
*   **Other User Notes:** ${tripForFamily ? '(Assume general family needs unless specific preferences provided)' : '(Consider user age/details if available)' }

# REQUIRED OUTPUT SECTIONS (Generate ALL of these):

1.  **Budget Feasibility Assessment:** Clear statement on realism of the budget for the trip duration, party size, and destination. Suggest a more feasible minimum budget range (per day/week) based on current estimates for ${destination || 'the destination'}.
2.  **Detailed Day-by-Day Itinerary (All ${days || 'N/A'} Days):**
    *   For EACH day: Use heading format \`### Day X: [Brief Theme/Main Locations]\`.
    *   Include bullet points with suggested time slots (\`* HH:MM - HH:MM: [Activity] - Brief Description (Est. Cost: Z INR)\`).
    *   Suggest specific, named low-cost/free VEGETARIAN-friendly activities relevant to preferences and party composition. Clearly state estimated costs.
    *   Ensure logical flow and realistic timings.
    *   For major named attractions (parks, landmarks, museums etc.), **include a relevant YouTube hyperlink** to a recent travel vlog if possible: \`(Vlog Link: [YouTube URL])\`.
3.  **Accommodation Suggestions:** Suggest 2-3 types or examples of budget-friendly accommodation suitable for the travel party and destination. State estimated *current* nightly cost range (X-Y INR). Note difficulty if budget is very low.
4.  **Local Transportation Strategy:** Recommend cost-effective practical modes based on *current* options in ${destination || 'the destination'} (e.g., buses, metro/trains, walking). Advise on expensive options.
5.  **Vegetarian Food Strategy:** Overall strategy. Suggest specific types of budget eateries common in ${destination || 'the destination'}. Mention low-cost VEGETARIAN meal examples.
6.  **Emergency Preparedness Information:**
    *   **Nearby Hospitals:** List 1-2 reputable hospitals (Govt./Charitable/Lower-cost Private) reasonably accessible from potential budget accommodation areas in ${destination || 'the destination'}.
    *   **Nearby Pharmacies:** Mention general 24/7 pharmacy availability (e.g., common chains) and advise checking near accommodation.
7.  **Reasoning & Final Tips:** Briefly summarize the core challenge (budget/prefs/duration) and the strategy used. Add 1-2 crucial tips for this specific trip in ${destination || 'the destination'}.

# RESPONSE REQUIREMENTS (Apply STRICTLY):

*   **Conciseness:** Be brief and to the point. **AVOID** conversational filler. Focus *only* on generating the requested structured data.
*   **Recency & Accuracy:** Use latest knowledge for estimates (costs, hours, transport). State they are estimates. Recommend final checks.
*   **Formatting:** Use headings (\`##\`/\`###\`), bullet points, and specified formats (costs, etc.) precisely.
*   **Completeness:** Ensure ALL 7 requested output sections are generated.
`;
      // --- *** NEW PROMPT CONSTRUCTION END *** ---


      // --- *** API CALL MODIFICATION START *** ---
      // 1. Update Model Name in URL
      // 2. Use the new systemPrompt
      const response = await axios.post(
        // --- Use gemini-1.5-pro-latest ---
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  // --- Use the newly constructed prompt ---
                  text: systemPrompt
                }
              ]
            }
          ],
          // --- Optional: Add Generation Config (matching Python Cell 5) ---
          generationConfig: {
              temperature: 0.3, // Focused output
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 8192 // Request max tokens for single call
          },
          // --- Optional: Add Safety Settings if needed ---
          // safetySettings: [
          //   {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
          //   // ... other categories
          // ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // Optional: Increase timeout for potentially longer generation
          // timeout: 120000 // e.g., 120 seconds
        }
      );
      // --- *** API CALL MODIFICATION END *** ---

      // Extract plan (handle potential variations in response structure)
      const extractedPlan = response.data.candidates?.[0]?.content?.parts?.[0]?.text || response.data.error?.message || 'Error: No plan generated or invalid response structure.';

      // Check for explicit error messages from the API response
       if (response.data.error || !response.data.candidates) {
          console.error("API Error Response:", response.data);
          throw new Error(extractedPlan); // Throw error to be caught below
       }

      // Check if the model finished due to token limits (best effort check)
      const finishReason = response.data.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
          console.warn(`Plan generation may be incomplete. Finish Reason: ${finishReason}`);
          setError(`Warning: The generated plan might be incomplete due to response length limits (Finish Reason: ${finishReason}). Consider requesting a shorter duration if needed.`);
          // Append warning to plan? Optional.
          // extractedPlan += `\n\n**Warning:** Plan generation may have been cut short due to length limits (Finish Reason: ${finishReason}).`;
      }


      setPlan(extractedPlan);
      setPlanGenerationSuccess(true); // Show success animation
      setPlanGenerated(true); // Mark plan as generated

      // Reset media states (as before)
      setImages([]);
      setNextPageUrl('');
      setTotalResults(0);
      setHasMore(true);
      setVideos([]);
      setActiveMediaType('photos');
      setVideoPlaying(null);
      videoRefs.current = {};

      // Update state values (as before)
      setImageFetchDestination(destination);
      setActiveSection('plan'); // Switch view to the plan
      setPreviousValue(destination);
      setCurrentValue(destination);
      setLocation(destination);

      // Increment plan count (as before)
      incrementPlanGenerationCount(user.email);

      // Prepare trip data for saving (as before)
      const tripData = {
        // Use state variables directly
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
        // Add any other relevant fields from state needed for trip metadata
      };

      // Save the trip (as before - saves summary + full plan separately)
      await saveTrip(tripData, extractedPlan);

    } catch (err: any) {
      console.error('Error in planFetcher:', err);
      // Handle API errors specifically (like 429)
      if (axios.isAxiosError(err) && err.response) {
          console.error("Axios Error Data:", err.response.data);
          console.error("Axios Error Status:", err.response.status);
          if (err.response.status === 429) {
               setError(`Rate Limit Exceeded: Too many requests made too quickly. Please wait a minute and try again, or consider upgrading if using the free tier frequently.`);
          } else {
               setError(`API Error (${err.response.status}): ${err.response.data?.error?.message || err.message}`);
          }
      } else {
           setError(err.message || 'Failed to fetch the plan. Please check details and try again.');
      }
      setPlan(''); // Ensure plan is cleared on error
    } finally {
      setLoading(false); // Ensure loading stops
    }
  };
  // --- *** MODIFIED planFetcher Function END *** ---


  // ... (deleteTrip function as before) ...
    const deleteTrip = async (tripId: string) => {
    if (!user || !user.email || !tripId) {
      console.error("Cannot delete trip: User not logged in or Trip ID missing.");
      return false;
    }

    // Optional: Confirmation dialog
    // if (!window.confirm("Are you sure you want to delete this trip permanently? This cannot be undone.")) {
    //     return false;
    // }

    setLoading(true); // Indicate activity
    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().trips) {
        const currentTrips = userDoc.data().trips;
        const updatedTrips = currentTrips.filter((trip: any) => trip.id !== tripId);

        // Update user's trips array
        await updateDoc(userDocRef, { trips: updatedTrips });

        // Delete the associated full plan document
        try {
          const planDocRef = doc(db, 'plans', tripId);
          await deleteDoc(planDocRef);
        } catch (planDeleteError) {
          // Log warning if plan doc deletion fails, but proceed as main trip record is deleted
          console.warn(`Failed to delete plan document for trip ${tripId}:`, planDeleteError);
        }

         // If the deleted trip was the currently viewed one, clear the view
         if (currentTripId === tripId) {
             setPlan('');
             setPlanGenerated(false);
             setCurrentTripId('');
             // Optionally reset other fields
         }

        console.log("Trip deleted successfully:", tripId);
        return true; // Indicate success
      } else {
        console.warn("User document or trips array not found during delete operation.");
        return false; // Indicate trip wasn't found to be deleted
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError('Failed to delete the trip.');
      return false; // Indicate failure
    } finally {
        setLoading(false);
    }
  };

  // ... (submitFeedback function as before) ...
    const submitFeedback = async (feedbackData: any) => {
    if (!currentTripId) {
      console.error('No active trip selected for feedback.');
      setError('Please select a trip before submitting feedback.');
      return false;
    }
    setLoading(true);
    const result = await updateTripFeedback(currentTripId, feedbackData);
    setLoading(false);
    if (!result) {
         setError('Failed to submit feedback.');
    }
    return result;
  };

  // ... (fetchAboutLocation function as before, but maybe use pro model?) ...
    const fetchAboutLocation = async (locationQuery: string) => {
    // Consider using a slightly less powerful/costly model if needed just for 'about' info
    // Or keep using pro for consistency
    setLoading(true); // Reuse main loading indicator or add specific one
    setError(null);
    setLocationBio(''); // Clear previous bio

    if (!locationQuery) {
        setError("Please provide a destination to get information about.");
        setLoading(false);
        return;
    }

    const aboutPrompt = `Provide a comprehensive and engaging guide about "${locationQuery}". Structure the response with clear headings for:
1.  **Brief History & Significance:** Key historical events and cultural importance.
2.  **Top Attractions:** Must-visit landmarks, natural sites, museums (mentioning 3-5 key ones with brief descriptions). Include both popular and perhaps one lesser-known gem.
3.  **Cultural Highlights:** Unique customs, traditions, festivals, or arts scene.
4.  **Local Cuisine:** Signature dishes or food experiences (mention 2-3 examples). Briefly mention if vegetarian options are common.
5.  **Best Time to Visit:** Ideal seasons/months considering weather and major events.
6.  **Getting Around:** Common local transportation methods.
7.  **Essential Tips:** One key safety tip and one etiquette tip for visitors.

Keep the language engaging for a traveler. Focus on accuracy and provide practical insights. Be concise.`;

    try {
      const response = await axios.post(
        // Using 1.5 Pro here too for consistency, but flash could work
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: aboutPrompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

       const bioText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || response.data.error?.message || 'Could not fetch information about this location.';
       if (response.data.error || !response.data.candidates) {
           throw new Error(bioText);
       }
       setLocationBio(bioText);

    } catch (err: any) {
      console.error('Error fetching location information:', err);
      setError(err.message || 'Failed to fetch location information.');
       setLocationBio('Failed to load location details.'); // Provide feedback in the bio area
    } finally {
      // Decide if main loading indicator should be turned off here,
      // depends if planFetcher calls this and needs loading=true longer
      // setLoading(false); // Maybe only turn off a specific 'aboutLoading' state
    }
  };

  // ... (imageFetcher function using Pexels as before) ...
   const imageFetcher = async (query: string, loadMore = false) => {
        if (!query) return;
        setImageLoading(true);

        const url = loadMore && nextPageUrl
            ? nextPageUrl
            : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`; // Fetch 15 images

        try {
            const imageResponse = await axios.get(url, {
                headers: { 'Authorization': PEXELS_API_KEY }
            });

            const newPhotos = imageResponse.data.photos || [];
            if (newPhotos.length > 0) {
                 setImages((prevImages) => loadMore ? [...prevImages, ...newPhotos] : newPhotos);
            } else if (!loadMore) {
                 setImages([]); // Clear if initial search yields nothing
                 console.warn("No initial photos found for query:", query);
            }

            const nextPage = imageResponse.data.next_page || '';
            setNextPageUrl(nextPage);
            setTotalResults(imageResponse.data.total_results || 0);
            setHasMore(!!nextPage); // Set hasMore based on next_page existence

        } catch (err: any) {
            console.error('Error fetching images:', err);
            // Don't clear images on error if loading more, preserve existing ones
            if (!loadMore) setImages([]);
            setNextPageUrl('');
            setTotalResults(0);
            setHasMore(false);
            setError('Could not load images.');
        } finally {
            setImageLoading(false);
        }
    };


  // ... (fetchVideos function using Pexels as before) ...
      const fetchVideos = async () => {
        if (!imageFetchDestination) return; // Use imageFetchDestination for consistency
        setImageLoading(true); // Use same loading indicator for media
        setVideos([]); // Clear previous videos

        try {
            const videoResponse = await axios.get(
                `https://api.pexels.com/videos/search?query=${encodeURIComponent(imageFetchDestination)}&per_page=10`, // Fetch 10 videos
                { headers: { 'Authorization': PEXELS_API_KEY } }
            );
            setVideos(videoResponse.data.videos || []);
            setVideoPlaying(null); // Reset playing state
        } catch (err: any) {
            console.error('Error fetching videos:', err);
            setVideos([]);
            setError('Could not load videos.');
        } finally {
            setImageLoading(false);
        }
    };


  // ... (fetchWeatherForDestination function as before) ...
   // Fetch weather (Assuming /api/weather endpoint exists)
    const fetchWeatherForDestination = async (locationQuery: string) => {
        // setLoadingNews(true); // Use news loading or a dedicated weather loading state
        // setError(null);
        if (!locationQuery) return;

        try {
            // Assuming your API route handles the actual weather API call
            const response = await axios.post('/api/weather', { location: locationQuery });
            // Process weather data - This depends highly on what your /api/weather returns
            // Example: setWeather(response.data);
            console.log("Weather data fetched (processing depends on API route):", response.data);
            // Handle potential errors returned *from your API route*
             if (response.status >= 400) {
                 console.error('Error from weather API route:', response.data);
                 // setError('Failed to fetch weather details.');
             } else if (response.status === 500) {
                // Original code had an alert here, maybe log instead
                console.warn("Weather API Reminder: Try providing the complete name of the location for a better experience.");
             }

        } catch (error) {
            // setError('Failed to fetch weather.'); // Maybe show a less intrusive error
            console.error('Error calling /api/weather endpoint:', error);
        } finally {
            // setLoadingNews(false); // Turn off relevant loading indicator
        }
    }

  // ... (fetchNewsForDestination function as before) ...
    const fetchNewsForDestination = async (locationQuery: string) => {
        setLoadingNews(true);
        setError(null); // Clear previous errors specific to news/weather fetch
        setNews([]); // Clear previous news

        if (!locationQuery) {
            setLoadingNews(false);
            return;
        }

        try {
             // Assuming your API route handles the actual news API call
            const response = await axios.post('/api/news', { location: locationQuery });

            if (response.status === 200 && response.data.articles) {
                setNews(response.data.articles);
                // Optionally fetch weather right after successful news fetch
                // fetchWeatherForDestination(locationQuery); // Removed from here to avoid potential double calls if called elsewhere
            } else {
                 // Handle errors returned *from your API route*
                console.error('Error fetching news from API route:', response.status, response.data);
                setError('Failed to fetch recent news.');
                setNews([]);
            }
        } catch (error) {
            setError('Failed to fetch news.');
            console.error('Error calling /api/news endpoint:', error);
            setNews([]);
        } finally {
            setLoadingNews(false);
        }
    };

  // ... (isActive function as before) ...
    const isActive = () => {
        setImagePower(!imagePower); // Simple toggle
    };
  // ... (loadMore callback function as before, ensure dependencies are correct) ...
    const loadMore = useCallback(() => {
        // Call imageFetcher to load more, pass true for loadMore flag
        if (!imageLoading && hasMore && nextPageUrl && imageFetchDestination) {
            imageFetcher(imageFetchDestination, true); // Pass true here
        } else if (!hasMore) {
             console.log("No more images to load.");
        } else if (imageLoading) {
             console.log("Already loading images...");
        }
    }, [imageLoading, hasMore, nextPageUrl, imageFetchDestination]); // Dependencies


  // ... (useEffect for initial image load/media switch as before) ...
   // Effect to fetch media when the relevant section/tab becomes active
    useEffect(() => {
        // Only fetch if the plan has been generated/loaded and the destination is set
        if (planGenerated && imageFetchDestination) {
            if (activeSection === 'photos') {
                if (activeMediaType === 'photos') {
                    // If switching TO photos or initial load, fetch fresh
                    if (images.length === 0 || lastDestination !== imageFetchDestination) {
                        setImages([]); // Clear old images if destination changed
                        setNextPageUrl(''); // Reset pagination
                        setHasMore(true);
                        imageFetcher(imageFetchDestination);
                    }
                } else if (activeMediaType === 'videos') {
                    // If switching TO videos or initial load, fetch fresh
                     if (videos.length === 0 || lastDestination !== imageFetchDestination) {
                        setVideos([]);
                        fetchVideos(); // Uses imageFetchDestination internally
                    }
                }
                setLastDestination(imageFetchDestination); // Update last fetched destination
            }
        }
    }, [activeSection, activeMediaType, planGenerated, imageFetchDestination]); // Key dependencies


  // ... (handleVideoToggle function as before) ...
     const handleVideoToggle = (videoId: number) => {
        const videoRef = videoRefs.current[videoId];
        if (!videoRef) return;

        // Pause the previously playing video, if any
        if (videoPlaying !== null && videoPlaying !== videoId && videoRefs.current[videoPlaying]) {
            videoRefs.current[videoPlaying]?.pause();
        }

        // Toggle play/pause for the clicked video
        if (videoPlaying === videoId) {
            videoRef.pause();
            setVideoPlaying(null); // Set playing to null if pausing
        } else {
            videoRef.play().catch(err => console.error("Video play failed:", err)); // Attempt to play
            setVideoPlaying(videoId); // Set the currently playing video ID
        }
    };

  // ... (switchMediaType function as before) ...
    const switchMediaType = (type: 'photos' | 'videos') => {
        setActiveMediaType(type);
        // The useEffect hook above will handle fetching data if necessary
    };

  // ... (pageTransition variants as before) ...
  const pageTransition = { /* ... as before ... */ };
  // ... (handleSubscribe function as before) ...
   const handleSubscribe = () => {
        setModalAnimating(true);
        setTimeout(() => {
          // Ensure router is imported if not already
          router.push('/Component/Subscribe'); // Adjust path if needed
        }, 300); // Delay matches animation exit
    };
  // ... (handleClose function as before) ...
    const handleClose = () => {
        setModalAnimating(true);
        setTimeout(() => {
          router.push('/'); // Redirect to home page
        }, 300);
    };

  // --- JSX Structure ---
  // --- Keep the JSX structure (Navbar, InputForm, ResultsSection, Modals) unchanged ---
  return (
    <AuthGuard>
      <Navbar />
      {/* --- Main Content Wrapper --- */}
      <div className="bg-gray-50 text-gray-900 dark:text-white bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-700 min-h-screen">
        <div className="pt-24 pb-16">
          <motion.div
            className="container mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageTransition} // Make sure variants are defined
          >
            {/* --- Header (Conditional) --- */}
            {!planGenerated && !loading && ( // Show header only before plan generation starts
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                  Plan Your Perfect Journey
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Let us create a personalized travel itinerary tailored just for you. Simply fill in your travel details below.
                </p>
              </div>
            )}

            {/* --- Main Content Area --- */}
            <div className={`flex flex-wrap gap-6 transition-all duration-700 ease-in-out`}>

              {/* --- Input Form (Conditional) --- */}
              <AnimatePresence mode="wait">
                {!planGenerated && !loading && ( // Show InputForm only if plan not generated and not loading
                  <motion.div
                    key="input-form" // Add key for AnimatePresence
                    className="w-full lg:w-2/3 mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                      {/* Form Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <h2 className="text-2xl font-bold text-white">Travel Details</h2>
                        <p className="text-blue-100">Tell us about your upcoming adventure</p>
                      </div>
                      {/* Form Body */}
                      <div className="p-6">
                        <InputForm
                           // Pass all required props, ensure names match InputForm's expectations
                           startLocation={startLocation} setStartLocation={setStartLocation}
                           destination={destination} setDestination={setDestination}
                           days={days} setDays={setDays}
                           budget={budget} setBudget={setBudget}
                           peopleCount={peopleCount} setPeopleCount={setPeopleCount}
                           // Pass family-related props
                           tripForFamily={tripForFamily} setTripForFamily={setTripForFamily}
                           familyElderlyCount={familyElderlyCount} setFamilyElderlyCount={setFamilyElderlyCount}
                           familyLadiesCount={familyLadiesCount} setFamilyLadiesCount={setFamilyLadiesCount} // If InputForm uses it
                           familyChildrenCount={familyChildrenCount} setFamilyChildrenCount={setFamilyChildrenCount}
                           familyPreferences={familyPreferences} setFamilyPreferences={setFamilyPreferences}
                           // Pass loading state and submit function
                           loading={loading} planFetcher={planFetcher}
                           // Pass imageLoading if InputForm needs it (likely not)
                           // imageLoading={imageLoading}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* --- Loading State Overlay --- */}
              <AnimatePresence>
                {loading && (
                   <motion.div
                    key="loading-overlay" // Add key
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Loading Spinner and Text */}
                     <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <div className="flex justify-center mb-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        >
                          <FaSpinner className="text-5xl text-blue-600 dark:text-blue-400" />
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Crafting Your Itinerary...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Personalizing your plan for {destination || 'your trip'}. Please wait...
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* --- Success Animation Overlay --- */}
               <AnimatePresence>
                {planGenerationSuccess && !loading && (
                  <motion.div
                    key="success-overlay" // Add key
                    className="fixed inset-0 flex items-center justify-center bg-green-500 bg-opacity-70 z-[60]" // Higher z-index
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onAnimationComplete={() => {
                      // Automatically hide after a short delay
                      setTimeout(() => setPlanGenerationSuccess(false), 1200); // 1.2 seconds visibility
                    }}
                  >
                    <motion.div
                      className="text-white flex flex-col items-center"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                      <FaCheckCircle className="text-7xl mb-3" />
                      <p className="text-xl font-semibold">Plan Generated!</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* --- Results Section (Conditional) --- */}
              {planGenerated && !loading && ( // Show results only when plan is generated/loaded and not currently loading
                <motion.div
                  key="results-section" // Add key
                  className="w-full"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }} // Slight delay after loading stops
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                     {/* Results Header */}
                     <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                       <div className="flex flex-wrap justify-between items-center gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                               {/* Display dynamic title */}
                               Your {days || 'N/A'}-Day Trip Plan: {destination || 'Destination'}
                            </h2>
                            <p className="text-blue-100 text-sm">
                              From: {startLocation || 'N/A'} • Budget: {budget ? `${budget} INR` : 'N/A'} • Party: {peopleCount || 'N/A'} {tripForFamily ? 'Family' : 'Solo'}
                            </p>
                          </div>
                          {/* New Plan Button */}
                          <button
                             onClick={() => {
                               // Reset state to show input form again
                               setPlan('');
                               setPlanGenerated(false);
                               setActiveSection('plan'); // Reset active section
                               // Optionally clear form fields
                               // setStartLocation(''); setDestination(''); etc.
                             }}
                             className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium"
                           >
                             Create New Plan
                           </button>
                       </div>
                     </div>
                     {/* Results Body (Tabs, Content) */}
                     <ResultsSection
                         loading={loading} // Pass loading state if ResultsSection needs it
                         error={error} // Pass error state
                         plan={plan} // Pass the generated plan
                         activeSection={activeSection} setActiveSection={setActiveSection} // For tab navigation
                         location={destination} // Pass current destination
                         planGenerated={planGenerated} // Indicate plan is ready
                         news={news} // Pass news data
                         // locationImage={locationImage} // If using a specific hero image
                         locationBio={locationBio} // Pass about section content
                         // Image props
                         images={images} imageLoading={imageLoading}
                         hasMore={hasMore} loadMore={loadMore}
                         // Video props
                         videos={videos} fetchVideos={fetchVideos} // Maybe trigger fetch from within ResultsSection?
                         activeMediaType={activeMediaType} switchMediaType={switchMediaType}
                         videoPlaying={videoPlaying} handleVideoToggle={handleVideoToggle}
                         videoRefs={videoRefs} // Pass refs for video control
                         // Add other necessary props
                         // fetchNewsForDestination={fetchNewsForDestination} // If needed inside
                         // previousValue={previousValue} // If needed inside
                     />
                  </div>
                </motion.div>
              )}

            </div> {/* End Flex Container */}
          </motion.div> {/* End Page Container */}
        </div> {/* End Padding Wrapper */}
      </div> {/* End Background Wrapper */}


      {/* --- Subscription Modal --- */}
      <AnimatePresence>
          {showModal && (
            <motion.div
              key="subscription-modal" // Add key
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[70]" // Ensure high z-index
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full mx-4" // Slightly wider
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
              >
                 {/* Modal Header */}
                 <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 text-white">
                   <div className="flex items-center gap-3">
                     <FaLock className="text-2xl opacity-90" />
                     <h2 className="text-xl font-semibold">Unlock Premium Access</h2>
                   </div>
                 </div>
                 {/* Modal Body */}
                 <div className="p-6">
                   <p className="text-gray-700 dark:text-gray-300 mb-5 text-center text-lg">
                      You've used your free plan generations. Subscribe for unlimited planning!
                   </p>
                   {/* Benefits List */}
                   <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-purple-200 dark:border-gray-600">
                     <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 text-center">Premium Includes:</h3>
                     <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                         {/* List benefits */}
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Unlimited Plans</span></li>
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Detailed Customization</span></li>
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Advanced Location Insights</span></li>
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Offline Itinerary Access</span></li>
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Priority Support</span></li>
                         <li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Exclusive Features</span></li>
                     </ul>
                   </div>
                   {/* Action Buttons */}
                   <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <button
                       onClick={handleClose} // Go Home or relevant action
                       className={`w-full sm:w-auto px-5 py-2.5 text-center text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg transition font-medium ${
                         modalAnimating ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                       }`}
                       disabled={modalAnimating}
                     >
                       Maybe Later
                     </button>
                     <button
                       onClick={handleSubscribe} // Go to subscription page
                       className={`w-full sm:w-auto px-6 py-2.5 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg shadow-md transition ${
                         modalAnimating ? 'opacity-50 pointer-events-none' : 'hover:from-purple-700 hover:to-pink-700'
                       }`}
                       disabled={modalAnimating}
                     >
                       View Subscription Options
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

// --- END OF UPDATED FILE Planner.tsx ---