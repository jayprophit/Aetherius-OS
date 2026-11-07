/**
 * WAV encoder and decoder utilities.
 *
 * Owned by: aetherius-app-suite
 * Reused by: aetherius-recorder, Poietek audio import.
 */

export interface WavHeader {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  dataSize: number;
}

function hashBytes(data: Uint8Array): string {
  let h1 = 0xdeadbeef ^ data.length;
  let h2 = 0x41c6ce57 ^ data.length;
  let h3 = 0x41c6ce57 ^ (data.length >>> 1);
  let h4 = 0xdeadbeef ^ (data.length >>> 1);
  for (let i = 0; i < data.length; i++) {
    const ch = data[i]!;
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761);
  h3 ^= Math.imul(h4 ^ (h4 >>> 13), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909);
  h4 ^= Math.imul(h3 ^ (h3 >>> 13), 2246822507);
  const pad = (n: number) => ("00000000" + (n >>> 0).toString(16)).slice(-8);
  return `${pad(h1)}${pad(h2)}${pad(h3)}${pad(h4)}${pad(h1 ^ h2)}${pad(h3 ^ h4)}${pad(h1 ^ h3)}${pad(h2 ^ h4)}`;
}

export function encodeWav(samples: Float32Array, format: { sampleRate: number; channels: number; bitDepth: number }): Uint8Array {
  const bitDepth = format.bitDepth;
  if (bitDepth !== 16) {
    throw new Error(`Unsupported bit depth: ${bitDepth}. Only 16-bit WAV is supported.`);
  }

  const dataSize = samples.length * 2;
  const buffer = new Uint8Array(44 + dataSize);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // RIFF header
  const encoder = new TextEncoder();
  encoder.encodeInto("RIFF", new Uint8Array(buffer.buffer, buffer.byteOffset, 4));
  view.setUint32(4, 36 + dataSize, true);
  encoder.encodeInto("WAVE", new Uint8Array(buffer.buffer, buffer.byteOffset + 8, 4));

  // fmt chunk
  encoder.encodeInto("fmt ", new Uint8Array(buffer.buffer, buffer.byteOffset + 12, 4));
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, format.channels, true);
  view.setUint32(24, format.sampleRate, true);
  view.setUint32(28, format.sampleRate * format.channels * 2, true); // byte rate
  view.setUint16(32, format.channels * 2, true); // block align
  view.setUint16(34, bitDepth, true);

  // data chunk
  encoder.encodeInto("data", new Uint8Array(buffer.buffer, buffer.byteOffset + 36, 4));
  view.setUint32(40, dataSize, true);

  // Encode samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, Math.round(intSample), true);
    offset += 2;
  }

  return buffer;
}

export function decodeWav(buffer: Uint8Array): { samples: Float32Array; format: WavHeader } {
  if (buffer.length < 44) {
    throw new Error("Buffer too small for WAV header");
  }

  const decoder = new TextDecoder();
  const riff = decoder.decode(buffer.slice(0, 4));
  const wave = decoder.decode(buffer.slice(8, 12));
  const fmt = decoder.decode(buffer.slice(12, 16));
  const data = decoder.decode(buffer.slice(36, 40));

  if (riff !== "RIFF" || wave !== "WAVE" || fmt !== "fmt " || data !== "data") {
    throw new Error("Invalid WAV signature");
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitDepth = view.getUint16(34, true);
  const dataSize = view.getUint32(40, true);

  if (bitDepth !== 16) {
    throw new Error(`Unsupported bit depth: ${bitDepth}`);
  }

  const sampleCount = dataSize / 2;
  const samples = new Float32Array(sampleCount);
  let offset = 44;
  for (let i = 0; i < sampleCount; i++) {
    const intSample = view.getInt16(offset, true);
    samples[i] = intSample / (intSample < 0 ? 0x8000 : 0x7FFF);
    offset += 2;
  }

  return {
    samples,
    format: { sampleRate, channels, bitDepth, dataSize },
  };
}

export function validateWav(buffer: Uint8Array): boolean {
  if (buffer.length < 44) return false;
  const decoder = new TextDecoder();
  const riff = decoder.decode(buffer.slice(0, 4));
  const wave = decoder.decode(buffer.slice(8, 12));
  const fmt = decoder.decode(buffer.slice(12, 16));
  const data = decoder.decode(buffer.slice(36, 40));
  return riff === "RIFF" && wave === "WAVE" && fmt === "fmt " && data === "data";
}

export function computeWavHash(buffer: Uint8Array): string {
  return hashBytes(buffer);
}
