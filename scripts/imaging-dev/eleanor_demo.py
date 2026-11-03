"""Local-only demo: fictional Eleanor Morgan lumbar MRI through the imaging vault and doctor share.
Synthetic data only. Runs against the LOCAL stack (127.0.0.1)."""
import json, os, sys, time, uuid, urllib.request, glob, subprocess, io
from playwright.sync_api import sync_playwright
from PIL import Image

APP = "http://127.0.0.1:8080"; API = "http://127.0.0.1:54321"
SERVICE = os.environ["LOCAL_SERVICE_KEY"]
STUDY = os.environ["STUDY_DIR"]; OUT = os.environ["OUT"]
os.makedirs(OUT, exist_ok=True)

def admin(path, body):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST",
        headers={"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def psql(sql):
    return subprocess.check_output(["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-At", "-c", sql], env={**os.environ, "PGPASSWORD": "postgres"}).decode().strip()

def lit(page):
    el = page.locator("[data-testid=viewport]")
    img = Image.open(io.BytesIO(el.screenshot())).convert("L").resize((200, 200))
    return sum(1 for v in img.getdata() if v > 40)

email = f"eleanor-demo-{uuid.uuid4().hex[:6]}@example.test"; pw = "Synthetic-" + uuid.uuid4().hex
u = admin("/auth/v1/admin/users", {"email": email, "password": pw, "email_confirm": True, "user_metadata": {"full_name": "Eleanor Morgan (demo)"}})
psql(f"update profiles set full_name='Eleanor Morgan (demo)', comped_plan='standard', comped_until=now()+interval '30 days', nationality='British', emergency_contact_name='James Morgan', emergency_contact_phone='+44 7700 900123' where id='{u['id']}'")

with sync_playwright() as p:
    br = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    pg = br.new_context(viewport={"width": 1440, "height": 900}).new_page()
    pg.goto(f"{APP}/auth"); pg.wait_for_timeout(1500)
    for b in ("Reject", "Accept"):
        if pg.get_by_role("button", name=b).count(): pg.get_by_role("button", name=b).first.click(); break
    pg.locator("input[type=email]").fill(email); pg.locator("input[type=password]").fill(pw)
    pg.get_by_role("button", name="Sign In", exact=True).last.click()
    pg.wait_for_url("**/app**", timeout=20000); pg.wait_for_timeout(2500)
    for n in ("Skip", "Skip for now", "Close"):
        if pg.get_by_role("button", name=n).count(): pg.get_by_role("button", name=n).first.click(); pg.wait_for_timeout(400)
    pg.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'imaging'}))")
    pg.wait_for_selector("[data-testid=imaging-vault]", timeout=15000)
    pg.click("[data-testid=add-imaging]")
    pg.set_input_files("[data-testid=imaging-file-input]", sorted(glob.glob(f"{STUDY}/*/*")))
    pg.wait_for_selector("[data-testid=study-preview]", timeout=60000)
    print("preview:", pg.locator("[data-testid=study-preview]").all_inner_texts())
    pg.screenshot(path=f"{OUT}/01_upload_preview.png")
    pg.click("[data-testid=start-upload]")
    pg.wait_for_selector("[data-testid=upload-done]", timeout=180000)
    print("done:", pg.locator("[data-testid=upload-done]").inner_text().replace("\n", " ")[:160])
    pg.get_by_role("button", name="Done").click(); pg.wait_for_timeout(1500)
    pg.screenshot(path=f"{OUT}/02_vault.png", full_page=True)
    card = pg.locator("[data-testid=study-card]").first
    print("card:", card.inner_text().replace("\n", " | "))
    card.get_by_role("button", name="View").click()
    pg.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000)
    pg.wait_for_function("document.querySelector('[data-testid=slice-indicator]')?.textContent?.includes('/ 15')", timeout=60000)
    pg.wait_for_timeout(2500)
    pg.locator("[data-testid=viewport]").click()
    for _ in range(3): pg.keyboard.press("ArrowDown")  # move towards the left side (L4/5 protrusion)
    pg.wait_for_timeout(1200)
    print("patient viewer:", pg.locator("[data-testid=slice-indicator]").inner_text(), "lit", lit(pg))
    pg.screenshot(path=f"{OUT}/03_patient_viewer_sag.png")
    pg.locator("[data-testid=series-button]", has_text="AX").click(); pg.wait_for_timeout(3500)
    pg.locator("[data-testid=viewport]").click()
    for _ in range(5): pg.keyboard.press("ArrowDown")
    pg.wait_for_timeout(1200)
    print("axial:", pg.locator("[data-testid=slice-indicator]").inner_text(), "lit", lit(pg))
    pg.screenshot(path=f"{OUT}/04_patient_viewer_axial.png")
    pg.get_by_role("button", name="Close viewer").click(); pg.wait_for_timeout(800)

    pg.get_by_role("button", name="Share imaging").click()
    pg.locator("[role=dialog] input[type=checkbox]").first.check()
    pg.get_by_text("Allow the doctor to download the original files").click()
    pg.screenshot(path=f"{OUT}/05_share_options.png")
    pg.get_by_role("button", name="Create link").click()
    pg.wait_for_selector("[role=dialog] code", timeout=15000)
    link = pg.locator("[role=dialog] code").inner_text(); print("link ok", "/share/" in link)
    pg.screenshot(path=f"{OUT}/06_share_link.png")

    d = br.new_context(viewport={"width": 1440, "height": 950}).new_page()
    d.goto(link); d.wait_for_timeout(1500)
    for b in ("Reject", "Accept"):
        if d.get_by_role("button", name=b).count(): d.get_by_role("button", name=b).first.click(); break
    d.get_by_role("button", name="I Accept").click()
    d.wait_for_selector("[data-testid=shared-imaging]", timeout=20000)
    d.locator("[data-testid=shared-imaging]").scroll_into_view_if_needed(); d.wait_for_timeout(800)
    d.screenshot(path=f"{OUT}/07_doctor_imaging_section.png")
    d.click("[data-testid=open-shared-study]")
    d.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000)
    d.wait_for_function("document.querySelector('[data-testid=slice-indicator]')?.textContent?.includes('/ 15')", timeout=60000)
    d.wait_for_timeout(2500)
    d.locator("[data-testid=viewport]").click()
    for _ in range(3): d.keyboard.press("ArrowDown")
    d.wait_for_timeout(1200)
    print("doctor viewer:", d.locator("[data-testid=slice-indicator]").inner_text(), "lit", lit(d))
    d.screenshot(path=f"{OUT}/08_doctor_viewer.png")
    with d.expect_download(timeout=60000) as dl:
        d.locator("[data-testid=shared-imaging]").get_by_role("button", name="Download original").first.click()
    import zipfile
    z = zipfile.ZipFile(dl.value.path()); print("doctor download files:", len(z.namelist()))
    d.get_by_role("button", name="Close viewer").click() if d.get_by_role("button", name="Close viewer").count() else None

    m = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page()
    m.goto(f"{APP}/auth"); m.wait_for_timeout(1200)
    for b in ("Reject", "Accept"):
        if m.get_by_role("button", name=b).count(): m.get_by_role("button", name=b).first.click(); break
    m.locator("input[type=email]").fill(email); m.locator("input[type=password]").fill(pw)
    m.get_by_role("button", name="Sign In", exact=True).last.click()
    m.wait_for_url("**/app**", timeout=20000); m.wait_for_timeout(1500)
    m.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'imaging'}))")
    m.wait_for_selector("[data-testid=study-card]", timeout=15000)
    m.locator("[data-testid=study-card]").first.get_by_role("button", name="View").click()
    m.wait_for_selector("[data-testid=dicom-viewer]", timeout=30000); m.wait_for_timeout(5000)
    print("mobile lit", lit(m))
    m.screenshot(path=f"{OUT}/09_mobile_viewer.png")
    br.close()
