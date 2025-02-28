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

const Index = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
 
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
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

  const handlePlanClick = () => {
    if (user) {
      router.push("/Component/Planner");
      setIsMobileMenuOpen(false);
    } else {
      setShowModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center p-6 bg-white text-black">
        {/* Logo */}
        <Link href='/'>
        <div className="flex items-center gap-2">
        
            <GiFeatheredWing className='text-cyan-700 text-2xl' />
            <h3 className='font-mono text-cyan-700 text-2xl'>Wanderer</h3>
         
        </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/">
            <button className="px-10 py-2 text-cyan-500 font-semibold hover:border-2 hover:border-cyan-700 transition rounded-full border border-transparent">
              Home
            </button>
          </Link>
          <button onClick={handlePlanClick} className="px-10 py-2 text-cyan-500 font-semibold hover:border-cyan-700 transition rounded-full border border-transparent">
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
                <div className="absolute right-0 mt-2 w-fit bg-white border rounded-md shadow-lg z-10">
                  <div className="px-4 py-2 text-gray-700">
                    <span>{user.email}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <button className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/Component/Login">
                <button className="px-4 py-2 text-black hover:text-cyan-700 transition rounded-full border-2 border-transparent hover:border-cyan-500">
                  Sign Up
                </button>
              </Link>
              <Link href="/Component/Login">
                <button className="px-4 py-2 text-black hover:text-cyan-700 transition rounded-full border-2 border-transparent hover:border-cyan-500">
                  Login
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button (Right Most) */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white shadow-md p-4">
          <ul className="flex flex-col gap-4">
            <li>
              <Link href="/">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-2 text-cyan-700 font-semibold hover:border-2 hover:border-cyan-700 transition rounded-full border border-transparent"
                >
                  Home
                </button>
              </Link>
            </li>
            <li>
              <button
                onClick={handlePlanClick}
                className="w-full text-left px-4 py-2 text-cyan-700 font-semibold hover:border-2 hover:border-cyan-700 transition rounded-full border border-transparent"
              >
                Plan
              </button>
            </li>
            {user ? (
              <li>
                <div className="flex flex-col gap-2">
                  <span className="px-4 py-2 text-gray-700">{user.email}</span>
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
                      className="w-full text-left px-4 py-2 text-black hover:text-cyan-700 transition rounded-full border-2 border-transparent hover:border-cyan-500"
                    >
                      Sign Up
                    </button>
                  </Link>
                </li>
                <li>
                  <Link href="/Component/Login">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-black hover:text-cyan-700 transition rounded-full border-2 border-transparent hover:border-cyan-500"
                    >
                      Login
                    </button>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Login Required</h2>
            <p className="text-gray-600 mt-2">You need to log in to access the Plan feature.</p>
            <div className="mt-4 flex justify-end">
              <Link href="/Component/Login">
                <button className="flex items-center px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-700 transition" onClick={() => setShowModal(false)}>
                  Login <IoIosArrowForward className="ml-2" />
                </button>
              </Link>
              <button className="ml-2 px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
