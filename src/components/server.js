// server.js - Main entry point for Express application
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { parse } = require('url');
// Remove the require for string-strip-html
// const { stripHtml } = require('string-strip-html');
const csv = require('fast-csv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get API keys from environment variables
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MINDS_API_KEY = process.env.MINDS_API_KEY;

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_API_KEY
});

// Helper Functions
const extractVideoId = (url) => {
  const pattern = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
  const match = url.match(pattern);
  if (match) {
    return match[1];
  }
  return null;
};

const getComments = async (videoId) => {
  let comments = [];
  let nextPageToken = null;
  
  try {
    do {
      const params = {
        part: 'snippet',
        videoId: videoId,
        maxResults: 100
      };
      
      if (nextPageToken) {
        params.pageToken = nextPageToken;
      }
      
      const response = await youtube.commentThreads.list(params);
      const items = response.data.items;
      
      for (const item of items) {
        const commentData = {
          comment_id: item.id,
          author: item.snippet.topLevelComment.snippet.authorDisplayName,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          likes: item.snippet.topLevelComment.snippet.likeCount || 0,
          published_at: item.snippet.topLevelComment.snippet.publishedAt
        };
        comments.push(commentData);
      }
      
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return comments;
  }
};

const getVideoDetails = async (videoId) => {
  try {
    const response = await youtube.videos.list({
      part: 'snippet,statistics,contentDetails',
      id: videoId
    });
    
    if (response.data.items && response.data.items.length > 0) {
      const item = response.data.items[0];
      const thumbnails = item.snippet.thumbnails;
      const thumbnailUrl = 
        thumbnails.maxres?.url || 
        thumbnails.high?.url || 
        thumbnails.medium?.url || 
        thumbnails.default?.url;
      
      return {
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        published_at: item.snippet.publishedAt,
        view_count: item.statistics.viewCount || 0,
        like_count: item.statistics.likeCount || 0,
        comment_count: item.statistics.commentCount || 0,
        thumbnail: thumbnailUrl
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

const getAiResponse = async (prompt, mindsApiKey) => {
  const client = new OpenAI({
    apiKey: mindsApiKey,
    baseURL: 'https://llm.mdb.ai/'
  });
  
  try {
    const completion = await client.chat.completions.create({
      model: 'aiagent',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return null;
  }
};

const analyzeComments = async (comments, videoDetails) => {
  // Don't limit comments - use all available comments for better analysis
  // Process comments in batches if necessary to avoid token limits
  let commentsToAnalyze = comments;
  
  // If there are too many comments, we can take a representative sample
  if (comments.length > 500) {
    const samplingRate = Math.ceil(comments.length / 500);
    commentsToAnalyze = comments.filter((_, index) => index % samplingRate === 0);
    
    // Make sure we have at least some of the most recent and most liked comments
    const recentComments = [...comments].sort((a, b) => 
      new Date(b.published_at) - new Date(a.published_at)
    ).slice(0, 25);
    
    const mostLikedComments = [...comments].sort((a, b) => 
      b.likes - a.likes
    ).slice(0, 25);
    
    // Add these to our sample without duplicates
    const existingIds = new Set(commentsToAnalyze.map(c => c.comment_id));
    recentComments.forEach(comment => {
      if (!existingIds.has(comment.comment_id)) {
        commentsToAnalyze.push(comment);
        existingIds.add(comment.comment_id);
      }
    });
    
    mostLikedComments.forEach(comment => {
      if (!existingIds.has(comment.comment_id)) {
        commentsToAnalyze.push(comment);
        existingIds.add(comment.comment_id);
      }
    });
  }
  
  // Create a more detailed representation of comments
  const allCommentsText = commentsToAnalyze.map(
    c => `Author: ${c.author}\nComment: ${c.text}\nLikes: ${c.likes}\nPublished: ${c.published_at}`
  ).join('\n\n');
  
  const prompt = `
    Perform a detailed analysis of the following YouTube comments for the video "${videoDetails.title}" by ${videoDetails.channel}. 

    VIDEO DETAILS:
    Title: ${videoDetails.title}
    Channel: ${videoDetails.channel}
    Views: ${videoDetails.view_count}
    Likes: ${videoDetails.like_count}
    Comments: ${videoDetails.comment_count}
    Total Comments Analyzed: ${commentsToAnalyze.length} out of ${comments.length}

    COMMENTS:
    ${allCommentsText}

    Your task is to extract meaningful, specific insights from these comments. Avoid generic observations.
    
    Please provide a structured JSON with the following sections:
    1. sentiment: Object with keys "positive", "neutral", "negative" and integer percentage values that sum to 100
    2. themes: Array of strings with 5-10 specific common topics or themes mentioned in the comments (specific to this video content)
    3. positiveFeedback: Array of strings with 3-5 detailed points about what viewers specifically liked
    4. negativeFeedback: Object containing:
       - "summary": A paragraph summarizing all negative feedback in detail
       - "points": Array of 3-5 detailed explanations of each criticism with supporting comment evidence
       - "impact": Analysis of how these criticisms might impact viewer perception and engagement
    5. questions: Array of strings with 3-5 common questions viewers are asking
    6. suggestions: Object containing:
       - "summary": A paragraph overview of all viewer suggestions
       - "details": Array of 3-5 comprehensive explanations for each suggestion
       - "implementation": Practical advice on how to implement these suggestions
       - "priority": Suggested priority order based on comment frequency and engagement

    For each insight, include references to specific comments where possible. Be detailed and precise.
    Important: Respond with ONLY the JSON object - no markdown formatting, no code blocks, no additional text.
  `;
  
  const analysisText = await getAiResponse(prompt, MINDS_API_KEY);
  
  try {
    // First try direct JSON parsing
    try {
      return JSON.parse(analysisText);
    } catch (directParseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        const extractedJson = jsonMatch[1].trim();
        return JSON.parse(extractedJson);
      }
      
      // If that also fails, throw the original error
      throw directParseError;
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw AI response:', analysisText);
    
    // Just throw the error - no fallback response
    throw new Error('Failed to parse AI analysis response. Please try again.');
  }
};
// Modified function using a simple HTML tag removal function instead of string-strip-html
const generateCsvData = (comments) => {
  return new Promise((resolve, reject) => {
    try {
      const csvStream = csv.format({ headers: true });
      const chunks = [];
      
      csvStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      csvStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString());
      });
      
      csvStream.on('error', (error) => {
        reject(error);
      });
      
      // Function to clean HTML tags without using string-strip-html
      const removeHtmlTags = (html) => {
        return html.replace(/<[^>]*>?/gm, '');
      };
      
      // Write headers and data to the stream
      comments.forEach((comment) => {
        // Clean HTML tags from text
        const cleanText = removeHtmlTags(comment.text);
        
        csvStream.write({
          comment_id: comment.comment_id,
          author: comment.author,
          text: cleanText,
          likes: comment.likes,
          published_at: comment.published_at
        });
      });
      
      csvStream.end();
    } catch (error) {
      reject(error);
    }
  });
};

// API Routes
// API Routes
app.post('/api/analyze', async (req, res) => {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        error: 'No video URL provided'
      });
    }
    
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      return res.status(400).json({
        error: 'Could not extract a valid video ID from the URL'
      });
    }
    
    try {
      const videoDetails = await getVideoDetails(videoId);
      if (!videoDetails) {
        return res.status(404).json({
          error: 'Could not retrieve video details'
        });
      }
      
      const comments = await getComments(videoId);
      if (comments.length === 0) {
        return res.status(404).json({
          error: 'No comments found for this video'
        });
      }
      
      // Generate CSV data
      const csvContent = await generateCsvData(comments);
      
      try {
        // Get AI analysis
        const analysis = await analyzeComments(comments, videoDetails);
        
        // Convert sentiment values to array format for chart
        const sentimentData = [
          { name: 'Positive', value: analysis.sentiment.positive },
          { name: 'Neutral', value: analysis.sentiment.neutral },
          { name: 'Negative', value: analysis.sentiment.negative }
        ];
        
        return res.json({
          success: true,
          videoDetails,
          comments,
          analysis,
          sentimentData,
          csvContent
        });
      } catch (analysisError) {
        // If analysis fails, still return the video details and comments,
        // but with an error message for the analysis part
        return res.json({
          success: true,
          videoDetails,
          comments,
          error: analysisError.message,
          csvContent
        });
      }
    } catch (error) {
      console.error('Error in analyze_video:', error);
      return res.status(500).json({
        error: `An error occurred: ${error.message}`
      });
    }
  });

app.post('/api/download-csv', (req, res) => {
  const { csvContent, videoId = 'comments' } = req.body;
  
  if (!csvContent) {
    return res.status(400).json({ error: 'No CSV content provided' });
  }
  
  // Create timestamp for filename
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const filename = `youtube_comments_${videoId}_${timestamp}.csv`;
  
  // Set headers for CSV download
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Type', 'text/csv');
  
  return res.send(csvContent);
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
        <head><title>YouTube Comments Analyzer</title></head>
        <body>
            <h1>YouTube Comments Analyzer</h1>
            <p>This is an API service. Use the endpoints:</p>
            <ul>
                <li>/api/analyze (POST) - Analyze YouTube video comments</li>
                <li>/api/download-csv (POST) - Download comments as CSV</li>
            </ul>
        </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});