import { describe, it } from "node:test";
import assert from "node:assert";
import { encodeWav, decodeWav, validateWav, computeWavHash } from "../src/wav-codec.ts";

describe("WAV codec", () => {
  it("encodes and decodes a mono 16-bit sine wave", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0]);
    const buffer = encodeWav(samples, { sampleRate: 44100, channels: 1, bitDepth: 16 });
    assert.ok(validateWav(buffer));
    assert.equal(buffer.length, 44 + samples.length * 2);

    const decoded = decodeWav(buffer);
    assert.equal(decoded.format.sampleRate, 44100);
    assert.equal(decoded.format.channels, 1);
    assert.equal(decoded.format.bitDepth, 16);
    assert.equal(decoded.samples.length, samples.length);
    assert.ok(Math.abs(decoded.samples[0]) < 0.01);
    assert.ok(Math.abs(decoded.samples[1] - 0.5) < 0.01);
  });

  it("encodes stereo samples", () => {
    const samples = new Float32Array([0.1, -0.1, 0.5, -0.5]);
    const buffer = encodeWav(samples, { sampleRate: 48000, channels: 2, bitDepth: 16 });
    const decoded = decodeWav(buffer);
    assert.equal(decoded.format.channels, 2);
    assert.equal(decoded.format.sampleRate, 48000);
  });

  it("rejects unsupported bit depths", () => {
    assert.throws(() => encodeWav(new Float32Array(1), { sampleRate: 44100, channels: 1, bitDepth: 24 }), /Unsupported bit depth/);
  });

  it("validates correct and incorrect buffers", () => {
    const good = encodeWav(new Float32Array([0]), { sampleRate: 44100, channels: 1, bitDepth: 16 });
    assert.equal(validateWav(good), true);
    assert.equal(validateWav(new Uint8Array([0xde, 0xad, 0xbe, 0xef])), false);
    assert.equal(validateWav(new Uint8Array(10)), false);
  });

  it("computes a stable sha256 hash", () => {
    const buffer = encodeWav(new Float32Array([0.5]), { sampleRate: 44100, channels: 1, bitDepth: 16 });
    const hash = computeWavHash(buffer);
    assert.equal(hash.length, 64);
    assert.equal(computeWavHash(buffer), hash);
  });
});
