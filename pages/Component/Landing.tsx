import React, { useState, useEffect } from 'react';
import Navbar from '@/pages/Component/Navbar';
import { auth, onAuthStateChanged } from '@/FirebaseCofig'; // Import Firebase Auth
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore methods
import { User } from 'firebase/auth';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showReligionDialog, setShowReligionDialog] = useState(false);
  const [name, setName] = useState('');
  const [religion, setReligion] = useState('');
  const [favoritePlaces, setFavoritePlaces] = useState('');
  const [believerOfGod, setBelieverOfGod] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        const db = getFirestore(); // Get Firestore instance
        const userDocRef = doc(db, 'users', user.email || 'default-email');
        const docSnapshot = await getDoc(userDocRef);

        if (!docSnapshot.exists()) {
          // User is new, show the dialog to ask for more details
          setIsNewUser(true);
          setShowReligionDialog(true);
        } else {
          // User has entries in Firestore
          setIsNewUser(false);
        }
      } else {
        // User is not logged in
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <>
      <Navbar />
      <div>
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-center items-center px-4 py-10">
          <div className="md:w-1/2 gap-6 md:gap-8 text-center md:text-left md:ml-20 ">
            <h1 className="font-bold text-4xl md:text-6xl leading-tight">
              Let's Explore <br />
              <span className="text-cyan-600">Wonderful</span> <br /> World's Beauty
            </h1>
            <p className="text-lg md:text-2xl text-gray-700 mt-4">
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
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
              Featured Destinations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Destination 1 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/paris.jpg"
                  alt="Destination 1"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Paris, France</h3>
                  <p className="text-gray-700">
                    Experience the romance of the Eiffel Tower and the charm of Parisian cafes.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Paris
                  </button>
                </div>
              </div>

              {/* Destination 2 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/tokyo.jpg"
                  alt="Destination 2"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Kyoto, Japan</h3>
                  <p className="text-gray-700">
                    Discover ancient temples, serene gardens, and the beauty of Japanese culture.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 transition">
                    Explore Kyoto
                  </button>
                </div>
              </div>

              {/* Destination 3 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src="/pachu.jpg"
                  alt="Destination 3"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Machu Picchu, Peru</h3>
                  <p className="text-gray-700">
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
      </div>
    </>
  );
};

export default Index;
