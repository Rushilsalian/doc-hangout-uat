import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
}

export const TypingIndicator = ({ isTyping, userName = 'Someone' }: TypingIndicatorProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isTyping) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-secondary/50 border border-dashed">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span>{userName} is typing{dots}</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;