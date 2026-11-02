"""End-to-end browser test of RinVita Imaging against the LOCAL stack + local dev server.
Synthetic users and synthetic DICOM only. Screenshots go to $OUT (default ./e2e-out).
Run with: python3 -I scripts/imaging-dev/e2e.py
"""
import json, os, sys, time, uuid, urllib.request, glob, subprocess
from playwright.sync_api import sync_playwright, expect

APP = os.environ.get("APP_URL", "http://127.0.0.1:8080")
API = os.environ.get("LOCAL_SUPABASE_URL", "http://127.0.0.1:54321")
assert API.startswith("http://127.0.0.1") and APP.startswith("http://127.0.0.1"), "local only"
SERVICE = os.environ["LOCAL_SERVICE_KEY"]
FIX = os.environ.get("FIXTURES", "scripts/imaging-fixtures/fixtures-out")
OUT = os.environ.get("OUT", "scripts/imaging-dev/e2e-out")
os.makedirs(OUT, exist_ok=True)
results = []

def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  — {detail}" if detail else ""), flush=True)

def admin(path, body):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST",
        headers={"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def psql(sql):
    return subprocess.check_output(["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-At", "-c", sql], env={**os.environ, "PGPASSWORD": "postgres"}).decode().strip()

email = f"e2e-patient-{uuid.uuid4().hex[:8]}@example.test"
password = "Synthetic-" + uuid.uuid4().hex
user = admin("/auth/v1/admin/users", {"email": email, "password": password, "email_confirm": True, "user_metadata": {"full_name": "Synthetic Patient"}})
psql(f"update profiles set comped_plan='standard', comped_until=now()+interval '30 days' where id='{user['id']}'")

def canvas_has_image(page):
    """Counts non-dark pixels in a screenshot of the viewport (the viewer renders with WebGL)."""
    import io
    from PIL import Image
    el = page.locator("[data-testid=viewport]")
    if not el.count(): return 0
    img = Image.open(io.BytesIO(el.screenshot())).convert("L").resize((200, 200))
    return sum(1 for v in img.getdata() if v > 40)

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = browser.new_context(viewport={"width": 1366, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"{APP}/auth")
    page.wait_for_timeout(1500)
    for btn in ("Reject", "Accept"):
        if page.get_by_role("button", name=btn).count(): page.get_by_role("button", name=btn).first.click(); break
    page.locator("input[type=email]").fill(email)
    page.locator("input[type=password]").fill(password)
    page.get_by_role("button", name="Sign In", exact=True).last.click()
    page.wait_for_url("**/app**", timeout=20000)
    page.wait_for_timeout(2000)
    # Dismiss onboarding if shown
    for name in ("Skip", "Skip for now", "Close", "Get started"):
        if page.get_by_role("button", name=name).count(): page.get_by_role("button", name=name).first.click(); page.wait_for_timeout(500)
    page.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'imaging'}))")
    page.wait_for_selector("[data-testid=imaging-vault]", timeout=15000)
    check("Imaging vault visible", True)

    # Upload: ZIP of MRI study + CT folder (incl. extensionless) + X-ray + multiframe + bad files
    page.click("[data-testid=add-imaging]")
    files = [f"{FIX}/mri_brain_study.zip", *sorted(glob.glob(f"{FIX}/ct_abdomen/*")), f"{FIX}/xray_chest/chest_pa.dcm",
             f"{FIX}/us_multiframe/us_cine_multiframe.dcm", f"{FIX}/corrupt.dcm", f"{FIX}/not_dicom.dcm", f"{FIX}/traversal.zip", f"{FIX}/report.pdf"]
    page.set_input_files("[data-testid=imaging-file-input]", files)
    page.wait_for_selector("[data-testid=study-preview]", timeout=60000)
    previews = page.locator("[data-testid=study-preview]").all_inner_texts()
    check("Preview groups 4 studies with friendly names", len(previews) == 4 and any("MRI Brain" in t for t in previews) and any("CT Abdomen" in t for t in previews), " | ".join(t.replace("\n", " ") for t in previews))
    check("Preview shows MRI 3 series / 64 images", any("3 series · 64 images" in t for t in previews))
    body = page.locator("[role=dialog]").inner_text()
    check("Unsafe ZIP path and bad files reported as skipped", "skipped" in body)
    check("PDF report routed to Documents", "PDF report" in body)
    page.screenshot(path=f"{OUT}/01_upload_preview.png")
    page.click("[data-testid=start-upload]")
    page.wait_for_selector("[data-testid=upload-done]", timeout=180000)
    done_text = page.locator("[data-testid=upload-done]").inner_text()
    check("Upload completes", "files added" in done_text, done_text.replace("\n", " ")[:120])
    page.get_by_role("button", name="Done").click()
    page.wait_for_timeout(1500)
    cards = page.locator("[data-testid=study-card]").all_inner_texts()
    check("Vault lists 4 studies", len(cards) == 4, " | ".join(c.split("\n")[0] for c in cards))
    page.screenshot(path=f"{OUT}/02_vault.png", full_page=True)

    # Open MRI in the viewer
    page.locator("[data-testid=study-card]", has_text="MRI Brain").get_by_role("button", name="View").click()
    page.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000)
    page.wait_for_function("document.querySelector('[data-testid=slice-indicator]')?.textContent?.includes('/ 24')", timeout=60000)
    page.wait_for_timeout(2500)
    ind1 = page.locator("[data-testid=slice-indicator]").inner_text()
    lit = canvas_has_image(page)
    check("Patient viewer renders MRI series 1 (implicit VR)", lit > 50, f"{ind1}, lit={lit}")
    page.screenshot(path=f"{OUT}/03_viewer_mri_t1.png")
    page.locator("[data-testid=viewport]").click()
    for _ in range(3): page.keyboard.press("ArrowDown")
    page.wait_for_timeout(800)
    ind2 = page.locator("[data-testid=slice-indicator]").inner_text()
    check("Scrolling moves through slices", ind1.split("·")[0] != ind2.split("·")[0], f"{ind1} -> {ind2}")
    vp = page.locator("[data-testid=viewport]").bounding_box()
    page.get_by_role("button", name="Contrast").click()
    page.mouse.move(vp["x"] + vp["width"] / 2, vp["y"] + vp["height"] / 2); page.mouse.down(); page.mouse.move(vp["x"] + vp["width"] / 2 + 120, vp["y"] + vp["height"] / 2 + 60, steps=8); page.mouse.up()
    page.wait_for_timeout(500)
    ind3 = page.locator("[data-testid=slice-indicator]").inner_text()
    check("Window/level changes", ind2.split("·")[-1] != ind3.split("·")[-1], f"{ind2} -> {ind3}")
    page.get_by_role("button", name="Zoom").click()
    page.mouse.move(vp["x"] + 300, vp["y"] + 200); page.mouse.down(); page.mouse.move(vp["x"] + 300, vp["y"] + 100, steps=6); page.mouse.up()
    page.get_by_role("button", name="Pan").click()
    page.mouse.move(vp["x"] + 300, vp["y"] + 200); page.mouse.down(); page.mouse.move(vp["x"] + 360, vp["y"] + 240, steps=6); page.mouse.up()
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/04_viewer_zoom_pan_wl.png")
    for idx, (name, tsname) in enumerate([("T2 axial (RLE)", "RLE"), ("FLAIR (JPEG-LS)", "JPEG-LS")]):
        page.locator("[data-testid=series-button]", has_text=name).click()
        page.wait_for_timeout(4000)
        err = page.locator("[data-testid=viewer-error]").count()
        lit = canvas_has_image(page)
        check(f"Compressed series renders ({tsname})", lit > 50 and err == 0, f"lit={lit} err={err}")
        page.screenshot(path=f"{OUT}/05_viewer_{tsname}.png")
    page.get_by_role("button", name="Close viewer").click()

    for label, ts, shot in [("X-ray Chest", "JPEG 2000", "06_xray_j2k"), ("Ultrasound Abdomen", "multi-frame", "07_us_multiframe"), ("CT Abdomen", "CT 2 series", "08_ct")]:
        page.locator("[data-testid=study-card]", has_text=label).get_by_role("button", name="View").click()
        page.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000)
        page.wait_for_timeout(5000)
        lit = canvas_has_image(page); err = page.locator("[data-testid=viewer-error]").count()
        ind = page.locator("[data-testid=slice-indicator]").inner_text()
        check(f"{label} renders ({ts})", lit > 50 and err == 0, f"{ind}, lit={lit}, err={err}")
        if label == "Ultrasound Abdomen": check("Multi-frame exposes 24 frames", "/ 24" in ind, ind)
        page.screenshot(path=f"{OUT}/{shot}.png")
        page.get_by_role("button", name="Close viewer").click()

    # Original download from the patient's account
    with page.expect_download(timeout=60000) as dl:
        page.locator("[data-testid=study-card]", has_text="MRI Brain").get_by_role("button", name="Original").click()
    path = dl.value.path()
    import zipfile, hashlib
    z = zipfile.ZipFile(path); names = z.namelist()
    orig_hashes = {hashlib.sha256(open(f, "rb").read()).hexdigest() for f in glob.glob(f"{FIX}/mri_brain/*")}
    zip_hashes = {hashlib.sha256(z.read(n)).hexdigest() for n in names}
    check("Patient downloads original MRI ZIP (64 files, byte-identical)", len(names) == 64 and zip_hashes == orig_hashes, f"{len(names)} files")

    # Share imaging
    page.get_by_role("button", name="Share imaging").click()
    page.get_by_label("Include MRI Brain").check()
    page.get_by_text("Allow the doctor to download the original files").click()
    page.get_by_role("button", name="Create link").click()
    page.wait_for_selector("code", timeout=15000)
    link = page.locator("[role=dialog] code").inner_text()
    check("Share imaging link created", "/share/" in link, link)
    page.screenshot(path=f"{OUT}/09_share_link.png")

    # Doctor in a separate browser
    doc = browser.new_context(viewport={"width": 1440, "height": 950})
    dpage = doc.new_page()
    dpage.goto(link)
    dpage.wait_for_timeout(1500)
    for name in ("Reject", "Accept"):
        if dpage.get_by_role("button", name=name).count(): dpage.get_by_role("button", name=name).first.click(); break
    accept = "I Accept"
    dpage.get_by_role("button", name=accept).click()
    dpage.wait_for_selector("[data-testid=shared-imaging]", timeout=20000)
    check("Doctor sees Imaging section in Share Brief", True)
    dpage.click("[data-testid=open-shared-study]")
    dpage.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000)
    dpage.wait_for_function("document.querySelector('[data-testid=slice-indicator]')?.textContent?.includes('/ 24')", timeout=60000)
    dpage.wait_for_timeout(3000)
    lit = canvas_has_image(dpage)
    check("Doctor views actual DICOM in browser (no account)", lit > 50, f"lit={lit}")
    dpage.locator("[data-testid=viewport]").click()
    i1 = dpage.locator("[data-testid=slice-indicator]").inner_text()
    for _ in range(2): dpage.keyboard.press("ArrowDown")
    dpage.wait_for_timeout(800)
    i2 = dpage.locator("[data-testid=slice-indicator]").inner_text()
    check("Doctor scrolls slices", i1.split("·")[0] != i2.split("·")[0], f"{i1} -> {i2}")
    dpage.locator("[data-testid=series-button]", has_text="FLAIR").click()
    dpage.wait_for_timeout(3500)
    check("Doctor changes series", "/ 16" in dpage.locator("[data-testid=slice-indicator]").inner_text())
    dpage.screenshot(path=f"{OUT}/10_doctor_viewer.png")
    with dpage.expect_download(timeout=60000) as ddl:
        dpage.locator("[data-testid=shared-imaging]").get_by_role("button", name="Download original").first.click()
    dz = zipfile.ZipFile(ddl.value.path())
    check("Doctor downloads original (permitted)", len(dz.namelist()) == 64)

    # Second person with the same link is refused
    other = browser.new_context().new_page()
    other.goto(link); other.wait_for_timeout(1500)
    for name in ("Reject", "Accept"):
        if other.get_by_role("button", name=name).count(): other.get_by_role("button", name=name).first.click(); break
    if accept and other.get_by_role("button", name=accept).count(): other.get_by_role("button", name=accept).first.click()
    other.wait_for_timeout(4000)
    check("Second person cannot open used link", other.locator("[data-testid=shared-imaging]").count() == 0 and other.locator("[data-testid=dicom-viewer]").count() == 0)

    # Revoke while doctor is viewing
    page.get_by_role("button", name="Revoke access").click()
    t0 = time.time()
    gone = False
    while time.time() - t0 < 12:
        if dpage.locator("[data-testid=dicom-viewer]").count() == 0: gone = True; break
        dpage.wait_for_timeout(250)
    check("Revocation closes the doctor's open viewer", gone, f"{time.time() - t0:.1f}s")
    dpage.screenshot(path=f"{OUT}/11_doctor_after_revoke.png")

    # Mobile
    m = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mp = m.new_page()
    mp.goto(f"{APP}/auth"); mp.wait_for_timeout(1200)
    for btn in ("Reject", "Accept"):
        if mp.get_by_role("button", name=btn).count(): mp.get_by_role("button", name=btn).first.click(); break
    mp.locator("input[type=email]").fill(email); mp.locator("input[type=password]").fill(password)
    mp.get_by_role("button", name="Sign In", exact=True).last.click()
    mp.wait_for_url("**/app**", timeout=20000); mp.wait_for_timeout(1500)
    mp.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'imaging'}))")
    mp.wait_for_selector("[data-testid=study-card]", timeout=15000)
    mp.screenshot(path=f"{OUT}/12_mobile_vault.png", full_page=True)
    mp.locator("[data-testid=study-card]", has_text="CT Abdomen").get_by_role("button", name="View").click()
    mp.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000); mp.wait_for_timeout(5000)
    lit = canvas_has_image(mp)
    overflow = mp.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
    check("Mobile viewer renders without horizontal overflow", lit > 50 and not overflow, f"lit={lit} overflow={overflow}")
    mp.screenshot(path=f"{OUT}/13_mobile_viewer.png")

    check("No uncaught page errors", not errors, "; ".join(errors[:3]))
    browser.close()

failed = [r for r in results if not r[1]]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
