'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  source?: string;
  /** 'dark' for use on the dark hero/CTA, 'light' for white backgrounds */
  variant?: 'dark' | 'light';
}

export function WaitlistForm({ source = 'landing', variant = 'dark' }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json() as { success?: boolean; alreadyJoined?: boolean; position?: number; error?: string };
      if (data.alreadyJoined) {
        setState('duplicate');
      } else if (data.success) {
        setPosition(data.position ?? null);
        setState('success');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  const isDark = variant === 'dark';

  if (state === 'success') {
    return (
      <div className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-none">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm">You're on the list!</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            We'll be in touch soon.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'duplicate') {
    return (
      <div className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-none ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Already signed up!</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            This email is already on the waitlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className={`flex-1 px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
          isDark
            ? 'bg-white/10 border-white/20 text-white placeholder-gray-500 focus:border-white/50 focus:bg-white/15'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
        }`}
      />
      <button
        type="submit"
        disabled={state === 'loading' || !email}
        className="flex items-center justify-center gap-2 bg-[#3B5BDB] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3451c7] disabled:opacity-60 transition-all shadow-lg shadow-blue-900/30 shrink-0"
      >
        {state === 'loading'
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
          : <>Join the waitlist <ArrowRight className="w-4 h-4" /></>}
      </button>
      {state === 'error' && (
        <p className={`text-xs mt-1 sm:col-span-2 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}
