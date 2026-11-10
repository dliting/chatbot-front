
describe('transport stream helpers (Bridge pattern)', () => {
  it('textToStream yields one token with the full text then end', async () => {
    const { textToStream } = await import('@/utils/stream')
    const events: StreamEvent[] = []
    for await (const e of textToStream('你好世界')) events.push(e)
    expect(events).toEqual([
      { type: 'token', content: '你好世界' },
      { type: 'end' },
    ])
  })

  it('messageToStream replays message content, thinking and final status', async () => {
    const { messageToStream } = await import('@/utils/stream')
    const message: Message = {
      messageId: 'm1',
      topicId: 't1',
      role: 'assistant',
      type: 'text',
      content: 'answer',
      thinkingContent: 'hmm',
      timestamp: Date.now(),
      status: 'sent',
    }
    const events: StreamEvent[] = []
    for await (const e of messageToStream(message)) events.push(e)
    expect(events).toEqual([
      { type: 'reasoning', reasoningContent: 'hmm' },
      { type: 'token', content: 'answer' },
      { type: 'end' },
    ])
  })

  it('messageToStream skips thinking when absent', async () => {
    const { messageToStream } = await import('@/utils/stream')
    const message: Message = {
      messageId: 'm1',
      topicId: 't1',
      role: 'assistant',
      type: 'text',
      content: 'answer',
      timestamp: Date.now(),
      status: 'sent',
    }
    const events: StreamEvent[] = []
    for await (const e of messageToStream(message)) events.push(e)
    expect(events.some((e) => e.type === 'reasoning')).toBe(false)
    expect(events[events.length - 1].type).toBe('end')
  })
})
