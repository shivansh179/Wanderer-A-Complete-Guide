"use client"

import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar';
import { auth, onAuthStateChanged } from '@/FirebaseCofig'; // Import Firebase Auth
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore'; // Import Firestore methods
import { User } from 'firebase/auth';
import Link from 'next/link';
import { BiSolidOffer } from "react-icons/bi";



type Trip = {
  id: string;
  feedbackSubmitted: boolean;
  userEmail: string;
  // Add other properties that exist in your trip documents
};


const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showReligionDialog, setShowReligionDialog] = useState(false);
  const [name, setName] = useState('');
  const [religion, setReligion] = useState('');
  const [favoritePlaces, setFavoritePlaces] = useState('');
  const [believerOfGod, setBelieverOfGod] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);;
  const [feedback, setFeedback] = useState('');
  const [tripIdForFeedback, setTripIdForFeedback] = useState(null);
  const [sourceTrip, setSourceTrip] = useState('');
  const [destinationTrip, setDestinationTrip] = useState('');
  const [showToast, setShowToast] = useState(true);


  useEffect(() => {
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
  
        // Check for trips with pending feedback
        const tripsRef = collection(db, 'trip');
        console.log("tripRef ", tripsRef);
  
        // Correct the query by using 'email' instead of 'userEmail'
        const q = query(tripsRef, where('email', '==', user.email), where('feedbackSubmitted', '==', false));
        console.log("q ", q);
  
        const querySnapshot = await getDocs(q);
        console.log("querySnapshot ", querySnapshot);
  
        const tripsArray: any[] = [];
        querySnapshot.forEach((doc) => {
          tripsArray.push({ ...doc.data(), id: doc.id });
        });
  
        console.log("tripsArray is ", tripsArray);
  
        setTrips(tripsArray);
  
        if (tripsArray.length > 0) {
          const mostRecentTrip = tripsArray[0]; // Assuming you want the most recent trip for feedback
          setSourceTrip(mostRecentTrip.startLocation);
          setDestinationTrip(mostRecentTrip.destination);      
          setTripIdForFeedback(mostRecentTrip.id);
          setShowFeedbackDialog(true);
        }
      } else {
        // User is not logged in
        setUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const handleFeedbackSubmit = async () => {
    if (tripIdForFeedback && feedback.trim()) {
      const db = getFirestore();
      
      // Update the trip document to mark feedback as submitted
      const tripRef = doc(db, 'trip', tripIdForFeedback);
      await updateDoc(tripRef, { feedbackSubmitted: true });
      
      // Use user's email as the document ID in the 'feedbacks' collection
      const feedbackRef = doc(db, 'feedbacks', user?.email || 'default-email'); // 'feedbacks' collection, document ID is email
      await setDoc(feedbackRef, {
        email: user?.email,  // Storing user's email
        source:sourceTrip,
        destination:destinationTrip,
        feedback: feedback,  // Storing user's feedback
        createdAt: new Date() // Optional: store the submission time
      });
  
      // Reset and close the dialog after successful submission
      setShowFeedbackDialog(false);
      setFeedback('');
    }
  };
  const handleSubmit = async () => {
    if (name.trim() && religion.trim() && favoritePlaces.trim()) {
      if (user && user.email) {
        const db = getFirestore(); // Get Firestore instance
        await setDoc(doc(db, 'users', user.email), {
          name: name,
          religion: religion,
          favoritePlaces: favoritePlaces,
          believerOfGod: believerOfGod,
          subscribed: false,

        });

        setShowReligionDialog(false); // Close the dialog
      }
    }
  };

  const handleToastClose = () => {
    // Start the toast closing animation and hide it after it completes
    setShowToast(false);
  };

  return (
    <>
    {/* <span className='fixed'> */}
      <Navbar />
      {/* </span> */}

      {showToast && (
       <div id="toast-interactive" className="w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:text-gray-400 toast-animation" role="alert">
    <div className="flex">
    <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:text-blue-300 dark:bg-blue-900">
    <svg className="w-6 h-6 flex items-center justify-center" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 0 0-9.5 9.5c0 4.45 3.26 8.14 7.6 9.21a1 1 0 0 0 .62.15.69.69 0 0 0 .58-.15C12.44 18.14 15.7 14.45 15.7 10a9.5 9.5 0 0 0-9.5-9.5ZM8.6 12.63a.93.93 0 0 1-.83-.73.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.29c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7a1 1 0 0 1 .12-.3.93.93 0 0 1-.83-.72.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7a1 1 0 0 1 .12-.3.93.93 0 0 1-.83-.72.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7Zm1.4-4.3a.93.93 0 0 1-.83-.73.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7a1 1 0 0 1 .12-.3.93.93 0 0 1-.83-.72.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7Zm0 0ZM8.6 12.63a.93.93 0 0 1-.83-.73.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7a1 1 0 0 1 .12-.3.93.93 0 0 1-.83-.72.91.91 0 0 1 .06-1.16c.3-.32.74-.48 1.21-.48.47 0 .91.16 1.22.48a.88.88 0 0 1 .04 1.16.9.9 0 0 1-.83.73 1 1 0 0 1 .12.3c.54 1.3 1.62 2.45 3 2.7a.69.69 0 0 0 .58.15 1 1 0 0 0 .62-.15c-1.38-.25-2.46-1.4-3-2.7Zm0 0Z"/>
    </svg>
    <span className="sr-only">Refresh icon</span>
</div>
        <div className="ms-3 text-sm font-normal">
            <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Explore best | It's Free</span>
            <div className="mb-2 text-sm font-normal">You can checkout the best visiting places near your city.</div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Link href="/BestPlaces">
                        <div className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">Let's Go</div>
                    </Link>
                </div>
                <div onClick={() => setShowToast(false)}>
                    <div className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Not now</div>
                </div>
            </div>
        </div>
    
              <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white items-center justify-center shrink-0 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" onClick={handleToastClose} aria-label="Close">
                  <span className="sr-only">Close</span>
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
              </button>
          </div>
        </div>
      )}

      {/* Your other code here */}

      {/* CSS for the animation */}
      <style jsx>{`
        .toast-animation {
          position: fixed;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          animation: slideDown 1s ease-out forwards;
        }

        @keyframes slideDown {
          0% {
            top: -50px;
          }
          100% {
            top: 20px;
          }
        }

        .toast-animation.toast-close {
          animation: slideUp 0.5s ease-in forwards;
        }

        @keyframes slideUp {
          0% {
            top: 20px;
          }
          100% {
            top: -50px;
          }
        }
      `}</style>

      <div>
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-center items-center px-4 dark:bg-gray-800 py-10">
          <div className="md:w-1/2 gap-6 md:gap-8 text-center md:text-left md:ml-20 ">
            <h1 className="font-bold text-4xl md:text-6xl dark:text-white leading-tight">
              Let's Explore <br />
              <span className="text-cyan-600">Wonderful</span> <br /> World's Beauty
            </h1>
            <p className="text-lg md:text-2xl text-gray-700 dark:text-white mt-4">
              Uncover hidden gems and create unforgettable memories. Your journey starts here. We offer curated travel experiences to inspire and delight.
            </p>
            <div className="flex justify-center md:justify-start gap-4 mt-6">
              <button className="px-6 py-3 bg-cyan-600 text-white rounded-full transition hover:bg-cyan-500">
                Book Now
              </button>
              <button className="px-6 py-3 font-medium border border-cyan-600 rounded-full text-cyan-600 hover:bg-cyan-100 transition">
                More Destinations
              </button>
            </div>
          </div>
          <div className="flex md:w-1/2 justify-center mt-8 md:mt-0">
            <img
              src="/traveler.jpg"
              alt="Traveler"
              className="rounded-lg w-full object-cover shadow-lg md:h-96 md:mt-40"
            />
          </div>
        </div>

        {/* Section 2: Featured Destinations */}
        <section className="bg-gray-50 dark:bg-gray-800 dark:opacity-95 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold dark:text-white text-center mb-8 text-gray-800">
              Featured Destinations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Destination 1 */}
              <div className="bg-white rounded-lg dark:bg-gray-900 shadow-md overflow-hidden">
                <img
                  src="/paris.jpg"
                  alt="Destination 1"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Paris, France</h3>
                  <p className="text-gray-700 dark:text-white">
                    Experience the romance of the Eiffel Tower and the charm of Parisian cafes.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Paris
                  </button>
                </div>
              </div>

              {/* Destination 2 */}
              <div className="bg-white rounded-lg dark:bg-gray-900 shadow-md overflow-hidden">
                <img
                  src="/tokyo.jpg"
                  alt="Destination 2"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Kyoto, Japan</h3>
                  <p className="text-gray-700 dark:text-white">
                    Discover ancient temples, serene gardens, and the beauty of Japanese culture.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Kyoto
                  </button>
                </div>
              </div>

              {/* Destination 3 */}
              <div className="bg-white rounded-lg dark:bg-gray-900 shadow-md overflow-hidden">
                <img
                  src="/pachu.jpg"
                  alt="Destination 3"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Machu Picchu, Peru</h3>
                  <p className="text-gray-700 dark:text-white">
                    Hike through breathtaking landscapes to the lost city of the Incas.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Machu Picchu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Religion Dialog */}
        {showReligionDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Please Share Your Details</h3>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              />
              
              <input
                type="text"
                placeholder="Enter your religion"
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              />

              {/* Favorite Places Dropdown */}
              <select
                value={favoritePlaces}
                onChange={(e) => setFavoritePlaces(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              >
                <option value="">Select your favorite type of place</option>
                <option value="Historical">Historical</option>
                <option value="Nature">Nature</option>
                <option value="Adventure">Adventure</option>
                <option value="Beaches">Beaches</option>
                <option value="Cultural">Cultural</option>
              </select>

              <label className="block mb-2 text-gray-700">Are you a believer of God?</label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    name="believerOfGod"
                    checked={believerOfGod}
                    onChange={() => setBelieverOfGod(true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="believerOfGod"
                    checked={!believerOfGod}
                    onChange={() => setBelieverOfGod(false)}
                  />
                  No
                </label>
              </div>

              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition mt-4"
              >
                Submit
              </button>
            </div>
          </div>
        )}


{showFeedbackDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-2xl font-semibold  text-gray-800">We value your feedback!</h3>
              <p className=' text-black font-mono mb-4'>Tell use something about your last trip from <span className='text-cyan-600'>{sourceTrip}</span> to <span className='text-cyan-600'>{destinationTrip}</span></p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please share your feedback"
                className="w-full px-4 py-2 dark:text-white text-black border border-gray-300 rounded-md mb-4"
              />
              <button
                onClick={handleFeedbackSubmit}
                className="px-6 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition mt-4"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}

      </div>






    </>
  );
};

export default Index;
