// pages/index.tsx
"use client"; // Ensure this is at the top if not already present

import React from 'react';
import LandingPage from "./Component/Landing";
import FloatingChatbotIcon from '../components/Chatbot/FloatingChatbotIcon'; // <<< THIS IS THE NEW, CORRECT PATH // <<< ADD THIS IMPORT

const IndexPage = () => { // Renamed to IndexPage to avoid conflict if 'index' is a var
  return (
    <>
       <LandingPage />
       <FloatingChatbotIcon /> {/* <<< ADD THIS COMPONENT HERE */}
    </>
  );
};

export default IndexPage;