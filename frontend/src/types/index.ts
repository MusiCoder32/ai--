export interface Paper {
  id: string;
  user_id: string;
  original_image_url: string;
  width: number;
  height: number;
  status: 'pending' | 'ocr_done' | 'answered' | 'exported';
  created_at: string;
  updated_at: string;
  is_valid_paper?: boolean;
  paper_type?: 'exam' | 'question' | 'other';
}

export interface Question {
  id: string;
  paper_id: string;
  content: string;
  ai_answer: string;
  user_answer: string;
  x: number;
  y: number;
  width: number;
  height: number;
  answer_x: number;
  answer_y: number;
  answer_width: number;
  answer_height: number;
  font_color: string;
  font_size: number;
  order: number;
  number: number;
  detected_number: string | null;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error_code?: string;
}

export interface UploadResult {
  paper_id: string;
  image_url: string;
  width: number;
  height: number;
  is_pdf: boolean;
  page_count: number;
}

export interface OcrResult {
  paper_id: string;
  is_valid_paper: boolean;
  paper_type: 'exam' | 'question' | 'other';
  questions: Question[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  paper_id?: string;
  created_at: string;
}

export interface ChatResponse {
  message_id: string;
  content: string;
  role: 'assistant';
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  phone?: string;
  status: number;
  access_token: string;
  expired_at: string;
}

export interface HistoryItem extends Paper {
  preview_text: string;
  questions?: Question[];
}
