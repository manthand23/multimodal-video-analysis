
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';

interface VideoSectionsProps {
  sections: any[];
  onTimestampClick: (timestamp: number) => void;
}

export const VideoSections: React.FC<VideoSectionsProps> = ({ 
  sections, 
  onTimestampClick 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sections.length) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/70">Video sections will appear here after analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Clock className="w-5 h-5 text-purple-400" />
          <span>Video Sections</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-blue-400 font-mono text-sm">
                    {formatTime(section.timestamp)}
                  </span>
                  <h4 className="text-white font-medium">{section.title}</h4>
                </div>
                <p className="text-white/70 text-sm">{section.description}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTimestampClick(section.timestamp)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
