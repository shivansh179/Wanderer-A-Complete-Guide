// pages/Component/Chatbot/chatbotLogic.ts
import axios from 'axios';

// --- IMPORTANT: API Key Management ---
// Using the PRIMARY key and model from Planner.tsx
const CHATBOT_GEMINI_API_KEY = 'AIzaSyCLdUAFNtFROQJ19RYrBoIcoddNHk4-PIU'; // <<< YOUR PRIMARY GEMINI_API_KEY from Planner.tsx
const CHATBOT_MODEL_NAME = 'gemini-1.5-flash'; // <<< The primary model from Planner.tsx

export interface BotResponse {
    text: string;
    action?: 'redirect' | 'provide_info' | 'llm_response';
    redirectUrl?: string;
    askConfirmation?: boolean;
}

// In pages/Component/Chatbot/chatbotLogic.ts

const wandererSystemPromptForLLM = `
You are WanderBot, a friendly, polite, and highly knowledgeable AI assistant for the "Wanderer" website.
Your primary goal is to answer user questions accurately about the Wanderer website and its functionalities, and to guide users who want to plan a trip. Your tone should be helpful and enthusiastic about travel planning.

**About Wanderer - Your Knowledge Base:**

**I. Core Purpose & Value Proposition:**
    - **What Wanderer Is:** Wanderer is an innovative AI-powered trip planner designed to simplify travel planning and create personalized, detailed itineraries.
    - **Main Goal:** To help users discover destinations and effortlessly plan memorable travel experiences tailored to their preferences and budget.
    - **Key Benefit:** Saves users time and stress by automating itinerary creation with intelligent suggestions.

**II. How Trip Planning Works (Key Features & User Journey):**
    - **Initiating a Plan:** Users start by navigating to the planner section (URL: /Component/Planner).
    - **Required User Inputs for Planning:**
        - Destination: The city, region, or country the user wants to visit.
        - Number of Travel Days: How long the trip will be.
        - Budget: General category (e.g., "Budget-friendly", "Mid-range", "Luxury").
        - Number of People: Total travelers.
    - **Optional User Inputs for More Personalization:**
        - Start Location: User's origin point (can help with travel context).
        - Traveler Type: (e.g., Solo, Couple, Family, Group of Friends).
        - For Family Trips:
            - Number of Ladies.
            - Number of Elders (and any mobility considerations if your planner handles this).
            - Number of Children (and their ages, if your planner uses this detail).
            - Specific Family Preferences: (e.g., "kid-friendly activities", "prefers relaxed pace", "needs accessible options").
        - Interests: (e.g., "History", "Food", "Adventure", "Art", "Nature", "Nightlife", "Shopping"). *Be specific about what kinds of interests your planner caters to.*
    - **The AI Generation Process:** Once inputs are submitted, Wanderer's AI (Gemini 1.5 Flash) processes them to generate a comprehensive plan.
    - **Output Itinerary - What Users Get:**
        - **Detailed Day-by-Day Schedule:** Including suggested timings for activities.
        - **Route Suggestions:** How to get around (e.g., public transport, walking routes, scenic drives if applicable).
        - **Must-Visit Places & Attractions:** A mix of popular landmarks and potentially hidden gems.
        - **Activity Recommendations:** Tailored to inputs and destination (e.g., museum visits, tours, outdoor activities, culinary experiences).
        - **Estimated Budget Breakdown:** A general idea of costs associated with the plan.
        - **Safety Tips:** General safety advice, and specific considerations for family travelers (ladies, children, elderly) if applicable.
        - **Accommodation Ideas (General):** Types of accommodation that might suit the budget (e.g., "hostels", "boutique hotels", "luxury resorts") - clarify if you provide specific hotel names or just categories.
        - **Dining Suggestions (General):** Types of local cuisine to try or types of restaurants (e.g., "local eateries", "fine dining") - clarify if you list specific restaurants.
    - **Unique Selling Points:** *What makes Wanderer special? (e.g., "Our AI considers X factor that others don't", "Extremely personalized based on deep interest analysis", "Focus on sustainable travel options" - add your unique points!)*

**III. Additional Website Features & Content:**
    - **Destination Information:**
        - Weather Forecasts: For the chosen destination.
        - Latest News: Relevant news articles concerning the destination.
        - Image & Video Gallery: Visuals of the location (powered by Pexels API).
        - "About Location" Section: Provides a brief history, cultural aspects, top attractions, local cuisine, unique experiences, and practical tips for the destination.
    - **User Accounts & Saved Trips:**
        - Users can create accounts and log in (using Firebase Authentication).
        - Saved Itineraries: Generated trip plans can be saved to a user's profile for future access.
        - Trip History: Users can view their past generated trips.
    - **Feedback System:**
        - Users can submit feedback (text and rating) on their completed trips (this feedback is primarily stored for site improvement and, in a limited way for current testing, can influence subsequent plans in the same session).
    - **Blog/Travel Guides (If you have them):** *If you have a blog section with travel articles, mention it.*
    - **Community/Forum (If you have one):** *Mention if there's a user community.*

**IV. Key Pages & Navigation:**
    - **Homepage (Landing Page):** URL: / (Provides an overview, featured destinations).
    - **Trip Planner Page:** URL: /Component/Planner (This is where users create new itineraries).
    - **Login/Signup Page:** *(Specify URL if different, e.g., /login)*
    - **User Profile/Dashboard Page:** *(Specify URL if users have a dashboard to see saved trips, e.g., /profile or /dashboard)*
    - **"Best Places" Page:** (Mentioned in Landing.tsx toast) URL: /BestPlaces - What is this page about?

**V. What Wanderer DOES NOT DO (Managing Expectations):**
    - **Bookings:** Wanderer DOES NOT handle direct flight, hotel, car rental, or activity bookings. It provides suggestions and information for planning.
    - **Real-time Travel Agent Support:** You, WanderBot, are the primary AI assistant. There's no live human chat support for itinerary planning.
    - **Visa/Passport Assistance:** Wanderer does not provide visa application services or passport advice.
    - **Guaranteed Prices/Availability:** Any budget estimates are illustrative. Prices and availability for accommodations, transport, etc., must be checked independently by the user.

**Your Interaction Guidelines as WanderBot:**
1.  **Primary Source of Truth:** Answer questions STRICTLY based on the "About Wanderer - Your Knowledge Base" provided above. Do not invent features or make assumptions.
2.  **Clarify Vague Questions:** If a user's query is unclear, politely ask for more details.
3.  **Guide to Planner:** If the user expresses ANY intent to plan, create, generate, or make a trip/itinerary, your main goal is to confirm if they wish to be redirected to the planner page at "/Component/Planner". Example: "It sounds like you're ready to plan a trip! I can take you to our planner. Would you like to go?"
4.  **Acknowledge Limitations Politely:** If asked about features Wanderer doesn't have (e.g., "Can you book my flight to Paris?"), respond based on the "What Wanderer DOES NOT DO" section. Example: "Wanderer is great for planning your Paris itinerary with AI! However, we don't handle flight bookings directly. You'd use your preferred airline or booking site for that once your plan is ready."
5.  **Tone:** Maintain a friendly, enthusiastic, and helpful tone.
6.  **Conciseness:** Aim for clear and reasonably concise answers. Avoid overly long paragraphs if a shorter answer suffices.
7.  **If Unsure:** If a question is very specific and not covered in your knowledge base, you can say: "That's a very specific question! I'm best at providing information about Wanderer's features and how our AI trip planning works. For general travel advice beyond that, you might want to check other travel resources."
`;

async function getLLMResponse(userInput: string): Promise<string> {
    if (!CHATBOT_GEMINI_API_KEY) {
        console.error("Chatbot Gemini API Key is missing for LLM call!");
        return "I'm having a little trouble connecting to my brain right now. Please try again in a moment. (Error: API Key Missing)";
    }
    try {
        const fullPrompt = wandererSystemPromptForLLM + "\n\nUser question: " + userInput;
        console.log(`Sending to LLM (${CHATBOT_MODEL_NAME}):`, userInput); // Log only user input for brevity, full prompt is long
        // console.log("Full prompt being sent to LLM:", fullPrompt); // Uncomment for deep debugging if needed

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${CHATBOT_MODEL_NAME}:generateContent?key=${CHATBOT_GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        // For some models, especially if you have a long system prompt,
                        // it's better to provide it as a separate "system" role if the API supports it,
                        // or ensure it's clearly demarcated at the start of the "user" role's text.
                        // Here, we are concatenating it into the first user message part.
                        parts: [{ text: fullPrompt }]
                    }
                ],
                // generationConfig: {
                //   temperature: 0.7, // Adjust for creativity vs. factuality
                //   maxOutputTokens: 300, // Limit response length
                // }
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
        );

        const llmText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (llmText) {
            console.log("LLM Response:", llmText);
            return llmText;
        } else {
            console.warn("LLM response was empty or in an unexpected format:", response.data);
            // Log the full response data from Google if it's not what's expected
            if (response.data && response.data.promptFeedback && response.data.promptFeedback.blockReason) {
                console.error("LLM prompt blocked. Reason:", response.data.promptFeedback.blockReason, "Details:", response.data.promptFeedback.safetyRatings);
                return `My response was blocked due to content safety reasons (${response.data.promptFeedback.blockReason}). Could you try rephrasing?`;
            }
            return "I received a response, but it seemed empty. Could you try rephrasing?";
        }
    } catch (error: any) {
        console.error('Error calling LLM for chatbot:', error);
        if (error.response) {
            // Log the actual error response from Google if available
            console.error('Google API Error Status:', error.response.status);
            console.error('Google API Error Data:', error.response.data);
            return `I encountered an issue (Code: ${error.response.status}). Please try asking in a different way or check the console for details.`;
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Google API No Response:', error.request);
            return "I couldn't reach the AI service. Please check your internet connection or try again later.";
        } else {
            // Something else happened in setting up the request
            console.error('Google API Request Setup Error:', error.message);
            return "I had a problem preparing your request. Please try again.";
        }
    }
}

// The rest of getBotResponse function remains the same as the previous version
// (where it checks rules and then calls getLLMResponse as a fallback)
// pages/Component/Chatbot/chatbotLogic.ts
// ... (CHATBOT_GEMINI_API_KEY, CHATBOT_MODEL_NAME, wandererSystemPromptForLLM, getLLMResponse remain the same) ...

export const getBotResponse = async (userInput: string, lastBotMessage?: BotResponse): Promise<BotResponse> => {
    const lowerInput = userInput.toLowerCase().trim();

    // --- Rule-Based Checks First ---

    // Priority 1: Handle direct "yes" confirmation to a previous redirection offer
    if (lastBotMessage?.askConfirmation && lastBotMessage?.action === 'redirect' && lastBotMessage.redirectUrl) {
        if (["yes", "sure", "ok", "okay", "yes please", "yeah", "yep", "alright", "fine"].includes(lowerInput)) {
            return {
                text: `Excellent! Taking you to our trip planner at ${lastBotMessage.redirectUrl} now...`,
                action: 'redirect',
                redirectUrl: lastBotMessage.redirectUrl,
                askConfirmation: false, // Action is being taken
            };
        } else if (["no", "not now", "no thanks", "later"].includes(lowerInput)) {
            return {
                text: "Alright! Let me know if you change your mind or if there's anything else I can help you with about Wanderer.",
                action: 'provide_info', // No longer a pending redirect question
                askConfirmation: false,
            };
        }
    }
    
    // Priority 1.5: Handle direct "yes" confirmation to "Would you like to try planning a trip?" from "what is this" response
    if (lastBotMessage?.askConfirmation && lastBotMessage?.action === 'provide_info' && 
        (lastBotMessage.text.toLowerCase().includes("would you like to try planning a trip?") || 
         lastBotMessage.text.toLowerCase().includes("would you like to plan a trip now?"))) {
        if (["yes", "sure", "ok", "okay", "yes please", "yeah", "yep", "alright", "fine"].includes(lowerInput)) {
            // Now offer to redirect
            return {
                text: "Fantastic! I can take you straight to our trip planner page. Shall I do that?",
                action: 'redirect',
                redirectUrl: '/Component/Planner', // Your confirmed planner route
                askConfirmation: true, // Ask confirmation for *this specific* redirection offer
            };
        } else if (["no", "not now", "no thanks", "later"].includes(lowerInput)) {
             return {
                text: "No problem! Feel free to ask me anything else about how Wanderer works.",
                action: 'provide_info',
                askConfirmation: false,
            };
        }
    }


    // Rule: Greeting
    const greetingKeywords = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"];
    if (greetingKeywords.some(greeting => lowerInput.startsWith(greeting))) {
        return { text: "Hello! I'm WanderBot, your guide to the Wanderer website. How can I assist you today? You can ask me about our features or how to plan a trip." };
    }

    // Rule: Explicit Intent to plan a trip
    const planningKeywords = [
        "plan a trip", "create itinerary", "generate a plan", "make a trip", "i want to plan",
        "go to planner", "trip planner", "start planning", "new trip", "design a trip", "get an itinerary"
    ];
    if (planningKeywords.some(keyword => lowerInput.includes(keyword))) {
        return {
            text: "It sounds like you're ready to plan an adventure! I can take you to our trip planner page. Would you like to go there now?",
            action: 'redirect',
            redirectUrl: '/Component/Planner',
            askConfirmation: true, // Bot is asking, so needs confirmation
        };
    }
    
    // Rule: Thank you
    if (["thank you", "thanks", "thx", "appreciate it"].some(thanks => lowerInput.includes(thanks))) {
        return { text: "You're very welcome! Is there anything else I can help you with regarding Wanderer today?" };
    }
    
    // --- If no specific rules match, fallback to LLM ---
    console.log("No specific rule matched. Falling back to LLM for user input:", userInput);
    const llmResponseText = await getLLMResponse(userInput);
    // Check if LLM response itself suggests planning, then offer redirect
    if (llmResponseText.toLowerCase().includes("plan a trip") || llmResponseText.toLowerCase().includes("go to the planner")) {
        return { 
            text: llmResponseText + "\n\nWould you like me to take you to the planner page?",
            action: 'redirect',
            redirectUrl: '/Component/Planner',
            askConfirmation: true,
        };
    }
    return { text: llmResponseText, action: 'llm_response' };
};