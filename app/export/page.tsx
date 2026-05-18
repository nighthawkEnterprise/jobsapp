'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'master-resume.docx' }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'master-resume.docx';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-8 text-center mt-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Export Master Resume</h1>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">Download your Master Resume as a .docx file ready to submit. You can also download any tailored version directly from the Resumes page.</p>
      </div>

      <div className="bg-white p-12 border border-gray-200 rounded-2xl shadow-sm text-center max-w-2xl mx-auto">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-blue-100 text-blue-700 px-12 py-10 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all shadow-sm mx-auto"
        >
          <FileText className="w-12 h-12 text-blue-600 mb-2" />
          {exporting ? 'Generating…' : 'Download Master Resume (.docx)'}
        </button>
      </div>
    </div>
  );
}
