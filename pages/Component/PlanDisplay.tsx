import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface PlanDisplayProps {
    plan: string;
    sectionVariants: any;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, sectionVariants }) => {
    return (
        <motion.div
            className="bg-white rounded-3xl shadow-md p-6 h-120 overflow-auto"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <h2 className="text-2xl sm:text-3xl font-semibold text-cyan-700 mb-4">
                Your Personalized Itinerary
            </h2>
                        <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                className="prose max-w-none"
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-cyan-700 mb-3" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-cyan-600 mt-4 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-cyan-800" {...props} />,
                    a: ({ node, ...props }) => <a className="text-cyan-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                }}
            
            >
                {plan}
            </ReactMarkdown>
            
        </motion.div>
    );
};

export default PlanDisplay;