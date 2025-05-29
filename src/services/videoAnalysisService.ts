
import { toast } from 'sonner';

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
  private async callGeminiAPI(prompt: string): Promise<string> {
    const API_KEY = 'AIzaSyC0b94YHIWrqepqV2x1hAgxoeaTjTMRb2I';
    
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
      throw new Error('Failed to call Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async chatWithVideo(videoUrl: string, question: string, analysisData: VideoAnalysis): Promise<ChatResponse> {
    try {
      const prompt = `
        Based on this video context, answer the following question:
        
        Video Summary: ${analysisData.summary}
        Video Sections: ${JSON.stringify(analysisData.sections)}
        Video Transcript: ${analysisData.transcript}
        
        Question: ${question}
        
        Provide a helpful answer. If your answer references a specific part of the video, include a timestamp if available.
      `;

      const answer = await this.callGeminiAPI(prompt);
      return { answer };
    } catch (error) {
      console.error('Chat with video failed:', error);
      throw error;
    }
  }

  async visualSearch(videoUrl: string, query: string): Promise<SearchResult[]> {
    try {
      const prompt = `
        Search for "${query}" in this video context and return relevant timestamps.
        
        Video URL: ${videoUrl}
        
        Return results as JSON array with timestamp, description, and confidence score (0-1).
        Format: [{"timestamp": 123, "description": "...", "confidence": 0.8}]
        
        If no specific results found, return an empty array.
      `;

      const response = await this.callGeminiAPI(prompt);
      
      try {
        const searchResults = JSON.parse(response);
        return Array.isArray(searchResults) ? searchResults : [];
      } catch (parseError) {
        console.log('Failed to parse search results as JSON, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Visual search failed:', error);
      throw error;
    }
  }
}

export const videoAnalysisService = new VideoAnalysisService();
