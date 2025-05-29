
const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', /\.lovableproject\.com$/],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyC0b94YHIWrqepqV2x1hAgxoeaTjTMRb2I');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Get YouTube transcript
app.post('/api/youtube-transcript', async (req, res) => {
  try {
    console.log('Fetching transcript for:', req.body.videoUrl);
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }

    console.log('Extracted video ID:', videoId);
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: 'No transcript available for this video' });
    }

    const fullTranscript = transcript.map(item => item.text).join(' ');
    
    console.log('Transcript fetched successfully, length:', fullTranscript.length);
    
    res.json({ 
      transcript: fullTranscript,
      segments: transcript 
    });
  } catch (error) {
    console.error('Error fetching transcript:', error.message);
    
    if (error.message.includes('Could not retrieve a transcript')) {
      return res.status(404).json({ error: 'No transcript available for this video. The video may not have captions enabled.' });
    }
    
    res.status(500).json({ error: 'Failed to fetch transcript: ' + error.message });
  }
});

// Analyze video with Gemini
app.post('/api/analyze-video', async (req, res) => {
  try {
    console.log('Analyzing video...');
    const { transcript, prompt, videoData } = req.body;
    
    if (!transcript && !videoData) {
      return res.status(400).json({ error: 'Either transcript or video data is required' });
    }

    const model = genAI.getGenerativeModel({ 
      model: videoData ? 'gemini-1.5-flash' : 'gemini-pro' 
    });
    
    let fullPrompt;
    let content;

    if (videoData) {
      // For uploaded video files
      content = [
        { text: prompt },
        videoData
      ];
    } else {
      // For YouTube transcripts
      fullPrompt = `
        ${prompt}
        
        Video Transcript:
        ${transcript}
      `;
      content = fullPrompt;
    }
    
    const result = await model.generateContent(content);
    const response = await result.response;
    const text = response.text();
    
    console.log('Analysis completed successfully');
    
    res.json({ analysis: text });
  } catch (error) {
    console.error('Error analyzing video:', error.message);
    res.status(500).json({ error: 'Failed to analyze video: ' + error.message });
  }
});

// Chat with video
app.post('/api/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Based on this video context, answer the following question:
      
      Context: ${JSON.stringify(context)}
      
      Question: ${question}
      
      Provide a helpful answer. If your answer references a specific part of the video, include a timestamp if available.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ answer: text });
  } catch (error) {
    console.error('Error in chat:', error.message);
    res.status(500).json({ error: 'Failed to process chat message: ' + error.message });
  }
});

// Visual search in video
app.post('/api/visual-search', async (req, res) => {
  try {
    const { query, videoContext } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Search for "${query}" in this video context and return relevant timestamps.
      
      Video Context: ${JSON.stringify(videoContext)}
      
      Return results as JSON array with timestamp, description, and confidence score (0-1).
      Format: [{"timestamp": 123, "description": "...", "confidence": 0.8}]
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const searchResults = JSON.parse(text);
      res.json({ results: Array.isArray(searchResults) ? searchResults : [] });
    } catch (parseError) {
      console.log('Failed to parse search results as JSON, returning empty array');
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error in visual search:', error.message);
    res.status(500).json({ error: 'Failed to perform visual search: ' + error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 VideoChat AI Backend Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
