'use client';

import { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function TailorTab({ jobId }: { jobId: string }) {
  const [tailoring, setTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<any>(null);

  const handleTailor = async () => {
    setTailoring(true);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      setTailorResult(await res.json());
    } finally {
      setTailoring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tailor Resume</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Generate a highly targeted version of your master resume based on this specific JD. The LLM will rewrite bullets to emphasize matching experience.
        </p>
        <button 
          onClick={handleTailor} 
          disabled={tailoring}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow hover:bg-blue-700 disabled:opacity-50 transition-all mb-8 flex justify-center items-center gap-2"
        >
          {tailoring ? <span className="animate-pulse">Generating with LLM...</span> : 'Generate Tailored Resume'}
        </button>
        
        {tailorResult && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl text-green-900 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-none" />
              <div>
                <strong className="block mb-1 text-green-800">Generation Complete!</strong>
                <p className="text-sm text-green-700">Saved to <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">output/</code> directory.</p>
              </div>
            </div>
            
            {tailorResult.explanation && (
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Strategy Explanation</h3>
                <p className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-blue-500 pl-3">
                  {tailorResult.explanation}
                </p>
                <div className="mt-5 text-xs font-medium text-gray-500 flex flex-wrap gap-2 items-center">
                  <span>Stories Used:</span> 
                  {tailorResult.storiesUsed.map((s: string) => (
                    <span key={s} className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        {tailorResult?.tailoredResume ? (
          <div className="bg-gray-900 text-gray-300 p-8 rounded-2xl text-xs font-mono whitespace-pre-wrap overflow-auto h-[700px] border border-gray-800 shadow-2xl leading-loose">
            {tailorResult.tailoredResume}
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 border-dashed rounded-2xl h-[700px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>Generated markdown will appear here after tailoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
