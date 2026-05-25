import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { usePaper } from '@/context/PaperContext';
import { useAuth } from '@/context/AuthContext';
import { uploadPaper, runOCR, generateAnswers, listPapers, getPaper, deletePaper } from '@/api/paper';
import type { Paper, Question, OcrResult as OcrResultType, HistoryItem } from '@/types';

export default function Home() {
  const { currentPaper, questions, dispatch, previewImageUrl, isOcrDone, isAnswerGenerated, paperValidation } = usePaper();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [_ocrResult, setOcrResult] = useSt[ocrLoading, setOcrLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const result = await listPapers();
      if (result.success && result.data) {
        const historyItems: HistoryItem[] = await Promise.all(
          result.data.map(async (paper) => {
            let previewText = '';
            let questionsData: Question[] = [];
            
            if (paper.status !== 'pending') {
              try {
                const paperResult = await getPaper(paper.id);
                if (paperResult.success && paperResult.data.questions) {
                  questionsData = paperResult.data.questions;
                  previewText = truncateText(
                    questionsData.map((q) => q.content).join(' '),
                    80
                  );
                }
              } catch {
                previewText = '';
              }
            }
            
            return {
              ...paper,
              preview_text: previewText,
              questions: questionsData,
            } as HistoryItem;
          })
        );
        setHistory(historyItems);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    const trimmed = text.replace(/\s+/g, ' ').trim();
    return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_PAPER_VALIDATION', payload: 'pending' });

    try {
      const result = await uploadPaper(file);
      if (result.success && result.data) {
        const newPaper: Paper = {
          id: result.data.paper_id,
          user_id: user?.user_id || 'test-user',
          original_image_url: result.data.image_url,
          width: result.data.width,
          height: result.data.height,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dispatch({ type: 'SET_PAPER', payload:  'SET_QUESTIONS', payload: [] });
        dispatch({ type: 'SET_OCR_DONE', payload: false });
        setSelectedHistoryId(result.data.paper_id);
        setOcrResult(null);
        
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            dispatch({ type: 'SET_PREVIEW_IMAGE', payload: e.target?.result as string });
          };
          reader.readAsDataURL(file);
        }
        
        message.success(result.data.is_pdf 
          ? `PDF上传成功，共${result.data.page_count}页` 
          : '图片上传成功');
        loadHistory();
      } else {
        message.error(result.message || '上传失败');
      }
    } catch {
      message.error('上传失败，请检查网络连接');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.user_id, dispatch, loadHistory]);

  const handleOCR = useCallback(async () => {
    if (!currentPaper) return;

    setOcrLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_OCR_DONE', payload: false });

    try {
      const result = await runOCR(currentPaper.id);
      if (result.success && result.data) {
        setOcrResult(result.data);
        dispatch({ type: 'SET_QUESTIONS', payload: result.data.questions });
        dispatch({
          type: 'SET_PAPER',
          payload: {
            ...currentPaper,
            status: 'ocr_done',
            is_valid_paper: result.data.is_valid_paper,
            paper_type: result.data.paper_type,
          },
        });
        dispatch({ type: 'SET_OCR_DONE', payload: true });
        dispatch({ 
          type: 'SET_PAPER_VALIDATION', 
          payload: result.data.is_valid_paper ? 'valid' : 'invalid' 
        });
        message.success('OCR识别完成');
        loadHistory();
      } else {
        message.error(result.message || '识别失败');
      }
    } catch {
      message.error('识别失败，请重试');
    } finally {
      setOcrLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentPaper, dispatch, loadHistory]);

  const handleGenerateAnswers = useCallback(async () => {
    if (!currentPaper || paperValidation === 'invalid') return;

    setAnswerLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await generateAnswers(currentPaper.id);
      if (result.success && result.data) {
        dispatch({ type: 'SET_QUESTIONS', payload: result.data.questions });
        dispatch({
          type: 'SET_PAPER',
          payload: { ...currentPaper, status: 'answered' },
        });
        dispatch({ type: 'SET_ANSWER_GENERATED', payload: true });
        message.success('答案生成完成');
        loadHistory();
      } else {
        message.error(result.message || '生成失败');
      }
    } catch {
      message.error('生成失败，请重试');
    } finally {
      setAnswerLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentPaper, paperValidation, dispatch, loadHistory]);

  const handlePreview = useCallback(() => {
    message.info('预览功能开发中...');
  }, []);

  const handleExport = useCallback(() => {
    message.info('导出功能开发中...');
  }, []);

  const handleAnswerGenerated = useCallback((questionId: string, answer: string) => {
    dispatch({ type: 'UPDATE_QUESTION_ANSWER', payload: { questionId, answer } });
  }, [dispatch]);

  const handleQuestionUpdated = useCallback((question: Question) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: question });
  }, [dispatch]);

  const handleHistorySelect = useCallback(async (item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    dispatch({ type: 'SET_PAPER', payload: item });
    dispatch({ type: 'SET_QUESTIONS', payload: item.questions || [] });
    dispatch({ type: 'SET_OCR_DONE', payload: item.status !== 'pending' });
    dispatch({ type: 'SET_PAPER_VALIDATION', payload: item.is_valid_paper ? 'valid' : 'invalid' });
    
    if (item.original_image_url) {
      dispatch({ type: 'SET_PREVIEW_IMAGE', payload: item.original_image_url });
    }
    
    if (item.questions && item.questions.length > 0) {
      setOcrResult({
        paper_id: item.id,
        is_valid_paper: true,
        paper_type: 'exam',
        questions: item.questions,
      });
    }
  }, [dispatch]);

  const handleHistoryDelete = useCallback(async (paperId: string) => {
    try {
      const result = await deletePaper(paperId);
      if (result.success) {
        setHistory((prev) => prev.filter((item) => item.id !== paperId));
        if (selectedHistoryId === paperId) {
          setSelectedHistoryId(null);
          dispatch({ type: 'CLEAR', payload: undefined });
          setOcrResult(null);
        }
        message.success('删除成功');
      } else {
        message.error(result.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  }, [selectedHistoryId, dispatch]);

  return (
    <div className="h-between-center gap-8px flex-1 w-full  h-0">
      <LeftPanel
        history={history}
        selectedHistoryId={selectedHistoryId}
        onHistorySelect={handleHistorySelect}
        onHistoryDelete={handleHistoryDelete}
      />
      
      <CenterPanel
        currentPaperId={currentPaper?.id || null}
        questions={questions}
        isOcrDone={isOcrDone}
        isAnswerGenerated={isAnswerGenerated}
        paperValidation={paperValidation}
        paperType={currentPaper?.paper_type}
        isOcrLoading={ocrLoading}
        isAnswerLoading={answerLoading}
        onOcr={handleOCR}
        onGenerateAnswers={handleGenerateAnswers}
        onPreview={handlePreview}
        onExport={handleExport}
        onAnswerGenerated={handleAnswerGenerated}
        onQuestionUpdated={handleQuestionUpdated}
      />

      
      <RightPanel
        previewImageUrl={previewImageUrl}
        currentPaperId={currentPaper?.id || null}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}
