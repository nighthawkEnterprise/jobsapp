# Job Pilot Prototype (v0.4) - Mocked LLM Edition

A complete end-to-end prototype for managing parallel job tracks with AI-assisted resume tailoring and interview prep. Built to satisfy all 7 User Journeys in the v0.4 PRD.

> **Note:** This version uses a **mocked LLM service** so it can be run immediately without needing a Gemini or Anthropic API key. All "AI" interactions (Parsing, Tailoring, Prepping) are simulated with delays to mimic the user experience.

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```
   No API keys required!

## The 7 User Journeys Implemented

1. **First-Time Setup (`/settings`)**: Set global preferences and manage your master markdown resume.
2. **Job Discovery (`/`)**: Paste a raw Job Description to automatically "parse" it and add it to your pipeline.
3. **Targeted Tailoring (`/job/[id]`)**: Hit the mock service to produce a tailored resume targeting the specific competencies of a job.
4. **Pipeline Management (`/` and `/job/[id]`)**: Update the status of applications and track notes.
5. **Story Bank Maintenance (`/stories`)**: Full CRUD interface for managing STAR-format stories with competency tagging.
6. **Interview Preparation (`/job/[id]`)**: The mock service will surface and rank the 3 most relevant stories from your bank for a specific role.
7. **Resume Generation (`/export`)**: Convert your master markdown resume into DocX or PDF format instantly.

## Architecture

- **Framework**: Next.js App Router
- **Storage**: Local filesystem JSON/MD (in `data/`) via `lib/store.ts`.
- **LLM**: Simulated via `lib/llm.ts`
- **Document Generation**: `docx` and `md-to-pdf` npm packages.
