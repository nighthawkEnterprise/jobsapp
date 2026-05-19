import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Preferences {
  jobTitles: string[];
  salaryFloor: number;
  locationPreferences: string[];
  domainsOfInterest: string[];
  companiesToExclude: string[];
  targetCompanies: string[];
  roleType: string;
  workStyle: string;
}

export interface Story {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  competencies: string[];
  domains: string[];
  metrics: string;
}

export type JobStatus = 'interested' | 'applied' | 'screened' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';

export interface JobDimension {
  score: number;
  reasoning: string;
}

export interface JobDimensions {
  cv_match:   JobDimension;
  north_star: JobDimension;
  comp:       JobDimension;
  cultural:   JobDimension;
  red_flags:  Array<{ flag: string; deduction: number }>;
  summary:    string;
  overall:    number;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  salary: number;
  sourceUrl: string;
  content: string;
  status: JobStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  score?: number;
  dimensions?: JobDimensions;
  scoredAt?: string;
}

export interface ScoredDiscovery {
  company: string;
  title: string;
  url: string;
  location: string;
  score: number;
  scoreReasons: string[];
  alreadyTracked: boolean;
  salary?: { min?: number; max?: number; currency?: string };
  postedAt?: string;
  dismissed?: boolean;
}

export interface ScanCache {
  scannedAt: string;
  discoveries: ScoredDiscovery[];
  errors: Array<{ company: string; error: string }>;
}

export interface TailoredResume {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export const defaultPreferences: Preferences = {
  jobTitles: [], salaryFloor: 0, locationPreferences: [],
  domainsOfInterest: [], companiesToExclude: [], targetCompanies: [], roleType: '', workStyle: '',
};

// --- Preferences ---
export async function getPreferences(): Promise<Preferences> {
  const { data } = await supabase.from('preferences').select('*').eq('id', 1).single();
  if (!data) return defaultPreferences;
  return {
    jobTitles: data.job_titles ?? [],
    salaryFloor: data.salary_floor ?? 0,
    locationPreferences: data.location_preferences ?? [],
    domainsOfInterest: data.domains_of_interest ?? [],
    companiesToExclude: data.companies_to_exclude ?? [],
    targetCompanies: data.target_companies ?? [],
    roleType: data.role_type ?? '',
    workStyle: data.work_style ?? '',
  };
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  const { error } = await supabase.from('preferences').upsert({
    id: 1,
    job_titles: prefs.jobTitles,
    salary_floor: prefs.salaryFloor,
    location_preferences: prefs.locationPreferences,
    domains_of_interest: prefs.domainsOfInterest,
    companies_to_exclude: prefs.companiesToExclude,
    target_companies: prefs.targetCompanies,
    role_type: prefs.roleType,
    work_style: prefs.workStyle,
  });
  if (error) throw new Error(`savePreferences failed: ${error.message}`);
}

// --- Resume ---
export async function getMasterResume(): Promise<string> {
  const { data } = await supabase.from('resume').select('content').eq('id', 1).single();
  return data?.content ?? '';
}

export async function saveMasterResume(content: string): Promise<void> {
  await supabase.from('resume').upsert({ id: 1, content });
}

export async function getResumeHasDocx(): Promise<boolean> {
  const { data } = await supabase.from('resume').select('has_docx').eq('id', 1).single();
  return data?.has_docx ?? false;
}

export async function setResumeHasDocx(hasDocx: boolean): Promise<void> {
  await supabase.from('resume').upsert({ id: 1, has_docx: hasDocx });
}

// --- Profile ---
export async function getProfile(): Promise<string> {
  const { data } = await supabase.from('profile').select('content').eq('id', 1).single();
  return data?.content ?? '';
}

export async function saveProfile(content: string): Promise<void> {
  const { error } = await supabase.from('profile').upsert({ id: 1, content });
  if (error) throw new Error(`saveProfile failed: ${error.message}`);
}

// --- Stories ---
export async function getStories(): Promise<Story[]> {
  const { data } = await supabase.from('stories').select('*').order('title');
  if (!data) return [];
  return data.map(r => ({
    id: r.id,
    title: r.title,
    situation: r.situation ?? '',
    task: r.task ?? '',
    action: r.action ?? '',
    result: r.result ?? '',
    competencies: r.competencies ?? [],
    domains: r.domains ?? [],
    metrics: r.metrics ?? '',
  }));
}

export async function addStory(story: Omit<Story, 'id'>): Promise<Story> {
  const { data, error } = await supabase.from('stories').insert({
    title: story.title,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    competencies: story.competencies,
    domains: story.domains,
    metrics: story.metrics,
  }).select().single();
  if (error || !data) throw new Error('Failed to add story');
  return { ...story, id: data.id };
}

export async function updateStory(id: string, updates: Partial<Story>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined)        row.title = updates.title;
  if (updates.situation !== undefined)    row.situation = updates.situation;
  if (updates.task !== undefined)         row.task = updates.task;
  if (updates.action !== undefined)       row.action = updates.action;
  if (updates.result !== undefined)       row.result = updates.result;
  if (updates.competencies !== undefined) row.competencies = updates.competencies;
  if (updates.domains !== undefined)      row.domains = updates.domains;
  if (updates.metrics !== undefined)      row.metrics = updates.metrics;
  await supabase.from('stories').update(row).eq('id', id);
}

export async function deleteStory(id: string): Promise<void> {
  await supabase.from('stories').delete().eq('id', id);
}

// --- Jobs ---
function rowToJob(r: Record<string, unknown>): Job {
  return {
    id: r.id as string,
    company: r.company as string,
    title: r.title as string,
    location: (r.location as string) ?? '',
    salary: (r.salary as number) ?? 0,
    sourceUrl: (r.source_url as string) ?? '',
    content: (r.content as string) ?? '',
    status: (r.status as JobStatus) ?? 'interested',
    notes: (r.notes as string) ?? '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    score: r.score as number | undefined,
    dimensions: r.dimensions as JobDimensions | undefined,
    scoredAt: r.scored_at as string | undefined,
  };
}

export async function getJobs(): Promise<Job[]> {
  const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(r => rowToJob(r as Record<string, unknown>));
}

export async function addJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'notes'>): Promise<Job> {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('jobs').insert({
    id: uuidv4(),
    company: jobData.company,
    title: jobData.title,
    location: jobData.location,
    salary: jobData.salary,
    source_url: jobData.sourceUrl,
    content: jobData.content,
    status: 'interested',
    notes: '',
    created_at: now,
    updated_at: now,
    score: jobData.score,
  }).select().single();
  if (error || !data) throw new Error('Failed to add job');
  return rowToJob(data as Record<string, unknown>);
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.company !== undefined)    row.company = updates.company;
  if (updates.title !== undefined)      row.title = updates.title;
  if (updates.location !== undefined)   row.location = updates.location;
  if (updates.salary !== undefined)     row.salary = updates.salary;
  if (updates.sourceUrl !== undefined)  row.source_url = updates.sourceUrl;
  if (updates.content !== undefined)    row.content = updates.content;
  if (updates.status !== undefined)     row.status = updates.status;
  if (updates.notes !== undefined)      row.notes = updates.notes;
  if (updates.score !== undefined)      row.score = updates.score;
  if (updates.dimensions !== undefined) row.dimensions = updates.dimensions;
  if (updates.scoredAt !== undefined)   row.scored_at = updates.scoredAt;
  await supabase.from('jobs').update(row).eq('id', id);
}

export async function deleteJob(id: string): Promise<void> {
  await supabase.from('jobs').delete().eq('id', id);
}

// --- Scan Cache ---
export async function getScanCache(): Promise<ScanCache | null> {
  const { data } = await supabase.from('scan_cache').select('*').eq('id', 1).single();
  if (!data?.scanned_at) return null;
  return {
    scannedAt: data.scanned_at,
    discoveries: (data.discoveries as ScoredDiscovery[]) ?? [],
    errors: (data.errors as Array<{ company: string; error: string }>) ?? [],
  };
}

export async function saveScanCache(cache: ScanCache): Promise<void> {
  await supabase.from('scan_cache').upsert({
    id: 1,
    scanned_at: cache.scannedAt,
    discoveries: cache.discoveries,
    errors: cache.errors,
  });
}

// --- Dismissed URLs ---
export async function getDismissedUrls(): Promise<Set<string>> {
  const { data } = await supabase.from('dismissed_urls').select('url');
  return new Set((data ?? []).map(r => r.url as string));
}

export async function addDismissedUrl(url: string): Promise<void> {
  await supabase.from('dismissed_urls').upsert({ url });
}

export async function removeDismissedUrl(url: string): Promise<void> {
  await supabase.from('dismissed_urls').delete().eq('url', url);
}

// --- Tailored Resumes ---
export async function getTailoredResumes(): Promise<TailoredResume[]> {
  const { data } = await supabase
    .from('tailored_resumes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (!data) return [];
  return data.map(r => ({
    id: r.id as string,
    name: r.name as string,
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export async function saveTailoredResume(id: string, name: string, content: string): Promise<void> {
  await supabase.from('tailored_resumes').upsert({
    id,
    name,
    content,
    updated_at: new Date().toISOString(),
  });
}
