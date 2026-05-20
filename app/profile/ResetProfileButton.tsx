'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Loader2 } from 'lucide-react';

export default function ResetProfileButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', { method: 'DELETE' });
    if (res.ok) {
      router.push('/onboarding');
    } else {
      alert('Something went wrong. Please try again.');
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Reset all profile data?</span>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Yes, reset
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
    >
      <RotateCcw className="w-4 h-4" />
      Reset profile &amp; re-run onboarding
    </button>
  );
}
