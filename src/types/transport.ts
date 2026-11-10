/**
 * Transport Bridge types (Bridge pattern).
 *
 * ChatTransport is the implementation seam behind the chat abstraction:
 * hosts with a non-REST backend (WebSocket, OpenAI-compatible gateway,
 * in-process model, …) implement this interface and inject it via
 * ChatbotConfig.transport. The default implementation is the HTTP REST+SSE
 * client (useApiClient) selected when no transport is provided.
 */
import type { Attachment, Message, StreamEvent, Topic } from './index'

export interface ChatTransportStreamParams {
  topicId: string
  content: string
  attachments?: Attachment[]
  thinking?: { enabled: boolean }
  signal?: AbortSignal
  /** Extra information from QuickAction.extraInfo. Available in callbacks. */
  extraInfo?: string
}

export interface ChatTransport {
  /**
   * Streaming send — used when config.streamEnabled is true (default).
   * Must yield StreamEvent tokens/reasoning/end. Use textToStream /
   * messageToStream (utils/stream.ts) to adapt plain responses.
   */
  streamMessage(params: ChatTransportStreamParams): AsyncGenerator<StreamEvent>
  /**
   * Non-streaming send — used when config.streamEnabled is false.
   * Resolve with the completed assistant message.
   */
  sendMessage(params: ChatTransportStreamParams): Promise<Message>
  /** Optional topic/message backend operations; omit for local-only topics */
  loadTopics?(signal?: AbortSignal): Promise<Topic[]>
  loadMessages?(topicId: string, signal?: AbortSignal): Promise<Message[]>
  createTopic?(title?: string): Promise<Topic>
  deleteTopic?(topicId: string): Promise<void>
  updateTopicTitle?(topicId: string, title: string): Promise<void>
  deleteMessage?(messageId: string): Promise<void>
  /** Voice-to-text for the transcriber inject chain */
  transcribe?(audio: string, format: string): Promise<string>
}
