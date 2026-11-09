// Writes a DICOMDIR (DICOM Part 10 media index) so a clinic can import an exported study
// straight into its PACS or viewer, the same way it would read a hospital CD.
import dicomParser from "dicom-parser";

export interface DicomDirEntry {
  fileId: string[];          // e.g. ["DICOM", "ST0001", "SE0001", "IM000001"]
  bytes: Uint8Array;         // the Part 10 file
}

type El = Uint8Array;
const enc = new TextEncoder();
const LONG_VR = new Set(["OB", "OW", "OF", "SQ", "UT", "UN"]);

function tagBytes(group: number, element: number): Uint8Array {
  const b = new Uint8Array(4);
  const v = new DataView(b.buffer);
  v.setUint16(0, group, true);
  v.setUint16(2, element, true);
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function element(group: number, el: number, vr: string, value: Uint8Array): El {
  let v = value;
  if (v.length % 2) {
    const pad = new Uint8Array(v.length + 1);
    pad.set(v);
    pad[v.length] = vr === "UI" || vr === "OB" ? 0 : 0x20;
    v = pad;
  }
  const head = LONG_VR.has(vr) ? new Uint8Array(12) : new Uint8Array(8);
  head.set(tagBytes(group, el), 0);
  head.set(enc.encode(vr), 4);
  const dv = new DataView(head.buffer);
  if (LONG_VR.has(vr)) dv.setUint32(8, v.length, true);
  else dv.setUint16(6, v.length, true);
  return concat([head, v]);
}

const s = (g: number, e: number, vr: string, text: string | undefined) => element(g, e, vr, enc.encode(text ?? ""));
const ul = (g: number, e: number, n: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return element(g, e, "UL", b); };
const us = (g: number, e: number, n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return element(g, e, "US", b); };

function item(content: Uint8Array): Uint8Array {
  const head = new Uint8Array(8);
  head.set(tagBytes(0xfffe, 0xe000), 0);
  new DataView(head.buffer).setUint32(4, content.length, true);
  return concat([head, content]);
}

interface Rec {
  type: "PATIENT" | "STUDY" | "SERIES" | "IMAGE";
  keys: Uint8Array;          // record-specific attributes, already encoded (sorted by tag)
  children: Rec[];
  next?: Rec;
  offset?: number;           // byte offset of this record's item tag in the file
}

function encodeRecord(r: Rec): Uint8Array {
  // (0004,1400) next, (0004,1410) in-use, (0004,1420) lower level, (0004,1430) type, then keys.
  return item(concat([
    ul(0x0004, 0x1400, r.next?.offset ?? 0),
    us(0x0004, 0x1410, 0xffff),
    ul(0x0004, 0x1420, r.children[0]?.offset ?? 0),
    s(0x0004, 0x1430, "CS", r.type),
    r.keys,
  ]));
}

// UIDs under the 2.25 (UUID-derived) root, which needs no registration.
const META_UIDS = { implementation: "2.25.97976139433173551926153703389721108373", dicomdir: "1.2.840.10008.1.3.10", explicitLE: "1.2.840.10008.1.2.1" };

function randomUid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; // UUID v4
  return `2.25.${BigInt("0x" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("")).toString()}`;
}

/** Builds the DICOMDIR file for the given Part 10 files. */
export function buildDicomDir(entries: DicomDirEntry[], fileSetId = "RINVITA"): Uint8Array {
  // Read the keys each level needs from the files themselves.
  const patients = new Map<string, Rec>();
  const studies = new Map<string, Rec>();
  const series = new Map<string, Rec>();
  for (const e of entries) {
    const ds = dicomParser.parseDicom(e.bytes, { untilTag: "x7fe00010" });
    const t = (tag: string) => (ds.string(tag) || "").trim();
    const pid = t("x00100020") || "UNKNOWN";
    const pname = ds.string("x00100010") || "";
    const studyUid = t("x0020000d"), seriesUid = t("x0020000e");
    let p = patients.get(pid);
    if (!p) {
      p = { type: "PATIENT", children: [], keys: concat([s(0x0010, 0x0010, "PN", pname.trim()), s(0x0010, 0x0020, "LO", pid)]) };
      patients.set(pid, p);
    }
    let st = studies.get(studyUid);
    if (!st) {
      st = { type: "STUDY", children: [], keys: concat([
        s(0x0008, 0x0020, "DA", t("x00080020")), s(0x0008, 0x0030, "TM", t("x00080030")),
        s(0x0008, 0x0050, "SH", t("x00080050")), s(0x0008, 0x1030, "LO", t("x00081030")),
        s(0x0020, 0x000d, "UI", studyUid), s(0x0020, 0x0010, "SH", t("x00200010")),
      ]) };
      studies.set(studyUid, st);
      p.children.push(st);
    }
    let se = series.get(seriesUid);
    if (!se) {
      se = { type: "SERIES", children: [], keys: concat([
        s(0x0008, 0x0060, "CS", t("x00080060")), s(0x0020, 0x000e, "UI", seriesUid), s(0x0020, 0x0011, "IS", t("x00200011")),
      ]) };
      series.set(seriesUid, se);
      st.children.push(se);
    }
    se.children.push({ type: "IMAGE", children: [], keys: concat([
      s(0x0004, 0x1500, "CS", e.fileId.join("\\")),
      s(0x0004, 0x1510, "UI", t("x00020002") || t("x00080016")),
      s(0x0004, 0x1511, "UI", t("x00020003") || t("x00080018")),
      s(0x0004, 0x1512, "UI", t("x00020010")),
      s(0x0020, 0x0013, "IS", t("x00200013")),
    ]) });
  }

  // Depth-first order, linking siblings.
  const roots = [...patients.values()];
  const order: Rec[] = [];
  const walk = (list: Rec[]) => list.forEach((r, i) => { r.next = list[i + 1]; order.push(r); walk(r.children); });
  walk(roots);

  // File meta.
  const metaBody = concat([
    element(0x0002, 0x0001, "OB", new Uint8Array([0, 1])),
    s(0x0002, 0x0002, "UI", META_UIDS.dicomdir),
    s(0x0002, 0x0003, "UI", randomUid()),
    s(0x0002, 0x0010, "UI", META_UIDS.explicitLE),
    s(0x0002, 0x0012, "UI", META_UIDS.implementation),
    s(0x0002, 0x0013, "SH", "RINVITA"),
  ]);
  const meta = concat([ul(0x0002, 0x0000, metaBody.length), metaBody]);
  const preamble = new Uint8Array(132);
  preamble.set(enc.encode("DICM"), 128);

  const header = (first: number, last: number) => concat([
    s(0x0004, 0x1130, "CS", fileSetId),
    ul(0x0004, 0x1200, first),
    ul(0x0004, 0x1202, last),
    us(0x0004, 0x1212, 0),
  ]);
  // Record sizes do not depend on the offsets they hold, so lay them out, then fill offsets in.
  const sizes = order.map((r) => encodeRecord(r).length);
  const seqBodyLen = sizes.reduce((a, b) => a + b, 0);
  let pos = preamble.length + meta.length + header(0, 0).length + 12; // + SQ element header
  order.forEach((r, i) => { r.offset = pos; pos += sizes[i]; });
  const items = order.map(encodeRecord);
  const seq = concat([element(0x0004, 0x1220, "SQ", new Uint8Array(0)).subarray(0, 12), ...items]);
  new DataView(seq.buffer, seq.byteOffset).setUint32(8, seqBodyLen, true);
  return concat([preamble, meta, header(roots[0]?.offset ?? 0, roots[roots.length - 1]?.offset ?? 0), seq]);
}
