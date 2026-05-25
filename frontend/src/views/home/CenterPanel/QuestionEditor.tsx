import { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Button, message, Tooltip } from 'antd';
import type { Question } from '@/types';
import { generateSingleAnswer, updateQuestion } from '@/api/paper';
import { Plus, RefreshCw, Save, Calculator } from 'lucide-react';
import 'mathlive';
import 'mathlive/fonts.css';
import 'mathlive/static.css';

// 配置 MathLive
// fontsDirectory 设置为空字符串使用 jsDelivr CDN，避免 Vite 开发环境下字体加载失败
if (typeof window !== 'undefined' && (window as any).MathfieldElement) {
  (window as any).MathfieldElement.fontsDirectory = '';
  // 配置默认选项：启用软换行、启用文本选择效果
  (window as any).MathfieldElement.defaults = {
    smartMode: true,
    virtualKeyboardMode: 'manual',
    onTab: 'indent',
  };
}

const { TextArea } = Input;

interface QuestionEditorProps {
  question: Question;
  onAnswerGenerated: (questionId: string, answer: string) => void;
  onQuestionUpdated: (question: Question) => void;
}

export default function QuestionEditor({ question, onAnswerGenerated, onQuestionUpdated }: QuestionEditorProps) {
  const [content, setContent] = useState(question.content);
  const [answer, setAnswer] = useState(question.user_answer || question.ai_answer || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMathToolbar, setShowMathToolbar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mathfieldElement = useRef<HTMLElement | null>(null);

  const handleGenerateAnswer = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await generateSingleAnswer(question.id);
      if (response.success && response.data) {
        setAnswer(response.data.ai_answer);
        onAnswerGenerated(question.id, response.data.ai_answer);
        message.success('答案已生成');
      } else {
        message.error(response.message || '生成答案失败');
      }
    } catch (error) {
      message.error('生成答案时发生错误');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, question.id, onAnswerGenerated]);

  const handleSaveAnswer = useCallback(async () => {
    try {
      const response = await updateQuestion(question.id, {
        content,
        user_answer: answer,
      });
      if (response.success && response.data) {
        onQuestionUpdated(response.data);
        message.success('答案已保存');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      message.error('保存时发生错误');
    }
  }, [question.id, content, answer, onQuestionUpdated]);

  const mathSymbols = [
    { label: '∑', symbol: '\\sum ' },
    { label: '∫', symbol: '\\int ' },
    { label: '√', symbol: '\\sqrt{}' },
    { label: 'π', symbol: '\\pi' },
    { label: '∞', symbol: '\\infty' },
    { label: '∂', symbol: '\\partial' },
    { label: '∈', symbol: '\\in' },
    { label: '≤', symbol: '\\leq' },
    { label: '≥', symbol: '\\geq' },
    { label: '≠', symbol: '\\neq' },
  ];

  const hasAiAnswer = !!question.ai_answer && !question.user_answer;

  const WRAPPER_START = '\\begin{align*}\n';
  const WRAPPER_END = '\n\\end{align*}';

  const isWrapped = (value: string): boolean => {
    return value.startsWith(WRAPPER_START) && value.endsWith(WRAPPER_END);
  };

  const wrapContent = (value: string): string => {
    if (isWrapped(value)) return value;
    if (!value.trim()) return '';
    return  WRAPPER_START + value + WRAPPER_END;
  };

  const unwrapContent = (value: string): string => {
    if (!isWrapped(value)) return value;
    return value.slice(WRAPPER_START.length, -WRAPPER_END.length).trim();
  };

  const handleMathInsert = useCallback((symbol: string) => {
    if (mathfieldElement.current) {
      (mathfieldElement.current as any).insert(symbol);
    }
  }, []);

  const handleMathInput = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value || '';
    setAnswer(unwrapContent(rawValue));
  }, []);

  useEffect(() => {
    if (containerRef.current && !mathfieldElement.current) {
      const mathField = document.createElement('math-field');
      mathField.style.fontSize = '16px';
      mathField.style.width = '100%';
      mathField.style.minHeight = '60px';
      mathField.style.resize = 'none';
      mathField.setAttribute('smart-mode', 'true');
      mathField.setAttribute('tab-navigation', 'true');
      mathField.setAttribute('tabindex', '0');
      mathField.setAttribute('aria-multiline', 'true');
      mathField.addEventListener('input', handleMathInput);
      containerRef.current.appendChild(mathField);
      mathfieldElement.current = mathField;
    }
  }, [handleMathInput]);

  useEffect(() => {
    if (mathfieldElement.current) {
      const currentValue = (mathfieldElement.current as any).value || '';
      const wrappedAnswer = answer ? wrapContent(answer) : '';
      if (currentValue !== wrappedAnswer) {
        (mathfieldElement.current as any).value = wrappedAnswer;
      }
    }
  }, [answer]);

  useEffect(() => {
    if (mathfieldElement.current && containerRef.current) {
      const className = `min-h-[60px] p-3 rounded-md cursor-text transition-colors ${hasAiAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-150'}`;
      mathfieldElement.current.setAttribute('class', className);
    }
  }, [hasAiAnswer]);

  useEffect(() => {
    return () => {
      if (mathfieldElement.current) {
        mathfieldElement.current.removeEventListener('input', handleMathInput);
      }
    };
  }, [handleMathInput]);

  return (
    <div className="bg-white rounded-lg border border-gray-150 shadow-sm p-4.5 mb-4">
      <div className="flex items-center gap-3 mb-3.5">
        <div className={`w-[26px] h-[26px] rounded-md flex items-center justify-center text-sm font-semibold text-white ${question.detected_number ? 'bg-blue-500' : 'bg-green-500'}`}>
          {question.number}
        </div>
        <span className="text-xs text-gray-400">
          {question.detected_number ? `(图片检测编号)` : '(自动编号)'}
        </span>
      </div>

      <div className="mb-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-gray-700">题目内容</span>
        </div>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入题目内容..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="bg-[#fafafa] border border-gray-150 rounded-md"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-700">答案编辑区域</span>
          <div className="flex items-center gap-1">
            <Tooltip title="支持数学公式：MathLive">
              <Button type="text" icon={<Calculator size={12} />} onClick={() => setShowMathToolbar(!showMathToolbar)} className="h-auto p-0.5 text-gray-400 hover:text-gray-600" />
            </Tooltip>
          </div>
        </div>

        {showMathToolbar && (
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded mb-2">
            {mathSymbols.map((item) => (
              <button
                key={item.label}
                onClick={() => handleMathInsert(item.symbol)}
                title={item.symbol}
                className="w-7 h-7 border border-gray-200 rounded bg-white text-xs flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div ref={containerRef} />
        {!answer && (
          <span className="text-xs text-gray-400 mt-1 block">在上方输入框中直接编辑数学公式，所见即所得</span>
        )}

        <div className="flex justify-end gap-2 mt-2">
          {!answer || !hasAiAnswer ? (
            <Button
              icon={isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
              onClick={handleGenerateAnswer}
              loading={isGenerating}
              disabled={isGenerating}
              size="small"
              className="h-7 px-4 bg-green-500 hover:bg-green-600 text-white border-none rounded text-xs"
            >
              {isGenerating ? '生成中...' : '生成答案'}
            </Button>
          ) : (
            <Button
              icon={<RefreshCw size={12} />}
              onClick={handleGenerateAnswer}
              loading={isGenerating}
              disabled={isGenerating}
              size="small"
              className="h-7 px-4 bg-gray-200 hover:bg-gray-300 text-gray-600 border-none rounded text-xs"
            >
              重新生成
            </Button>
          )}
          <Button icon={<Save size={12} />} onClick={handleSaveAnswer} size="small" className="h-7 px-3 border border-gray-200 rounded text-xs">
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
