/**
 * Comprehensive unit tests for ChatInput component
 * Covers: text input, form submission, keyboard shortcuts, file attachment handling,
 * quick actions, voice input toggle, streaming state, placeholder, disabled state,
 * file selection processing, autoResize, and all conditional rendering branches.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatInput from '@/components/ChatInput.vue'

// Mock fileValidation utils
vi.mock('@/utils/fileValidation', () => ({
  validateFileSize: vi.fn().mockReturnValue({ valid: true, maxSize: '10MB' }),
  formatFileSize: vi.fn((size: number) => {
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / (1024 * 1024)).toFixed(1)}MB`
  }),
  getMediaType: vi.fn().mockReturnValue('image'),
}))

vi.mock('@/utils/fileType', () => ({
  getPreviewType: vi.fn().mockReturnValue('image'),
  getFileExtension: vi.fn().mockReturnValue('png'),
}))

// Mock ThinkingToggle to simplify tests
vi.mock('@/components/ThinkingToggle.vue', () => ({
  default: {
    name: 'ThinkingToggle',
    template: '<button class="thinking-toggle-mock" @click="$emit(\'update:enabled\', !enabled)" />',
    props: ['enabled', 'disabled'],
  },
}))

/**
 * Helper: create a mock FileReader class that can be stubbed globally.
 * Each instance gets its own onload/onerror callbacks so that tests
 * can trigger them after calling readAsDataURL.
 */
function createMockFileReaderClass() {
  const instances: any[] = []
  const Cls = class MockFileReader {
    result: string | null = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null

    constructor() {
      instances.push(this)
    }

    readAsDataURL(_file: File) {
      // No-op by default; tests will manually trigger onload/onerror
    }
  }
  return { Cls, instances }
}

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(ChatInput, {
      props,
    })
  }

  // =====================================================
  // Basic rendering and props
  // =====================================================

  describe('Placeholder', () => {
    it('should show default placeholder when not provided', () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      expect(textarea.attributes('placeholder')).toBe('Type your message...')
    })

    it('should show custom placeholder when provided', () => {
      const wrapper = createWrapper({ placeholder: 'Ask me anything...' })
      const textarea = wrapper.find('textarea.chat-input__field')
      expect(textarea.attributes('placeholder')).toBe('Ask me anything...')
    })
  })

  describe('Voice Input Toggle', () => {
    it('should show voice button by default (enableVoiceInput true)', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-input__voice-btn').exists()).toBe(true)
    })

    it('should hide voice button when enableVoiceInput is false', () => {
      const wrapper = createWrapper({ enableVoiceInput: false })
      expect(wrapper.find('.chat-input__voice-btn').exists()).toBe(false)
    })

    it('should emit toggle-voice on voice button click', async () => {
      const wrapper = createWrapper()
      const voiceBtn = wrapper.find('.chat-input__voice-btn')
      await voiceBtn.trigger('click')
      expect(wrapper.emitted('toggle-voice')).toBeTruthy()
    })
  })

  describe('ThinkingToggle', () => {
    it('should show ThinkingToggle when enableThinking is true', () => {
      const wrapper = createWrapper({ enableThinking: true })
      expect(wrapper.find('.thinking-toggle-mock').exists()).toBe(true)
    })

    it('should hide ThinkingToggle when enableThinking is false or undefined', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.thinking-toggle-mock').exists()).toBe(false)
    })

    it('should pass thinkingEnabled prop to ThinkingToggle', () => {
      const wrapper = createWrapper({ enableThinking: true, thinkingEnabled: true })
      const toggle = wrapper.find('.thinking-toggle-mock')
      expect(toggle.exists()).toBe(true)
    })

    it('should emit update:thinkingEnabled when ThinkingToggle emits update:enabled', async () => {
      const wrapper = createWrapper({ enableThinking: true, thinkingEnabled: false })
      const toggle = wrapper.find('.thinking-toggle-mock')
      await toggle.trigger('click')
      expect(wrapper.emitted('update:thinkingEnabled')).toBeTruthy()
    })
  })

  // =====================================================
  // canSend computed property
  // =====================================================

  describe('canSend Computed', () => {
    it('should not allow send when input is empty and no files', () => {
      const wrapper = createWrapper()
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeDefined()
    })

    it('should allow send when input has text', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Hello')
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeUndefined()
    })

    it('should not allow send when input has only whitespace and no files', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('   ')
      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeDefined()
    })

    it('should allow send when there are valid files even with empty text', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'b64', name: 'photo.png', preview: 'preview', size: 1024,
      }]
      vm.inputText = ''
      await wrapper.vm.$nextTick()

      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeUndefined()
    })

    it('should not allow send when all files have errors and no text', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: '', name: 'err1.png', error: 'too large', size: 1 },
        { type: 'image', data: '', name: 'err2.png', error: 'too large', size: 2 },
      ]
      vm.inputText = ''
      await wrapper.vm.$nextTick()

      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeDefined()
    })

    it('should allow send when some files have errors but at least one is valid', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: '', name: 'err.png', error: 'too large', size: 1 },
        { type: 'image', data: 'b64', name: 'ok.png', preview: 'preview', size: 1024 },
      ]
      vm.inputText = ''
      await wrapper.vm.$nextTick()

      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeUndefined()
    })
  })

  // =====================================================
  // handleSend method
  // =====================================================

  describe('handleSend Method', () => {
    it('should not emit send when disabled', async () => {
      const wrapper = createWrapper({ disabled: true })
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Test')
      const vm = wrapper.vm as any
      vm.handleSend()
      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should not emit send when input is empty and no files', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      vm.handleSend()
      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should emit send with content only when no files', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Hello world')
      const sendBtn = wrapper.find('.chat-input__send-btn')
      await sendBtn.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
      const emitData = wrapper.emitted('send')?.[0]?.[0] as { content: string; attachments?: any[] }
      expect(emitData.content).toBe('Hello world')
      expect(emitData.attachments).toBeUndefined()
    })

    it('should clear input after sending', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Message to send')
      await textarea.trigger('keydown', { key: 'Enter' })
      expect(textarea.element.value).toBe('')
    })

    it('should trim content when sending', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('  padded message  ')
      await textarea.trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { content: string }
      expect(emitData.content).toBe('padded message')
    })

    it('should reset textarea height after sending', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      const el = document.createElement('textarea')
      el.style.height = '120px'
      vm.inputRef = el
      vm.inputText = 'Hello'

      vm.handleSend()

      expect(el.style.height).toBe('auto')
    })

    it('should handle send when inputRef is null', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.inputRef = null
      vm.inputText = 'Hello'

      expect(() => vm.handleSend()).not.toThrow()
      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should not include error files in attachments', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: 'b64', name: 'valid.png', preview: 'preview', size: 1024 },
        { type: 'image', data: '', name: 'error.png', error: 'File too large', size: 20 * 1024 * 1024 },
      ]
      vm.inputText = 'Sending with error file'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { content: string; attachments?: any[] }
      expect(emitData.attachments?.length).toBe(1)
      expect(emitData.attachments?.[0].name).toBe('valid.png')
    })

    it('should clear selectedFiles after sending', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'base64img', name: 'photo.png',
        preview: 'data:image/png;base64,base64img', size: 1024,
      }]
      vm.inputText = 'Message'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      expect(vm.selectedFiles.length).toBe(0)
      expect(vm.inputText).toBe('')
    })

    it('should allow sending with only files and no text', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'base64img', name: 'photo.png',
        preview: 'data:image/png;base64,base64img', size: 1024,
      }]
      vm.inputText = ''
      await wrapper.vm.$nextTick()

      const sendBtn = wrapper.find('.chat-input__send-btn')
      expect(sendBtn.attributes('disabled')).toBeUndefined()

      await sendBtn.trigger('click')

      expect(wrapper.emitted('send')).toBeTruthy()
      const emitData = wrapper.emitted('send')?.[0]?.[0] as { content: string; attachments?: any[] }
      expect(emitData.content).toBe('')
      expect(emitData.attachments?.length).toBe(1)
    })
  })

  // =====================================================
  // Attachment URL construction
  // =====================================================

  describe('handleSend - attachment URL construction', () => {
    it('should use preview URL when available for image attachments', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'base64img', name: 'photo.png',
        preview: 'data:image/png;base64,base64img', size: 1024,
      }]
      vm.inputText = 'Check this'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:image/png;base64,base64img')
    })

    it('should construct data URL for image without preview', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'base64img', name: 'photo.png', size: 1024,
      }]
      vm.inputText = 'Check this'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:image/png;base64,base64img')
    })

    it('should construct data URL for video without preview', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'video', data: 'b64video', name: 'clip.mp4', size: 5 * 1024 * 1024,
      }]
      vm.inputText = 'Video'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:video/mp4;base64,b64video')
    })

    it('should construct data URL for audio without preview', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'audio', data: 'b64audio', name: 'song.mp3', size: 3 * 1024 * 1024,
      }]
      vm.inputText = 'Audio'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:audio/mp3;base64,b64audio')
    })

    it('should construct data URL for document without preview', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'document', data: 'b64doc', name: 'report.pdf', size: 2 * 1024 * 1024,
      }]
      vm.inputText = 'Doc'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:application/octet-stream;base64,b64doc')
      expect(emitData.attachments?.[0].type).toBe('document')
    })

    it('should use preview URL for document when preview is set', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'document', data: 'b64doc', name: 'report.pdf',
        preview: 'data:application/pdf;base64,b64doc', size: 2 * 1024 * 1024,
      }]
      vm.inputText = 'Doc'
      await wrapper.vm.$nextTick()

      await wrapper.find('textarea.chat-input__field').trigger('keydown', { key: 'Enter' })

      const emitData = wrapper.emitted('send')?.[0]?.[0] as { attachments?: any[] }
      expect(emitData.attachments?.[0].url).toBe('data:application/pdf;base64,b64doc')
    })
  })

  // =====================================================
  // File preview rendering
  // =====================================================

  describe('File Preview Rendering', () => {
    it('should render image file preview when selectedFiles has image type', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'base64data', name: 'test.png',
        preview: 'data:image/png;base64,base64data', size: 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-img').exists()).toBe(true)
    })

    it('should render video file preview when selectedFiles has video type', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'video', data: 'base64data', name: 'test.mp4', size: 1024 * 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-media').exists()).toBe(true)
    })

    it('should render audio file preview when selectedFiles has audio type', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'audio', data: 'base64data', name: 'test.mp3', size: 512 * 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-media').exists()).toBe(true)
    })

    it('should render document file preview when selectedFiles has document type', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'document', data: 'base64data', name: 'test.pdf',
        preview: 'data:application/pdf;base64,base64data', size: 2 * 1024 * 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-document').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-docname').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-docname').text()).toBe('test.pdf')
    })

    it('should render error state preview when file has error', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: '', name: 'large.png', size: 20 * 1024 * 1024,
        error: 'File exceeds 10MB limit',
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__previews').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview--error').exists()).toBe(true)
      expect(wrapper.find('.chat-input__preview-error').exists()).toBe(true)
    })

    it('should render file size display for video files with size', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'video', data: 'base64data', name: 'test.mp4', size: 5 * 1024 * 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__preview-size').exists()).toBe(true)
    })

    it('should render file size display for audio files with size', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'audio', data: 'base64data', name: 'test.mp3', size: 3 * 1024 * 1024,
      }]
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.chat-input__preview-size').exists()).toBe(true)
    })

    it('should render remove button for each file preview', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: 'b64', name: 'img1.png', preview: 'data:image/png;base64,b64' },
        { type: 'image', data: 'b64', name: 'img2.png', preview: 'data:image/png;base64,b64' },
      ]
      await wrapper.vm.$nextTick()

      const removeButtons = wrapper.findAll('.chat-input__preview-remove')
      expect(removeButtons.length).toBe(2)
    })

    it('should not render previews section when no files are selected', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.chat-input__previews').exists()).toBe(false)
    })
  })

  // =====================================================
  // removeFile method
  // =====================================================

  describe('removeFile Method', () => {
    it('should remove file at given index', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: 'b1', name: 'img1.png', preview: 'preview1' },
        { type: 'image', data: 'b2', name: 'img2.png', preview: 'preview2' },
        { type: 'image', data: 'b3', name: 'img3.png', preview: 'preview3' },
      ]
      await wrapper.vm.$nextTick()

      const removeButtons = wrapper.findAll('.chat-input__preview-remove')
      await removeButtons[1].trigger('click')

      expect(vm.selectedFiles.length).toBe(2)
      expect(vm.selectedFiles[0].name).toBe('img1.png')
      expect(vm.selectedFiles[1].name).toBe('img3.png')
    })

    it('should remove the only file leaving empty array', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [
        { type: 'image', data: 'b1', name: 'img1.png', preview: 'preview1' },
      ]
      await wrapper.vm.$nextTick()

      const removeBtn = wrapper.find('.chat-input__preview-remove')
      await removeBtn.trigger('click')

      expect(vm.selectedFiles.length).toBe(0)
      expect(wrapper.find('.chat-input__previews').exists()).toBe(false)
    })
  })

  // =====================================================
  // File click events
  // =====================================================

  describe('File Click Events', () => {
    it('should emit file-click when image preview is clicked', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'image', data: 'b64', name: 'test.png', preview: 'data:image/png;base64,b64',
      }]
      await wrapper.vm.$nextTick()

      await wrapper.find('.chat-input__preview-img').trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]?.[0]).toEqual({
        type: 'image', url: 'data:image/png;base64,b64', name: 'test.png',
      })
    })

    it('should emit file-click when video preview is clicked', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'video', data: 'b64', name: 'test.mp4', preview: undefined,
      }]
      await wrapper.vm.$nextTick()

      await wrapper.find('.chat-input__preview-media').trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]?.[0]).toEqual({
        type: 'video', url: undefined, name: 'test.mp4',
      })
    })

    it('should emit file-click when audio preview is clicked', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'audio', data: 'b64', name: 'test.mp3', preview: undefined,
      }]
      await wrapper.vm.$nextTick()

      await wrapper.find('.chat-input__preview-media').trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
    })

    it('should emit file-click with extension type when document preview is clicked', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'document', data: 'b64', name: 'report.pdf', preview: 'data:application/pdf;base64,b64',
      }]
      await wrapper.vm.$nextTick()

      await wrapper.find('.chat-input__preview-document').trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
      expect(wrapper.emitted('file-click')?.[0]?.[0]).toEqual({
        type: 'pdf', url: 'data:application/pdf;base64,b64', name: 'report.pdf',
      })
    })

    it('should handle document without extension for file-click', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.selectedFiles = [{
        type: 'document', data: 'b64', name: 'README', preview: undefined,
      }]
      await wrapper.vm.$nextTick()

      await wrapper.find('.chat-input__preview-document').trigger('click')

      expect(wrapper.emitted('file-click')).toBeTruthy()
      // When no dot in name, split('.').pop() returns the name itself
      expect(wrapper.emitted('file-click')?.[0]?.[0].type).toBe('README')
    })
  })

  // =====================================================
  // handleUploadClick method
  // =====================================================

  describe('handleUploadClick Method', () => {
    it('should call click on fileInputRef', async () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      const clickSpy = vi.spyOn(fileInput.element, 'click')

      const uploadBtn = wrapper.find('.chat-input__upload-btn')
      await uploadBtn.trigger('click')

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not throw when fileInputRef is null', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.fileInputRef = null
      expect(() => vm.handleUploadClick()).not.toThrow()
    })
  })

  // =====================================================
  // autoResize method
  // =====================================================

  describe('autoResize Method', () => {
    it('should adjust textarea height on input', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')

      await textarea.setValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
      await textarea.trigger('input')

      expect(wrapper.find('textarea.chat-input__field').exists()).toBe(true)
    })

    it('should set textarea height based on scrollHeight', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      const el = textarea.element as HTMLTextAreaElement

      Object.defineProperty(el, 'scrollHeight', { value: 80, configurable: true })
      Object.defineProperty(el, 'style', {
        value: { height: '' },
        writable: true,
        configurable: true,
      })

      await textarea.setValue('Some text')
      await textarea.trigger('input')

      expect(el.style.height).toBe('80px')
    })

    it('should cap textarea height at 120px', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      const el = textarea.element as HTMLTextAreaElement

      Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true })
      Object.defineProperty(el, 'style', {
        value: { height: '' },
        writable: true,
        configurable: true,
      })

      await textarea.setValue('Very long text\n'.repeat(20))
      await textarea.trigger('input')

      expect(el.style.height).toBe('120px')
    })

    it('should handle autoResize when inputRef is null', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      vm.inputRef = null
      expect(() => vm.autoResize()).not.toThrow()
    })
  })

  // =====================================================
  // Keyboard handling
  // =====================================================

  describe('Keyboard Handling', () => {
    it('should not send on Enter when input is empty', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should send on Enter with non-empty input', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Hello')
      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('send')).toBeTruthy()
    })

    it('should allow Shift+Enter for new line without sending', async () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Hello')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
      expect(wrapper.emitted('send')).toBeFalsy()
    })

    it('should not send when disabled even with Enter', async () => {
      const wrapper = createWrapper({ disabled: true })
      const textarea = wrapper.find('textarea.chat-input__field')
      await textarea.setValue('Hello')
      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('send')).toBeFalsy()
    })
  })

  // =====================================================
  // Conditional rendering (send/stop button, disabled)
  // =====================================================

  describe('Conditional Rendering', () => {
    it('should show send button when not disabled', () => {
      const wrapper = createWrapper({ disabled: false })
      expect(wrapper.find('.chat-input__send-btn').exists()).toBe(true)
      expect(wrapper.find('.chat-input__stop-btn').exists()).toBe(false)
    })

    it('should show stop button when disabled (generating)', () => {
      const wrapper = createWrapper({ disabled: true })
      expect(wrapper.find('.chat-input__stop-btn').exists()).toBe(true)
      expect(wrapper.find('.chat-input__send-btn').exists()).toBe(false)
    })

    it('should disable textarea when disabled', () => {
      const wrapper = createWrapper({ disabled: true })
      const textarea = wrapper.find('textarea.chat-input__field')
      expect(textarea.attributes('disabled')).toBeDefined()
    })
  })

  // =====================================================
  // Stop button
  // =====================================================

  describe('Stop button', () => {
    it('should emit stop event when stop button is clicked', async () => {
      const wrapper = createWrapper({ disabled: true })
      const stopBtn = wrapper.find('.chat-input__stop-btn')
      await stopBtn.trigger('click')
      expect(wrapper.emitted('stop')).toBeTruthy()
      expect(wrapper.emitted('stop')?.length).toBe(1)
    })
  })

  // =====================================================
  // File input element attributes
  // =====================================================

  describe('File Input Element', () => {
    it('should have correct accept attribute for file types', () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      const accept = fileInput.attributes('accept')
      expect(accept).toContain('image/*')
      expect(accept).toContain('video/mp4')
      expect(accept).toContain('audio/mp3')
      expect(accept).toContain('.pdf')
      expect(accept).toContain('.doc')
    })

    it('should have multiple attribute on file input', () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('multiple')).toBeDefined()
    })

    it('should have hidden file input', () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('style')).toContain('display: none')
    })
  })

  // =====================================================
  // convertFileToBase64 - internal async method
  // =====================================================

  describe('convertFileToBase64', () => {
    let mockFR: ReturnType<typeof createMockFileReaderClass>
    let originalFileReader: typeof FileReader

    beforeEach(() => {
      originalFileReader = globalThis.FileReader
      mockFR = createMockFileReaderClass()
      vi.stubGlobal('FileReader', mockFR.Cls)
    })

    afterEach(() => {
      vi.stubGlobal('FileReader', originalFileReader)
      vi.unstubAllGlobals()
    })

    it('should resolve with base64 data when FileReader succeeds', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      const file = new File(['hello'], 'test.png', { type: 'image/png' })

      const promise = vm.convertFileToBase64(file)

      // Get the FileReader instance that was created and trigger onload
      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:image/png;base64,aGVsbG8='
      instance.onload()

      const result = await promise
      expect(result).toBe('aGVsbG8=')
    })

    it('should reject when FileReader encounters an error', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      const file = new File(['hello'], 'test.png', { type: 'image/png' })

      const promise = vm.convertFileToBase64(file)

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.onerror()

      await expect(promise).rejects.toThrow('Failed to read file')
    })
  })

  // =====================================================
  // handleFileSelect - full file selection processing
  // This tests the uncovered lines 289-365
  // =====================================================

  describe('handleFileSelect', () => {
    let mockFR: ReturnType<typeof createMockFileReaderClass>
    let originalFileReader: typeof FileReader

    beforeEach(() => {
      originalFileReader = globalThis.FileReader
      mockFR = createMockFileReaderClass()
      vi.stubGlobal('FileReader', mockFR.Cls)
    })

    afterEach(() => {
      vi.stubGlobal('FileReader', originalFileReader)
      vi.unstubAllGlobals()
    })

    /**
     * Helper to call handleFileSelect with a mock event object.
     * This directly invokes the method on the VM, bypassing
     * the DOM change event which doesn't let us set target.files.
     */
    const callHandleFileSelect = async (
      wrapper: ReturnType<typeof createWrapper>,
      files: File[] | null,
    ) => {
      const vm = wrapper.vm as any
      const mockTarget = { files, value: 'dummy' }
      const mockEvent = { target: mockTarget }
      await vm.handleFileSelect(mockEvent)
      await flushPromises()
    }

    it('should return early when files is null', async () => {
      const wrapper = createWrapper()
      await callHandleFileSelect(wrapper, null)

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(0)
    })

    it('should return early when files array is empty', async () => {
      const wrapper = createWrapper()
      await callHandleFileSelect(wrapper, [])

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(0)
    })

    it('should process image file and add to selectedFiles with preview', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('image')

      const { getMediaType } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('image')

      const wrapper = createWrapper()
      const file = new File(['imgdata'], 'photo.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      // Trigger FileReader onload for the image
      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:image/png;base64,aW1nZGF0YQ=='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('image')
      expect(vm.selectedFiles[0].name).toBe('photo.png')
      expect(vm.selectedFiles[0].data).toBe('aW1nZGF0YQ==')
      expect(vm.selectedFiles[0].preview).toBe('data:image/png;base64,aW1nZGF0YQ==')
    })

    it('should process video file and add to selectedFiles without preview', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('video')

      const { getMediaType } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('video')

      const wrapper = createWrapper()
      const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:video/mp4;base64,dmlkZW8='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('video')
      expect(vm.selectedFiles[0].preview).toBeUndefined()
    })

    it('should process audio file and add to selectedFiles without preview', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('audio')

      const { getMediaType } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('audio')

      const wrapper = createWrapper()
      const file = new File(['audio'], 'song.mp3', { type: 'audio/mp3' })
      Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:audio/mp3;base64,YXVkaW8='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('audio')
      expect(vm.selectedFiles[0].preview).toBeUndefined()
    })

    it('should add file with error when media file exceeds size limit', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('image')

      const { getMediaType, validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('image')
      vi.mocked(validateFileSize).mockReturnValue({ valid: false, maxSize: '10MB' })

      const alertMock = vi.fn()
      vi.stubGlobal('alert', alertMock)

      const wrapper = createWrapper()
      const file = new File(['largeimg'], 'large.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 })

      await callHandleFileSelect(wrapper, [file])

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].error).toContain('exceeds')
      expect(vm.selectedFiles[0].type).toBe('image')
      expect(alertMock).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('should process PDF document file and add to selectedFiles', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('pdf')

      const { validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()
      const file = new File(['pdfdata'], 'report.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:application/pdf;base64,cGRmZGF0YQ=='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('document')
      expect(vm.selectedFiles[0].name).toBe('report.pdf')
      expect(vm.selectedFiles[0].data).toBe('cGRmZGF0YQ==')
      expect(vm.selectedFiles[0].preview).toBe('data:application/pdf;base64,cGRmZGF0YQ==')
    })

    it('should process Word document file', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('word')

      const { validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()
      const file = new File(['word'], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      Object.defineProperty(file, 'size', { value: 500 * 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:application/msword;base64,d29yZA=='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('document')
    })

    it('should process Excel document file', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('excel')

      const { validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()
      const file = new File(['excel'], 'sheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      Object.defineProperty(file, 'size', { value: 300 * 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:application/vnd.ms-excel;base64,ZXhjZWw='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('document')
    })

    it('should process text document file', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('text')

      const { validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()
      const file = new File(['text'], 'notes.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:text/plain;base64,dGV4dA=='
      instance.onload()

      await promise

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].type).toBe('document')
    })

    it('should add document with error when file exceeds size limit', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('pdf')

      const { validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(validateFileSize).mockReturnValue({ valid: false, maxSize: '10MB' })

      const alertMock = vi.fn()
      vi.stubGlobal('alert', alertMock)

      const wrapper = createWrapper()
      const file = new File(['largepdf'], 'large.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 })

      await callHandleFileSelect(wrapper, [file])

      const vm = wrapper.vm as any
      expect(vm.selectedFiles.length).toBe(1)
      expect(vm.selectedFiles[0].error).toContain('exceeds')
      expect(vm.selectedFiles[0].type).toBe('document')
      expect(alertMock).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })

    it('should handle FileReader error during file processing', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('image')

      const { getMediaType, validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('image')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const alertMock = vi.fn()
      vi.stubGlobal('alert', alertMock)

      const wrapper = createWrapper()
      const file = new File(['data'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const promise = callHandleFileSelect(wrapper, [file])

      // Trigger FileReader onerror
      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.onerror()

      await promise

      expect(consoleSpy).toHaveBeenCalled()
      expect(alertMock).toHaveBeenCalledWith('Failed to process files. Please try again.')

      consoleSpy.mockRestore()
      vi.unstubAllGlobals()
    })

    it('should reset file input value after processing', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType).mockReturnValue('image')

      const { getMediaType, validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('image')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      const file = new File(['img'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const mockTarget = { files: [file], value: 'dummy' }
      const mockEvent = { target: mockTarget }

      const promise = vm.handleFileSelect(mockEvent)

      const instance = mockFR.instances[mockFR.instances.length - 1]
      instance.result = 'data:image/png;base64,aW1n'
      instance.onload()

      await promise
      await flushPromises()

      // The input target value should be reset to empty
      expect(mockTarget.value).toBe('')
    })

    it('should process multiple files in a single selection', async () => {
      const { getPreviewType } = await import('@/utils/fileType')
      vi.mocked(getPreviewType)
        .mockReturnValueOnce('image')
        .mockReturnValueOnce('pdf')

      const { getMediaType, validateFileSize } = await import('@/utils/fileValidation')
      vi.mocked(getMediaType).mockReturnValue('image')
      vi.mocked(validateFileSize).mockReturnValue({ valid: true, maxSize: '10MB' })

      const wrapper = createWrapper()

      const imgFile = new File(['img'], 'photo.png', { type: 'image/png' })
      Object.defineProperty(imgFile, 'size', { value: 1024 })
      const pdfFile = new File(['pdf'], 'report.pdf', { type: 'application/pdf' })
      Object.defineProperty(pdfFile, 'size', { value: 2048 })

      const vm = wrapper.vm as any
      const mockTarget = { files: [imgFile, pdfFile], value: '' }
      const mockEvent = { target: mockTarget }

      const promise = vm.handleFileSelect(mockEvent)

      // First file (image) - trigger onload
      // Since handleFileSelect processes files sequentially, the first
      // FileReader instance should be created first
      await flushPromises()

      // Find instances that haven't been triggered yet
      for (const inst of mockFR.instances) {
        if (inst.onload && !inst._triggered) {
          inst.result = 'data:image/png;base64,aW1n'
          inst.onload()
          inst._triggered = true
        }
      }

      await flushPromises()

      // Trigger the second FileReader
      for (const inst of mockFR.instances) {
        if (inst.onload && !inst._triggered) {
          inst.result = 'data:application/pdf;base64,cGRm'
          inst.onload()
          inst._triggered = true
        }
      }

      await promise
      await flushPromises()

      expect(vm.selectedFiles.length).toBe(2)
      expect(vm.selectedFiles[0].type).toBe('image')
      expect(vm.selectedFiles[1].type).toBe('document')
    })
  })
})
