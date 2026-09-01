/**
 * Unit tests for file type utilities
 */
import { describe, it, expect } from 'vitest'
import {
  FILE_TYPE_MAP,
  DOCUMENT_TYPES,
  getFileExtension,
  getPreviewType,
  isDocumentType,
  getMimeType,
  getFileIcon,
} from '@/utils/fileType'
import type { PreviewType } from '@/utils/fileType'

describe('utils/fileType', () => {
  describe('FILE_TYPE_MAP', () => {
    it('should contain image type entries', () => {
      expect(FILE_TYPE_MAP.jpg).toBe('image')
      expect(FILE_TYPE_MAP.jpeg).toBe('image')
      expect(FILE_TYPE_MAP.png).toBe('image')
      expect(FILE_TYPE_MAP.gif).toBe('image')
      expect(FILE_TYPE_MAP.webp).toBe('image')
      expect(FILE_TYPE_MAP.bmp).toBe('image')
      expect(FILE_TYPE_MAP.svg).toBe('image')
    })

    it('should contain pdf type entry', () => {
      expect(FILE_TYPE_MAP.pdf).toBe('pdf')
    })

    it('should contain word type entries', () => {
      expect(FILE_TYPE_MAP.docx).toBe('word')
      expect(FILE_TYPE_MAP.doc).toBe('word')
    })

    it('should contain excel type entries', () => {
      expect(FILE_TYPE_MAP.xlsx).toBe('excel')
      expect(FILE_TYPE_MAP.xls).toBe('excel')
      expect(FILE_TYPE_MAP.csv).toBe('excel')
    })

    it('should contain video type entries', () => {
      expect(FILE_TYPE_MAP.mp4).toBe('video')
      expect(FILE_TYPE_MAP.webm).toBe('video')
      expect(FILE_TYPE_MAP.mov).toBe('video')
      expect(FILE_TYPE_MAP.avi).toBe('video')
    })

    it('should contain audio type entries', () => {
      expect(FILE_TYPE_MAP.mp3).toBe('audio')
      expect(FILE_TYPE_MAP.wav).toBe('audio')
      expect(FILE_TYPE_MAP.ogg).toBe('audio')
      expect(FILE_TYPE_MAP.m4a).toBe('audio')
    })

    it('should contain text type entries', () => {
      expect(FILE_TYPE_MAP.txt).toBe('text')
      expect(FILE_TYPE_MAP.md).toBe('text')
      expect(FILE_TYPE_MAP.json).toBe('text')
      expect(FILE_TYPE_MAP.js).toBe('text')
      expect(FILE_TYPE_MAP.ts).toBe('text')
      expect(FILE_TYPE_MAP.xml).toBe('text')
      expect(FILE_TYPE_MAP.html).toBe('text')
      expect(FILE_TYPE_MAP.css).toBe('text')
    })
  })

  describe('DOCUMENT_TYPES', () => {
    it('should include pdf, word, excel, and text', () => {
      expect(DOCUMENT_TYPES).toContain('pdf')
      expect(DOCUMENT_TYPES).toContain('word')
      expect(DOCUMENT_TYPES).toContain('excel')
      expect(DOCUMENT_TYPES).toContain('text')
    })

    it('should have exactly 4 document types', () => {
      expect(DOCUMENT_TYPES).toHaveLength(4)
    })
  })

  describe('getFileExtension', () => {
    it('should extract extension from simple filename', () => {
      expect(getFileExtension('photo.jpg')).toBe('jpg')
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('data.json')).toBe('json')
    })

    it('should return lowercase extension', () => {
      expect(getFileExtension('photo.JPG')).toBe('jpg')
      expect(getFileExtension('document.PDF')).toBe('pdf')
      expect(getFileExtension('data.JSON')).toBe('json')
    })

    it('should return last extension for multi-dot filename', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
      expect(getFileExtension('file.name.txt')).toBe('txt')
    })

    it('should return empty string for filename without extension', () => {
      expect(getFileExtension('filename')).toBe('')
      expect(getFileExtension('noext')).toBe('')
    })

    it('should handle filename with only a dot', () => {
      // '.hidden' has parts.length > 1, pop() returns 'hidden'
      expect(getFileExtension('.hidden')).toBe('hidden')
    })

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('')
    })

    it('should handle filename ending with dot', () => {
      // 'file.' splits to ['file', ''], pop() returns ''
      expect(getFileExtension('file.')).toBe('')
    })
  })

  describe('getPreviewType', () => {
    it('should return "image" for image file extensions', () => {
      expect(getPreviewType('photo.jpg')).toBe('image')
      expect(getPreviewType('photo.jpeg')).toBe('image')
      expect(getPreviewType('photo.png')).toBe('image')
      expect(getPreviewType('photo.gif')).toBe('image')
      expect(getPreviewType('photo.webp')).toBe('image')
      expect(getPreviewType('photo.bmp')).toBe('image')
      expect(getPreviewType('photo.svg')).toBe('image')
    })

    it('should return "pdf" for PDF files', () => {
      expect(getPreviewType('document.pdf')).toBe('pdf')
    })

    it('should return "word" for Word files', () => {
      expect(getPreviewType('document.docx')).toBe('word')
      expect(getPreviewType('document.doc')).toBe('word')
    })

    it('should return "excel" for Excel/CSV files', () => {
      expect(getPreviewType('sheet.xlsx')).toBe('excel')
      expect(getPreviewType('sheet.xls')).toBe('excel')
      expect(getPreviewType('data.csv')).toBe('excel')
    })

    it('should return "video" for video files', () => {
      expect(getPreviewType('movie.mp4')).toBe('video')
      expect(getPreviewType('movie.webm')).toBe('video')
      expect(getPreviewType('movie.mov')).toBe('video')
      expect(getPreviewType('movie.avi')).toBe('video')
    })

    it('should return "audio" for audio files', () => {
      expect(getPreviewType('song.mp3')).toBe('audio')
      expect(getPreviewType('song.wav')).toBe('audio')
      expect(getPreviewType('song.ogg')).toBe('audio')
      expect(getPreviewType('song.m4a')).toBe('audio')
    })

    it('should return "text" for text/code files', () => {
      expect(getPreviewType('readme.txt')).toBe('text')
      expect(getPreviewType('readme.md')).toBe('text')
      expect(getPreviewType('data.json')).toBe('text')
      expect(getPreviewType('script.js')).toBe('text')
      expect(getPreviewType('app.ts')).toBe('text')
      expect(getPreviewType('config.xml')).toBe('text')
      expect(getPreviewType('page.html')).toBe('text')
      expect(getPreviewType('style.css')).toBe('text')
    })

    it('should return "unknown" for unsupported file types', () => {
      expect(getPreviewType('archive.zip')).toBe('unknown')
      expect(getPreviewType('archive.rar')).toBe('unknown')
      expect(getPreviewType('program.exe')).toBe('unknown')
      expect(getPreviewType('data.bin')).toBe('unknown')
    })

    it('should return "unknown" for filename without extension', () => {
      expect(getPreviewType('noextension')).toBe('unknown')
    })

    it('should return "unknown" for empty string', () => {
      expect(getPreviewType('')).toBe('unknown')
    })

    it('should handle uppercase extensions', () => {
      expect(getPreviewType('photo.JPG')).toBe('image')
      expect(getPreviewType('document.PDF')).toBe('pdf')
    })
  })

  describe('isDocumentType', () => {
    it('should return true for PDF files', () => {
      expect(isDocumentType('report.pdf')).toBe(true)
    })

    it('should return true for Word files', () => {
      expect(isDocumentType('letter.docx')).toBe(true)
      expect(isDocumentType('letter.doc')).toBe(true)
    })

    it('should return true for Excel/CSV files', () => {
      expect(isDocumentType('budget.xlsx')).toBe(true)
      expect(isDocumentType('budget.xls')).toBe(true)
      expect(isDocumentType('data.csv')).toBe(true)
    })

    it('should return true for text/code files', () => {
      expect(isDocumentType('notes.txt')).toBe(true)
      expect(isDocumentType('readme.md')).toBe(true)
      expect(isDocumentType('config.json')).toBe(true)
    })

    it('should return false for image files', () => {
      expect(isDocumentType('photo.jpg')).toBe(false)
      expect(isDocumentType('photo.png')).toBe(false)
    })

    it('should return false for video files', () => {
      expect(isDocumentType('movie.mp4')).toBe(false)
    })

    it('should return false for audio files', () => {
      expect(isDocumentType('song.mp3')).toBe(false)
    })

    it('should return false for unknown file types', () => {
      expect(isDocumentType('archive.zip')).toBe(false)
    })

    it('should return false for filename without extension', () => {
      expect(isDocumentType('noextension')).toBe(false)
    })
  })

  describe('getMimeType', () => {
    it('should return correct MIME type for PDF', () => {
      expect(getMimeType('doc.pdf')).toBe('application/pdf')
    })

    it('should return correct MIME type for Word documents', () => {
      expect(getMimeType('doc.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      expect(getMimeType('doc.doc')).toBe('application/msword')
    })

    it('should return correct MIME type for Excel files', () => {
      expect(getMimeType('sheet.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(getMimeType('sheet.xls')).toBe('application/vnd.ms-excel')
      expect(getMimeType('data.csv')).toBe('text/csv')
    })

    it('should return correct MIME type for text files', () => {
      expect(getMimeType('notes.txt')).toBe('text/plain')
      expect(getMimeType('readme.md')).toBe('text/markdown')
      expect(getMimeType('data.json')).toBe('application/json')
      expect(getMimeType('script.js')).toBe('text/javascript')
      expect(getMimeType('app.ts')).toBe('text/typescript')
      expect(getMimeType('config.xml')).toBe('text/xml')
      expect(getMimeType('page.html')).toBe('text/html')
      expect(getMimeType('style.css')).toBe('text/css')
    })

    it('should return correct MIME type for image files', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg')
      expect(getMimeType('photo.jpeg')).toBe('image/jpeg')
      expect(getMimeType('photo.png')).toBe('image/png')
      expect(getMimeType('photo.gif')).toBe('image/gif')
      expect(getMimeType('photo.webp')).toBe('image/webp')
      expect(getMimeType('photo.svg')).toBe('image/svg+xml')
    })

    it('should return correct MIME type for video files', () => {
      expect(getMimeType('movie.mp4')).toBe('video/mp4')
      expect(getMimeType('movie.webm')).toBe('video/webm')
    })

    it('should return correct MIME type for audio files', () => {
      expect(getMimeType('song.mp3')).toBe('audio/mpeg')
      expect(getMimeType('song.wav')).toBe('audio/wav')
      expect(getMimeType('song.ogg')).toBe('audio/ogg')
    })

    it('should return "application/octet-stream" for unknown extensions', () => {
      expect(getMimeType('archive.zip')).toBe('application/octet-stream')
      expect(getMimeType('program.exe')).toBe('application/octet-stream')
    })

    it('should return "application/octet-stream" for filename without extension', () => {
      expect(getMimeType('noextension')).toBe('application/octet-stream')
    })

    it('should return "application/octet-stream" for empty string', () => {
      expect(getMimeType('')).toBe('application/octet-stream')
    })
  })

  describe('getFileIcon', () => {
    it('should return "image" for image files', () => {
      expect(getFileIcon('photo.jpg')).toBe('image')
      expect(getFileIcon('photo.png')).toBe('image')
    })

    it('should return "pdf" for PDF files', () => {
      expect(getFileIcon('document.pdf')).toBe('pdf')
    })

    it('should return "file-text" for Word files', () => {
      expect(getFileIcon('document.docx')).toBe('file-text')
      expect(getFileIcon('document.doc')).toBe('file-text')
    })

    it('should return "table" for Excel files', () => {
      expect(getFileIcon('sheet.xlsx')).toBe('table')
      expect(getFileIcon('data.csv')).toBe('table')
    })

    it('should return "video" for video files', () => {
      expect(getFileIcon('movie.mp4')).toBe('video')
    })

    it('should return "music" for audio files', () => {
      expect(getFileIcon('song.mp3')).toBe('music')
    })

    it('should return "file" for text files', () => {
      expect(getFileIcon('readme.txt')).toBe('file')
      expect(getFileIcon('config.json')).toBe('file')
    })

    it('should return "file" for unknown file types', () => {
      expect(getFileIcon('archive.zip')).toBe('file')
      expect(getFileIcon('unknown.xyz')).toBe('file')
    })

    it('should return "file" for filename without extension', () => {
      expect(getFileIcon('noextension')).toBe('file')
    })
  })
})
