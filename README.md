
# VideoChat AI - Multimodal Video Analysis System

A sophisticated AI-powered video analysis platform that enables users to chat with videos, navigate through timestamped sections, and perform visual content searches.

## 🌟 Features

### 1. Chat with Video
- Upload videos or provide YouTube URLs
- Ask questions about video content
- Get AI-powered responses with timestamp references
- Natural language understanding of video context

### 2. Timestamped Navigation  
- Automatic section breakdown of videos
- Clickable timestamps for easy navigation
- Detailed descriptions for each video segment
- Timeline-based video exploration

### 3. Visual Content Search
- Search for objects, scenes, or people in videos
- Natural language queries (e.g., "red car", "person speaking")
- Get specific timestamps where content appears
- Confidence scoring for search results

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** for components
- **Lucide React** for icons
- **Sonner** for notifications
- **Tanstack Query** for state management

### Backend
- **Node.js** with Express
- **YouTube Transcript API** for transcript extraction
- **Google Gemini AI** for video analysis
- **CORS** for cross-origin requests

### AI Integration
- **Google Gemini 2.0** for multimodal video understanding
- **YouTube Transcript API** for automatic transcript generation
- **Natural language processing** for chat and search

## 📁 Project Structure

```
videochat-ai/
├── src/
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components
│   │   ├── Header.tsx          # App header
│   │   ├── VideoUpload.tsx     # Video upload interface
│   │   ├── VideoPlayer.tsx     # Video player component
│   │   ├── VideoSections.tsx   # Timestamped sections
│   │   ├── ChatInterface.tsx   # Chat with video
│   │   └── VisualSearch.tsx    # Visual content search
│   ├── services/
│   │   └── videoAnalysisService.ts  # AI analysis service
│   ├── types/
│   │   └── video.ts            # TypeScript types
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   └── pages/
│       └── Index.tsx           # Main application page
├── backend/
│   ├── server.js               # Express server
│   ├── package.json            # Backend dependencies
│   └── README.md               # Backend documentation
└── README.md                   # This file
```

## 🛠️ Setup Instructions

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:8080

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start backend server:
```bash
npm run dev
```

4. Backend runs on http://localhost:3001

## 🔧 Configuration

### API Keys
- The Google Gemini API key is included for demo purposes
- For production, use environment variables

### Supported Video Formats
- **YouTube URLs**: Direct YouTube video links
- **Uploaded Videos**: MP4, WebM, AVI, MOV formats

## 🎯 Usage

### 1. Upload or Link Video
- Paste a YouTube URL, or
- Upload a video file from your device

### 2. Automatic Analysis
- AI analyzes video content automatically
- Generates summary and section breakdown
- Extracts transcript (for YouTube videos)

### 3. Interactive Features
- **Chat**: Ask questions about the video
- **Navigate**: Click timestamps to jump to sections  
- **Search**: Find specific visual content

### 4. Example Queries

**Chat Examples:**
- "What is this video about?"
- "Who are the main speakers?"
- "What topics are covered?"

**Search Examples:**
- "red car" - finds scenes with red cars
- "person speaking" - finds speaking segments
- "outdoor scene" - finds outdoor footage

## 🌈 Design Features

- **Dark theme** with purple/blue gradients
- **Responsive design** for all screen sizes
- **Smooth animations** and hover effects
- **Modern glassmorphism** styling
- **Professional typography** and spacing

## 🔮 Future Enhancements

- Multi-language transcript support
- Advanced video filters and effects
- Batch video processing
- Real-time collaboration features
- Enhanced visual recognition capabilities

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines before submitting PRs.

---

Built with ❤️ using React, TypeScript, and Google Gemini AI
