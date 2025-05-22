// pages/Component/Chatbot/ChatWindow.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { getBotResponse, BotResponse } from './chatbotLogic';
import { useRouter } from 'next/router'; // More likely for pages directory structure
import { IoMdSend, IoMdClose } from "react-icons/io";
import { FaRobot } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Loading Spinner


interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    action?: BotResponse['action'];
    redirectUrl?: string;
    askConfirmation?: boolean;
}

interface ChatWindowProps {
    onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: Date.now(), text: "Hi! I'm WanderBot. Ask me about Wanderer or if you'd like to plan a trip!", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false); // For loading indicator
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null!); // Add '!' to assure TypeScript it won't be null when used
    // No need for lastBotQuestionRequiresConfirmation state, can use last message in array

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => { // Now async
        if (inputValue.trim() === '' || isBotTyping) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputValue(''); // Clear input immediately
        setIsBotTyping(true); // Show typing indicator

        const lastBotMessage = messages.filter(msg => msg.sender === 'bot').pop();
        const botResponseDetails = await getBotResponse(inputValue, lastBotMessage); // Pass last bot message for context

        const botMessage: Message = {
            id: Date.now() + 1,
            text: botResponseDetails.text,
            sender: 'bot',
            action: botResponseDetails.action,
            redirectUrl: botResponseDetails.redirectUrl,
            askConfirmation: botResponseDetails.askConfirmation,
        };
        
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsBotTyping(false); // Hide typing indicator

        if (botResponseDetails.action === 'redirect' && !botResponseDetails.askConfirmation && botResponseDetails.redirectUrl) {
            setTimeout(() => router.push(botResponseDetails.redirectUrl!), 1200);
        }
    };

    const handleUserConfirmation = (confirmed: boolean, redirectUrl?: string) => {
        setIsBotTyping(true);
        // Remove existing confirmation buttons by finding the message that asked for confirmation
        // This is a bit complex; simpler might be to just add a new bot message.
        // For now, let's just add a new message.
        
        let confirmationResponseMessage: Message;
        if (confirmed && redirectUrl) {
            confirmationResponseMessage = {
                id: Date.now(),
                text: "Great! Taking you there now...",
                sender: 'bot'
            };
            setMessages(prevMessages => [...prevMessages, confirmationResponseMessage]);
            setTimeout(() => router.push(redirectUrl), 1000);
        } else {
            confirmationResponseMessage = {
                id: Date.now(),
                text: "Okay, let me know if you change your mind or need anything else!",
                sender: 'bot'
            };
            setMessages(prevMessages => [...prevMessages, confirmationResponseMessage]);
        }
        setIsBotTyping(false);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isBotTyping) {
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-20 right-5 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <FaRobot size={20} />
                    <h3 className="font-semibold text-lg">WanderBot</h3>
                </div>
                <button onClick={onClose} className="text-white hover:text-gray-200">
                    <IoMdClose size={24} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-700/50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed
                                ${msg.sender === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                }`}
                        >
                            {/* Render message text with basic markdown for newlines */}
                            {msg.text.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < msg.text.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}

                            {/* Render confirmation buttons if bot asked for it AND it's the last message */}
                            {msg.sender === 'bot' && 
                             msg.id === messages[messages.length - 1].id && // Only for the very last bot message
                             msg.action === 'redirect' && 
                             msg.askConfirmation && 
                             msg.redirectUrl && (
                                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-500 flex gap-2">
                                    <button
                                        onClick={() => handleUserConfirmation(true, msg.redirectUrl)}
                                        className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                        disabled={isBotTyping}
                                    >
                                        Yes, take me there!
                                    </button>
                                    <button
                                        onClick={() => handleUserConfirmation(false)}
                                        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                        disabled={isBotTyping}
                                    >
                                        No, thanks
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isBotTyping && (
                    <div className="flex justify-start">
                        <div className="max-w-[75%] p-3 rounded-2xl text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none">
                            <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                )}
 </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isBotTyping}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors focus:outline-none"
                        aria-label="Send message"
                        disabled={isBotTyping}
                    >
                        <IoMdSend size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;