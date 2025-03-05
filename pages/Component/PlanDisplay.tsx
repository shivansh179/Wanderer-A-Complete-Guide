"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { FaInfoCircle, FaQuoteLeft, FaQuoteRight, FaRegStar, FaStar, FaMapMarkedAlt, FaCalendarAlt, FaPrint, FaShare, FaDownload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdFeedback, MdClose } from 'react-icons/md';
import { IoChatbubblesOutline } from 'react-icons/io5';

interface PlanDisplayProps {
  plan: string;
  sectionVariants: any;
  destination: string;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, sectionVariants, destination }) => {
  const [feedbacks, setFeedbacks] = useState<{ feedback: string; email?: string; date?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('all');
  const contentRef = useRef<HTMLDivElement>(null);

  // Sections extracted from plan
  const [sections, setSections] = useState<{ title: string; id: string }[]>([]);
  
  // Process plan to extract sections
  useEffect(() => {
    if (plan) {
      const lines = plan.split('\n');
      const extractedSections: { title: string; id: string }[] = [];
      
      lines.forEach(line => {
        if (line.startsWith('# ')) {
          const title = line.replace('# ', '');
          const id = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
          extractedSections.push({ title, id });
        } else if (line.startsWith('## ') && extractedSections.length === 0) {
          // If no main headers, use subheaders
          const title = line.replace('## ', '');
          const id = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
          extractedSections.push({ title, id });
        }
      });
      
      setSections(extractedSections);
    }
  }, [plan]);

  // Fetch feedbacks from Firestore
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const db = getFirestore();
        const feedbacksRef = collection(db, 'feedbacks');
        const q = query(feedbacksRef, where('destination', '==', destination));
        const querySnapshot = await getDocs(q);

        const feedbackList: { feedback: string; email?: string; date?: string }[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.feedback) {
            feedbackList.push({
              feedback: data.feedback,
              email: data.email || 'Anonymous traveler',
              date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recent'
            });
          }
        });
        setFeedbacks(feedbackList);
      } catch (error) {
        setError('Error fetching feedbacks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [destination]);

  // Handle scrolling to sections
  const scrollToSection = (id: string) => {
    setCurrentSection(id);
    if (id === 'all') {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Toggle dialog visibility
  const toggleDialog = () => {
    setShowDialog(prev => !prev);
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  // Handle print function
  const handlePrint = () => {
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #0369a1; margin-bottom: 20px;">${destination} Itinerary</h1>
        <div>${plan.replace(/\n/g, '<br>')}</div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Itinerary</title></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Animation variants
  const dialogVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 500 } },
    exit: { opacity: 0, y: 50 }
  };

  const feedbackItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <>
      <motion.div
        className={`bg-gray-50 text-gray-900 dark:text-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden transition-all duration-500 ${expanded ? 'fixed inset-4 z-50 mt-16' : 'relative'}`}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        layout
      >
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FaMapMarkedAlt className="text-white text-2xl mr-3" />
              <h2 className="text-xl font-bold text-white">
                Your {destination} Itinerary
              </h2>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={toggleExpanded}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title={expanded ? "Minimize" : "Expand"}
              >
                {expanded ? <FaChevronDown /> : <FaChevronUp />}
              </button>
              
              <button
                onClick={toggleDialog}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title="User Feedback"
              >
                <IoChatbubblesOutline />
              </button>
              
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition text-white text-sm flex items-center"
                title="Print Itinerary"
              >
                <FaPrint />
              </button>
            </div>
          </div>
          
          {/* Table of contents */}
          {sections.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => scrollToSection('all')}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                    currentSection === 'all' 
                      ? 'bg-white text-blue-600 font-medium' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Overview
                </button>
                
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                      currentSection === section.id 
                        ? 'bg-white text-blue-600 font-medium' 
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div 
        //   ref={contentRef}
          className={`p-6 overflow-auto ${expanded ? 'h-[calc(100%-12rem)]' : 'max-h-[700px]'}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            className="prose max-w-none dark:prose-invert prose-headings:scroll-mt-20"
            components={{
              h1: ({ node, ...props }) => <h1 id={props.children?.toString().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')} className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
              h2: ({ node, ...props }) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')} className="text-xl font-semibold text-blue-600 dark:text-blue-300 mt-6 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2" {...props} />,
              p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
              li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
              a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 italic text-gray-700 dark:text-gray-300 rounded-r" {...props} />
              ),
              code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" {...props} />,
              pre: ({ node, ...props }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm my-4" {...props} />,
            }}
          >
            {plan}
          </ReactMarkdown>

          {/* Quick feedback section at the bottom */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                <MdFeedback className="mr-2" /> 
                Traveler Feedback
              </h3>
              
              {loading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {error && <p className="text-red-500 mt-2">{error}</p>}
              
              {!loading && feedbacks.length === 0 && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  No feedback available for {destination} yet. Be the first to share your experience!
                </p>
              )}
              
              {!loading && feedbacks.length > 0 && (
                <div className="mt-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start mb-2">
                      <FaQuoteLeft className="text-blue-400 text-sm mt-1 mr-2" />
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        {feedbacks[0].feedback}
                      </p>
                      <FaQuoteRight className="text-blue-400 text-sm mt-1 ml-2" />
                    </div>
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      — {feedbacks[0].email}, {feedbacks[0].date}
                    </div>
                  </div>
                  
                  {feedbacks.length > 1 && (
                    <button 
                      onClick={toggleDialog}
                      className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center justify-center w-full"
                    >
                      View all {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feedback Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDialog}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[80vh]"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <IoChatbubblesOutline className="mr-2" />
                  Traveler Experiences in {destination}
                </h2>
                <button 
                  onClick={toggleDialog}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <MdClose size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          No feedbacks available for {destination} yet.
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Be the first to share your experience after your trip!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedbacks.map((feedback, index) => (
                          <motion.div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            variants={feedbackItemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={index}
                          >
                            <div className="flex items-start mb-3">
                              <div className="bg-blue-500 text-white rounded-full p-2 mr-3">
                                {feedback.email?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {feedback.email}
                                </p>
                                <div className="flex items-center text-yellow-500 text-sm mt-1">
                                  <FaStar />
                                  <FaStar />
                                  <FaStar />
                                  <FaStar />
                                  <FaRegStar />
                                  <span className="ml-2 text-gray-600 dark:text-gray-300">{feedback.date}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{feedback.feedback}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PlanDisplay;