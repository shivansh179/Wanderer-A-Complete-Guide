"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/FirebaseCofig";
import { FaCheckCircle } from "react-icons/fa";

type Plan = {
  name: string;
  price: string;
  priceVal: number;
  description: string;
  benefits: string[];
  cta: string;
};

const plansData: Plan[] = [
  { name: "Free", price: "₹0", priceVal: 0, description: "Perfect for getting started.", benefits: ["Basic analytics", "Community support", "3 Plan Generations"], cta: "Get Started" },
  { name: "Pro", price: "₹499", priceVal: 499, description: "For professionals who need more.", benefits: ["All Free features", "Advanced analytics", "Email support", "10 Plan Generations"], cta: "Upgrade to Pro" },
  { name: "Pro Alpha", price: "₹1,299", priceVal: 1299, description: "Early access and premium tools.", benefits: ["All Pro features", "Beta access", "Dedicated onboarding", "25 Plan Generations"], cta: "Go Pro Alpha" },
  { name: "Pro Super", price: "₹2,999", priceVal: 2999, description: "For teams that demand the best.", benefits: ["All Pro Alpha features", "24/7 support", "Unlimited Generations", "API access"], cta: "Become Super" },
];

const auth = getAuth(app);
const db = getFirestore(app);

const SubscriptionPage = () => {
    const [userDbSubscription, setUserDbSubscription] = useState<string>("Free");
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(true);
            if (firebaseUser?.email) {
                const userDocRef = doc(db, "users", firebaseUser.email);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const dbSub = userDocSnap.data().subscriptions || "Free";
                    setUserDbSubscription(dbSub);
                }
            } else {
                setUserDbSubscription("Free");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePlanSelect = async (planName: string) => {
        if (!user || !user.email || isUpdating) return;
        setIsUpdating(true);
        try {
            await setDoc(doc(db, "users", user.email), { subscriptions: planName }, { merge: true });
            setUserDbSubscription(planName);
            alert("Subscription updated successfully!");
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("Failed to update subscription.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <main className="flex-1 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
                            Find the Perfect Plan
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Flexible pricing for individuals and teams. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {plansData.map((plan) => {
                                const isCurrentPlan = userDbSubscription === plan.name;
                                const planPriceVal = plan.priceVal;
                                const userPriceVal = plansData.find(p => p.name === userDbSubscription)?.priceVal ?? 0;

                                return (
                                    <div
                                        key={plan.name}
                                        className={`relative flex flex-col p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-2 ${isCurrentPlan ? 'border-sky-500 shadow-sky-500/20 shadow-2xl' : 'border-slate-200 dark:border-slate-700 hover:border-sky-400'}`}
                                    >
                                        {isCurrentPlan && (
                                            <div className="absolute top-0 right-0 -mt-3 -mr-3">
                                                <div className="bg-sky-500 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-md">
                                                    Current Plan
                                                </div>
                                            </div>
                                        )}
                                        <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-6 min-h-[40px]">{plan.description}</p>
                                        <div className="flex items-baseline mb-8">
                                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                                            {plan.name !== "Free" && <span className="ml-1.5 text-slate-500 dark:text-slate-400">/month</span>}
                                        </div>
                                        <ul className="mb-8 space-y-3 text-left text-slate-600 dark:text-slate-300 flex-grow">
                                            {plan.benefits.map((benefit) => (
                                                <li key={benefit} className="flex items-center space-x-2.5">
                                                    <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handlePlanSelect(plan.name)}
                                            disabled={isUpdating || isCurrentPlan || !user}
                                            className={`mt-auto w-full px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                isCurrentPlan
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                    : planPriceVal < userPriceVal ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'
                                            }`}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : (planPriceVal < userPriceVal ? 'Downgrade' : 'Upgrade')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SubscriptionPage;