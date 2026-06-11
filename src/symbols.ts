/**
 * Injection keys for provide/inject pattern
 * Using Symbol keys per Vue best practice to avoid collisions
 */
import type { InjectionKey } from 'vue'
import type { ChatActionHandlers, TopicActionHandlers, UIActionHandlers, ChatState } from './index'

export const chatStateKey: InjectionKey<ChatState> = Symbol('chatState')
export const chatActionsKey: InjectionKey<ChatActionHandlers> = Symbol('chatActions')
export const topicActionsKey: InjectionKey<TopicActionHandlers> = Symbol('topicActions')
export const uiActionsKey: InjectionKey<UIActionHandlers> = Symbol('uiActions')