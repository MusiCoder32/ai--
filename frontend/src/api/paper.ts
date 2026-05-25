import axios from 'axios';
import type { Paper, Question, UploadResult, OcrResult, ApiResponse } from '@/types';

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

export const uploadPaper = async (file: File): Promise<ApiResponse<UploadResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/papers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const listPapers = async (): Promise<ApiResponse<Paper[]>> => {
  const response = await api.get('/papers');
  return response.data;
};

export const getPaper = async (paperId: string): Promise<ApiResponse<{ paper: Paper; questions: Question[] }>> => {
  const response = await api.get(`/papers/${paperId}`);
  return response.data;
};

export const deletePaper = async (paperId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/papers/${paperId}`);
  return response.data;
};

export const runOCR = async (paperId: string): Promise<ApiResponse<OcrResult>> => {
  const response = await api.post(`/papers/${paperId}/ocr`);
  return response.data;
};

export const generateAnswers = async (paperId: string): Promise<ApiResponse<{ paper_id: string; questions: Question[] }>> => {
  const response = await api.post(`/papers/${paperId}/answer`);
  return response.data;
};

export const generateSingleAnswer = async (questionId: string): Promise<ApiResponse<{ question_id: string; ai_answer: string }>> => {
  const response = await api.post(`/questions/${questionId}/answer`);
  return response.data;
};

export const renderPaper = async (paperId: string): Promise<ApiResponse<{ image_url: string }>> => {
  const response = await api.post(`/papers/${paperId}/render`);
  return response.data;
};

export const updateQuestion = async (questionId: string, data: Partial<Question>): Promise<ApiResponse<Question>> => {
  const response = await api.put(`/questions/${questionId}`, data);
  return response.data;
};

export const deleteQuestion = async (questionId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};
