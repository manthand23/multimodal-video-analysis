import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
  sections: any[];
}

// Declare YT as a global variable from the YouTube IFrame Player API
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, sections }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null); // Ref for YouTube player instance

  useEffect(() => {
    let player: any = null;
    let checkIframeReady: any = null; // Declare checkIframeReady here

    const onPlayerReady = (event: any) => {
      console.log('YouTube Player ready!', event.target);
      // You can add event listeners here if needed, e.g., onStateChange
    };

    const loadYouTubeAPI = () => {
      console.log('Attempting to load YouTube IFrame API...');
      if (!window.YT || !window.YT.Player) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube IFrame API is ready (onYouTubeIframeAPIReady).');
          // API is ready, but player needs to be created when iframe is rendered
           if (isYouTubeUrl && document.getElementById('youtube-iframe')) {
             createYouTubePlayer();
           }
        };
      } else {
         console.log('YouTube IFrame API already loaded.');
         // API is already loaded, create player if iframe exists
         if (isYouTubeUrl && document.getElementById('youtube-iframe')) {
            createYouTubePlayer();
         }
      }
    };

    const createYouTubePlayer = () => {
       console.log('Attempting to create YouTube player instance...');
       if (youtubePlayerRef.current) {
         console.log('YouTube player instance already exists.');
         return; // Prevent creating multiple players
       }
       const iframeElement = document.getElementById('youtube-iframe');
       if (!iframeElement) {
          console.error('YouTube iframe element not found!');
          return;
       }

       player = new window.YT.Player('youtube-iframe', {
          events: {
             'onReady': onPlayerReady,
          },
       });
       youtubePlayerRef.current = player;
       console.log('YouTube Player instance created.', player);
    };

    // --- Custom Event Listener for seeking ---
    const handleSeekToTimestamp = (event: CustomEvent) => {
      const timestamp = event.detail;
      console.log(`Received seekToTimestamp event with timestamp: ${timestamp}`);
      // Ensure player exists and is ready before seeking
      if (isYouTubeUrl && youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
        console.log(`YouTube video is active and player instance is ready. Attempting to seek to ${timestamp}s.`);
        youtubePlayerRef.current.seekTo(timestamp, true);
      } else if (!isYouTubeUrl && videoRef.current) {
        console.log(`Seeking native video to ${timestamp}s.`);
        videoRef.current.currentTime = timestamp;
        videoRef.current.play(); // Auto-play after seeking native video
      } else {
          console.log('Seek attempt failed: Player not ready or not a video element.', { isYouTubeUrl, youtubePlayerRef: youtubePlayerRef.current, videoRef: videoRef.current });
      }
    };

    window.addEventListener('seekToTimestamp', handleSeekToTimestamp as EventListener);

    const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

    if (isYouTubeUrl) {
      console.log('Video is a YouTube URL, loading API and creating player.');
      loadYouTubeAPI();

      // This interval is a fallback to ensure the player is created if the iframe exists after the API loads.
      // The onYouTubeIframeAPIReady handler should ideally create the player.
      checkIframeReady = setInterval(() => {
          if (document.getElementById('youtube-iframe')) {
              clearInterval(checkIframeReady);
              console.log('YouTube iframe element found via interval, attempting to create player.');
              createYouTubePlayer();
          }
      }, 100);

    } else {
        console.log('Video is not a YouTube URL, skipping YouTube API.');
    }

    // --- Cleanup function ---
    return () => {
      console.log('Running cleanup for VideoPlayer effect.');
      window.removeEventListener('seekToTimestamp', handleSeekToTimestamp as EventListener);

      if (checkIframeReady) { // Clear interval if it was set
          clearInterval(checkIframeReady);
      }

      // Destroy YouTube player instance on cleanup if it exists
       if (youtubePlayerRef.current && typeof youtubePlayerRef.current.destroy === 'function') {
           console.log('Destroying YouTube player instance.');
           youtubePlayerRef.current.destroy();
           youtubePlayerRef.current = null;
       }
       console.log('VideoPlayer effect cleanup complete.');
    };

  }, [videoUrl]); // Re-run effect if videoUrl changes

  const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  if (isYouTubeUrl) {
    // Corrected regex to handle various YouTube URL formats and extract video ID
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      console.error('Could not extract YouTube video ID from URL:', videoUrl);
      return <p>Error: Could not load YouTube video.</p>; // Handle invalid URL visually
    }
    
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden">
        <div className="aspect-video">
          <iframe
            id="youtube-iframe"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
            className="w-full h-full"
            allowFullScreen
            title="YouTube Video"
            frameBorder="0"
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
