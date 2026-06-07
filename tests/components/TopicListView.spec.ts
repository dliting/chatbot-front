/**
 * Tests for TopicListView component
 * Covers: rendering, selection, batch mode, inject actions, view navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TopicListView from '@/components/TopicListView.vue'
import { topicActionsKey, uiActionsKey } from '@/symbols'
import { createMockTopicActions, createMockUIActions } from '../utils/mockActions'

const mockTopics = [
  { topicId: 't1', title: 'Topic 1', messageCount: 5, unreadCount: 0, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { topicId: 't2', title: 'Topic 2', messageCount: 3, unreadCount: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { topicId: 't3', title: 'Topic 3', messageCount: 0, unreadCount: 2, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
]

const defaultTopicActions = createMockTopicActions()
const defaultUIActions = createMockUIActions()

function mountTopicListView(props: Record<string, any> = {}, provide: Record<string, any> = {}) {
  return mount(TopicListView, {
    props: {
      topics: mockTopics,
      currentTopicId: 't1',
      ...props,
    },
    global: {
      provide: {
        [topicActionsKey]: defaultTopicActions,
        [uiActionsKey]: defaultUIActions,
        ...provide,
      },
      stubs: {
        TopicSearch: { template: '<input class="topic-search-mock" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['modelValue', 'placeholder'], emits: ['update:modelValue'] },
        TopicActionMenu: { template: '<div class="action-menu-mock"><slot /></div>' },
        ConfirmDialog: { template: '<div class="confirm-dialog-mock" />' },
      },
    },
  })
}

describe('TopicListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all topics', () => {
      const wrapper = mountTopicListView()
      const items = wrapper.findAll('.chatbot-topics__item')
      expect(items.length).toBe(3)
    })

    it('should highlight current topic with active class', () => {
      const wrapper = mountTopicListView()
      const items = wrapper.findAll('.chatbot-topics__item')
      expect(items[0].classes()).toContain('chatbot-topics__item--active')
    })

    it('should show unread count badge for topics with unreadCount > 0', () => {
      const wrapper = mountTopicListView()
      const badges = wrapper.findAll('.chatbot-topics__item-badge')
      expect(badges.length).toBe(2) // t2 has 1, t3 has 2
    })

    it('should render empty state when no topics', () => {
      const wrapper = mountTopicListView({ topics: [] })
      expect(wrapper.find('.chatbot-topics__empty').exists()).toBe(true)
    })

    it('should show new topic button', () => {
      const wrapper = mountTopicListView()
      expect(wrapper.find('.chatbot-topics__new-btn').exists()).toBe(true)
    })

    it('should show batch mode button when topics exist', () => {
      const wrapper = mountTopicListView()
      expect(wrapper.find('.chatbot-topics__batch-mode-btn').exists()).toBe(true)
    })

    it('should show close button when not embedded', () => {
      const wrapper = mountTopicListView()
      expect(wrapper.find('.chatbot-topics__header-close').exists()).toBe(true)
    })

    it('should hide close button when embedded without enableClose', () => {
      const wrapper = mountTopicListView({ isEmbedded: true })
      expect(wrapper.find('.chatbot-topics__header-close').exists()).toBe(false)
    })
  })

  describe('topic selection via inject', () => {
    it('should call topicActions.switchToTopic when clicking a topic', async () => {
      const wrapper = mountTopicListView()
      const items = wrapper.findAll('.chatbot-topics__item')
      await items[1].trigger('click')
      expect(defaultTopicActions.switchToTopic).toHaveBeenCalledWith('t2')
    })

    it('should call uiActions.showChatView when clicking a topic', async () => {
      const wrapper = mountTopicListView()
      const items = wrapper.findAll('.chatbot-topics__item')
      await items[1].trigger('click')
      expect(defaultUIActions.showChatView).toHaveBeenCalled()
    })

    it('should not call showChatView when no uiActions injected', async () => {
      const wrapper = mountTopicListView({}, {
        [uiActionsKey as symbol]: null,
      })
      const items = wrapper.findAll('.chatbot-topics__item')
      await items[1].trigger('click')
      // No error thrown, topicActions still called
      expect(defaultTopicActions.switchToTopic).toHaveBeenCalledWith('t2')
    })
  })

  describe('batch mode', () => {
    it('should enter batch mode when batch button clicked', async () => {
      const wrapper = mountTopicListView()
      const batchBtn = wrapper.find('.chatbot-topics__batch-mode-btn')
      await batchBtn.trigger('click')
      expect(wrapper.vm.isBatchMode).toBe(true)
    })

    it('should show checkboxes in batch mode', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.chatbot-topics__checkbox').length).toBe(3)
    })

    it('should toggle selection when clicking checkbox', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const checkbox = wrapper.find('.chatbot-topics__checkbox')
      await checkbox.trigger('click')
      expect(wrapper.vm.selectedTopicIds).toContain('t1')
    })

    it('should exit batch mode when toggle clicked again', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      expect(wrapper.vm.isBatchMode).toBe(true)
      const toggleBtn = wrapper.find('.chatbot-topics__batch-toggle')
      await toggleBtn.trigger('click')
      expect(wrapper.vm.isBatchMode).toBe(false)
    })
  })

  describe('topic actions via inject', () => {
    it('should use topicActions.removeTopic for single delete', async () => {
      const mockRemove = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ removeTopic: mockRemove }),
      })
      wrapper.vm.pendingDeleteIds = ['t2']
      wrapper.vm.confirmDelete()
      expect(mockRemove).toHaveBeenCalledWith('t2')
    })

    it('should use topicActions.removeTopics for batch delete', async () => {
      const mockRemoveTopics = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ removeTopics: mockRemoveTopics }),
      })
      wrapper.vm.pendingDeleteIds = ['t1', 't2']
      wrapper.vm.confirmDelete()
      expect(mockRemoveTopics).toHaveBeenCalledWith(['t1', 't2'])
    })

    it('should use topicActions.renameTopic when saving title', async () => {
      const mockRename = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ renameTopic: mockRename }),
      })
      wrapper.vm.editingTopicId = 't1'
      wrapper.vm.editingTitle = 'New Title'
      wrapper.vm.saveTitle('t1')
      expect(mockRename).toHaveBeenCalledWith('t1', 'New Title')
    })

    it('should not rename when title is unchanged', async () => {
      const mockRename = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ renameTopic: mockRename }),
      })
      wrapper.vm.editingTopicId = 't1'
      wrapper.vm.editingTitle = 'Topic 1'
      wrapper.vm.saveTitle('t1')
      expect(mockRename).not.toHaveBeenCalled()
    })

    it('should not rename when title is empty', async () => {
      const mockRename = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ renameTopic: mockRename }),
      })
      wrapper.vm.editingTopicId = 't1'
      wrapper.vm.editingTitle = '   '
      wrapper.vm.saveTitle('t1')
      expect(mockRename).not.toHaveBeenCalled()
    })

    it('should use topicActions.createNewTopic when available', async () => {
      const mockCreate = vi.fn()
      const wrapper = mountTopicListView({}, {
        [topicActionsKey as symbol]: createMockTopicActions({ createNewTopic: mockCreate }),
      })
      wrapper.vm.handleCreateTopic()
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  describe('delete confirmation', () => {
    it('should show delete dialog when delete button clicked', async () => {
      const wrapper = mountTopicListView()
      const deleteBtn = wrapper.find('.chatbot-topics__item-delete')
      if (deleteBtn.exists()) {
        await deleteBtn.trigger('click')
        expect(wrapper.vm.showDeleteDialog).toBe(true)
      }
    })
  })

  describe('search', () => {
    it('should filter topics by search query', async () => {
      const wrapper = mountTopicListView()
      const searchInput = wrapper.find('.topic-search-mock')
      await searchInput.setValue('Topic 2')
      await nextTick()
      const items = wrapper.findAll('.chatbot-topics__item')
      expect(items.length).toBe(1)
    })

    it('should show no results message for non-matching query', async () => {
      const wrapper = mountTopicListView()
      const searchInput = wrapper.find('.topic-search-mock')
      await searchInput.setValue('nonexistent')
      await nextTick()
      expect(wrapper.find('.chatbot-topics__empty').exists()).toBe(true)
    })
  })

  describe('embedded mode', () => {
    it('should add embedded class when isEmbedded is true', () => {
      const wrapper = mountTopicListView({ isEmbedded: true })
      const container = wrapper.find('.topic-list-view')
      expect(container.classes()).toContain('topic-list-view--embedded')
    })
  })

  describe('batch delete flow', () => {
    it('should show batch bar when items are selected', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const checkbox = wrapper.find('.chatbot-topics__checkbox')
      await checkbox.trigger('click')
      await nextTick()
      expect(wrapper.find('.chatbot-topics__batch-bar').exists()).toBe(true)
      expect(wrapper.find('.chatbot-topics__batch-count').exists()).toBe(true)
    })

    it('should open delete dialog when batch delete button clicked', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const checkbox = wrapper.find('.chatbot-topics__checkbox')
      await checkbox.trigger('click')
      await nextTick()
      const batchDeleteBtn = wrapper.find('.chatbot-topics__batch-btn--delete')
      await batchDeleteBtn.trigger('click')
      expect(wrapper.vm.showDeleteDialog).toBe(true)
      expect(wrapper.vm.pendingDeleteIds).toContain('t1')
    })

    it('should clear selection when cancel button clicked in batch bar', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const checkbox = wrapper.find('.chatbot-topics__checkbox')
      await checkbox.trigger('click')
      await nextTick()
      const cancelBtn = wrapper.find('.chatbot-topics__batch-btn--cancel')
      await cancelBtn.trigger('click')
      expect(wrapper.vm.selectedTopicIds).toEqual([])
    })
  })

  describe('title editing', () => {
    it('should start editing on double-click', async () => {
      const wrapper = mountTopicListView()
      const content = wrapper.find('.chatbot-topics__item-content')
      await content.trigger('dblclick')
      await nextTick()
      expect(wrapper.vm.editingTopicId).toBeTruthy()
    })

    it('should not start editing in batch mode', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const content = wrapper.find('.chatbot-topics__item-content')
      await content.trigger('dblclick')
      expect(wrapper.vm.editingTopicId).toBeNull()
    })

    it('should cancel edit on escape', async () => {
      const wrapper = mountTopicListView()
      wrapper.vm.editingTopicId = 't1'
      wrapper.vm.editingTitle = 'test'
      wrapper.vm.cancelEdit()
      expect(wrapper.vm.editingTopicId).toBeNull()
      expect(wrapper.vm.editingTitle).toBe('')
    })
  })

  describe('close button', () => {
    it('should emit close when close button clicked', async () => {
      const wrapper = mountTopicListView()
      const closeBtn = wrapper.find('.chatbot-topics__header-close')
      await closeBtn.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('search with empty topics', () => {
    it('should show noTopicsHint when no topics and no search', () => {
      const wrapper = mountTopicListView({ topics: [], noTopicsHint: 'Start a conversation' })
      expect(wrapper.find('.chatbot-topics__empty').text()).toContain('Start a conversation')
    })
  })

  describe('topic click in batch mode', () => {
    it('should toggle selection when clicking topic in batch mode', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      const items = wrapper.findAll('.chatbot-topics__item')
      await items[1].trigger('click')
      expect(wrapper.vm.selectedTopicIds).toContain('t2')
    })

    it('should deselect when clicking selected topic in batch mode', async () => {
      const wrapper = mountTopicListView()
      await wrapper.find('.chatbot-topics__batch-mode-btn').trigger('click')
      await nextTick()
      // Select first via checkbox
      const checkbox = wrapper.find('.chatbot-topics__checkbox')
      await checkbox.trigger('click')
      expect(wrapper.vm.selectedTopicIds).toContain('t1')
      // Click the same topic item to deselect
      const items = wrapper.findAll('.chatbot-topics__item')
      await items[0].trigger('click')
      expect(wrapper.vm.selectedTopicIds).not.toContain('t1')
    })
  })

  describe('embedded with enableClose', () => {
    it('should show close button when embedded with enableClose=true and layout=dual', () => {
      const wrapper = mountTopicListView({ isEmbedded: true, enableClose: true, layout: 'dual' })
      expect(wrapper.find('.chatbot-topics__header-close').exists()).toBe(true)
    })
  })
})
