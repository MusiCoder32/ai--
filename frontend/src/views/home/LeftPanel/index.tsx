import { Divider } from 'antd';
import HistoryList from '@/views/home/LeftPanel/HistoryList';
import type { HistoryItem } from '@/types';

interface LeftPanelProps {
  history: HistoryItem[];
  selectedHistoryId: string | null;
  onHistorySelect: (item: HistoryItem) => void;
  onHistoryDelete: (paperId: string) => void;
}

export default function LeftPanel({
  history,
  selectedHistoryId,
  onHistorySelect,
  onHistoryDelete,
}: LeftPanelProps) {
  return (
    <aside className="w-[280px] bg-white   rounded-lg shadow-sm  h-full">
      <div className="px-4">
            <Divider titlePlacement="start">
        <span className="  font-semibold text-gray-800">历史记录</span>
      </Divider>
      </div>
  

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <HistoryList
          history={history}
          selectedId={selectedHistoryId}
          onSelect={onHistorySelect}
          onDelete={onHistoryDelete}
        />
      </div>
    </aside>
  );
}