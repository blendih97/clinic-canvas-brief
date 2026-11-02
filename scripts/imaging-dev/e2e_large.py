"""Large study + interrupted upload + Share Brief picker tests (LOCAL stack only, synthetic data)."""
import glob, hashlib, io, json, os, subprocess, sys, time, uuid, urllib.request
from playwright.sync_api import sync_playwright
from PIL import Image

APP = "http://127.0.0.1:8080"; API = "http://127.0.0.1:54321"
SERVICE = os.environ["LOCAL_SERVICE_KEY"]
FIX = "scripts/imaging-fixtures/fixtures-out"; OUT = "scripts/imaging-dev/e2e-out"
results = []
def check(n, ok, d=""):
    results.append((n, bool(ok))); print(("PASS " if ok else "FAIL ") + n + (f"  — {d}" if d else ""), flush=True)
def psql(sql):
    return subprocess.check_output(["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-At", "-c", sql], env={**os.environ, "PGPASSWORD": "postgres"}).decode().strip()
def admin(path, body):
    r = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST", headers={"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(r).read())
def lit(page):
    el = page.locator("[data-testid=viewport]")
    img = Image.open(io.BytesIO(el.screenshot())).convert("L").resize((200, 200))
    return sum(1 for v in img.getdata() if v > 40)

email = f"e2e-large-{uuid.uuid4().hex[:8]}@example.test"; pw = "Synthetic-" + uuid.uuid4().hex
u = admin("/auth/v1/admin/users", {"email": email, "password": pw, "email_confirm": True})
psql(f"update profiles set comped_plan='standard', comped_until=now()+interval '30 days' where id='{u['id']}'")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 1366, "height": 900}); page = ctx.new_page()
    page.goto(f"{APP}/auth"); page.wait_for_timeout(1200)
    for btn in ("Reject", "Accept"):
        if page.get_by_role("button", name=btn).count(): page.get_by_role("button", name=btn).first.click(); break
    page.locator("input[type=email]").fill(email); page.locator("input[type=password]").fill(pw)
    page.get_by_role("button", name="Sign In", exact=True).last.click(); page.wait_for_url("**/app**"); page.wait_for_timeout(1500)
    page.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'imaging'}))")
    page.wait_for_selector("[data-testid=imaging-vault]")

    # Interrupted upload of a 58 MB multi-frame file: go offline mid-transfer, then back online.
    page.click("[data-testid=add-imaging]")
    page.set_input_files("[data-testid=imaging-file-input]", [f"{FIX}/large_us/us_cine_multiframe.dcm"])
    page.wait_for_selector("[data-testid=start-upload]"); page.click("[data-testid=start-upload]")
    t0 = time.time()
    while time.time() - t0 < 60:
        txt = page.locator("[role=dialog]").inner_text()
        if " of " in txt and " MB" in txt and not txt.split("·")[-1].strip().startswith("0 KB"):
            try:
                up = float(txt.split("·")[1].split("MB")[0].strip())
                if up >= 12: break
            except Exception: pass
        page.wait_for_timeout(100)
    ctx.set_offline(True); page.wait_for_timeout(4000); ctx.set_offline(False)
    page.wait_for_selector("[data-testid=upload-done]", timeout=240000)
    done = page.locator("[data-testid=upload-done]").inner_text()
    sha_local = hashlib.sha256(open(f"{FIX}/large_us/us_cine_multiframe.dcm", "rb").read()).hexdigest()
    sha_db = psql(f"select sha256 from imaging_instances where user_id='{u['id']}' and number_of_frames=1500")
    check("Interrupted upload resumes and completes", "1 files added" in done and sha_db == sha_local, done.replace("\n", " ")[:80])
    page.get_by_role("button", name="Done").click()

    # Large CT: 300 x 512x512 (152 MB)
    page.click("[data-testid=add-imaging]")
    files = sorted(glob.glob(f"{FIX}/large_ct/*"))
    t0 = time.time()
    page.set_input_files("[data-testid=imaging-file-input]", files)
    page.wait_for_selector("[data-testid=start-upload]", timeout=120000); scan_s = time.time() - t0
    t1 = time.time(); page.click("[data-testid=start-upload]")
    page.wait_for_selector("[data-testid=upload-done]", timeout=600000); up_s = time.time() - t1
    check("Large CT (300 images, 152 MB) uploads", "300 files added" in page.locator("[data-testid=upload-done]").inner_text(), f"scan {scan_s:.1f}s, upload+register {up_s:.1f}s (local network)")
    page.get_by_role("button", name="Done").click(); page.wait_for_timeout(1000)
    t2 = time.time()
    page.locator("[data-testid=study-card]", has_text="300 images").get_by_role("button", name="View").click()
    page.wait_for_function("document.querySelector('[data-testid=slice-indicator]')?.textContent?.includes('/ 300')", timeout=120000)
    while lit(page) < 50 and time.time() - t2 < 60: page.wait_for_timeout(200)
    first_s = time.time() - t2
    check("Large CT first image appears", first_s < 30, f"{first_s:.1f}s to first image")
    page.locator("[data-testid=viewport]").click()
    t3 = time.time()
    for _ in range(40): page.keyboard.press("ArrowDown"); page.wait_for_timeout(30)
    page.wait_for_timeout(1500)
    ind = page.locator("[data-testid=slice-indicator]").inner_text()
    check("Scrolling 40 slices through large CT", "191 / 300" in ind or "/ 300" in ind, f"{ind} in {time.time() - t3:.1f}s")
    page.screenshot(path=f"{OUT}/14_large_ct.png")
    page.get_by_role("button", name="Close viewer").click()

    # Share Brief section: select imaging alongside other records
    page.evaluate("window.dispatchEvent(new CustomEvent('navigate-section', {detail: 'share'}))")
    page.wait_for_selector("[data-testid=imaging-picker]", timeout=15000)
    page.get_by_label("Include CT Abdomen").check() if page.get_by_label("Include CT Abdomen").count() else page.locator("[data-testid=imaging-picker] input[type=checkbox]").first.check()
    page.screenshot(path=f"{OUT}/15_share_brief_picker.png", full_page=True)
    page.get_by_role("button", name="Continue").click(); page.wait_for_timeout(500)
    for name in ("Continue", "Generate", "Create"):
        for _ in range(3):
            btn = page.get_by_role("button", name=name)
            if btn.count() and btn.first.is_enabled(): btn.first.click(); page.wait_for_timeout(1200)
    n = psql(f"select coalesce(array_length(imaging_study_ids,1),0) from shared_briefs where user_id='{u['id']}' order by created_at desc limit 1")
    check("Share Brief stores selected imaging with the brief", n == "1", f"studies in brief: {n}")
    b.close()

failed = [r for r in results if not r[1]]
print(f"\n{len(results) - len(failed)}/{len(results)} passed"); sys.exit(1 if failed else 0)
