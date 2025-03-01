"use client"

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { FaCreditCard } from 'react-icons/fa';
import { IoMdCheckmark } from 'react-icons/io';

// You should replace this with your Stripe public key
const stripePromise = loadStripe("YOUR_STRIPE_PUBLIC_KEY");

const Subscription = () => {
  const [plan, setPlan] = useState('basic'); // Default to basic plan
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle the Stripe checkout
  // const handleSubscribe = async () => {
  //   setLoading(true);

  //   try {
  //     // Create a checkout session using the selected plan
  //     const response = await fetch('/api/create-checkout-session', {
  //       method: 'POST',
  //       body: JSON.stringify({ plan }),
  //     });

  //     const session = await response.json();

  //     // Redirect to Stripe Checkout
  //     const stripe = await stripePromise;
  //     // const { error } = await stripe.redirectToCheckout({
  //       sessionId: session.id,
  //     });

  //     if (error) {
  //       console.error("Stripe Checkout error:", error);
  //       alert('Something went wrong. Please try again!');
  //     }

  //   } catch (error) {
  //     console.error("Error during subscription:", error);
  //     alert('Something went wrong. Please try again!');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center text-cyan-800 mb-8">Choose Your Plan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
        {/* Basic Plan */}
        <div
          className={`p-6 rounded-xl shadow-xl cursor-pointer transform transition duration-300 ease-in-out ${plan === 'basic' ? 'bg-cyan-100' : 'bg-white'} hover:scale-105 hover:shadow-2xl`}
          onClick={() => setPlan('basic')}
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-cyan-800">Basic Plan</h2>
            <p className="text-lg text-gray-600 mt-2">$5/month</p>
          </div>
          <div className="mt-6 flex justify-center">
            {plan === 'basic' && <IoMdCheckmark className="text-green-500 text-2xl" />}
          </div>
        </div>

        {/* Premium Plan */}
        <div
          className={`p-6 rounded-xl shadow-xl cursor-pointer transform transition duration-300 ease-in-out ${plan === 'premium' ? 'bg-cyan-100' : 'bg-white'} hover:scale-105 hover:shadow-2xl`}
          onClick={() => setPlan('premium')}
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-cyan-800">Premium Plan</h2>
            <p className="text-lg text-gray-600 mt-2">$15/month</p>
          </div>
          <div className="mt-6 flex justify-center">
            {plan === 'premium' && <IoMdCheckmark className="text-green-500 text-2xl" />}
          </div>
        </div>

        {/* Additional Plans */}
        <div
          className={`p-6 rounded-xl shadow-xl cursor-pointer transform transition duration-300 ease-in-out ${plan === 'enterprise' ? 'bg-cyan-100' : 'bg-white'} hover:scale-105 hover:shadow-2xl`}
          onClick={() => setPlan('enterprise')}
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-cyan-800">Enterprise Plan</h2>
            <p className="text-lg text-gray-600 mt-2">$50/month</p>
          </div>
          <div className="mt-6 flex justify-center">
            {plan === 'enterprise' && <IoMdCheckmark className="text-green-500 text-2xl" />}
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <div className="flex justify-center mb-8">
        <button
          // onClick={handleSubscribe}
          disabled={loading}
          className={`px-8 py-3 text-white rounded-md bg-cyan-700 hover:bg-cyan-600 transition-all duration-300 ${loading && 'opacity-50 cursor-not-allowed'}`}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>

      {/* Payment Methods */}
      <div className="text-center mt-8">
        <h2 className="text-xl font-semibold text-cyan-800">We Accept</h2>
        <div className="flex justify-center gap-6 mt-4">
          <FaCreditCard className="text-4xl text-gray-600" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Stripe_logo%2C_2020.svg/600px-Stripe_logo%2C_2020.svg.png" alt="Stripe Logo" className="w-24" />
        </div>
      </div>

      {/* Additional Information */}
      <div className="text-center mt-10 text-gray-600">
        <p className="mb-4">Your subscription will be billed monthly. You can cancel anytime from your account settings.</p>
      </div>
    </div>
  );
};

export default Subscription;
