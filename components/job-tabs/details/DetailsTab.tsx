'use client';

import { useState } from 'react';

export default function DetailsTab({ job }: { job: any }) {
  const [notes, setNotes] = useState(job.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const saveNotes = async () => {
    setSavingNotes(true);
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, updates: { notes } })
    });
    setSavingNotes(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
        <div className="prose prose-sm max-w-none bg-white p-8 rounded-xl border border-gray-200 shadow-sm whitespace-pre-wrap text-gray-700 font-serif">
          {job.content}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tracking Notes</h2>
        <textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)}
          className="w-full h-64 border border-gray-300 rounded-lg p-4 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          placeholder="Log dates, interviewers, and next steps here..."
        />
        <button 
          onClick={saveNotes} 
          disabled={savingNotes} 
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
        >
          {savingNotes ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}
