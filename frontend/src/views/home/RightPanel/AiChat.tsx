import { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import type { ChatMessage } from '@/types';
import { sendChatMessage, getChatHistory, sendStreamChatMessage } from '@/api/chat';
import { useChat } from '@/context/ChatContext';
import { usePaper } from '@/context/PaperContext';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AiChat() {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { messages, dispatch, isTyping, streamingMessage } = useChat();
  const { currentPaper } = usePaper();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getChatHistory(currentPaper?.id);
        if (response.success && response.data) {
          // dispatch({ type: 'SET_MESSAGES', payload: response.data });
        }
      } catch (error) {
        console.log('加载聊天历史失败');
      }
    };
    loadHistory();
  }, [currentPaper?.id, dispatch]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      role: 'user',
      paper_id: currentPaper?.id,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    setInputValue('');

    const assistantMessageId = `msg-${Date.now()}-assistant`;
    let currentContent = '';

    try {
      await sendStreamChatMessage(
        inputValue,
        currentPaper?.id,
        (chunk) => {
          currentContent += chunk;
          const botMessage: ChatMessage = {
            id: assistantMessageId,
            content: currentContent,
            role: 'assistant',
            paper_id: currentPaper?.id,
            created_at: new Date().toISOString(),
          };
          dispatch({ type: 'SET_LAST_ASSISTANT_MESSAGE', payload: botMessage });
        }
      );

      if (currentContent) {
        const finalMessage: ChatMessage = {
          id: assistantMessageId,
          content: currentContent,
          role: 'assistant',
          paper_id: currentPaper?.id,
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: finalMessage });
        dispatch({ type: 'CLEAR_STREAMING', payload: undefined });
      }
    } catch (error) {
      message.error('发送消息时发生错误');
      console.error('Stream error:', error);
      dispatch({ type: 'CLEAR_STREAMING', payload: undefined });
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, dispatch, currentPaper?.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    return (
      <div key={msg.id} className={`flex gap-2.5 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500' : 'bg-green-50'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-green-600" />}
        </div>
        <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
          <div className={`px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed break-words ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-[4px]' 
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-[4px]'
          }`}>
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200">
        <Sparkles size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-amber-800">AI 助手</span>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 && !streamingMessage ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center">
            <Bot size={24} className="text-green-500 mb-3" />
            <p className="text-sm">你好！我是 DeepSeek 助手，</p>
            <p className="text-sm mt-1">可以帮你解答 OCR 识别和答题相关问题。</p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {streamingMessage && renderMessage(streamingMessage)}
          </>
        )}
        {isTyping && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-[18px] border border-gray-100 w-fit">
            <Bot size={14} className="text-gray-400" />
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 py-3 bg-white border-t border-gray-100">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入问题，DeepSeek 帮你解答..."
          className="flex-1 rounded-full"
          allowClear
        />
        <Button
          type="primary"
          icon={<Send size={16} />}
          onClick={handleSend}
          loading={isSending}
          disabled={!inputValue.trim()}
          className="rounded-full px-5"
        >
          发送
        </Button>
      </div>
    </div>
  );
}
