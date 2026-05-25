import { useEffect, useRef, useCallback } from 'react';
import { Spin } from 'antd';
import type { Question } from '@/types';
import { drawHandwriting } from '@/utils/handwriting';

interface AnswerPreviewProps {
  imageUrl: string;
  questions: Question[];
  isLoading?: boolean;
}

export default function AnswerPreview({ imageUrl, questions, isLoading }: AnswerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);

      questions.forEach((question) => {
        const answer = question.user_answer || question.ai_answer || '';
        if (!answer) return;

        const x = question.answer_x || question.x;
        const y = question.answer_y || (question.y + question.height + 10);
        const width = question.answer_width || question.width;
        const height = question.answer_height || 100;

        drawHandwriting(ctx, answer, x, y, width, height, {
          fontSize: question.font_size,
          color: question.font_color,
        });
      });
    };

    img.src = imageUrl;
  }, [imageUrl, questions]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Spin spinning={isLoading}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #e8e8e8',
            borderRadius: 4,
          }}
        />
        {!imageUrl && (
          <div style={{
            padding: 60,
            textAlign: 'center',
            color: '#999',
            border: '1px dashed #e8e8e8',
            borderRadius: 4,
          }}>
            请先上传试卷图片
          </div>
        )}
      </Spin>
    </div>
  );
}