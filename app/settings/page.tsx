'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    jobTitles: '',
    salaryFloor: 0,
    locationPreferences: '',
    domainsOfInterest: '',
    companiesToExclude: '',
    roleType: '',
    workStyle: ''
  });
  const [resume, setResume] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setPrefs({
          jobTitles: data.preferences.jobTitles.join(', '),
          salaryFloor: data.preferences.salaryFloor,
          locationPreferences: data.preferences.locationPreferences.join(', '),
          domainsOfInterest: data.preferences.domainsOfInterest.join(', '),
          companiesToExclude: data.preferences.companiesToExclude.join(', '),
          roleType: data.preferences.roleType,
          workStyle: data.preferences.workStyle
        });
        setResume(data.resume);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const split = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);
    
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: {
          ...prefs,
          jobTitles: split(prefs.jobTitles),
          locationPreferences: split(prefs.locationPreferences),
          domainsOfInterest: split(prefs.domainsOfInterest),
          companiesToExclude: split(prefs.companiesToExclude),
        },
        resume
      })
    });
    setSaving(false);
    alert('Settings saved successfully!');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Setup Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your target criteria and base resume material.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Saving Profile...' : 'Save All Changes'}
        </button>
      </div>

      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-6 text-gray-800">Target Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Target Job Titles</label>
            <p className="text-xs text-gray-400 mb-2">Comma separated (e.g. Senior PM, Staff PM)</p>
            <input type="text" value={prefs.jobTitles} onChange={e => setPrefs({...prefs, jobTitles: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Base Salary</label>
            <p className="text-xs text-gray-400 mb-2">Numeric value only</p>
            <input type="number" value={prefs.salaryFloor} onChange={e => setPrefs({...prefs, salaryFloor: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Locations</label>
            <p className="text-xs text-gray-400 mb-2">Comma separated (e.g. Seattle, Remote)</p>
            <input type="text" value={prefs.locationPreferences} onChange={e => setPrefs({...prefs, locationPreferences: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Domains of Interest</label>
            <p className="text-xs text-gray-400 mb-2">Comma separated (e.g. AI, DevTools)</p>
            <input type="text" value={prefs.domainsOfInterest} onChange={e => setPrefs({...prefs, domainsOfInterest: e.target.value})} className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-2 text-gray-800">Master Resume</h2>
        <p className="text-sm text-gray-500 mb-6">Paste your base resume in Markdown format. The LLM will use this as the foundation for tailoring.</p>
        <textarea 
          value={resume} 
          onChange={e => setResume(e.target.value)} 
          className="w-full h-[500px] border border-gray-300 rounded-md p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="# Your Name\n\n## Experience..."
        />
      </section>
    </div>
  );
}
