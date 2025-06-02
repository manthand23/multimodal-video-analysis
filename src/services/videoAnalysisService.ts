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
  // All AI/analysis requests should go through the backend endpoints only.
  // You can implement methods here to call your backend endpoints if needed.

  async chatWithVideo(videoUrl: string, question: string, analysisData: VideoAnalysis): Promise<ChatResponse> {
    const context = {
      videoUrl: videoUrl,
      summary: analysisData.summary,
      sections: analysisData.sections,
      transcript: analysisData.transcript,
    };
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to chat with video' }));
      throw new Error(errorData.message || 'Failed to chat with video');
    }
    const data = await response.json();
    return data;
  }

  async visualSearch(videoUrl: string, query: string): Promise<SearchResult[]> {
    const response = await fetch('/api/visual-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, videoContext: { videoUrl } })
    });
    if (!response.ok) {
      throw new Error('Failed to perform visual search');
    }
    const data = await response.json();
    return data.results || [];
  }
}

export const videoAnalysisService = new VideoAnalysisService();
