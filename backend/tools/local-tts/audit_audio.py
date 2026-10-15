"""Programmatic audio audit for generated narration clips (no subjective judgement).

  python audit_audio.py <manifest.json> <report.json>

manifest: [{"file": "...mp3", "key": "..."}]. For every clip: decode, then record sample rate, channels, decoded duration,
peak, RMS and the fraction of near-silent 50 ms windows, so the caller can check validity, duration and silence.
"""
import json
import sys

import numpy as np
import soundfile as sf


def main():
    items = json.load(open(sys.argv[1], encoding="utf8"))
    out = []
    for it in items:
        try:
            data, sr = sf.read(it["file"], dtype="float32", always_2d=True)
            channels = data.shape[1]
            mono = data.mean(axis=1)
            w = max(1, int(sr * 0.05))
            n = max(1, len(mono) // w)
            energy = np.array([np.sqrt(np.mean(mono[i * w:(i + 1) * w] ** 2)) for i in range(n)])
            out.append({"key": it["key"], "ok": True, "sampleRate": int(sr), "channels": int(channels), "durationMs": int(round(len(mono) / sr * 1000)),
                        "peak": float(np.abs(mono).max()), "rms": float(np.sqrt(np.mean(mono ** 2))), "silentFraction": float((energy < 0.005).mean())})
        except Exception as exc:
            out.append({"key": it["key"], "ok": False, "error": str(exc)[:200]})
    json.dump(out, open(sys.argv[2], "w", encoding="utf8"))
    print(f"audited {len(out)} clips")


if __name__ == "__main__":
    main()
