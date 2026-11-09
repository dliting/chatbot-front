import { describe, it, expect } from 'vitest'
import { encodeWav } from '@/utils/audio'

function readWavFields(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  return {
    riff: new TextDecoder().decode(new Uint8Array(buffer, 0, 4)),
    wave: new TextDecoder().decode(new Uint8Array(buffer, 8, 4)),
    audioFormat: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    byteRate: view.getUint32(28, true),
    blockAlign: view.getUint16(32, true),
    bitsPerSample: view.getUint16(34, true),
    dataMagic: new TextDecoder().decode(new Uint8Array(buffer, 36, 4)),
    dataLength: view.getUint32(40, true),
    totalLength: buffer.byteLength,
    samples: new Int16Array(buffer, 44, (buffer.byteLength - 44) / 2),
  }
}

describe('encodeWav', () => {
  it('writes a valid 16-bit mono PCM RIFF/WAVE header', () => {
    const buffer = encodeWav(new Float32Array([0, 0.5, -0.5]), 16000)
    const wav = readWavFields(buffer)

    expect(wav.riff).toBe('RIFF')
    expect(wav.wave).toBe('WAVE')
    expect(wav.audioFormat).toBe(1) // PCM
    expect(wav.channels).toBe(1)
    expect(wav.sampleRate).toBe(16000)
    expect(wav.byteRate).toBe(16000 * 2)
    expect(wav.blockAlign).toBe(2)
    expect(wav.bitsPerSample).toBe(16)
    expect(wav.dataMagic).toBe('data')
    expect(wav.dataLength).toBe(6)
    expect(wav.totalLength).toBe(44 + 6)
  })

  it('encodes positive and negative samples with clamping', () => {
    const buffer = encodeWav(new Float32Array([0.5, -0.5, 2, -2]), 16000)
    const i16 = new Int16Array(buffer, 44)

    expect(i16[0]).toBe(Math.trunc(0.5 * 32767))
    expect(i16[1]).toBe(Math.trunc(-0.5 * 32768))
    expect(i16[2]).toBe(32767) // clamped high
    expect(i16[3]).toBe(-32768) // clamped low
  })

  it('scales by 32767 toward full scale', () => {
    const buffer = encodeWav(new Float32Array([1]), 8000)
    const i16 = new Int16Array(buffer, 44)
    expect(i16[0]).toBe(32767)
  })

  it('produces an empty data chunk for empty samples', () => {
    const buffer = encodeWav(new Float32Array([]), 16000)
    const wav = readWavFields(buffer)
    expect(wav.dataLength).toBe(0)
    expect(wav.totalLength).toBe(44)
  })
})
