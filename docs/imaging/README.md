# RinVita Imaging — status, support matrix, limits, costs, release plan

Branch: `imaging-dev`. Built and tested only on an isolated local stack (local Supabase in Docker, separate database, synthetic users and synthetic DICOM). **Nothing has been deployed, published or migrated on the shared Lovable Cloud backend.**

## What is built

| Area | What exists | Where |
|---|---|---|
| Upload | DICOM (.dcm, .dicom, extensionless), ZIP (streamed, ZIP-bomb and path-traversal safe), folders (CD/USB, drag-and-drop), JPG/PNG. PDFs are routed to Documents and can then be linked to a study. Resumable TUS uploads (6 MB chunks, retry, resume after connection loss). | `src/lib/imaging/scan.ts`, `upload.ts`, `src/components/imaging/AddImagingDialog.tsx` |
| Server checks | Every upload is re-read on the server: SHA-256 of every byte, DICOM re-parsed (never trusting the browser's grouping), UID validation, dedupe of CD duplicates, size/quota limits, rejected files deleted. | `supabase/imaging-staging/functions/imaging-register` |
| Grouping | Study → series → instance, plain-English labels ("MRI Brain", "CT Abdomen"), study date, series/image counts (frames counted as images). Patient can rename and link a radiology report from Documents. | same + `001_imaging.sql` |
| Viewer | Cornerstone3D 5.14 (engine behind OHIF) with DICOM image loader and WASM codecs: series list, slice scrolling (wheel, slider, arrow keys), window/level, zoom, pan, invert, reset, cine play, full screen, orientation letters, touch-friendly tool selection. | `src/components/imaging/DicomViewer.tsx` (lazy-loaded) |
| Download | "Download original study" ZIP built in the browser from the authorised stream with no recompression (STORE); verified byte-identical. | `src/lib/imaging/download.ts` |
| Share | "Share imaging" in the vault, plus scan selection inside the existing Share Brief. Patient chooses studies and whether download is allowed (off by default). Scope fixed at creation (cannot be widened). | `ImagingVault.tsx`, `ImagingStudyPicker.tsx`, `ShareBriefSection.tsx` |
| Doctor view | Imaging section on the existing Share Brief page. After the existing single-use claim, a server-side viewing session is opened; every image request is checked against session, brief revocation, brief expiry and study scope. No account or software needed. | `SharedImaging.tsx`, `imaging-session`, `imaging-stream` |
| Help | "Don't have your images?" guide with an editable request template. No claim of automatic retrieval. | `ImagingVault.tsx` |
| Audit | `imaging_uploaded`, `imaging_shared`, `imaging_view_session_started`, `imaging_downloaded_by_owner`, `imaging_downloaded_by_recipient`, `imaging_deleted` (plus existing `share_brief_consumed` / `share_brief_revoked`). No names, tokens, file names or DICOM patient fields. | `platform_events` |

The feature is behind `VITE_IMAGING_VAULT=1`. With the flag off (the default), the live site behaves exactly as today.

## Security model

- Originals live in the private bucket `imaging-originals` under `<user_id>/<batch>/<random>`; patients can write only to their own folder. There are **no public URLs and no signed URLs given to browsers**. Every byte is served by `imaging-stream` after a server-side check.
- Doctor access depends on the **staged** single-use claim (`supabase/pilot-staging/001_partner_pilot_safety.sql`, `consume_shared_brief`). The imaging migration refuses to apply without it.
- Viewing session secret: 32 random bytes, held only in the browser tab's memory; only its SHA-256 is stored. Max 5 live sessions per brief.
- Revocation and expiry are checked on **every image request**, so an open viewer stops receiving images immediately; the Share Brief page also unmounts the viewer within its 5-second revalidation.
- Honest limit: images already displayed or downloaded by the doctor cannot be retracted. "Download not allowed" stops the download button and server-side download requests, but a determined recipient can still screenshot what they are permitted to view, as with any web viewer.
- This is bearer-link access with single-use claiming. It does not verify that the recipient is a clinician.
- Nothing is pushed into PACS/EPR systems. Doctors pass images on by downloading originals only where the patient allowed it.

## Support matrix (tested with synthetic fixtures)

| Format / case | Upload | Browser view | Evidence |
|---|---|---|---|
| Explicit VR Little Endian (CT, 2 series) | Yes | Yes | e2e "CT Abdomen renders" |
| Implicit VR Little Endian (MR) | Yes | Yes | e2e "MRI series 1 (implicit VR)" |
| RLE Lossless | Yes | Yes | e2e "Compressed series renders (RLE)" |
| JPEG-LS Lossless | Yes | Yes | e2e "(JPEG-LS)" |
| JPEG 2000 Lossless (CR X-ray) | Yes | Yes | e2e "X-ray Chest renders (JPEG 2000)" |
| Deflated Explicit VR | Yes | Not browser-tested | backend test |
| Multi-frame (US cine 24 and 1,500 frames) | Yes | Yes (24 frames tested) | e2e "multi-frame" |
| Extensionless files (CD style `IM0001`) | Yes | Yes | backend + e2e |
| ZIP of a study | Yes | Yes | e2e |
| JPEG Baseline / Extended, JPEG Lossless, HTJ2K | Accepted | Codecs present, **not yet tested** (no synthetic encoder) | to test with vendor sample files |
| Big Endian, encapsulated PDF, SR/KO/PR objects | Kept, marked not viewable | No (message shown) | |
| Corrupt / non-DICOM files | Rejected with a clear message | — | backend + e2e |
| ZIP bomb, `../` paths, nested ZIPs | Rejected / skipped | — | fixtures |
| DICOM without the 128-byte preamble | **Rejected** (rare; would need a fallback parser) | — | known gap |

## Limits

| Limit | Value |
|---|---|
| Single file | 500 MB (bucket + server) |
| Study | 5,000 files or 5 GB |
| Per patient | 20 GB |
| One selection | 10,000 files / 5 GB |
| ZIP | 2 GB compressed, 4 GB expanded, compression-ratio guard |
| Studies per Share Brief | 50 |
| Measured locally | 300-image 512×512 CT (152 MB): checked in 2 s, uploaded and registered in 16–20 s, first image in 1.5–2 s, smooth scrolling |

Hosted-environment checks before release: the project's **global storage upload limit** must be at least 500 MB (Supabase's free tier caps files at 50 MB), and real-world speed depends on the user's upload bandwidth.

## Estimated hosting cost (Supabase Pro list prices; Lovable Cloud may bill differently, so confirm in Lovable)

- Storage: about $0.021 per GB-month beyond the plan allowance. A typical patient with two studies (about 300 MB) costs roughly **$0.006 a month**.
- Transfer: about $0.09 per GB beyond 250 GB/month included. A doctor opening a whole 300 MB study once costs about **$0.03**.
- Server calls: one per image viewed. A 300-image study is 300 calls, well inside the 2M/month included ($2 per extra million).
- Example: 1,000 patients × 300 MB = 300 GB stored ≈ **$6–7/month**; 2,000 doctor views/month ≈ 600 GB transfer ≈ **$30/month** beyond the allowance.

## Test results (local, synthetic)

- Backend security/workflow: **41/41** (`scripts/imaging-dev/backend-test.mjs`)
- Browser end-to-end, dev server: **27/27** (`scripts/imaging-dev/e2e.py`)
- Browser end-to-end, optimised production build: **27/27**
- Large study, resume after connection loss, Share Brief selection: **5/5** (`scripts/imaging-dev/e2e_large.py`)
- Existing RinVita tests: 100/102, the same 2 pre-existing translator-copy failures as before this work
- Production build incl. server-side prerender of 26 routes: passes

## Release plan (each step needs explicit approval)

1. Release the staged Share Brief security fix first (`supabase/pilot-staging`, per its README). Imaging depends on it.
2. Confirm the hosted global upload size limit (≥ 500 MB).
3. Apply `supabase/imaging-staging/001_imaging.sql` through Lovable's migration tool.
4. Deploy the four functions in `supabase/imaging-staging/functions/` (copy to `supabase/functions/`, set `verify_jwt = false` for `imaging-stream` and `imaging-session`).
5. Merge `imaging-dev` with the flag still **off**; publish; confirm nothing changed for users.
6. Turn the flag on for an internal test account (synthetic data), run the hosted checks, then enable for everyone.

## Local development

```
npx supabase start -x studio,imgproxy,logflare,vector,supavisor,postgres-meta
psql ... -f drizzle/migrations/*.sql -f supabase/pilot-staging/001_partner_pilot_safety.sql -f supabase/imaging-staging/001_imaging.sql
scripts/imaging-dev/serve-functions.sh          # serves staged functions locally only
python3 -I scripts/imaging-fixtures/generate.py  # synthetic DICOM (add --large for the big set)
VITE_IMAGING_VAULT=1 with .env.development.local pointing at http://127.0.0.1:54321
```

## Unrelated finding

RinVita's existing `user_signup` platform event stores the user's full name in `details_json`. Not changed here; consider removing it to minimise personal data in logs.
