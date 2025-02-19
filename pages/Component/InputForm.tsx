import React from 'react';
import { motion } from 'framer-motion';
import { ThreeDots } from 'react-loader-spinner';

interface InputFormProps {
    startLocation: string;
    setStartLocation: (value: string) => void;
    destination: string;
    setDestination: (value: string) => void;
    days: string;
    setDays: (value: string) => void;
    budget: string;
    setBudget: (value: string) => void;
    peopleCount: string;
    setPeopleCount: (value: string) => void;
    ladiesCount: string;
    setLadiesCount: (value: string) => void;
    elderlyCount: string;
    setElderlyCount: (value: string) => void;
    childrenCount: string;
    setChildrenCount: (value: string) => void;
    loading: boolean;
    planFetcher: () => Promise<void>;
    imageLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
    startLocation,
    setStartLocation,
    destination,
    setDestination,
    days,
    setDays,
    budget,
    setBudget,
    peopleCount,
    setPeopleCount,
    ladiesCount,
    setLadiesCount,
    setElderlyCount,
    elderlyCount,
    setChildrenCount,
    childrenCount,
    loading,
    planFetcher,
    imageLoading
}) => {
    return (
        <motion.div
            className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
        >
            <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">
                    Wanderer: Your AI Trip Planner
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                    Unlock unforgettable journeys with personalized AI-powered itineraries.
                </p>
            </div>

            <div className="space-y-4">
                {/* Hero Section Look for Starting Point and Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                            value={startLocation}
                            onChange={(e) => setStartLocation(e.target.value)}
                            placeholder="Enter your starting location"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Enter your destination"
                        />
                    </div>
                </div>

                {/* Rest of the Inputs */}
                {[
                    { label: "Trip Duration (Days)", state: days, setState: setDays, type: "number" },
                    { label: "Total Budget", state: budget, setState: setBudget, type: "number" },
                    { label: "Total Travelers", state: peopleCount, setState: setPeopleCount, type: "number" },
                    { label: "Female Travelers", state: ladiesCount, setState: setLadiesCount, type: "number" },
                    { label: "Senior Travelers", state: elderlyCount, setState: setElderlyCount, type: "number" },
                    { label: "Children", state: childrenCount, setState: setChildrenCount, type: "number" }
                ].map(({ label, state, setState, type = "text" }, index) => (
                    <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                            type={type}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-gray-700"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder={`Enter your ${label.toLowerCase()}`}
                        />
                    </div>
                ))}

                <motion.button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={planFetcher}
                    disabled={loading || imageLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {loading ? (
                        <ThreeDots height="24" width="24" color="#ffffff" />
                    ) : (
                        'Craft My Adventure'
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default InputForm;