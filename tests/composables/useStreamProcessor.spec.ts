import { describe, it, expect, vi } from 'vitest'
import { computed } from 'vue'
import { useStreamProcessor, type StreamRunHandle } from '@/composables/useStreamProcessor'
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
  const renameMessage = vi.fn((oldId: string, newId: string) => {
    const msgs = byTopic['topic_1']
    const index = msgs.findIndex((m) => m.messageId === oldId)
    if (index > -1) msgs[index] = { ...msgs[index], messageId: newId }
  })
  const labels = computed(() => defaultChatbotConfig.labels)
  const processor = useStreamProcessor({
    updateMessage,
    renameMessage,
    labels,
    getMessages: () => byTopic['topic_1'],
  })
  return { processor, byTopic, updateMessage, renameMessage }
}

/** Helper: run a stream against a ref handle initialised with localId */
function refOf(localId: string): StreamRunHandle {
  return { current: localId }
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
      refOf('a1'),
      false
    )

    expect(result.fullContent).toBe('Hello')
    expect(result.streamStarted).toBe(true)
    expect(byTopic['topic_1'][0].content).toBe('Hello')
    expect(byTopic['topic_1'][0].status).toBe('sent')
  })

  it('reports streamStarted=false for a degenerate start-only stream (no unpaired end)', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))

    const result = await processor.processStream(
      gen([{ type: 'start', messageId: 'srv-degenerate' }]),
      new AbortController(),
      refOf('a1'),
      false
    )

    expect(result.streamStarted).toBe(false)
    // Adoption still applied — later feedback/delete correlate with the server id
    expect(byTopic['topic_1'][0].messageId).toBe('srv-degenerate')
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
      refOf('a1'),
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
      refOf('a1'),
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

    await processor.processStream(stream, controller, refOf('x'), true)
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

    await processor.processStream(stream, controller, refOf('a1'), false)
    // end branch must be skipped when aborted — status stays loading for finalize
    expect(byTopic['topic_1'][0].status).toBe('loading')

    processor.finalizeStreamStatus('a1', controller)
    expect(byTopic['topic_1'][0].status).toBe('stopped')
    expect(byTopic['topic_1'][0].content).toBe('Partial')
  })

  it('fires onStreamStart exactly once across many chunks', async () => {
    const { processor } = setup()
    const onStreamStart = vi.fn()

    await processor.processStream(
      gen([
        { type: 'start', messageId: 'srv-8' },
        { type: 'token', content: 'a' },
        { type: 'token', content: 'b' },
        { type: 'reasoning', reasoningContent: 'r' },
        { type: 'end' },
      ]),
      new AbortController(),
      refOf('local-8'),
      true,
      onStreamStart
    )

    expect(onStreamStart).toHaveBeenCalledTimes(1)
  })

  it('throws on SSE error events so the caller surfaces the upstream failure', async () => {
    const { processor, byTopic } = setup()
    byTopic['topic_1'].push(createPlaceholder('a1'))

    await expect(
      processor.processStream(
        gen([
          { type: 'start', messageId: 'srv-err' },
          { type: 'error', error: 'Ollama request failed: 503' },
        ]),
        new AbortController(),
        refOf('a1'),
        false
      )
    ).rejects.toThrow('Ollama request failed: 503')

    // The message keeps the ADOPTED id so error marking lands on it
    expect(byTopic['topic_1'][0].messageId).toBe('srv-err')
  })

  it('throws a generic message on SSE error events without an error field', async () => {
    const { processor } = setup()

    await expect(
      processor.processStream(
        gen([{ type: 'error' }]),
        new AbortController(),
        refOf('a1'),
        false
      )
    ).rejects.toThrow('Stream error')
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

describe('useStreamProcessor server messageId adoption', () => {
  it('adopts the server messageId from the start event and reports it via the ref', async () => {
    const { processor, byTopic, renameMessage } = setup()
    byTopic['topic_1'].push(createPlaceholder('local-1'))
    const idRef = refOf('local-1')

    await processor.processStream(
      gen([
        { type: 'start', messageId: 'srv-1' },
        { type: 'token', content: 'hi' },
        { type: 'end' },
      ]),
      new AbortController(),
      idRef,
      false
    )

    expect(renameMessage).toHaveBeenCalledWith('local-1', 'srv-1')
    expect(byTopic['topic_1'][0].messageId).toBe('srv-1')
    expect(byTopic['topic_1'][0].content).toBe('hi')
    expect(byTopic['topic_1'][0].status).toBe('sent')
    expect(idRef.current).toBe('srv-1')
  })

  it('keeps the local id when the start event carries no messageId', async () => {
    const { processor, byTopic, renameMessage } = setup()
    byTopic['topic_1'].push(createPlaceholder('local-2'))
    const idRef = refOf('local-2')

    await processor.processStream(
      gen([
        { type: 'start' },
        { type: 'token', content: 'ok' },
        { type: 'end' },
      ]),
      new AbortController(),
      idRef,
      false
    )

    expect(renameMessage).not.toHaveBeenCalled()
    expect(byTopic['topic_1'][0].messageId).toBe('local-2')
    expect(idRef.current).toBe('local-2')
  })

  it('ignores a server id identical to the local placeholder id', async () => {
    const { processor, renameMessage } = setup()
    const idRef = refOf('same-id')

    await processor.processStream(
      gen([
        { type: 'start', messageId: 'same-id' },
        { type: 'end' },
      ]),
      new AbortController(),
      idRef,
      false
    )

    expect(renameMessage).not.toHaveBeenCalled()
    expect(idRef.current).toBe('same-id')
  })

  it('onStreamStart sees the adopted id (start/end event pairing for hosts)', async () => {
    const { processor } = setup()
    const idRef = refOf('local-3')
    const startIds: string[] = []

    await processor.processStream(
      gen([
        { type: 'start', messageId: 'srv-3' },
        { type: 'token', content: 'x' },
        { type: 'end' },
      ]),
      new AbortController(),
      idRef,
      false,
      () => startIds.push(idRef.current)
    )

    expect(startIds).toEqual(['srv-3'])
  })

  it('does not fire onStreamStart when the stream fails before any content', async () => {
    const { processor } = setup()
    const onStreamStart = vi.fn()

    await expect(
      processor.processStream(
        (async function* () {
          yield { type: 'start' } as StreamEvent
          throw new Error('upstream boom')
        })(),
        new AbortController(),
        refOf('local-4'),
        false,
        onStreamStart
      )
    ).rejects.toThrow('upstream boom')

    expect(onStreamStart).not.toHaveBeenCalled()
  })
})
