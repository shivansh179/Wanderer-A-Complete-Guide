"use client"

import React, { useEffect, useState } from 'react';
import { FaGoogle, FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from '../../FirebaseCofig';
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Select a random travel/adventure image from our curated collection
  useEffect(() => {
    // Array of high-quality travel images from your public assets folder
    const travelImages = [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1501761095094-94d36f57edbb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1510662145379-13537db782dc?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YWR2ZW50dXJlJTIwdHJhdmVsfGVufDB8fDB8fHww',
      'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWR2ZW50dXJlJTIwdHJhdmVsfGVufDB8fDB8fHww',
      
      'https://images.unsplash.com/photo-1471400974796-1c823d00a96f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',

      'https://images.unsplash.com/photo-1498889444388-e67ea62c464b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1522931698295-e7b4d3e4188f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1531141445733-14c2eb7d4c1f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fGFkdmVudHVyZSUyMHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D',
    ];
    
    // Select a random image from the array
    const randomImage = travelImages[Math.floor(Math.random() * travelImages.length)];
    setBackgroundImage(randomImage);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
      } else {
        // User is signed out
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle sign up or login
  const handleAuth = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        window.location.href = '/';
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!', {
          icon: '✨',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        window.location.href = '/';
      }
    } catch (error: any) { // Added type annotation for error
      const errorMessage = "something wrong in firebase. Visit console !"
      
      setError(errorMessage);
      toast.error(errorMessage, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
    setLoading(false);
  };

  // Sign up or log in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success(isSignUp ? 'Signed up with Google successfully!' : 'Logged in with Google successfully!', {
        icon: '🚀',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      window.location.href = '/';
    } catch (error: any) { // Added type annotation for error
      const errorMessage =  "something wrong in firebase. Visit console !";
        
      
      setError(errorMessage);
      toast.error(errorMessage, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
    setLoading(false);
  };

  // Toggle between sign-up and login forms
  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <div className="flex min-h-screen relative overflow-hidden">
        {/* Overlay for dark gradient on the entire page */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 opacity-90 z-0"></div>

        {/* Background particles effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white opacity-10"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Left Section (Form) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center md:pl-16 md:pr-10 p-8 z-10 relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {isSignUp ? 'Start Your Journey' : 'Welcome Back'}
              </h1>
              <p className="text-gray-300 text-lg">
                {isSignUp 
                  ? 'Create an account to discover the world' 
                  : 'Sign in to continue your adventure'}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleAuth}>
              {error && (
                <div className="bg-red-900/40 border border-red-600 text-white px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  className="pl-10 w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-200" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-200" />
                  )}
                </div>
              </div>

              {isSignUp && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="pl-10 w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="text-gray-400 hover:text-gray-200" />
                    ) : (
                      <FaEye className="text-gray-400 hover:text-gray-200" />
                    )}
                  </div>
                </div>
              )}

              {isSignUp && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
                    required
                  />
                  <label htmlFor="terms" className="text-gray-300 text-sm">
                    I accept the{' '}
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                      terms and conditions
                    </a>
                  </label>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition duration-300 ${
                  loading 
                    ? 'bg-blue-600/50 text-white/70 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-700" />
              <p className="mx-4 text-gray-400 text-sm">or continue with</p>
              <hr className="flex-grow border-gray-700" />
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <FaGoogle className="text-red-600" />
              <span>Google</span>
            </button>

            <p className="text-center mt-8 text-gray-400">
              {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
              <button
                type="button"
                onClick={toggleForm}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Section (Dynamic Image with Fallback) */}
        <div className="hidden md:block w-1/2 z-10">
          <div className="h-full w-full relative">
            {backgroundImage ? (
              <img
                src={backgroundImage}
                alt="Travel Adventure"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  // Fallback to a gradient if image fails to load
                  const target = e.target as HTMLImageElement; // Type assertion
                  target.style.display = 'none';
                  (target.parentNode as HTMLElement).classList.add('bg-gradient-to-br', 'from-blue-800', 'to-purple-900');
                }}
              />
            ) : (
              // Fallback gradient if no image is available
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-purple-900"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900/80"></div>
            
            {/* Inspirational Quote Overlay */}
            <div className="absolute bottom-16 left-16 right-16 text-white">
              <h2 className="text-3xl font-bold mb-3">Discover Your Next Adventure</h2>
              <p className="text-lg text-gray-200 max-w-md">
                {[
                  "The world is a book and those who do not travel read only one page.",
                  "Travel far enough, you meet yourself.",
                  "Adventure is worthwhile in itself.",
                  "Life is either a daring adventure or nothing at all.",
                  "To travel is to live.",
                  "Not all who wander are lost."
                ][Math.floor(Math.random() * 6)]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for floating animation */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0px) translateX(0px);
          }
        }
      `}</style>
      
      <Toaster position="top-right" />
    </>
  );
};

export default Login;