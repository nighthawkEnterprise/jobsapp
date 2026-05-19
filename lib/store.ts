import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Preferences {
  jobTitles: string[];
  salaryFloor: number;
  locationPreferences: string[];
  domainsOfInterest: string[];
  companiesToExclude: string[];
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
  score: number;   // 1–5
  reasoning: string;
}

export interface JobDimensions {
  cv_match:  JobDimension;
  north_star: JobDimension;
  comp:       JobDimension;
  cultural:   JobDimension;
  red_flags:  Array<{ flag: string; deduction: number }>;
  summary:    string;
  overall:    number;  // 1.0–5.0
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

const DATA_DIR = path.join(process.cwd(), 'data');
const PREF_FILE = path.join(DATA_DIR, 'preferences.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const RESUME_FILE = path.join(DATA_DIR, 'resume.md');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const SCAN_CACHE_FILE = path.join(DATA_DIR, 'scan-cache.json');
const PROFILE_FILE = path.join(DATA_DIR, '_profile.md');
const DISMISSED_FILE = path.join(DATA_DIR, 'dismissed.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Preferences ---
export const defaultPreferences: Preferences = {
  jobTitles: [], salaryFloor: 0, locationPreferences: [], 
  domainsOfInterest: [], companiesToExclude: [], roleType: '', workStyle: ''
};

export function getPreferences(): Preferences {
  if (!fs.existsSync(PREF_FILE)) return defaultPreferences;
  return JSON.parse(fs.readFileSync(PREF_FILE, 'utf8'));
}

export function savePreferences(prefs: Preferences) {
  fs.writeFileSync(PREF_FILE, JSON.stringify(prefs, null, 2));
}

// --- Resume ---
export function getMasterResume(): string {
  if (!fs.existsSync(RESUME_FILE)) return '';
  return fs.readFileSync(RESUME_FILE, 'utf8');
}

export function saveMasterResume(content: string) {
  fs.writeFileSync(RESUME_FILE, content);
}

// --- Stories ---
export function getStories(): Story[] {
  if (!fs.existsSync(STORIES_FILE)) return [];
  return JSON.parse(fs.readFileSync(STORIES_FILE, 'utf8'));
}

export function saveStories(stories: Story[]) {
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2));
}

export function addStory(story: Omit<Story, 'id'>): Story {
  const stories = getStories();
  const newStory = { ...story, id: uuidv4() };
  stories.push(newStory);
  saveStories(stories);
  return newStory;
}

export function updateStory(id: string, updates: Partial<Story>) {
  const stories = getStories();
  const index = stories.findIndex(s => s.id === id);
  if (index !== -1) {
    stories[index] = { ...stories[index], ...updates };
    saveStories(stories);
  }
}

export function deleteStory(id: string) {
  const stories = getStories();
  saveStories(stories.filter(s => s.id !== id));
}

// --- Jobs ---
export function getJobs(): Job[] {
  if (!fs.existsSync(JOBS_FILE)) return [];
  return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
}

export function saveJobs(jobs: Job[]) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function addJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'notes'>): Job {
  const jobs = getJobs();
  const now = new Date().toISOString();
  const newJob: Job = {
    ...jobData,
    id: uuidv4(),
    status: 'interested',
    notes: '',
    createdAt: now,
    updatedAt: now
  };
  jobs.push(newJob);
  saveJobs(jobs);
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>) {
  const jobs = getJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates, updatedAt: new Date().toISOString() };
    saveJobs(jobs);
  }
}

// --- Profile ---
export function getProfile(): string {
  if (!fs.existsSync(PROFILE_FILE)) return '';
  return fs.readFileSync(PROFILE_FILE, 'utf8');
}

export function saveProfile(content: string) {
  fs.writeFileSync(PROFILE_FILE, content);
}

// --- Scan Cache ---
export function getScanCache(): ScanCache | null {
  if (!fs.existsSync(SCAN_CACHE_FILE)) return null;
  return JSON.parse(fs.readFileSync(SCAN_CACHE_FILE, 'utf8'));
}

export function saveScanCache(cache: ScanCache) {
  fs.writeFileSync(SCAN_CACHE_FILE, JSON.stringify(cache, null, 2));
}

// --- Dismissed URLs ---
export function getDismissedUrls(): Set<string> {
  if (!fs.existsSync(DISMISSED_FILE)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(DISMISSED_FILE, 'utf8')) as string[]);
}

export function addDismissedUrl(url: string) {
  const urls = getDismissedUrls();
  urls.add(url);
  fs.writeFileSync(DISMISSED_FILE, JSON.stringify([...urls], null, 2));
}

export function removeDismissedUrl(url: string) {
  const urls = getDismissedUrls();
  urls.delete(url);
  fs.writeFileSync(DISMISSED_FILE, JSON.stringify([...urls], null, 2));
}
