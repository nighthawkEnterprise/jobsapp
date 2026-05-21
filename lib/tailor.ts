import Anthropic from '@anthropic-ai/sdk';
import type { Job, Story } from './store';
import { recordUsage } from './usage';

const client = new Anthropic();

export interface TailorResult {
  tailoredResume: string;
  explanation: string;
  storiesUsed: string[];
}

function buildPrompt(resume: string, profile: string, stories: Story[], job: Job): string {
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

Respond with ONLY valid JSON. The tailoredResume value must be a JSON string (escape newlines as \\n):
{
  "tailoredResume": "<full resume in Markdown with \\n for newlines>",
  "explanation": "<2-3 sentences describing the tailoring strategy>",
  "storiesUsed": ["<story title>"]
}`;
}

export async function tailorResumeWithLLM(
  job: Job,
  resume: string,
  profile: string,
  stories: Story[],
  userId: string,
): Promise<TailorResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(resume, profile, stories, job) }],
  });

  void recordUsage(userId, 'tailor', message.usage.input_tokens, message.usage.output_tokens);
  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  // Strip markdown fences Claude sometimes adds despite instructions
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  const parsed = JSON.parse(cleaned) as TailorResult;
  return {
    tailoredResume: parsed.tailoredResume ?? '',
    explanation: parsed.explanation ?? '',
    storiesUsed: Array.isArray(parsed.storiesUsed) ? parsed.storiesUsed : [],
  };
}
