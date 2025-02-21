import React, { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from '../../FirebaseCofig'; // Ensure your FirebaseConfig is properly imported
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';


const Login = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Toggle between sign-up and login

  // Update cursor position
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see details
        console.log('User logged in:', user.email);
      } else {
        // User is signed out
        console.log('No user is logged in');
      }
    });
  
    return () => unsubscribe(); // Clean up listener
  }, []);

  // Handle sign up or login
  const handleAuth = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
        window.location.href = '/'; // Redirect after signup
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login Successfull")
        // alert('Logged in successfully!');
        window.location.href = '/'; // Redirect after login
      }
    } catch (error: any) {
      setError(error.message); // Show the error message
    }
  };

  // Sign up or log in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert(isSignUp ? toast.success('Signed up with Google successfully!') : toast.success('Logged in with Google successfully!'));
      window.location.href = '/'; // Redirect after Google Auth
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Toggle between sign-up and login forms
  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError(''); // Clear any previous errors when toggling
  };

  return (
    <>
    <div
      className="flex min-h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x * 200}% ${mousePosition.y * 200}%, rgba(0, 255, 255, 1), transparent)`,
        transition: 'background 0.1s ease',
      }}
    >
      {/* Left Section (Form) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center bg-gray-900 md:pl-20 md:pr-10 p-6 z-10">
        <div className="items-start">
          <h1 className="text-4xl font-bold text-white mb-6">{isSignUp ? 'Create an account' : 'Log in'}</h1>
          <p className="text-md text-white mb-8">
            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
            <button onClick={toggleForm} className="text-purple-600 hover:underline">
              {isSignUp ? 'Log in' : 'Create account'}
            </button>
          </p>

          {/* Form */}
          <form className="w-full max-w-xl space-y-6" onSubmit={handleAuth}>
            {error && <p className="text-red-500">{error}</p>}
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-5 py-4 rounded-lg text-gray-300 bg-gray-700 focus:outline-none cursor-pointer hover:border-2 hover:border-cyan-300 focus:border-purple-500 transition-colors duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-5 py-4 rounded-lg text-gray-300 bg-gray-700 focus:outline-none cursor-pointer hover:border-2 hover:border-cyan-300 focus:border-purple-500 transition-colors duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <div>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full px-5 py-4 rounded-lg text-gray-300 bg-gray-700 focus:outline-none cursor-pointer hover:border-2 hover:border-cyan-300 focus:border-purple-500 transition-colors duration-200"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {isSignUp && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="text-gray-400 text-sm">
                  I accept the{' '}
                  <a href="/terms" className="text-purple-600 hover:underline">
                    terms and conditions
                  </a>
                </label>
              </div>
            )}

            <button className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition duration-300">
              {isSignUp ? 'Create Account' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center justify-center my-6">
            <hr className="w-full border-gray-600" />
            <p className="mx-4 text-gray-500 text-sm whitespace-nowrap">or {isSignUp ? 'register' : 'login'} with</p>
            <hr className="w-full border-gray-600" />
          </div>

          <div className="flex justify-center space-x-4">
            <button
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white py-3 px-5 rounded-lg font-semibold transition duration-300"
              onClick={signInWithGoogle}
            >
              <FaGoogle /> Google
            </button>
          </div>
        </div>
      </div>

      {/* Right Section (Image) */}
      <div className="hidden md:flex w-1/2 justify-center items-center bg-gray-900 p-8 z-10">
        <img
          src="/traveler.jpg"
          alt="Login Illustration"
          className="rounded-lg shadow-lg max-h-full max-w-full h-120 object-cover"
        />
      </div>
    </div>
    <Toaster/>
    </>
  );
};

export default Login;
