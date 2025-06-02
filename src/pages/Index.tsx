import React, { useState } from 'react';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ChatInterface } from '@/components/ChatInterface';
import { VideoSections } from '@/components/VideoSections';
import { VisualSearch } from '@/components/VisualSearch';
import { Header } from '@/components/Header';

const Index = () => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [videoSections, setVideoSections] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleVideoAnalyzed = (data: any) => {
    setAnalysisData(data);
    setVideoSections(data.sections || []);
  };

  const handleTimestampClick = (timestamp: number) => {
    // This will be handled by the video player
    const event = new CustomEvent('seekToTimestamp', { detail: timestamp });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {!currentVideo ? (
          <VideoUpload 
            onVideoSelected={setCurrentVideo}
            onVideoAnalyzed={handleVideoAnalyzed}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-6">
              <VideoPlayer 
                videoUrl={currentVideo}
                sections={videoSections}
              />
              
              <VideoSections 
                sections={videoSections}
                onTimestampClick={handleTimestampClick}
              />
            </div>
            
            {/* Chat and Search Section */}
            <div className="space-y-6">
              <ChatInterface 
                videoUrl={currentVideo}
                analysisData={analysisData}
              />
              
              <VisualSearch 
                videoUrl={currentVideo}
                onTimestampClick={handleTimestampClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
