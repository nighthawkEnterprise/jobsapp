import Anthropic from '@anthropic-ai/sdk';
import type { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import type { Job, Story } from './store';

const client = new Anthropic();

export interface TailorResult {
  tailoredResume: string;
  explanation: string;
  storiesUsed: string[];
}

export function buildTailorPrompt(resume: string, profile: string, stories: Story[], job: Job): string {
  const storyBlock = stories.length > 0
    ? stories.map((s, i) => `### Story ${i + 1}: ${s.title}
Competencies: ${s.competencies.join(', ')}
Domains: ${s.domains.join(', ')}
Metrics: ${s.metrics}
S: ${s.situation}
T: ${s.task}
A: ${s.action}
R: ${s.result}`).join('\n\n')
    : '(no stories provided)';

  const jdBlock = job.content && job.content !== job.title
    ? `## Job Description\n${job.content}`
    : '(no job description — title only)';

  return `You are an expert resume writer helping a senior Product Manager tailor their resume for a specific role.

## Master Resume
${resume || '(no resume provided)'}

## North Star Profile
${profile || '(no profile provided)'}

## STAR Stories Available
${storyBlock}

## Target Role
Title: ${job.title}
Company: ${job.company}
${jdBlock}

## Task
Rewrite the master resume to maximize fit for this specific role. Rules:
- Never invent experience, titles, companies, or metrics — only use what is in the master resume and stories
- Reorder and reframe bullets to lead with the most relevant experience for this JD
- Weave in quantified results from the STAR stories where they fit naturally
- Mirror the language and keywords from the JD (ATS optimization)
- Preserve Markdown formatting (headings, bullets, bold)
- Keep it to a natural single-page or two-page length — do not pad

Output ONLY in this exact format, nothing else:

<resume>
[full resume in Markdown, starting with # Name]
</resume>
<explanation>
[2-3 sentences describing the tailoring strategy]
</explanation>
<stories>
- [story title used]
- [another story title]
</stories>`;
}

export function startTailorStream(prompt: string): MessageStream {
  return client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
}

export function parseTailorOutput(full: string): TailorResult {
  const openIdx = full.indexOf('<resume>');
  const afterOpen = openIdx >= 0 ? full.slice(openIdx + '<resume>'.length) : full;
  const closeIdx = afterOpen.indexOf('</resume>');
  const tailoredResume = (closeIdx >= 0 ? afterOpen.slice(0, closeIdx) : afterOpen).trim();

  const explMatch = full.match(/<explanation>([\s\S]*?)<\/explanation>/);
  const explanation = explMatch ? explMatch[1].trim() : '';

  const storiesMatch = full.match(/<stories>([\s\S]*?)<\/stories>/);
  const storiesText = storiesMatch ? storiesMatch[1] : '';
  const storiesUsed = storiesText
    .split('\n')
    .map(l => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  return { tailoredResume, explanation, storiesUsed };
}
