
export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  url: string;
  thumbnail?: string;
}

export interface VideoSection {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  duration: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: string;
  createdAt: Date;
}

export interface VisualSearchResult {
  timestamp: number;
  description: string;
  confidence: number;
  thumbnailUrl?: string;
}

export interface VideoAnalysisResult {
  summary: string;
  sections: VideoSection[];
  transcript: string;
  keywords: string[];
  topics: string[];
}
