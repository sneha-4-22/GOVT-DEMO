import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { updateUserSubscription } from './RazorpayService';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { current: user } = useUser();
  
  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const provider = params.get('provider') || 'stripe'; // Default to stripe if not specified
        
        // Get user ID (from current user or URL parameter)
        const userId = user ? user.$id : params.get('userId');
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        console.log("User ID for subscription:", userId);
        
        // Set subscription to expire in exactly 1 month
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        
        let subscriptionDetails;
        
        if (provider === 'stripe') {
          // Process Stripe payment
          const paymentIntentId = params.get('payment_intent');
          const paymentIntentClientSecret = params.get('payment_intent_client_secret');
          const redirectStatus = params.get('redirect_status');
          
          console.log("Payment Intent ID:", paymentIntentId);
          console.log("Client Secret:", paymentIntentClientSecret);
          console.log("Redirect Status:", redirectStatus);
          
          // Make sure we have the necessary data and success status
          if (!paymentIntentId || !paymentIntentClientSecret) {
            throw new Error('Payment information is incomplete');
          }
          
          if (redirectStatus !== 'succeeded') {
            throw new Error('Payment was not successful');
          }
          
          // Use standardized attribute structure - same as Razorpay's
          subscriptionDetails = {
            plan: "premium",
            payment_id: paymentIntentId,
            order_id: paymentIntentClientSecret.split('_secret')[0],
            signature: "", // Stripe doesn't use signatures like Razorpay
            provider: "stripe",
            end_date: oneMonthFromNow.toISOString()
          };
        } else if (provider === 'razorpay') {
          // Process Razorpay payment (if redirected here from Razorpay)
          const paymentId = params.get('razorpay_payment_id');
          const orderId = params.get('razorpay_order_id');
          const signature = params.get('razorpay_signature');
          
          console.log("Razorpay Payment ID:", paymentId);
          console.log("Razorpay Order ID:", orderId);
          console.log("Razorpay Signature:", signature);
          
          // Make sure we have the necessary data
          if (!paymentId || !orderId || !signature) {
            throw new Error('Razorpay payment information is incomplete');
          }
          
          subscriptionDetails = {
            plan: "premium",
            payment_id: paymentId,
            order_id: orderId,
            signature: signature,
            provider: "razorpay",
            end_date: oneMonthFromNow.toISOString()
          };
        } else {
          throw new Error('Unknown payment provider');
        }
        
        console.log("Updating subscription with details:", subscriptionDetails);
        
        // Update subscription in database
        const result = await updateUserSubscription(userId, subscriptionDetails);
        console.log("Subscription update result:", result);
        
        if (!result) {
          throw new Error('Failed to update subscription');
        }
        
        setLoading(false);
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        
      } catch (error) {
        console.error('Error processing payment:', error);
        setError(error.message || "An unknown error occurred");
        setLoading(false);
      }
    };
    
    processPayment();
  }, [location, navigate, user]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Background animated particles */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-red-500"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 50 + 10}px`,
                height: `${Math.random() * 50 + 10}px`,
                opacity: Math.random() * 0.5 + 0.1,
                animation: `float ${Math.random() * 10 + 5}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300">Processing your payment...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-3xl">×</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium text-white"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="text-center py-6 relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 text-green-500">
              <CheckCircle size={80} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Payment Successful!</h2>
            <div className="inline-flex items-center bg-gradient-to-r from-red-700 to-red-500 px-4 py-2 rounded-full mb-6">
              <Crown className="text-yellow-300 mr-2" size={18} />
              <span className="font-medium text-white">Premium Activated</span>
            </div>
            <p className="text-gray-300 mb-2">Thank you for subscribing to Premium. Your account has been upgraded!</p>
            <p className="text-gray-400 text-sm mb-6">Redirecting to dashboard in 3 seconds...</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium text-white flex items-center justify-center mx-auto gap-2"
            >
              Go to Dashboard Now
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;