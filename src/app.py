from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import re
from googleapiclient.discovery import build
from openai import OpenAI
import pandas as pd
from datetime import datetime
import io
import csv
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API keys from environment variables
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
MINDS_API_KEY = os.environ.get("MINDS_API_KEY")

# Initialize YouTube API client
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def extract_video_id(url):
    pattern = r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    return None

def get_comments(video_id):
    comments = []
    request = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=100  
    )
    
    while request:
        try:
            response = request.execute()
            
            for item in response['items']:
                comment_data = {
                    "comment_id": item['id'],
                    "author": item['snippet']['topLevelComment']['snippet']['authorDisplayName'],
                    "text": item['snippet']['topLevelComment']['snippet']['textDisplay'],
                    "likes": item['snippet']['topLevelComment']['snippet'].get('likeCount', 0),
                    "published_at": item['snippet']['topLevelComment']['snippet']['publishedAt']
                }
                comments.append(comment_data)
            
            if 'nextPageToken' in response:
                request = youtube.commentThreads().list(
                    part="snippet",
                    videoId=video_id,
                    maxResults=100,
                    pageToken=response['nextPageToken']
                )
            else:
                break
        except Exception as e:
            print(f"Error fetching comments: {e}")
            break
    
    return comments

def get_video_details(video_id):
    request = youtube.videos().list(
        part="snippet,statistics,contentDetails",
        id=video_id
    )
    
    try:
        response = request.execute()
        if response['items']:
            item = response['items'][0]
            
            # Get thumbnail URLs
            thumbnails = item['snippet']['thumbnails']
            thumbnail_url = thumbnails.get('maxres', thumbnails.get('high', thumbnails.get('medium', thumbnails.get('default'))))['url']
            
            return {
                "title": item['snippet']['title'],
                "channel": item['snippet']['channelTitle'],
                "published_at": item['snippet']['publishedAt'],
                "view_count": item['statistics'].get('viewCount', 0),
                "like_count": item['statistics'].get('likeCount', 0),
                "comment_count": item['statistics'].get('commentCount', 0),
                "thumbnail": thumbnail_url
            }
    except Exception as e:
        print(f"Error fetching video details: {e}")
    
    return None

def get_ai_response(prompt, minds_api_key):
    client = OpenAI(
        api_key=minds_api_key,
        base_url='https://llm.mdb.ai/'
    )
    
    try:
        completion = client.chat.completions.create(
            model='aiagent',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error getting AI response: {e}")
        return None

def analyze_comments(comments, video_details):
    # Limit to max 100 comments for analysis to avoid token limits
    comments_to_analyze = comments[:100]
    
    all_comments_text = "\n\n".join([f"Author: {c['author']}\nComment: {c['text']}\nLikes: {c['likes']}" for c in comments_to_analyze])
    
    prompt = f"""
        Analyze the following YouTube comments for the video "{video_details['title']}" by {video_details['channel']}. 

        VIDEO DETAILS:
        Title: {video_details['title']}
        Channel: {video_details['channel']}
        Views: {video_details['view_count']}
        Comments: {video_details['comment_count']}

        COMMENTS:
        {all_comments_text}

        Please provide a structured JSON with the following sections:
        1. sentiment: Object with keys "positive", "neutral", "negative" and integer percentage values that sum to 100
        2. themes: Array of strings with common topics or themes mentioned in the comments
        3. positiveFeedback: Array of strings summarizing the positive aspects mentioned
        4. negativeFeedback: Object containing:
        - "summary": A paragraph summarizing all negative feedback in detail
        - "points": Array of detailed explanations of each criticism with supporting comment evidence
        - "impact": Analysis of how these criticisms might impact viewer perception
        5. questions: Array of strings with common questions viewers are asking
        6. suggestions: Object containing:
        - "summary": A paragraph overview of all viewer suggestions
        - "details": Array of comprehensive explanations for each suggestion
        - "implementation": Practical advice on how to implement these suggestions
        - "priority": Suggested priority order based on comment frequency and engagement

        Format your response as a JSON object without markdown or any additional text.
        """
    
    analysis_text = get_ai_response(prompt, MINDS_API_KEY)
    
    try:
        # Try to parse as JSON
        import json
        analysis = json.loads(analysis_text)
        return analysis
    except:
        # If parsing fails, return a structured default with the text analysis
        return {
            "raw_analysis": analysis_text,
            "sentiment": {
                "positive": 50,
                "neutral": 30,
                "negative": 20
            },
            "themes": ["Content", "Production", "Information"],
            "positiveFeedback": ["Good content"],
            "negativeFeedback": {
                "summary": "Some criticism",
                "points": ["Detail 1"],
                "impact": "Impact analysis"
            },
            "questions": ["Questions from viewers"],
            "suggestions": {
                "summary": "Viewer suggestions",
                "details": ["Suggestion 1"],
                "implementation": "Implementation advice",
                "priority": ["Priority 1"]
            }
        }

def generate_csv_data(comments):
    # Create CSV in memory
    output = io.StringIO()
    fieldnames = ['comment_id', 'author', 'text', 'likes', 'published_at']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for comment in comments:
        # Clean HTML tags from text
        clean_text = re.sub(r'<[^>]*>', '', comment['text'])
        writer.writerow({
            'comment_id': comment['comment_id'],
            'author': comment['author'],
            'text': clean_text,
            'likes': comment['likes'],
            'published_at': comment['published_at']
        })
    
    return output.getvalue()

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    data = request.json
    video_url = data.get('videoUrl')
    
    if not video_url:
        return jsonify({
            'error': 'No video URL provided'
        }), 400
    
    video_id = extract_video_id(video_url)
    
    if not video_id:
        return jsonify({
            'error': 'Could not extract a valid video ID from the URL'
        }), 400
    
    try:
        video_details = get_video_details(video_id)
        if not video_details:
            return jsonify({
                'error': 'Could not retrieve video details'
            }), 404
        
        comments = get_comments(video_id)
        
        # Generate CSV data but don't save it
        csv_content = generate_csv_data(comments)
        
        # Get AI analysis
        analysis = analyze_comments(comments, video_details)
        
        # Convert sentiment values to array format for chart
        sentiment_data = [
            {"name": "Positive", "value": analysis["sentiment"]["positive"]},
            {"name": "Neutral", "value": analysis["sentiment"]["neutral"]},
            {"name": "Negative", "value": analysis["sentiment"]["negative"]}
        ]
        
        return jsonify({
            'success': True,
            'videoDetails': video_details,
            'comments': comments,
            'analysis': analysis,
            'sentimentData': sentiment_data,
            'csvContent': csv_content
        })
    
    except Exception as e:
        print(f"Error in analyze_video: {e}")
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/download-csv', methods=['POST'])
def download_csv():
    data = request.json
    csv_content = data.get('csvContent')
    
    if not csv_content:
        return jsonify({'error': 'No CSV content provided'}), 400
    
    # Create response with CSV data
    video_id = data.get('videoId', 'comments')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"youtube_comments_{video_id}_{timestamp}.csv"
    
    response = make_response(csv_content)
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    response.headers["Content-Type"] = "text/csv"
    
    return response
    
@app.route('/')
def index():
    return '''
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
    '''
# Update port configuration for Railway
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)