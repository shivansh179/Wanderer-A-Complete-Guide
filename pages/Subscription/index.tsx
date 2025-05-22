import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../../FirebaseCofig"; // <-- adjust path as needed

type Plan = {
  name: string;
  price: string;
  description: string;
  benefits: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
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
    price: "₹499/mo",
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
    price: "₹1,299/mo",
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
    price: "₹2,999/mo",
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
  const [selectedPlan, setSelectedPlan] = useState<string>("Free");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user and subscription on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get user email from Firebase Auth
        const email = firebaseUser?.providerData[0].email;
        setUserEmail(email || null);
        
        if (email) {
          console.log("Current user email:", email);
          
          try {
            // Query Firestore users collection using email as document ID
            const userDoc = await getDoc(doc(db, "users", email));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data from Firestore:", userData);
              
              // Check if user has a subscription field
              if (userData.subscriptions) {
                console.log("User subscription:", userData.subscriptions);
                setSelectedPlan(userData.subscriptions);
                
                // Update the highlight property in plans array based on user's subscription
                plans.forEach(plan => {
                  plan.highlight = plan.name === userData.subscriptions;
                });
              } else {
                console.log("User has no subscription, defaulting to Free plan");
                setSelectedPlan("Free");
                plans[0].highlight = true; // Highlight Free plan by default
              }
            } else {
              console.log("No user document found with email:", email);
              setSelectedPlan("Free");
              plans[0].highlight = true; // Highlight Free plan by default
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setSelectedPlan("Free");
            plans[0].highlight = true; // Highlight Free plan by default
          }
        }
      } else {
        // No user is signed in, default to Free plan
        setSelectedPlan("Free");
        plans[0].highlight = true; // Highlight Free plan by default
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Update subscription in Firestore
  const handlePlanSelect = async (planName: string) => {
    setSelectedPlan(planName);
    
    // Update highlight property in plans array
    plans.forEach(plan => {
      plan.highlight = plan.name === planName;
    });
    
    if (user && userEmail) {
      try {
        console.log(`Updating subscription for ${userEmail} to ${planName}`);
        
        // Update the user document in Firestore using email as document ID
        await setDoc(
          doc(db, "users", userEmail),
          { subscriptions: planName },
          { merge: true }
        );
        
        console.log("Subscription updated successfully");
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
    } else {
      console.warn("Cannot update subscription: User not logged in");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-black">
      <section className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-500">
              Flexible pricing for teams and individuals. Upgrade anytime.
            </p>
            {userEmail && (
              <p className="text-md text-blue-600 mt-2">
                Logged in as: {userEmail}
              </p>
            )}
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.name;
                const isHighlighted = plan.highlight;
                
                return (
                  <div
                    key={plan.name}
                    onClick={() => handlePlanSelect(plan.name)}
                    className={`cursor-pointer flex flex-col p-8 bg-white rounded-lg border text-center transition-transform duration-300 ${
                      isSelected
                        ? "border-blue-600 shadow-2xl scale-105"
                        : isHighlighted
                        ? "border-green-600 shadow-xl scale-102"
                        : "border-gray-200 shadow"
                    }`}
                  >
                    {isHighlighted && !isSelected && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs rounded-bl">
                        Current Plan
                      </div>
                    )}
                    <h3
                      className={`mb-2 text-2xl font-semibold ${
                        isSelected 
                          ? "text-blue-600" 
                          : isHighlighted
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 mb-6">{plan.description}</p>
                    <div className="flex justify-center items-baseline mb-8">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.name !== "Free" && (
                        <span className="ml-2 text-gray-500 text-base">
                          /month
                        </span>
                      )}
                    </div>
                    <ul className="mb-8 space-y-4 text-left">
                      {plan.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center space-x-2"
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
                      className={`mt-auto px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-600 hover:bg-blue-700"
                          : isHighlighted
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-700 hover:bg-gray-800"
                      }`}
                    >
                      {isSelected 
                        ? "Selected" 
                        : isHighlighted
                        ? "Current Plan"
                        : plan.name === "Free" 
                        ? "Get Started" 
                        : "Choose Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <footer className="bg-gray-900 text-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-lg">YourCompany</span> &copy; {new Date().getFullYear()}
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SubscriptionPlans;
