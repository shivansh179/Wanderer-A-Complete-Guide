"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { FaUserCircle, FaHome, FaMapMarkedAlt, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaCrown, FaStar, FaRocket, FaLeaf } from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import { auth } from '@/FirebaseCofig';
import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { styled } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { User as FirebaseUser } from 'firebase/auth';
import { Trip } from '@/types/types';



type SubscriptionType = 'free' | 'pro' | 'pro alpha' | 'pro super';

interface NavbarProps {
  user: FirebaseUser | null;
  loadPreviousTrip: (tripId: string) => Promise<void>;
  getUserTrips: () => Promise<Trip[]>;
  deleteTrip: (tripId: string) => Promise<boolean>;
}

const Index = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userSubscription, setUserSubscription] = useState<SubscriptionType>('free');

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user subscription from Firestore
        if (firebaseUser.email) {
          const db = getFirestore();
          const userDocRef = doc(db, 'users', firebaseUser.email);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Set subscription from Firestore data
            if (userData.subscriptions) {
              setUserSubscription(userData.subscriptions.toLowerCase());
            }
          }
        }
      } else {
        setUser(null);
        setUserSubscription('free');
      }
    });
    
    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
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

  const db = getFirestore();

  const handlePlanClick = async () => {
    if (user && user.email) {
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const subscriptionCount = userData?.planGenerationCount || 0;

        if (subscriptionCount <= 3 || user.email === 'prasantshukla89@gmail.com') {
          router.push("/Component/Planner");
          setIsMobileMenuOpen(false);
        } else {
          setShowModal(true);
        }
      } else {
        console.error("User document does not exist");
      }
    } else {
      setShowLoginModal(true);
      setIsMobileMenuOpen(false);
    }
  };

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
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      backgroundColor: '#aab4be',
      borderRadius: 20 / 2,
    },
  }));

  // Dynamic styles based on theme and scroll
  const headerBg = 
    theme === 'dark' 
      ? scrolled ? 'bg-gray-900/90 backdrop-blur-md' : 'bg-transparent' 
      : scrolled ? 'bg-white/90 backdrop-blur-md' : 'bg-transparent';
  
  const headerShadow = scrolled ? 'shadow-lg' : '';
  const textColor = theme === 'dark' ? 'text-white' : scrolled ? 'text-gray-900' : 'text-white';
  const logoColor = theme === 'dark' ? 'text-blue-400' : scrolled ? 'text-blue-600' : 'text-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const buttonBg = 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700';
  const ghostButton = theme === 'dark' 
    ? 'hover:bg-white/10' 
    : scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20';

  // Plan configuration with icons, colors, and styles
  const planConfig = {
    free: {
      icon: <FaLeaf className="mr-2" />,
      name: "Free",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      borderColor: "border-green-400 dark:border-green-700",
      textColor: "text-green-700 dark:text-green-400",
      hoverBg: "hover:bg-green-100 dark:hover:bg-green-900/50",
      shadow: "shadow-sm hover:shadow-md hover:shadow-green-200/30",
      animation: ""
    },
    pro: {
      icon: <FaCrown className="mr-2" />,
      name: "Pro",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-500 dark:border-blue-700",
      textColor: "text-blue-700 dark:text-blue-400",
      hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
      shadow: "shadow-sm hover:shadow-md hover:shadow-blue-200/30",
      animation: ""
    },
    "pro alpha": {
      icon: <FaStar className="mr-2" />,
      name: "Pro Alpha",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      borderColor: "border-purple-500 dark:border-purple-700",
      textColor: "text-purple-700 dark:text-purple-400",
      hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/50",
      shadow: "shadow-sm hover:shadow-md hover:shadow-purple-200/30",
      animation: ""
    },
    "pro super": {
      icon: <FaRocket className="mr-2" />,
      name: "Pro Super",
      bgColor: "bg-pink-50 dark:bg-pink-900/30",
      borderColor: "border-pink-500 dark:border-pink-700",
      textColor: "text-pink-700 dark:text-pink-400",
      hoverBg: "hover:bg-pink-100 dark:hover:bg-pink-900/50",
      shadow: "shadow-sm hover:shadow-md hover:shadow-pink-200/30",
      animation: "animate-pulse"
    }
  };

  // Get current plan config or default to free
  const currentPlan = planConfig[userSubscription] || planConfig.free;

  return (
    <div className="fixed w-full z-50 text-gray-800 transition-all duration-300">
      <header className={`${headerBg} ${headerShadow} transition-all duration-300`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 transition duration-300">
                <svg 
                  className={`w-8 h-8 ${logoColor}`} 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12.9,2.6l6.8,3.9c0.7,0.4,1.2,1.2,1.2,2v14.4c0,1.3-1.4,2.2-2.6,1.5L12,20.9l-6.4,3.5C4.5,25,3,24.2,3,22.9V8.5 c0-0.8,0.4-1.6,1.2-2l6.8-3.9C11.4,2.2,12.5,2.2,12.9,2.6z M12,4.8L6.9,7.6v11.5l5.1-2.8V4.8z M14,16.3l5.1,2.8V7.6L14,4.8 V16.3z"/>
                </svg>
                <span className={`text-xl font-bold ${logoColor}`}>Wanderer</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <div className={`px-4 py-2 ${textColor} ${ghostButton} rounded-full font-medium flex items-center gap-2 transition duration-200`}>
                  <FaHome className="text-lg" />
                  <span>Home</span>
                </div>
              </Link>
              <div 
                onClick={handlePlanClick}
                className={`px-4 py-2 ${textColor} ${ghostButton} rounded-full font-medium flex items-center gap-2 transition duration-200 cursor-pointer`}
              >
                <FaMapMarkedAlt className="text-lg" />
                <span>Plan Your Trip</span>
              </div>
            </div>

            {/* Desktop User Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full ${ghostButton} ${textColor}`} 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium hidden lg:inline">{user.email?.split('@')[0]}</span>
                    </div>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
                        <p className="text-sm text-gray-900 dark:text-white truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/profile">
                          <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <FaUserCircle />
                            <span>Your Profile</span>
                          </div>
                        </Link>


                    <Link href="/BestPlaces">
              <div 
                
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
              >
                 <span className="font-medium">Explore best places</span>
              </div>
              </Link>

              
                        <Link href="/my-trips">
                          <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <FaMapMarkedAlt />
                            <span>My Trips</span>
                          </div>
                        </Link>
                      </div>
                      <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                        <button 
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <FaSignOutAlt />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/Component/Login">
                    <div className={`px-4 py-2 ${textColor} ${ghostButton} rounded-full font-medium flex items-center gap-2 transition duration-200`}>
                      <FaSignInAlt />
                      <span>Log in</span>
                    </div>
                  </Link>
                  <Link href="/Component/Login">
                    <div className={`px-5 py-2 ${buttonBg} text-white rounded-full font-medium shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2`}>
                      <FaUserPlus />
                      <span>Sign up</span>
                    </div>
                  </Link>
                </>
              )}
              
              {mounted && (
                <div className="px-3">
                  <FormControlLabel
                    control={
                      <MaterialUISwitch 
                        sx={{ m: 1 }} 
                        checked={theme === 'dark'} 
                        onChange={toggleTheme}
                      />
                    }
                    label=""
                  />
                </div>
              )}

              {/* Subscription Plan Display */}
              <Link href="/Subscription">
                <div className="flex items-center">
                  {/* Current Plan Badge */}
                  <div className={`
                    px-4 py-2 rounded-full 
                    ${currentPlan.bgColor} 
                    ${currentPlan.borderColor} 
                    ${currentPlan.textColor} 
                    ${currentPlan.hoverBg}
                    ${currentPlan.shadow}
                    ${currentPlan.animation}
                    border font-medium transition-all duration-300 flex items-center
                  `}>
                    {currentPlan.icon}
                    <span>{currentPlan.name}</span>
                  </div>
                  
                  {/* Upgrade Button - only show if not on highest plan */}
                  {userSubscription !== 'pro super' && (
                    <div className="ml-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center">
                      <span>Upgrade</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-full ${ghostButton} ${textColor}`}
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-xl border-t border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="container mx-auto p-4">
            <nav className="">
              {/* Current Plan Badge for Mobile */}
              <Link href="/Subscription">
                <div className={`
                  px-4 py-3 rounded-lg 
                  ${currentPlan.bgColor} 
                  ${currentPlan.borderColor} 
                  ${currentPlan.textColor} 
                  ${currentPlan.hoverBg}
                  ${currentPlan.shadow}
                  ${currentPlan.animation}
                  border font-medium transition-all duration-300 flex items-center justify-between
                `}>
                  <div className="flex items-center">
                    {currentPlan.icon}
                    <span>{currentPlan.name} Plan</span>
                  </div>
                  {userSubscription !== 'pro super' && (
                    <span className="text-xs bg-white/20 dark:bg-black/20 px-2 py-1 rounded-full">
                      Upgrade Available
                    </span>
                  )}
                </div>
              </Link>
            
              <Link href="/">
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <FaHome className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Home</span>
                </div>
              </Link>
              
              <div 
                onClick={handlePlanClick}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
              >
                <FaMapMarkedAlt className="text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Plan Your Trip</span>
              </div>

                    <Link href="/BestPlaces">
              <div 
                
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
              >
                 <span className="font-medium">Explore best places</span>
              </div>
              </Link>
              
              {user ? (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                  <div className="px-4 py-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
                    <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Link href="/profile">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
                        <FaUserCircle className="text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Your Profile</span>
                      </div>
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                    >
                      <FaSignOutAlt />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-3">
                  <Link href="/Component/Login">
                    <div 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <FaSignInAlt className="text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Log in</span>
                    </div>
                  </Link>
                  
                  <Link href="/Component/Login">
                    <div 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                      <FaUserPlus className="text-white" />
                      <span className="font-medium">Sign up</span>
                    </div>
                  </Link>
                </div>
              )}
              
              {/* Theme toggle for mobile */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
                  {mounted && (
                    <MaterialUISwitch 
                      checked={theme === 'dark'} 
                      onChange={toggleTheme}
                    />
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Subscription Limit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FaCrown className="text-yellow-600 dark:text-yellow-500 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Subscription Limit Reached</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You've reached the maximum number of plans for your current subscription.
              </p>
            </div>
            
            <div className="space-y-4">
              <Link href="/Subscription">
                <div className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg text-center">
                  Upgrade Your Plan
                </div>
              </Link>
              
              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FaUserCircle className="text-blue-600 dark:text-blue-500 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Login Required</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Please log in or create an account to plan your trip.
              </p>
            </div>
            
            <div className="space-y-4">
              <Link href="/Component/Login">
                <div className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg text-center">
                  Log In
                </div>
              </Link>
              
              <Link href="/Component/Login">
                <div className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                  Sign Up
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
