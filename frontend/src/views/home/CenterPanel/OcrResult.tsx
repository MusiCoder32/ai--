import { usePaper } from '@/context/PaperContext';
import type { Question } from '@/types';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface OcrResultProps {
  questions: Question[];
  paperType: 'exam' | 'question' | 'other';
}

export default function OcrResult({ questions, paperType }: OcrResultProps) {
  const { getValidationIcon = () => {
    switch (paperValidation) {
      case 'valid':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'invalid':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <HelpCircle size={16} className="text-blue-300" />;
    }
  };

  const getValidationText = () => {
    switch (paperType) {
      case 'exam':
        return `已检测到有效试卷，共 ${questions.length} 道题目`;
      case 'question':
        return `已检测到 ${questions.length} 道题目`;
      default:
        return '未检测到有效题目，请上传试卷图片';
    }
  };

  const isWarning = paperType === 'other';

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-md mb-4 ${isWarning ? 'bg-orange-50 text-orange-600' : 'bg-cyan-50 text-cyan-700'}`}>
      <span className="flex-shrink-0">{getValidationIcon()}</span>
      <span className="text-xs">{getValidationText()}</span>
    </div>
  );
}
