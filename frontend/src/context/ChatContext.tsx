import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  streamingMessage: ChatMessage | null;
}

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_LAST_ASSISTANT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_STREAMING'; payload: undefined }
  | { type: 'CLEAR'; payload: undefined };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  isTyping: false,
  streamingMessage: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_LAST_ASSISTANT_MESSAGE':
      return { ...state, streamingMessage: action.payload };
    case 'CLEAR_STREAMING':
      return { ...state, streamingMessage: null };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface ChatContextType extends ChatState {
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
