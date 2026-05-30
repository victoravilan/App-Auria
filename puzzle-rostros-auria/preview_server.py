from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == "/":
            clean = "/emotion-preview.html"
        if clean.startswith(("/images/", "/videos/")):
            return str(PUBLIC / clean.lstrip("/"))
        if clean in {"/icon-512.png", "/manifest.webmanifest", "/sw.js"}:
            return str(PUBLIC / clean.lstrip("/"))
        return str(ROOT / clean.lstrip("/"))


if __name__ == "__main__":
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 5173), Handler)
    print("Preview running at http://127.0.0.1:5173/emotion-preview.html")
    server.serve_forever()
