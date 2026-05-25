import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { Upload as UploadIcon } from 'lucide-react';

interface PaperUploaderProps {
  onFileUpload: (file: File) => void;
}

export default function PaperUploader({ onFileUpload }: PaperUploaderProps) {
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      message.error('请上传图片或PDF文件');
      return false;
    }
    
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('文件大小不能超过20MB');
      return false;
    }
    
    onFileUpload(file);
    return false;
  };

  return (
    <div className="px-3 py-3">
      <Upload
        beforeUpload={beforeUpload}
        accept="image/jpeg,image/png,application/pdf"
        showUploadList={false}
        className="uploader"
      >
        <div className="w-[200px] h-[100px] mx-auto rounded-lg bg-white border-2 border-dashed border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50">
          <div className="w-[56px] h-[56px] rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <UploadIcon className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-700">点击上传试卷图片</span>
          <span className="text-[10px] text-gray-400">支持 JPG、PNG、PDF 格式</span>
          <span className="text-[10px] text-gray-400">最大 20MB</span>
        </div>
      </Upload>
    </div>
  );
}
