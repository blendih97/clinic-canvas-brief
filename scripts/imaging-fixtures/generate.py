"""Generate SYNTHETIC DICOM fixtures for RinVita imaging tests.

No real patient data. Every image is a mathematical phantom; every patient
name is fictional. Output goes to ./fixtures-out (gitignored).

Usage: python3 -I scripts/imaging-fixtures/generate.py [outdir]
"""
import os
import sys
import zipfile
import datetime

import numpy as np
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import (
    ExplicitVRLittleEndian, ImplicitVRLittleEndian, RLELossless,
    JPEGLSLossless, JPEG2000Lossless, DeflatedExplicitVRLittleEndian, generate_uid,
)

OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else os.path.join(os.path.dirname(__file__), "fixtures-out")
os.makedirs(OUT, exist_ok=True)

SOP = {
    "CT": "1.2.840.10008.5.1.4.1.1.2",
    "MR": "1.2.840.10008.5.1.4.1.1.4",
    "CR": "1.2.840.10008.5.1.4.1.1.1",
    "DX": "1.2.840.10008.5.1.4.1.1.1.1",
    "US_MF": "1.2.840.10008.5.1.4.1.1.3.1",
}


def phantom(size, z, nz, kind="CT"):
    y, x = np.mgrid[0:size, 0:size]
    c = size / 2
    r = np.hypot(x - c, y - c)
    img = np.zeros((size, size), dtype=np.float32)
    body = r < size * 0.42
    img[body] = 40
    # "organs" that move across slices so scrolling is visibly working
    for i, (ox, oy, rr, val) in enumerate([(-0.15, -0.1, 0.12, 300), (0.18, 0.05, 0.08, -500), (0.0, 0.2, 0.05, 1000)]):
        cx = c + ox * size + np.sin(z / max(nz, 1) * np.pi * 2 + i) * size * 0.03
        cy = c + oy * size
        rad = size * rr * (0.6 + 0.4 * np.sin(np.pi * (z + 1) / (nz + 1)))
        img[np.hypot(x - cx, y - cy) < rad] = val
    img[~body] = -1000
    # slice-number tick marks (top-left) so tests can verify ordering visually
    for k in range(min(z + 1, 40)):
        img[4:10, 4 + k * 3: 6 + k * 3] = 1500
    if kind != "CT":
        img = np.clip((img + 1000) / 3000 * 4000, 0, 4095)
    return img


def base_ds(modality, sop_class, study_uid, series_uid, series_no, desc, study_desc, body_part, inst_no, ts):
    meta = FileMetaDataset()
    meta.MediaStorageSOPClassUID = sop_class
    meta.MediaStorageSOPInstanceUID = generate_uid()
    meta.TransferSyntaxUID = ts
    ds = Dataset()
    ds.file_meta = meta
    ds.SOPClassUID = sop_class
    ds.SOPInstanceUID = meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID = study_uid
    ds.SeriesInstanceUID = series_uid
    ds.PatientName = "SYNTHETIC^TEST"
    ds.PatientID = "RV-SYNTH-0001"
    ds.PatientBirthDate = "19800101"
    ds.PatientSex = "O"
    ds.StudyDate = "20260915"
    ds.StudyTime = "101500"
    ds.StudyDescription = study_desc
    ds.SeriesDescription = desc
    ds.BodyPartExamined = body_part
    ds.Modality = modality
    ds.SeriesNumber = series_no
    ds.InstanceNumber = inst_no
    ds.AccessionNumber = "SYNTH001"
    ds.InstitutionName = "Synthetic Test Hospital"
    ds.Manufacturer = "RinVita Synthetic"
    return ds


def set_pixels(ds, arr, ts, signed=False, bits=16):
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.Rows, ds.Columns = arr.shape[-2], arr.shape[-1]
    ds.BitsAllocated = bits
    ds.BitsStored = 12 if bits == 16 else 8
    ds.HighBit = ds.BitsStored - 1
    ds.PixelRepresentation = 1 if signed else 0
    dtype = (np.int16 if signed else np.uint16) if bits == 16 else np.uint8
    data = arr.astype(dtype)
    if ts in (RLELossless, JPEGLSLossless, JPEG2000Lossless):
        ds.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        ds.compress(ts, data)
    else:
        ds.PixelData = data.tobytes()


def write(ds, path, ts):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    implicit = ts == ImplicitVRLittleEndian
    pydicom.dcmwrite(path, ds, enforce_file_format=True, implicit_vr=implicit, little_endian=True) if implicit else pydicom.dcmwrite(path, ds, enforce_file_format=True)


def ct_series(folder, study_uid, n, ts, series_no=1, desc="Axial 5mm", size=256, extensionless=False):
    series_uid = generate_uid()
    paths = []
    for z in range(n):
        ds = base_ds("CT", SOP["CT"], study_uid, series_uid, series_no, desc, "CT ABDOMEN WITH CONTRAST", "ABDOMEN", z + 1, ts)
        ds.ImagePositionPatient = [-200.0, -200.0, float(-z * 5)]
        ds.ImageOrientationPatient = [1, 0, 0, 0, 1, 0]
        ds.PixelSpacing = [1.5, 1.5]
        ds.SliceThickness = 5
        ds.RescaleIntercept = -1024
        ds.RescaleSlope = 1
        ds.WindowCenter = 40
        ds.WindowWidth = 400
        img = phantom(size, z, n) + 1024
        set_pixels(ds, np.clip(img, 0, 4095), ts)
        name = f"IM{z + 1:04d}" if extensionless else f"ct_{series_no}_{z + 1:03d}.dcm"
        p = os.path.join(folder, name)
        write(ds, p, ts)
        paths.append(p)
    return paths


def mr_series(folder, study_uid, n, ts, series_no, desc, size=256):
    series_uid = generate_uid()
    for z in range(n):
        ds = base_ds("MR", SOP["MR"], study_uid, series_uid, series_no, desc, "MRI BRAIN WITHOUT CONTRAST", "HEAD", z + 1, ts)
        ds.ImagePositionPatient = [-120.0, -120.0, float(z * 4)]
        ds.ImageOrientationPatient = [1, 0, 0, 0, 1, 0]
        ds.PixelSpacing = [0.94, 0.94]
        ds.SliceThickness = 4
        ds.WindowCenter = 1200
        ds.WindowWidth = 2400
        set_pixels(ds, phantom(size, z, n, "MR"), ts)
        write(ds, os.path.join(folder, f"mr_{series_no}_{z + 1:03d}.dcm"), ts)


def xray(folder, study_uid, ts, sop="CR"):
    ds = base_ds(sop, SOP[sop], study_uid, generate_uid(), 1, "PA", "XR CHEST 1 VIEW", "CHEST", 1, ts)
    ds.ImagerPixelSpacing = [0.15, 0.15]
    ds.WindowCenter = 2048
    ds.WindowWidth = 4096
    set_pixels(ds, phantom(512, 3, 7, "CR"), ts)
    write(ds, os.path.join(folder, "chest_pa.dcm"), ts)


def us_multiframe(folder, study_uid, frames=24, ts=ExplicitVRLittleEndian):
    ds = base_ds("US", SOP["US_MF"], study_uid, generate_uid(), 1, "Cine loop", "US ABDOMEN LIMITED", "ABDOMEN", 1, ts)
    ds.NumberOfFrames = frames
    ds.FrameTime = 40
    arr = np.stack([np.clip(phantom(200, f, frames, "US") / 16, 0, 255) for f in range(frames)])
    set_pixels(ds, arr, ts, bits=8)
    write(ds, os.path.join(folder, "us_cine_multiframe.dcm"), ts)


def zipdir(src, dest):
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(src):
            for f in files:
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, os.path.dirname(src)))


if __name__ == "__main__" and "--large" not in sys.argv:
    # 1. CT abdomen: two series, uncompressed explicit VR, plus extensionless CD-style files
    s = generate_uid()
    ct_series(os.path.join(OUT, "ct_abdomen"), s, 40, ExplicitVRLittleEndian, 1, "Axial 5mm")
    ct_series(os.path.join(OUT, "ct_abdomen"), s, 20, ExplicitVRLittleEndian, 2, "Coronal reformat", extensionless=True)
    # 2. MRI brain: three series, implicit VR / RLE / JPEG-LS
    s = generate_uid()
    mr_series(os.path.join(OUT, "mri_brain"), s, 24, ImplicitVRLittleEndian, 1, "T1 axial")
    mr_series(os.path.join(OUT, "mri_brain"), s, 24, RLELossless, 2, "T2 axial (RLE)")
    mr_series(os.path.join(OUT, "mri_brain"), s, 16, JPEGLSLossless, 3, "FLAIR (JPEG-LS)")
    # 3. X-ray chest, JPEG 2000 lossless
    xray(os.path.join(OUT, "xray_chest"), generate_uid(), JPEG2000Lossless)
    # 4. Ultrasound multi-frame cine
    us_multiframe(os.path.join(OUT, "us_multiframe"), generate_uid())
    # 5. Deflated transfer syntax single CT image
    ct_series(os.path.join(OUT, "ct_deflated"), generate_uid(), 1, DeflatedExplicitVRLittleEndian, 1, "Deflated")
    # 6. ZIP of the MRI study, CD-style folder
    zipdir(os.path.join(OUT, "mri_brain"), os.path.join(OUT, "mri_brain_study.zip"))
    # 7. Corrupted / unsupported samples
    with open(os.path.join(OUT, "corrupt.dcm"), "wb") as f:
        f.write(b"\0" * 128 + b"DICM" + os.urandom(2000))
    with open(os.path.join(OUT, "not_dicom.dcm"), "wb") as f:
        f.write(b"hello, this is not a DICOM file")
    # 8. ZIP bomb style archive (highly compressible, large declared size)
    with zipfile.ZipFile(os.path.join(OUT, "zip_bomb.zip"), "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("big.dcm", b"\0" * (300 * 1024 * 1024))
    # 9. Path traversal names in a zip
    with zipfile.ZipFile(os.path.join(OUT, "traversal.zip"), "w") as z:
        z.writestr("../../etc/evil.dcm", b"x")
    # 10. A plain JPG-like image and PDF report
    with open(os.path.join(OUT, "report.pdf"), "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")
    print("fixtures written to", OUT)
    for root, _, files in os.walk(OUT):
        print(root, len(files))


def large_fixtures(out):
    """Large synthetic study for performance / resume tests (python3 generate.py OUT --large)."""
    ct_series(os.path.join(out, "large_ct"), generate_uid(), 300, ExplicitVRLittleEndian, 1, "Axial 1mm", size=512)
    us_multiframe(os.path.join(out, "large_us"), generate_uid(), frames=1500)


if __name__ == "__main__" and "--large" in sys.argv:
    large_fixtures(OUT)
    print("large fixtures written")
