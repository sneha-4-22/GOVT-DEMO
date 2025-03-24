import React from 'react';
import { 
  BarChart3, TrendingUp, Lightbulb, ArrowRight, ChevronRight,
  MessageSquare, Search, Download, Youtube 
} from 'lucide-react';
import dashboardPreview from './image.png';
const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="p-4 bg-gray-800 shadow-md fixed w-full top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Youtube className="text-red-600" />
            <h1 className="text-xl font-bold">YouTube Comment Analyzer</h1>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
          >
            Get Started <ArrowRight size={16} />
          </button>
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
                  href="#features"
                  className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center justify-center gap-2 text-lg font-medium"
                >
                  Learn More
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
        
        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-red-900 to-red-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Understand Your Audience?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Start analyzing your YouTube comments today and transform viewer feedback into content opportunities.
            </p>
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-red-600 rounded-lg text-xl font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Get Started Now
            </button>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-8 bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <Youtube className="text-red-600 mr-2" />
            <h2 className="text-xl font-bold">YouTube Comment Analyzer</h2>
          </div>
          <p className="text-gray-400">© 2025 YouTube Comment Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;