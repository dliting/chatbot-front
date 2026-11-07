import { describe, it, expect, vi } from 'vitest'
import { computed } from 'vue'
import { useStreamProcessor } from '@/composables/useStreamProcessor'
import { defaultChatbotConfig } from '@/types/config'
import type { Message, StreamEvent } from '@/types'

async function* gen(events: StreamEvent[]): AsyncGenerator<StreamEvent> {
  for (const e of events) yield e
}

function createPlaceholder(messageId: string): Message {
  return {
    messageId,
    topicId: 'topic_1',
    role: 'assistant',
    type: 'text',
    content: '',
    timestamp: Date.now(),
    status: 'loading',
  }
}

function setup() {
  const byTopic: Record<string, Message[]> = { topic_1: [] }
  const updateMessage = vi.fn((messageId: string, updates: Partial<Message>) => {
    const msgs = byTopic['topic_1']
    const index = msgs.findIndex((m) => m.messageId === messageId)
    if (index > -1) msgs[index] = { ...msgs[index], ...updates }
  })
  const labels = computed(() => defaultChatbotConfig.labels)
  const processor = useStreamProcessor({
    updateMessage,
    labels,
    getMessages: () => byTopic['topic_1'],
  })
  return { processor, byTopic, updateMessage }
}

describe('useStreamProcessor.processStream', () => {
  it('accumulates token chunks and marks sent on end', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))
    const controller = new AbortController()

    const result = await processor.processStream(
      gen([
        { type: 'token', content: 'He' },
        { type: 'token', content: 'llo' },
        { type: 'end' },
      ]),
      controller,
      'a1',
      false
    )

    expect(result.fullContent).toBe('Hello')
    expect(byTopic['topic_1'][0].content).toBe('Hello')
    expect(byTopic['topic_1'][0].status).toBe('sent')
  })

  it('routes reasoning into thinkingContent only when requested', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))
    const controller = new AbortController()

    await processor.processStream(
      gen([
        { type: 'reasoning', reasoningContent: 'thinking hard' },
        { type: 'token', content: 'answer' },
        { type: 'end' },
      ]),
      controller,
      'a1',
      true
    )

    expect(byTopic['topic_1'][0].thinkingContent).toBe('thinking hard')
    expect(byTopic['topic_1'][0].content).toBe('answer')
    expect(processor.isThinkingActive.value).toBe(false)
  })

  it('ignores reasoning chunks when thinking is not requested', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))

    const result = await processor.processStream(
      gen([
        { type: 'reasoning', reasoningContent: 'ignored' },
        { type: 'token', content: 'reply' },
        { type: 'end' },
      ]),
      new AbortController(),
      'a1',
      false
    )

    expect(byTopic['topic_1'][0].thinkingContent).toBeUndefined()
    expect(result.fullContent).toBe('reply')
  })

  it('toggles isThinkingActive during reasoning and clears at end', async () => {
    const { processor } = setup()
    const controller = new AbortController()
    const states: boolean[] = []

    const stream = (async function* () {
      yield { type: 'reasoning', reasoningContent: 'hmm' } as StreamEvent
      states.push(processor.isThinkingActive.value)
      yield { type: 'end' } as StreamEvent
      states.push(processor.isThinkingActive.value)
    })()

    await processor.processStream(stream, controller, 'x', true)
    expect(states[0]).toBe(true)
    expect(states[1]).toBe(false)
  })

  it('breaks at end when aborted (status finalized later as stopped, not sent)', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))
    const controller = new AbortController()

    const stream = (async function* () {
      yield { type: 'token', content: 'Partial' } as StreamEvent
      controller.abort()
      yield { type: 'end' } as StreamEvent
    })()

    await processor.processStream(stream, controller, 'a1', false)
    // end branch must be skipped when aborted — status stays loading for finalize
    expect(byTopic['topic_1'][0].status).toBe('loading')

    processor.finalizeStreamStatus('a1', controller)
    expect(byTopic['topic_1'][0].status).toBe('stopped')
    expect(byTopic['topic_1'][0].content).toBe('Partial')
  })
})

describe('useStreamProcessor.finalizeStreamStatus', () => {
  it('marks loading message without content as error with serverError label', () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))

    processor.finalizeStreamStatus('a1', new AbortController())

    expect(byTopic['topic_1'][0].status).toBe('error')
    expect(byTopic['topic_1'][0].errorMessage).toBe('服务器错误')
  })

  it('finalizes user message from sending to sent', () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(
      createPlaceholder('a1'),
      { messageId: 'u1', topicId: 'topic_1', role: 'user', type: 'text', content: 'q', timestamp: Date.now(), status: 'sending' }
    )

    processor.finalizeStreamStatus('a1', new AbortController(), 'u1')

    expect(byTopic['topic_1'].find((m) => m.messageId === 'u1')?.status).toBe('sent')
  })

  it('aborted with content uses generationStopped label', () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push({ ...createPlaceholder('a1'), content: 'partial text' })
    const controller = new AbortController()
    controller.abort()

    processor.finalizeStreamStatus('a1', controller)

    expect(byTopic['topic_1'][0].status).toBe('stopped')
    expect(byTopic['topic_1'][0].errorMessage).toBe('已停止生成')
  })

  it('is a no-op when the topic has no messages', () => {
    const { processor, updateMessage } = setup()
    expect(() => processor.finalizeStreamStatus('a1', new AbortController())).not.toThrow()
    expect(updateMessage).not.toHaveBeenCalled()
  })
})
