
import { toast } from 'sonner';

const GEMINI_API_KEY = 'AIzaSyC0b94YHIWrqepqV2x1hAgxoeaTjTMRb2I';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
  private async makeGeminiRequest(prompt: string, videoContent?: any) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              ...(videoContent ? [videoContent] : [])
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  private async getYouTubeTranscript(videoUrl: string): Promise<string> {
    try {
      // Extract video ID from YouTube URL
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (!videoId) throw new Error('Invalid YouTube URL');

      // Note: In a real implementation, you would call your backend API
      // For now, we'll return a placeholder
      return "This is a placeholder transcript. In the actual implementation, you would call the YouTube Transcript API from your backend.";
    } catch (error) {
      console.error('Failed to get YouTube transcript:', error);
      throw error;
    }
  }

  async analyzeYouTubeVideo(videoUrl: string): Promise<VideoAnalysis> {
    try {
      console.log('Analyzing YouTube video:', videoUrl);
      
      // Get transcript
      const transcript = await this.getYouTubeTranscript(videoUrl);
      
      // Analyze with Gemini
      const analysisPrompt = `
        Analyze this video transcript and provide:
        1. A comprehensive summary
        2. Key sections with timestamps (estimate based on content flow)
        3. Main topics covered

        Transcript: ${transcript}

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
      `;

      const analysisResult = await this.makeGeminiRequest(analysisPrompt);
      
      try {
        const parsed = JSON.parse(analysisResult);
        return {
          summary: parsed.summary,
          sections: parsed.sections || [],
          transcript
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          summary: analysisResult || 'Video analysis completed',
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

      const analysisResult = await this.makeGeminiRequest(analysisPrompt, videoContent);
      
      try {
        const parsed = JSON.parse(analysisResult);
        return {
          summary: parsed.summary,
          sections: parsed.sections || [],
          transcript: 'Video transcript not available for uploaded files'
        };
      } catch {
        return {
          summary: analysisResult || 'Video analysis completed',
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
      const chatPrompt = `
        Based on this video analysis, answer the following question:
        
        Video Summary: ${analysisData.summary}
        Video Sections: ${JSON.stringify(analysisData.sections)}
        Video Transcript: ${analysisData.transcript}
        
        Question: ${question}
        
        Please provide a helpful answer. If your answer references a specific part of the video, include the timestamp in seconds.
        
        Format your response as JSON:
        {
          "answer": "your answer here",
          "timestamp": "timestamp in seconds if applicable"
        }
      `;

      const response = await this.makeGeminiRequest(chatPrompt);
      
      try {
        const parsed = JSON.parse(response);
        return {
          answer: parsed.answer,
          timestamp: parsed.timestamp
        };
      } catch {
        return {
          answer: response || 'I could not process your question about the video.',
        };
      }
    } catch (error) {
      console.error('Chat with video failed:', error);
      throw error;
    }
  }

  async visualSearch(videoUrl: string, query: string): Promise<SearchResult[]> {
    try {
      // This is a simplified implementation
      // In a real application, you would process video frames and use computer vision
      const searchPrompt = `
        Based on the query "${query}", identify potential matches in this video.
        Return timestamps where this content might appear.
        
        Please format as JSON array:
        [
          {
            "timestamp": 30,
            "description": "Description of what matches the query",
            "confidence": 0.85
          }
        ]
      `;

      const response = await this.makeGeminiRequest(searchPrompt);
      
      try {
        const results = JSON.parse(response);
        return Array.isArray(results) ? results : [];
      } catch {
        // Return mock results for demonstration
        return [
          {
            timestamp: 30,
            description: `Content matching "${query}" found`,
            confidence: 0.75
          }
        ];
      }
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
