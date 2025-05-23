import React, { useEffect, useState } from 'react';
import { User as FirebaseUser, getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, DocumentData } from 'firebase/firestore';
import { MapPin, Calendar, Wallet, Users, Clock, Star, ArrowRight, Plane, Heart } from 'lucide-react';
import firebaseApp from '@/FirebaseCofig';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown'; // Import react-markdown

// Define the structure of a Plan object
interface Plan {
  id?: string;
  planSummary?: string;
  startLocation: string;
  destination: string;
  budget: string | number;
  days: string | number;
  createdAt: string;
  selectedFeatures?: string[];
  familyPreferences?: string;
  hasPlan?: boolean;
  generatedWithSubscription?: string;
  feedbackSubmitted?: boolean;
  peopleCount?: string | number;
  familyChildrenCount?: string | number;
  familyElderlyCount?: string | number;
  familyLadiesCount?: string | number;
  // Fields from your example data
  email?: string;
  name?: string;
  tripForFamily?: boolean;
}

// --- Helper Functions (can be moved to a utils file) ---
const safeParseInt = (value: string | number | undefined): number => {
  if (value === undefined || value === null) return 0;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? 0 : num;
};

const formatDateForCard = (dateString: string): string => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return "Date N/A";
  }
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateForDetail = (dateString: string): string => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return "Date N/A";
  }
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    // hour: '2-digit', minute: '2-digit' // Optional: include time
  });
};

const getTotalPeopleForPlan = (plan: Plan): number => {
  const counts = [
    safeParseInt(plan.peopleCount),
    safeParseInt(plan.familyChildrenCount),
    safeParseInt(plan.familyElderlyCount),
    safeParseInt(plan.familyLadiesCount)
  ];
  const total = counts.reduce((sum, count) => sum + count, 0);
  return total || 1;
};


// --- Full Plan Details View Component ---
interface FullPlanDetailsViewProps {
  plan: Plan;
  onClose: () => void;
}

const FullPlanDetailsView: React.FC<FullPlanDetailsViewProps> = ({ plan, onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 sm:p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 capitalize">
                Trip to {plan.destination}
              </h1>
              <p className="text-sm sm:text-base opacity-90">
                From: <span className="font-medium capitalize">{plan.startLocation}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center"
            >
              <ArrowRight className="h-4 w-4 mr-2 transform rotate-180" /> Back to Trips
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center"><Calendar className="h-4 w-4 mr-1.5 opacity-80 flex-shrink-0" /> <span>{plan.days} Days</span></div>
            <div className="flex items-center"><Wallet className="h-4 w-4 mr-1.5 opacity-80 flex-shrink-0" /> <span>Budget: ₹{plan.budget}</span></div>
            <div className="flex items-center"><Users className="h-4 w-4 mr-1.5 opacity-80 flex-shrink-0" /> <span>{getTotalPeopleForPlan(plan)} People</span></div>
            <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5 opacity-80 flex-shrink-0" /> <span>Created: {formatDateForDetail(plan.createdAt)}</span></div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Itinerary Details</h2>
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
              {plan.planSummary ? (
                <ReactMarkdown>{plan.planSummary}</ReactMarkdown>
              ) : (
                <p>No detailed itinerary available.</p>
              )}
            </div>
          </div>

          {plan.selectedFeatures && plan.selectedFeatures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Selected Features</h3>
              <div className="flex flex-wrap gap-2">
                {plan.selectedFeatures.map((feature, idx) => (
                  <span 
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plan.familyPreferences && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Family Preferences</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm sm:text-base">{plan.familyPreferences}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              <p><span className="font-medium text-gray-500">Trip ID:</span> {plan.id || 'N/A'}</p>
              {plan.name && <p><span className="font-medium text-gray-500">Planner Name:</span> {plan.name}</p>}
              {plan.email && <p><span className="font-medium text-gray-500">Planner Email:</span> {plan.email}</p>}
              <p><span className="font-medium text-gray-500">Generated with:</span> {plan.generatedWithSubscription || 'Free Plan'}</p>
              <p><span className="font-medium text-gray-500">Feedback Submitted:</span> {plan.feedbackSubmitted ? 'Yes' : 'No'}</p>
              <p><span className="font-medium text-gray-500">Plan Complete:</span> {plan.hasPlan ? 'Yes' : 'No'}</p>
              {typeof plan.tripForFamily === 'boolean' && <p><span className="font-medium text-gray-500">Trip for Family:</span> {plan.tripForFamily ? 'Yes' : 'No'}</p>}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
              Close Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main User Plans Page Component ---
const UserPlansPage: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null); // State for the selected plan

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        if (authUser.email) { 
          try {
            const userRef = doc(db, 'users', authUser.email);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData: DocumentData = userSnap.data();
              const userPlansFromDb = (userData.trips || []).map((trip: any) => ({
                ...trip,
                id: trip.id || String(Math.random().toString(36).substr(2, 9)) // Ensure ID for key, fallback if not present
              })) as Plan[];
              setPlans(userPlansFromDb);
            } else {
              setPlans([]);
            }
          } catch (error) {
            console.error('Error fetching user plans:', error);
            setPlans([]);
          }
        } else {
          console.warn('Authenticated user does not have an email. Cannot fetch plans.');
          setPlans([]); 
        }
      } else {
        setUser(null);
        setPlans([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const extractTitleFromSummary = (planSummary: string | undefined): string => {
    if (!planSummary) return 'Travel Plan';
    const titleMatch = planSummary.match(/##\s*(.+?):/);
    return titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Travel Plan';
  };

  const extractDescriptionFromSummary = (planSummary: string | undefined): string => {
    if (!planSummary) return 'No description available';
    const descriptionMatch = planSummary.match(/:\s*(.+?)(?=\n|$)/);
    const description = descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : planSummary;
    return description.substring(0, 150) + (description.length > 150 ? '...' : '');
  };

  const handleViewFullItinerary = (plan: Plan) => {
    setSelectedPlan(plan);
    window.scrollTo(0, 0); // Scroll to top when viewing details
  };

  const handleCloseFullItinerary = () => {
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-blue-200 border-dashed rounded-full animate-spin mx-auto"></div>
            <Plane className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your travel plans...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-6">
            <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Travel Dashboard</h2>
            <p className="text-gray-600">Please log in to view and manage your travel plans</p>
          </div>
          <Link href="/Component/Login"> {/* Adjust this path as needed */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto cursor-pointer hover:shadow-xl transition-shadow">
              <p className="text-lg font-semibold text-blue-600">Sign in required</p>
              <p className="text-gray-500 mt-2">Access your personalized travel itineraries and planning tools</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // If a plan is selected, show its full details
  if (selectedPlan) {
    return (
      <FullPlanDetailsView 
        plan={selectedPlan} 
        onClose={handleCloseFullItinerary} 
      />
    );
  }

  // Otherwise, show the list of plans
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.displayName || user.email?.split('@')[0] || 'Traveler'}! 
              </h1>
              <p className="text-gray-600 mt-1">Manage and explore your travel adventures</p>
            </div>
            <div className="flex items-center bg-blue-50 px-6 py-4 rounded-full space-x-2">
  <Plane className="h-5 w-5 text-blue-600" aria-hidden="true" />
  <div className="flex items-baseline space-x-1 text-blue-800 font-medium text-sm">
    <span>{plans.length}</span>
    <span>Trip{plans.length !== 1 ? 's' : ''}</span>
  </div>
</div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <MapPin className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No trips planned yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start planning your next adventure! Create your first travel itinerary and explore amazing destinations.
              </p>
            </div>
            <Link href="/create-trip"> {/* Adjust to your plan creation page */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Plan Your First Trip
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan: Plan) => ( 
              <div 
                key={plan.id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 flex flex-col"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium bg-white bg-opacity-20 px-2.5 py-1 rounded-full">
                        {plan.generatedWithSubscription || 'Free'}
                      </span>
                      {plan.feedbackSubmitted && (
                        <Heart className="h-4 w-4 fill-current" />
                      )}
                    </div>
                    <h2 className="text-lg font-bold mb-1 line-clamp-2 h-12"> {/* Fixed height for title consistency */}
                      {extractTitleFromSummary(plan.planSummary)}
                    </h2>
                    <div className="flex items-center text-xs opacity-90">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="capitalize truncate max-w-[100px]">{plan.startLocation}</span>
                      <ArrowRight className="h-3 w-3 mx-1.5" />
                      <span className="capitalize font-medium truncate max-w-[100px]">{plan.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 h-16"> {/* Fixed height for description */}
                    {extractDescriptionFromSummary(plan.planSummary)}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Wallet className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                      <span className="font-medium">₹{plan.budget}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                      <span className="font-medium">{plan.days} days</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Users className="h-4 w-4 mr-2 text-purple-600 flex-shrink-0" />
                      <span className="font-medium">{getTotalPeopleForPlan(plan)} people</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
                      <span className="font-medium">{formatDateForCard(plan.createdAt)}</span>
                    </div>
                  </div>

                  {plan.selectedFeatures && plan.selectedFeatures.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {plan.selectedFeatures.slice(0, 3).map((feature: string, idx: number) => ( 
                          <span 
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                        {plan.selectedFeatures.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                            +{plan.selectedFeatures.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-auto"> {/* Pushes button to bottom */}
                    <button 
                      onClick={() => handleViewFullItinerary(plan)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center group-hover:shadow-lg text-sm"
                    >
                      View Full Itinerary
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {plan.hasPlan && (
                  <div className="absolute top-3 left-3">
                    <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center shadow">
                      <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                      Complete
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPlansPage;