// imaging-stream: the ONLY way image bytes leave private storage.
// Every request is authorised server-side, either as
//   - the owning patient (user JWT), or
//   - a Share Brief recipient holding a live viewing session
//     (checked against session, brief revocation, brief expiry and study scope
//      on every single request, so revocation takes effect immediately).
// Storage paths and signed URLs are never returned to the browser.
import { admin, audit, cors, fetchObject, HEX64_RE, sha256Hex, userIdFrom, UUID_RE } from '../_shared/imaging.ts';

const deny = (req: Request, status = 404) =>
  new Response(JSON.stringify({ error: 'not_available' }), {
    status, headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'GET') return deny(req, 405);
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  const purpose = url.searchParams.get('purpose') === 'download' ? 'download' : 'view';
  if (!UUID_RE.test(id)) return deny(req, 400);

  const db = admin();
  let path: string | null = null; let mime = 'application/dicom'; let size = 0;
  const session = req.headers.get('x-rinvita-view-session') ?? '';

  if (session) {
    if (!HEX64_RE.test(session)) return deny(req, 403);
    const hash = await sha256Hex(session);
    const { data, error } = await db.rpc('imaging_authorize_recipient', {
      _session_hash: hash, _instance_id: id, _purpose: purpose,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return deny(req, 403);
    path = row.storage_path; mime = row.mime; size = Number(row.size_bytes);
    if (purpose === 'download' && url.searchParams.get('first') === '1') {
      await audit('imaging_downloaded_by_recipient', row.owner_id, { shared_brief_id: row.shared_brief_id, study_id: row.study_id });
    }
    // Light-touch liveness marker (not per-image audit, to avoid log bloat).
    void db.from('imaging_view_sessions').update({ last_seen_at: new Date().toISOString() }).eq('session_hash', hash);
  } else {
    const userId = await userIdFrom(req);
    if (!userId) return deny(req, 401);
    const { data } = await db.from('imaging_instances').select('storage_path, mime, size_bytes, study_id')
      .eq('id', id).eq('user_id', userId).maybeSingle();
    if (!data) return deny(req, 404);
    path = data.storage_path; mime = data.mime; size = Number(data.size_bytes);
    if (purpose === 'download' && url.searchParams.get('first') === '1') {
      await audit('imaging_downloaded_by_owner', userId, { study_id: data.study_id }, userId);
    }
  }

  const obj = await fetchObject(path!);
  if (!obj.ok || !obj.body) return deny(req, 404);
  return new Response(obj.body, {
    status: 200,
    headers: {
      ...cors(req),
      'Content-Type': mime,
      'Content-Length': String(size),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': purpose === 'download' ? 'attachment' : 'inline',
      'Referrer-Policy': 'no-referrer',
    },
  });
});
