import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { builtinIconComponents } from '@/utils/builtinIcons'

describe('builtinIconComponents', () => {
  it('exposes the full built-in icon set', () => {
    expect(Object.keys(builtinIconComponents).length).toBeGreaterThanOrEqual(8)
  })

  it.each(Object.keys(builtinIconComponents))(
    'renders %s as an svg element',
    (name) => {
      const wrapper = mount(builtinIconComponents[name])
      expect(wrapper.find('svg').exists()).toBe(true)
    }
  )
})
