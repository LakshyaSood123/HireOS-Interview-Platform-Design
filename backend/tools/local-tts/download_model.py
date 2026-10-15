"""One-time download of the Kokoro-82M model files into a local directory (run by scripts/setupLocalNarration.ts).

Upstream: https://huggingface.co/hexgrad/Kokoro-82M  (license: Apache-2.0, code and weights).
Pinned to a fixed upstream commit so every machine gets identical weights. Resumable and retried because some networks reset
long downloads. This is the ONLY step that touches the network; generation afterwards is fully offline.

  python download_model.py <target-dir> <revision>
"""

import os
import sys
import time

REPO = "hexgrad/Kokoro-82M"
FILES = ["config.json", "kokoro-v1_0.pth", "voices/a*.pt", "voices/b*.pt", "README.md"]  # English (US + UK) voices only


def main():
    target, revision = sys.argv[1], sys.argv[2]
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
    os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "60")
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    from huggingface_hub import snapshot_download

    last = None
    for attempt in range(1, 13):
        try:
            snapshot_download(REPO, revision=revision, local_dir=target, allow_patterns=FILES)
            break
        except Exception as exc:  # network resets are common; the download resumes where it stopped
            last = exc
            print(f"download attempt {attempt} failed ({type(exc).__name__}); retrying", file=sys.stderr)
            time.sleep(5)
    else:
        raise SystemExit(f"download failed: {last}")
    for required in ("config.json", "kokoro-v1_0.pth"):
        if not os.path.isfile(os.path.join(target, required)):
            raise SystemExit(f"missing after download: {required}")
    voices = [f for f in os.listdir(os.path.join(target, "voices")) if f.endswith(".pt")]
    print(f"model ready: {target} ({len(voices)} voices)")


if __name__ == "__main__":
    main()
