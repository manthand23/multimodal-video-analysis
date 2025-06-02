import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Image, Play } from 'lucide-react';
import { videoAnalysisService } from '@/services/videoAnalysisService';
import { toast } from 'sonner';

interface SearchResult {
  timestamp: number;
  description: string;
  confidence: number;
}

interface VisualSearchProps {
  videoUrl: string;
  onTimestampClick: (timestamp: number) => void;
}

export const VisualSearch: React.FC<VisualSearchProps> = ({ 
  videoUrl, 
  onTimestampClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const results = await videoAnalysisService.visualSearch(videoUrl, searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No matching content found in the video');
      } else {
        toast.success(`Found ${results.length} matching segment(s)`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Search className="w-5 h-5 text-purple-400" />
          <span>Visual Content Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for objects, scenes, people..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            disabled={isSearching}
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="icon"
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Example Query */}
        <div className="text-center">
          <p className="text-white/70 text-sm mb-2">Example:</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('red car')}
            className="text-purple-300 hover:text-purple-200 hover:bg-purple-400/10"
          >
            "red car" pulls up clips where a red car is in the frame
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            <h4 className="text-white font-medium">Search Results:</h4>
            {searchResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Image className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 font-mono text-sm">
                        {formatTime(result.timestamp)}
                      </span>
                      <span className="text-white/50 text-xs">
                        {Math.round(result.confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">{result.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTimestampClick(result.timestamp)}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-white/70">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching video content...</span>
            </div>
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !isSearching && (
          <div className="text-center py-8 text-white/50">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No results found for "{searchQuery}"</p>
            <p className="text-sm mt-2">Try different keywords or phrases</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
