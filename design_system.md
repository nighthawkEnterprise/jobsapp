# Job Pilot — Design System

**Status:** v0.1 — prototype
**Last updated:** May 16, 2026

---

## Purpose

This document defines the visual and interaction design language for the Job Pilot prototype. It's intentionally minimal — the prototype is a personal tool, not a consumer product. The goal is consistency and clarity, not visual polish or brand differentiation.

If a design decision isn't covered here, choose the option that's simplest and most consistent with the existing patterns.

---

## Design Principles

1. **Function over polish.** This is a tool I use, not a product I sell. Optimize for clarity and speed of use.
2. **Density is fine.** I'm a power user. Show information densely rather than padding it out.
3. **No decoration.** No gradients, shadows beyond minimal, illustrations, or animations. If it doesn't serve a function, cut it.
4. **Consistency over creativity.** Repeated patterns reduce cognitive load. Use the same component for the same job everywhere.

---

## Color Palette

Minimal palette. Three neutral shades and two functional colors.

| Token | Hex | Usage |
|---|---|---|
| `neutral-50` | `#FAFAFA` | Page background |
| `neutral-100` | `#F4F4F5` | Card background, hover states |
| `neutral-200` | `#E4E4E7` | Borders, dividers |
| `neutral-500` | `#71717A` | Secondary text, labels |
| `neutral-900` | `#18181B` | Primary text, headings |
| `accent-600` | `#2563EB` | Primary actions, links, active states |
| `success-600` | `#16A34A` | Positive status (offer, advancing) |
| `warning-600` | `#D97706` | Attention status (stuck, waiting) |
| `danger-600` | `#DC2626` | Negative status (rejected, withdrawn) |

Use Tailwind's default neutral/blue/green/amber/red scales — these tokens map cleanly to `neutral-*`, `blue-600`, `green-600`, `amber-600`, `red-600` in Tailwind.

No dark mode in v1.

---

## Typography

Single font family throughout: system font stack.

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

(Tailwind's default `font-sans` is fine.)

### Type Scale

| Use | Class | Size / Weight |
|---|---|---|
| Page title | `text-2xl font-semibold` | 24px / 600 |
| Section heading | `text-lg font-semibold` | 18px / 600 |
| Card title | `text-base font-medium` | 16px / 500 |
| Body | `text-sm` | 14px / 400 |
| Label / metadata | `text-xs text-neutral-500` | 12px / 400 |
| Code / data | `font-mono text-xs` | 12px / 400 |

No more than four levels of hierarchy on a single screen. If you need more, redesign the page.

---

## Spacing

Use Tailwind's default spacing scale. Standardize on these for consistency:

| Use | Class |
|---|---|
| Tight (inside a card) | `p-4` |
| Standard (between cards) | `gap-4` or `space-y-4` |
| Section breaks | `space-y-8` |
| Page padding | `p-6` or `p-8` |

Avoid arbitrary values (`p-[13px]`) unless absolutely necessary.

---

## Layout

### Page Structure

```
┌───────────────────────────────────┐
│ Sidebar  │  Main content area     │
│ (nav)    │  (full width)          │
│          │                        │
│ - Pipeline                        │
│ - Story Bank                      │
│ - Resume                          │
│ - Preferences                     │
│ - Settings                        │
└───────────────────────────────────┘
```

- Sidebar: fixed `w-56`, neutral-50 background, persistent on all pages
- Main content: max-width `max-w-5xl`, centered with `mx-auto`, padding `p-8`
- No header bar in v1 (sidebar serves navigation)

### Page Patterns

Most pages follow this structure:

```
Page Title (text-2xl)
Optional one-line description (text-sm text-neutral-500)
─────────────────────────────────────
Primary action button (top-right of title row)
─────────────────────────────────────
Content area (list, form, or detail view)
```

---

## Components

### Buttons

Three variants only:

**Primary** — main action on a page
```
bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium
hover:bg-blue-700
```

**Secondary** — supporting actions
```
bg-white text-neutral-900 border border-neutral-200 px-4 py-2 rounded-md text-sm font-medium
hover:bg-neutral-50
```

**Ghost** — destructive or inline actions
```
text-neutral-600 px-3 py-2 rounded-md text-sm font-medium
hover:bg-neutral-100 hover:text-neutral-900
```

For destructive actions, use ghost with `text-red-600 hover:bg-red-50`.

### Cards

```
bg-white border border-neutral-200 rounded-lg p-4
```

For interactive cards (clickable):
```
+ hover:border-neutral-300 cursor-pointer transition-colors
```

No drop shadows. Borders only.

### Form Inputs

**Text input / textarea:**
```
w-full px-3 py-2 border border-neutral-200 rounded-md text-sm
focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600
```

**Select:**
Same as text input. Use native `<select>` — no custom dropdown components.

**Label:**
```
block text-sm font-medium text-neutral-900 mb-1
```

**Help text:**
```
mt-1 text-xs text-neutral-500
```

### Status Badges

For application status:

```
inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
```

Color mapping:
- `interested` — `bg-neutral-100 text-neutral-700`
- `applied` — `bg-blue-50 text-blue-700`
- `screened` — `bg-blue-50 text-blue-700`
- `interviewing` — `bg-amber-50 text-amber-700`
- `offer` — `bg-green-50 text-green-700`
- `rejected` — `bg-red-50 text-red-700`
- `withdrawn` — `bg-neutral-100 text-neutral-500`

### Score Display

Fit scores (0-100):
```
text-2xl font-semibold
```

Color by range:
- 80-100: `text-green-600`
- 60-79: `text-amber-600`
- 0-59: `text-neutral-500`

Show as plain number, no progress bars or rings in v1.

### Tags / Chips

For competencies and domains on stories:
```
inline-flex items-center px-2 py-0.5 rounded-full text-xs
bg-neutral-100 text-neutral-700
```

Multiple tags: `gap-1 flex-wrap`.

### Lists

Pipeline list (jobs):
- Vertical stack of cards, `space-y-3`
- Each card shows: company + title, score, status badge, last-updated, action buttons

Story bank list:
- Vertical stack of cards, `space-y-3`
- Each card shows: title, competency tags, truncated situation, edit/delete buttons

### Empty States

```
text-center py-12 text-sm text-neutral-500
```

One sentence describing the empty state. One primary action button below.

Example: "No jobs in your pipeline yet. [+ Add a job]"

### Loading States

For async operations (LLM calls):

```
inline-flex items-center gap-2 text-sm text-neutral-500
```

With a simple animated dot or text indicator. No spinner libraries.

For long operations (resume tailoring), show a clear progress indicator with text: "Tailoring resume... this takes about 10 seconds."

### Toasts / Notifications

Skip for v1. Use inline messages instead:
- Success: small green text below the action
- Error: small red text below the form

---

## Markdown Rendering

For displaying tailored resumes, JDs, and other markdown content:

- Use a basic markdown renderer (e.g., `react-markdown`)
- Apply `prose prose-sm` Tailwind classes for typography
- No custom styling beyond that

---

## Page Specifications

### Pipeline Page (default landing)

```
Pipeline
Your tracked jobs, ranked by fit
─────────────────────────────────────
[+ Add Job]  (primary button, top-right)

Jobs displayed as cards:
  [Score] | Company - Title    [Status badge]
          | Location, Salary   Last updated: Xd ago
          | [View →] [Tailor →] [Prep →]
```

### Story Bank Page

```
Story Bank
N stories
─────────────────────────────────────
[+ Add Story]

Stories displayed as cards:
  Title                          [Edit] [Delete]
  Tags: [competency] [domain]
  Situation: truncated to ~120 chars...
```

### Job Detail Page

```
Company - Title              [Status dropdown]
Location · Salary · Source URL
─────────────────────────────────────
[Tailor Resume] [Prep for Interview]  (primary actions)

Full JD content (markdown-rendered)
─────────────────────────────────────
Notes (textarea)
─────────────────────────────────────
Application history (if status > applied)
```

### Story Edit Page

```
[← Back to Stories]

Title (text input)
─────────────────────────────────────
Situation (textarea)
Task (textarea)
Action (textarea)
Result (textarea)
─────────────────────────────────────
Competencies (multi-select tag picker)
Domains (multi-select tag picker)
Metrics (text input)
─────────────────────────────────────
[Save] [Delete]
```

### Settings Pages (Preferences, Resume)

Simple forms with labels, inputs, save button.

---

## Iconography

Use Lucide icons (`lucide-react`) sparingly. Only for:
- Navigation items in sidebar (one icon per nav link)
- Inline action buttons (edit, delete, external link)
- Status indicators where text alone isn't enough

Size: 16px (`h-4 w-4`) for inline, 20px (`h-5 w-5`) for sidebar.

No decorative icons.

---

## Responsive Behavior

Desktop-first. Designed for laptop/desktop screens (1280px+).

For narrower screens:
- Sidebar collapses to top nav
- Cards become full-width
- No special mobile UI in v1

Don't spend time on mobile in the prototype.

---

## Accessibility Minimums

Even for a personal tool, do these:
- Use semantic HTML (`<button>` not `<div onClick>`)
- Labels associated with inputs (`<label htmlFor>`)
- Sufficient color contrast (the palette above meets WCAG AA)
- Focus rings on all interactive elements

Skip everything else (screen reader optimization, ARIA beyond defaults, etc.) until v2.

---

## What Not To Do

- No dark mode
- No custom fonts
- No animations beyond CSS transitions on hover
- No modals (use full pages instead)
- No drag-and-drop interactions
- No custom dropdowns (use native `<select>`)
- No skeletons or shimmer loaders
- No gradients, decorative shadows, or illustrations
- No emoji as functional UI
- No design tokens beyond what's defined here

---

## Quick Reference

Most common Tailwind class combinations:

| Pattern | Classes |
|---|---|
| Page container | `max-w-5xl mx-auto p-8` |
| Card | `bg-white border border-neutral-200 rounded-lg p-4` |
| Primary button | `bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700` |
| Secondary button | `bg-white text-neutral-900 border border-neutral-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-50` |
| Input | `w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600` |
| Label | `block text-sm font-medium text-neutral-900 mb-1` |
| Section heading | `text-lg font-semibold text-neutral-900` |
| Metadata | `text-xs text-neutral-500` |

---

## Out of Scope

These will be addressed in later versions:

- Dark mode
- Mobile-optimized layouts
- Brand identity (logo, name treatment)
- Marketing surfaces
- Onboarding flows beyond basic forms
- Detailed micro-interactions
- Sound or haptic feedback