/**
 * Unit tests for TopicSearch component
 * Covers: rendering, v-model binding, debounce search, clear, watcher sync, focus method
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicSearch from '@/components/TopicSearch.vue'

describe('TopicSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = (props = {}) => {
    return mount(TopicSearch, {
      props: {
        ...props,
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render the component with search wrapper', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.topic-search').exists()).toBe(true)
      expect(wrapper.find('.topic-search__wrapper').exists()).toBe(true)
    })

    it('should render the search icon SVG', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.topic-search__icon').exists()).toBe(true)
    })

    it('should render the input element', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      expect(input.exists()).toBe(true)
    })

    it('should use default placeholder when not provided', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      expect(input.attributes('placeholder')).toBe('Search topics...')
    })

    it('should use custom placeholder when provided', () => {
      const wrapper = createWrapper({ placeholder: 'Search...' })
      const input = wrapper.find('input.topic-search__input')
      expect(input.attributes('placeholder')).toBe('Search...')
    })

    it('should not show clear button when search query is empty', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.topic-search__clear').exists()).toBe(false)
    })

    it('should show clear button when search query has text', async () => {
      const wrapper = createWrapper({ modelValue: 'test' })
      expect(wrapper.find('.topic-search__clear').exists()).toBe(true)
    })

    it('should show clear button after typing in input', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      await input.setValue('hello')
      expect(wrapper.find('.topic-search__clear').exists()).toBe(true)
    })
  })

  describe('v-model Binding', () => {
    it('should initialize searchQuery from modelValue prop', () => {
      const wrapper = createWrapper({ modelValue: 'initial search' })
      const input = wrapper.find('input.topic-search__input')
      expect(input.element.value).toBe('initial search')
    })

    it('should emit update:modelValue when input changes', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      await input.setValue('new query')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new query'])
    })

    it('should sync searchQuery when modelValue prop changes', async () => {
      const wrapper = createWrapper({ modelValue: 'old' })
      const input = wrapper.find('input.topic-search__input')
      expect(input.element.value).toBe('old')

      await wrapper.setProps({ modelValue: 'updated' })
      expect(input.element.value).toBe('updated')
    })

    it('should emit update:modelValue on every input change', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('a')
      await input.setValue('ab')
      await input.setValue('abc')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted?.length).toBe(3)
      expect(emitted?.[0]).toEqual(['a'])
      expect(emitted?.[1]).toEqual(['ab'])
      expect(emitted?.[2]).toEqual(['abc'])
    })
  })

  describe('Search Event with Debounce', () => {
    it('should emit search event after debounce delay', async () => {
      const wrapper = createWrapper({ debounceMs: 300 })
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('test query')
      // No immediate emission
      expect(wrapper.emitted('search')).toBeFalsy()

      // Advance timers past debounce delay
      vi.advanceTimersByTime(300)
      expect(wrapper.emitted('search')).toBeTruthy()
      expect(wrapper.emitted('search')?.[0]).toEqual(['test query'])
    })

    it('should use default debounce time of 300ms', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('test')
      vi.advanceTimersByTime(299)
      expect(wrapper.emitted('search')).toBeFalsy()

      vi.advanceTimersByTime(1)
      expect(wrapper.emitted('search')).toBeTruthy()
    })

    it('should use custom debounce time', async () => {
      const wrapper = createWrapper({ debounceMs: 500 })
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('test')
      vi.advanceTimersByTime(499)
      expect(wrapper.emitted('search')).toBeFalsy()

      vi.advanceTimersByTime(1)
      expect(wrapper.emitted('search')).toBeTruthy()
    })

    it('should cancel previous debounce timer on new input', async () => {
      const wrapper = createWrapper({ debounceMs: 300 })
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('first')
      vi.advanceTimersByTime(200) // Not enough for first timer

      await input.setValue('second')
      vi.advanceTimersByTime(300) // Timer for second input fires

      // Should only emit search with 'second' value
      const searchEvents = wrapper.emitted('search')
      expect(searchEvents?.length).toBe(1)
      expect(searchEvents?.[0]).toEqual(['second'])
    })

    it('should emit search for each completed debounce cycle', async () => {
      const wrapper = createWrapper({ debounceMs: 100 })
      const input = wrapper.find('input.topic-search__input')

      await input.setValue('query1')
      vi.advanceTimersByTime(100)

      await input.setValue('query2')
      vi.advanceTimersByTime(100)

      const searchEvents = wrapper.emitted('search')
      expect(searchEvents?.length).toBe(2)
      expect(searchEvents?.[0]).toEqual(['query1'])
      expect(searchEvents?.[1]).toEqual(['query2'])
    })
  })

  describe('Clear Functionality', () => {
    it('should clear search query on clear button click', async () => {
      const wrapper = createWrapper({ modelValue: 'search text' })
      expect(wrapper.find('input.topic-search__input').element.value).toBe('search text')

      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')

      expect(wrapper.find('input.topic-search__input').element.value).toBe('')
    })

    it('should emit update:modelValue with empty string on clear', async () => {
      const wrapper = createWrapper({ modelValue: 'search text' })
      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')

      const lastUpdateEvent = wrapper.emitted('update:modelValue')?.[wrapper.emitted('update:modelValue')!.length - 1]
      expect(lastUpdateEvent).toEqual([''])
    })

    it('should emit search with empty string on clear', async () => {
      const wrapper = createWrapper({ modelValue: 'search text' })
      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')

      // Clear emits search immediately (no debounce)
      expect(wrapper.emitted('search')).toBeTruthy()
      const lastSearchEvent = wrapper.emitted('search')?.[wrapper.emitted('search')!.length - 1]
      expect(lastSearchEvent).toEqual([''])
    })

    it('should hide clear button after clearing', async () => {
      const wrapper = createWrapper({ modelValue: 'search text' })
      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')

      expect(wrapper.find('.topic-search__clear').exists()).toBe(false)
    })

    it('should focus input after clearing', async () => {
      const wrapper = createWrapper({ modelValue: 'search text' })
      const inputEl = wrapper.find('input.topic-search__input').element as HTMLInputElement
      inputEl.focus = vi.fn()

      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')

      expect(inputEl.focus).toHaveBeenCalled()
    })
  })

  describe('Exposed focus Method', () => {
    it('should expose focus method', () => {
      const wrapper = createWrapper()
      expect(typeof wrapper.vm.focus).toBe('function')
    })

    it('should focus the input element when focus is called', () => {
      const wrapper = createWrapper()
      const inputEl = wrapper.find('input.topic-search__input').element as HTMLInputElement
      inputEl.focus = vi.fn()

      wrapper.vm.focus()
      expect(inputEl.focus).toHaveBeenCalled()
    })

    it('should not throw if inputRef is null', () => {
      const wrapper = createWrapper()
      // Even if the input ref were null, focus should not throw
      expect(() => wrapper.vm.focus()).not.toThrow()
    })
  })

  describe('Watcher Sync', () => {
    it('should update searchQuery when modelValue prop changes externally', async () => {
      const wrapper = createWrapper({ modelValue: 'first' })
      expect(wrapper.find('input.topic-search__input').element.value).toBe('first')

      await wrapper.setProps({ modelValue: 'second' })
      expect(wrapper.find('input.topic-search__input').element.value).toBe('second')
    })

    it('should emit update:modelValue when searchQuery changes internally', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      await input.setValue('typed text')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const lastEvent = wrapper.emitted('update:modelValue')?.[wrapper.emitted('update:modelValue')!.length - 1]
      expect(lastEvent).toEqual(['typed text'])
    })

    it('should handle empty modelValue prop', () => {
      const wrapper = createWrapper({ modelValue: '' })
      expect(wrapper.find('input.topic-search__input').element.value).toBe('')
      expect(wrapper.find('.topic-search__clear').exists()).toBe(false)
    })
  })

  describe('handleInput Method', () => {
    it('should debounce search emission on input event', async () => {
      const wrapper = createWrapper({ debounceMs: 200 })
      // Directly trigger the input event on the input
      const input = wrapper.find('input.topic-search__input')
      await input.setValue('search term')
      await input.trigger('input')

      // Before debounce completes
      expect(wrapper.emitted('search')).toBeFalsy()

      vi.advanceTimersByTime(200)
      expect(wrapper.emitted('search')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid input changes', async () => {
      const wrapper = createWrapper({ debounceMs: 100 })
      const input = wrapper.find('input.topic-search__input')

      // Rapid typing - each change resets the debounce
      await input.setValue('a')
      vi.advanceTimersByTime(50)
      await input.setValue('ab')
      vi.advanceTimersByTime(50)
      await input.setValue('abc')
      vi.advanceTimersByTime(100) // Only last debounce fires

      const searchEvents = wrapper.emitted('search')
      expect(searchEvents?.length).toBe(1)
      expect(searchEvents?.[0]).toEqual(['abc'])
    })

    it('should handle special characters in search query', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      await input.setValue('test@#$%')
      expect(input.element.value).toBe('test@#$%')

      vi.advanceTimersByTime(300)
      expect(wrapper.emitted('search')?.[0]).toEqual(['test@#$%'])
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(500)
      const wrapper = createWrapper()
      const input = wrapper.find('input.topic-search__input')
      await input.setValue(longQuery)
      expect(input.element.value).toBe(longQuery)
    })

    it('should handle clear when input has whitespace only', async () => {
      const wrapper = createWrapper({ modelValue: '   ' })
      expect(wrapper.find('.topic-search__clear').exists()).toBe(true)

      const clearBtn = wrapper.find('.topic-search__clear')
      await clearBtn.trigger('click')
      expect(wrapper.find('input.topic-search__input').element.value).toBe('')
    })
  })
})