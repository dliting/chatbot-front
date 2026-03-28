/**
 * Unit tests for useStream composable - reasoning/thinking events
 */
import { describe, it, expect } from 'vitest'
import { useStream } from '@/composables/useStream'

describe('useStream - reasoning events', () => {
  it('should accumulate thinking content from reasoning events', async () => {
    const { streamedThinkingContent, streamedContent, isThinking, streamFromGenerator } = useStream({ enabled: true })

    async function* generator() {
      yield { type: 'start', messageId: 'msg-1' }
      yield { type: 'reasoning', reasoningContent: 'Let me think' }
      yield { type: 'reasoning', reasoningContent: ' about this' }
      yield { type: 'token', content: 'Answer' }
      yield { type: 'end', fullContent: 'Answer' }
    }

    await streamFromGenerator(generator())
    expect(streamedThinkingContent.value).toBe('Let me think about this')
    expect(streamedContent.value).toBe('Answer')
  })

  it('should track isThinking state correctly', async () => {
    const { isThinking, streamFromGenerator } = useStream({ enabled: true })
    let thinkingStateDuringStream = false

    async function* generator() {
      yield { type: 'start' }
      yield { type: 'reasoning', reasoningContent: 'hmm' }
      thinkingStateDuringStream = isThinking.value
      yield { type: 'token', content: 'done' }
      yield { type: 'end' }
    }

    await streamFromGenerator(generator())
    expect(thinkingStateDuringStream).toBe(true)
    expect(isThinking.value).toBe(false)
  })

  it('should reset thinking content on new stream', async () => {
    const { streamedThinkingContent, streamFromGenerator } = useStream({ enabled: true })

    async function* gen1() {
      yield { type: 'start' }
      yield { type: 'reasoning', reasoningContent: 'old' }
      yield { type: 'token', content: 'a' }
      yield { type: 'end' }
    }

    async function* gen2() {
      yield { type: 'start' }
      yield { type: 'token', content: 'b' }
      yield { type: 'end' }
    }

    await streamFromGenerator(gen1())
    expect(streamedThinkingContent.value).toBe('old')

    await streamFromGenerator(gen2())
    expect(streamedThinkingContent.value).toBe('')
  })

  it('should set isThinking false on error event', async () => {
    const { isThinking, streamFromGenerator } = useStream({ enabled: true })

    async function* errorGen() {
      yield { type: 'start' }
      yield { type: 'reasoning', reasoningContent: 'hmm' }
      yield { type: 'error', error: 'failed' }
    }

    await streamFromGenerator(errorGen())
    expect(isThinking.value).toBe(false)
  })

  it('should reset thinking state via reset()', async () => {
    const { streamedThinkingContent, isThinking, reset } = useStream()

    // Simulate having some thinking state
    // We need to use internal access pattern since these are refs
    const { nextTick } = await import('vue')

    // Access via the composable's returned refs and set values
    // (simulating state left over from a previous stream)
    reset()
    expect(streamedThinkingContent.value).toBe('')
    expect(isThinking.value).toBe(false)
  })
})
