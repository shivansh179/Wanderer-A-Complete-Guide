"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { FaInfoCircle } from 'react-icons/fa'; // Icon import

interface PlanDisplayProps {
    plan: string;
    sectionVariants: any;
    destination: string;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, sectionVariants, destination }) => {
    const [feedbacks, setFeedbacks] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state
    const [showDialog, setShowDialog] = useState<boolean>(false); // State to show/hide dialog

    useEffect(() => {
        const fetchFeedbacks = async () => {
            setLoading(true); // Start loading
            setError(null); // Reset error state
            try {
                const db = getFirestore();
                const feedbacksRef = collection(db, 'feedbacks');

                // Query the 'feedbacks' collection where the destination matches
                const q = query(feedbacksRef, where('destination', '==', destination));
                const querySnapshot = await getDocs(q);

                // Extract feedbacks from documents and store them in state
                const feedbackList: string[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.feedback) {
                        feedbackList.push(data.feedback);
                    }
                });
                setFeedbacks(feedbackList);
            } catch (error) {
                setError('Error fetching feedbacks. Please try again later.');
            } finally {
                setLoading(false); // Stop loading
            }
        };

        fetchFeedbacks();
    }, [destination]);

    // Function to toggle dialog visibility
    const toggleDialog = () => {
        setShowDialog((prev) => !prev);
    };

    return (
        <motion.div
            className="bg-white rounded-3xl dark:bg-gray-800 shadow-md p-6 h-120 overflow-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div className="flex items-center mb-4">
                <h2 className="text-2xl dark:text-cyan-400 sm:text-3xl font-semibold text-cyan-700 mr-2">
                    Your Personalized Itinerary
                </h2>
                {/* Icon for triggering dialog */}
                <FaInfoCircle
                     className="text-cyan-700 cursor-pointer"
                     size={24}
                     title="See what our users say"  // Tooltip on hover
                     onClick={toggleDialog}  // On click, open dialog
                />

            </div>

            {/* Scrollable itinerary content */}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                className="prose max-w-none "
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold dark:text-cyan-400  text-cyan-700 mb-3" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold dark:text-cyan-400  text-cyan-600 mt-4 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-700 mb-3 dark:text-cyan-400  leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4  dark:text-cyan-400 space-y-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 dark:text-cyan-400  space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-600 dark:text-cyan-400 " {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold dark:text-cyan-400  text-cyan-800" {...props} />,
                    a: ({ node, ...props }) => <a className="text-cyan-600 dark:text-cyan-400  hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                }}
            >
                {plan}
            </ReactMarkdown>

            {/* Show loading, error, or feedback messages */}
            {loading && <p className="text-gray-500 dark:text-cyan-400  mt-8">Loading feedbacks...</p>}
            {error && <p className="text-red-500 mt-8">{error}</p>}
            {!loading && feedbacks.length === 0 && (
                <p className="text-gray-600 border-2 dark:text-cyan-400 dark:border-cyan-600 border-cyan-900 p-2 rounded-lg mt-8">
                    No feedbacks available for {destination} yet. Be the first to share your experience!
                </p>
            )}

            {/* Display feedbacks if available */}
            {feedbacks.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-cyan-700 mb-4">What Users Are Saying About {destination}:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        {feedbacks.map((feedback, index) => (
                            <li key={index} className="text-gray-600">
                                {feedback}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Scrollable Dialog Box */}
            {showDialog && (
                <motion.div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                >
                    <div className="bg-white rounded-xl p-6 w-3/4 h-3/4 overflow-auto">
                        <h2 className="text-2xl font-bold text-cyan-700 mb-4">User Experiences for {destination}</h2>
                        <p className="text-gray-600 mb-6">Here are some reviews and experiences shared by users who visited {destination}.</p>
                        
                        {/* Render feedbacks inside the dialog */}
                        <ul className="list-disc pl-6 space-y-4">
                            {feedbacks.length > 0 ? (
                                feedbacks.map((feedback, index) => (
                                    <li key={index} className="text-gray-600">
                                        {feedback}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-600">No feedbacks available for {destination} yet.</li>
                            )}
                        </ul>
                        <button
                            className="mt-6 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                            onClick={toggleDialog}
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default PlanDisplay;
