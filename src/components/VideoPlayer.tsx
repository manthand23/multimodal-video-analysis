
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
  sections: any[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, sections }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleSeekToTimestamp = (event: CustomEvent) => {
      if (videoRef.current) {
        videoRef.current.currentTime = event.detail;
        videoRef.current.play();
      }
    };

    window.addEventListener('seekToTimestamp', handleSeekToTimestamp as EventListener);
    
    return () => {
      window.removeEventListener('seekToTimestamp', handleSeekToTimestamp as EventListener);
    };
  }, []);

  const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  if (isYouTubeUrl) {
    // Extract YouTube video ID
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allowFullScreen
            title="YouTube Video"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden">
      <div className="aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
        />
      </div>
    </Card>
  );
};
