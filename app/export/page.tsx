'use client';

import { useState } from 'react';
import { Download, FileText, File } from 'lucide-react';

export default function ExportPage() {
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async (format: 'docx' | 'pdf') => {
    format === 'docx' ? setExportingDocx(true) : setExportingPdf(true);
    setMessage('');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✓ Success! Saved locally to: ${data.filePath}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      setMessage('Failed to trigger export');
    } finally {
      setExportingDocx(false);
      setExportingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-8 text-center mt-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Export Master Resume</h1>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">Generate a clean, professional version of your Master Resume directly from your settings. Files are saved instantly to your local output folder.</p>
      </div>
      
      <div className="bg-white p-12 border border-gray-200 rounded-2xl shadow-sm text-center max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button 
            onClick={() => handleExport('docx')} 
            disabled={exportingDocx || exportingPdf}
            className="flex-1 flex flex-col items-center justify-center gap-3 bg-white border-2 border-blue-100 text-blue-700 px-8 py-10 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all shadow-sm"
          >
            <FileText className="w-12 h-12 text-blue-600 mb-2"/> 
            {exportingDocx ? 'Generating DocX...' : 'Export as DocX'}
          </button>
          
          <button 
            onClick={() => handleExport('pdf')} 
            disabled={exportingDocx || exportingPdf}
            className="flex-1 flex flex-col items-center justify-center gap-3 bg-white border-2 border-red-100 text-red-700 px-8 py-10 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all shadow-sm"
          >
            <File className="w-12 h-12 text-red-600 mb-2"/> 
            {exportingPdf ? 'Generating PDF...' : 'Export as PDF'}
          </button>
        </div>

        {message && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium text-left inline-flex items-center w-full shadow-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
