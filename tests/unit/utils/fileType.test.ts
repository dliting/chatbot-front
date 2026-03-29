/**
 * Unit tests for file type utilities
 */
import { describe, it, expect } from 'vitest'
import { getFileExtension, getPreviewType, isDocumentType, getMimeType, getFileIcon } from '@/utils/fileType'

describe('fileType', () => {
  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('TEST.JPG')).toBe('jpg')
      expect(getFileExtension('Document.PDF')).toBe('pdf')
    })

    it('should return empty string for filename without extension', () => {
      expect(getFileExtension('filename')).toBe('')
      expect(getFileExtension('filename.')).toBe('')
    })

    it('should handle undefined or null input gracefully', () => {
      expect(getFileExtension(undefined as any)).toBe('')
      expect(getFileExtension(null as any)).toBe('')
      expect(getFileExtension('' as any)).toBe('')
    })
  })

  describe('getPreviewType', () => {
    it('should identify image types', () => {
      expect(getPreviewType('test.jpg')).toBe('image')
      expect(getPreviewType('test.png')).toBe('image')
      expect(getPreviewType('test.gif')).toBe('image')
      expect(getPreviewType('test.webp')).toBe('image')
    })

    it('should identify PDF type', () => {
      expect(getPreviewType('document.pdf')).toBe('pdf')
    })

    it('should identify Word types', () => {
      expect(getPreviewType('doc.docx')).toBe('word')
      expect(getPreviewType('doc.doc')).toBe('word')
    })

    it('should identify Excel types', () => {
      expect(getPreviewType('sheet.xlsx')).toBe('excel')
      expect(getPreviewType('sheet.xls')).toBe('excel')
      expect(getPreviewType('data.csv')).toBe('excel')
    })

    it('should identify media types', () => {
      expect(getPreviewType('video.mp4')).toBe('video')
      expect(getPreviewType('audio.mp3')).toBe('audio')
    })

    it('should identify text types', () => {
      expect(getPreviewType('text.txt')).toBe('text')
      expect(getPreviewType('code.js')).toBe('text')
    })

    it('should return unknown for unsupported types', () => {
      expect(getPreviewType('unknown.xyz')).toBe('unknown')
    })

    it('should handle undefined or null input gracefully', () => {
      expect(getPreviewType(undefined as any)).toBe('unknown')
      expect(getPreviewType(null as any)).toBe('unknown')
      expect(getPreviewType('' as any)).toBe('unknown')
    })
  })

  describe('isDocumentType', () => {
    it('should identify PDF as document', () => {
      expect(isDocumentType('file.pdf')).toBe(true)
    })

    it('should identify Word as document', () => {
      expect(isDocumentType('file.docx')).toBe(true)
    })

    it('should identify Excel as document', () => {
      expect(isDocumentType('file.xlsx')).toBe(true)
    })

    it('should identify text as document', () => {
      expect(isDocumentType('file.txt')).toBe(true)
    })

    it('should not identify image as document', () => {
      expect(isDocumentType('file.jpg')).toBe(false)
    })

    it('should handle undefined input gracefully', () => {
      expect(isDocumentType(undefined as any)).toBe(false)
    })
  })

  describe('getMimeType', () => {
    it('should return correct MIME type for images', () => {
      expect(getMimeType('test.jpg')).toBe('image/jpeg')
      expect(getMimeType('test.png')).toBe('image/png')
    })

    it('should return correct MIME type for PDF', () => {
      expect(getMimeType('doc.pdf')).toBe('application/pdf')
    })

    it('should return default for unknown types', () => {
      expect(getMimeType('file.xyz')).toBe('application/octet-stream')
    })

    it('should handle undefined input gracefully', () => {
      expect(getMimeType(undefined as any)).toBe('application/octet-stream')
    })
  })

  describe('getFileIcon', () => {
    it('should return correct icon for each type', () => {
      expect(getFileIcon('test.jpg')).toBe('image')
      expect(getFileIcon('test.pdf')).toBe('pdf')
      expect(getFileIcon('test.docx')).toBe('file-text')
      expect(getFileIcon('test.xlsx')).toBe('table')
      expect(getFileIcon('test.mp4')).toBe('video')
      expect(getFileIcon('test.mp3')).toBe('music')
      expect(getFileIcon('test.txt')).toBe('file')
    })

    it('should return default icon for unknown types', () => {
      expect(getFileIcon('test.xyz')).toBe('file')
    })

    it('should handle undefined input gracefully', () => {
      expect(getFileIcon(undefined as any)).toBe('file')
    })
  })
})
