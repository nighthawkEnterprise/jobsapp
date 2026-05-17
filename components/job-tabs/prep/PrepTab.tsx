'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function PrepTab({ jobId }: { jobId: string }) {
  const [prepping, setPrepping] = useState(false);
  const [prepResult, setPrepResult] = useState<any>(null);

  const handlePrep = async () => {
    setPrepping(true);
    try {
      const res = await fetch('/api/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      setPrepResult(await res.json());
    } finally {
      setPrepping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Prep</h2>
        <p className="text-gray-600 text-sm mb-6 max-w-lg mx-auto">
          Ask the LLM to surface and rank the 3 most relevant stories from your story bank for this specific role.
        </p>
        <button 
          onClick={handlePrep} 
          disabled={prepping} 
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold text-sm shadow hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          {prepping ? <span className="animate-pulse">Analyzing JD & Stories...</span> : <><MessageSquare className="w-4 h-4"/> Surface Relevant Stories</>}
        </button>
      </div>

      {prepResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {prepResult.map((item: any, idx: number) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="bg-purple-50 p-6 border-b md:border-b-0 md:border-r border-purple-100 md:w-1/3 flex flex-col justify-center">
                <div className="font-bold text-purple-900 flex items-center mb-3">
                  <span className="bg-purple-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs mr-2 font-black">{idx + 1}</span>
                  <span className="uppercase tracking-wider text-xs font-bold">Why it matters</span>
                </div>
                <p className="text-sm text-purple-800 leading-relaxed font-medium">{item.reasoning}</p>
              </div>
              <div className="p-6 md:w-2/3">
                <h3 className="font-bold text-xl text-gray-900 mb-4">{item.story.title}</h3>
                <div className="space-y-4 text-sm text-gray-700">
                  <p><strong className="text-gray-900 block text-xs uppercase tracking-wider mb-1">Situation</strong> {item.story.situation}</p>
                  <p><strong className="text-gray-900 block text-xs uppercase tracking-wider mb-1">Task</strong> {item.story.task}</p>
                  <p><strong className="text-gray-900 block text-xs uppercase tracking-wider mb-1">Action</strong> {item.story.action}</p>
                  <p><strong className="text-gray-900 block text-xs uppercase tracking-wider mb-1">Result</strong> {item.story.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
