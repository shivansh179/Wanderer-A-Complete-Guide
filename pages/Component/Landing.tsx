"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar';
import { auth, onAuthStateChanged } from '@/FirebaseCofig';
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { BiSearchAlt } from "react-icons/bi";
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaChevronRight, FaChevronLeft, FaStar } from "react-icons/fa";
import { RiCompassDiscoverLine } from "react-icons/ri";
import { MdTravelExplore, MdOutlinePriceCheck, MdOutlineVerifiedUser, MdOutlineAirplanemodeActive } from "react-icons/md";
import { GiWorld } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import toast from 'react-hot-toast';

type Trip = {
  id: string;
  feedbackSubmitted: boolean;
  completed?: boolean;
  email: string;
  startLocation: string;
  destination: string;
  createdAt: Timestamp | string;
  feedbackContent?: string;
  feedbackRating?: number;
  feedbackDate?: string;
};

const Landing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileCompletionDialog, setShowProfileCompletionDialog] = useState(false);
  const [name, setName] = useState('');
  const [travelStyle, setTravelStyle] = useState('');
  const [travelInterests, setTravelInterests] = useState<string[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [feedback, setFeedback] = useState('');
  const [tripIdForFeedback, setTripIdForFeedback] = useState<string | null>(null);
  const [sourceTrip, setSourceTrip] = useState('');
  const [destinationTrip, setDestinationTrip] = useState('');
  const [showToast, setShowToast] = useState(true);
  const [toastClosing, setToastClosing] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);

  const popularDestinations = [
    { id: 1, name: "Paris, France", image: "/paris.jpg", description: "The city of love, lights, and art.", rating: 4.8, price: "from ₹250,000" },
    { id: 2, name: "Kyoto, Japan", image: "/tokyo.jpg", description: "Ancient temples and serene gardens.", rating: 4.9, price: "from ₹1,35,000" },
    { id: 3, name: "Santorini, Greece", image: "/Santorini.jpg", description: "Iconic sunsets over the Aegean Sea.", rating: 4.9, price: "from ₹1,20,000" },
    { id: 4, name: "Bali, Indonesia", image: "/Bali.jpg", description: "A paradise of beaches and spirituality.", rating: 4.7, price: "from ₹175,000" },
    { id: 5, name: "Rome, Italy", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500", description: "Walk through history in the Eternal City.", rating: 4.8, price: "from ₹95,000" },
  ];

  const travelInterestOptions = ["History", "Nature", "Adventure", "Beaches", "Culture", "Food"];

  const testimonials = [
    { id: 1, name: "Sarah Johnson", location: "New York, USA", comment: "The trip to Kyoto exceeded all my expectations! The planning was flawless, and the experience was truly authentic. Highly recommend!", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { id: 2, name: "Michael Chen", location: "Sydney, Australia", comment: "Our family vacation to Bali was seamless. Every detail was curated perfectly, allowing us to relax and create lasting memories.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: 3, name: "Elena Rodriguez", location: "Madrid, Spain", comment: "A truly magical Paris tour! From the private guide at the Louvre to the charming boutique hotel, everything was exceptional.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" }
  ];

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
          setShowProfileCompletionDialog(true);
        }

        let fetchedTrips: Trip[] = [];
        if (docSnapshot.exists() && docSnapshot.data().trips && Array.isArray(docSnapshot.data().trips)) {
          fetchedTrips = docSnapshot.data().trips.map((trip: any) => ({
            ...trip,
            id: trip.id || `trip-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: trip.createdAt
          }));
        }

        if (fetchedTrips.length > 0) {
          const sortedTrips = [...fetchedTrips].sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return dateB - dateA;
          });

          setTrips(sortedTrips);

          const mostRecentTrip = sortedTrips[0];
          if (mostRecentTrip && !mostRecentTrip.feedbackSubmitted) {
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
      if (rating === 0) toast.error("Please provide a rating.");
      return;
    }

    setFeedbackSubmitting(true);
    const db = getFirestore();

    try {
      if (user && user.email) {
        const userDocRef = doc(db, 'users', user.email);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().trips) {
          const userTrips = userDoc.data().trips as Trip[];
          const updatedTrips = userTrips.map((trip: Trip) => {
            if (trip.id === tripIdForFeedback) {
              return { ...trip, feedbackSubmitted: true, feedbackContent: feedback, feedbackRating: rating, feedbackDate: new Date().toISOString() };
            }
            return trip;
          });
          await updateDoc(userDocRef, { trips: updatedTrips });
        }
      }

      const feedbackCollectionRef = collection(db, 'feedbacks');
      await setDoc(doc(feedbackCollectionRef), {
        email: user?.email,
        source: sourceTrip,
        destination: destinationTrip,
        feedback: feedback,
        rating: rating,
        tripId: tripIdForFeedback,
        createdAt: Timestamp.now()
      });

      toast.success("Thank you for your valuable feedback!");
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

  const handleInterestChange = (interest: string) => {
    setTravelInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmitProfile = async () => {
    if (!name.trim() || !travelStyle || travelInterests.length === 0) {
      toast.error("Please fill in all fields to continue.");
      return;
    }

    if (user && user.email) {
      const db = getFirestore();
      try {
        await setDoc(doc(db, 'users', user.email), {
          name: name,
          email: user.email,
          travelStyle: travelStyle,
          travelInterests: travelInterests,
          subscribed: false,
          subscriptionPlan: 'Free',
          trips: [],
          createdAt: Timestamp.now()
        });
        toast.success("Profile created! Welcome aboard.");
        setShowProfileCompletionDialog(false);
      } catch (error) {
        console.error("Error saving profile:", error);
        toast.error("Failed to save profile. Please try again.");
      }
    }
  };

  const handleToastClose = () => {
    setToastClosing(true);
    setTimeout(() => setShowToast(false), 500);
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

      {showToast && (
        <div className={`fixed top-0 mt-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md ${toastClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4">

                  <Link href="/BestPlaces">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                            <RiCompassDiscoverLine className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">New Local Adventures Unlocked!</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Explore hidden gems near you. Special offers available for a limited time.</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button onClick={handleToastClose} className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span className="sr-only">Close</span>
                                <IoClose className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    </Link>
                </div>
            </div>
        </div>
      )}

      <main className="overflow-x-hidden bg-white dark:bg-gray-950">
        <section className="relative h-screen flex items-center justify-center text-center">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster="/adventure.jpg"
                >
                    <source src="/travel.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
            <div className="relative z-10 px-4 text-white">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 animate-fade-in-down">
                    Your Journey Begins Here
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 mb-10 animate-fade-in-up animation-delay-300">
                    Crafting unforgettable travel experiences tailored just for you. Discover, plan, and book your next great adventure with us.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-600">
                    <Link href="/Component/Planner">
                        <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg transition duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                            <MdTravelExplore />
                            Start Planning
                        </button>
                    </Link>
                    <a href="#destinations" className="w-full sm:w-auto bg-white/20 backdrop-blur-sm border border-white/50 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-full shadow-lg text-lg transition duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                        <RiCompassDiscoverLine />
                        Discover More
                    </a>
                </div>
            </div>
        </section>

        {/* <section className="relative -mt-16 z-20 px-4">
            <div className="container mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-4">
                    <div className="w-full">
                        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="destination" type="text" placeholder="Where are you going?" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="w-full">
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                         <div className="relative">
                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="date" type="date" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                     <div className="w-full">
                        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guests</label>
                         <div className="relative">
                            <FaUserFriends className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="guests" type="number" placeholder="2" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 text-lg">
                        <BiSearchAlt />
                        Search
                    </button>
                </form>
            </div>
        </section> */}

        <section id="destinations" className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Explore Top Destinations</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">Journeys that inspire, places that change you. Find your next story with us.</p>
                </div>
                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trendingDestinations.map((dest) => (
                            <div key={dest.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group">
                                <div className="relative h-64">
                                    <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                        <FaStar /> {dest.rating}
                                    </div>
                                    <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">{dest.name}</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">{dest.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-800 dark:text-white">{dest.price}</span>
                                        <Link href="/Component/Planner">
                                            <button className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition flex items-center gap-1">
                                                View Details <FaChevronRight className="transform transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {popularDestinations.length > 3 && (
                        <>
                            <button onClick={prevDestination} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none z-10 transition">
                                <FaChevronLeft />
                            </button>
                            <button onClick={nextDestination} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none z-10 transition">
                                <FaChevronRight />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>

        <section className="py-24 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Why Travel With Us?</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">We turn your travel dreams into reality with expertise, care, and a passion for exploration.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[
                        { icon: <GiWorld className="text-4xl text-blue-500" />, title: "Expertly Curated Itineraries", description: "Every trip is thoughtfully designed by our travel experts to provide a unique and enriching experience." },
                        { icon: <MdOutlinePriceCheck className="text-4xl text-blue-500" />, title: "Best Price Guarantee", description: "We offer competitive pricing and transparent costs, ensuring you get the best value for your adventure." },
                        { icon: <MdOutlineVerifiedUser className="text-4xl text-blue-500" />, title: "Safety & Support", description: "Your safety is our priority. Enjoy peace of mind with our 24/7 support and vetted local partners." }
                    ].map((item, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="mb-5">{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Traveler Tales</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">Real stories from our community of explorers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col text-center">
                            <img src={testimonial.avatar} alt={testimonial.name} className="w-20 h-20 rounded-full mx-auto mb-5 border-4 border-blue-500 object-cover" loading="lazy" />
                            <p className="text-gray-600 dark:text-gray-300 italic mb-6 flex-grow">“{testimonial.comment}”</p>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{testimonial.name}</h4>
                                <p className="text-blue-500 dark:text-blue-400 font-medium">{testimonial.location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-24 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4">
                <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-10 md:p-16 shadow-2xl overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-white/10 rounded-full"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="text-white">
                            <h2 className="text-4xl font-bold mb-4">Ready for Your Next Escape?</h2>
                            <p className="text-blue-100 mb-8 text-lg">Join our newsletter for exclusive deals, new destination alerts, and a dose of travel inspiration delivered to your inbox.</p>
                            <form className="flex flex-col sm:flex-row gap-3">
                                {/* <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-300/50" aria-label="Email for newsletter" /> */}
                                <button type="submit" className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-300 shadow-md transform hover:scale-105">
                                    Fetch Your Plan
                                </button>
                            </form>
                        </div>
                        <div className="hidden md:flex justify-center items-center">
                            <MdOutlineAirplanemodeActive className="text-9xl text-white/20 transform -rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {showProfileCompletionDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-2xl w-full">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome! Let's Get to Know You</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Personalize your travel recommendations by telling us a bit about yourself.</p>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <input type="text" placeholder="e.g., Alex Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What's your travel style?</label>
                            <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select a style...</option>
                                <option value="Luxury">Luxury & Comfort</option>
                                <option value="Budget">Budget-Friendly</option>
                                <option value="Adventure">Adventure & Exploration</option>
                                <option value="Relaxation">Relaxation & Wellness</option>
                                <option value="Family">Family-Oriented</option>
                                <option value="Solo">Solo Traveler</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What are your interests?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {travelInterestOptions.map(interest => (
                                    <button key={interest} onClick={() => handleInterestChange(interest)} className={`text-center py-3 px-2 rounded-lg border-2 transition-colors duration-200 ${travelInterests.includes(interest) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2">
                            <button onClick={handleSubmitProfile} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-lg shadow-lg transition transform hover:scale-105">
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showFeedbackDialog && tripIdForFeedback && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">How was your trip?</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
                        We'd love to hear about your journey from <span className="font-semibold text-blue-500">{sourceTrip}</span> to <span className="font-semibold text-blue-500">{destinationTrip}</span>.
                    </p>
                    <div className="mb-5">
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</p>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" className={`text-4xl transition-all duration-200 transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`} onClick={() => setRating(star)} aria-label={`Rate ${star} star`}>
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share your experience..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5 resize-none" />
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button onClick={skipFeedback} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" disabled={feedbackSubmitting}>
                            Maybe Later
                        </button>
                        <button onClick={handleFeedbackSubmit} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={feedbackSubmitting || !feedback.trim() || rating === 0}>
                            {feedbackSubmitting ? (
                                <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Submitting...
                                </>
                            ) : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <style jsx>{`
            @keyframes slideDown { 0% { opacity: 0; transform: translate(-50%, -20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
            @keyframes slideUp { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }
            .animate-slide-down { animation: slideDown 0.5s ease-out forwards; }
            .animate-slide-up { animation: slideUp 0.5s ease-in forwards; }
            @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-down { animation: fadeInDown 0.8s ease-out both; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-up { animation: fadeInUp 0.8s ease-out both; }
            .animation-delay-300 { animation-delay: 0.3s; }
            .animation-delay-600 { animation-delay: 0.6s; }
        `}</style>
      </main>

      <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-1">
                        <h3 className="text-xl font-bold mb-4">World Explorer</h3>
                        <p className="text-gray-400 text-sm">Crafting unforgettable journeys across the globe.</p>
                    </div>
                     {[
                        { title: "Explore", links: ["Destinations", "Experiences", "Adventure Tours"] },
                        { title: "Company", links: ["About Us", "Careers", "Blog", "Press"] },
                        { title: "Support", links: ["Contact", "Help Center", "Privacy Policy"] },
                    ].map(section => (
                        <div key={section.title}>
                            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map(link => (
                                    <li key={link}><a href="#" className="text-gray-400 hover:text-white transition text-sm">{link}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} World Explorer. All rights reserved.</p>
                    <div className="flex space-x-4">
                        <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Facebook"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg></a>
                        <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Instagram"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm5.5-7.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg></a>
                        <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Twitter"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg></a>
                    </div>
                </div>
            </div>
        </footer>
    </>
  );
};

export default Landing;