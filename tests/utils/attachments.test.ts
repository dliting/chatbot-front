import { describe, it, expect } from 'vitest'
import { buildAttachmentUrl } from '@/utils/attachments'
import type { MediaFile } from '@/composables/useFileSelection'

function mk(overrides: Partial<MediaFile>): MediaFile {
  return { type: 'image', data: 'QUJD', name: 'f', ...overrides }
}

describe('buildAttachmentUrl', () => {
  it('prefers the preview data URL when present', () => {
    expect(buildAttachmentUrl(mk({ preview: 'data:image/webp;base64,ZZZ' }))).toBe(
      'data:image/webp;base64,ZZZ'
    )
  })

  it('builds image data URL from base64 data', () => {
    expect(buildAttachmentUrl(mk({ type: 'image' }))).toBe('data:image/png;base64,QUJD')
  })

  it('builds video data URL from base64 data', () => {
    expect(buildAttachmentUrl(mk({ type: 'video' }))).toBe('data:video/mp4;base64,QUJD')
  })

  it('builds audio data URL from base64 data', () => {
    expect(buildAttachmentUrl(mk({ type: 'audio' }))).toBe('data:audio/mp3;base64,QUJD')
  })

  it('builds octet-stream data URL for documents', () => {
    expect(buildAttachmentUrl(mk({ type: 'document' }))).toBe(
      'data:application/octet-stream;base64,QUJD'
    )
  })
})
