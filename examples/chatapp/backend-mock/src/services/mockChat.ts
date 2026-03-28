/**
 * Mock Chat Service - Returns simulated AI responses
 */

const mockResponses = [
  "这是一个模拟的AI回复。让我思考一下您的问题...",
  "很有趣的问题！根据您输入的内容，我有以下看法：",
  "感谢您的提问。以下是我的一些分析：",
  "好的，让我来回答这个问题。",
  "这是一个很好的问题，我来详细解释一下：",
]

function getMockResponse(input: string): string {
  const baseResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  return `${baseResponse}

您的问题是："${input || '无内容'}"

以下是详细回答：

1. **第一点说明**：这是一个模拟响应，用于开发和测试目的。

2. **第二点说明**：在实际生产环境中，这里会连接真实的AI后端服务（如Ollama、Claude、GPT等）。

3. **代码示例**：
\`\`\`javascript
const response = await ai.chat({
  model: 'qwen3.5:9b',
  messages: [{ role: 'user', content: '${input}' }]
});
console.log(response);
**功能说明**：
- 支持流\`\`\`

式输出（streaming）
- 支持会话管理
- 支持消息历史

如有更多问题，请继续提问！`
}

export interface MockChatOptions {
  thinking?: { enabled?: boolean }
}

function getMockThinkingContent(input: string): string {
  return `好的，让我分析一下这个问题...\n\n用户的问题是："${input}"\n\n我需要从以下几个角度来考虑：\n1. 问题的核心需求是什么\n2. 最合适的解决方案\n3. 如何清晰地表达回答`
}

export async function* streamMockChat(
  messages: Array<{ role: string; content: string }>,
  options?: MockChatOptions
): AsyncGenerator<{ type: string; content?: string; fullContent?: string; reasoningContent?: string }, void, unknown> {
  const lastMessage = messages[messages.length - 1]
  const input = lastMessage?.content || ''
  const response = getMockResponse(input)

  yield { type: 'start', content: '' }

  // Stream thinking content before main response if enabled
  if (options?.thinking?.enabled) {
    const thinkingText = getMockThinkingContent(input)
    for (const char of thinkingText) {
      await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20))
      yield { type: 'reasoning', reasoningContent: char }
    }
  }

  // Stream tokens character by character
  for (const char of response) {
    await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30))
    yield { type: 'token', content: char }
  }

  yield { type: 'end', fullContent: response }
}

export async function mockChat(
  messages: Array<{ role: string; content: string }>,
  options?: MockChatOptions
): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  const input = lastMessage?.content || ''

  if (options?.thinking?.enabled) {
    const thinkingText = getMockThinkingContent(input)
    return thinkingText + '\n\n---\n\n' + getMockResponse(input)
  }

  return getMockResponse(input)
}
