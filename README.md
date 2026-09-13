# ZEN Knowledge

Multi-company conversational search engine (RAG) for ZEN Group. An employee asks a question and receives a concise answer, sourced with clickable citations, exclusively from the documents they have access to — permission filtering is applied **before** vector search, never as post-processing.

Project developed through vibe coding with Claude (Anthropic) over approximately 48 hours, as part of the Fullstack AI/Automation Developer (Junior) technical test — ZEN Group.

---

## Table of Contents

- [Tech Stack](#stack-technique)
- [Installation](#installation)
- [Architecture](#architecture)
- [Demo Accounts](#demo-accounts)
- [Permission Model](#permission-model)
- [Deliberate Technical Choices](#deliberate-technical-choices)
- [Known Limitations](#limites-connues)
- [Tests](#tests)
- [n8n Workflows](#workflows-n8n)
- [Deployment](#deployment)

---

## Tech Stack

| Requirement | Tool |
|---|---|
| Frontend + API | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database + vectors | Supabase (PostgreSQL + pgvector) |
| File storage | Supabase Storage |
| Authentication | Auth.js (NextAuth v5), provider Credentials |
| Embeddings | Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions) |
| Response generation | Groq API (`openai/gpt-oss-20b`) |
| PDF extraction | `pdf-parse` |
| Automation | n8n (workflows exported as JSON) |
| Tests | Vitest |
| Deployment | Vercel (app) + Supabase (data) |

---

## Installation

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/yessin-rekik/zen-knowledge.git
cd zen-knowledge
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required because of a peer dependency conflict between Vitest 5 and `@types/node` — see `.npmrc`, already configured to apply it automatically.

### 2. Create a Supabase project

- Create a new project on [supabase.com](https://supabase.com)
- In the **SQL Editor**, run in order:
  1. `schema.sql` (complete structure: tables, RLS, RPC function `match_chunks`)
  2. `seed.sql` (demo dataset — optional but recommended)
- Retrieve from **Project Settings → API**: the project URL, the `anon` key, and the `service_role` key

### 3. Create the required external accounts

- **Groq**: create an API key on [console.groq.com](https://console.groq.com)
- **Hugging Face** : create a token on [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) with the permission **"Make calls to Inference Providers"** (`Read` scope alone is not sufficient)

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill `.env.local` with your values. Generate `AUTH_SECRET`, `CRON_SECRET`, and `INTERNAL_WEBHOOK_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run the project

```bash
npm run dev
```

The application is available at `http://localhost:3000`.

---

## Architecture

```
app/
  (auth)/login/          — login page
  (app)/
    chat/                — conversational search + history
    library/              — document CRUD, versioning, advanced permissions
    tasks/                 — review tasks (obsolescence)
    profile/               — personal account management
    admin/                 — dashboard (costs, unanswered questions, negative feedback)
    admin/users/           — employee management
    group/                 — company/department management (group_admin)
    group/audit/           — cross-company audit log (group_admin)
  api/
    ingest/                — extraction + chunking + embedding pipeline
    chat/                  — main RAG endpoint (search + generation)
    documents/[id]/url/    — signed URLs to open a cited document
    documents/[id]/versions/ — document version history
    cron/                  — daily obsolescence job (reminder/unpublishing)
    auth/[...nextauth]/    — Auth.js handler

lib/
  auth.ts                 — Auth.js configuration (Credentials, JWT, callbacks)
  db.ts                   — Supabase admin client (service_role, server-only)
  rag.ts                  — vector search + Groq generation
  embeddings.ts           — Hugging Face Inference API call
  extraction.ts           — PDF text extraction
  chunking.ts             — chunking (~500 tokens, overlap 50)
  context.ts              — resolution of the "effective" company (admin vs group_admin)
  active-company.ts       — company context cookie management (group_admin)
  audit.ts                — audit logging helper

workflows/                — n8n JSON exports (ingestion, obsolescence)
tests/isolation.test.ts   — automated permission isolation tests
schema.sql                — complete consolidated DB schema
seed.sql                  — demo dataset
```

### Search Flow (W2)

1. **Identity verification** — Auth.js session (`middleware.ts` protects routes)
2. **Filtered search** — the PostgreSQL RPC function `match_chunks` filters by company, role, department, and explicit access rules **in the `WHERE` clause, before** sorting by vector similarity
3. **Sourced generation** — Groq generates a response from the returned chunks only; if the model considers the context insufficient, an explicit message is returned and **no source is displayed** (no supplementation from the LLM's memory)
4. **Technical logging** — each query is logged in `query_logs` (question, latency, model, tokens, retrieved documents), without ever storing a secret

### Ingestion Flow (W1)

Upload (Supabase Storage) → text extraction (`pdf-parse`, detection of empty scanned PDFs) → cleaning + chunking → embedding (Hugging Face Inference API) → insertion into `document_chunks` → manual publication (admin button), the only state in which chunks become searchable.

### Obsolescence Flow (W3)

A daily cron (`vercel.json`, also callable via the n8n `obsolescence.json` workflow) checks published documents whose `date_revision` has passed: creates a task for the owner, sends a reminder at D+7, unpublishes at D+14 (chunks are disabled — `is_active = false` — never deleted, and chat history remains intact).

---

## Demo Accounts

After running `seed.sql`:

| Email | Password | Role | Scope |
|---|---|---|---|
| `admin@acme.com` | `admin123` | admin | Acme Corp |
| `manager@acme.com` | `manager123` | manager | Acme Corp, HR department |
| `employee@acme.com` | `employee123` | employee | Acme Corp, HR department |
| `groupadmin@zen.com` | `admin123` | group_admin | Across the entire Group |

> The `group_admin` account must first select an active company at `/group` before accessing the chat, library, or dashboard for a given company.

---

## Permission Model

Filtering is applied in cascade, entirely within the SQL function `match_chunks`:

1. **Eligibility base** : the document is visible if (a) it is marked `is_group_wide`, or (b) the user is in the same company **and** their role is listed in `visibility_roles` **and** (the document has no department, or the user has no department, or they match)
2. **Exception rules** (`document_access_rules`): an explicit `deny` rule always excludes a document, even if it would normally be visible; an explicit `allow` rule always includes it, even outside the usual scope — for example, allowing a document to be shared with a third-party company or a specific user without changing its general visibility

Roles disponibles : `employee`, `manager`, `admin` (scoped to a company), `group_admin` (cross-company, without a fixed company, must explicitly select a company context — each switch is recorded in `audit_log`).

---

## Deliberate Technical Choices

- **RLS + Auth.js**: Supabase RLS policies (based on `auth.uid()`) remain a symbolic defensive layer, because this project uses Auth.js rather than Supabase Auth — `auth.uid()` is never populated in practice. Actual permission enforcement takes place in `match_chunks`, called through the `service_role` client with parameters (`company_id`, `role`, `department_id`, `user_id`) verified server-side from the Auth.js session — never supplied as-is by the client.
- **n8n not hosted continuously** : the workflows (`ingestion.json`, `obsolescence.json`) were developed and tested locally (Docker), then exported. The latency-critical path (chat) remains in Next.js for perceived speed; n8n is used for asynchronous/back-office workflows, consistent with the spirit of the test.
- **Embeddings via external API, not locally** : `@huggingface/transformers` (local model execution) was abandoned in favor of the Hugging Face Inference API, because ONNX runtimes with native bindings are incompatible with Vercel's serverless environment (missing `.so` library). The model (`all-MiniLM-L6-v2`) remains identical; only the execution method changes.
- **Synchronous generation in the app** rather than via an n8n webhook, for perceived user latency — a choice documented from the design stage.
- **Departments as a dedicated table**, migrated from the former free-text `service` field — backward-compatible (`service` retained for reading).

---

## Known Limitations

- **No OCR** for empty scanned PDFs — the case is detected (`extraction_status = 'extraction_failed'`) but no OCR fallback is implemented; documented as an accepted limitation.
- **No actual email sending** for obsolescence reminders — tasks are created and visible at `/tasks`, but no external notification is sent.
- **Indicative cost estimate** — the calculation in the admin dashboard uses a fixed hard-coded Groq rate, not actual real-time billing.
- **Approximate tokenization** for chunking (~4 characters ≈ 1 token), sufficient for the demo but not a precise tokenizer.
- **`group_admin` and company/department management**: no editing or deletion of a company/department once created (creation and listing only) — sufficient to demonstrate the architecture, but not yet a complete CRUD.
- **No infinite scroll/pagination** on lists (documents, dashboard, audit log) — limited to reasonable demo volumes.

---

## Tests

```bash
npm run test
```

`tests/isolation.test.ts` covers, with data automatically created and cleaned up on each run:

- Strict company isolation (a user from company A never retrieves a chunk from company B, even with an identical similarity score)
- Role isolation (`visibility_roles`)
- Department isolation
- Explicit access rules: `deny` has priority, `allow` grants access outside the normal scope, `is_group_wide` documents are visible from any company

---

## n8n Workflows

Two workflows exported to `workflows/`, developed and tested locally (Docker), not hosted continuously — see [Deliberate Technical Choices](#deliberate-technical-choices):

- **`ingestion.json`** — receives a `documentId` via webhook, triggers `/api/ingest` (authenticated with a shared secret, `INTERNAL_WEBHOOK_SECRET`), and notifies the result
- **`obsolescence.json`** — triggered daily (Schedule Trigger), calls `/api/cron` (authenticated with `CRON_SECRET`) to create review tasks, send reminders, and unpublish

To re-import them: n8n → menu → Import from File.

---

## Deployment

Deployed on Vercel with Supabase as the data backend. Points to note:

- All `.env.example` variables must be configured in Vercel (Project Settings → Environment Variables)
- `NEXTAUTH_URL` must be set to the production URL after the first deployment
- The obsolescence cron (`vercel.json`) is automatically triggered by Vercel Cron (Hobby plan: once per day maximum)
