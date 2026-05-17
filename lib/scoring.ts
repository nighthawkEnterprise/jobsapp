import { Job, Preferences } from './store';

export function scoreJob(job: Job, preferences: Preferences): { score: number; reasoning: string[] } {
  let score = 0;
  const reasoning: string[] = [];

  // Title Match (+30)
  const titleMatch = preferences.jobTitles.some(prefTitle => 
    job.title.toLowerCase().includes(prefTitle.toLowerCase())
  );
  if (titleMatch) {
    score += 30;
    reasoning.push("Title matches preferred roles");
  }

  // Salary Match (+20)
  if (preferences.salaryFloor > 0 && job.salary >= preferences.salaryFloor) {
    score += 20;
    reasoning.push("Salary meets or exceeds floor");
  } else if (preferences.salaryFloor > 0 && job.salary > 0) {
     reasoning.push("Salary below floor");
  }

  // Location Match (+20)
  const locationMatch = preferences.locationPreferences.some(prefLoc => 
    job.location.toLowerCase().includes(prefLoc.toLowerCase()) || 
    (prefLoc.toLowerCase() === 'remote' && job.location.toLowerCase().includes('remote'))
  );
  if (locationMatch) {
    score += 20;
    reasoning.push("Location matches preferences");
  }

  // Domain Match (+30)
  const matchedDomains = preferences.domainsOfInterest.filter(domain => 
    job.content.toLowerCase().includes(domain.toLowerCase()) ||
    job.title.toLowerCase().includes(domain.toLowerCase())
  );
  if (matchedDomains.length > 0) {
    score += 30;
    reasoning.push(`Keywords found: ${matchedDomains.join(", ")}`);
  }

  return {
    score: Math.min(score, 100),
    reasoning
  };
}
