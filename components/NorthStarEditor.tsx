'use client';

import { useState, KeyboardEvent } from 'react';
import { Plus, Trash2, Star, X, ChevronDown, ChevronUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Archetype {
  id: string;
  name: string;
  stars: number;
  companies: string[];
  fitCriteria: string[];
  whatIBring: string;
}

interface ProfileData {
  whoIAm: string;
  archetypes: Archetype[];
  antiTargets: string[];
  compBase: string;
  compTotal: string;
}

// ── Parse markdown → structured ────────────────────────────────────────────

function parseProfile(md: string): ProfileData {
  if (!md.trim()) return emptyProfile();

  const data = emptyProfile();

  const whoMatch = md.match(/## Who I Am\s*([\s\S]*?)(?=\n##|$)/);
  if (whoMatch) data.whoIAm = whoMatch[1].trim();

  const archetypeSection = md.match(/## Target Archetypes\s*([\s\S]*?)(?=\n## |$)/);
  if (archetypeSection) {
    const blocks = [...archetypeSection[1].matchAll(/### Archetype \d+\s*[—–-]\s*([\s\S]*?)(?=\n### Archetype|\n---\s*\n### Archetype|$)/g)];
    for (const block of blocks) {
      const raw = block[1];
      const headerLine = raw.split('\n')[0];
      const starsCount = (headerLine.match(/⭐/g) || []).length;
      const name = headerLine.replace(/⭐+/g, '').trim();

      const companiesMatch = raw.match(/\*\*Companies:\*\*\s*([^\n]+)/);
      const companies = companiesMatch
        ? companiesMatch[1].split(',').map(c => c.trim()).filter(Boolean)
        : [];

      const fitSection = raw.match(/\*\*What makes a role a perfect fit:\*\*\s*([\s\S]*?)(?=\*\*What I bring|$)/);
      const fitCriteria: string[] = [];
      if (fitSection) {
        for (const m of fitSection[1].matchAll(/^[-*]\s+(.+)$/gm)) {
          fitCriteria.push(m[1].trim());
        }
      }

      const bringMatch = raw.match(/\*\*What I bring:\*\*([\s\S]*?)(?=\n---|$)/);
      const whatIBring = bringMatch ? bringMatch[1].trim() : '';

      data.archetypes.push({ id: crypto.randomUUID(), name, stars: starsCount || 3, companies, fitCriteria, whatIBring });
    }
  }

  const antiMatch = md.match(/## Anti-targets[^\n]*\n([\s\S]*?)(?=\n##|$)/);
  if (antiMatch) {
    for (const m of antiMatch[1].matchAll(/^[-*]\s+(.+)$/gm)) {
      data.antiTargets.push(m[1].trim());
    }
  }

  const baseMatch = md.match(/[-*]\s+Base:\s*(.+)/);
  if (baseMatch) data.compBase = baseMatch[1].trim();

  const totalMatch = md.match(/[-*]\s+Total comp:\s*(.+)/);
  if (totalMatch) data.compTotal = totalMatch[1].trim();

  return data;
}

function emptyProfile(): ProfileData {
  return { whoIAm: '', archetypes: [], antiTargets: [], compBase: '', compTotal: '' };
}

// ── Serialize structured → markdown ───────────────────────────────────────

function serializeProfile(d: ProfileData): string {
  const lines: string[] = ['# Career Profile — North Star Archetypes', ''];

  lines.push('## Who I Am', '', d.whoIAm.trim(), '');
  lines.push('## Target Archetypes', '');

  d.archetypes.forEach((a, i) => {
    lines.push(`### Archetype ${i + 1} — ${a.name} ${'⭐'.repeat(a.stars)}`);
    lines.push(`**Companies:** ${a.companies.join(', ')}`, '');
    lines.push('**What makes a role a perfect fit:**');
    a.fitCriteria.filter(Boolean).forEach(c => lines.push(`- ${c}`));
    lines.push('');
    lines.push(`**What I bring:** ${a.whatIBring.trim()}`);
    lines.push('', '---', '');
  });

  lines.push('## Anti-targets (roles that would be a step down or misalignment)');
  d.antiTargets.filter(Boolean).forEach(t => lines.push(`- ${t}`));
  lines.push('');

  lines.push('## Compensation Targets');
  if (d.compBase) lines.push(`- Base: ${d.compBase}`);
  if (d.compTotal) lines.push(`- Total comp: ${d.compTotal}`);
  lines.push('');

  return lines.join('\n');
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star className={`w-4 h-4 transition-colors ${n <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  function commit() {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Backspace' && !input && tags.length > 0) onChange(tags.slice(0, -1));
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white cursor-text">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap">
          {t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={tags.length === 0 ? (placeholder ?? 'Type and press Enter') : ''}
        className="flex-grow min-w-[140px] text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
}

function BulletListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-300 text-base select-none">•</span>
          <input
            value={item}
            onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            className="flex-grow border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={placeholder}
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors flex-none">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add item
      </button>
    </div>
  );
}

function ArchetypeCard({
  archetype, index, total, onChange, onMoveUp, onMoveDown, onDelete,
}: {
  archetype: Archetype;
  index: number;
  total: number;
  onChange: (patch: Partial<Archetype>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0 flex-none">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors p-0.5">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors p-0.5">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Index badge */}
        <span className="flex-none w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-[11px] font-bold text-gray-400 rounded-md">
          {index + 1}
        </span>

        {/* Name input */}
        <input
          value={archetype.name}
          onChange={e => onChange({ name: e.target.value })}
          className="flex-grow font-semibold text-gray-900 bg-transparent outline-none text-sm placeholder:font-normal placeholder:text-gray-400"
          placeholder="Archetype name…"
        />

        {/* Stars */}
        <StarRating value={archetype.stars} onChange={stars => onChange({ stars })} />

        {/* Expand / delete */}
        <button type="button" onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 flex-none">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-none">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-5 space-y-5 bg-white">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Target Companies</label>
            <TagInput
              tags={archetype.companies}
              onChange={companies => onChange({ companies })}
              placeholder="Company name, press Enter to add"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">What makes a role a perfect fit</label>
            <BulletListEditor
              items={archetype.fitCriteria}
              onChange={fitCriteria => onChange({ fitCriteria })}
              placeholder="e.g. Developer-facing SDK design…"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">What I bring</label>
            <textarea
              value={archetype.whatIBring}
              onChange={e => onChange({ whatIBring: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Your relevant experience and proof points…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function NorthStarEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [data, setData] = useState<ProfileData>(() => parseProfile(value));

  function update(newData: ProfileData) {
    setData(newData);
    onChange(serializeProfile(newData));
  }

  function updateArchetype(id: string, patch: Partial<Archetype>) {
    update({ ...data, archetypes: data.archetypes.map(a => a.id === id ? { ...a, ...patch } : a) });
  }

  function addArchetype() {
    update({
      ...data,
      archetypes: [...data.archetypes, {
        id: crypto.randomUUID(),
        name: '',
        stars: 3,
        companies: [],
        fitCriteria: [''],
        whatIBring: '',
      }],
    });
  }

  function removeArchetype(id: string) {
    update({ ...data, archetypes: data.archetypes.filter(a => a.id !== id) });
  }

  function moveArchetype(id: string, dir: -1 | 1) {
    const arr = [...data.archetypes];
    const idx = arr.findIndex(a => a.id === id);
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    update({ ...data, archetypes: arr });
  }

  return (
    <div className="space-y-8">

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Who I Am</label>
        <p className="text-xs text-gray-400 mb-2">One paragraph — used as context by the LLM when scoring North Star alignment.</p>
        <textarea
          value={data.whoIAm}
          onChange={e => update({ ...data, whoIAm: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          placeholder="Senior PM at … 8+ years in … targeting a staff/principal role at …"
        />
      </div>

      {/* Archetypes */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-gray-700">Target Archetypes</div>
            <div className="text-xs text-gray-400 mt-0.5">Ordered by priority. Stars weight how strongly the LLM scores north-star alignment.</div>
          </div>
          <button
            type="button"
            onClick={addArchetype}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Archetype
          </button>
        </div>

        <div className="space-y-3">
          {data.archetypes.map((a, i) => (
            <ArchetypeCard
              key={a.id}
              archetype={a}
              index={i}
              total={data.archetypes.length}
              onChange={patch => updateArchetype(a.id, patch)}
              onMoveUp={() => moveArchetype(a.id, -1)}
              onMoveDown={() => moveArchetype(a.id, 1)}
              onDelete={() => removeArchetype(a.id)}
            />
          ))}
          {data.archetypes.length === 0 && (
            <div className="p-10 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400">
              No archetypes yet — click <strong>Add Archetype</strong> to define your first target role type.
            </div>
          )}
        </div>
      </div>

      {/* Anti-targets */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-1">Anti-targets</div>
        <p className="text-xs text-gray-400 mb-3">Roles or situations that would be a step down or misalignment.</p>
        <BulletListEditor
          items={data.antiTargets}
          onChange={antiTargets => update({ ...data, antiTargets })}
          placeholder="e.g. Pure consumer/growth PM with no identity or AI angle"
        />
      </div>

      {/* Comp */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-3">Compensation Targets</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Minimum Base</label>
            <input
              value={data.compBase}
              onChange={e => update({ ...data, compBase: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="$250,000+"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Target Total Comp</label>
            <input
              value={data.compTotal}
              onChange={e => update({ ...data, compTotal: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="$280,000–$500,000 for Tier 1; $400,000+ for FAANG"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
