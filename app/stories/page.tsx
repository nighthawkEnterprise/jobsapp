'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SkeletonStoryCard, Skeleton } from '@/components/Skeleton';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';

export default function StoriesPage() {
  useOnboardingGuard();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', situation: '', task: '', action: '', result: '',
    competencies: '', domains: '', metrics: ''
  });

  const fetchStories = () => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => { setStories(data); setLoading(false); });
  };

  useEffect(() => { fetchStories(); }, []);

  const handleSave = async () => {
    const split = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      ...formData,
      competencies: split(formData.competencies),
      domains: split(formData.domains)
    };

    if (editingId) {
      await fetch('/api/stories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, updates: payload }) });
    } else {
      await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    
    setEditingId(null);
    setFormData({ title: '', situation: '', task: '', action: '', result: '', competencies: '', domains: '', metrics: '' });
    fetchStories();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/stories?id=${id}`, { method: 'DELETE' });
    fetchStories();
  };

  const startEdit = (story: any) => {
    setEditingId(story.id);
    setFormData({
      ...story,
      competencies: story.competencies.join(', '),
      domains: story.domains.join(', ')
    });
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SkeletonStoryCard />
          <SkeletonStoryCard />
          <SkeletonStoryCard />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Story Bank</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your STAR achievements for tailoring and interview prep.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {stories.map(s => (
            <div key={s.id} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-gray-900">{s.title}</h3>
                <div className="space-x-3 flex-none">
                  <button onClick={() => startEdit(s)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors">Delete</button>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed"><strong className="text-gray-900">S:</strong> {s.situation}</p>
                <p className="text-sm text-gray-700 leading-relaxed"><strong className="text-gray-900">T:</strong> {s.task}</p>
                <p className="text-sm text-gray-700 leading-relaxed"><strong className="text-gray-900">A:</strong> {s.action}</p>
                <p className="text-sm text-gray-700 leading-relaxed"><strong className="text-gray-900">R:</strong> {s.result}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2 text-xs">
                {s.competencies.map((c: string) => <span key={c} className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-md font-medium">{c}</span>)}
                {s.domains.map((d: string) => <span key={d} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-md font-medium">{d}</span>)}
              </div>
            </div>
          ))}
          {stories.length === 0 && (
            <div className="p-12 border border-dashed rounded-xl text-center text-gray-500 bg-white">
              No stories added yet. Create your first STAR story on the right.
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 sticky top-24">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Story' : 'Add New Story'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Story Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Situation</label>
                <textarea value={formData.situation} onChange={e => setFormData({...formData, situation: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Task</label>
                <textarea value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Action</label>
                <textarea value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Result</label>
                <textarea value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Key Metrics</label>
                <input type="text" placeholder="e.g. 40% latency drop, $2M ARR" value={formData.metrics} onChange={e => setFormData({...formData, metrics: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Competencies</label>
                <input type="text" placeholder="Comma separated" value={formData.competencies} onChange={e => setFormData({...formData, competencies: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Domains</label>
                <input type="text" placeholder="Comma separated" value={formData.domains} onChange={e => setFormData({...formData, domains: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                {editingId ? 'Update Story' : 'Save New Story'}
              </button>
              {editingId && (
                 <button onClick={() => { setEditingId(null); setFormData({ title: '', situation: '', task: '', action: '', result: '', competencies: '', domains: '', metrics: '' })}} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors">
                   Cancel Edit
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
