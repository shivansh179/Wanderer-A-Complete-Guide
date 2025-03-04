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
import { styled } from '@mui/material/styles';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch, { SwitchProps } from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';


const Index = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // Login modal state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();  // Destructure theme and setTheme from useTheme
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);  // Component is now mounted
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); // Set the authenticated user to state
        // console.log(user);
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

  const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#aab4be',
        ...theme.applyStyles('dark', {
          backgroundColor: '#8796A5',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#001e3c',
    width: 32,
    height: 32,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles('dark', {
      backgroundColor: '#003892',
    }),
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#aab4be',
    borderRadius: 20 / 2,
    ...theme.applyStyles('dark', {
      backgroundColor: '#8796A5',
    }),
  },
}));





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
                <button className={`px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full dark:text-black border-2 border-transparent`}>
                  Sign Up
                </button>
              </Link>
              <Link href="/Component/Login">
                <button className={`px-4 py-2 ${textColor} ${hoverBorderColor} transition rounded-full dark:text-black border-2 border-transparent`}>
                  Login
                </button>
              </Link>
            </>
          )}
          {mounted && (
            <button onClick={toggleTheme} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
              {theme === 'dark' ?
                <FormControlLabel
                  control={<MaterialUISwitch sx={{ m: 1 }} checked />}
                  label="Dark Mode"
                  onChange={toggleTheme}  // Attach the toggleTheme function to the onChange event
                /> : <FormControlLabel
                  control={<MaterialUISwitch sx={{ m: 1 }} />}
                  label="Light Mode"
                  onChange={toggleTheme}  // Attach the toggleTheme function to the onChange event
                />}
            </button>
          )}
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
              {mounted && (
                <button onClick={toggleTheme} className="w-full text-left px-4 py-2  font-semibold hover:bg-gray-100 rounded-md">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}
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