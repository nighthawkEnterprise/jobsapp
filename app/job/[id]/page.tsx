'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, FileText, MessageSquare } from 'lucide-react';

import DetailsTab from '@/components/job-tabs/details/DetailsTab';
import TailorTab from '@/components/job-tabs/tailor/TailorTab';
import PrepTab from '@/components/job-tabs/prep/PrepTab';

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'tailor' | 'prep'>('details');

  useEffect(() => {
    fetch('/api/jobs').then(res => res.json()).then(data => {
      const found = data.find((j: any) => j.id === id);
      setJob(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading job details...</div>;
  if (!job) return <div className="p-8 text-center text-gray-500">Job not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Pipeline
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
          <div className="text-lg font-medium text-gray-600 mb-4">{job.company} <span className="text-gray-300 mx-2">•</span> {job.location}</div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md text-gray-700 capitalize">Status: {job.status}</span>
            <span className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md text-blue-800 flex items-center gap-1">
              <span className="text-blue-400">💰</span> ${job.salary?.toLocaleString() || 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex-none flex flex-col items-center justify-center bg-blue-600 text-white p-6 rounded-xl shadow-inner min-w-[140px]">
          <div className="text-4xl font-black">
            {job.dimensions?.overall != null ? job.dimensions.overall.toFixed(1) : '—'}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-1">out of 5</div>
          {job.dimensions?.overall != null && (
            <div className="text-[10px] text-blue-200 mt-1.5 text-center leading-tight">
              {job.dimensions.overall >= 4.5 ? 'Apply immediately' :
               job.dimensions.overall >= 4.0 ? 'Worth applying' :
               job.dimensions.overall >= 3.5 ? 'Apply if specific reason' :
               'Not recommended'}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('details')} className={`pb-3 px-5 font-bold flex items-center text-sm transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}><Briefcase className="w-4 h-4 mr-2"/> Details & Notes</button>
        <button onClick={() => setActiveTab('tailor')} className={`pb-3 px-5 font-bold flex items-center text-sm transition-colors whitespace-nowrap ${activeTab === 'tailor' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}><FileText className="w-4 h-4 mr-2"/> Resume Tailoring</button>
        <button onClick={() => setActiveTab('prep')} className={`pb-3 px-5 font-bold flex items-center text-sm transition-colors whitespace-nowrap ${activeTab === 'prep' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}><MessageSquare className="w-4 h-4 mr-2"/> Interview Prep</button>
      </div>

      <div className={activeTab === 'details' ? 'block' : 'hidden'}>
        <DetailsTab job={job} />
      </div>
      <div className={activeTab === 'tailor' ? 'block' : 'hidden'}>
        <TailorTab jobId={job.id} />
      </div>
      <div className={activeTab === 'prep' ? 'block' : 'hidden'}>
        <PrepTab jobId={job.id} />
      </div>
    </div>
  );
}
