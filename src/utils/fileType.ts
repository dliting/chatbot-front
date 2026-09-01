/**
 * File type utilities for document preview
 */

// File type mapping to preview type
export const FILE_TYPE_MAP: Record<string, string> = {
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  // PDF
  pdf: 'pdf',
  // Word
  docx: 'word',
  doc: 'word',
  // Excel
  xlsx: 'excel',
  xls: 'excel',
  csv: 'excel',
  // Video
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  avi: 'video',
  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  // Text
  txt: 'text',
  md: 'text',
  json: 'text',
  js: 'text',
  ts: 'text',
  xml: 'text',
  html: 'text',
  css: 'text'
}

// Document types that need special preview
export const DOCUMENT_TYPES = ['pdf', 'word', 'excel', 'text']

// Preview types
export type PreviewType = 'image' | 'pdf' | 'word' | 'excel' | 'video' | 'audio' | 'text' | 'unknown'

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

/**
 * Get preview type from file extension
 */
export function getPreviewType(filename: string): PreviewType {
  const ext = getFileExtension(filename)
  const type = FILE_TYPE_MAP[ext]
  if (type) return type as PreviewType
  return 'unknown'
}

/**
 * Check if file type is a document type
 */
export function isDocumentType(filename: string): boolean {
  const type = getPreviewType(filename)
  return DOCUMENT_TYPES.includes(type)
}

/**
 * Get MIME type from extension
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    js: 'text/javascript',
    ts: 'text/typescript',
    xml: 'text/xml',
    html: 'text/html',
    css: 'text/css',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Get icon name for file type
 */
export function getFileIcon(filename: string): string {
  const type = getPreviewType(filename)
  const icons: Record<string, string> = {
    image: 'image',
    pdf: 'pdf',
    word: 'file-text',
    excel: 'table',
    video: 'video',
    audio: 'music',
    text: 'file',
    unknown: 'file'
  }
  return icons[type] || 'file'
}
