import React, { useState } from 'react';
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
    setTripForFamily: (value: boolean) => void;
    familyElderlyCount: string;
    setFamilyElderlyCount: (value: string) => void;
    familyLadiesCount: string;
    setFamilyLadiesCount: (value: string) => void;
    familyChildrenCount: string;
    setFamilyChildrenCount: (value: string) => void;
    familyPreferences: string;
    setFamilyPreferences: (value: string) => void;
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
    imageLoading,
    setTripForFamily,
    familyElderlyCount,
    setFamilyElderlyCount,
    familyLadiesCount,
    setFamilyLadiesCount,
    familyChildrenCount,
    setFamilyChildrenCount,
    familyPreferences,
    setFamilyPreferences
}) => {
    const [tripForFamily, setTripForFamilyLocal] = useState(false); // Track if the trip is for family

    return (
        <motion.div
            className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
        >
            <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-cyan-800 mb-2 tracking-tight">
                    Wanderer: Your AI Trip Planner
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                    Unlock unforgettable journeys with personalized AI-powered itineraries.
                </p>
            </div>

            {/* Radio buttons to select if the trip is for self or family */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Are you planning this trip for:</label>
                <div className="flex items-center">
                    <input
                        type="radio"
                        id="forMyself"
                        name="tripType"
                        checked={!tripForFamily}
                        onChange={() => {
                            setTripForFamilyLocal(false);
                            setTripForFamily(false); // Pass to parent component
                        }}
                        className="mr-2"
                    />
                    <label htmlFor="forMyself" className="text-gray-700">Myself</label>
                    <input
                        type="radio"
                        id="forFamily"
                        name="tripType"
                        checked={tripForFamily}
                        onChange={() => {
                            setTripForFamilyLocal(true);
                            setTripForFamily(true); // Pass to parent component
                        }}
                        className="mr-2 ml-4"
                    />
                    <label htmlFor="forFamily" className="text-gray-700">My Family</label>
                </div>
            </div>

            <div className="space-y-4">
                {/* Starting Point and Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Point</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                            value={startLocation}
                            onChange={(e) => setStartLocation(e.target.value)}
                            placeholder="Enter your starting location"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Enter your destination"
                        />
                    </div>
                </div>

                {/* Trip Details */}
                {[
                    { label: "Trip Duration (Days)", state: days, setState: setDays, type: "number" },
                    { label: "Total Budget", state: budget, setState: setBudget, type: "number" },
                 ].map(({ label, state, setState, type = "text" }, index) => (
                    <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                            type={type}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder={`Enter your ${label.toLowerCase()}`}
                        />
                    </div>
                ))}

                {/* Family Details if trip is for family */}
                {tripForFamily && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Elderly Travelers</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                                value={familyElderlyCount}
                                onChange={(e) => setFamilyElderlyCount(e.target.value)}
                                placeholder="Number of elderly travelers"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Female Travelers</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                                value={familyLadiesCount}
                                onChange={(e) => setFamilyLadiesCount(e.target.value)}
                                placeholder="Number of female travelers"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                                value={familyChildrenCount}
                                onChange={(e) => setFamilyChildrenCount(e.target.value)}
                                placeholder="Number of children"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Family Preferences</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-gray-700"
                                value={familyPreferences}
                                onChange={(e) => setFamilyPreferences(e.target.value)}
                                placeholder="What does your family like to do?"
                            />
                        </div>
                    </>
                )}

                {/* Submit Button */}
                <motion.button
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
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
