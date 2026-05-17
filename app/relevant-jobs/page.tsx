'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, ExternalLink } from 'lucide-react';

export default function RelevantJobsPage() {
  const [pipelineJobs, setPipelineJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/relevant-jobs')
      .then(res => res.json())
      .then(data => {
        // Sort by score descending
        setPipelineJobs(data.sort((a: any, b: any) => (b.score || 0) - (a.score || 0)));
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading relevant jobs...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="mb-10 flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Relevant Jobs</h1>
          <p className="text-gray-500 text-sm">Your active pipeline, scored and ranked against your target criteria.</p>
        </div>
      </div>

      <div className="space-y-6">
        {pipelineJobs.length === 0 ? (
          <div className="p-12 border border-dashed rounded-xl text-center text-gray-500 bg-white">
            <span className="text-3xl block mb-2">📥</span>
            No jobs in your pipeline yet. Add them from your Dashboard.
          </div>
        ) : (
          pipelineJobs.map(job => (
            <div key={job.id} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 md:items-center">
              
              <div className="flex-none flex flex-col items-center justify-center bg-blue-50 border border-blue-100 h-24 w-24 rounded-xl">
                <div className="text-4xl font-black text-blue-600">{job.score}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mt-1">Fit Score</div>
              </div>

              <div className="flex-grow">
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                  <Link href={`/job/${job.id}`} className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    {job.title} <ExternalLink className="w-4 h-4 text-gray-400" />
                  </Link>
                </h3>
                <div className="text-sm text-gray-600 font-medium mb-3">{job.company} <span className="text-gray-300 mx-1">•</span> {job.location}</div>
                
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-md text-gray-700 capitalize">Status: {job.status}</span>
                  <span className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-md text-blue-800">${job.salary?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              <div className="flex-none w-full md:w-64 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Match Reasoning</h4>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  {job.reasoning?.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-green-500 font-bold leading-tight">✓</span> 
                      <span className="leading-tight">{reason}</span>
                    </li>
                  ))}
                  {(!job.reasoning || job.reasoning.length === 0) && (
                    <li className="text-gray-400 italic">No specific match criteria met.</li>
                  )}
                </ul>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
