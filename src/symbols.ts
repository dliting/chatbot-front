/**
 * Injection keys for provide/inject pattern
 * Using Symbol keys per Vue best practice to avoid collisions
 */
import type { ComputedRef, InjectionKey } from 'vue'
import type { ChatActionHandlers, TopicActionHandlers, UIActionHandlers, ChatState, VoiceTranscriber } from './index'

/** Type for the prompt variable resolver */
export interface PromptVarResolver {
  resolve: (prompt: string) => Promise<string>
}

export const chatStateKey: InjectionKey<ChatState> = Symbol('chatState')
export const chatActionsKey: InjectionKey<ChatActionHandlers> = Symbol('chatActions')
export const topicActionsKey: InjectionKey<TopicActionHandlers> = Symbol('topicActions')
export const uiActionsKey: InjectionKey<UIActionHandlers> = Symbol('uiActions')
export const promptVarResolverKey: InjectionKey<PromptVarResolver> = Symbol('promptVarResolver')

/** Transcribes recorded audio (base64 + format) into text — provided by AIChatbot when an API client exists */
export const voiceTranscriberKey: InjectionKey<ComputedRef<VoiceTranscriber | undefined>> = Symbol('voiceTranscriber')
