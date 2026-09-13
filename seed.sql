-- ============================================================
-- ZEN Knowledge — Jeu de données de démonstration
-- À exécuter APRÈS schema.sql, sur un projet Supabase vierge.
-- Comptes de test (mot de passe entre parenthèses) :
--   groupadmin@zen.com (admin123)     — group_admin, transverse à tout le Groupe
--   admin@acme.com     (admin123)     — admin, Acme Corp
--   manager@acme.com   (manager123)   — manager, Acme Corp, département RH
--   employee@acme.com  (employee123) — employee, Acme Corp, département RH
-- ============================================================

-- Société de démonstration
insert into companies (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp');

-- Départements
insert into departments (id, company_id, name) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'RH'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'IT');

-- Utilisateurs de démonstration
insert into users (id, email, company_id, department_id, role, password_hash) values
  ('33333333-3333-3333-3333-333333333330', 'groupadmin@zen.com', null, null, 'group_admin', '$2b$10$Y31JU6EnSY8mVhCZsBuxpOdocXG1nuToaLb58i9iJjE3PQoewGarG'),
  ('33333333-3333-3333-3333-333333333331', 'admin@acme.com', '11111111-1111-1111-1111-111111111111', null, 'admin', '$2b$10$Y31JU6EnSY8mVhCZsBuxpOdocXG1nuToaLb58i9iJjE3PQoewGarG'),
  ('33333333-3333-3333-3333-333333333332', 'manager@acme.com', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'manager', '$2b$10$poDGeDsoUztahPBUZCgT8eroubP.XjPQqPRdnSzNKKgKYuPeJEX.C'),
  ('33333333-3333-3333-3333-333333333333', 'employee@acme.com', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'employee', '$2b$10$.4.dEli5yNOzXkAFzyDJwed4YUWP2d8F62DXArrqnoyJtv40.hxAq');

-- Documents de démonstration (sans fichier ni chunks — à uploader manuellement
-- via l'interface pour tester le pipeline d'ingestion complet, cohérent avec
-- le fait que l'ingestion nécessite un vrai PDF et des embeddings calculés)
insert into documents (id, company_id, department_id, service, owner_id, title, visibility_roles, version, status, date_revision) values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'RH', '33333333-3333-3333-3333-333333333331', 'Politique de congés — Acme Corp', array['admin','manager','employee'], 1, 'draft', '2027-01-01');

-- Note : ce document est volontairement en statut "draft" sans fichier associé.
-- Pour tester le pipeline complet (upload → extraction → chunking → publication),
-- utilisez l'interface /library avec un PDF de test — voir README, section
-- "Jeu de données de démonstration" pour des exemples de contenu PDF suggérés.