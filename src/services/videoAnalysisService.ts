
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3001/api';

export interface VideoAnalysis {
  summary: string;
  sections: Array<{
    timestamp: number;
    title: string;
    description: string;
  }>;
  transcript: string;
}

export interface ChatResponse {
  answer: string;
  timestamp?: string;
}

export interface SearchResult {
  timestamp: number;
  description: string;
  confidence: number;
}

class VideoAnalysisService {
  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }

  private async getYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
      console.log('Checking server connection...');
      const isServerHealthy = await this.checkServerHealth();
      
      if (!isServerHealthy) {
        throw new Error('Backend server is not running. Please start the backend server on port 3001.');
      }

      console.log('Fetching transcript for:', videoUrl);
      
      const response = await fetch(`${API_BASE_URL}/youtube-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.transcript;
    } catch (error) {
      console.error('Failed to get YouTube transcript:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on localhost:3001');
      }
      
      throw error;
    }
  }

  async analyzeYouTubeVideo(videoUrl: string): Promise<VideoAnalysis> {
    try {
      console.log('Analyzing YouTube video:', videoUrl);
      
      // Get transcript from backend
      const transcript = await this.getYouTubeTranscript(videoUrl);
      
      // Analyze with backend AI service
      const analysisResponse = await fetch(`${API_BASE_URL}/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          prompt: `
            Analyze this video transcript and provide:
            1. A comprehensive summary
            2. Key sections with timestamps (estimate based on content flow)
            3. Main topics covered

            Please format the response as JSON with this structure:
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
          `
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errorData.error || `Analysis failed with status ${analysisResponse.status}`);
      }

      const analysisData = await analysisResponse.json();
      
      try {
        const parsed = JSON.parse(analysisData.analysis);
        return {
          summary: parsed.summary,
          sections: parsed.sections || [],
          transcript
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          summary: analysisData.analysis || 'Video analysis completed',
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
    } catch (error) {
      console.error('YouTube video analysis failed:', error);
      throw error;
    }
  }

  async analyzeUploadedVideo(file: File): Promise<VideoAnalysis> {
    try {
      console.log('Analyzing uploaded video:', file.name);
      
      // Convert video file to base64 for Gemini
      const base64Video = await this.fileToBase64(file);
      
      const analysisPrompt = `
        Analyze this video and provide:
        1. A comprehensive summary of the content
        2. Key sections/scenes with estimated timestamps
        3. Main topics or events shown

        Please format the response as JSON with this structure:
        {
          "summary": "detailed summary here",
          "sections": [
            {
              "timestamp": 0,
              "title": "Scene name",
              "description": "Brief description"
            }
          ]
        }
      `;

      const videoContent = {
        inlineData: {
          mimeType: file.type,
          data: base64Video
        }
      };

      const response = await fetch(`${API_BASE_URL}/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: '',
          prompt: analysisPrompt,
          videoData: videoContent
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const analysisData = await response.json();
      
      try {
        const parsed = JSON.parse(analysisData.analysis);
        return {
          summary: parsed.summary,
          sections: parsed.sections || [],
          transcript: 'Video transcript not available for uploaded files'
        };
      } catch {
        return {
          summary: analysisData.analysis || 'Video analysis completed',
          sections: [
            {
              timestamp: 0,
              title: 'Full Video',
              description: 'Complete video content'
            }
          ],
          transcript: 'Video transcript not available for uploaded files'
        };
      }
    } catch (error) {
      console.error('Uploaded video analysis failed:', error);
      throw error;
    }
  }

  async chatWithVideo(videoUrl: string, question: string, analysisData: VideoAnalysis): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context: {
            summary: analysisData.summary,
            sections: analysisData.sections,
            transcript: analysisData.transcript
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        answer: data.answer,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Chat with video failed:', error);
      throw error;
    }
  }

  async visualSearch(videoUrl: string, query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/visual-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          videoContext: { videoUrl }
        }),
      });

      if (!response.ok) {
        throw new Error(`Visual search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Visual search failed:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }
}

export const videoAnalysisService = new VideoAnalysisService();
