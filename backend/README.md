
# VideoChat AI Backend

This is the backend service for the VideoChat AI multimodal video analysis system.

## Features

- YouTube transcript extraction using youtube-transcript-api
- Video analysis with Google Gemini AI
- Chat functionality for video content
- Visual search capabilities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The server will run on http://localhost:3001

## API Endpoints

### POST /api/youtube-transcript
Extract transcript from YouTube video
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

### POST /api/analyze-video
Analyze video content with AI
```json
{
  "transcript": "video transcript text",
  "prompt": "analysis prompt"
}
```

### POST /api/chat
Chat about video content
```json
{
  "question": "user question",
  "context": "video context data"
}
```

### POST /api/visual-search
Search for visual content in video
```json
{
  "query": "search query",
  "videoContext": "video context data"
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `GEMINI_API_KEY`: Google Gemini API key (set in code for demo)

## Dependencies

- express: Web framework
- cors: Cross-origin resource sharing
- youtube-transcript: YouTube transcript extraction
- @google/generative-ai: Google Gemini AI SDK
