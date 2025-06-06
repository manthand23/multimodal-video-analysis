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

  const getYouTubeTranscript = async (videoUrl: string): Promise<{ transcript: string; segments: any[] }> => {
    const response = await fetch('/api/youtube-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch transcript');
    }
    const data = await response.json();
    // Return both transcript text and segments
    return { transcript: data.transcript, segments: data.segments };
  };

  const analyzeWithGemini = async (transcript: string, videoUrl: string, segments: any[]) => {
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

      // Use the provided transcript segments with timestamps to help accurately estimate section timestamps.
      Transcript Segments: ${JSON.stringify(segments)}
    `;
    const response = await fetch('/api/analyze-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, prompt })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to analyze video');
    }
    const data = await response.json();
    const analysisText = data.analysis; // Get the text containing the JSON structure
    
    let parsedData: { summary: string; sections: any[]; transcript?: string };

    try {
      // Attempt to parse the JSON string. Look for a JSON object within the text.
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText.trim();
      
      parsedData = JSON.parse(jsonString);
      // Ensure sections is an array even if parsing succeeds but sections is missing/null
      parsedData.sections = parsedData.sections || [];
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
      // Fallback if JSON parsing fails: use the raw text as a summary
      parsedData = {
        summary: analysisText || 'Video analysis completed',
        sections: [], // Ensure sections is an empty array on parse failure
      };
    }
    
    // Combine parsed data with the original transcript
    return { ...parsedData, transcript };
  };

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      onVideoSelected(youtubeUrl);
      // Get transcript and segments from backend
      const { transcript, segments } = await getYouTubeTranscript(youtubeUrl);
      // Analyze transcript and segments with backend
      const analysisData = await analyzeWithGemini(transcript, youtubeUrl, segments);
      onVideoAnalyzed(analysisData);
      toast.success('Video analysis completed!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze video. Please try again.');
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
