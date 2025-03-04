"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { FaUserCircle } from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import { auth } from '@/FirebaseCofig';
import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { GiFeatheredWing } from "react-icons/gi";
import { IoIosArrowForward } from "react-icons/io";
import { doc, getDoc, getFirestore } from 'firebase/firestore';  // Firestore functions
import { useTheme } from 'next-themes'; // Import useTheme hook

const Index = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // Login modal state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();  // Destructure theme and setTheme from useTheme


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); // Set the authenticated user to state
        console.log(user);
      } else {
        setUser(null); // Clear user state if not authenticated
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      signOut();
      setUser(null);
      setDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const db = getFirestore(); // Firestore instance

  // Plan Click handler: Check subscription status before navigating
  const handlePlanClick = async () => {
    if (user && user.email) {  // Check if user is authenticated and email is not null
      // Fetch user data from Firestore to check the 'subscribed' field
      const userDocRef = doc(db, 'users', user.email); // Assuming the user document is identified by email
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const subscriptionCount = userData?.planGenerationCount || 0;  // Default to 0 if 'subscribed' field is missing


        if (subscriptionCount <= 3 || user.email === 'prasantshukla89@gmail.com') {
          // If subscription count is less than 3, allow user to go to the plan page

          router.push("/Component/Planner");
          setIsMobileMenuOpen(false);
        } else {
          // Otherwise, show a warning that the free trial is over
          setShowModal(true); // Show the modal for expired subscription
        }
      } else {
        console.error("User document does not exist");
      }
    } else {
      // If user is not logged in, show login required modal
      setShowLoginModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Styles that change based on the theme
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  const borderColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
  const hoverBorderColor = theme === 'dark' ? 'hover:border-cyan-500' : 'hover:border-cyan-700';
  const shadowColor = theme === 'dark' ? 'shadow-gray-700' : 'shadow-md'; // Added shadow color

  return (
    <div className='fixed w-full '>
      <header className={`flex justify-between items-center p-6 bg-white `}>
        {/* Logo */}
        <Link href='/'>
          <div className="flex items-center gap-2">
            <GiFeatheredWing className='text-cyan-700 text-2xl ' />
            <h3 className='font-mono text-cyan-700 text-2xl '>Wanderer</h3>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <button className={`px-10 py-2 text-cyan-500 font-semibold ${hoverBorderColor} transition rounded-full border border-transparent`}>
              Home
            </button>
          </Link>
          <button onClick={handlePlanClick} className={`px-10 py-2 text-cyan-500 font-semibold ${hoverBorderColor} transition rounded-full border border-transparent`}>
            Plan
          </button>
        </div>

        {/* Desktop User Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button className="flex items-center space-x-2 text-black" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <FaUserCircle className="text-4xl text-cyan-800" />
              </button>
              {dropdownOpen && (
                <div className={`absolute right-0 mt-2 w-fit ${bgColor} ${borderColor} rounded-md ${shadowColor} z-10 border`}>
                  <div className={`px-4 py-2 ${textColor}`}>
                    <span>{user.email}</span>
                  </div>
                  <hr className={borderColor} />
                  <button className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/Component/Login">
                <button className={`px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full border-2 border-transparent`}>
                  Sign Up
                </button>
              </Link>
              <Link href="/Component/Login">
                <button className={`px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full border-2 border-transparent`}>
                  Login
                </button>
              </Link>
            </>
          )}
          <button onClick={toggleTheme} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Mobile Menu Toggle Button (Right Most) */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>
      <hr className={borderColor} />

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className={`md:hidden ${bgColor} ${shadowColor} p-4`}>
          <ul className="flex flex-col gap-4">
            <li>
              <Link href="/">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-2 text-cyan-700 font-semibold ${hoverBorderColor} transition rounded-full border border-transparent`}
                >
                  Home
                </button>
              </Link>
            </li>
            <li>
              <button
                onClick={handlePlanClick}
                className={`w-full text-left px-4 py-2 text-cyan-700 font-semibold ${hoverBorderColor} transition rounded-full border border-transparent`}
              >
                Plan
              </button>
            </li>
            {user ? (
              <li>
                <div className="flex flex-col gap-2">
                  <span className={`px-4 py-2 ${textColor}`}>{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 font-semibold hover:bg-gray-100 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </li>
            ) : (
              <>
                <li>
                  <Link href="/Component/Login">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full text-left px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full border-2 border-transparent`}
                    >
                      Sign Up
                    </button>
                  </Link>
                </li>
                <li>
                  <Link href="/Component/Login">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full text-left px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full border-2 border-transparent`}
                    >
                      Login
                    </button>
                  </Link>
                </li>
              </>
            )}
            <li>
              <button onClick={toggleTheme} className="w-full text-left px-4 py-2  font-semibold hover:bg-gray-100 rounded-md">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </li>
          </ul>

        </nav>
      )}

      {/* Modal for Expired Subscription */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md ${bgColor} ${textColor}`}>
            <h2 className="text-lg font-semibold text-gray-800">Subscription Expired</h2>
            <p className="text-gray-600 mt-2">Your free trial is over. Please subscribe to continue using the service.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowModal(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md mr-2">
                Close
              </button>
              <Link href="/subscribe">
                <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md">
                  Subscribe
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Login Required */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md ${bgColor} ${textColor}`}>
            <h2 className="text-lg font-semibold text-gray-800">Login Required</h2>
            <p className="text-gray-600 mt-2">You need to log in to access this feature. Please log in to continue.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowLoginModal(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md mr-2">
                Close
              </button>
              <Link href="/Component/Login">
                <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md">
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;