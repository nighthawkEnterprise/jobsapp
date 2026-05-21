import { supabase } from './supabase';

export type UsageOp = 'tailor' | 'score' | 'other';

export interface UsageStats {
  tailorInput: number;
  tailorOutput: number;
  tailorCalls: number;
  scoreInput: number;
  scoreOutput: number;
  scoreCalls: number;
  otherInput: number;
  otherOutput: number;
  otherCalls: number;
  updatedAt: string | null;
}

export async function recordUsage(userId: string, op: UsageOp, inputTokens: number, outputTokens: number): Promise<void> {
  try {
    const { data } = await supabase.from('token_usage').select('*').eq('user_id', userId).single();
    const r = data ?? {};
    await supabase.from('token_usage').upsert({
      user_id: userId,
      tailor_input:  (r.tailor_input  ?? 0) + (op === 'tailor' ? inputTokens  : 0),
      tailor_output: (r.tailor_output ?? 0) + (op === 'tailor' ? outputTokens : 0),
      tailor_calls:  (r.tailor_calls  ?? 0) + (op === 'tailor' ? 1 : 0),
      score_input:   (r.score_input   ?? 0) + (op === 'score'  ? inputTokens  : 0),
      score_output:  (r.score_output  ?? 0) + (op === 'score'  ? outputTokens : 0),
      score_calls:   (r.score_calls   ?? 0) + (op === 'score'  ? 1 : 0),
      other_input:   (r.other_input   ?? 0) + (op === 'other'  ? inputTokens  : 0),
      other_output:  (r.other_output  ?? 0) + (op === 'other'  ? outputTokens : 0),
      other_calls:   (r.other_calls   ?? 0) + (op === 'other'  ? 1 : 0),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch {
    // Non-critical — never let usage tracking break the main flow
  }
}

export async function getUsage(userId: string): Promise<UsageStats> {
  try {
    const { data } = await supabase.from('token_usage').select('*').eq('user_id', userId).single();
    if (!data) return empty();
    return {
      tailorInput:  data.tailor_input  ?? 0,
      tailorOutput: data.tailor_output ?? 0,
      tailorCalls:  data.tailor_calls  ?? 0,
      scoreInput:   data.score_input   ?? 0,
      scoreOutput:  data.score_output  ?? 0,
      scoreCalls:   data.score_calls   ?? 0,
      otherInput:   data.other_input   ?? 0,
      otherOutput:  data.other_output  ?? 0,
      otherCalls:   data.other_calls   ?? 0,
      updatedAt:    data.updated_at    ?? null,
    };
  } catch {
    return empty();
  }
}

function empty(): UsageStats {
  return {
    tailorInput: 0, tailorOutput: 0, tailorCalls: 0,
    scoreInput: 0,  scoreOutput: 0,  scoreCalls: 0,
    otherInput: 0,  otherOutput: 0,  otherCalls: 0,
    updatedAt: null,
  };
}
