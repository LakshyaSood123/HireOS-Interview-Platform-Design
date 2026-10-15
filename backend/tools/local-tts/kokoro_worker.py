"""Local, offline Kokoro-82M text-to-speech worker.

Spawned by the backend (LocalKokoroNarrationProvider) ONLY when an admin generates narration. It never listens on a socket:
the protocol is newline-delimited JSON over stdin/stdout, one request per line and one response per line, so there is no
port to expose and the browser can never reach it.

  request : {"id": "...", "op": "ping" | "generate" | "shutdown", ...}
  generate: {"id","op":"generate","text","voice","speed","format":"mp3"|"wav"}
  response: {"id","ok":true,...} or {"id","ok":false,"error":"..."}

The model is loaded ONCE (first request) and reused for every step. Nothing here touches the network: the Hugging Face hub is
forced offline and every non-loopback socket connection is refused, so generation provably makes zero external calls.
stdout carries ONLY protocol lines; all library chatter is redirected to stderr.
"""

import os

# Offline BEFORE any library import (they read these at import time).
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["PYTHONUNBUFFERED"] = "1"

import argparse
import base64
import io
import json
import socket
import sys
import time

# Reserve the real stdout for the protocol; anything a library prints goes to stderr.
_PROTOCOL = sys.stdout
sys.stdout = sys.stderr


def _block_network():
    """Refuse every outbound connection that is not loopback."""
    real_connect = socket.socket.connect
    real_connect_ex = socket.socket.connect_ex

    def allowed(address):
        host = address[0] if isinstance(address, tuple) else address
        return isinstance(host, str) and (host in ("127.0.0.1", "::1", "localhost") or host.startswith("/"))

    def guarded(self, address):
        if not allowed(address):
            raise OSError("network access is disabled in the local narration worker")
        return real_connect(self, address)

    def guarded_ex(self, address):
        if not allowed(address):
            return 10013
        return real_connect_ex(self, address)

    socket.socket.connect = guarded
    socket.socket.connect_ex = guarded_ex


_block_network()

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

SAMPLE_RATE = 24000


def _network_is_blocked():
    """True when an outbound (non-loopback) connection attempt is refused, as it must be."""
    try:
        socket.create_connection(("1.1.1.1", 443), timeout=1).close()
        return False
    except OSError:
        return True


def send(obj):
    _PROTOCOL.write(json.dumps(obj, separators=(",", ":")) + "\n")
    _PROTOCOL.flush()


class Engine:
    def __init__(self, model_dir, device):
        self.model_dir = os.path.abspath(model_dir)
        self.device = device
        self.kmodel = None
        self.pipelines = {}
        self.load_ms = None

    def load(self):
        if self.kmodel is not None:
            return
        started = time.time()
        import torch
        from kokoro import KModel

        config = os.path.join(self.model_dir, "config.json")
        weights = os.path.join(self.model_dir, "kokoro-v1_0.pth")
        for path in (config, weights):
            if not os.path.isfile(path):
                raise FileNotFoundError("missing model file: " + os.path.basename(path))
        device = self.device
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.kmodel = KModel(config=config, model=weights, repo_id="hexgrad/Kokoro-82M").to(device).eval()
        self.load_ms = int((time.time() - started) * 1000)

    def pipeline(self, voice):
        from kokoro import KPipeline

        lang = voice[0]  # 'a' = American English, 'b' = British English
        if lang not in ("a", "b"):
            raise ValueError("unsupported voice " + voice)
        if lang not in self.pipelines:
            self.pipelines[lang] = KPipeline(lang_code=lang, model=self.kmodel, repo_id="hexgrad/Kokoro-82M")
        return self.pipelines[lang]

    def voices(self):
        vdir = os.path.join(self.model_dir, "voices")
        return sorted(f[:-3] for f in os.listdir(vdir) if f.endswith(".pt")) if os.path.isdir(vdir) else []

    def generate(self, text, voice, speed, fmt, seed=None):
        self.load()
        if seed is not None:
            # The decoder draws random noise; a per-text seed makes the same text + voice + speed reproducible.
            import torch

            torch.manual_seed(int(seed) & 0x7FFFFFFF)
        voice_file = os.path.join(self.model_dir, "voices", voice + ".pt")
        if not os.path.isfile(voice_file):
            raise ValueError("unknown voice " + voice)
        started = time.time()
        chunks = []
        pipeline = self.pipeline(voice)
        for _graphemes, _phonemes, audio in pipeline(text, voice=voice_file, speed=speed, split_pattern=r"\n+"):
            if audio is not None:
                chunks.append(audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio))
        if not chunks:
            raise RuntimeError("the model produced no audio")
        audio = np.concatenate(chunks).astype(np.float32)
        peak = float(np.max(np.abs(audio)))
        rms = float(np.sqrt(np.mean(np.square(audio))))
        pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype(np.int16)
        buf = io.BytesIO()
        if fmt == "mp3":
            # compression_level 0.75 selects ~48 kbit/s constant bitrate at 24 kHz mono (0.7 = 56, 0.8 = 40); the backend
            # measures the real bitrate and duration from the MP3 frames.
            with sf.SoundFile(buf, mode="w", samplerate=SAMPLE_RATE, channels=1, format="MP3", subtype="MPEG_LAYER_III", bitrate_mode="CONSTANT", compression_level=0.75) as f:
                f.write(pcm)
        else:
            sf.write(buf, pcm, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        data = buf.getvalue()
        return {
            "format": fmt,
            "sampleRate": SAMPLE_RATE,
            "channels": 1,
            "samples": int(pcm.shape[0]),
            "pcmDurationMs": int(round(pcm.shape[0] / SAMPLE_RATE * 1000)),
            "peak": round(peak, 4),
            "rmsDbfs": round(20 * np.log10(max(rms, 1e-9)), 1),
            "segments": len(chunks),
            "elapsedMs": int((time.time() - started) * 1000),
            "audioBase64": base64.b64encode(data).decode("ascii"),
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda", "auto"])
    args = parser.parse_args()
    engine = Engine(args.model_dir, args.device)
    send({"event": "worker-started", "python": sys.version.split()[0]})
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            op = req.get("op")
            if op == "ping":
                engine.load()
                import torch

                send({"id": req_id, "ok": True, "ready": True, "networkBlocked": _network_is_blocked(), "model": "Kokoro-82M", "device": engine.device, "loadMs": engine.load_ms, "voices": engine.voices(), "torch": torch.__version__, "python": sys.version.split()[0]})
            elif op == "generate":
                text = req.get("text")
                if not isinstance(text, str) or not text.strip():
                    raise ValueError("text is required")
                speed = float(req.get("speed", 1.0))
                if not 0.5 <= speed <= 2.0:
                    raise ValueError("speed must be between 0.5 and 2.0")
                fmt = req.get("format", "mp3")
                if fmt not in ("mp3", "wav"):
                    raise ValueError("format must be mp3 or wav")
                out = engine.generate(text, str(req.get("voice", "")), speed, fmt, req.get("seed"))
                send({"id": req_id, "ok": True, **out})
            elif op == "shutdown":
                send({"id": req_id, "ok": True})
                break
            else:
                raise ValueError("unknown op")
        except Exception as exc:  # one bad request must never kill the worker
            send({"id": req_id, "ok": False, "error": (type(exc).__name__ + ": " + str(exc))[:400]})


if __name__ == "__main__":
    main()
