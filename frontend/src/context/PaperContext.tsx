import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Paper, Question } from '@/types';

interface PaperState {
  currentPaper: Paper | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  isOcrDone: boolean;
  isAnswerGenerated: boolean;
  paperValidation: 'pending' | 'valid' | 'invalid';
  uploadedFile: File | null;
  previewImageUrl: string | null;
}

type PaperAction =
  | { type: 'SET_PAPER'; payload: Paper }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OCR_DONE'; payload: boolean }
  | { type: 'SET_ANSWER_GENERATED'; payload: boolean }
  | { type: 'SET_PAPER_VALIDATION'; payload: 'pending' | 'valid' | 'invalid' }
  | { type: 'SET_UPLOADED_FILE'; payload: File | null }
  | { type: 'SET_PREVIEW_IMAGE'; payload: string | null }
  | { type: 'UPDATE_QUESTION_ANSWER'; payload: { questionId: string; answer: string } }
  | { type: 'CLEAR'; payload: undefined };

const initialState: PaperState = {
  currentPaper: null,
  questions: [],
  isLoading: false,
  error: null,
  isOcrDone: false,
  isAnswerGenerated: false,
  paperValidation: 'pending',
  uploadedFile: null,
  previewImageUrl: null,
};

function paperReducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case 'SET_PAPER':
      return { ...state, currentPaper: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OCR_DONE':
      return { ...state, isOcrDone: action.payload };
    case 'SET_ANSWER_GENERATED':
      return { ...state, isAnswerGenerated: action.payload };
    case 'SET_PAPER_VALIDATION':
      return { ...state, paperValidation: action.payload };
    case 'SET_UPLOADED_FILE':
      return { ...state, uploadedFile: action.payload };
    case 'SET_PREVIEW_IMAGE':
      return { ...state, previewImageUrl: action.payload };
    case 'UPDATE_QUESTION_ANSWER':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.questionId
            ? { ...q, user_answer: action.payload.answer }
            : q
        ),
      };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface PaperContextType extends PaperState {
  dispatch: React.Dispatch<PaperAction>;
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export function PaperProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paperReducer, initialState);

  return (
    <PaperContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PaperContext.Provider>
  );
}

export function usePaper() {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error('usePaper must be used within a PaperProvider');
  }
  return context;
}
