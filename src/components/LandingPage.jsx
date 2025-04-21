import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Lightbulb, ArrowRight, ChevronRight,
  MessageSquare, Search, Download, Youtube, Crown, Check, X
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { checkPremiumSubscription } from './RazorpayService';
import PaymentSelector from './PaymentSelector';
import dashboardPreview from './image.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const { current: user } = useUser();
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isPremium: false,
    loading: true
  });

  useEffect(() => {
    // Check subscription status if user is logged in
    if (user) {
      checkUserSubscription();
    } else {
      setSubscriptionStatus({
        isPremium: false,
        loading: false
      });
    }
  }, [user]);

  const checkUserSubscription = async () => {
    if (!user) return;
    
    try {
      const result = await checkPremiumSubscription(user.$id);
      setSubscriptionStatus({
        isPremium: result.isPremium,
        subscription: result.subscription,
        loading: false,
        daysRemaining: result.daysRemaining,
        expiryDate: result.expiryDate
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionStatus({
        isPremium: false,
        loading: false
      });
    }
  };

  const onGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handlePremiumSubscription = () => {
    // If not logged in, redirect to signup
    if (!user) {
      navigate('/signup');
      return;
    }
    
    // If already premium, go to dashboard
    if (subscriptionStatus.isPremium) {
      navigate('/dashboard');
      return;
    }
    
    // Show payment selector modal
    setShowPaymentSelector(true);
  };

  const handlePaymentSuccess = async (result) => {
    // Update the subscription status
    await checkUserSubscription();
    alert("Congratulations! You are now a premium member.");
    navigate('/dashboard');
  };

  const handlePaymentCancel = () => {
    setShowPaymentSelector(false);
  };

  // Payment selector modal
  const PaymentModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full relative">
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-white p-2" 
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <PaymentSelector 
        user={user}
          onSuccess={handlePaymentSuccess} 
          onCancel={handlePaymentCancel} 
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showPaymentSelector && <PaymentModal onClose={() => setShowPaymentSelector(false)} />}
      
      {/* Header */}
      <header className="p-4 bg-gray-800 shadow-md fixed w-full top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Youtube className="text-red-600" />
            <h1 className="text-xl font-bold">Audience Lens</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                {subscriptionStatus.isPremium && (
                  <div className="flex items-center bg-gradient-to-r from-red-700 to-red-500 px-3 py-1 rounded-full">
                    <Crown className="text-yellow-300 mr-1" size={16} />
                    <span className="text-sm font-medium text-white">Premium</span>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                >
                  Dashboard <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-3 py-1 text-white hover:text-red-400 transition"
                >
                  Login
                </button>
                <button 
                  onClick={onGetStarted}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                >
                  Get Started <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 relative overflow-hidden">
          {/* Background Animation Particles */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-red-500"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 100 + 20}px`,
                  height: `${Math.random() * 100 + 20}px`,
                  opacity: Math.random() * 0.5 + 0.1,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>
          
          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Discover What Your <span className="text-red-500">Viewers</span> Really Think
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Transform your YouTube comments into actionable insights with our powerful AI-driven comment analysis tool.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onGetStarted}
                  className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition flex items-center justify-center gap-2 text-lg font-medium"
                >
                  Get Started <ChevronRight size={20} />
                </button>
                <a 
                  href="#pricing"
                  className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center justify-center gap-2 text-lg font-medium"
                >
                  View Plans
                </a>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative z-10">
              <div className="relative bg-gray-800 p-4 rounded-lg shadow-xl">
                <div className="absolute -top-2 left-4 right-4 h-2 bg-red-600 rounded-t-lg"></div>
                <img src={dashboardPreview} alt="Dashboard preview" className="w-full h-auto rounded border border-gray-700" />
                <div className="absolute -bottom-4 right-8 transform rotate-12 bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="text-sm font-medium">Positive</div>
                    <div className="text-lg font-bold">76%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Sentiment Analysis</h3>
                <p className="text-gray-300">
                  Automatically classify comments as positive, neutral, or negative to gauge audience sentiment.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="text-blue-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Theme Extraction</h3>
                <p className="text-gray-300">
                  Identify recurring topics and themes from your video comments to understand what resonates.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="text-green-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Actionable Insights</h3>
                <p className="text-gray-300">
                  Get AI-generated recommendations based on viewer feedback to improve your content.
                </p>
              </div>
              
              {/* Feature 4 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Search className="text-purple-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Comment Exploration</h3>
                <p className="text-gray-300">
                  Search, filter, and browse all comments from your video in a clean, organized interface.
                </p>
              </div>
              
              {/* Feature 5 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Download className="text-yellow-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Export Data</h3>
                <p className="text-gray-300">
                  Download all comments and analysis results as CSV files for further research or record-keeping.
                </p>
              </div>
              
              {/* Feature 6 */}
              <div className="bg-gray-700 rounded-lg p-6 shadow-lg transition-transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-orange-500" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Growth Opportunities</h3>
                <p className="text-gray-300">
                  Identify questions from viewers and content suggestions to plan your future videos.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
              {/* Step 1 */}
              <div className="max-w-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Enter YouTube URL</h3>
                <p className="text-gray-300">
                  Simply paste the URL of any YouTube video you want to analyze.
                </p>
              </div>
              
              {/* Arrow */}
              <div className="hidden md:block self-center">
                <ArrowRight size={32} className="text-gray-600" />
              </div>
              
              {/* Step 2 */}
              <div className="max-w-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-300">
                  Our AI processes all comments, extracting sentiment, themes, and insights.
                </p>
              </div>
              
              {/* Arrow */}
              <div className="hidden md:block self-center">
                <ArrowRight size={32} className="text-gray-600" />
              </div>
              
              {/* Step 3 */}
              <div className="max-w-xs flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Review Insights</h3>
                <p className="text-gray-300">
                  Explore the detailed dashboard with actionable recommendations for your content.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
            <p className="text-xl text-center text-gray-300 mb-12 max-w-2xl mx-auto">
              Select the plan that best fits your content creation needs
            </p>
            
            <div className="flex flex-col md:flex-row gap-8 justify-center max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-gray-700 rounded-lg shadow-lg p-6 flex flex-col w-full md:w-1/2 border-2 border-gray-600">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <div className="flex items-end mb-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-300">Perfect for casual creators just getting started</p>
                </div>
                
                <div className="flex-grow">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Analyze up to 3 videos per month</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Basic sentiment analysis</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Key themes identification</span>
                    </li>
                    <li className="flex items-start">
                      <X size={20} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <X size={20} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">Custom reports</span>
                    </li>
                    <li className="flex items-start">
                      <X size={20} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">Priority support</span>
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={onGetStarted}
                  className="w-full py-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition font-medium"
                >
                  Get Started
                </button>
              </div>
              
              {/* Premium Plan */}
              <div className="bg-gray-700 rounded-lg shadow-lg p-6 flex flex-col w-full md:w-1/2 border-2 border-red-500 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  RECOMMENDED
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <h3 className="text-2xl font-bold">Premium</h3>
                    <Crown className="text-yellow-400 ml-2" size={20} />
                  </div>
                  <div className="flex items-end mb-4">
                    <span className="text-4xl font-bold">$15</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <p className="text-gray-300">For serious creators who want deep audience insights</p>
                </div>
                
                <div className="flex-grow">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Unlimited video analysis</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Advanced sentiment analysis</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Comprehensive theme extraction</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Audience growth recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Custom PDF reports</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Priority email support</span>
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={handlePremiumSubscription}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    subscriptionStatus.isPremium 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } transition`}
                >
                  {subscriptionStatus.isPremium ? (
                    <>
                      <Check className="mr-2" size={18} />
                      {subscriptionStatus.daysRemaining > 0 
                        ? `Active (${subscriptionStatus.daysRemaining} days left)` 
                        : 'Currently Active'}
                    </>
                  ) : user ? 'Upgrade Now' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-red-900 to-red-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Understand Your Audience?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Start analyzing your YouTube comments today and transform viewer feedback into content opportunities.
            </p>
            <button 
              onClick={user ? (subscriptionStatus.isPremium ? () => navigate('/dashboard') : handlePremiumSubscription) : onGetStarted}
              className="px-8 py-4 bg-white text-red-600 rounded-lg text-xl font-bold hover:bg-gray-100 transition shadow-lg"
            >
              {user ? (subscriptionStatus.isPremium ? 'Go to Dashboard' : 'Get Premium') : 'Get Started Now'}
            </button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-8 bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <Youtube className="text-red-600 mr-2" />
            <h2 className="text-xl font-bold">Audience Lens</h2>
          </div>
          <p className="text-gray-400">© 2025 Audience Lens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;