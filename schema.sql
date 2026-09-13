-- ============================================================
-- ZEN Knowledge — Schéma complet consolidé
-- À exécuter une seule fois sur un projet Supabase vierge
-- (SQL Editor Supabase → coller → Run)
-- ============================================================

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ─── Sociétés ────────────────────────────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- ─── Départements ────────────────────────────────────────────
create table departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  name text not null,
  unique (company_id, name)
);

-- ─── Utilisateurs ────────────────────────────────────────────
-- company_id nullable : un group_admin n'est rattaché à aucune société fixe
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  company_id uuid references companies(id),
  department_id uuid references departments(id),
  role text not null check (role in ('admin', 'manager', 'employee', 'group_admin')),
  password_hash text not null default ''
);

-- ─── Documents ───────────────────────────────────────────────
create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  department_id uuid references departments(id),
  service text,
  owner_id uuid references users(id),
  title text not null,
  visibility_roles text[] not null default '{}',
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  date_revision date,
  file_path text,
  extraction_status text default 'pending' check (extraction_status in ('pending', 'ok', 'extraction_failed')),
  is_group_wide boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Chunks vectorisés ───────────────────────────────────────
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  version int not null,
  content text not null,
  embedding vector(384),
  is_active boolean not null default true
);

-- ─── Historique de versions (fichiers) ──────────────────────
create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  version int not null,
  file_path text not null,
  extraction_status text,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

-- ─── Règles d'accès explicites (allow/deny) ─────────────────
create table document_access_rules (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  scope_type text not null check (scope_type in ('company', 'user')),
  scope_id uuid not null,
  access text not null check (access in ('allow', 'deny')),
  unique (document_id, scope_type, scope_id)
);

-- ─── Conversations & messages ────────────────────────────────
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  retrieved_chunk_ids uuid[] default '{}',
  feedback text check (feedback in ('helpful', 'inaccurate') or feedback is null),
  created_at timestamptz not null default now()
);

-- ─── Logs d'observabilité ────────────────────────────────────
create table query_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  question text,
  latency_ms int,
  model text,
  tokens_in int,
  tokens_out int,
  retrieved_doc_ids uuid[] default '{}',
  message_id uuid references messages(id),
  created_at timestamptz not null default now()
);

-- ─── Tâches (obsolescence) ───────────────────────────────────
create table tasks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) not null,
  owner_id uuid references users(id) not null,
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
  due_at timestamptz
);

-- ─── Journal d'audit (group_admin) ──────────────────────────
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS — activé sur documents et document_chunks
-- Note : ces policies sont une couche défensive supplémentaire ;
-- l'enforcement réel du filtrage société/rôle/département a lieu
-- dans la fonction match_chunks (voir plus bas), qui reçoit ses
-- paramètres vérifiés côté serveur (Auth.js), pas via auth.uid()
-- de Supabase Auth (non utilisé dans ce projet — voir README).
-- ============================================================

alter table documents enable row level security;
alter table document_chunks enable row level security;

create or replace function current_user_company_id()
returns uuid
language sql stable
as $$
  select company_id from users where id = auth.uid()
$$;

create or replace function current_user_role()
returns text
language sql stable
as $$
  select role from users where id = auth.uid()
$$;

create policy "documents_select_isolation"
on documents for select
using (
  company_id = current_user_company_id()
  and current_user_role() = any(visibility_roles)
);

create policy "chunks_select_isolation"
on document_chunks for select
using (
  is_active = true
  and exists (
    select 1 from documents d
    where d.id = document_chunks.document_id
    and d.company_id = current_user_company_id()
    and current_user_role() = any(d.visibility_roles)
  )
);

-- ============================================================
-- Fonction RPC principale — recherche vectorielle filtrée
-- Le filtrage société/rôle/département/règles d'accès est
-- appliqué DANS cette fonction, avant le tri par similarité —
-- c'est le point testé explicitement par les tests d'isolation.
-- ============================================================

create or replace function match_chunks(
  query_embedding vector(384),
  p_company_id uuid,
  p_role text,
  p_user_id uuid,
  p_department_id uuid default null,
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.is_active = true
    and d.status = 'published'
    and not exists (
      select 1 from document_access_rules r
      where r.document_id = d.id
        and r.access = 'deny'
        and ((r.scope_type = 'company' and r.scope_id = p_company_id)
          or (r.scope_type = 'user' and r.scope_id = p_user_id))
    )
    and (
      exists (
        select 1 from document_access_rules r
        where r.document_id = d.id
          and r.access = 'allow'
          and ((r.scope_type = 'company' and r.scope_id = p_company_id)
            or (r.scope_type = 'user' and r.scope_id = p_user_id))
      )
      or d.is_group_wide = true
      or (
        d.company_id = p_company_id
        and p_role = any(d.visibility_roles)
        and (d.department_id is null or p_department_id is null or d.department_id = p_department_id)
      )
    )
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;