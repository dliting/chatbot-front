/**
 * Unit tests for TopicSearch component
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicSearch from '@/components/TopicSearch.vue'

describe('TopicSearch', () => {
  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(TopicSearch)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.topic-search').exists()).toBe(true)
    })

    it('should render input field', () => {
      const wrapper = mount(TopicSearch)
      expect(wrapper.find('.topic-search__input').exists()).toBe(true)
    })

    it('should render search icon', () => {
      const wrapper = mount(TopicSearch)
      expect(wrapper.find('.topic-search__icon').exists()).toBe(true)
    })

    it('should not render clear button when input is empty', () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: '',
        },
      })
      expect(wrapper.find('.topic-search__clear').exists()).toBe(false)
    })

    it('should render clear button when input has value', () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: 'test',
        },
      })
      expect(wrapper.find('.topic-search__clear').exists()).toBe(true)
    })

    it('should render custom placeholder', () => {
      const wrapper = mount(TopicSearch, {
        props: {
          placeholder: 'Search conversations...',
        },
      })
      const input = wrapper.find('.topic-search__input')
      expect(input.attributes('placeholder')).toBe('Search conversations...')
    })
  })

  describe('v-model', () => {
    it('should bind value to input', () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: 'hello',
        },
      })
      const input = wrapper.find('.topic-search__input') as any
      expect(input.element.value).toBe('hello')
    })

    it('should emit update:modelValue on input', async () => {
      const wrapper = mount(TopicSearch)
      const input = wrapper.find('.topic-search__input')

      await input.setValue('test')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test'])
    })

    it('should sync when modelValue prop changes', async () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: 'initial',
        },
      })

      await wrapper.setProps({ modelValue: 'updated' })

      const input = wrapper.find('.topic-search__input') as any
      expect(input.element.value).toBe('updated')
    })
  })

  describe('Search Events', () => {
    it('should emit search event after debounce', async () => {
      vi.useFakeTimers()

      const wrapper = mount(TopicSearch, {
        props: {
          debounceMs: 300,
        },
      })
      const input = wrapper.find('.topic-search__input')

      await input.setValue('test')

      // Should not emit immediately
      expect(wrapper.emitted('search')).toBeFalsy()

      // Fast forward through debounce
      vi.advanceTimersByTime(300)

      expect(wrapper.emitted('search')?.[0]).toEqual(['test'])

      vi.useRealTimers()
    })

    it('should debounce multiple inputs', async () => {
      vi.useFakeTimers()

      const wrapper = mount(TopicSearch, {
        props: {
          debounceMs: 300,
        },
      })
      const input = wrapper.find('.topic-search__input')

      await input.setValue('t')
      vi.advanceTimersByTime(100)

      await input.setValue('te')
      vi.advanceTimersByTime(100)

      await input.setValue('tes')
      vi.advanceTimersByTime(100)

      await input.setValue('test')
      vi.advanceTimersByTime(300)

      // Should only emit once with final value
      expect(wrapper.emitted('search')?.length).toBe(1)
      expect(wrapper.emitted('search')?.[0]).toEqual(['test'])

      vi.useRealTimers()
    })
  })

  describe('Clear Functionality', () => {
    it('should clear input when clear button is clicked', async () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: 'test',
        },
      })
      const clearBtn = wrapper.find('.topic-search__clear')

      await clearBtn.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
      expect(wrapper.emitted('search')?.[0]).toEqual([''])
    })

    it('should focus input after clear', async () => {
      const wrapper = mount(TopicSearch, {
        props: {
          modelValue: 'test',
        },
        attachTo: document.body,
      })
      const input = wrapper.find('.topic-search__input') as any
      const focusSpy = vi.spyOn(input.element, 'focus')
      const clearBtn = wrapper.find('.topic-search__clear')

      await clearBtn.trigger('click')

      expect(focusSpy).toHaveBeenCalled()
    })
  })

  describe('Exposed Methods', () => {
    it('should expose focus method', () => {
      const wrapper = mount(TopicSearch)
      const input = wrapper.find('.topic-search__input') as any
      const focusSpy = vi.spyOn(input.element, 'focus')

      ;(wrapper.vm as any).focus()

      expect(focusSpy).toHaveBeenCalled()
    })
  })
})
