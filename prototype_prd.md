# Job Pilot — Product Requirements Document

**Status:** Draft v0.4 — prototype scope (all seven journeys)
**Owner:** Nithin
**Last updated:** May 16, 2026

---

## Purpose

A personal tool that helps me manage parallel job tracks end-to-end: from discovering roles, through tailoring application materials, through tracking applications, through interview preparation. Built on a foundation of my own resume and a structured library of stories.

---

## Goals

1. Build a working prototype that exercises all seven user journeys end-to-end
2. Produce tailored application materials I'd actually use for my own job applications
3. Build the muscle of AI-assisted architecture iteration

## Non-goals

- Multi-user support
- Authentication
- Production-quality UI polish
- Real-time job board scraping at scale (use cheap/manual approaches first)
- Persistent storage beyond local files

---

## Target User

Me. A senior PM evaluating multiple roles in parallel (Meta team matching, Microsoft TPM, LangSmith PM, with Okta as floor).

---

## User Journeys

All seven journeys are in scope for the prototype. Each is described with its flow and prototype-level implementation.

### Journey 1: First-Time Setup

**Goal:** Configure the system for use.

**Flow:**
1. User opens the tool for the first time
2. Enters preferences (job titles, salary floor, location, role type, domains of interest, companies to exclude)
3. Uploads or pastes master resume
4. Adds initial stories to the story bank
5. System shows empty pipeline ready for jobs

**Prototype implementation:** Simple settings page with form inputs for preferences. Textarea/file upload for resume. Form to add initial stories. Persists to local JSON files.

---

### Journey 2: Job Discovery

**Goal:** Surface relevant jobs from external sources.

**Flow:**
1. User views pipeline
2. System shows jobs matching preferences
3. Jobs are scored against preferences with reasoning
4. User dismisses irrelevant ones, marks interesting ones for follow-up

**Prototype implementation:** Two-mode approach:
- Manual mode: User pastes JD URL or text, system parses it into a job entry
- Automated mode (lightweight): A single search endpoint that hits one job board (start with a simple search API or RSS feed — avoid LinkedIn scraping for v1). If automated is too hard, ship with manual-only and add automation later.

---

### Journey 3: Targeted Tailoring

**Goal:** Produce a tailored resume for a specific JD.

**Flow:**
1. User selects a job from the pipeline
2. System selects relevant stories for the JD's emphasized competencies
3. System produces a tailored resume in markdown
4. User reviews, optionally edits
5. User downloads or copies the result

**Prototype implementation:** Real LLM call. Inputs: JD + master resume + story bank. Output: tailored resume markdown with list of stories used.

---

### Journey 4: Pipeline Management

**Goal:** Track applications across multiple roles over time.

**Flow:**
1. User returns to the tool
2. Sees all applications with current status
3. Updates statuses as things change (interested, applied, screened, interviewing, offer, rejected, withdrawn)
4. Logs notes and next steps per application

**Prototype implementation:** Status field per job (dropdown). Notes textarea per job. Last-updated timestamp. Persists to local JSON.

---

### Journey 5: Story Bank Maintenance

**Goal:** Add, edit, and refine stories over time.

**Flow:**
1. User opens story bank
2. Sees existing stories with tags
3. Adds new stories in STAR format
4. Edits existing stories
5. Deletes outdated ones

**Prototype implementation:** Story list view. Add/edit form with STAR fields and competency/domain tagging. Persists to local JSON.

---

### Journey 6: Interview Preparation

**Goal:** Prepare for an upcoming interview.

**Flow:**
1. User selects a job they're interviewing for
2. System surfaces the most relevant stories from the bank ranked by competency match
3. User reviews stories and practices them
4. User logs which stories came up and how they went (post-interview)

**Prototype implementation:** "Prep" view per job. LLM call ranks stories by relevance to the JD. Display ranked story list with full STAR content. Simple post-interview log (textarea + which stories were used).

---

### Journey 7: Resume Generation (Standalone)

**Goal:** Generate a clean DocX/PDF of the master resume without targeting a specific job.

**Flow:**
1. User clicks "Generate master resume"
2. System produces DocX and PDF versions
3. User downloads

**Prototype implementation:** Markdown-to-DocX conversion (use `docx` npm library or similar). Markdown-to-PDF (use a simple library like `md-to-pdf`). Single template, no styling options.

---

## Architecture

```
                User Preferences (form-edited, JSON)
                Master Resume (form-edited, markdown)
                Story Bank (form-edited, JSON)
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
   Job Discovery                  Story Maintenance
   (manual + light auto)          (CRUD UI)
              ↓
   Job Pipeline (scored, status-tracked)
              ↓
        ┌─────┴─────┐
        ↓           ↓
   Tailor       Interview Prep
   Resume       (story surfacing)
        ↓
   Document Output
   (markdown, DocX, PDF)
```

---

## Components

### 1. Preferences (form + JSON)

UI: Settings page with form for job titles, salary, location, domains, exclusions, role type, work style.
Storage: `data/preferences.json`

### 2. Master Resume (form + markdown)

UI: Editor view with markdown textarea.
Storage: `data/resume.md`

### 3. Story Bank (CRUD UI + JSON)

UI: List view, add/edit form with STAR fields, competency/domain tag selectors.
Storage: `data/stories.json`

### 4. Job Discovery

UI: "Add job" flow — paste URL or JD text. Optional: search button that hits a job source API.
Logic: Parse JD into structured form (LLM-assisted parsing acceptable). Store in `data/jobs/`.

### 5. Job Scoring

Logic: Rule-based score (0-100) using title match, salary, location, domain keyword matches.
LLM-augmented reasoning string (one sentence per dimension).

### 6. Pipeline View

UI: Sortable/filterable list of jobs with score, status, last-updated, next steps.
Allows status updates inline.

### 7. Resume Tailoring (LLM)

Real LLM call.
Inputs: JD, master resume, story bank.
Outputs: Tailored resume markdown + stories used + change summary.

### 8. Interview Prep (LLM)

Real LLM call.
Inputs: JD, story bank.
Outputs: Ranked stories by competency match + reasoning.

### 9. Application Tracking

Status field per job (enum). Notes field. Timestamps. Optional: log of status transitions.

### 10. Document Output

Markdown: write to `output/`.
DocX: convert via `docx` library.
PDF: convert via `md-to-pdf` or similar.

---

## Success Criteria

The prototype is "done" when all seven journeys can be completed end-to-end:

1. **Journey 1:** I can set preferences, add a resume, and add stories through the UI
2. **Journey 2:** I can add jobs (manually at minimum) and see them scored
3. **Journey 3:** I can select a job and get a tailored resume with real LLM output
4. **Journey 4:** I can update application status and log notes per job
5. **Journey 5:** I can add, edit, and delete stories through the UI
6. **Journey 6:** I can select a job and see ranked stories for interview prep
7. **Journey 7:** I can download a DocX and PDF of my master resume

---

## Tech Stack

- **Framework:** Next.js 15+ (App Router, TypeScript)
- **Styling:** Tailwind CSS, minimal
- **LLM:** Provider-agnostic; choose at build time
- **Storage:** Local filesystem (JSON and markdown files)
- **DocX:** `docx` npm package
- **PDF:** `md-to-pdf` or equivalent
- **Deployment:** Local only (`npm run dev`)

---

## Notes / Reflections

Updated during prototyping.

- [May 16]: Initial PRD drafted with all seven journeys in scope. Tech stack chosen as Next.js + TypeScript + Tailwind + local file storage. LLM provider deferred to build time.