"use client"; // Assuming Next.js App Router, add if needed

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../../FirebaseCofig"; // Adjust path as needed
import Navbar from "../Component/Navbar/index";

type Plan = {
  name: string;
  price: string;
  description: string;
  benefits: string[];
};

const plansData: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for individuals getting started.",
    benefits: [
      "Basic analytics",
      "Community support",
      "Single user",
      "Limited features",
    ],
  },
  {
    name: "Pro",
    price: "₹499", // Removed /mo for separate styling
    description: "For professionals who need more power.",
    benefits: [
      "All Free features",
      "Advanced analytics",
      "Priority email support",
      "Up to 3 users",
      "Custom reports",
    ],
  },
  {
    name: "Pro Alpha",
    price: "₹1,299", // Removed /mo
    description: "Early access to new features and premium tools.",
    benefits: [
      "All Pro features",
      "Beta access to new tools",
      "Dedicated onboarding",
      "Up to 10 users",
      "API access",
    ],
  },
  {
    name: "Pro Super",
    price: "₹2,999", // Removed /mo
    description: "For teams that demand the best.",
    benefits: [
      "All Pro Alpha features",
      "24/7 phone & chat support",
      "Unlimited users",
      "Custom integrations",
      "Personal account manager",
    ],
  },
];

const auth = getAuth(app);
const db = getFirestore(app);

const SubscriptionPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>("Free"); // Plan clicked in UI
  const [userDbSubscription, setUserDbSubscription] = useState<string>("Free"); // Plan from DB
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // For button loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true); // Start loading when auth state changes

      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email;
        try {
          const userDocRef = doc(db, "users", email);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const dbSub = userData.subscriptions || "Free";
            setUserDbSubscription(dbSub);
            setSelectedPlan(dbSub); // Initially, UI selected plan is the DB one
          } else {
            // User document doesn't exist, default to Free
            setUserDbSubscription("Free");
            setSelectedPlan("Free");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserDbSubscription("Free");
          setSelectedPlan("Free");
        }
      } else {
        // No user or no email, default to Free
        setUserDbSubscription("Free");
        setSelectedPlan("Free");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePlanSelect = async (planName: string) => {
    // If already updating, or plan is already the DB subscription, do nothing (or allow re-selection for UI effect)
    if (isUpdating) return;
    
    // Optimistically update UI
    const previousSelectedPlan = selectedPlan;
    setSelectedPlan(planName);

    if (user && user.email && planName !== userDbSubscription) {
      setIsUpdating(true);
      try {
        await setDoc(
          doc(db, "users", user.email),
          { subscriptions: planName },
          { merge: true }
        );
        setUserDbSubscription(planName); // Update DB subscription state on success
        console.log("Subscription updated successfully to:", planName);
      } catch (error) {
        console.error("Error updating subscription:", error);
        setSelectedPlan(previousSelectedPlan); // Revert UI on error
        // Optionally show an error message to the user
      } finally {
        setIsUpdating(false);
      }
    } else if (!user || !user.email) {
        console.warn("Cannot update subscription: User not logged in or email missing.");
        // If you want to allow UI selection even when not logged in:
        // setSelectedPlan(planName); 
        // But typically, subscription changes require login.
        // For now, this just updates the selectedPlan state if not logged in for UI feel.
    }
  };

  return (
    <>
    <Navbar/>
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 text-gray-800">
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl mt-10 sm:text-5xl font-extrabold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Flexible pricing for individuals and teams. Upgrade or downgrade anytime.
            </p>
            {user && user.email && (
              <p className="text-md text-indigo-600 mt-4">
                Logged in as: {user.email}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {plansData.map((plan) => {
                const isUiSelected = selectedPlan === plan.name; // Plan currently clicked/focused in UI
                const isCurrentDbPlan = userDbSubscription === plan.name; // Actual plan in DB

                let cardClasses = `relative flex flex-col p-6 bg-white rounded-xl border-2 text-center transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl`;
                let titleColor = "text-gray-900";
                let buttonClasses = `mt-auto w-full px-6 py-3 rounded-lg font-semibold transition-colors duration-200`;
                let buttonText = plan.name === "Free" ? "Get Started" : "Choose Plan";

                if (isUiSelected) {
                  cardClasses += " border-indigo-500 scale-105 shadow-indigo-200/80";
                  titleColor = "text-indigo-600";
                  buttonClasses += " bg-indigo-600 text-white hover:bg-indigo-700";
                  buttonText = "Selected";
                  if (isCurrentDbPlan) buttonText = "Current Plan"; // If UI selected is also DB plan
                } else if (isCurrentDbPlan) {
                  cardClasses += " border-teal-500 shadow-teal-100/70";
                  titleColor = "text-teal-600";
                  buttonClasses += " bg-teal-500 text-white hover:bg-teal-600";
                  buttonText = "Current Plan";
                } else {
                  cardClasses += " border-gray-200 hover:border-gray-300";
                  buttonClasses += " bg-gray-800 text-white hover:bg-gray-900";
                }
                
                return (
                  <div
                    key={plan.name}
                    onClick={() => handlePlanSelect(plan.name)}
                    className={cardClasses}
                  >
                    {isCurrentDbPlan && !isUiSelected && (
                      <div className="absolute top-0 right-0 bg-teal-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                        Current
                      </div>
                    )}
                     {isUiSelected && isCurrentDbPlan && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                        Current
                      </div>
                    )}


                    <h3 className={`mb-3 text-2xl font-bold ${titleColor}`}>
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm min-h-[40px]">{plan.description}</p>
                    <div className="flex justify-center items-baseline mb-8">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.name !== "Free" && (
                        <span className="ml-1.5 text-gray-500 text-sm">
                          /month
                        </span>
                      )}
                    </div>
                    <ul className="mb-8 space-y-3 text-left text-sm text-gray-600 flex-grow">
                      {plan.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center space-x-2.5"
                        >
                          <svg
                            className="w-5 h-5 text-green-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={buttonClasses}
                      disabled={isUpdating && selectedPlan === plan.name}
                    >
                      {isUpdating && selectedPlan === plan.name ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
                      ) : (
                        buttonText
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <span className="font-bold text-lg text-white">YourCompany</span> © {new Date().getFullYear()}
            </div>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default SubscriptionPlans;