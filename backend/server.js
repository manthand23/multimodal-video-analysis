const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', /\.lovableproject\.com$/],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Extract YouTube video ID from URL
function extractVideoId(url) {
  // Updated regex to handle URLs with additional query parameters like timestamps
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Get YouTube transcript
app.post('/api/youtube-transcript', async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL format' });
  }

  console.log('Attempting to fetch transcript for video ID:', videoId);

  try {
    // First, try fetching existing transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (transcript && transcript.length > 0) {
      const fullTranscript = transcript.map(item => item.text).join(' ');
      console.log('Transcript fetched successfully from YouTube captions.', { length: fullTranscript.length });
      return res.json({
        transcript: fullTranscript,
        segments: transcript
      });
    }

    console.log('No YouTube captions found, attempting Whisper transcription.');

    // If no existing transcript, use Whisper fallback
    const audioFilePath = path.join(__dirname, `${videoId}_audio.mp3`);
    const audioStream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });

    // Save audio to a temporary file
    const fileStream = fs.createWriteStream(audioFilePath);
    audioStream.pipe(fileStream);

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
      audioStream.on('error', reject);
    });

    console.log('Audio downloaded, transcribing with Whisper...');

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });

    // Clean up the temporary audio file
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error('Error deleting temporary audio file:', err);
    });

    const whisperTranscript = transcription.text;
    console.log('Whisper transcription successful.', { length: whisperTranscript.length });

    res.json({
      transcript: whisperTranscript,
      segments: [] // Whisper provides a single text block, no segments like YouTube captions
    });

  } catch (error) {
    console.error('Error in transcript fetching/generation:', error.message);

    // Clean up temporary file if it exists and an error occurred after download
    const audioFilePath = path.join(__dirname, `${videoId}_audio.mp3`);
    if (fs.existsSync(audioFilePath)) {
       fs.unlink(audioFilePath, (err) => {
        if (err) console.error('Error deleting temporary audio file during error handling:', err);
      });
    }

    if (error.message.includes('Could not retrieve a transcript')) {
       return res.status(404).json({ error: 'No transcript available for this video. The video may not have captions enabled, and Whisper transcription failed.' });
    }

    res.status(500).json({ error: 'Failed to fetch or generate transcript: ' + error.message });
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
      model: videoData ? 'models/gemini-1.5-flash' : 'models/gemini-1.5-pro' 
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
    
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    
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
    
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    
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
