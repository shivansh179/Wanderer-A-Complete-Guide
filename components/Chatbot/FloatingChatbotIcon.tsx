// pages/Component/Chatbot/FloatingChatbotIcon.tsx
"use client";

import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { AnimatePresence, motion } from 'framer-motion';
import { BsChatDotsFill } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";


const FloatingChatbotIcon: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <>
            <motion.button
                onClick={toggleChat}
                className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-full shadow-lg z-50 focus:outline-none hover:from-blue-700 hover:to-indigo-800"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle chat"
            >
                {isChatOpen ? <IoMdClose size={28} /> : <BsChatDotsFill size={28} />}
            </motion.button>

            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        style={{ position: 'fixed', bottom: '85px', right: '20px', zIndex: 49 }} // Position chat window above button
                    >
                        <ChatWindow onClose={toggleChat} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingChatbotIcon;