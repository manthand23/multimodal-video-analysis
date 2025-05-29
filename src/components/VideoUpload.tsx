
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { videoAnalysisService } from '@/services/videoAnalysisService';

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

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      onVideoSelected(youtubeUrl);
      
      // Analyze the video
      const analysisData = await videoAnalysisService.analyzeYouTubeVideo(youtubeUrl);
      onVideoAnalyzed(analysisData);
      
      toast.success('Video analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setIsAnalyzing(true);
    try {
      const videoUrl = URL.createObjectURL(file);
      onVideoSelected(videoUrl);
      
      // Analyze the uploaded video
      const analysisData = await videoAnalysisService.analyzeUploadedVideo(file);
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          What's this video about?
        </h1>
        <p className="text-xl text-purple-300 mb-8">
          Upload or add a YouTube video link to start analyzing
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
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

        {/* File Upload */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-purple-400" />
              <span>Upload Video File</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <p className="text-white/70 mb-4">
                Drag and drop a video file or click to browse
              </p>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="video-upload"
                disabled={isAnalyzing}
              />
              <Button 
                asChild
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                disabled={isAnalyzing}
              >
                <label htmlFor="video-upload" className="cursor-pointer">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Choose File'
                  )}
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-semibold text-blue-400 mb-6">Requirements</h3>
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
