"use client"

import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar';
import { auth, onAuthStateChanged } from '@/FirebaseCofig';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import Link from 'next/link';
import { BiSolidOffer, BiSearchAlt } from "react-icons/bi";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaUserFriends, FaChevronRight, FaChevronLeft, FaCheckCircle } from "react-icons/fa";
import { RiCompassDiscoverLine } from "react-icons/ri";
import { MdOutlineExplore, MdTravelExplore } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import toast from 'react-hot-toast';
 
type Trip = {
  id: string;
  feedbackSubmitted: boolean;
  completed: boolean; // Add completed property
  email: string;
  startLocation: string;
  destination: string;
  createdAt: Timestamp | string;
  // Add other properties that exist in your trip documents
};

const Landing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showReligionDialog, setShowReligionDialog] = useState(false);
  const [name, setName] = useState('');
  const [religion, setReligion] = useState('');
  const [favoritePlaces, setFavoritePlaces] = useState('');
  const [believerOfGod, setBelieverOfGod] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [feedback, setFeedback] = useState('');
  const [tripIdForFeedback, setTripIdForFeedback] = useState<string | null>(null);
  const [sourceTrip, setSourceTrip] = useState('');
  const [destinationTrip, setDestinationTrip] = useState('');
  const [showToast, setShowToast] = useState(true);
  const [toastClosing, setToastClosing] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState<number>(0);

  // Popular destinations data
  const popularDestinations = [
    { 
      id: 1, 
      name: "Paris, France", 
      image: "/paris.jpg", 
      description: "Experience the romance of the Eiffel Tower and the charm of Parisian cafes.",
      rating: 4.8,
      price: "$1,200",
      duration: "5 days"
    },
    { 
      id: 2, 
      name: "Kyoto, Japan", 
      image: "/tokyo.jpg", 
      description: "Discover ancient temples, serene gardens, and the beauty of Japanese culture.",
      rating: 4.7,
      price: "$1,800",
      duration: "7 days"
    },
    { 
      id: 3, 
      name: "Machu Picchu, Peru", 
      image: "/pachu.jpg", 
      description: "Hike through breathtaking landscapes to the lost city of the Incas.",
      rating: 4.9,
      price: "$1,500",
      duration: "6 days"
    },
    { 
      id: 4, 
      name: "Santorini, Greece", 
      image: "/images/travel/island-getaway.jpg", 
      description: "Experience stunning sunsets over the Aegean Sea from whitewashed villages.",
      rating: 4.9,
      price: "$1,600",
      duration: "6 days"
    },
    { 
      id: 5, 
      name: "Bali, Indonesia", 
      image: "/images/travel/tropical-paradise.jpg", 
      description: "Discover lush rice terraces, spiritual temples, and beautiful beaches.",
      rating: 4.6,
      price: "$1,100",
      duration: "8 days"
    }
  ];

  // Featured experiences
  const featuredExperiences = [
    {
      id: 1,
      title: "Northern Lights Adventure",
      location: "Iceland",
      image: "https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcSHVofjIB3S4P5qBPzmiAYYHlmZe0_ubtdtrKAdGFPqinZ4onvTd4gZYdDX3yishPbOgQkdqKqQV57dTCI91tBg14qI7eQcKC5CG38HAQ",
      price: "$2,100",
      rating: 4.9
    },
    {
      id: 2,
      title: "Desert Safari Adventure",
      location: "Dubai, UAE",
      image: "https://plus.unsplash.com/premium_photo-1661962428918-6a57ab674e23?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZGVzZXJ0JTIwc2FmYXJpfGVufDB8fDB8fHww",
      price: "$890",
      rating: 4.7
    },
    {
      id: 3,
      title: "Rainforest Exploration",
      location: "Costa Rica",
      image: "https://media.istockphoto.com/id/1056872134/photo/mountain-bike-costa-rica.webp?a=1&b=1&s=612x612&w=0&k=20&c=ZB9cveVHfQtgicFQyo0HF40LSDdlUvtF3AHFj0Mg-ng=",
      price: "$1,350",
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
      avatar: "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?ga=GA1.1.495762774.1737877477&semt=ais_hybrid"
    },
    {
      id: 2,
      name: "Michael Wong",
      location: "Sydney, Australia",
      comment: "Our family vacation to Bali was seamlessly organized. Every detail was taken care of, allowing us to fully enjoy our time.",
      avatar: "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?ga=GA1.1.495762774.1737877477&semt=ais_hybrid"
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      location: "Madrid, Spain",
      comment: "The Paris tour was magical! From the Eiffel Tower to the local cuisine, everything was perfectly arranged.",
      avatar: "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?ga=GA1.1.495762774.1737877477&semt=ais_hybrid"
    }
  ];

  // Trending destinations - display 3 at a time
  const trendingDestinations = popularDestinations.slice(currentDestinationIndex, currentDestinationIndex + 3);

  const nextDestination = () => {
    setCurrentDestinationIndex((prevIndex) => 
      (prevIndex + 1) % (popularDestinations.length - 2)
    );
  };

  const prevDestination = () => {
    setCurrentDestinationIndex((prevIndex) => 
      prevIndex === 0 ? popularDestinations.length - 3 : prevIndex - 1
    );
  };

  // Fetch user data and check for their latest trip that needs feedback
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
  
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.email || 'default-email');
        const docSnapshot = await getDoc(userDocRef);
  
        // Check if the user exists in Firestore
        if (!docSnapshot.exists()) {
          setShowReligionDialog(true);
        }
  
        // First check if user document has trips array (new structure)
        if (docSnapshot.exists() && docSnapshot.data().trips) {
          const userTrips = docSnapshot.data().trips;
          
          // Sort by creation date (newest first)
          const sortedTrips = [...userTrips].sort((a, b) => {
            // Handle different date formats
            const dateA = a.createdAt instanceof Timestamp ? 
              a.createdAt.toDate().getTime() : 
              new Date(a.createdAt as string).getTime();
            
            const dateB = b.createdAt instanceof Timestamp ? 
              b.createdAt.toDate().getTime() : 
              new Date(b.createdAt as string).getTime();
            
            return dateB - dateA;
          });
          
          setTrips(sortedTrips);
          
          // Check if the most recent trip needs feedback
          if (sortedTrips.length > 0) {
            const mostRecentTrip = sortedTrips[0];
            
            // If the most recent trip doesn't have feedback submitted
            if (!mostRecentTrip.feedbackSubmitted) {
              setSourceTrip(mostRecentTrip.startLocation);
              setDestinationTrip(mostRecentTrip.destination);      
              setTripIdForFeedback(mostRecentTrip.id);
              setShowFeedbackDialog(true);
            }
          }
        } else {
          // Fall back to checking trip collection (old structure)
          const tripsRef = collection(db, 'trip');
          const q = query(tripsRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
      
          const allTrips: Trip[] = [];
          
          querySnapshot.forEach((doc) => {
            const tripData = { ...doc.data(), id: doc.id } as Trip;
            allTrips.push(tripData);
          });
      
          if (allTrips.length > 0) {
            // Sort by creation date (newest first)
            const sortedTrips = allTrips.sort((a, b) => {
              const dateA = a.createdAt instanceof Timestamp ? 
                a.createdAt.toDate().getTime() : 
                new Date(a.createdAt as string).getTime();
              
              const dateB = b.createdAt instanceof Timestamp ? 
                b.createdAt.toDate().getTime() : 
                new Date(b.createdAt as string).getTime();
              
              return dateB - dateA;
            });
            
            setTrips(sortedTrips);
            
            // Get the latest trip
            const mostRecentTrip = sortedTrips[0];
            
            // If it doesn't have feedback yet
            if (!mostRecentTrip.feedbackSubmitted) {
              setSourceTrip(mostRecentTrip.startLocation);
              setDestinationTrip(mostRecentTrip.destination);      
              setTripIdForFeedback(mostRecentTrip.id);
              setShowFeedbackDialog(true);
            }
          }
        }
      } else {
        // User is not logged in
        setUser(null);
        setTrips([]);
        setShowFeedbackDialog(false);
      }
      
      setIsLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  
  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (tripIdForFeedback && feedback.trim() && rating > 0) {
      try {
        setFeedbackSubmitted(true);
        const db = getFirestore();
        
        // Check if the trip exists in the user's trips array first (new structure)
        if (user && user.email) {
          const userDocRef = doc(db, 'users', user.email);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().trips) {
            const userTrips = userDoc.data().trips;
            const updatedTrips = userTrips.map((trip: any) => {
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
            
            // Update the trips array in the user document
            await updateDoc(userDocRef, { trips: updatedTrips });
          }
        }
        
        // Also update the trip document in the trip collection (for backwards compatibility)
        try {
          const tripRef = doc(db, 'trip', tripIdForFeedback);
          const tripDoc = await getDoc(tripRef);
          
          if (tripDoc.exists()) {
            await updateDoc(tripRef, { 
              feedbackSubmitted: true 
            });
          }
        } catch (error) {
          console.error('Error updating trip document:', error);
        }
        
        // Create a new feedback document in the 'feedbacks' collection
        const feedbackRef = collection(db, 'feedbacks');
        await setDoc(doc(feedbackRef), {
          email: user?.email,
          source: sourceTrip,
          destination: destinationTrip,
          feedback: feedback,
          rating: rating,
          tripId: tripIdForFeedback,
          createdAt: new Date()
        });
  
        // Show success toast
        toast.success("Thank you for your feedback!");
        
        // Reset and close the dialog after successful submission
        setShowFeedbackDialog(false);
        setFeedback('');
        setRating(0);
        setFeedbackSubmitted(false);
        
        // Update local state to reflect the changes
        setTrips(prev => prev.map(trip => {
          if (trip.id === tripIdForFeedback) {
            return {
              ...trip,
              feedbackSubmitted: true
            };
          }
          return trip;
        }));
      } catch (error) {
        console.error("Error submitting feedback:", error);
        setFeedbackSubmitted(false);
        toast.error("Failed to submit feedback. Please try again.");
      }
    } else if (!feedback.trim()) {
      toast.error("Please enter some feedback before submitting.");
      setFeedbackSubmitted(false);
    } else if (rating === 0) {
      toast.error("Please rate your experience.");
      setFeedbackSubmitted(false);
    }
  };

  // Skip feedback for now
  const skipFeedback = () => {
    setShowFeedbackDialog(false);
    setFeedback('');
    setRating(0);
  };

  // Handle profile completion
  const handleSubmit = async () => {
    if (name.trim() && religion.trim() && favoritePlaces.trim()) {
      if (user && user.email) {
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.email), {
          name: name,
          religion: religion,
          favoritePlaces: favoritePlaces,
          believerOfGod: believerOfGod,
          subscribed: false,
          subscription : '',
          trips: [], // Initialize empty trips array for new users
          createdAt: new Date()
        });

        setShowReligionDialog(false);
      }
    }
  };

  // Handle toast close
  const handleToastClose = () => {
    setToastClosing(true);
    setTimeout(() => {
      setShowToast(false);
    }, 500);
  };

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
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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

      <main className="overflow-hidden">
        {/* Hero Section with Search Bar */}
        <section className="relative h-screen flex items-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-60"></div>
            <img 
              src="/adventure.jpg" 
              alt="Travel Adventure" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="container mx-auto px-4 z-10 text-white">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
                Discover the Beauty <br />
                <span className="text-blue-400">of Our World</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Experience unforgettable journeys and create memories that last a lifetime.
              </p>
              
              {/* Search Box */}
              <div className="hidden lg:block bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Destination</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-3 text-blue-400" />
                      <input 
                        type="text" 
                        placeholder="Where do you want to go?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">When</label>
                    <div className="relative">
                      <FaRegCalendarAlt className="absolute left-3 top-3 text-blue-400" />
                      <input 
                        type="date" 
                        className="w-full pl-10 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Travelers</label>
                    <div className="relative">
                      <FaUserFriends className="absolute left-3 top-3 text-blue-400" />
                      <select className="w-full pl-10 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="1">1 Adult</option>
                        <option value="2">2 Adults</option>
                        <option value="3">2 Adults, 1 Child</option>
                        <option value="4">2 Adults, 2 Children</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition duration-300">
                  <BiSearchAlt className="text-xl" />
                  Search Adventures
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Popular Destinations
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover our most sought-after destinations that promise unforgettable experiences
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {trendingDestinations.map((destination) => (
                  <div key={destination.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2">
                    <div className="relative h-60 overflow-hidden">
                      <img 
                        src={destination.image} 
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                        {destination.rating} ★
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{destination.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{destination.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-900 dark:text-white font-bold">{destination.price}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm"> / {destination.duration}</span>
                        </div>
                        <Link href="/Component/Planner">                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition duration-300">
                          Explore
                        </button>
                        </Link>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation arrows */}
              <button 
                onClick={prevDestination}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 bg-white dark:bg-gray-800 rounded-full p-3 shadow-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hidden md:block"
              >
                <FaChevronLeft />
              </button>
              <button 
                onClick={nextDestination}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 bg-white dark:bg-gray-800 rounded-full p-3 shadow-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hidden md:block"
              >
                <FaChevronRight />
              </button>
            </div>

            <div className="text-center mt-10">
              <Link href="/destinations" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition">
                View all destinations
                <FaChevronRight className="text-sm" />
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Experiences Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Unforgettable Experiences
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Curated adventures that go beyond the ordinary tourist experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredExperiences.map((experience) => (
                <div key={experience.id} className="group">
                  <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={experience.image} 
                      alt={experience.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center text-yellow-400 mb-2">
                        <span className="mr-1">{experience.rating}</span>
                        <span>★★★★★</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{experience.title}</h3>
                      <p className="text-gray-300 flex items-center">
                        <FaMapMarkerAlt className="mr-1" />
                        {experience.location}
                      </p>
                      <Link href="/Component/Planner">
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-white font-bold">{experience.price}</span>
                        <button className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg transition duration-300">
                          Explore in detail
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
        <section className="py-20 bg-gradient-to-r from-blue-800 to-indigo-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Travel With Us</h2>
              <p className="max-w-2xl mx-auto text-blue-100">
                We're dedicated to providing exceptional travel experiences with attention to every detail
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="bg-blue-600/50 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                  <MdOutlineExplore className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Curated Experiences</h3>
                <p className="text-<h3 text-xl font-bold text-center mb-4">Curated Experiences</p>
                <p className="text-blue-100 text-center">
                  Our travel experts handpick each destination and experience to ensure you discover the authentic essence of each location.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="bg-blue-600/50 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                  <FaUserFriends className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Local Guides</h3>
                <p className="text-blue-100 text-center">
                  Connect with knowledgeable local guides who share insider perspectives and hidden gems you won't find in guidebooks.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
                <div className="bg-blue-600/50 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                  <MdTravelExplore className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Sustainable Travel</h3>
                <p className="text-blue-100 text-center">
                  We're committed to responsible tourism practices that respect local communities and preserve natural environments for future generations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Our Travelers Say</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Hear from adventurers who've experienced our journeys firsthand
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 rounded-full p-1">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="pt-6">
                    <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{testimonial.comment}"</p>
                    <div className="flex items-center">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white dark:bg-gray-800 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-900 rounded-2xl p-10 md:p-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Next Adventure?</h2>
                  <p className="text-blue-100 mb-8">
                    Sign up for our newsletter and be the first to know about special offers, new destinations, and travel inspiration.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4"><input 
                      type="email" 
                      placeholder="Your email address" 
                      className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button className="bg-white text-blue-600 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300">
                      Subscribe
                    </button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <img 
                    src="https://images.unsplash.com/photo-1493134799591-2c9eed26201a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2l0eSUyMHNreWxpbmV8ZW58MHx8MHx8fDA%3D" 
                    alt="Travel Inspiration" 
                    className="rounded-lg shadow-lg" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full opacity-10"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full opacity-10"></div>
        </section>

        {/* User Profile Completion Dialog */}
        {showReligionDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Profile</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
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
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="believerOfGod"
                        checked={believerOfGod}
                        onChange={() => setBelieverOfGod(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="believerOfGod"
                        checked={!believerOfGod}
                        onChange={() => setBelieverOfGod(false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">No</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Feedback Dialog - Only shown for the latest trip without feedback */}
        {showFeedbackDialog && tripIdForFeedback && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                  <MdTravelExplore className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">How was your trip?</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We noticed you recently traveled from <span className="font-medium text-blue-600 dark:text-blue-400">{sourceTrip}</span> to <span className="font-medium text-blue-600 dark:text-blue-400">{destinationTrip}</span>. Your feedback helps us improve and assists other travelers in planning their journeys.
              </p>
              
              {/* Rating Stars */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How would you rate your overall experience?</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-2xl ${
                        rating >= star
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What did you enjoy most about your trip? Any suggestions for improvement? Your insights help us and other travelers!"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={skipFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300"
                  disabled={feedbackSubmitted}
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300 flex items-center ${
                    !feedback.trim() || rating === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={feedbackSubmitted || !feedback.trim() || rating === 0}
                >
                  {feedbackSubmitted ? (
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
            0% {
              opacity: 0;
              transform: translate(-50%, -20px);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
          
          @keyframes slideUp {
            0% {
              opacity: 1;
              transform: translate(-50%, 0);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -20px);
            }
          }
          
          .animate-slide-down {
            animation: slideDown 0.5s ease-out forwards;
          }
          
          .animate-slide-up {
            animation: slideUp 0.5s ease-in forwards;
          }
        `}</style>
      </main>
    

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Destinations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Experiences</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Adventure Tours</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Group Trips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Last Minute Deals</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Gift Cards</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">COVID-19 Updates</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cancellation Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Stay Connected</h3>
              <p className="text-gray-400 mb-4">Subscribe to our newsletter for travel inspiration and special offers</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-2 rounded-l-lg flex-1 bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg text-white">
                  Subscribe
                </button>
              </div>
              <div className="flex space-x-4 mt-6">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} World Explorer. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;