/**
 * Minimal MP3 inspector: the REAL playing time of an MP3 buffer, measured from its frames (never estimated from text).
 * Handles ID3v2 tags, CBR and VBR streams, MPEG-1/2/2.5 Layer III, and skips a Xing/Info header frame (it carries no audio).
 */

const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SAMPLE_RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

export interface Mp3Info {
  durationMs: number;
  frames: number;
  sampleRate: number;
  /** Average bitrate over the whole stream, kbit/s. */
  bitrateKbps: number;
  channels: 1 | 2;
}

/** Returns null when the buffer is not a decodable MP3 stream (no frames found, or trailing junk makes up most of it). */
export function inspectMp3(buf: Buffer): Mp3Info | null {
  let pos = 0;
  if (buf.length >= 10 && buf.toString("latin1", 0, 3) === "ID3") {
    const size = ((buf[6]! & 0x7f) << 21) | ((buf[7]! & 0x7f) << 14) | ((buf[8]! & 0x7f) << 7) | (buf[9]! & 0x7f);
    pos = 10 + size;
  }
  let frames = 0;
  let samples = 0;
  let audioBytes = 0;
  let sampleRate = 0;
  let channels: 1 | 2 = 2;
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff || (buf[pos + 1]! & 0xe0) !== 0xe0) {
      pos++; // resync
      continue;
    }
    const versionBits = (buf[pos + 1]! >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layerBits = (buf[pos + 1]! >> 1) & 3; // 1 = Layer III
    const bitrateIdx = (buf[pos + 2]! >> 4) & 15;
    const srIdx = (buf[pos + 2]! >> 2) & 3;
    const padding = (buf[pos + 2]! >> 1) & 1;
    if (versionBits === 1 || layerBits !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || srIdx === 3) {
      pos++;
      continue;
    }
    const mpeg1 = versionBits === 3;
    const bitrate = (mpeg1 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIdx]! * 1000;
    const rate = SAMPLE_RATES[versionBits]![srIdx]!;
    const frameLen = Math.floor(((mpeg1 ? 144 : 72) * bitrate) / rate) + padding;
    if (pos + frameLen > buf.length + 1) break; // truncated last frame
    const samplesPerFrame = mpeg1 ? 1152 : 576;
    const channelMode = (buf[pos + 3]! >> 6) & 3; // 3 = mono
    const sideInfoOffset = mpeg1 ? (channelMode === 3 ? 17 : 32) : channelMode === 3 ? 9 : 17;
    const tag = buf.toString("latin1", pos + 4 + sideInfoOffset, pos + 8 + sideInfoOffset);
    const isInfoFrame = frames === 0 && (tag === "Xing" || tag === "Info");
    if (!isInfoFrame) {
      frames++;
      samples += samplesPerFrame;
      audioBytes += frameLen;
      sampleRate = rate;
      channels = channelMode === 3 ? 1 : 2;
    }
    pos += frameLen;
  }
  if (frames === 0 || sampleRate === 0) return null;
  const seconds = samples / sampleRate;
  // A stream whose frames cover far less than the buffer is not a clean MP3 (e.g. an HTML error page that happened to match).
  if (audioBytes < buf.length * 0.5) return null;
  return { durationMs: Math.round(seconds * 1000), frames, sampleRate, bitrateKbps: Math.round((audioBytes * 8) / seconds / 1000), channels };
}
