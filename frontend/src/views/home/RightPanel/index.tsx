import { Divider, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { Upload as UploadIcon } from 'lucide-react';
import AiChat from './AiChat';

interface RightPanelProps {
  previewImageUrl: string | null;
  currentPaperId: string | null;
  onFileUpload: (file: File) => void;
}

export default function RightPanel({ previewImageUrl, onFileUpload }: RightPanelProps) {
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
    <aside className="w-[360px] h-full v-start-center p-10px bg-white rounded-lg shadow-sm  border border-gray-100">
   
      <div className=" w-full bg-white border border-gray-150 rounded-lg">
        <div className="h-full overflow-hidden">
          {previewImageUrl ? (
            <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
              <img
                src={previewImageUrl}
                alt="试卷预览"
                className="max-w-full max-h-[170px] object-contain rounded"
              />
            </div>
          ) : (
            <div className="w-full h-150px rounded-lg bg-white border-2 border-dashed border-blue-300 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50">
              <Upload
                beforeUpload={beforeUpload}
                accept="image/jpeg,image/png,application/pdf"
                showUploadList={false}
              >
                <div className="v-center-center w-full">
          <div className="w-[60px] h-[60px] rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <UploadIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-xs font-medium text-gray-600">点击上传试卷图片</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">支持 JPG、PNG、PDF 格式 | 最大 20MB</div>
                </div>
        
              </Upload>
            </div>
          )}
        </div>
      </div>

    
        <div className="flex-1  mt-10px bg-white border border-gray-200 rounded-lg border-solid p-3"> 
          <AiChat />
        </div>
     
    </aside>
  );
}
