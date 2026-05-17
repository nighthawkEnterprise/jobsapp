'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PipelinePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [rawJD, setRawJD] = useState('');

  const fetchJobs = () => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data.sort((a: any, b: any) => (b.score || 0) - (a.score || 0)));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddJob = async () => {
    if (!rawJD) return;
    setAdding(true);
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: rawJD })
    });
    setRawJD('');
    setAdding(false);
    fetchJobs();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates: { status: newStatus } })
    });
    fetchJobs();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Active Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your targeted roles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-4">
          {jobs.length === 0 ? (
            <div className="p-12 border border-dashed rounded-xl text-center text-gray-500 bg-white">
              <span className="text-3xl block mb-2">📥</span>
              No jobs in pipeline yet. Paste a JD on the right to get started.
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex gap-5 items-center">
                <div className="flex-none flex flex-col items-center justify-center bg-blue-50 border border-blue-100 h-20 w-20 rounded-lg">
                  <div className="text-3xl font-black text-blue-600">{job.score}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mt-1">Fit Score</div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-gray-900">
                    <Link href={`/job/${job.id}`} className="hover:text-blue-600 transition-colors">
                      {job.title}
                    </Link>
                  </h3>
                  <div className="text-sm text-gray-600 font-medium mt-0.5">{job.company} <span className="text-gray-300 mx-1">•</span> {job.location}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">${job.salary?.toLocaleString() || 'N/A'}</span>
                    <span>Updated {new Date(job.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex-none w-44">
                  <select 
                    value={job.status} 
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer font-medium text-gray-700 shadow-sm"
                  >
                    <option value="interested">Interested</option>
                    <option value="applied">Applied</option>
                    <option value="screened">Screened</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
          <h2 className="font-bold text-gray-900 mb-2">Add Job Manually</h2>
          <p className="text-xs text-gray-500 mb-4">The LLM will automatically parse the title, company, location, and salary.</p>
          <textarea 
            value={rawJD} 
            onChange={(e) => setRawJD(e.target.value)}
            className="w-full h-64 border border-gray-300 rounded-lg p-3 mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="Paste full Job Description text here..."
          />
          <button 
            onClick={handleAddJob}
            disabled={adding || !rawJD}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex justify-center items-center gap-2"
          >
            {adding ? <span className="animate-pulse">Parsing with LLM...</span> : 'Parse & Add to Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}
