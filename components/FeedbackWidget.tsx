'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircleQuestion, X, Send, CheckCircle2, Loader2 } from 'lucide-react';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setState('loading');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), email: email.trim() }),
      });
      if (res.ok) {
        setState('success');
        setMessage('');
        setEmail('');
        setTimeout(() => { setState('idle'); setOpen(false); }, 2000);
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={panelRef}>
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <p className="text-sm font-semibold text-white">Share feedback</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {state === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <p className="font-semibold text-gray-900 text-sm">Thanks for the feedback!</p>
              <p className="text-xs text-gray-500">We read every submission.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Feature request, bug, or anything on your mind…"
                  rows={4}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email (optional — for follow-up)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                />
              </div>
              {state === 'error' && (
                <p className="text-xs text-red-500">Something went wrong — please try again.</p>
              )}
              <button
                type="submit"
                disabled={state === 'loading' || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
              >
                {state === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send feedback</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => { setOpen(v => !v); setState('idle'); }}
        className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg hover:bg-black transition-all flex items-center justify-center"
        title="Share feedback or request a feature"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircleQuestion className="w-5 h-5" />}
      </button>
    </div>
  );
}
