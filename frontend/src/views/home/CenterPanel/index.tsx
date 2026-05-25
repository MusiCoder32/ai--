import { Empty, Button, Divider } from "antd";
import { Wand2, Eye, Download, Plus } from "lucide-react";
import QuestionEditor from "./QuestionEditor";
import OcrResult from "./OcrResult";
import type { Question } from "@/types";

const mockQuestions: Question[] = [
  {
    id: "q1",
    paper_id: "mock_paper",
    content: "已知函数 f(x) = x² - 2x + 1，求 f(x) 在 x = 2 处的导数值。",
    ai_answer: "f'(x) = 2x - 2，当 x = 2 时，f'(2) = 2 × 2 - 2 = 2。答案：2",
    user_answer: "",
    x: 50,
    y: 100,
    width: 600,
    height: 80,
    answer_x: 50,
    answer_y: 200,
    answer_width: 600,
    answer_height: 60,
    font_color: "#333333",
    font_size: 14,
    order: 1,
    number: 1,
    detected_number: "1",
  },
  {
    id: "q2",
    paper_id: "mock_paper",
    content: "解方程 2x + 5 = 13，并求出 x 的值。",
    ai_answer:
      "2x + 5 = 13，移项得 2x = 13 - 5 = 8，所以 x = 8 ÷ 2 = 4。答案：x = 4",
    user_answer: "",
    x: 50,
    y: 300,
    width: 600,
    height: 80,
    answer_x: 50,
    answer_y: 400,
    answer_width: 600,
    answer_height: 60,
    font_color: "#333333",
    font_size: 14,
    order: 2,
    number: 2,
    detected_number: "2",
  },
  {
    id: "q3",
    paper_id: "mock_paper",
    content: "计算：(a + b)² - (a - b)²，其中 a = 3，b = 2。",
    ai_answer:
      "(a + b)² - (a - b)² = (a² + 2ab + b²) - (a² - 2ab + b²) = 4ab。当 a = 3，b = 2 时，4 × 3 × 2 50",
    user_answer: "",
    x: 50,
    y: 500,
    width: 600,
    height: 80,
    answer_x: 50,
    answer_y: 600,
    answer_width: 600,
    answer_height: 60,
    font_color: "#333333",
    font_size: 14,
    order: 3,
    number: 3,
    detected_number: "3",
  },
  {
    id: "q4",
    paper_id: "mock_paper",
    content: "证明：三角形的三条高交于一点（垂心）。",
    ai_answer:
      "设△ABC的三条高分别为AD、BE、CF。过A、B、C分别作对边的平行线，构成△A'B'C'。由于AB∥A'B'，AC∥A'C'，所以四边形ABAC和ACAB都是平行四边形，因此A'B=AC=AB'，即A'是B'C'的中点。同理B'是A'C'的中点，C'是A'B'的中点。而AD、BE、CF分别是△A'B'C'各边的垂直平分线，根据垂直平分线性质，三角形三边的垂直平分线交于一点（外心），所以AD、BE、CF交于一点。证毕。",
    user_answer: "",
    x: 50,
    y: 700,
    width: 600,
    height: 100,
    answer_x: 50,
    answer_y: 820,
    answer_width: 600,
    answer_height: 120,
    font_color: "#333333",
    font_size: 14,
    order: 4,
    number: 4,
    detected_number: "4",
  },
  {
    id: "q5",
    paper_id: "mock_paper",
    content: "求等差数列 2, 5, 8, 11, ... 的前10项和。",
    ai_answer:
      "首项 a₁ = 2，公差 d = 3，项数 n = 10。第10项 a₁₀ = a₁ + (10 - 1)d = 2 + 9 × 3 = 29。前10项和 S₁₀ = n(a₁ + a₁₀)/2 = 10 × (2 + 29)/2 = 5 × 31 = 155。答案：155",
    user_answer: "",
    x: 50,
    y: 950,
    width: 600,
    height: 80,
    answer_x: 50,
    answer_y: 1050,
    answer_width: 600,
    answer_height: 60,
    font_color: "#333333",
    font_size: 14,
    order: 5,
    number: 5,
    detected_number: "5",
  },
];

interface CenterPanelProps {
  currentPaperId: string | null;
  questions: Question[];
  isOcrDone: boolean;
  isAnswerGenerated: boolean;
  paperValidation: "pending" | "valid" | "invalid";
  paperType: "exam" | "question" | "other" | undefined;
  isOcrLoading: boolean;
  isAnswerLoading: boolean;
  onOcr: () => void;
  onGenerateAnswers: () => void;
  onPreview: () => void;
  onExport: () => void;
  onAnswerGenerated: (questionId: string, answer: string) => void;
  onQuestionUpdated: (question: Question) => void;
}

export default function CenterPanel({
  currentPaperId,
  questions,
  isOcrDone,
  paperValidation,
  paperType,
  isOcrLoading,
  isAnswerLoading,
  onOcr,
  onGenerateAnswers,
  onPreview,
  onExport,
  onAnswerGenerated,
  onQuestionUpdated,
}: CenterPanelProps) {
  const displayQuestions = questions.length > 0 ? questions : mockQuestions;
  const hasValidQuestions =
    displayQuestions.length > 0 && paperValidation !== "invalid";

  const getStatusText = () => {
    if (!currentPaperId) {
      return "等待上传试卷...（当前显示模拟数据）";
    }
    if (questions.length > 0) {
      return `已检测到有效试卷，共 ${questions.length} 道题目`;
    }
    if (isOcrDone) {
      return "OCR识别完成，未检测到题目";
    }
    return "等待OCR识别...";
  };

  const renderQuestionDisplay = () => {
    if (displayQuestions.length > 0) {
      return (
        <div className="space-y-4">
          {displayQuestions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onAnswerGenerated={onAnswerGenerated}
              onQuestionUpdated={onQuestionUpdated}
            />
          ))}
        </div>
      );
    }

    if (isOcrDone) {
      return (
        <div className="py-12 text-center">
          <Empty
            description={
              paperType === "other"
                ? "未检测到有效试卷，请上传正确的试卷图片"
                : "未检测到题目，请检查试卷内容"
            }
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
        <Empty description="等待OCR识别..." />
        <p className="text-xs text-gray-300 mt-2">
          点击"执行OCR识别"按钮开始识别试卷内容
        </p>
      </div>
    );
  };

  return (
    <main className="flex-1 h-full w-0 v-start-center  bg-white rounded-lg shadow-sm  ">
      <div className="flex w-full gap-2.5 px-10px mt-10px bg-white border-b border-gray-100">
        <Button
          type="primary"
          icon={<Wand2 size={16} />}
          onClick={onOcr}
          loading={isOcrLoading}
          disabled={!currentPaperId || isOcrLoading}
          className="h-8.5 px-4 text-sm flex items-center gap-1.5"
        >
          {isOcrLoading ? "识别中..." : "执行OCR识别"}
        </Button>
        <Button
          icon={<Plus size={14} />}
          onClick={onGenerateAnswers}
          loading={isAnswerLoading}
          disabled={!hasValidQuestions || isAnswerLoading}
          className="h-8.5 px-3.5 text-sm flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white border-none"
        >
          {isAnswerLoading ? "生成中..." : "生成答案"}
        </Button>
        <Button
          icon={<Eye size={14} />}
          onClick={onPreview}
          disabled={!hasValidQuestions}
          className="h-8.5 px-3.5 text-sm flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white border-none"
        >
          预览
        </Button>
        <Button
          icon={<Download size={14} />}
          onClick={onExport}
          disabled={!hasValidQuestions}
          className="h-8.5 px-3.5 text-sm flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white border-none"
        >
          导出
        </Button>
      </div>

      <Divider>
        <span className="text-sm font-semibold text-gray-800">OCR识别内容</span>
      </Divider>

      <div className="flex-1 w-full h-0 overflow-y-auto px-10px pb-10px">
        {renderQuestionDisplay()}
      </div>

      <div className="px-5 py-2.5 w-full bg-[#e0f7fa] border-t border-[#b2ebf2] text-xs text-[#00838f] text-align-center">
        试卷检测状态：{getStatusText()}
      </div>
    </main>
  );
}
