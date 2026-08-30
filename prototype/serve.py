"""Prototype static server — JS/CSS/HTML에 Cache-Control: no-store (모듈 캐시로 named export 불일치 재발 방지)."""

from __future__ import annotations

import argparse
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        path = self.path.split("?", 1)[0]
        if path.endswith((".js", ".css", ".html", ".mjs")):
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        if args and str(args[0]).startswith(("4", "5")):
            super().log_message(format, *args)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    server = ThreadingHTTPServer(("0.0.0.0", args.port), NoCacheHandler)
    # Ctrl+C / 프로세스 종료 시 요청 스레드가 남기지 않음
    server.daemon_threads = True

    print(f"Serving {ROOT} at http://127.0.0.1:{args.port}/ (no-store for js/css/html)", flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nStopping...", flush=True)
    finally:
        try:
            server.shutdown()
        except Exception:
            pass
        server.server_close()
        print("Stopped.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
