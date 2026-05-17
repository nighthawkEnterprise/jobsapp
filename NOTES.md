# Full Prototype Notes (v0.4 PRD)

## LLM Choice
The v0.4 PRD stated the LLM provider was "agnostic". I chose Google Generative AI (Gemini 1.5 Flash) for this build as it is fast, cost-effective, and handles the structured JSON outputs reliably for the parsing, tailoring, and interview prep features.

## Data Storage
To support full CRUD operations across multiple journeys (like tracking job status and editing stories), the file structure was consolidated:
- `data/jobs.json` now stores all jobs rather than individual markdown files. This makes pipeline management (status updates, notes tracking) much easier to manage locally.
- `data/preferences.json`, `data/stories.json`, and `data/resume.md` remain.

## Document Export (Journey 7)
- **PDF**: Uses `md-to-pdf` which works excellently out of the box for basic markdown.
- **DocX**: Uses the `docx` library. To keep the prototype lightweight, the markdown-to-docx parser is extremely rudimentary (only parsing headings and top-level bullets). A production version would need a robust AST parser like `remark` to handle nested lists, bolding, and links properly.

## Build Status
- Next.js build (`npm run build`) completed successfully with 0 errors. All static and dynamic routes compiled perfectly.
