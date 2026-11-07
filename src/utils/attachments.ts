/**
 * Attachment URL builder — extracted from ChatInput.handleSend.
 */
import type { MediaFile } from '@/composables/useFileSelection'

const DATA_PREFIX: Record<string, string> = {
  image: 'data:image/png;base64,',
  video: 'data:video/mp4;base64,',
  audio: 'data:audio/mp3;base64,',
  document: 'data:application/octet-stream;base64,',
}

/**
 * Resolve the URL for a selected file: the data-URL preview when present,
 * otherwise a data URL built from the base64 payload per media type.
 */
export function buildAttachmentUrl(file: MediaFile): string {
  if (file.preview) return file.preview
  const prefix = DATA_PREFIX[file.type] ?? 'data:application/octet-stream;base64,'
  return `${prefix}${file.data}`
}
