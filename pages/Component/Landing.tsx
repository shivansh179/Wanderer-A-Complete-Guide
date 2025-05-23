"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar'; // Assuming this path is correct
import { auth, onAuthStateChanged } from '@/FirebaseCofig'; // Assuming this path is correct
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { BiSearchAlt } from "react-icons/bi";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaUserFriends, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { RiCompassDiscoverLine } from "react-icons/ri";
import { MdOutlineExplore, MdTravelExplore } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import toast from 'react-hot-toast';
 
type Trip = {
  id: string;
  feedbackSubmitted: boolean;
  completed?: boolean; // Optional as it wasn't in all prior examples
  email: string;
  startLocation: string;
  destination: string;
  createdAt: Timestamp | string; // Allow both Timestamp and string for flexibility
  // Add other properties that exist in your trip documents
  feedbackContent?: string;
  feedbackRating?: number;
  feedbackDate?: string;
};

const Landing = () => {
  const [user, setUser] = useState<User | null>(null);
  // const [isNewUser, setIsNewUser] = useState(false); // Not used in current logic
  const [showReligionDialog, setShowReligionDialog] = useState(false);
  const [name, setName] = useState('');
  const [religion, setReligion] = useState('');
  const [favoritePlaces, setFavoritePlaces] = useState('');
  const [believerOfGod, setBelieverOfGod] = useState<boolean | undefined>(undefined); // Allow undefined initial state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  // const [completedTrips, setCompletedTrips] = useState<Trip[]>([]); // Not directly used
  const [feedback, setFeedback] = useState('');
  const [tripIdForFeedback, setTripIdForFeedback] = useState<string | null>(null);
  const [sourceTrip, setSourceTrip] = useState('');
  const [destinationTrip, setDestinationTrip] = useState('');
  const [showToast, setShowToast] = useState(true);
  const [toastClosing, setToastClosing] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  // const [searchQuery, setSearchQuery] = useState(''); // Removed from hero, keep if used elsewhere
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false); // Renamed from feedbackSubmitted for clarity
  const [rating, setRating] = useState<number>(0);

  // Popular destinations data
  const popularDestinations = [
    { 
      id: 1, 
      name: "Paris, France", 
      image: "/paris.jpg", // Ensure this path is correct in your public folder
      description: "Experience the romance of the Eiffel Tower and the charm of Parisian cafes.",
      rating: 4.8,
      price: "₹90,000", // Example in INR
      duration: "5 days"
    },
    { 
      id: 2, 
      name: "Kyoto, Japan", 
      image: "/tokyo.jpg", // Ensure this path is correct
      description: "Discover ancient temples, serene gardens, and the beauty of Japanese culture.",
      rating: 4.7,
      price: "₹1,35,000",
      duration: "7 days"
    },
    { 
      id: 3, 
      name: "Machu Picchu, Peru", 
      image: "/pachu.jpg", // Ensure this path is correct
      description: "Hike through breathtaking landscapes to the lost city of the Incas.",
      rating: 4.9,
      price: "₹1,12,000",
      duration: "6 days"
    },
    { 
      id: 4, 
      name: "Santorini, Greece", 
      image: "/Santorini.jpg", // Ensure this path is correct
      description: "Experience stunning sunsets over the Aegean Sea from whitewashed villages.",
      rating: 4.9,
      price: "₹1,20,000",
      duration: "6 days"
    },
    { 
      id: 5, 
      name: "Bali, Indonesia", 
      image: "/Bali.jpg", // Ensure this path is correct
      description: "Discover lush rice terraces, spiritual temples, and beautiful beaches.",
      rating: 4.6,
      price: "₹82,000",
      duration: "8 days"
    }
  ];

  // Featured experiences
  const featuredExperiences = [
    {
      id: 1,
      title: "Northern Lights Adventure",
      location: "Iceland",
      image: "https://images.pexels.com/photos/360912/pexels-photo-360912.jpeg?auto=compress&cs=tinysrgb&w=1200",
      price: "₹1,57,000",
      rating: 4.9
    },
    {
      id: 2,
      title: "Desert Safari Adventure",
      location: "Dubai, UAE",
      image: "https://images.pexels.com/photos/1703312/pexels-photo-1703312.jpeg?auto=compress&cs=tinysrgb&w=1200",
      price: "₹67,000",
      rating: 4.7
    },
    {
      id: 3,
      title: "Rainforest Exploration",
      location: "Costa Rica",
      image: "https://media.istockphoto.com/id/1318868707/photo/asian-chinese-single-mother-exploring-mossy-forest-in-cameron-highland-with-her-children.jpg?b=1&s=612x612&w=0&k=20&c=--xhPpY7lrdQcGuJd89KehpGQE9fVLk092jPlTRYgTA=",
      price: "₹1,01,000",
      rating: 4.8
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      location: "New York, USA",
      comment: "The trip to Kyoto exceeded all my expectations! The guides were knowledgeable and the accommodations were perfect.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 2,
      name: "Michael Wong",
      location: "Sydney, Australia",
      comment: "Our family vacation to Bali was seamlessly organized. Every detail was taken care of, allowing us to fully enjoy our time.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      location: "Madrid, Spain",
      comment: "The Paris tour was magical! From the Eiffel Tower to the local cuisine, everything was perfectly arranged.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  // Trending destinations - display 3 at a time
  const trendingDestinations = popularDestinations.slice(currentDestinationIndex, currentDestinationIndex + 3);

  const nextDestination = () => {
    setCurrentDestinationIndex((prevIndex) => {
      if (popularDestinations.length <= 3) return 0;
      return (prevIndex + 1) % (popularDestinations.length - 2);
    });
  };

  const prevDestination = () => {
    setCurrentDestinationIndex((prevIndex) => {
      if (popularDestinations.length <= 3) return 0;
      return prevIndex === 0 ? popularDestinations.length - 3 : prevIndex - 1;
    });
  };
  
  useEffect(() => {
    setIsLoading(true);
    const db = getFirestore(); 
  
    const unsubscribe = onAuthStateChanged(auth, async (loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);
        if (!loggedInUser.email) {
          console.warn("User is logged in but email is null.");
          setIsLoading(false);
          return;
        }
  
        const userDocRef = doc(db, 'users', loggedInUser.email);
        const docSnapshot = await getDoc(userDocRef);
  
        if (!docSnapshot.exists()) {
          setShowReligionDialog(true);
        }
  
        let fetchedTrips: Trip[] = [];
        if (docSnapshot.exists() && docSnapshot.data().trips && Array.isArray(docSnapshot.data().trips)) {
          fetchedTrips = docSnapshot.data().trips.map((trip: any) => ({
            ...trip,
            id: trip.id || `trip-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID
            createdAt: trip.createdAt // Assuming it's already a string or Timestamp
          }));
        } else {
          // Fallback to old structure is removed for simplicity, ensure your data matches the new structure
          console.log("User document does not have a trips array, or user document doesn't exist.");
        }
  
        if (fetchedTrips.length > 0) {
          const sortedTrips = [...fetchedTrips].sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
  
          setTrips(sortedTrips);
  
          const mostRecentTrip = sortedTrips[0];
          if (!mostRecentTrip.feedbackSubmitted) {
            setSourceTrip(mostRecentTrip.startLocation);
            setDestinationTrip(mostRecentTrip.destination);      
            setTripIdForFeedback(mostRecentTrip.id);
            setShowFeedbackDialog(true);
          }
        }
      } else {
        setUser(null);
        setTrips([]);
        setShowFeedbackDialog(false);
      }
      setIsLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  
  const handleFeedbackSubmit = async () => {
    if (!tripIdForFeedback || !feedback.trim() || rating === 0) {
      if (!feedback.trim()) toast.error("Please enter some feedback.");
      if (rating === 0) toast.error("Please rate your experience.");
      return;
    }
  
    setFeedbackSubmitting(true);
    const db = getFirestore();
  
    try {
      if (user && user.email) {
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists() && userDoc.data().trips) {
          const userTrips = userDoc.data().trips as Trip[]; // Cast to Trip[]
          const updatedTrips = userTrips.map((trip: Trip) => { // Ensure trip is of type Trip
            if (trip.id === tripIdForFeedback) {
              return {
                ...trip,
                feedbackSubmitted: true,
                feedbackContent: feedback,
                feedbackRating: rating,
                feedbackDate: new Date().toISOString()
              };
            }
            return trip;
          });
          await updateDoc(userDocRef, { trips: updatedTrips });
        }
      }
  
      // Create a new feedback document in the 'feedbacks' collection
      const feedbackCollectionRef = collection(db, 'feedbacks');
      await setDoc(doc(feedbackCollectionRef), {
        email: user?.email,
        source: sourceTrip,
        destination: destinationTrip,
        feedback: feedback,
        rating: rating,
        tripId: tripIdForFeedback,
        createdAt: Timestamp.now() // Use Firestore Timestamp
      });
  
      toast.success("Thank you for your feedback!");
      setShowFeedbackDialog(false);
      setFeedback('');
      setRating(0);
      setTrips(prev => prev.map(t => t.id === tripIdForFeedback ? { ...t, feedbackSubmitted: true } : t));
  
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const skipFeedback = () => {
    setShowFeedbackDialog(false);
    setFeedback('');
    setRating(0);
  };

  const handleSubmitProfile = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!religion.trim()) {
      toast.error("Please enter your religion.");
      return;
    }
    if (!favoritePlaces.trim()) {
      toast.error("Please select your travel preferences.");
      return;
    }
    if (believerOfGod === undefined) {
      toast.error("Please specify if you are a believer of God.");
      return;
    }

    if (user && user.email) {
      const db = getFirestore();
      try {
        await setDoc(doc(db, 'users', user.email), {
          name: name,
          email: user.email, // Store email as well
          religion: religion,
          favoritePlaces: favoritePlaces,
          believerOfGod: believerOfGod,
          subscribed: false, // Default subscription status
          subscriptionPlan: 'Free', // Default plan
          trips: [], 
          createdAt: Timestamp.now() // Use Firestore Timestamp
        });
        toast.success("Profile completed successfully!");
        setShowReligionDialog(false);
      } catch (error) {
        console.error("Error saving profile:", error);
        toast.error("Failed to save profile. Please try again.");
      }
    }
  };

  const handleToastClose = () => {
    setToastClosing(true);
    setTimeout(() => {
      setShowToast(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      {/* Promotional Toast Notification */}
      {showToast && (
        <div className={`fixed top-0 mt-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md ${toastClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center p-4">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                <RiCompassDiscoverLine className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Discover Local Adventures</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Check out the best places to visit near your city. Limited time offers available!
                </p>
                <div className="mt-2 flex space-x-3">
                  <Link href="/BestPlaces" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Explore Now
                  </Link>
                  <button
                    type="button"
                    onClick={handleToastClose}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={handleToastClose}
                  className="bg-white dark:bg-gray-800 rounded-full inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <IoClose className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="overflow-x-hidden"> {/* Use overflow-x-hidden to prevent horizontal scroll from animations */}
        {/* Hero Section with New CTAs */}
        <section className="relative h-screen flex items-center">
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent opacity-70"></div>
            <img 
              src="/adventure.jpg" // Ensure this image path is correct in your public folder
              alt="Travel Adventure" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="container mx-auto px-4 z-10 text-white">
            <div className="max-w-3xl text-center md:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 animate-fade-in-down">
                Discover the Beauty <br />
                <span className="text-blue-400">of Our World</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-10 animate-fade-in-up animation-delay-300">
                Experience unforgettable journeys and create memories that last a lifetime.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 sm:gap-6 animate-fade-in-up animation-delay-600">
                <Link href="/Component/Planner">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2">
                    <MdTravelExplore className="text-xl" />
                    Plan Your Adventure
                  </button>
                </Link>
                {/* <Link href="/destinations"> */}
                  <button className="w-full sm:w-auto bg-white/20 backdrop-blur-sm border-2 border-white/50 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2">
                    <RiCompassDiscoverLine className="text-xl" />
                    Explore Destinations
                  </button>
                {/* </Link> */}
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations Section */}
        <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Popular Destinations
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover our most sought-after destinations that promise unforgettable experiences.
              </p>
            </div>
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trendingDestinations.map((destination) => (
                  <div key={destination.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2">
                    <div className="relative h-60 overflow-hidden">
                      <img 
                        src={destination.image} 
                        alt={destination.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-blue-600 px-2 py-1 rounded-full text-sm font-medium shadow">
                        {destination.rating} ★
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{destination.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm h-16 overflow-hidden">{destination.description}</p> {/* Fixed height for description */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-900 dark:text-white font-bold text-lg">{destination.price}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs"> / {destination.duration}</span>
                        </div>
                        <Link href="/Component/Planner">
                          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition duration-300">
                            Explore
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {popularDestinations.length > 3 && (
                <>
                  <button 
                    onClick={prevDestination}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white dark:bg-gray-800 rounded-full p-2 md:p-3 shadow-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none z-10"
                    aria-label="Previous Destination"
                  >
                    <FaChevronLeft className="text-sm md:text-base"/>
                  </button>
                  <button 
                    onClick={nextDestination}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white dark:bg-gray-800 rounded-full p-2 md:p-3 shadow-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none z-10"
                    aria-label="Next Destination"
                  >
                    <FaChevronRight className="text-sm md:text-base"/>
                  </button>
                </>
              )}
            </div>
            <div className="text-center mt-10">
              <Link href="/#" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition">
                View all destinations
                <FaChevronRight className="text-sm" />
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Experiences Section */}
        <section className="py-16 md:py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Unforgettable Experiences
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Curated adventures that go beyond the ordinary tourist experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredExperiences.map((experience) => (
                <div key={experience.id} className="group">
                  <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={experience.image} 
                      alt={experience.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center text-yellow-400 mb-2">
                        <span className="mr-1 font-semibold">{experience.rating}</span>
                        {[...Array(Math.floor(experience.rating))].map((_, i) => <span key={i}>★</span>)}
                        {experience.rating % 1 !== 0 && <span>☆</span>} {/* For half stars if applicable */}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{experience.title}</h3>
                      <p className="text-gray-300 flex items-center text-sm">
                        <FaMapMarkerAlt className="mr-1.5" />
                        {experience.location}
                      </p>
                      <Link href="/Component/Planner">
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-white font-bold text-lg">{experience.price}</span>
                          <button className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-sm font-medium rounded-lg transition duration-300">
                            Explore
                          </button>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Travel With Us</h2>
                    <p className="max-w-2xl mx-auto text-blue-100">
                        We're dedicated to providing exceptional travel experiences with attention to every detail.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                    {[
                        { icon: <MdOutlineExplore className="text-3xl" />, title: "Curated Experiences", description: "Our experts handpick destinations and activities to ensure authentic and memorable journeys." },
                        { icon: <FaUserFriends className="text-3xl" />, title: "Expert Local Guides", description: "Connect with knowledgeable local guides who share insider perspectives and hidden gems." },
                        { icon: <MdTravelExplore className="text-3xl" />, title: "Sustainable Travel", description: "We're committed to responsible tourism that respects communities and preserves nature." }
                    ].map((item, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center hover:bg-white/20 transition-colors duration-300">
                            <div className="bg-blue-600/50 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-blue-100 text-sm leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Travelers Say</h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Hear from adventurers who've experienced our journeys firsthand.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col">
                            <img 
                                src={testimonial.avatar} 
                                alt={testimonial.name}
                                className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-blue-200 dark:border-blue-700 object-cover"
                                loading="lazy"
                            />
                            <p className="text-gray-600 dark:text-gray-300 italic text-center mb-6 flex-grow">“{testimonial.comment}”</p>
                            <div className="text-center">
                                <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-white dark:bg-gray-800 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-10 md:p-16 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="text-white">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready for Your Next Adventure?</h2>
                            <p className="text-blue-100 mb-8 text-lg">
                                Sign up for our newsletter and be the first to know about special offers, new destinations, and travel inspiration.
                            </p>
                            <form className="flex flex-col sm:flex-row gap-3">
                                <input 
                                    type="email" 
                                    placeholder="Your email address" 
                                    className="flex-1 px-5 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    aria-label="Email for newsletter"
                                />
                                <button type="submit" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300 shadow-md">
                                    Subscribe Now
                                </button>
                            </form>
                        </div>
                        <div className="hidden md:flex justify-center items-center">
                            <img 
                                src="https://images.unsplash.com/photo-1679339425540-5b7a706e1c8d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhdmVsJTIwaW5zcGlyYXRpb258ZW58MHx8MHx8fDA%3D"
                                alt="Travel Inspiration" 
                                className="rounded-lg shadow-xl max-h-80 object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full opacity-10 pointer-events-none"></div>
        </section>

        {/* User Profile Completion Dialog */}
        {showReligionDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Complete Your Profile</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center text-sm">
                Help us personalize your experience by sharing a few details about yourself.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Religion</label>
                  <input
                    type="text"
                    placeholder="Enter your religion"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Preferences</label>
                  <select
                    value={favoritePlaces}
                    onChange={(e) => setFavoritePlaces(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your favorite type of place</option>
                    <option value="Historical">Historical Sites</option>
                    <option value="Nature">Nature & Outdoors</option>
                    <option value="Adventure">Adventure & Activities</option>
                    <option value="Beaches">Beaches & Islands</option>
                    <option value="Cultural">Cultural Experiences</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Are you a believer of God?</label>
                  <div className="flex gap-6">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="believerOfGod"
                        checked={believerOfGod === true}
                        onChange={() => setBelieverOfGod(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Yes</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="believerOfGod"
                        checked={believerOfGod === false}
                        onChange={() => setBelieverOfGod(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">No</span>
                    </label>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleSubmitProfile}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Feedback Dialog */}
        {showFeedbackDialog && tripIdForFeedback && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                  <MdTravelExplore className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">How was your trip?</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                We noticed you recently traveled from <span className="font-medium text-blue-600 dark:text-blue-400">{sourceTrip}</span> to <span className="font-medium text-blue-600 dark:text-blue-400">{destinationTrip}</span>. Your feedback helps us improve!
              </p>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate your overall experience:</p>
                <div className="flex space-x-1 sm:space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-2xl sm:text-3xl transition-colors ${
                        rating >= star
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'
                      }`}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience... What did you enjoy? Any suggestions?"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32 sm:h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
              />
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  onClick={skipFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 order-2 sm:order-1"
                  disabled={feedbackSubmitting}
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300 flex items-center justify-center order-1 sm:order-2 ${
                    !feedback.trim() || rating === 0 || feedbackSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={feedbackSubmitting || !feedback.trim() || rating === 0}
                >
                  {feedbackSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Animation Styles */}
        <style jsx>{`
          @keyframes slideDown {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
          }
          @keyframes slideUp {
            0% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
          .animate-slide-down { animation: slideDown 0.5s ease-out forwards; }
          .animate-slide-up { animation: slideUp 0.5s ease-in forwards; }

          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
          .animation-delay-300 { animation-delay: 0.3s; }
          .animation-delay-600 { animation-delay: 0.6s; }
        `}</style>
      </main>
    
      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { title: "Explore", links: ["Destinations", "Experiences", "Adventure Tours", "Group Trips", "Last Minute Deals"] },
              { title: "Company", links: ["About Us", "Careers", "Blog", "Press", "Gift Cards"] },
              { title: "Support", links: ["Contact Us", "Help Center", "COVID-19 Updates", "Cancellation Policy", "Privacy Policy"] },
            ].map(section => (
              <div key={section.title}>
                <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link}><Link href="#" className="text-gray-400 hover:text-white transition text-sm">{link}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Connected</h3>
              <p className="text-gray-400 mb-4 text-sm">Subscribe for travel inspiration and special offers.</p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg flex-1 bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  aria-label="Email for newsletter subscription"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg text-white text-sm font-medium">
                  Subscribe
                </button>
              </form>
              <div className="flex space-x-4 mt-6">
                {/* Social media icons (simplified for brevity, add actual SVGs or icons) */}
                <Link href="#" className="text-gray-400 hover:text-white transition" aria-label="Facebook"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg></Link>
                <Link href="#" className="text-gray-400 hover:text-white transition" aria-label="Instagram"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 1.802c-3.073 0-3.45.011-4.656.066-2.644.121-3.766 1.244-3.887 3.887-.055 1.206-.066 1.584-.066 4.656s.011 3.45.066 4.656c.12 2.643 1.243 3.766 3.887 3.887 1.206.055 1.583.066 4.656.066 3.073 0 3.45-.011 4.656-.066 2.644-.12 3.767-1.244 3.887-3.887.055-1.206.066-1.584.066-4.656s-.011-3.45-.066-4.656c-.12-2.643-1.243-3.766-3.887-3.887-1.206-.055-1.584-.066-4.656-.066zm0 2.881a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 1.802a3.333 3.333 0 110 6.666 3.333 3.333 0 010-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg></Link>
                <Link href="#" className="text-gray-400 hover:text-white transition" aria-label="Twitter"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg></Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} World Explorer. All rights reserved.
              </p>
              <div className="flex space-x-4 sm:space-x-6">
                <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition">Terms of Service</Link>
                <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition">Privacy Policy</Link>
                <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;