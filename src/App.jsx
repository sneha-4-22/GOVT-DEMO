import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Search, Download, Youtube, MessageSquare, ThumbsUp, 
  Eye, Calendar, User, Clock, RefreshCw, AlertTriangle 
} from 'lucide-react';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [sentimentData, setSentimentData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [csvPath, setCsvPath] = useState('');
  
  const COLORS = ['#10B981', '#6B7280', '#EF4444'];
  const SENTIMENT_LABELS = {
    'Positive': '#10B981',
    'Neutral': '#6B7280',
    'Negative': '#EF4444'
  };
  const API_URL = 'https://yt-comments-production.up.railway.app';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL
    if (!videoUrl || (!videoUrl.includes('youtube.com/') && !videoUrl.includes('youtu.be/'))) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideoDetails(null);
    setComments([]);
    setAnalysis(null);
    setSentimentData([]);
    
    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }
      
      setVideoDetails(data.videoDetails);
      setComments(data.comments);
      setAnalysis(data.analysis);
      setSentimentData(data.sentimentData);
      setCsvPath(data.csvPath);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCommentsAsCsv = () => {
    if (comments.length === 0) return;
    
    // Create CSV content
    const headers = ['author', 'text', 'likes', 'published_at'];
    const csvContent = [
      headers.join(','),
      ...comments.map(comment => 
        [
          `"${comment.author.replace(/"/g, '""')}"`, 
          `"${comment.text.replace(/"/g, '""').replace(/<[^>]*>/g, '')}"`,
          comment.likes,
          comment.published_at
        ].join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `youtube_comments_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory
  };
  
  const downloadCsv = () => {
    if (csvPath) {
      window.open(`${API_URL}/download/${csvPath}`, '_blank');
    }
  };
  
  const filteredComments = comments.filter(comment => 
    comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.author.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-lg">
          <p className="text-sm">{`${payload[0].name}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="p-4 bg-gray-800 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Youtube className="text-red-600" />
            <h1 className="text-xl font-bold">YouTube Comment Analyzer</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {/* Search Form */}
        <div className="p-6 mb-6 rounded-lg shadow-md bg-gray-800">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter YouTube video URL"
              className="flex-grow p-2 rounded border bg-gray-700 border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button 
              type="submit" 
              className={`px-4 py-2 rounded ${isLoading ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white font-medium transition`}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw className="animate-spin mx-auto" /> : 'Analyze'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded flex items-center gap-2">
              <AlertTriangle size={18} />
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {videoDetails && (
          <>
            {/* Video Overview Section */}
            <div className="p-6 mb-6 rounded-lg shadow-md bg-gray-800">
              <h2 className="text-xl font-bold mb-4">Video Overview</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img 
                    src={videoDetails.thumbnail} 
                    alt={videoDetails.title} 
                    className="w-full h-auto rounded"
                  />
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-lg font-semibold">{videoDetails.title}</h3>
                  <p className="text-gray-400 mb-4">{videoDetails.channel}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors">
                      <Eye className="text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-400">Views</p>
                        <p className="font-medium">{formatNumber(Number(videoDetails.view_count))}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors">
                      <ThumbsUp className="text-green-500" />
                      <div>
                        <p className="text-sm text-gray-400">Likes</p>
                        <p className="font-medium">{formatNumber(Number(videoDetails.like_count))}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors">
                      <MessageSquare className="text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-400">Comments</p>
                        <p className="font-medium">{formatNumber(Number(videoDetails.comment_count))}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded flex items-center gap-2 bg-gray-700 hover:bg-gray-600 transition-colors">
                      <Calendar className="text-red-500" />
                      <div>
                        <p className="text-sm text-gray-400">Published</p>
                        <p className="font-medium">{formatDate(videoDetails.published_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Insights Section */}
            {analysis && (
              <div className="p-6 mb-6 rounded-lg shadow-md bg-gray-800">
                <h2 className="text-xl font-bold mb-4">AI Insights</h2>
                
                {/* First row: Sentiment Chart and Key Themes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Sentiment Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Sentiment Analysis</h3>
                    <div className="h-64 bg-gray-700 p-4 rounded">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, value}) => `${name} ${value}%`}
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                      {Object.entries(SENTIMENT_LABELS).map(([label, color]) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></div>
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Themes */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Themes</h3>
                    <div className="p-4 rounded bg-gray-700 mb-4 h-40 overflow-y-auto">
                      {analysis.themes && analysis.themes.length > 0 ? (
                        <ul className="space-y-2">
                          {analysis.themes.map((theme, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {theme}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No key themes identified.</p>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">Questions From Viewers</h3>
                    <div className="p-4 rounded bg-gray-700 h-40 overflow-y-auto">
                      {analysis.questions && analysis.questions.length > 0 ? (
                        <ul className="space-y-2">
                          {analysis.questions.map((question, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              {question}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">No questions identified from viewers.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Second row: Feedback content that spans full width for more space */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Feedback */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Feedback Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Positive Feedback - Left Column */}
                      <div className="p-4 rounded bg-green-900/20 border border-green-800">
                        <h4 className="font-medium text-green-400 mb-2">Positive Feedback</h4>
                        {analysis.positiveFeedback && analysis.positiveFeedback.length > 0 ? (
                          <ul className="space-y-1">
                            {analysis.positiveFeedback.map((item, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400">No positive feedback identified.</p>
                        )}
                      </div>
                      
                      {/* Areas for Improvement - Right Column */}
                      <div className="p-4 rounded bg-red-900/20 border border-red-800">
                        <h4 className="font-medium text-red-400 mb-2">Areas for Improvement</h4>
                        {analysis.negativeFeedback && analysis.negativeFeedback.summary && (
                          <p className="mb-3">{analysis.negativeFeedback.summary}</p>
                        )}
                        {analysis.negativeFeedback && analysis.negativeFeedback.points && 
                         analysis.negativeFeedback.points.length > 0 ? (
                          <ul className="space-y-2">
                            {analysis.negativeFeedback.points.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-2"></span>
                                <div>
                                  <p>{item}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400">No areas for improvement identified.</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Impact Analysis & Viewer Suggestions - Full width for more details */}
                    <div className="space-y-4">
                      {/* Impact Analysis */}
                      {analysis.negativeFeedback && analysis.negativeFeedback.impact && (
                        <div className="p-4 rounded bg-red-900/20 border border-red-800">
                          <h4 className="font-medium text-red-400 mb-2">Impact Analysis</h4>
                          <p>{analysis.negativeFeedback.impact}</p>
                        </div>
                      )}
                      
                      {/* Viewer Suggestions */}
                      <div className="p-4 rounded bg-blue-900/20 border border-blue-800">
                        <h4 className="font-medium text-blue-400 mb-2">Viewer Suggestions</h4>
                        {analysis.suggestions && analysis.suggestions.summary && (
                          <p className="mb-3">{analysis.suggestions.summary}</p>
                        )}
                        {analysis.suggestions && analysis.suggestions.details && 
                         analysis.suggestions.details.length > 0 ? (
                          <ul className="space-y-2">
                            {analysis.suggestions.details.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500 mt-2"></span>
                                <div>
                                  <p>{item}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400">No viewer suggestions identified.</p>
                        )}
                        
                        {/* Implementation Strategy */}
                        {analysis.suggestions && analysis.suggestions.implementation && (
                          <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
                            <p className="text-sm font-medium">Implementation Strategy:</p>
                            <p className="text-sm">{analysis.suggestions.implementation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Comments Section */}
            <div className="p-6 mb-6 rounded-lg shadow-md bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-bold">Comments ({comments.length})</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-0">
                  <div className="relative flex items-center bg-gray-700 rounded">
                    <Search size={16} className="absolute left-3 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search comments..."
                      className="pl-10 pr-4 py-2 rounded w-full sm:w-auto bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    onClick={downloadCommentsAsCsv}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                    disabled={comments.length === 0}
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                </div>
              </div>
              
              {filteredComments.length === 0 ? (
                <div className="p-8 text-center rounded bg-gray-700">
                  <p className="text-gray-400">No comments found matching your search.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <div 
                        key={comment.comment_id}
                        className="p-4 rounded bg-gray-700 hover:bg-gray-650 transition-colors"
                      >
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="text-gray-400" size={16} />
                            <span className="font-medium">{comment.author}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock size={14} />
                            {formatDate(comment.published_at)}
                          </div>
                        </div>
                        
                        <p className="mb-2" dangerouslySetInnerHTML={{ __html: comment.text }}></p>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <ThumbsUp size={14} />
                          {comment.likes} likes
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      
    </div>
  );
}

export default App;