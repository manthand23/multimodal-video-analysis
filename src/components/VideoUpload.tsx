
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  onVideoSelected: (videoUrl: string) => void;
  onVideoAnalyzed: (data: any) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onVideoSelected, 
  onVideoAnalyzed 
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeTranscript = async (videoId: string): Promise<string> => {
    // For now, we'll simulate getting a transcript
    // In a real implementation, you'd use the YouTube Data API v3
    return `This is a simulated transcript for video ${videoId}. The video discusses various topics including technology, innovation, and future trends. It covers multiple sections with detailed explanations and examples.`;
  };

  const analyzeWithGemini = async (transcript: string, videoUrl: string) => {
    const API_KEY = 'AIzaSyC0b94YHIWrqepqV2x1hAgxoeaTjTMRb2I';
    
    const prompt = `
      Analyze this video transcript and provide a JSON response with:
      1. A comprehensive summary
      2. Key sections with estimated timestamps
      3. Main topics covered

      Format the response as JSON:
      {
        "summary": "detailed summary here",
        "sections": [
          {
            "timestamp": 0,
            "title": "Introduction",
            "description": "Brief description"
          }
        ]
      }

      Video URL: ${videoUrl}
      Transcript: ${transcript}
    `;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze video with Gemini');
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    try {
      const parsed = JSON.parse(analysisText);
      return {
        summary: parsed.summary,
        sections: parsed.sections || [],
        transcript
      };
    } catch {
      return {
        summary: analysisText || 'Video analysis completed',
        sections: [
          {
            timestamp: 0,
            title: 'Full Video',
            description: 'Complete video content'
          }
        ],
        transcript
      };
    }
  };

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      onVideoSelected(youtubeUrl);
      
      // Get transcript and analyze
      const transcript = await getYouTubeTranscript(videoId);
      const analysisData = await analyzeWithGemini(transcript, youtubeUrl);
      onVideoAnalyzed(analysisData);
      
      toast.success('Video analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          What's this video about?
        </h1>
        <p className="text-xl text-purple-300 mb-8">
          Add a YouTube video link to start analyzing
        </p>
      </div>

      {/* YouTube URL Input */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5 text-purple-400" />
            <span>YouTube Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Paste YouTube URL here..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button 
            onClick={handleYouTubeUpload}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Video...
              </>
            ) : (
              'Analyze YouTube Video'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Requirements */}
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-semibold text-blue-400 mb-6">Features</h3>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h4 className="text-white font-semibold mb-3">"Chat" with video</h4>
            <ul className="text-purple-300 space-y-2">
              <li>• What's this video about</li>
              <li>• Answer questions based on the video content</li>
            </ul>
          </div>
          <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h4 className="text-white font-semibold mb-3">Navigation & Search</h4>
            <ul className="text-purple-300 space-y-2">
              <li>• Section breakdown with hyperlinked timestamps</li>
              <li>• Natural language visual content search</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
