'use client';

import { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface TailorResult {
  tailoredResume: string;
  explanation: string;
  storiesUsed: string[];
}

export default function TailorTab({ jobId }: { jobId: string }) {
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleTailor = async () => {
    setTailoring(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Tailoring failed');
      } else {
        setResult(data as TailorResult);
      }
    } catch {
      setError('Request failed — check your connection.');
    } finally {
      setTailoring(false);
    }
  };

  const downloadDocx = async () => {
    if (!result?.tailoredResume) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.tailoredResume, filename: 'tailored-resume.docx' }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored-resume.docx';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tailor Resume</h2>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Generate a targeted version of your master resume for this specific role. The LLM rewrites bullets to emphasize matching experience and weaves in your STAR stories.
        </p>
        <button
          onClick={handleTailor}
          disabled={tailoring}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow hover:bg-blue-700 disabled:opacity-50 transition-all mb-8 flex justify-center items-center gap-2"
        >
          {tailoring
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
            : 'Generate Tailored Resume'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
            <div>
              <strong className="block mb-1 text-red-700 text-sm font-bold">Generation failed</strong>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl text-green-900 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-none" />
              <div>
                <strong className="block mb-1 text-green-800">Generated!</strong>
                <p className="text-sm text-green-700">Saved to <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">output/</code></p>
              </div>
            </div>

            <button
              onClick={downloadDocx}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading…' : 'Download as .docx'}
            </button>

            {result.explanation && (
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Strategy</h3>
                <p className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-blue-500 pl-3">
                  {result.explanation}
                </p>
                {result.storiesUsed.length > 0 && (
                  <div className="mt-4 text-xs font-medium text-gray-500 flex flex-wrap gap-2 items-center">
                    <span>Stories used:</span>
                    {result.storiesUsed.map(s => (
                      <span key={s} className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {result?.tailoredResume ? (
          <div className="bg-gray-900 text-gray-300 p-8 rounded-2xl text-xs font-mono whitespace-pre-wrap overflow-auto h-[700px] border border-gray-800 shadow-2xl leading-loose">
            {result.tailoredResume}
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 border-dashed rounded-2xl h-[700px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>Generated resume will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
