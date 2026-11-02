// imaging-delete: patient removes a study. Deletes original files first, then rows.
import { z } from 'npm:zod@3.23.8';
import { admin, audit, cors, json, userIdFrom, UUID_RE } from '../_shared/imaging.ts';

const body = z.object({ studyId: z.string().regex(UUID_RE) });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);
  const userId = await userIdFrom(req);
  if (!userId) return json(req, { error: 'not_authenticated' }, 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(req, { error: 'invalid_request' }, 400);
  const db = admin();
  const { data: study } = await db.from('imaging_studies').select('id').eq('id', parsed.data.studyId).eq('user_id', userId).maybeSingle();
  if (!study) return json(req, { error: 'not_found' }, 404);
  const { data: inst } = await db.from('imaging_instances').select('storage_path').eq('study_id', study.id);
  const paths = (inst ?? []).map(i => i.storage_path);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await db.storage.from('imaging-originals').remove(paths.slice(i, i + 100));
    if (error) return json(req, { error: 'storage_delete_failed' }, 503);  // rows kept, so retry is safe
  }
  await db.from('imaging_studies').delete().eq('id', study.id);
  await audit('imaging_deleted', userId, { study_id: study.id, files: paths.length }, userId);
  return json(req, { ok: true });
});
