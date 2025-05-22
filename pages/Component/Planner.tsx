// const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU'; // Your primary key
// const FALLBACK_GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k'; // Your fallback key
// const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Your Pexels key
 // planner.tsx
// Planner.tsx
"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Navbar from '@/pages/Component/Navbar';
import axios from 'axios';
import { auth } from '@/FirebaseCofig';
import InputForm from './InputForm';
import ResultsSection from './ResultsSection';
import { Image, NewsItem, Video, Trip } from '@/types/types'; // Assuming Trip is in types/types.ts
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '../AuthGuard/AuthGuard';
import { collection, getFirestore, setDoc, updateDoc, arrayUnion, deleteDoc, DocumentData } from 'firebase/firestore'; // Added DocumentData
import { doc, getDoc } from 'firebase/firestore';
import router from 'next/router';
import { FaSpinner, FaLock, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Feature definitions (can be moved to a utils file)
interface PlanFeature {
  key: string;
  label: string;
  description?: string | ((destination: string) => string);
  minPlan: 'Free' | 'Pro' | 'Pro Alpha' | 'Pro Super';
  promptEnhancement: (destination: string) => string;
}

const ALL_PLAN_FEATURES: PlanFeature[] = [
    { key: 'alternative_activities', label: 'Alternative Activity Options', description: 'Get 2 alternative activity suggestions for each day.', minPlan: 'Pro', promptEnhancement: () => "\n- For each day, suggest at least two alternative activity options (e.g., one more adventurous, one more relaxed/cultural).", },
    { key: 'local_eateries', label: 'Local Eatery Recommendations', description: 'Specific food spot suggestions (budget & mid-range).', minPlan: 'Pro', promptEnhancement: () => "\n- Include specific recommendations for 2-3 local eateries per day, mentioning their typical price range (e.g., budget-friendly, mid-range).", },
    { key: 'etiquette_tips', label: 'Local Etiquette & Tips', description: (destination) => `Cultural do's and don'ts for ${destination || 'your destination'}.`, minPlan: 'Pro', promptEnhancement: (destination) => `\n- Add a concise section on 'Local Etiquette & Key Cultural Tips' relevant to ${destination || 'the destination'}.`, },
    { key: 'hidden_gems', label: 'Hidden Gem Suggestions', description: 'Discover 2-3 off-the-beaten-path experiences.', minPlan: 'Pro Alpha', promptEnhancement: (destination) => `\n- Suggest 2-3 'Off-the-Beaten-Path' experiences or hidden gems in or near ${destination || 'the destination'} that are not typical tourist traps.`, },
    { key: 'local_transport_guide', label: 'Local Transportation Guide', description: 'Info on public transport, taxis, and navigation apps.', minPlan: 'Pro Alpha', promptEnhancement: () => "\n- Include a brief guide on local transportation options: best ways to get around (e.g., public transport specific lines/routes for key attractions, ride-hailing app availability, average taxi fares).", },
    { key: 'crowd_avoidance_tips', label: 'Crowd Avoidance Tips', description: 'Best times to visit popular spots to beat the crowds.', minPlan: 'Pro Alpha', promptEnhancement: () => "\n- Offer advice on the best times to visit major attractions to avoid large crowds or long queues.", },
    { key: 'accommodation_comparison', label: 'Accommodation Comparison (3 levels)', description: 'Budget, Mid-Range, & Luxury hotel/stay suggestions.', minPlan: 'Pro Super', promptEnhancement: () => "\n- Provide 2-3 accommodation suggestions for different budget levels (Budget, Mid-Range, Luxury), including brief pros and cons for each related to location or amenities.", },
    { key: 'contingency_planning', label: 'Contingency Planning', description: 'Rainy day alternatives for 2 activities.', minPlan: 'Pro Super', promptEnhancement: () => "\n- Include a section on 'Contingency Planning' by suggesting specific alternative activities for at least two planned outdoor activities in case of bad weather.", },
    { key: 'premium_experience', label: 'Premium/Exclusive Experience Suggestion', description: 'One unique, high-end activity idea.', minPlan: 'Pro Super', promptEnhancement: () => "\n- Suggest one premium or exclusive experience available at the destination (e.g., a private guided tour, a special workshop, a fine dining experience with a unique view, or a luxury spa treatment).", },
    { key: 'detailed_local_contacts', label: 'Detailed Local Contacts', description: 'Beyond general emergency: tourist police, embassy info.', minPlan: 'Pro Super', promptEnhancement: () => "\n- Add a list of more specific important local contacts beyond general emergency numbers, such as tourist police, the nearest embassy/consulate (if applicable for international travel), and a recommended local medical clinic for non-emergencies.", },
];

const PLAN_HIERARCHY: Record<string, number> = { 'Free': 0, 'Pro': 1, 'Pro Alpha': 2, 'Pro Super': 3, };
function userHasAccessToFeature(userPlan: string | null, featureMinPlan: 'Free' | 'Pro' | 'Pro Alpha' | 'Pro Super'): boolean {
  const currentUserPlan = userPlan || 'Free';
  return PLAN_HIERARCHY[currentUserPlan] >= PLAN_HIERARCHY[featureMinPlan];
}


const Index = () => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [startLocation, setStartLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [peopleCount, setPeopleCount] = useState('');
    const [images, setImages] = useState<Image[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
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
    const [userSubscription, setUserSubscription] = useState<string | null>('Free');
    const [selectedOptionalFeatures, setSelectedOptionalFeatures] = useState<string[]>([]);
    const [showFeatureSelector, setShowFeatureSelector] = useState(false);

    const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU';
    const FALLBACK_GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k';
    const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW';

    const db = getFirestore();

    // --- Firestore Functions ---
    const fetchUserDetailsFromFirestore = async (userEmail: string): Promise<DocumentData | null> => {
        const userDocRef = doc(db, 'users', userEmail);
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            return docSnapshot.data();
        } else {
            console.warn("No user data found in Firestore for:", userEmail);
            return null;
        }
    };

    const incrementPlanGenerationCount = async (userEmail: string): Promise<void> => {
        const userDocRef = doc(db, 'users', userEmail);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const currentCount = userDoc.data()?.planGenerationCount || 0;
                await updateDoc(userDocRef, {
                    planGenerationCount: currentCount + 1,
                });
            } else {
                await setDoc(userDocRef, {
                    planGenerationCount: 1,
                    email: userEmail,
                }, { merge: true });
            }
        } catch (error) {
            console.error('Error updating plan generation count:', error);
        }
    };

    const saveTrip = async (tripData: Omit<Trip, 'id' | 'createdAt'>, fullPlan: string): Promise<string | null> => {
        if (!user || !user.email) {
            toast.error('You must be logged in to save trips.');
            return null;
        }
        try {
            const tripId = new Date().getTime().toString();
            const tripToSave: Trip = {
                id: tripId,
                ...tripData,
                planSummary: fullPlan.substring(0, 200) + '...',
                hasPlan: true,
                feedbackSubmitted: false,
                createdAt: new Date().toISOString()
            };

            const userDocRef = doc(db, 'users', user.email);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                 await updateDoc(userDocRef, {
                    trips: arrayUnion(tripToSave)
                });
            } else {
                 await setDoc(userDocRef, {
                    email: user.email, 
                    trips: [tripToSave]
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
            toast.error('Could not save your trip.');
            return null;
        }
    };

    const fetchFullPlan = async (tripId: string): Promise<string | null> => {
        if (!tripId) return null;
        try {
            const planDocRef = doc(db, 'plans', tripId);
            const planDoc = await getDoc(planDocRef);
            return planDoc.exists() ? planDoc.data().fullPlan : null;
        } catch (error) { console.error('Error fetching full plan:', error); return null; }
    };

    const getUserTrips = async (): Promise<Trip[]> => {
        if (!user || !user.email) return [];
        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().trips) {
                const tripsArray: Trip[] = Array.isArray(userDoc.data().trips) ? userDoc.data().trips : [];
                return [...tripsArray].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
            return [];
        } catch (error) { console.error('Error fetching user trips:', error); return []; }
    };
    
    const deleteTrip = async (tripId: string): Promise<boolean> => {
        if (!user || !user.email || !tripId) return false;
        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().trips) {
                const updatedTrips = userDoc.data().trips.filter((trip: Trip) => trip.id !== tripId);
                await updateDoc(userDocRef, { trips: updatedTrips });
                await deleteDoc(doc(db, 'plans', tripId)).catch(err => console.warn("Plan doc delete failed", err));
                await deleteDoc(doc(db, 'feedback', tripId)).catch(err => console.warn("Feedback doc delete failed", err));
                return true;
            }
            return false;
        } catch (error) { console.error('Error deleting trip:', error); return false; }
    };

    const updateTripFeedback = async (tripId: string, feedbackData: any): Promise<boolean> => {
        if (!user || !user.email || !tripId) return false;
        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().trips) {
                const trips: Trip[] = userDoc.data().trips;
                const updatedTrips = trips.map(trip => trip.id === tripId ? { ...trip, feedbackSubmitted: true, feedbackData } : trip);
                await updateDoc(userDocRef, { trips: updatedTrips });
                await setDoc(doc(db, 'feedback', tripId), { userId: user.email, tripId, ...feedbackData, createdAt: new Date().toISOString() });
                setFeedbackSubmitted(true);
                return true;
            }
            return false;
        } catch (error) { console.error('Error updating feedback:', error); return false; }
    };

    const submitFeedback = async (feedbackData: any): Promise<boolean> => {
        if (!currentTripId) { toast.error("No trip selected for feedback."); return false; }
        const result = await updateTripFeedback(currentTripId, feedbackData);
        if (result) toast.success("Feedback submitted!"); else toast.error("Feedback submission failed.");
        return result;
    };

     const loadPreviousTrip = async (tripId: string): Promise<void> => {
        setLoading(true); setError(null); setPlan('');
        try {
            const trips = await getUserTrips();
            const selectedTrip = trips.find(trip => trip.id === tripId);

            if (!selectedTrip) {
                setError('Selected trip not found.'); toast.error('Selected trip not found.'); setLoading(false); return;
            }
            const fullPlan = await fetchFullPlan(tripId);
            setPlan(fullPlan || 'Plan details not available.');
            if (!fullPlan) toast.warn('Plan details not available for this trip.');

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
            setCurrentTripId(selectedTrip.id);
            setFeedbackSubmitted(selectedTrip.feedbackSubmitted || false);
            setPlanGenerated(true);
            setUserSubscription(selectedTrip.generatedWithSubscription || 'Free');
            setSelectedOptionalFeatures(selectedTrip.selectedFeatures || []);

            const currentDest = selectedTrip.destination || '';
            setImageFetchDestination(currentDest);
            setActiveSection('plan');
            setLocation(currentDest);

            if (currentDest) {
                fetchAboutLocation(currentDest);
                fetchNewsForDestination(currentDest);
                setImages([]); setVideos([]); setNextPageUrl(''); setHasMore(true);
                setLastDestination('');
            } else {
                setError("Loaded trip missing destination."); toast.warn("Loaded trip missing destination.");
            }
        } catch (e) { console.error(e); setError('Failed to load trip.'); toast.error('Failed to load trip.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
            if (authenticatedUser && authenticatedUser.email) {
                setUser(authenticatedUser);
                const userDocRef = doc(db, 'users', authenticatedUser.email);
                try {
                    const userDoc = await getDoc(userDocRef);
                    let planGenCount = 0; let currentSub = 'Free';
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        planGenCount = userData?.planGenerationCount || 0;
                        currentSub = userData?.subscriptions || 'Free';
                        setUserSubscription(currentSub);
                    } else {
                        await setDoc(userDocRef, { email: authenticatedUser.email, planGenerationCount: 0, subscriptions: 'Free', createdAt: new Date().toISOString() });
                        setUserSubscription('Free');
                    }
                    const planLimits: Record<string, number> = { 'Free': 3, 'Pro': 10, 'Pro Alpha': 25, 'Pro Super': 1000 };
                    const genLimit = planLimits[currentSub] ?? 3;
                    setShowModal(!(authenticatedUser.email === 'prasantshukla89@gmail.com' || planGenCount < genLimit));
                    if (authenticatedUser.email !== 'prasantshukla89@gmail.com' && planGenCount >= genLimit) setLoading(false);

                } catch (err) { console.error("Auth check error:", err); setUser(null); setUserSubscription('Free'); toast.error("Plan usage verification failed."); }
            } else { setUser(null); setShowModal(false); setUserSubscription('Free'); }
        });
        return unsubscribe;
    }, [db]);

    const planFetcher = async (): Promise<void> => {
        setPlan(''); setLoading(true); setError(null);
        setPlanGenerationSuccess(false); setPlanGenerated(false);

        if (!user || !user.email) { toast.error("Please log in."); setLoading(false); return; }
        if (!GEMINI_API_KEY || !FALLBACK_GEMINI_API_KEY) { toast.error("Service config error."); setLoading(false); return; }

        let userDetailsFromDb: DocumentData | null = null;
        let planGenCount = 0;
        let currentSub = userSubscription || 'Free';

        try {
            const userDocRef = doc(db, 'users', user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                userDetailsFromDb = userDoc.data();
                planGenCount = userDetailsFromDb?.planGenerationCount || 0;
                currentSub = userDetailsFromDb?.subscriptions || 'Free';
                setUserSubscription(currentSub);
            } else {
                await setDoc(userDocRef, { email: user.email, planGenerationCount: 0, subscriptions: 'Free', createdAt: new Date().toISOString() });
                userDetailsFromDb = { name: user.displayName || "User", subscriptions: 'Free', email: user.email }; // Use Firebase display name
                currentSub = 'Free'; setUserSubscription('Free');
            }

            const planLimits: Record<string, number> = { 'Free': 3, 'Pro': 10, 'Pro Alpha': 25, 'Pro Super': 1000 };
            const genLimit = planLimits[currentSub] ?? 3;

            if (user.email !== 'prasantshukla89@gmail.com' && planGenCount >= genLimit) {
                setShowModal(true); setLoading(false); return;
            }

            const userSpecificDetails = `
              Name: ${userDetailsFromDb?.name || user.displayName || 'N/A'}
              Religion: ${userDetailsFromDb?.religion || 'N/A'}
              Favorite Places: ${userDetailsFromDb?.favoritePlaces && Array.isArray(userDetailsFromDb.favoritePlaces) ? userDetailsFromDb.favoritePlaces.join(', ') : typeof userDetailsFromDb?.favoritePlaces === 'string' ? userDetailsFromDb.favoritePlaces : 'N/A'}
              Believer of God: ${typeof userDetailsFromDb?.believerOfGod === 'boolean' ? (userDetailsFromDb.believerOfGod ? 'Yes' : 'No') : 'N/A'}
              Age: ${userDetailsFromDb?.age || 'N/A'}
            `;

            let basePromptContent = `I am planning a ${days}-day trip from ${startLocation} to ${destination}. My total budget is ${budget}.
            ${tripForFamily ? `This trip is for my family of ${peopleCount} people, including ${familyLadiesCount || 0} ladies, ${familyElderlyCount || 0} elders, and ${familyChildrenCount || 0} children. Family preferences: ${familyPreferences || 'General family-friendly activities'}. Consider safety and accessibility.`
                : `This is a solo trip. My personal details are: ${userSpecificDetails}.`}
            Create a detailed itinerary: travel routes, must-visit places, activities, estimated daily budget breakdown. Realistic, engaging, markdown formatted.`;

            let finalAugmentedPrompt = basePromptContent;
            let planTierDescriptor = `${currentSub} Plan`;

            if (selectedOptionalFeatures.length > 0) {
                finalAugmentedPrompt += "\n\n**Please incorporate the following specific requests into the itinerary:**";
                selectedOptionalFeatures.forEach(featureKey => {
                    const feature = ALL_PLAN_FEATURES.find(f => f.key === featureKey);
                    if (feature && userHasAccessToFeature(currentSub, feature.minPlan)) {
                        finalAugmentedPrompt += feature.promptEnhancement(destination);
                    }
                });
                 planTierDescriptor += " with Customizations";
            }

            finalAugmentedPrompt = `You are an expert travel planner generating a "${planTierDescriptor}" for a user. ${finalAugmentedPrompt}`;
            let fallBackPrompt = `Generate a ${planTierDescriptor} for a ${days}-day trip to ${destination} from ${startLocation}. Budget: ${budget}. Details: ${tripForFamily ? 'Family...' : 'Solo...'}. Markdown.`;
            if (selectedOptionalFeatures.length > 0) fallBackPrompt += ` Include if possible: ${selectedOptionalFeatures.map(k => ALL_PLAN_FEATURES.find(f=>f.key===k)?.label).filter(Boolean).join(', ')}.`;

            let extractedPlan = ''; let primaryModelFailed = false;
            try {
                const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { contents: [{ parts: [{ text: finalAugmentedPrompt }] }] }, { headers: { 'Content-Type': 'application/json' }, timeout: 45000 });
                extractedPlan = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!extractedPlan || extractedPlan.trim().length < 150) primaryModelFailed = true;
            } catch (err) { primaryModelFailed = true; console.error("Primary AI Error:", err); }

            if (primaryModelFailed) {
                toast.info("Primary AI busy, trying backup...", { autoClose: 2500 });
                try {
                    const fallbackResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${FALLBACK_GEMINI_API_KEY}`,{ contents: [{ parts: [{ text: fallBackPrompt }] }] }, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
                    extractedPlan = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!extractedPlan || extractedPlan.trim().length < 100) { setError('AI models failed to generate a sufficient plan.'); toast.error('Plan generation failed.'); setPlan(''); }
                    else setError(null);
                } catch (fallbackErr) { setError('Both AI models failed.'); toast.error('Plan generation failed completely.'); setPlan(''); console.error("Fallback AI Error:", fallbackErr); }
            }

            if (extractedPlan && extractedPlan.trim().length >= 100) {
                setPlan(extractedPlan); setPlanGenerationSuccess(true); setPlanGenerated(true);
                setImages([]); setNextPageUrl(''); setTotalResults(0); setHasMore(true);
                setVideos([]); setActiveMediaType('photos'); setVideoPlaying(null); videoRefs.current = {};
                setImageFetchDestination(destination); setActiveSection('plan');
                setLocation(destination); setLastDestination(destination);
                
                fetchNewsForDestination(destination);
                fetchAboutLocation(destination);

                if (user.email !== 'prasantshukla89@gmail.com') {
                   await incrementPlanGenerationCount(user.email);
                }
                const tripData: Omit<Trip, 'id' | 'createdAt'> = { // Use Omit for data before ID/createdAt assigned
                    email: user.email, name: userDetailsFromDb?.name || user.displayName || 'User',
                    startLocation, destination, days, budget, peopleCount, tripForFamily,
                    familyElderlyCount: tripForFamily ? familyElderlyCount : '',
                    familyLadiesCount: tripForFamily ? familyLadiesCount : '',
                    familyChildrenCount: tripForFamily ? familyChildrenCount : '',
                    familyPreferences: tripForFamily ? familyPreferences : '',
                    generatedWithSubscription: currentSub,
                    selectedFeatures: selectedOptionalFeatures,
                    // planSummary and hasPlan will be added by saveTrip
                };
                const savedTripId = await saveTrip(tripData, extractedPlan);
                let successMsg = `Your ${planTierDescriptor} for ${destination} is ready!`;
                if(selectedOptionalFeatures.length > 0) successMsg += " Includes your customizations.";
                // if (!savedTripId) toast
                // Planner.tsx (Continuing from the previous snippet)

                if (!savedTripId) toast.error("Plan generated, but failed to save.");
                else toast.success(successMsg);

            } else if (!error) { // If no error was set by AI calls but plan is still insufficient
                setError('The AI could not generate a detailed plan with the provided information.');
                toast.warn('Could not generate a detailed plan. Try being more specific or adjusting the parameters.');
            }
        } catch (err: any) {
            console.error('Plan generation process error:', err);
            setError(err.message || 'An unexpected error occurred during plan generation.');
            toast.error('An unexpected error occurred. Please try again.');
            setPlan(''); // Ensure plan is cleared on error
        } finally {
            setLoading(false); // Ensure loading is always turned off
        }
    };

    const fetchAboutLocation = async (locationName: string): Promise<void> => {
        setError(null); setLocationBio(''); if (!locationName) return;
        const locationPrompt = `
        You are a travel assistant. Create a **comprehensive travel guide** for a traveler visiting ${locationName}. The guide should be informative, user-friendly, and clearly formatted using markdown. Cover the following points:
        ## 🗺️ 1. Overview & Historical Significance
        - Brief history, cultural, political, or spiritual importance.
        ## 🌍 2. Culture & Local Customs
        - Key traditions, language(s) spoken (5-10 useful phrases), etiquette tips.
        ## 📸 3. Top 5 Must-Visit Attractions
        - Popular landmarks & hidden gems, brief descriptions.
        ## 🍽️ 4. Must-Try Local Cuisine
        - 3–5 iconic dishes/drinks.
        ## 🎉 5. Unique Local Experiences
        - Festivals, workshops, markets, seasonal events.
        ## 🧭 6. Travel Tips & Practical Info
        - Best time to visit, local transport, safety, dress code.
        ## 💰 7. Currency & Cost Expectations
        - Local currency, general costs (meals, transport, accommodation).
        ## 🌤️ 8. Weather & Climate
        - Climate type, typical weather for current season.
        ## 🚨 9. Emergency Contacts
        - General emergency (police, ambulance, fire), tourist police, woman helpline, child helpline.
        ## 🏥 10. Hospitals & Clinics
        - 2–3 well-known hospitals/clinics.
        ## 📱 11. SIM Cards & Internet
        - Options for tourists (prepaid SIMs, eSIMs, providers).
        ## 🔗 12. Additional Resources
        - 3–5 reliable YouTube channels/websites/blogs for visual tours or tips.
        ## ✅ Format Notes: Use clear markdown. Be concise but informative.
        `;
        let bioText = ''; let primaryFailed = false;
        try {
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, { contents: [{ parts: [{ text: locationPrompt }] }] }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
            bioText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!bioText || bioText.trim().length < 100) primaryFailed = true;
        } catch (err) { primaryFailed = true; console.error("About Location (Primary) Error:", err); }

        if (primaryFailed) {
            toast.info("Fetching location details with backup AI...", { autoClose: 2000 });
            try {
                const fallbackResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${FALLBACK_GEMINI_API_KEY}`,{ contents: [{ parts: [{ text: locationPrompt }] }] }, { headers: { 'Content-Type': 'application/json' }, timeout: 45000 });
                bioText = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!bioText || bioText.trim().length < 100) setLocationBio('Could not retrieve detailed information about this location at the moment.');
            } catch (fallbackErr) { setLocationBio('Error retrieving location information.'); console.error("About Location (Fallback) Error:", fallbackErr); }
        }
        setLocationBio(bioText || 'No detailed information available for this location.');
    };

    const imageFetcher = async (query: string, isLoadMore = false): Promise<void> => {
        if (!query || (imageLoading && !isLoadMore)) return;
        setImageLoading(true); setError(null);
        const url = isLoadMore && nextPageUrl ? nextPageUrl : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
        try {
            const res = await axios.get(url, { headers: { 'Authorization': PEXELS_API_KEY }, timeout: 15000 });
            if (res.data?.photos) {
                setImages((prev) => isLoadMore ? [...prev, ...res.data.photos] : res.data.photos);
                setNextPageUrl(res.data.next_page || '');
                setTotalResults(res.data.total_results || 0);
                setHasMore(!!res.data.next_page);
                if (res.data.photos.length === 0 && !isLoadMore) console.log("No images found on Pexels for:", query);
            } else { if (!isLoadMore) setImages([]); setHasMore(false); }
        } catch (err) { toast.error('Could not load images.'); if (!isLoadMore) setImages([]); setHasMore(false); console.error("Pexels Image Error:", err); } 
        finally { setImageLoading(false); }
    };

    const fetchVideos = async (): Promise<void> => {
        if (!imageFetchDestination || imageLoading) return;
        setImageLoading(true); setError(null); setVideos([]);
        try {
            const res = await axios.get(`https://api.pexels.com/videos/search?query=${encodeURIComponent(imageFetchDestination)}&per_page=10`, { headers: { 'Authorization': PEXELS_API_KEY }, timeout: 20000 });
            setVideos(res.data?.videos || []);
            if ((res.data?.videos || []).length === 0) console.log("No videos found on Pexels for:", imageFetchDestination);
            setVideoPlaying(null); Object.values(videoRefs.current).forEach(ref => ref?.pause());
        } catch (err) { toast.error('Could not load videos.'); setVideos([]); console.error("Pexels Video Error:", err); } 
        finally { setImageLoading(false); }
    };
    
    const fetchNewsForDestination = async (locationName: string): Promise<void> => {
        if (!locationName) return;
        setLoadingNews(true); setError(null); setNews([]);
        try {
            const response = await axios.post('/api/news', { location: locationName });
            if (response.status === 200 && response.data?.articles) {
                setNews(response.data.articles);
                if (response.data.articles.length === 0) console.log(`No recent news found for ${locationName}.`);
            } else { toast.error(`Could not fetch news for ${locationName}.`); console.error("News API Response Error:", response.status, response.data); }
        } catch (error: any) { toast.error(`Failed to fetch news for ${locationName}.`); console.error('Error calling /api/news:', error.response?.data || error.message); } 
        finally { setLoadingNews(false); }
    };

    const loadMore = useCallback(() => {
        if (activeSection === 'photos' && activeMediaType === 'photos' && !imageLoading && hasMore && nextPageUrl && imageFetchDestination) {
            imageFetcher(imageFetchDestination, true);
        }
    }, [activeSection, activeMediaType, imageLoading, hasMore, nextPageUrl, imageFetchDestination]);

    useEffect(() => {
        if (planGenerated && imageFetchDestination) {
            const destinationChanged = lastDestination !== imageFetchDestination;
            if (activeSection === 'photos') {
                if (activeMediaType === 'photos') {
                    if (images.length === 0 || destinationChanged) {
                        setImages([]); setNextPageUrl(''); setHasMore(true);
                        imageFetcher(imageFetchDestination);
                    }
                } else if (activeMediaType === 'videos') {
                    if (videos.length === 0 || destinationChanged) {
                        setVideos([]);
                        fetchVideos();
                    }
                }
            }
            if (destinationChanged) {
                 setLastDestination(imageFetchDestination);
            }
        }
    }, [activeSection, activeMediaType, planGenerated, imageFetchDestination, lastDestination, images.length, videos.length]);

    const handleVideoToggle = (videoId: number): void => {
        const currentlyPlaying = videoPlaying === videoId;
        const videoRef = videoRefs.current[videoId];
        if (videoPlaying !== null && videoPlaying !== videoId && videoRefs.current[videoPlaying]) {
            videoRefs.current[videoPlaying]?.pause();
        }
        if (videoRef) {
            if (currentlyPlaying) { videoRef.pause(); setVideoPlaying(null); }
            else { videoRef.play().catch(err => console.error("Video play failed:", err)); setVideoPlaying(videoId); }
        }
    };

    const switchMediaType = (type: 'photos' | 'videos'): void => {
        if (activeMediaType === type) return;
        setActiveMediaType(type); setVideoPlaying(null);
    };

    const pageTransition = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
    };

    const handleSubscribe = (): void => { router.push('/Subscription'); };
    const handleClose = (): void => { setShowModal(false); };

    // Planner.tsx (Continuing from the previous snippet)
    const handleFeatureToggle = (featureKey: string): void => {
      setSelectedOptionalFeatures((prev) =>
          prev.includes(featureKey)
              ? prev.filter((k) => k !== featureKey)
              : [...prev, featureKey]
      );
  };
  
  const resetPlanForm = (): void => {
      setPlan(''); setPlanGenerated(false); setDestination(''); setStartLocation('');
      setDays(''); setBudget(''); setPeopleCount(''); setTripForFamily(false);
      setFamilyChildrenCount(''); setFamilyElderlyCount(''); setFamilyLadiesCount('');
      setFamilyPreferences(''); setImages([]); setVideos([]); setNews([]);
      setLocationBio(''); setActiveSection('plan'); setError(null);
      setCurrentTripId(''); setFeedbackSubmitted(false);
      setSelectedOptionalFeatures([]); 
      setShowFeatureSelector(false); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
      <AuthGuard>
          <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
          <Navbar />
          <div className="bg-gray-50 text-gray-900 dark:text-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
              <div className="pt-24 pb-16">
                  <motion.div className="container mx-auto px-4 sm:px-6 lg:px-8" initial="hidden" animate="visible" exit="exit" variants={pageTransition}>
                      {!planGenerated && !loading && (
                          <div className="text-center mb-10">
                              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                                  Plan Your Perfect Journey
                                  {userSubscription && userSubscription !== "Free" && (
                                      <span className="block text-2xl text-blue-500 dark:text-blue-400 mt-2">
                                          ({userSubscription} Plan)
                                      </span>
                                  )}
                              </h1>
                              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                  Fill in your details and select optional features to personalize your AI-generated travel plan.
                              </p>
                          </div>
                      )}

                      <div className={`flex flex-wrap gap-6 transition-all duration-700 ease-in-out`}>
                          <AnimatePresence mode="wait">
                              {!planGenerated && !loading && (
                                  <motion.div key="input-form-container" className="w-full lg:w-2/3 mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6"><h2 className="text-2xl font-bold text-white">Travel Details</h2><p className="text-blue-100 mt-1">Your adventure starts here</p></div>
                                          <div className="p-6 md:p-8">
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
  loading={loading}
  imageLoading={imageLoading}
  ladiesCount={''}
  setLadiesCount={() => {}}
  elderlyCount={''}
  setElderlyCount={() => {}}
  childrenCount={''}
  setChildrenCount={() => {}}
  planFetcher={planFetcher} // ✅ Add this line
/>


                                              {/* Feature Selector Section */}
                                              <div className="mt-8">
                                                  <button
                                                      onClick={() => setShowFeatureSelector(!showFeatureSelector)}
                                                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 font-medium transition-colors"
                                                  >
                                                      <span>{showFeatureSelector ? 'Hide' : 'Show'} Optional Plan Features ({selectedOptionalFeatures.length} selected)</span>
                                                      {showFeatureSelector ? <FaChevronUp /> : <FaChevronDown />}
                                                  </button>

                                                  <AnimatePresence>
                                                      {showFeatureSelector && (
                                                          <motion.div
                                                              initial={{ opacity: 0, height: 0 }}
                                                              animate={{ opacity: 1, height: 'auto' }}
                                                              exit={{ opacity: 0, height: 0 }}
                                                              transition={{ duration: 0.3, ease: "easeInOut" }}
                                                              className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-md space-y-3 overflow-hidden"
                                                          >
                                                              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                                  Available for your '{userSubscription || 'Free'}' plan:
                                                              </h4>
                                                              {ALL_PLAN_FEATURES.map((feature) => {
                                                                  const hasAccess = userHasAccessToFeature(userSubscription, feature.minPlan);
                                                                  const isSelected = selectedOptionalFeatures.includes(feature.key);
                                                                  const featureDescriptionText = typeof feature.description === 'function' ? feature.description(destination) : feature.description;

                                                                  return (
                                                                      <div
                                                                          key={feature.key}
                                                                          className={`p-3 border rounded-md transition-all hover:shadow-sm
                                                                              ${hasAccess ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' 
                                                                                         : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 opacity-60 cursor-not-allowed'}`}
                                                                          title={!hasAccess ? `Requires ${feature.minPlan} plan or higher` : featureDescriptionText}
                                                                      >
                                                                          <label className={`flex items-center ${hasAccess ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                                              <input
                                                                                  type="checkbox"
                                                                                  className="h-5 w-5 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:ring-offset-gray-800 dark:bg-gray-700 disabled:opacity-50"
                                                                                  checked={isSelected}
                                                                                  disabled={!hasAccess}
                                                                                  onChange={() => hasAccess && handleFeatureToggle(feature.key)}
                                                                              />
                                                                              <span className={`ml-3 text-sm font-medium ${hasAccess ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                                  {feature.label}
                                                                              </span>
                                                                          </label>
                                                                          {featureDescriptionText && (
                                                                              <p className={`mt-1 text-xs ${hasAccess ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                                  {featureDescriptionText}
                                                                              </p>
                                                                          )}
                                                                          {!hasAccess && (
                                                                              <p className="mt-1 text-xs text-orange-500 dark:text-orange-400">
                                                                                  (Requires {feature.minPlan} plan. <button onClick={() => router.push('/Subscription')} className="underline hover:text-orange-400 dark:hover:text-orange-300">Upgrade</button>)
                                                                              </p>
                                                                          )}
                                                                      </div>
                                                                  );
                                                              })}
                                                          </motion.div>
                                                      )}
                                                  </AnimatePresence>
                                              </div>

                                              {/* Generate Plan Button */}
                                              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                                  <button
                                                      onClick={planFetcher}
                                                      disabled={loading || !destination || !days || !budget || !startLocation || !peopleCount } // Added more comprehensive basic validation
                                                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                                                  >
                                                      {loading ? (
                                                          <>
                                                              <FaSpinner className="animate-spin mr-2" /> Generating Plan...
                                                          </>
                                                      ) : (
                                                          'Generate My Travel Plan'
                                                      )}
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>

                          {/* Loading State Indicator */}
                          <AnimatePresence>{loading && (<motion.div key="loading-indicator" className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-75 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><motion.div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-11/12 mx-4 shadow-2xl text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}><div className="flex justify-center mb-5"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><FaSpinner className="text-5xl text-blue-600 dark:text-blue-400" /></motion.div></div><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Crafting Your Adventure...</h3><p className="text-gray-600 dark:text-gray-300 px-4">{destination ? `Designing your plan for ${destination}.` : 'Getting ready.'}</p></motion.div></motion.div>)}</AnimatePresence>
                          
                          {/* Plan Generation Success Animation */}
                          <AnimatePresence>{planGenerationSuccess && !loading && (<motion.div key="success-animation" className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onAnimationComplete={() => { setTimeout(() => { setPlanGenerationSuccess(false); }, 1200); }}><motion.div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-2xl flex items-center justify-center aspect-square" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 250, damping: 15, delay: 0.1 } }} exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.4 } }}><FaCheckCircle className="text-7xl text-green-500" /></motion.div></motion.div>)}</AnimatePresence>

                          {/* Results Section */}
                          {planGenerated && !loading && plan && (
                              <motion.div key="results-section-container" className="w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                                   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6">
                                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                              <div>
                                                  <h2 className="text-2xl font-bold text-white">
                                                      Your {days || 'Custom'} Day Trip to {destination || 'Selected Destination'}
                                                      <span className="text-lg block text-blue-200">({userSubscription || 'Free'} Plan {selectedOptionalFeatures.length > 0 ? 'with Customizations' : ''})</span>
                                                  </h2>
                                                  <p className="text-blue-100 mt-1 text-sm">
                                                      {startLocation && `From ${startLocation}`} {budget && `• Budget: ${budget}`} {peopleCount && `• ${peopleCount} Traveler(s)`}
                                                  </p>
                                              </div>
                                              <button onClick={resetPlanForm} className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium shrink-0">
                                                  Create New Plan
                                              </button>
                                          </div>
                                      </div>
                                      <ResultsSection
                                          loading={loading} error={error} plan={plan}
                                          activeSection={activeSection} setActiveSection={setActiveSection}
                                          location={imageFetchDestination} 
                                          planGenerated={planGenerated}
                                          news={news} loadingNews={loadingNews}
                                          locationBio={locationBio} images={images}
                                          imageLoading={imageLoading} hasMore={hasMore} loadMore={loadMore}
                                          destination={imageFetchDestination} 
                                          videos={videos}
                                          activeMediaType={activeMediaType} switchMediaType={switchMediaType}
                                          videoRefs={videoRefs} videoPlaying={videoPlaying} handleVideoToggle={handleVideoToggle}
                                          feedbackSubmitted={feedbackSubmitted} submitFeedback={submitFeedback} 
                                          currentTripId={currentTripId}
                                          locationImage={''} 
                                          fetchNewsForDestination={fetchNewsForDestination}
                                          previousValue={''} 
                                          fetchVideos={fetchVideos} 
                                      />
                                  </div>
                              </motion.div>
                          )}
                      </div>
                  </motion.div>
              </div>
          </div>

          {/* Subscription Modal */}
          <AnimatePresence>{showModal && (<motion.div key="subscription-modal" className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-11/12 mx-4" initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }} exit={{ scale: 0.9, opacity: 0, y: 20, transition: { duration: 0.2 } }}><div className="bg-gradient-to-r from-orange-500 to-red-600 p-5 text-white"><div className="flex items-center gap-3"><FaLock className="text-2xl" /><h2 className="text-xl font-semibold">Unlock Full Access</h2></div></div><div className="p-6"><p className="text-gray-700 dark:text-gray-300 mb-5 text-base">You've used your plan generations for the '{userSubscription || 'Free'}' tier. Subscribe or upgrade for more generations and enhanced features!</p><div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg mb-6 border border-blue-200 dark:border-gray-600"><h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-center text-lg">Premium Benefits Include:</h3><ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2"><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Unlimited AI Itineraries</span></li><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Advanced Customization</span></li><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Priority Support</span></li><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Exclusive Travel Tips</span></li><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Save & Manage Trips</span></li><li className="flex items-center gap-2"><FaCheckCircle className="text-green-500 flex-shrink-0" /><span>Offline Plan Access</span></li></ul></div><div className="flex flex-col sm:flex-row justify-end gap-3 pt-2"><button onClick={handleClose} className={`w-full sm:w-auto px-5 py-2.5 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg transition text-sm font-medium ${modalAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-500'}`} disabled={modalAnimating}>Maybe Later</button><button onClick={handleSubscribe} className={`w-full sm:w-auto px-6 py-2.5 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md transition text-sm ${modalAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'}`} disabled={modalAnimating}>Subscribe Now</button></div></div></motion.div></motion.div>)}</AnimatePresence>
      </AuthGuard>
  );
};

export default Index;

// "use client"
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import Navbar from '@/pages/Component/Navbar';
// import axios from 'axios';
// import { auth } from '@/FirebaseCofig';
// import InputForm from './InputForm';
// import ResultsSection from './ResultsSection';
// import { Image, NewsItem, Video } from '@/types/types';
// // import { motion, AnimatePresence } from 'framer-motion'; // AnimatePresence not used in current JSX
// import AuthGuard from '../AuthGuard/AuthGuard';
// import { collection, getFirestore, setDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
// import { doc, getDoc } from 'firebase/firestore';
// // import router from 'next/router'; // Not used
// import { FaSpinner, FaLock, FaCheckCircle, FaCrown, FaStar, FaRocket, FaLeaf } from 'react-icons/fa';
// // --- Toastify Imports ---
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css'; // Import CSS
// import Link from 'next/link';
// import { FiX } from 'react-icons/fi';

// // 1. Define base plan configuration (without 'available' property)
// const planBaseConfig = {
//   standard: {
//     name: "Standard Plan",
//     description: "A comprehensive travel itinerary with daily activities and recommendations.",
//     icon: <FaLeaf className="text-green-500 text-xl" />,
//   },
//   premium: {
//     name: "Premium Plan",
//     description: "Enhanced itinerary with local insights, hidden gems, and optimized routes.",
//     icon: <FaCrown className="text-blue-500 text-xl" />,
//   },
//   cultural: {
//     name: "Cultural Immersion",
//     description: "Focus on authentic cultural experiences, traditions, and local interactions.",
//     icon: <FaStar className="text-purple-500 text-xl" />,
//   },
//   luxury: {
//     name: "Luxury Experience",
//     description: "High-end accommodations, exclusive activities, and VIP recommendations.",
//     icon: <FaRocket className="text-pink-500 text-xl" />,
//   }
// };
// type PlanKey = keyof typeof planBaseConfig;
// // Define a type for plan details that includes the 'available' flag
// type PlanDetailWithAvailability = typeof planBaseConfig[PlanKey] & { available: boolean };
// type CurrentPlanDetailsState = { [key in PlanKey]: PlanDetailWithAvailability };


// const Index = () => {
//   const [user, setUser] = useState<any>(null);
//   const [startLocation, setStartLocation] = useState('');
//   const [destination, setDestination] = useState('');
//   const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
//   const [days, setDays] = useState('');
//   const [budget, setBudget] = useState('');
//   const [peopleCount, setPeopleCount] = useState('');
//   const [ladiesCount, setLadiesCount] = useState('');
//   const [elderlyCount, setElderlyCount] = useState('');
//   const [childrenCount, setChildrenCount] = useState('');
//   const [images, setImages] = useState<Image[]>([]);
//   // const [imagePower, setImagePower] = useState(false); // Not used
//   const [loadingNews, setLoadingNews] = useState(false);
//   const [news, setNews] = useState<NewsItem[]>([]);
//   const [locationImage, setLocationImage] = useState('');
//   const [locationBio, setLocationBio] = useState('');
//   const [plan, setPlan] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [nextPageUrl, setNextPageUrl] = useState('');
//   // const [totalResults, setTotalResults] = useState(0); // Not used
//   const [activeMediaType, setActiveMediaType] = useState<'photos' | 'videos'>('photos');
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [videoPlaying, setVideoPlaying] = useState<number | null>(null);
//   const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
//   const [currentValue, setCurrentValue] = useState('');
//   const [previousValue, setPreviousValue] = useState('');
//   const [imageFetchDestination, setImageFetchDestination] = useState('');
//   const [location, setLocation] = useState('');
//   const [activeSection, setActiveSection] = useState<'plan' | 'about' | 'photos' | 'news'>('plan');
//   const [planGenerated, setPlanGenerated] = useState(false);
//   const [lastDestination, setLastDestination] = useState('');
//   const [tripForFamily, setTripForFamily] = useState(false);
//   const [familyElderlyCount, setFamilyElderlyCount] = useState('');
//   const [familyLadiesCount, setFamilyLadiesCount] = useState('');
//   const [familyChildrenCount, setFamilyChildrenCount] = useState('');
//   const [familyPreferences, setFamilyPreferences] = useState('');
//   // const [showModal, setShowModal] = useState(false); // Not used
//   // const [modalAnimating, setModalAnimating] = useState(false); // Not used
//   // const [planGenerationSuccess, setPlanGenerationSuccess] = useState(false); // Not used in JSX
//   const [currentTripId, setCurrentTripId] = useState('');
//   const [userSubscription, setUserSubscription] = useState('free'); // Default to 'free'
//   const [selectedPlanType, setSelectedPlanType] = useState<PlanKey>('standard');
//   const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

//   // 2. State for current plan details including availability
//   const [currentPlanDetails, setCurrentPlanDetails] = useState<CurrentPlanDetailsState>(() => {
//     const initialDetails: Partial<CurrentPlanDetailsState> = {};
//     (Object.keys(planBaseConfig) as PlanKey[]).forEach(key => {
//         initialDetails[key] = {
//             ...planBaseConfig[key],
//             available: key === 'standard' // Initially, only standard is available for 'free' tier
//         };
//     });
//     return initialDetails as CurrentPlanDetailsState;
//   });


//   // IMPORTANT: Store API keys securely, preferably in environment variables
//   const GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU'; // Your primary key
//   const FALLBACK_GEMINI_API_KEY = 'AIzaSyCIMumNTzri1bstzISZ21oEjgg9qYqiY9k'; // Your fallback key
//   const PEXELS_API_KEY = '2wBg5SOXdnIFQApqDr5zTPq8MjvJGCcmXtIa3orVKwYe94fRNfZzuSwW'; // Your Pexels key

//   const db = getFirestore();

//   // --- Firestore Functions (remain mostly the same) ---
//   const fetchUserDetailsFromFirestore = async (userEmail: string) => {
//     const userDocRef = doc(db, 'users', userEmail);
//     const docSnapshot = await getDoc(userDocRef);

//     if (docSnapshot.exists()) {
//       return docSnapshot.data();
//     } else {
//       console.warn("No user data found in Firestore for:", userEmail);
//       return null;
//     }
//   };

//   const incrementPlanGenerationCount = async (userEmail: string) => {
//     const userDocRef = doc(db, 'users', userEmail);
//     try {
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists()) {
//         const currentCount = userDoc.data()?.planGenerationCount || 0;
//         await updateDoc(userDocRef, { planGenerationCount: currentCount + 1 });
//       } else {
//          await setDoc(userDocRef, { planGenerationCount: 1 }, { merge: true });
//       }
//     } catch (error) {
//       console.error('Error updating plan generation count:', error);
//     }
//   };

//   const saveTrip = async (tripData: any, fullPlan: string) => {
//     if (!user || !user.email) {
//       console.error('User not authenticated for saving trip');
//       return null;
//     }
//     try {
//       const tripId = new Date().getTime().toString();
//       const tripToSave = {
//         id: tripId, ...tripData, planType: selectedPlanType,
//         planSummary: fullPlan.substring(0, 200) + '...',
//         hasPlan: true, feedbackSubmitted: false, createdAt: new Date().toISOString()
//       };
//       const userDocRef = doc(db, 'users', user.email);
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists()) {
//         await updateDoc(userDocRef, { trips: arrayUnion(tripToSave) });
//       } else {
//         await setDoc(userDocRef, { trips: [tripToSave] });
//       }
//       const planDocRef = doc(db, 'plans', tripId);
//       await setDoc(planDocRef, {
//         userId: user.email, tripId, planType: selectedPlanType,
//         fullPlan, createdAt: new Date().toISOString()
//       });
//       setCurrentTripId(tripId);
//       return tripId;
//     } catch (error) {
//       console.error('Error saving trip:', error);
//       return null;
//     }
//   };

//   // ... (other Firestore functions: fetchFullPlan, getUserTrips, etc. - unchanged)
//   const fetchFullPlan = async (tripId: string) => {
//     if (!tripId) {
//       console.error('No trip ID provided');
//       return null;
//     }

//     try {
//       const planDocRef = doc(db, 'plans', tripId);
//       const planDoc = await getDoc(planDocRef);

//       if (planDoc.exists()) {
//         return planDoc.data().fullPlan;
//       } else {
//         console.warn('No plan document found for this trip');
//         return null;
//       }
//     } catch (error) {
//       console.error('Error fetching full plan:', error);
//       return null;
//     }
//   };

//   const getUserTrips = async () => {
//     if (!user || !user.email) {
//       console.error('User not authenticated');
//       return [];
//     }

//     try {
//       const userDocRef = doc(db, 'users', user.email);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists() && userDoc.data().trips) {
//         const tripsArray = Array.isArray(userDoc.data().trips) ? userDoc.data().trips : [];
//         return [...tripsArray].sort((a: any, b: any) =>
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         );
//       }
//       return [];
//     } catch (error) {
//       console.error('Error fetching user trips:', error);
//       return [];
//     }
//   };

//   const getTripsByFeedbackStatus = async (hasFeedback: boolean) => {
//     try {
//       const allTrips = await getUserTrips();
//       return allTrips.filter((trip: any) => !!trip.feedbackSubmitted === hasFeedback);
//     } catch (error) {
//       console.error('Error filtering trips by feedback status:', error);
//       return [];
//     }
//   };

//   const updateTripFeedback = async (tripId: string, feedbackData: any) => {
//     if (!user || !user.email || !tripId) {
//       console.error('Missing user or trip ID');
//       return false;
//     }
//     try {
//       const userDocRef = doc(db, 'users', user.email);
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists() && userDoc.data().trips) {
//         const trips = userDoc.data().trips;
//         const updatedTrips = trips.map((trip: any) => {
//           if (trip.id === tripId) {
//             return { ...trip, feedbackSubmitted: true, feedbackData };
//           }
//           return trip;
//         });
//         await updateDoc(userDocRef, { trips: updatedTrips });
//         const feedbackDocRef = doc(db, 'feedback', tripId);
//         await setDoc(feedbackDocRef, {
//           userId: user.email, tripId, ...feedbackData, createdAt: new Date().toISOString()
//         });
//         setFeedbackSubmitted(true);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error updating feedback:', error);
//       return false;
//     }
//   };

//   const deleteTrip = async (tripId: string) => {
//     if (!user || !user.email) return false;
//     try {
//       const userDocRef = doc(db, 'users', user.email);
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists() && userDoc.data().trips) {
//         const updatedTrips = userDoc.data().trips.filter((trip: any) => trip.id !== tripId);
//         await updateDoc(userDocRef, { trips: updatedTrips });
//         try {
//           await deleteDoc(doc(db, 'plans', tripId));
//         } catch (err) { console.warn('Could not delete plan document:', err); }
//         try {
//           await deleteDoc(doc(db, 'feedback', tripId));
//         } catch (err) { console.warn('Could not delete feedback document:', err); }
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error deleting trip:', error);
//       return false;
//     }
//   };

//   const submitFeedback = async (feedbackData: any) => {
//     if (!currentTripId) {
//       toast.error("Cannot submit feedback: No trip is currently selected.");
//       return false;
//     }
//     const result = await updateTripFeedback(currentTripId, feedbackData);
//     if (result) toast.success("Feedback submitted successfully!");
//     else toast.error("Failed to submit feedback. Please try again.");
//     return result;
//   };

//   const loadPreviousTrip = async (tripId: string) => {
//     setLoading(true); setError(null); setPlan('');
//     try {
//       const trips = await getUserTrips();
//       const selectedTrip = trips.find((trip: any) => trip.id === tripId);
//       if (!selectedTrip) {
//         setError('Selected trip could not be found.');
//         toast.error('Selected trip could not be found.'); setLoading(false); return;
//       }
//       const fullPlan = await fetchFullPlan(tripId);
//       setPlan(fullPlan || 'Plan details not available. You might need to regenerate this plan.');
//       if (!fullPlan) toast.warn('Plan details not available for this trip.');

//       setStartLocation(selectedTrip.startLocation || '');
//       setDestination(selectedTrip.destination || '');
//       setDays(selectedTrip.days || '');
//       setBudget(selectedTrip.budget || '');
//       setPeopleCount(selectedTrip.peopleCount || '');
//       setTripForFamily(selectedTrip.tripForFamily || false);
//       setFamilyElderlyCount(selectedTrip.familyElderlyCount || '');
//       setFamilyLadiesCount(selectedTrip.familyLadiesCount || '');
//       setFamilyChildrenCount(selectedTrip.familyChildrenCount || '');
//       setFamilyPreferences(selectedTrip.familyPreferences || '');
//       setCurrentTripId(selectedTrip.id);
//       setFeedbackSubmitted(selectedTrip.feedbackSubmitted || false);
//       setPlanGenerated(true);
//       if (selectedTrip.planType) setSelectedPlanType(selectedTrip.planType as PlanKey);
      
//       const currentDest = selectedTrip.destination || '';
//       setImageFetchDestination(currentDest); setActiveSection('plan');
//       setPreviousValue(currentDest); setCurrentValue(currentDest); setLocation(currentDest);
//       if (currentDest) {
//         fetchAboutLocation(currentDest); fetchNewsForDestination(currentDest);
//         setImages([]); setVideos([]); setNextPageUrl(''); setHasMore(true);
//       }
//     } catch (err) {
//       console.error('Error loading trip:', err);
//       setError('Failed to load trip details.'); toast.error('Failed to load trip details.');
//     } finally {
//       setLoading(false);
//     }
//   };


//   // --- Plan Generation and API Calls (mostly the same) ---
//   const planFetcher = async () => {
//     if (!destination) { toast.error("Please enter a destination"); return; }
//     if (!days) { toast.error("Please enter the number of days"); return; }

//     // Check if user has access to the selected plan type using the new state
//     if (!currentPlanDetails[selectedPlanType]?.available) {
//       setShowSubscriptionModal(true);
//       return;
//     }

//     setLoading(true); setError(null); setPlan('');
//     setPlanGenerated(false); setActiveSection('plan');

//     try {
//       if (user && user.email) await incrementPlanGenerationCount(user.email);
//       let travelPlanPrompt = generatePromptForPlanType(selectedPlanType);
//       const response = await axios.post(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
//         { contents: [{ parts: [{ text: travelPlanPrompt }] }] },
//         { headers: { 'Content-Type': 'application/json' } }
//       );
//       const generatedPlan = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No plan generated.';
//       setPlan(generatedPlan); setPlanGenerated(true); // setPlanGenerationSuccess(true);

//       const tripData = {
//         startLocation, destination, days, budget, peopleCount, tripForFamily,
//         familyElderlyCount: tripForFamily ? familyElderlyCount : '',
//         familyLadiesCount: tripForFamily ? familyLadiesCount : '',
//         familyChildrenCount: tripForFamily ? familyChildrenCount : '',
//         familyPreferences: tripForFamily ? familyPreferences : '',
//         planType: selectedPlanType
//       };
//       await saveTrip(tripData, generatedPlan);
//       setImageFetchDestination(destination); setLocation(destination);
//       fetchAboutLocation(destination); setLastDestination(destination);
//       setImages([]); setVideos([]); setNextPageUrl(''); setHasMore(true);
//       toast.success("Your travel plan has been generated!");
//     } catch (error: any) {
//       console.error("Error generating plan:", error);
//       setError("Failed to generate plan. Please try again.");
//       // setPlanGenerationSuccess(false);
//       toast.error("Failed to generate plan. Please try again.");
//       if (error.response && (error.response.status === 429 || error.response.status === 403)) {
//         toast.info("Trying alternative service...");
//         try {
//           let travelPlanPrompt = generatePromptForPlanType(selectedPlanType);
//           const fallbackResponse = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${FALLBACK_GEMINI_API_KEY}`,
//             { contents: [{ parts: [{ text: travelPlanPrompt }] }] },
//             { headers: { 'Content-Type': 'application/json' } }
//           );
//           const generatedPlan = fallbackResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No plan generated.';
//           setPlan(generatedPlan); setPlanGenerated(true); setError(null); // setPlanGenerationSuccess(true);
//           const tripData = { /* ... same tripData ... */
//             startLocation, destination, days, budget, peopleCount, tripForFamily,
//             familyElderlyCount: tripForFamily ? familyElderlyCount : '',
//             familyLadiesCount: tripForFamily ? familyLadiesCount : '',
//             familyChildrenCount: tripForFamily ? familyChildrenCount : '',
//             familyPreferences: tripForFamily ? familyPreferences : '',
//             planType: selectedPlanType
//           };
//           await saveTrip(tripData, generatedPlan);
//           setImageFetchDestination(destination); setLocation(destination);
//           fetchAboutLocation(destination); setLastDestination(destination);
//           toast.success("Your travel plan has been generated!");
//         } catch (fallbackError) {
//           console.error("Fallback also failed:", fallbackError);
//           setError("All services are currently busy. Please try again later.");
//           toast.error("All services are currently busy. Please try again later.");
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePromptForPlanType = (planType: PlanKey) => { // Use PlanKey type
//     const basePrompt = `Create a detailed ${days}-day travel itinerary for a trip to ${destination}${startLocation ? ` from ${startLocation}` : ''}.${budget ? ` The budget is ${budget}.` : ''}${peopleCount ? ` There will be ${peopleCount} people traveling.` : ''}`;
//     let additionalDetails = '';
//     if (tripForFamily) {
//       additionalDetails += ` This is a family trip with${familyElderlyCount ? ` ${familyElderlyCount} elderly,` : ''}${familyLadiesCount ? ` ${familyLadiesCount} women,` : ''}${familyChildrenCount ? ` ${familyChildrenCount} children,` : ''} and the family preferences are: ${familyPreferences || 'general family activities'}.`;
//     }
//     let planSpecificPrompt = '';
//     switch (planType) {
//       case 'premium': planSpecificPrompt = ` Include local insights, hidden gems, and optimized routes...`; break;
//       case 'cultural': planSpecificPrompt = ` Focus on authentic cultural experiences...`; break;
//       case 'luxury': planSpecificPrompt = ` Focus on high-end experiences...`; break;
//       default: planSpecificPrompt = ` Include popular attractions...`;
//     }
//     return `${basePrompt}${additionalDetails}${planSpecificPrompt} Format the itinerary with clear day-by-day headings, and include practical tips. Use markdown.`;
//   };

//   const fetchAboutLocation = async (destination: string) => {
//     // ... (implementation unchanged)
//     try {
//       let aboutPrompt = `Tell me about ${destination} as a travel destination...`;
//       const response = await axios.post( /* ... GEMINI_API_KEY ... */
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
//         { contents: [{ parts: [{ text: aboutPrompt }] }] }, { headers: { 'Content-Type': 'application/json' } }
//       );
//       setLocationBio(response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No information available.');
//     } catch (error) {
//       console.error("Error fetching location information:", error);
//       setLocationBio("Sorry, we couldn't fetch information about this destination.");
//       try { // Fallback
//         let aboutPrompt = `Tell me about ${destination} as a travel destination...`;
//         const fallbackResponse = await axios.post( /* ... FALLBACK_GEMINI_API_KEY ... */
//           `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${FALLBACK_GEMINI_API_KEY}`,
//           { contents: [{ parts: [{ text: aboutPrompt }] }] }, { headers: { 'Content-Type': 'application/json' } }
//         );
//         setLocationBio(fallbackResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No information available.');
//       } catch (fallbackError) { console.error("Fallback also failed for location info:", fallbackError); }
//     }
//   };
//   const fetchNewsForDestination = async (destination: string) => {
//     // ... (implementation unchanged)
//     setLoadingNews(true);
//     try {
//       let newsPrompt = `Generate 5 recent news articles about ${destination} as a travel destination... Format as JSON array.`;
//       const response = await axios.post( /* ... GEMINI_API_KEY ... */
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
//         { contents: [{ parts: [{ text: newsPrompt }] }] }, { headers: { 'Content-Type': 'application/json' } }
//       );
//       const newsText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
//       const jsonMatch = newsText.match(/```json\n([\s\S]*?)\n```/) || newsText.match(/```\n([\s\S]*?)\n```/);
//       const jsonStr = jsonMatch ? jsonMatch[1] : newsText;
//       try { setNews(JSON.parse(jsonStr)); }
//       catch (parseError) { console.error("Error parsing news JSON:", parseError); setNews([]); }
//     } catch (error) { console.error("Error fetching news:", error); setNews([]);
//     } finally { setLoadingNews(false); }
//   };

//   const imageFetcher = async (query: string) => {
//     // ... (implementation unchanged)
//     if (!query) return; setImageLoading(true);
//     try {
//       const url = nextPageUrl || `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
//       const response = await axios.get(url, { headers: { Authorization: PEXELS_API_KEY } });
//       setImages(prev => [...prev, ...response.data.photos]);
//       setNextPageUrl(response.data.next_page);
//       setHasMore(!!response.data.next_page);
//       // setTotalResults(response.data.total_results);
//     } catch (error) { console.error("Error fetching images:", error); toast.error("Failed to load images.");
//     } finally { setImageLoading(false); }
//   };
//   const fetchVideos = async () => {
//     // ... (implementation unchanged, ensure Video type matches)
//     setImageLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1500));
//       const fakeVideos: Video[] = Array.from({ length: 6 }, (_, i) => ({
//         id: Date.now() + i, width: 1920, height: 1080, url: `https://example.com/video/${i}`,
//         image: `https://picsum.photos/seed/${Date.now() + i}/800/450`,
//         duration: Math.floor(Math.random() * 120) + 30,
//         user: { id: i, name: `Creator ${i + 1}`, url: 'https://example.com/creator' },
//         video_files: [{
//             id: i * 10, quality: 'hd', file_type: 'video/mp4', width: 1280, height: 720,
//             link: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f62a23f12c45a31d8f189fd15b65fb8254&profile_id=139&oauth2_token_id=57447761'
//         }]
//       }));
//       setVideos(prev => [...prev, ...fakeVideos]);
//     } catch (error) { console.error("Error fetching videos:", error); toast.error("Failed to load videos.");
//     } finally { setImageLoading(false); }
//   };

//   const loadMore = () => { if (nextPageUrl && !imageLoading) imageFetcher(imageFetchDestination); };
//   const switchMediaType = (type: 'photos' | 'videos') => {
//     setActiveMediaType(type);
//     if (type === 'videos' && videos.length === 0) fetchVideos();
//     else if (type === 'photos' && images.length === 0) imageFetcher(imageFetchDestination);
//   };
//   const handleVideoToggle = (videoId: number) => { /* ... (implementation unchanged) ... */
//     if (videoPlaying === videoId) {
//       videoRefs.current[videoId]?.pause(); setVideoPlaying(null);
//     } else {
//       if (videoPlaying !== null && videoRefs.current[videoPlaying]) videoRefs.current[videoPlaying]?.pause();
//       videoRefs.current[videoId]?.play(); setVideoPlaying(videoId);
//     }
//   };

//   // 3. useEffect to update plan availability based on userSubscription
//   useEffect(() => {
//     console.log("Subscription changed to:", userSubscription.toLowerCase());
//     let planKeysAllowedBySubscription: PlanKey[];

//     switch (userSubscription.toLowerCase()) {
//       case 'free':
//         planKeysAllowedBySubscription = ['standard'];
//         break;
//       case 'pro':
//         planKeysAllowedBySubscription = ['standard', 'premium'];
//         break;
//       case 'pro alpha':
//         planKeysAllowedBySubscription = ['standard', 'premium', 'cultural'];
//         break;
//       case 'pro super':
//         planKeysAllowedBySubscription = ['standard', 'premium', 'cultural', 'luxury'];
//         break;
//       default:
//         planKeysAllowedBySubscription = ['standard']; // Fallback to free tier
//     }

//     setCurrentPlanDetails(prevDetails => {
//         const newDetails: Partial<CurrentPlanDetailsState> = {};
//         (Object.keys(planBaseConfig) as PlanKey[]).forEach(key => {
//             newDetails[key] = {
//                 ...planBaseConfig[key], // Get base properties (name, icon, description)
//                 available: planKeysAllowedBySubscription.includes(key) // Set availability
//             };
//         });
//         console.log("Updated currentPlanDetails:", newDetails);
//         return newDetails as CurrentPlanDetailsState;
//     });

//     // If the currently selected plan is no longer available with the new subscription,
//     // default to 'standard' or the first available one.
//     if (!planKeysAllowedBySubscription.includes(selectedPlanType)) {
//         setSelectedPlanType(planKeysAllowedBySubscription[0] || 'standard');
//     }

//   }, [userSubscription]); // Dependency: userSubscription


//   // Fetch user data and subscription on mount
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         setUser(firebaseUser);
//         if (firebaseUser.email) {
//           try {
//             const userData = await fetchUserDetailsFromFirestore(firebaseUser.email);
//             if (userData && userData.subscriptions) {
//               setUserSubscription(userData.subscriptions.toLowerCase());
//             } else {
//               // If no subscription found, default to 'free'
//               // This will trigger the useEffect above to set correct plan availability
//               setUserSubscription('free');
//             }
//           } catch (error) {
//             console.error("Error fetching user subscription:", error);
//             setUserSubscription('free'); // Fallback on error
//           }
//         } else {
//             setUserSubscription('free'); // Fallback if no email
//         }
//       } else {
//         setUser(null);
//         setUserSubscription('free'); // Default for logged-out users
//       }
//     });
//     return () => unsubscribe();
//   }, []); // Empty dependency array: runs once on mount

//   // Fetch images when destination changes and photos tab is active
//   useEffect(() => {
//     if (imageFetchDestination && activeSection === 'photos' && images.length === 0) {
//       imageFetcher(imageFetchDestination);
//     }
//   }, [imageFetchDestination, activeSection, images.length]); // Added images.length to re-fetch if cleared


//   return (
//     <AuthGuard>
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//         <Navbar />
//         <div className="container mx-auto px-4 py-24">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Left Column - Input Form */}
//             <div className="lg:col-span-1">
//               <InputForm
//                 startLocation={startLocation} setStartLocation={setStartLocation}
//                 destination={destination} setDestination={setDestination}
//                 days={days} setDays={setDays}
//                 budget={budget} setBudget={setBudget}
//                 peopleCount={peopleCount} setPeopleCount={setPeopleCount}
//                 ladiesCount={ladiesCount} setLadiesCount={setLadiesCount}
//                 elderlyCount={elderlyCount} setElderlyCount={setElderlyCount}
//                 childrenCount={childrenCount} setChildrenCount={setChildrenCount}
//                 loading={loading}
//                 planFetcher={planFetcher}
//                 imageLoading={imageLoading}
//                 setTripForFamily={setTripForFamily}
//                 familyElderlyCount={familyElderlyCount} setFamilyElderlyCount={setFamilyElderlyCount}
//                 familyLadiesCount={familyLadiesCount} setFamilyLadiesCount={setFamilyLadiesCount}
//                 familyChildrenCount={familyChildrenCount} setFamilyChildrenCount={setFamilyChildrenCount}
//                 familyPreferences={familyPreferences} setFamilyPreferences={setFamilyPreferences}
//                 tripForFamily={tripForFamily}
//               />

//               {/* Plan Type Selection - Uses currentPlanDetails from state */}
//               {user && currentPlanDetails && ( // Ensure currentPlanDetails is populated
//                 <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
//                   <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Plan Type</h2>
//                   <p className="text-gray-600 dark:text-gray-300 mb-4">
//                     Choose the type of travel plan you want to generate:
//                   </p>
//                   <div className="space-y-3">
//                     {Object.entries(currentPlanDetails).map(([key, plan]) => (
//                       <div
//                         key={key}
//                         onClick={() => plan.available ? setSelectedPlanType(key as PlanKey) : setShowSubscriptionModal(true)}
//                         className={`
//                           p-4 rounded-lg border cursor-pointer transition-all duration-200
//                           ${selectedPlanType === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
//                           ${plan.available ? 'hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10' : 'opacity-60 cursor-not-allowed'}
//                         `}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center">
//                             <div className="mr-3">
//                               {plan.icon}
//                             </div>
//                             <div>
//                               <h3 className="font-medium text-gray-900 dark:text-white">{plan.name}</h3>
//                               <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
//                             </div>
//                           </div>
//                           {!plan.available && (
//                             <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center">
//                               <FaLock className="mr-1" />
//                               Upgrade
//                             </div>
//                           )}
//                           {selectedPlanType === key && (
//                             <div className="text-blue-500">
//                               <FaCheckCircle />
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//                     <div className="flex items-center justify-between">
//                       <p className="text-sm text-gray-600 dark:text-gray-400">
//                         Your subscription: <span className="font-medium">{userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}</span>
//                       </p>
//                       <Link href="/Subscription">
//                         <div className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
//                           Upgrade
//                         </div>
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Right Column - Results */}
//             <div className="lg:col-span-2">
//               <ResultsSection
//                 loading={loading} error={error} plan={plan}
//                 activeSection={activeSection} setActiveSection={setActiveSection}
//                 planGenerated={planGenerated}
//                 loadingNews={loadingNews} news={news}
//                 locationImage={locationImage} locationBio={locationBio} location={location}
//                 images={images} imageLoading={imageLoading} hasMore={hasMore} loadMore={loadMore}
//                 videoRefs={videoRefs} fetchNewsForDestination={fetchNewsForDestination} destination={destination}
//                 videos={videos} previousValue={previousValue} fetchVideos={fetchVideos}
//                 activeMediaType={activeMediaType} switchMediaType={switchMediaType}
//                 videoPlaying={videoPlaying} handleVideoToggle={handleVideoToggle}
//                 feedbackSubmitted={feedbackSubmitted} submitFeedback={submitFeedback} currentTripId={currentTripId}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Subscription Upgrade Modal */}
//         {showSubscriptionModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
//               <button onClick={() => setShowSubscriptionModal(false)}
//                 className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
//                 <FiX size={24} />
//               </button>
//               <div className="text-center mb-6">
//                 <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
//                   <FaCrown className="text-purple-600 dark:text-purple-500 text-3xl" />
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Premium Plan Required</h3>
//                 <p className="text-gray-600 dark:text-gray-300 mt-2">
//                   This plan type is only available with a higher subscription tier.
//                 </p>
//               </div>
//               <div className="space-y-4">
//                 <Link href="/Subscription" legacyBehavior>
//                   <a className="block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg text-center">
//                     Upgrade Your Subscription
//                   </a>
//                 </Link>
//                 <button onClick={() => {
//                     setSelectedPlanType('standard'); // Default to standard
//                     setShowSubscriptionModal(false);
//                  }}
//                   className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
//                   Continue with Standard Plan
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//         <ToastContainer position="bottom-right" />
//       </div>
//     </AuthGuard>
//   );
// };

// export default Index;


// in this code i have given two types of code one is comment out another one is normal

// normal code hsa several things like subscription features but it is not fetching news and weather and all

// kindle take reference from comment out code that how other things works while subscription is working fine

// and update their while dont touchthe commented code update the normal code