// import React, { useState, useEffect, useRef } from 'react';
// import {QRCodeSVG} from 'qrcode.react'; // Install: npm install qrcode.react
// // Types
// type MembershipPlan = {
//   id: string;
//   name: string;
//   duration: number;
//   price: number;
//   description: string;
//   popular?: boolean;
// };

// type PaymentMethod = {
//   id: string;
//   name: string;
//   icon: React.ReactNode;
// };


// const PaymentPage: React.FC = () => {
//   // Membership plans
//   const membershipPlans: MembershipPlan[] = [
//     {
//       id: 'monthly',
//       name: 'Monthly',
//       duration: 1,
//       price: 99,
//       description: 'Perfect for trying out our services',
//     },
//     {
//       id: 'quarterly',
//       name: 'Quarterly',
//       duration: 3,
//       price: 250,
//       description: 'Our most popular plan with great value',
//       popular: true,
//     },
//     {
//       id: 'annual',
//       name: 'Annual',
//       duration: 12,
//       price: 1000,
//       description: 'Best value with maximum savings',
//     },
//   ];

//   // Payment methods
//   const paymentMethods: PaymentMethod[] = [
//     {
//       id: 'upi',
//       name: 'UPI Payment',
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//         </svg>
//       )
//     },
//     {
//       id: 'qr',
//       name: 'Scan QR Code',
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
//         </svg>
//       )
//     },
//     {
//       id: 'card',
//       name: 'Credit/Debit Card',
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//         </svg>
//       )
//     },
//     {
//       id: 'netbanking',
//       name: 'Net Banking',
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//         </svg>
//       )
//     },
//     {
//       id: 'wallet',
//       name: 'Digital Wallet',
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
//         </svg>
//       )
//     },
//   ];

//   // State management
//   const [selectedPlan, setSelectedPlan] = useState<string>(membershipPlans[1].id); // Default to quarterly plan
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('upi');
//   const [customerName, setCustomerName] = useState<string>('');
//   const [customerEmail, setCustomerEmail] = useState<string>('');
//   const [customerPhone, setCustomerPhone] = useState<string>('');
//   const [upiId, setUpiId] = useState<string>('');
//   const [cardNumber, setCardNumber] = useState<string>('');
//   const [cardExpiry, setCardExpiry] = useState<string>('');
//   const [cardCvv, setCardCvv] = useState<string>('');
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);
//   const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
//   const [transactionId, setTransactionId] = useState<string | null>(null);
//   const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'waiting'>('pending'); // Added waiting state  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
//   const [paymentError, setPaymentError] = useState<string | null>(null); // To store error messages
//   const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
//   const [upiDeepLink, setUpiDeepLink] = useState<string | null>(null); // Added for UPI deep link

//   const pollingInterval = useRef<number | null>(null);

//   // Get selected plan details
//   const getSelectedPlan = (): MembershipPlan => {
//     return membershipPlans.find(plan => plan.id === selectedPlan) || membershipPlans[0];
//   };

//   // Simulate a transaction ID (in a real system, this would be generated on the server)
//   const generateTransactionId = (): string => {
//     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//   };
//   const getTotalAmount = () => {
//     const plan = getSelectedPlan();
//     return plan.price + Math.round(plan.price * 0.18);
//   };

//   // Function to generate UPI deep link (SIMULATED - for demonstration)
//   const generateUpiDeepLink = (amount: number, transactionId: string): string => {
//     // This is a VERY simplified example.  Real UPI deep links are more complex.
//     const upiLink = `upi://pay?pa=your-upi-id@examplebank&pn=YourMerchantName&mc=0000&tr=${transactionId}&am=${amount}&cu=INR`;
//     return upiLink;
//   };

//   // Simulate payment processing
//   const simulatePayment = async (paymentData: any): Promise<{ success: boolean, transactionId?: string, error?: string }> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         // Basic validation example
//         if (selectedPaymentMethod === 'card' && (paymentData.cardNumber.startsWith('4444') || parseInt(paymentData.cardCvv) === 123)) {
//           resolve({ success: false, error: 'Invalid card details. Please try again.' }); // Simulate a card error
//           return;
//         }

//         if (selectedPaymentMethod === 'upi' && !paymentData.upiId.includes('@')) {
//           resolve({ success: false, error: 'Invalid UPI ID format.' });
//           return;
//         }

//         const newTransactionId = generateTransactionId();
//         resolve({ success: true, transactionId: newTransactionId }); // Simulate successful payment
//       }, 2000); // Simulate 2 seconds processing time
//     });
//   };

//   // Simulate Polling Function to check payment status (This will be replaced with proper implementation for real payment)
//   const simulateCheckPaymentStatus = async (transactionId: string): Promise<boolean> => {
//     return new Promise((resolve) => {
//       // Simulate a 50% chance of success after a random delay (1-5 seconds)
//       const delay = Math.random() * 4000 + 1000; // 1 to 5 seconds
//       setTimeout(() => {
//         const isSuccess = Math.random() < 0.5;
//         resolve(isSuccess);
//       }, delay);
//     });
//   };

//   // Handle payment submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setPaymentError(null); // Clear any previous error
//     setIsProcessing(true);
//     setPaymentStatus('pending');
//     setShowPaymentConfirmation(false);
//     setQrCodeValue(null); // Clear previous QR code
//     setUpiDeepLink(null);
//     let paymentData: any = {
//       planId: selectedPlan,
//       amount: getSelectedPlan().price,
//       customerName: customerName,
//       customerEmail: customerEmail,
//       customerPhone: customerPhone,
//     };

//     const totalAmount = getTotalAmount();

//     switch (selectedPaymentMethod) {
//       case 'upi':
//         paymentData.upiId = upiId;
//         break;
//       case 'qr':
//         break;
//       case 'card':
//         paymentData.cardNumber = cardNumber;
//         paymentData.cardExpiry = cardExpiry;
//         paymentData.cardCvv = cardCvv;
//         break;
//       case 'netbanking':
//         //In real app this would include bank selection
//         break;
//       case 'wallet':
//         //wallet selection in real app
//         break;
//       default:
//         break;
//     }

//     // Generate transaction ID early
//     const newTransactionId = generateTransactionId();
//     setTransactionId(newTransactionId); //set TransactionId
//     if (selectedPaymentMethod === 'qr') {
//       // Generate UPI Deep Link and QR Code
//       const deepLink = generateUpiDeepLink(totalAmount, newTransactionId);
//       setUpiDeepLink(deepLink);
//       setQrCodeValue(deepLink);
//     }

//     const paymentResult = await simulatePayment(paymentData);

//     setIsProcessing(false);

//     if (paymentResult.success) {
//       //setTransactionId(paymentResult.transactionId!);
//       setPaymentStatus('waiting');

//       // Simulate polling for payment status
//       pollingInterval.current = window.setInterval(async () => {
//         const paymentSuccess = await simulateCheckPaymentStatus(newTransactionId);
//         if (paymentSuccess) {
//           setPaymentStatus('success');
//           window.clearInterval(pollingInterval.current!); // Stop polling
//         } else {
//           console.log('Payment still pending...');
//         }
//       }, 3000); // Check every 3 seconds
//     } else {
//       setPaymentStatus('failed');
//       setPaymentError(paymentResult.error || 'Payment failed. Please try again.');
//     }
//   };

//   useEffect(() => {
//     if (paymentStatus === 'success' || paymentStatus === 'failed') {
//       setShowPaymentConfirmation(true);
//       if (pollingInterval.current) {
//         window.clearInterval(pollingInterval.current);
//       }
//     }
//   }, [paymentStatus]);

//   // Format card number with spaces
//   const formatCardNumber = (value: string): string => {
//     return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
//   };

//   // Render QR code for QR payment method
//   const renderQRCode = () => {
//     const plan = getSelectedPlan();
//     const totalAmount = getTotalAmount();
//     return (
//       <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
//         {qrCodeValue ? (
//           <>
//             <QRCodeSVG value={qrCodeValue} size={256} level="H" />
//             <p className="mt-4 text-center text-gray-600">
//               Scan this QR code using any UPI app to pay ₹{totalAmount}
//             </p>
//             {/* Button to open UPI app directly (if possible) */}
//             {upiDeepLink && (
//               <a href={upiDeepLink} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
//                 target="_blank" rel="noopener noreferrer">
//                 Open UPI App
//               </a>
//             )}
//           </>
//         ) : (
//           <p>Generating QR Code...</p>
//         )}
//       </div>
//     );
//   };

//   // Render UPI payment form
//   const renderUPIForm = () => {
//     return (
//       <div className="mt-4">
//         <div className="mb-4">
//           <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
//           <input
//             type="text"
//             id="upiId"
//             placeholder="yourname@upi"
//             value={upiId}
//             onChange={(e) => setUpiId(e.target.value)}
//             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//             required
//           />
//         </div>
//         <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
//           <p>Enter your UPI ID and click Pay to complete the transaction</p>
//         </div>
//       </div>
//     );
//   };

//   // Render card payment form
//   const renderCardForm = () => {
//     return (
//       <div className="mt-4">
//         <div className="mb-4">
//           <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
//           <input
//             type="text"
//             id="cardNumber"
//             placeholder="1234 5678 9012 3456"
//             value={cardNumber}
//             onChange={(e) => setCardNumber(formatCardNumber(e.target.value.slice(0, 19)))}
//             maxLength={19}
//             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//             required
//           />
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
//             <input
//               type="text"
//               id="cardExpiry"
//               placeholder="MM/YY"
//               value={cardExpiry}
//               onChange={(e) => setCardExpiry(e.target.value)}
//               maxLength={5}
//               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
//             <input
//               type="password"
//               id="cardCvv"
//               placeholder="***"
//               value={cardCvv}
//               onChange={(e) => setCardCvv(e.target.value)}
//               maxLength={3}
//               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//               required
//             />
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Render net banking form
//   const renderNetBankingForm = () => {
//     return (
//       <div className="mt-4">
//         <label htmlFor="bank" className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
//         <select
//           id="bank"
//           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//         >
//           <option value="">Select your bank</option>
//           <option value="sbi">State Bank of India</option>
//           <option value="hdfc">HDFC Bank</option>
//           <option value="icici">ICICI Bank</option>
//           <option value="axis">Axis Bank</option>
//           <option value="kotak">Kotak Mahindra Bank</option>
//         </select>
//         <div className="mt-4 bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
//           <p>You will be redirected to your bank's secure payment gateway to complete the transaction</p>
//         </div>
//       </div>
//     );
//   };

//   // Render wallet form
//   const renderWalletForm = () => {
//     return (
//       <div className="mt-4">
//         <p className="mb-2 text-sm font-medium text-gray-700">Select your preferred digital wallet</p>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           <button className="bg-white border border-gray-300 rounded-md p-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
//             PayTM
//           </button>
//           <button className="bg-white border border-gray-300 rounded-md p-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
//             PhonePe
//           </button>
//           <button className="bg-white border border-gray-300 rounded-md p-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
//             Amazon Pay
//           </button>
//           <button className="bg-white border border-gray-300 rounded-md p-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
//             Google Pay
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // Render payment method form based on selected method
//   const renderPaymentMethodForm = () => {
//     switch (selectedPaymentMethod) {
//       case 'upi':
//         return renderUPIForm();
//       case 'qr':
//         return renderQRCode();
//       case 'card':
//         return renderCardForm();
//       case 'netbanking':
//         return renderNetBankingForm();
//       case 'wallet':
//         return renderWalletForm();
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           <div className="px-6 py-8 sm:p-10">

//             {/* Header */}
//             <div className="text-center mb-10">
//               <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose Your Membership Plan</h1>
//               <p className="mt-2 text-lg text-gray-600">Select the plan that works best for you</p>
//             </div>

//             {/* Membership Plans */}
//             <div className="flex flex-col lg:flex-row justify-center gap-8 mb-10">
//               {membershipPlans.map((plan) => (
//                 <div
//                   key={plan.id}
//                   className={`flex-1 min-w-0 bg-white rounded-lg overflow-hidden transition-all duration-200 transform ${
//                     selectedPlan === plan.id
//                       ? 'border-2 border-indigo-600 shadow-md scale-105'
//                       : 'border border-gray-200 hover:shadow-md hover:-translate-y-1'
//                   } ${plan.popular ? 'relative' : ''}`}
//                   onClick={() => setSelectedPlan(plan.id)}
//                 >
//                   {plan.popular && (
//                     <div className="absolute top-0 right-0">
//                       <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
//                         POPULAR
//                       </div>
//                     </div>
//                   )}
//                   <div className="p-6">
//                     <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {plan.duration} {plan.duration === 1 ? 'month' : 'months'}
//                     </p>
//                     <div className="mt-4">
//                       <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
//                     </div>
//                     <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
//                     <div className="mt-5">
//                       <div className="inline-flex items-center">
//                         <input
//                           type="radio"
//                           id={`plan-${plan.id}`}
//                           name="plan"
//                           checked={selectedPlan === plan.id}
//                           onChange={() => setSelectedPlan(plan.id)}
//                           className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
//                         />
//                         <label htmlFor={`plan-${plan.id}`} className="ml-2 text-sm font-medium text-gray-700">
//                           Select
//                         </label>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="space-y-8">
//                 {/* Customer Information */}
//                 <div className="bg-gray-50 p-6 rounded-lg">
//                   <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
//                       <input
//                         type="text"
//                         id="customerName"
//                         placeholder="Enter your full name"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
//                       <input
//                         type="email"
//                         id="customerEmail"
//                         placeholder="your.email@example.com"
//                         value={customerEmail}
//                         onChange={(e) => setCustomerEmail(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         required
//                       />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
//                       <input
//                         type="tel"
//                         id="customerPhone"
//                         placeholder="Your mobile number"
//                         value={customerPhone}
//                         onChange={(e) => setCustomerPhone(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                         required
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Payment Method Selection */}
//                 <div className="bg-gray-50 p-6 rounded-lg">
//                   <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>

//                   {/* Payment method tabs */}
//                   <div className="flex flex-wrap gap-2 mb-6">
//                     {paymentMethods.map((method) => (
//                       <button
//                         key={method.id}
//                         type="button"
//                         className={`flex items-center px-4 py-2.5 rounded-md transition-colors ${
//                           selectedPaymentMethod === method.id
//                             ? 'bg-indigo-600 text-white'
//                             : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//                         }`}
//                         onClick={() => setSelectedPaymentMethod(method.id)}
//                       >
//                         <span className="mr-2">{method.icon}</span>
//                         <span>{method.name}</span>
//                       </button>
//                     ))}
//                   </div>

//                   {/* Payment Method Form */}
//                   <div className="bg-white rounded-md border border-gray-200 p-4">
//                     {renderPaymentMethodForm()}
//                   </div>
//                 </div>

//                 {/* Order Summary */}
//                 <div className="bg-gray-50 p-6 rounded-lg">
//                   <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
//                   <div className="space-y-3 divide-y divide-gray-200">
//                     <div className="flex justify-between py-2">
//                       <span className="text-gray-600">Subscription Plan</span>
//                       <span className="font-medium">{getSelectedPlan().name} ({getSelectedPlan().duration} {getSelectedPlan().duration === 1 ? 'month' : 'months'})</span>
//                     </div>
//                     <div className="flex justify-between py-2">
//                       <span className="text-gray-600">Plan Price</span>
//                       <span className="font-medium">₹{getSelectedPlan().price}</span>
//                     </div>
//                     <div className="flex justify-between py-2">
//                       <span className="text-gray-600">Tax (18% GST)</span>
//                       <span className="font-medium">₹{Math.round(getSelectedPlan().price * 0.18)}</span>
//                     </div>
//                     <div className="flex justify-between py-3">
//                       <span className="text-lg font-bold text-gray-900">Total Amount</span>
//                       <span className="text-lg font-bold text-indigo-600">₹{getTotalAmount()}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Terms and conditions */}
//                 <div className="flex items-start">
//                   <div className="flex items-center h-5">
//                     <input
//                       id="terms"
//                       type="checkbox"
//                       checked={acceptTerms}
//                       onChange={(e) => setAcceptTerms(e.target.checked)}
//                       className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
//                       required
//                     />
//                   </div>
//                   <div className="ml-3 text-sm">
//                     <label htmlFor="terms" className="text-gray-600">
//                       I agree to the <a href="#terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
//                     </label>
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   type="submit"
//                   className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
//                     isProcessing || !acceptTerms ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
//                   }`}
//                   disabled={isProcessing || !acceptTerms}
//                 >
//                   {isProcessing ? (
//                     <span className="flex items-center">
//                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : (
//                     <span>Pay ₹{getTotalAmount()}</span>
//                   )}
//                 </button>
//               </div>
//             </form>

//             {/* Payment Confirmation */}
//             {setShowPaymentConfirmation && (
//               <div className="mt-8 p-6 bg-white rounded-md shadow-sm border border-gray-200">
//                 {paymentStatus === 'success' ? (
//                   <>
//                     <h2 className="text-2xl font-semibold text-green-600 mb-4">Payment Successful!</h2>
//                     <p className="text-gray-700">
//                       Thank you for your subscription. Your transaction ID is <strong>{transactionId}</strong>.
//                     </p>
//                   </>
//                 ) : paymentStatus === 'waiting' ? (
//                   <>
//                     <h2 className="text-2xl font-semibold text-yellow-600 mb-4">Waiting for Payment Confirmation</h2>
//                     <p className="text-gray-700">
//                       Please complete the payment on your UPI app.  We are waiting for confirmation...
//                     </p>
//                   </>
//                 ) : (
//                   <>
//                     <h2 className="text-2xl font-semibold text-red-600 mb-4">Payment Failed</h2>
//                     <p className="text-gray-700">
//                       There was an error processing your payment. Please try again later.
//                     </p>
//                     {paymentError && <p className="mt-2 text-red-500">{paymentError}</p>}
//                   </>
//                 )}
//               </div>
//             )}           
//              {/* Secure payment notice */}
//             <div className="flex items-center justify-center mt-6 text-gray-500 text-sm">
//               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//               </svg>
//               <span>Secure payment processed with end-to-end encryption</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;

// function setShowPaymentConfirmation(arg0: boolean) {
//   throw new Error('Function not implemented.');
// }



import React from 'react'

const Subscribe = () => {
  return (
    <div>
      
    </div>
  )
}

export default Subscribe
