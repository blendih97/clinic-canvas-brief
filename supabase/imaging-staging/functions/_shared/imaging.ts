// Shared helpers for RinVita imaging functions. STAGED: not under supabase/functions.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-rinvita-view-session';

export const cors = (req: Request): Record<string, string> => ({
  'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'content-length, content-type',
  'Vary': 'Origin',
});

export const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export function admin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('server_misconfigured');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns the signed-in user id from a user JWT, or null (anon key / missing / invalid). */
export async function userIdFrom(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token || token.split('.').length !== 3) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(bytes = 32): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const HEX64_RE = /^[a-f0-9]{64}$/;

/** Fetch an object from the private bucket as a stream (service role, never exposed). */
export async function fetchObject(path: string, range?: string): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, apikey: key };
  if (range) headers.Range = range;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return await fetch(`${url}/storage/v1/object/authenticated/imaging-originals/${encoded}`, { headers });
}

export async function audit(eventType: string, userId: string | null, details: Record<string, unknown>, actor?: string | null) {
  // Never put tokens, file names or DICOM patient identifiers in details.
  await admin().from('platform_events').insert({
    event_type: eventType, user_id: userId, actor_user_id: actor ?? null, details_json: details,
  });
}

// --------------------------------------------------------------- labels
const MODALITY: Record<string, string> = {
  MR: 'MRI', CT: 'CT', CR: 'X-ray', DX: 'X-ray', DR: 'X-ray', RF: 'Fluoroscopy', US: 'Ultrasound',
  MG: 'Mammogram', NM: 'Nuclear medicine', PT: 'PET', XA: 'Angiography', OT: 'Imaging', SC: 'Imaging',
  ES: 'Endoscopy', OP: 'Eye imaging', IO: 'Dental X-ray', PX: 'Dental X-ray',
};
const REGIONS: [RegExp, string][] = [
  [/\b(BRAIN|HEAD|CRANI|SKULL)/, 'Brain'], [/\b(CHEST|THORAX|LUNG|CXR)/, 'Chest'],
  [/\b(ABD|ABDOMEN|LIVER|KIDNEY|RENAL)/, 'Abdomen'], [/\bPELVIS/, 'Pelvis'],
  [/\b(C-?SPINE|CERVICAL)/, 'Cervical spine'], [/\b(L-?SPINE|LUMBAR)/, 'Lumbar spine'],
  [/\b(T-?SPINE|THORACIC)/, 'Thoracic spine'], [/\bSPINE/, 'Spine'], [/\bKNEE/, 'Knee'],
  [/\bSHOULDER/, 'Shoulder'], [/\bHIP/, 'Hip'], [/\b(ANKLE|FOOT)/, 'Ankle / foot'],
  [/\b(WRIST|HAND)/, 'Wrist / hand'], [/\bELBOW/, 'Elbow'], [/\bNECK/, 'Neck'],
  [/\b(BREAST|MAMMO)/, 'Breast'], [/\b(HEART|CARDIAC|CORONARY)/, 'Heart'], [/\bSINUS/, 'Sinuses'],
  [/\bWHOLE ?BODY/, 'Whole body'],
];
export function friendlyLabel(modalities: string[], bodyPart?: string | null, studyDesc?: string | null): string {
  const mods = [...new Set(modalities.map(m => MODALITY[m] ?? m).filter(Boolean))];
  const mod = mods.find(m => m !== 'Imaging') ?? mods[0] ?? 'Imaging';
  const text = `${bodyPart ?? ''} ${studyDesc ?? ''}`.toUpperCase();
  const region = REGIONS.find(([re]) => re.test(text))?.[1];
  return region ? `${mod} ${region}` : mod;
}

export function dicomDate(v?: string | null): string | null {
  if (!v || !/^\d{8}$/.test(v.trim())) return null;
  const s = v.trim();
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** Transfer syntaxes the browser viewer can decode (Cornerstone3D dicom-image-loader codecs). */
export const VIEWABLE_TS = new Set([
  '1.2.840.10008.1.2', '1.2.840.10008.1.2.1', '1.2.840.10008.1.2.1.99', '1.2.840.10008.1.2.2',
  '1.2.840.10008.1.2.5',                                   // RLE
  '1.2.840.10008.1.2.4.50', '1.2.840.10008.1.2.4.51',      // JPEG baseline / extended
  '1.2.840.10008.1.2.4.57', '1.2.840.10008.1.2.4.70',      // JPEG lossless
  '1.2.840.10008.1.2.4.80', '1.2.840.10008.1.2.4.81',      // JPEG-LS
  '1.2.840.10008.1.2.4.90', '1.2.840.10008.1.2.4.91',      // JPEG 2000
  '3.2.840.10008.1.2.4.96', '1.2.840.10008.1.2.4.201', '1.2.840.10008.1.2.4.202', '1.2.840.10008.1.2.4.203', // HTJ2K
]);

/** Image-bearing storage SOP classes are viewable; SR / KO / PR etc. are kept but not shown. */
export function isImageSop(sopClass: string | undefined, hasRows: boolean): boolean {
  if (!hasRows) return false;
  if (!sopClass) return true;
  return !/^1\.2\.840\.10008\.5\.1\.4\.1\.1\.(88|11|104)\b/.test(sopClass);
}
