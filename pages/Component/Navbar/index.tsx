import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { FaUserCircle } from 'react-icons/fa';
import { auth } from '@/FirebaseCofig';
import { signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { GiFeatheredWing } from "react-icons/gi";
import { IoIosArrowForward } from "react-icons/io";

const Index = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
 
const [user, setUser] = useState<User | null>(null); // ✅ Ensure proper type

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      setUser(firebaseUser); // ✅ Use Firebase User directly
    } else {
      setUser(null);
    }
  });

  return () => unsubscribe();
}, []);

{user && <span>{user.displayName || 'Guest'}</span>} 
  

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth); // Sign out from Firebase
      signOut(); // Sign out from NextAuth
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePlanClick = () => {
    if (user) {
      router.push("/Component/Planner");
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row p-6 w-full bg-white text-black justify-around items-center">
      <div className="w-full md:w-1/3 text-black font-bold text-2xl">
        <div className='flex gap-2'>
          <GiFeatheredWing className='text-cyan-600' />
          <h3 className='font-mono text-cyan-600'>Wanderer</h3>
        </div>
      </div>

      <div className="flex w-full md:w-1/3 justify-center space-x-4 mt-4 md:mt-0">
        <Link href="/">
          <button className="px-10 py-2 text-cyan-500 font-semibold hover:border-2 hover:border-cyan-600 transition rounded-full border border-transparent">
            Home
          </button>
        </Link>
        <button onClick={handlePlanClick} className="px-10 py-2 text-cyan-500 font-semibold hover:border-cyan-600 transition rounded-full border border-transparent">
          Plan
        </button>
      </div>

      <div className="flex w-full md:w-1/3 justify-center md:justify-end space-x-4 mt-4 md:mt-0">
        {user ? (
          <div className="relative">
            <button className="flex items-center space-x-2 text-black" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <FaUserCircle className="text-4xl text-cyan-800" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-fit bg-white border rounded-md shadow-lg z-10">
                <div className="px-4 py-2 text-gray-700 w-fit">
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
              <button className="px-4 py-2 text-black hover:text-cyan-600 transition rounded-full border-2 border-transparent hover:border-cyan-500">
                Sign Up
              </button>
            </Link>
            <Link href="/Component/Login">
              <button className="px-4 py-2 text-black hover:text-cyan-600 transition rounded-full border-2 border-transparent hover:border-cyan-500">
                Login
              </button>
            </Link>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold text-gray-800">Login Required</h2>
            <p className="text-gray-600 mt-2">You need to log in to access the Plan feature.</p>
            <div className="mt-4 flex justify-end">
              <Link href="/Component/Login">
                <button className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition" onClick={() => setShowModal(false)}>
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
