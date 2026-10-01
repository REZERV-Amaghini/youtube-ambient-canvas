"""Reproducible store/source archives. Python 3.9+, standard library only."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
VERSION = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
EXTENSION_FILES = ["settings-store.js", "black-bar-detector.js", "renderer.js", "gpu-renderer.js", "flash-monitor.js", "worker-client.js",
                   "worker-host.html", "worker-host.js", "ambient-worker.js", "ambient.js", "ambient.css", "LICENSE"] + [
    f"assets/icon-{size}.png" for size in (16, 32, 48, 96, 128)
]
SOURCE_FILES = ["manifest.json", "README.md", "PRIVACY.md", "CONTRIBUTING.md", "assets/preview-hardwell-ja.gif",
                "LICENSE", ".gitignore", "package.json", "scripts/build.py",
                "scripts/create_assets.py", "tests/fixture.html",
                "tests/server.cjs", "tests/check-renderer.js", "tests/check-flash-monitor.cjs", "tests/check-black-bars.cjs",
                "tests/check-worker.cjs", "tests/check-gpu.cjs", "tests/check-settings.cjs", "tests/check-ambient.cjs", "tests/check-projection.cjs",
                "tests/check-surfaces.cjs", "tests/check-frame-pacing.cjs", "tests/check-scroll-blur.cjs",
                "tests/firefox-check.html", "tests/chat-fixture.html", "tests/gpu-fixture.html", "tests/check-gpu-browser.js",
                "tests/control-fixture.html", "tests/check-control-pixels.py"]


def archive(name, entries):
    target = DIST / name
    if target.parent.resolve() != DIST.resolve():
        raise ValueError("Output must remain in dist")
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for filename, content in sorted(entries.items()):
            info = zipfile.ZipInfo(filename, (2026, 9, 30, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            output.writestr(info, content)
    with zipfile.ZipFile(target) as output:
        assert output.testzip() is None
    return {"file": name, "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}


def main():
    DIST.mkdir(exist_ok=True)
    base = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    entries = {name: (ROOT / name).read_bytes() for name in EXTENSION_FILES}
    reports = []
    for browser in ("chrome", "firefox"):
        manifest = json.loads(json.dumps(base))
        if browser == "chrome":
            del manifest["browser_specific_settings"]
            manifest["minimum_chrome_version"] = "109"
        package = {**entries, "manifest.json": (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode()}
        reports.append(archive(f"youtube-ambient-canvas-{browser}-{VERSION}.zip", package))
        folder = DIST / browser
        folder.mkdir(exist_ok=True)
        for name, content in package.items():
            destination = folder / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
    public_files = list(dict.fromkeys(SOURCE_FILES + EXTENSION_FILES +
        [p.relative_to(ROOT).as_posix() for p in sorted((ROOT / "docs").glob("*.md"))] +
        [p.relative_to(ROOT).as_posix() for p in sorted((ROOT / "assets").glob("store-*.png"))]))
    reports.append(archive(f"youtube-ambient-canvas-source-{VERSION}.zip",
        {name: (ROOT / name).read_bytes() for name in public_files}))
    store = {p.name: p.read_bytes() for p in sorted((ROOT / "assets").glob("store-*.png"))}
    store["icon-128.png"] = (ROOT / "assets/icon-128.png").read_bytes()
    store["LISTING.md"] = (ROOT / "docs/LISTING.md").read_bytes()
    reports.append(archive(f"youtube-ambient-canvas-store-assets-{VERSION}.zip", store))
    (DIST / "SHA256SUMS.txt").write_text("".join(f'{r["sha256"]}  {r["file"]}\n' for r in reports), encoding="utf-8")
    print(json.dumps(reports, indent=2))


if __name__ == "__main__":
    main()
