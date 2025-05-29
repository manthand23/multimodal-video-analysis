
const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyC0b94YHIWrqepqV2x1hAgxoeaTjTMRb2I');

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Get YouTube transcript
app.post('/api/youtube-transcript', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullTranscript = transcript.map(item => item.text).join(' ');
    
    res.json({ 
      transcript: fullTranscript,
      segments: transcript 
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// Analyze video with Gemini
app.post('/api/analyze-video', async (req, res) => {
  try {
    const { transcript, prompt } = req.body;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const fullPrompt = `
      ${prompt}
      
      Video Transcript:
      ${transcript}
    `;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ analysis: text });
  } catch (error) {
    console.error('Error analyzing video:', error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// Chat with video
app.post('/api/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Based on this video context, answer the following question:
      
      Context: ${JSON.stringify(context)}
      
      Question: ${question}
      
      Provide a helpful answer. If your answer references a specific part of the video, include a timestamp.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ answer: text });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Visual search in video
app.post('/api/visual-search', async (req, res) => {
  try {
    const { query, videoContext } = req.body;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Search for "${query}" in this video context and return relevant timestamps.
      
      Video Context: ${JSON.stringify(videoContext)}
      
      Return results as JSON array with timestamp, description, and confidence score.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const searchResults = JSON.parse(text);
      res.json({ results: searchResults });
    } catch {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error in visual search:', error);
    res.status(500).json({ error: 'Failed to perform visual search' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
