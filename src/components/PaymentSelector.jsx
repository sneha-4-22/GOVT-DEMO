import React, { useState, useEffect } from 'react';
import { 
  Crown, Globe, 
  DollarSign, IndianRupee, 
  Check, AlertCircle, X 
} from 'lucide-react';
import { initiateRazorpaySubscription } from './RazorpayService';

const PaymentSelector = ({ user, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeElement, setStripeElement] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeLoadAttempts, setStripeLoadAttempts] = useState(0);
  
  // Load Stripe script and initialize elements when Stripe is selected
  useEffect(() => {
    if (paymentMethod === 'stripe' && !stripeLoaded && stripeLoadAttempts < 3) {
      // Clear any previous errors
      setError(null);
      setLoadingStripe(true);
      
      // Load Stripe.js script
      const loadStripe = async () => {
        try {
          if (window.Stripe) {
            // Stripe already loaded
            initializeStripe();
            return;
          }
          
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.async = true;
          
          script.onload = () => {
            initializeStripe();
          };
          
          script.onerror = () => {
            handleStripeError("Failed to load payment processor. Please try again or use Razorpay instead.");
          };
          
          document.body.appendChild(script);
          
          // Set a timeout for script loading
          setTimeout(() => {
            if (!stripeLoaded) {
              handleStripeError("Payment processor is taking too long to load. Please try Razorpay instead.");
            }
          }, 10000); // 10 second timeout
        } catch (err) {
          handleStripeError("Error initializing payment: " + err.message);
        }
      };
      
      const initializeStripe = async () => {
        try {
          // Fetch API key from backend
          const keysResponse = await fetch("https://server-5mbo.onrender.com/api/payment-keys");
          if (!keysResponse.ok) {
            throw new Error("Could not get payment configuration");
          }
          
          const keys = await keysResponse.json();
          const stripePublishableKey = keys.stripe_publishable_key;
          
          if (!stripePublishableKey) {
            throw new Error("Missing Stripe configuration");
          }
          
          const stripeInstance = window.Stripe(stripePublishableKey);
          setStripe(stripeInstance);
          setStripeLoaded(true);
          
          // Create payment intent on backend to get the client secret
          const response = await fetch("https://server-5mbo.onrender.com/api/create-stripe-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: 15 * 100, // $15 in cents
              currency: "USD",
              user_id: user ? user.$id : "guest",
              plan: "premium"
            })
          });
          
          if (!response.ok) {
            throw new Error("Could not initialize payment");
          }
          
          const paymentData = await response.json();
          if (paymentData.clientSecret) {
            setClientSecret(paymentData.clientSecret);
          } else {
            throw new Error("Failed to create payment intent");
          }
          
          setLoadingStripe(false);
        } catch (error) {
          handleStripeError("Error: " + error.message);
        }
      };
      
      const handleStripeError = (message) => {
        console.error(message);
        setError(message);
        setLoadingStripe(false);
        setStripeLoadAttempts(prev => prev + 1);
      };
      
      loadStripe();
    }
  }, [paymentMethod, stripeLoaded, user, stripeLoadAttempts]);

  // Initialize Stripe Elements when Stripe is loaded and client secret is available
  useEffect(() => {
    const mountStripeElement = () => {
      if (stripe && clientSecret && paymentMethod === 'stripe' && !stripeElement) {
        try {
          // Create payment elements WITH client secret
          const elements = stripe.elements({
            clientSecret: clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#EF4444',
                colorBackground: '#1F2937',
                colorText: '#FFFFFF',
                colorDanger: '#EF4444',
              },
            }
          });
          
          // Create the Payment Element
          const paymentElement = elements.create('payment');
          
          // Mount the payment element to the DOM
          const paymentContainer = document.getElementById('stripe-payment-element');
          if (paymentContainer) {
            paymentElement.mount(paymentContainer);
            setStripeElement(elements);
          } else {
            // If container not found, retry after a short delay
            setTimeout(mountStripeElement, 200);
          }
        } catch (err) {
          setError("Error setting up payment form: " + err.message);
        }
      }
    };
    
    mountStripeElement();
  }, [stripe, paymentMethod, stripeElement, clientSecret]);

  const handlePayment = async () => {
    if (!user) {
      setError("Please log in to continue");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      let result;
      
      if (paymentMethod === 'razorpay') {
        // For Razorpay, we use the razorpay modal from their SDK
        result = await initiateRazorpaySubscription(user, 1500); // ₹1500 (equivalent to $15)
      } else if (paymentMethod === 'stripe') {
        // Handle Stripe payment
        if (!stripe || !stripeElement) {
          throw new Error("Stripe is not properly initialized");
        }
        
        // Confirm the payment with Stripe.js using existing client secret
        const { error: submitError } = await stripe.confirmPayment({
          elements: stripeElement,
          confirmParams: {
            // Make sure to include user ID and provider in the return URL
            return_url: `${window.location.origin}/payment-success?userId=${user.$id}&provider=stripe`,
          },
          redirect: 'always', // Change to 'always' to ensure redirect
        });
        
        // We won't reach this code if redirect is 'always'
        if (submitError) {
          throw submitError;
        }
        
        // If we somehow get here without redirect, report success
        result = {
          success: true,
          message: "Payment processing..."
        };
      }
      
      if (result && result.success) {
        onSuccess && onSuccess(result);
      } else if (result) {
        setError(result.message || "Payment failed. Please try again.");
        onCancel && onCancel(result);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || "An unexpected error occurred. Please try again.");
      onCancel && onCancel({ success: false, message: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Stripe if we switch back to it after an error
  const handlePaymentMethodChange = (method) => {
    if (method === 'stripe' && error && stripeLoadAttempts > 0) {
      setStripeLoadAttempts(0);
      setError(null);
    }
    setPaymentMethod(method);
  };

  const renderStripeSection = () => {
    if (loadingStripe) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300 text-sm">Loading payment form...</p>
        </div>
      );
    }
    
    if (error && stripeLoadAttempts >= 3) {
      return (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg">
          <div className="flex items-start mb-2">
            <AlertCircle className="mt-0.5 mr-2 flex-shrink-0" size={16} />
            <span>We're having trouble loading Stripe. Please try Razorpay instead or try again later.</span>
          </div>
          <button 
            className="mt-2 text-red-400 hover:text-red-500 text-sm flex items-center"
            onClick={() => {
              setStripeLoadAttempts(0);
              setError(null);
              handlePaymentMethodChange('stripe');
            }}
          >
            <span>Try again</span>
            <svg className="ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
            </svg>
          </button>
        </div>
      );
    }
    
    return (
      <div id="stripe-payment-element" className="stripe-payment-element min-h-32"></div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Crown className="text-yellow-400" size={20} />
          <h3 className="text-xl font-bold">Choose Payment Method</h3>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Razorpay Option */}
        <div 
          className={`flex items-center p-4 rounded-lg border-2 transition cursor-pointer ${
            paymentMethod === 'razorpay' 
              ? 'border-red-500 bg-gray-700' 
              : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
          }`}
          onClick={() => handlePaymentMethodChange('razorpay')}
        >
          <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
            <IndianRupee className="text-red-500" size={20} />
          </div>
          <div className="ml-4 flex-grow">
            <h4 className="font-semibold">Razorpay</h4>
            <p className="text-lg font-bold text-white">₹1500<span className="text-sm font-normal text-gray-400">/month</span></p>
            <span className="text-xs text-gray-400">Recommended for Indian users</span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center">
            {paymentMethod === 'razorpay' && (
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            )}
          </div>
        </div>
        
        {/* Stripe Option */}
        <div 
          className={`flex items-center p-4 rounded-lg border-2 transition cursor-pointer ${
            paymentMethod === 'stripe' 
              ? 'border-red-500 bg-gray-700' 
              : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
          }`}
          onClick={() => handlePaymentMethodChange('stripe')}
        >
          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <div className="ml-4 flex-grow">
            <h4 className="font-semibold">Stripe</h4>
            <p className="text-lg font-bold text-white">$15<span className="text-sm font-normal text-gray-400">/month</span></p>
            <span className="text-xs text-gray-400">Recommended for international users</span>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center">
            {paymentMethod === 'stripe' && (
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stripe Payment Element Container */}
      {paymentMethod === 'stripe' && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          {renderStripeSection()}
        </div>
      )}
      
      {error && paymentMethod !== 'stripe' && (
        <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded-lg flex items-start">
          <AlertCircle className="mt-0.5 mr-2 flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <button 
        className={`mt-6 w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center transition ${
          isProcessing || (paymentMethod === 'stripe' && (!stripeLoaded || !stripeElement || !clientSecret || loadingStripe))
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700'
        }`}
        onClick={handlePayment}
        disabled={isProcessing || (paymentMethod === 'stripe' && (!stripeLoaded || !stripeElement || !clientSecret || loadingStripe))}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </>
        ) : 'Continue Payment'}
      </button>
      
      <div className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center">
        <Globe className="mr-1" size={14} />
        Secure payments processed by Razorpay (India) or Stripe (International)
      </div>
    </div>
  );
};

export default PaymentSelector;