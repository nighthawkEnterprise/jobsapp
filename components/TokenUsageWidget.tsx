'use client';

import { useState, useRef, useEffect } from 'react';
import { Zap, X, RefreshCw } from 'lucide-react';
import type { UsageStats } from '@/lib/usage';

// Pricing per 1M tokens (USD) — as of 2025
const RATES = {
  sonnet: { input: 3.0,  output: 15.0 },
  haiku:  { input: 0.80, output: 4.0  },
};

function cost(input: number, output: number, model: 'sonnet' | 'haiku'): number {
  return (input * RATES[model].input + output * RATES[model].output) / 1_000_000;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtCost(usd: number): string {
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}

function Row({ label, calls, input, output, model }: {
  label: string; calls: number; input: number; output: number; model: 'sonnet' | 'haiku';
}) {
  const usd = cost(input, output, model);
  return (
    <tr className="border-t border-gray-100">
      <td className="py-1.5 pr-3 text-gray-600">{label}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500">{calls}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500">{fmt(input)}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500">{fmt(output)}</td>
      <td className="py-1.5 text-right tabular-nums text-gray-700 font-medium">{fmtCost(usd)}</td>
    </tr>
  );
}

export function TokenUsageWidget() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/token-usage');
      setStats(await res.json() as UsageStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const totalCost = stats
    ? cost(stats.tailorInput, stats.tailorOutput, 'sonnet')
    + cost(stats.scoreInput + stats.otherInput, stats.scoreOutput + stats.otherOutput, 'haiku')
    : 0;

  const totalCalls = stats ? stats.tailorCalls + stats.scoreCalls + stats.otherCalls : 0;
  const totalIn    = stats ? stats.tailorInput  + stats.scoreInput  + stats.otherInput  : 0;
  const totalOut   = stats ? stats.tailorOutput + stats.scoreOutput + stats.otherOutput : 0;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3" ref={panelRef}>
      {open && (
        <div className="w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-sm font-semibold text-white">Token Usage</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {loading && !stats ? (
              <div className="py-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : stats ? (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Total cost', value: fmtCost(totalCost), accent: true },
                    { label: 'API calls',  value: String(totalCalls) },
                    { label: 'Tokens in/out', value: `${fmt(totalIn)} / ${fmt(totalOut)}` },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                      <p className={`text-base font-bold ${accent ? 'text-blue-600' : 'text-gray-800'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Breakdown table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Operation</th>
                      <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Calls</th>
                      <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">In</th>
                      <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Out</th>
                      <th className="text-right pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Row label="Tailor resume" calls={stats.tailorCalls} input={stats.tailorInput} output={stats.tailorOutput} model="sonnet" />
                    <Row label="Score job"     calls={stats.scoreCalls}  input={stats.scoreInput}  output={stats.scoreOutput}  model="haiku"  />
                    <Row label="Onboarding"    calls={stats.otherCalls}  input={stats.otherInput}  output={stats.otherOutput}  model="haiku"  />
                  </tbody>
                </table>

                {/* Model legend */}
                <div className="mt-3 flex gap-4 text-[10px] text-gray-400">
                  <span>Sonnet 4.6 — $3/$15 per MTok</span>
                  <span>Haiku 4.5 — $0.80/$4 per MTok</span>
                </div>

                {stats.updatedAt && (
                  <p className="mt-2 text-[10px] text-gray-300">
                    Last call: {new Date(stats.updatedAt).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">
                No usage data yet — run the app to start tracking.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full bg-gray-900 text-white shadow-lg hover:bg-black transition-all flex items-center justify-center"
        title="Token usage"
      >
        {open ? <X className="w-4 h-4" /> : <Zap className="w-4 h-4 text-yellow-400" />}
      </button>
    </div>
  );
}
