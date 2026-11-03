-- Share Brief: documents the patient chose to include (metadata + RinVita's reading).
-- Holds document ids and text snapshots only; storage paths are never stored here.
-- get-shared-brief resolves file access from public.documents, scoped to the brief owner.
alter table public.shared_briefs add column if not exists documents jsonb;
