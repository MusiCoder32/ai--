import { List, Avatar, Tag, Button, Popconfirm } from 'antd';
import { Delete, FileImage } from 'lucide-react';
import type { Paper, Question } from '@/types';

export interface HistoryItem extends Paper {
  preview_text: string;
  questions?: Question[];
}

interface HistoryListProps {
  history: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (paperId: string) => void;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'answered':
      return { color: 'green', text: '已完成' };
    case 'ocr_done':
      return { color: 'orange', text: '已识别' };
    default:
      return { color: 'default', text: '待识别' };
  }
};

function HistoryList({ history, selectedId, onSelect, onDelete }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-sm">暂无历史记录</p>
        <p className="text-xs mt-2 text-gray-300">上传试卷后将在此显示</p>
      </div>
    );
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={history}
      renderItem={(item) => {
        const statusConfig = getStatusConfig(item.status);
        const isSelected = selectedId === item.id;

        return (
          <List.Item
            key={item.id}
            onClick={() => onSelect(item)}
            className={`cursor-pointer transition-all rounded-lg ${
              isSelected 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
            }`}
            actions={[
              <Popconfirm
                title="确定删除？"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDelete(item.id);
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Delete size={12} />}
                />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  src={item.original_image_url}
                  icon={<FileImage className="w-4 h-4" />}
                  size={48}
                  className="bg-gray-100"
                />
              }
              title={
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">{formatDateTime(item.created_at)}</span>
                  <Tag color={statusConfig.color} className="text-xs">
                    {statusConfig.text}
                  </Tag>
                </div>
              }
              description={
                <p className="text-xs text-gray-700 line-clamp-2 m-0 mt-1">
                  {item.preview_text || '暂无识别内容'}
                </p>
              }
            />
          </List.Item>
        );
      }}
    />
  );
}

export default HistoryList;
