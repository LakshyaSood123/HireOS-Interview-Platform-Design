// Test double for tools/local-tts/kokoro_worker.py: same newline-delimited JSON protocol, no model. The text selects the behaviour.
import { createInterface } from "node:readline";

const frame = () => {
  const b = Buffer.alloc(156); // MPEG-1 Layer III, 48 kbit/s, 44.1 kHz, mono => 26.12 ms per frame
  b.set([0xff, 0xfb, 0x30, 0xc0], 0);
  return b;
};
const mp3 = (frames) => Buffer.concat(Array.from({ length: frames }, frame));
const send = (o) => process.stdout.write(JSON.stringify(o) + "\n");
let loaded = false;
send({ event: "worker-started", python: "fake" });

for await (const line of createInterface({ input: process.stdin })) {
  const req = JSON.parse(line);
  if (req.op === "shutdown") { send({ id: req.id, ok: true }); break; }
  if (!loaded) { loaded = true; } // first request "loads the model"
  if (req.op === "ping") { send({ id: req.id, ok: true, ready: true, networkBlocked: true, model: "Kokoro-82M", device: "cpu", loadMs: 1, voices: ["af_heart"], pid: process.pid }); continue; }
  const text = req.text ?? "";
  if (text.includes("CRASH")) process.exit(3);
  if (text.includes("HANG")) continue;
  if (text.includes("ERR")) { send({ id: req.id, ok: false, error: "RuntimeError: boom" }); continue; }
  const frames = 40 + text.length;
  const durationMs = Math.round((frames * 1152 / 44100) * 1000);
  let audio = mp3(frames);
  let pcmDurationMs = durationMs;
  let peak = 0.5;
  if (text.includes("BADAUDIO")) audio = Buffer.from("this is not an mp3 stream");
  if (text.includes("SILENT")) peak = 0;
  if (text.includes("MISMATCH")) pcmDurationMs = durationMs + 5000;
  send({ id: req.id, ok: true, format: req.format, sampleRate: 24000, channels: 1, pcmDurationMs, peak, rmsDbfs: -26, segments: 1, elapsedMs: 5, pid: process.pid, seed: req.seed, voice: req.voice, speed: req.speed, audioBase64: audio.toString("base64") });
}
