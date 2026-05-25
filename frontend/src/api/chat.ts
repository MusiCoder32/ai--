import axios from 'axios';
import type { ChatMessage, ChatResponse, ApiResponse } from '@/types';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendChatMessage = async (content: string, paperId?: string): Promise<ApiResponse<ChatResponse>> => {
  const response = await api.post('/chat/message', {
    content,
    paper_id: paperId || null,
  });
  return response.data;
};

export const sendStreamChatMessage = async (
  content: string, 
  paperId?: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content,
      paper_id: paperId || null,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  if (!response.body) {
    throw new Error('Response body is null');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n\n');
      const incomplete = lines.pop() || '';
      buffer = incomplete;
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        if (line.startsWith('data:')) {
          const chunk = line.slice(5).trimStart();
          fullContent += chunk;
          onChunk(chunk);
        }
      }
    }
    
    if (done) {
      if (buffer.trim()) {
        if (buffer.startsWith('data:')) {
          const chunk = buffer.slice(5);
          fullContent += chunk;
          onChunk(chunk);
        }
      }
      break;
    }
  }
  
  return fullContent;
};

export const getChatHistory = async (paperId?: string, limit: number = 20, offset: number = 0): Promise<ApiResponse<ChatMessage[]>> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (paperId) {
    params.set('paper_id', paperId);
  }
  
  const response = await api.get(`/chat/history?${params.toString()}`);
  return response.data;
};

export const clearChatHistory = async (): Promise<ApiResponse<void>> => {
  const response = await api.delete('/chat/history');
  return response.data;
};
