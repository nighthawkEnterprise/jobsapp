# Job Pilot — Marketing Website Brief

## What This Is

This document is the complete brief for the Job Pilot marketing website. Use it as the prompt for a designer, a web builder (Framer, Webflow), or a UI generation tool (v0.dev, Vercel v0).

Job Pilot is a personal job search operating system. It scans job boards, scores every role A–F, generates tailored ATS-optimized CVs, tracks your pipeline, and preps you for interviews — all in one structured workflow. It gets smarter the more you use it.

---

## Brand Positioning

**Product name:** Job Pilot  
**Tagline:** "Your job search, systematized."  
**One-liner:** The end-to-end operating system for serious job seekers.

**Positioning:** Job Pilot turns a chaotic, manual process into a structured, data-driven workflow. Evaluate more roles, waste less time on poor fits, and walk into every interview overprepared.

**Audience:** Senior ICs, PMs, and managers actively running parallel job tracks — especially those juggling high application volume, multiple markets, or complex multi-round processes.

**Tone:**  
Confident, precise, slightly elevated. Not motivational-poster energy — more like a Bloomberg terminal crossed with Notion. Speak to professionals who treat their career like the asset it is. No "dream job." No "land your next role." Those are tired.

Copy rules:
- Use active verbs: scan, score, track, generate, detect, prep, draft
- Precision over enthusiasm: "45+ portals" beats "thousands of jobs"
- Avoid hollow adjectives: "powerful," "seamless," "effortless" — show capability, don't describe it
- Speak peer-to-peer: they're evaluating companies as much as companies are evaluating them

---

## Visual Identity

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Hero background | `#0D1117` | Dark sections, hero, CTA footer |
| Section background | `#F8FAFC` | Light feature sections |
| Primary text (dark bg) | `#F1F5F9` | Headlines and body on dark |
| Primary text (light bg) | `#18181B` | Headlines and body on light |
| Accent blue | `#2563EB` | CTAs, links, active states |
| Grade A / success | `#16A34A` | Score badges, positive indicators |
| Grade C / warning | `#D97706` | Mid-range scores, caution states |
| Grade F / danger | `#DC2626` | Poor-fit flags, rejection states |
| Data / metadata | `#94A3B8` | Monospace labels, secondary info |
| Borders | `#E2E8F0` | Card edges, dividers on light sections |

No pastels. No gradients beyond a subtle radial behind the hero headline. No decorative color.

### Typography

- **Display / hero:** Inter or Geist — 56–72px, weight 700, tight tracking (`letter-spacing: -0.02em`)
- **Section headlines:** 36–42px, weight 600
- **Body:** 16–18px, weight 400, line-height 1.65
- **Data / scores / code:** JetBrains Mono or Geist Mono — 12–14px, used for numbers, grade badges, market codes, API names
- **Captions / metadata:** 12px, `#94A3B8`

### Component Language

- Cards: thin border (`1px #E2E8F0`), no drop shadows on light sections; subtle `0 0 0 1px rgba(255,255,255,0.08)` glow on dark
- Score badges: letter grades (A, B, C, D, F) as small colored chips — green, amber, orange, red respectively
- Status chips: `applied`, `interviewing`, `offer`, `rejected` — same palette as the app
- Pipeline cards as product UI mockups inside browser chrome frames
- Monospace font for all numeric readouts (scores, counts, portal numbers)
- Lucide icons sparingly — one per feature panel, 20px, no decorative use
- No illustrations, no 3D, no gradients on feature cards

---

## Page Structure

### Section 1 — Hero

**Layout:** Full-width dark (`#0D1117`). Vertically centered. Content max-width 860px. Horizontally centered.

**Eyebrow label (small, monospace, blue):**
```
Job Pilot — v1.0
```

**Headline (56–72px, white, tight tracking):**
```
Your job search,
systematized.
```

**Subheadline (20px, #94A3B8):**
```
Scan hundreds of roles. Score them A–F. Generate tailored CVs.
Track your pipeline. Prep for every interview. One system.
```

**CTAs (row, centered):**
- Primary: `Get Started →` — blue solid button, 16px, medium weight
- Secondary: `See how it works` — ghost button, scrolls to Section 3

**Hero visual (below CTAs):**  
A stylized browser-chrome frame containing the pipeline view UI. Show 4–5 job cards in a vertical list. Each card displays:
- Company name + role title (16px, medium)
- A grade badge (A, B, C) in the top-right corner
- Salary range and location in metadata style
- A status chip (e.g., `applied`, `interviewing`)
- A last-updated timestamp

Render this in a dark card style (`#161B22` background, thin border) inside a macOS-style browser chrome on a `#0D1117` background. This gives immediate product clarity before any copy is read.

**Background treatment:** Very soft radial gradient at 20% opacity centered behind the headline. Not animated on load. Calm and sharp.

---

### Section 2 — The Problem

**Layout:** Light background (`#F8FAFC`). Two columns on desktop — left: text, right: abstract "before" visual. Single column on mobile.

**Eyebrow:** `The Problem`

**Headline (36px):**
```
Job searching is a full-time job
nobody optimized.
```

**Body (18px, two short paragraphs):**
```
You're juggling 40 browser tabs, a spreadsheet that's already
out of date, and copy-pasted CVs that don't quite fit. You've
applied to roles you later realized were a poor fit. You've
missed follow-ups. You've walked into interviews underprepared.

Job Pilot fixes this — not with motivation, but with structure.
```

**Right visual:**  
A stylized "chaos" representation — a simple text-art grid showing a fragment of a messy spreadsheet: mismatched columns, incomplete rows, duplicate entries, "???" in the status field. Monospace font, `#DC2626` for error-like cells, muted for the rest. Abstract and recognizable, not literal.

---

### Section 3 — How It Works

**Layout:** Light background. A horizontal 3-step flow at the top, then a brief explanation per step below each. Step numbers in monospace.

**Eyebrow:** `The System`

**Headline (36px):**
```
From discovery to offer, one workflow.
```

**3-step flow (connected by arrows):**

```
01. Scan & Score  →  02. Apply & Track  →  03. Prepare & Win
```

Step descriptions (body text, 16px):

**01 — Scan & Score**  
Pull roles from 45+ portals via Greenhouse, Ashby, and Lever — zero LLM cost for discovery. Every role scored A–F across structured criteria. Duplicate detection built in so you never evaluate the same posting twice.

**02 — Apply & Track**  
Generate ATS-optimized CVs tailored to each JD — built from your real experience, not hallucinated. Track every application with canonical status states. Follow-up cadence alerts so nothing goes cold.

**03 — Prepare & Win**  
Deep company research, LinkedIn outreach with drafted messages, and STAR+R story surfacing ranked by role relevance. Walk into every interview with more preparation than anyone else in the room.

---

### Section 4 — Features Grid

**Layout:** Light background. 2×3 card grid on desktop, 1-column on mobile. Each card: Lucide icon (top-left), bold headline, 2-sentence description. Thin border, no shadow.

**Eyebrow:** `Capabilities`

**Headline (36px):**
```
Everything a serious job search demands.
```

**Feature cards:**

**1. Volume Without Burnout**  
Batch-scan multiple job URLs in parallel. Deduplication means you never evaluate the same role twice, no matter how many portals you cover.

**2. Intelligent Scoring**  
Every role graded A–F before you read a word. Structured evaluation across compensation, fit, role quality, and posting legitimacy — your attention goes where it counts.

**3. Tailored CVs, Instantly**  
ATS-optimized CVs built from your actual proof points — not fabricated. Output as HTML, PDF via Playwright, or LaTeX/Overleaf-ready, depending on what the application requires.

**4. Pipeline That Tracks Itself**  
Canonical status states from `interested` through `offer` and `rejected`. Rejection pattern detection helps you adjust targeting over time, not just log outcomes.

**5. Research & Outreach Built In**  
Deep company research before you apply or interview. LinkedIn contact discovery with drafted outreach messages. STAR+R stories surfaced by competency match — not generic prep.

**6. Multi-Market, Natively**  
English, German (DACH), French, and Japanese modes — with market-specific vocabulary for comp structures, labor law, and contract types. One system, every market.

---

### Section 5 — Learning Loop

**Layout:** Full-width dark background (`#0D1117`). Centered text, max-width 680px. A simple data-flow diagram below the headline.

**Eyebrow (monospace, blue):** `The Compounding Advantage`

**Headline (42px, white):**
```
It gets smarter as you use it.
```

**Body (18px, #94A3B8):**
```
Every evaluation updates your profile. Your archetypes sharpen.
Your proof points refine. Scoring improves to reflect what actually
fits you — not just what looked good on paper. Job Pilot isn't
just a tool. It's a system that compounds.
```

**Diagram (monospace, text-based or SVG):**
```
Your profile  →  Evaluate a role  →  Score + feedback  →  Sharper profile
      ↑____________________________________________________|
```

Style: thin white lines, monospace labels in `#94A3B8`, accent blue for arrow heads. No illustration. Clean and technical.

---

### Section 6 — Metrics Bar

**Layout:** Light background. Single row of 4 stat callouts, evenly spaced. Centered. Full-width with subtle top and bottom border.

**Stats:**

| Stat | Label |
|------|-------|
| `45+` | Job portals scanned |
| `A–F` | Structured scoring rubric |
| `4` | Markets supported (EN, DE, FR, JP) |
| `0` | LLM tokens for job discovery |

Each stat: large monospace number (`48px`, `#18181B`), small label below (`12px`, `#71717A`).

---

### Section 7 — CTA Footer

**Layout:** Full-width dark (`#0D1117`). Vertically centered. Content max-width 600px.

**Headline (42px, white):**
```
Stop managing your job search.
Start running it.
```

**CTA:** `Get Started →` — primary blue button, 16px, centered

**Sub-copy (14px, #94A3B8):**
```
Built for senior candidates who treat their career like a craft.
```

---

## Responsive Behavior

| Breakpoint | Changes |
|-----------|---------|
| Desktop 1280px+ | Full layouts as described |
| Tablet 768–1280px | 2-col feature grid → 1-col; hero stays centered |
| Mobile <768px | Full stack; hero headline scales to 36px; browser chrome mockup hidden or simplified |

---

## Motion & Animation

- Scroll-triggered fade-up reveals on each section (Framer Motion `whileInView`, `once: true`)
- No animations on initial load — hero is immediate and static
- No continuous loops, parallax, or particle effects
- Hover states on feature cards: border color shifts to `#2563EB`, 150ms ease
- CTA button: subtle scale on hover (`scale: 1.02`), 100ms

---

## Tech Stack (Recommended)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Fonts | `next/font` — Geist + Geist Mono |
| Animation | Framer Motion (scroll reveals only) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## What Not to Build

- No hero video or auto-playing media
- No chatbot or live support widget
- No pricing page until the product is public
- No blog, no changelog, no docs — those come after v1 launch
- No social proof section with testimonials until real users exist (use the metrics bar as a stand-in)
- No modal popups or cookie banners in the first pass
