import axios from 'axios';
import type { Question, ApiResponse } from '@/types';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const updateQuestion = async (
  questionId: string,
  data: Partial<Question>
): Promise<ApiResponse<Question>> => {
  const response = await api.put(`/questions/${questionId}`, data);
  return response.data;
};

export const deleteQuestion = async (questionId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};