import type { QuickAction, Locale } from '@/types'

const zhCNQuickActions: QuickAction[] = [
  {
    id: 'write-email',
    title: '写邮件',
    description: '帮我撰写邮件',
    prompt: '帮我写一封邮件',
    icon: 'write',
  },
  {
    id: 'summarize',
    title: '总结文章',
    description: '提取关键信息',
    prompt: '帮我总结这篇文章',
    icon: 'analyze',
  },
  {
    id: 'translate',
    title: '翻译',
    description: '多语言翻译',
    prompt: '帮我翻译这段文字',
    icon: 'translate',
  },
  {
    id: 'data-analysis',
    title: '数据分析',
    description: '智能分析数据',
    prompt: '帮我分析数据',
    icon: 'code',
  },
]

const enUSQuickActions: QuickAction[] = [
  {
    id: 'write-email',
    title: 'Write Email',
    description: 'Help me write an email',
    prompt: 'Help me write an email',
    icon: 'write',
  },
  {
    id: 'summarize',
    title: 'Summarize',
    description: 'Extract key information',
    prompt: 'Help me summarize this article',
    icon: 'analyze',
  },
  {
    id: 'translate',
    title: 'Translate',
    description: 'Multi-language translation',
    prompt: 'Help me translate this text',
    icon: 'translate',
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis',
    description: 'Smart data analysis',
    prompt: 'Help me analyze this data',
    icon: 'code',
  },
]

export function getDefaultQuickActions(locale: Locale = 'zh-CN'): QuickAction[] {
  return locale === 'en-US' ? enUSQuickActions : zhCNQuickActions
}

export const defaultQuickActions = zhCNQuickActions
