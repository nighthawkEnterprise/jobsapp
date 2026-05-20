import Anthropic from '@anthropic-ai/sdk';
import type { Job, JobDimensions } from './store';
import { recordUsage } from './usage';

const client = new Anthropic();

const SCORING_PROMPT = (resume: string, profile: string, job: Job) => `\
You are evaluating a job opportunity for a senior Product Manager. Respond ONLY with valid JSON — no prose, no markdown fences.

## Candidate Resume
${resume || '(no resume provided)'}

## North Star Profile & Target Archetypes
${profile || '(no profile provided)'}

## Job
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'not listed'}
Salary: ${job.salary > 0 ? `$${job.salary.toLocaleString()}` : 'not listed'}

## Job Description
${job.content || '(no JD content — title-only entry)'}

## Scoring Instructions
The overall score is a 1–5 global rating. Score each dimension 1–5 (1 = poor, 5 = excellent). Be direct and critical — reserve 5 for genuine standouts.

- **cv_match** (weight 35%): How well do the candidate's skills, experience, and proof points align with JD requirements line by line? Look for explicit matches and gaps.
- **north_star** (weight 30%): How well does this role fit the candidate's target archetypes and career direction as defined in their profile?
- **comp** (weight 20%): Salary vs. market rate for this role/level/location. If salary not listed, score 3 (neutral). 5 = top quartile, 1 = well below market.
- **cultural** (weight 15%): Company culture, growth trajectory, stability, remote policy, and team signals visible in the JD or known about the company.
- **red_flags**: Genuine blockers or warnings (relocation required, seniority mismatch, company instability, etc.). Each flag has a deduction in score points (0.1–1.0).

Compute overall:
  weighted = cv_match×0.35 + north_star×0.30 + comp×0.20 + cultural×0.15
  overall  = round(weighted - sum(all deductions), 1), clamped to 1.0–5.0

Score thresholds for reference:
  4.5+ = strong match (apply immediately)
  4.0–4.4 = good match (worth applying)
  3.5–3.9 = decent but not ideal
  below 3.5 = recommend against applying

Return exactly this JSON shape:
{
  "cv_match":   { "score": <1-5>, "reasoning": "<2-3 sentences>" },
  "north_star": { "score": <1-5>, "reasoning": "<2-3 sentences>" },
  "comp":       { "score": <1-5>, "reasoning": "<1-2 sentences>" },
  "cultural":   { "score": <1-5>, "reasoning": "<1-2 sentences>" },
  "red_flags":  [{ "flag": "<description>", "deduction": <0.1-1.0> }],
  "overall":    <1.0-5.0>,
  "summary":    "<1 punchy sentence on the overall fit>"
}`;

export async function scoreJobWithLLM(
  job: Job,
  resume: string,
  profile: string,
): Promise<JobDimensions> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: SCORING_PROMPT(resume, profile, job) }],
    });
    void recordUsage('score', message.usage.input_tokens, message.usage.output_tokens);
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    return JSON.parse(cleaned) as JobDimensions;
  } catch (err) {
    console.error('[scoring] LLM scoring failed:', err);
    return fallbackDimensions(job);
  }
}

function fallbackDimensions(job: Job): JobDimensions {
  return {
    cv_match:   { score: 3, reasoning: 'LLM scoring unavailable — set ANTHROPIC_API_KEY to enable.' },
    north_star: { score: 3, reasoning: '' },
    comp:       { score: job.salary > 250000 ? 4 : job.salary > 0 ? 2 : 3, reasoning: '' },
    cultural:   { score: 3, reasoning: '' },
    red_flags:  [],
    overall:    3.0,
    summary:    'Score estimated — add ANTHROPIC_API_KEY for full analysis.',
  };
}
