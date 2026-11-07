import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageAttachments from '@/components/MessageAttachments.vue'
import type { Attachment } from '@/types'

const IMAGES: Attachment[] = [
  { name: 'a.png', url: 'http://example.com/a.png', type: 'image' },
  { name: 'b.png', url: 'http://example.com/b.png', type: 'image' },
]
const VIDEO: Attachment[] = [{ name: 'c.mp4', url: 'http://example.com/c.mp4', type: 'video' }]
const AUDIO: Attachment[] = [{ name: 'd.mp3', url: 'http://example.com/d.mp3', type: 'audio' }]
const DOC: Attachment[] = [{ name: 'e.pdf', url: 'http://example.com/e.pdf', type: 'document' }]

describe('MessageAttachments', () => {
  it('renders nothing when attachments are empty or missing', () => {
    const empty = mount(MessageAttachments, { props: { attachments: [] } })
    expect(empty.find('.chatbot-message__images').exists()).toBe(false)
    expect(empty.find('.chatbot-message__videos').exists()).toBe(false)
    expect(empty.find('.chatbot-message__audios').exists()).toBe(false)
    expect(empty.find('.chatbot-message__documents').exists()).toBe(false)

    const missing = mount(MessageAttachments, { props: {} })
    expect(missing.find('.chatbot-message__images').exists()).toBe(false)
  })

  it('renders every image with its url', () => {
    const wrapper = mount(MessageAttachments, { props: { attachments: IMAGES } })
    const imgs = wrapper.findAll('.chatbot-message__image')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].attributes('src')).toBe('http://example.com/a.png')
    expect(imgs[1].attributes('src')).toBe('http://example.com/b.png')
  })

  it('renders video player with overlay', () => {
    const wrapper = mount(MessageAttachments, { props: { attachments: VIDEO } })
    expect(wrapper.find('.chatbot-message__video-player').attributes('src')).toBe(
      'http://example.com/c.mp4'
    )
    expect(wrapper.find('.chatbot-message__video-overlay').exists()).toBe(true)
  })

  it('renders audio player', () => {
    const wrapper = mount(MessageAttachments, { props: { attachments: AUDIO } })
    expect(wrapper.find('.chatbot-message__audio-player').attributes('src')).toBe(
      'http://example.com/d.mp3'
    )
  })

  it('renders document with its name', () => {
    const wrapper = mount(MessageAttachments, { props: { attachments: DOC } })
    expect(wrapper.find('.chatbot-message__document-name').text()).toBe('e.pdf')
  })

  it('emits file-click with type and url for each media kind', async () => {
    const wrapper = mount(MessageAttachments, {
      props: { attachments: [...IMAGES, ...VIDEO, ...AUDIO, ...DOC] },
    })
    await wrapper.find('.chatbot-message__image').trigger('click')
    await wrapper.find('.chatbot-message__video').trigger('click')
    await wrapper.find('.chatbot-message__audio').trigger('click')
    await wrapper.find('.chatbot-message__document').trigger('click')

    const clicks = wrapper.emitted('file-click') as Array<[Record<string, string>]>
    expect(clicks[0][0]).toEqual({ type: 'image', url: 'http://example.com/a.png' })
    expect(clicks[1][0]).toEqual({ type: 'video', url: 'http://example.com/c.mp4' })
    expect(clicks[2][0]).toEqual({ type: 'audio', url: 'http://example.com/d.mp3' })
    expect(clicks[3][0]).toEqual({ type: 'document', url: 'http://example.com/e.pdf', name: 'e.pdf' })
  })
})
