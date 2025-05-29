
import React from 'react';
import { Video, MessageSquare, Search } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">VideoChat AI</h1>
              <p className="text-purple-300 text-sm">Multimodal Video Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-white/70">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Chat</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span className="text-sm">Search</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
