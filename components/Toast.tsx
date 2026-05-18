'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl toast-slide-up">
      <Check className="w-4 h-4 text-green-400 flex-none" />
      {message}
    </div>
  );
}
