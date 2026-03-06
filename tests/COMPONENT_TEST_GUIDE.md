# 组件测试指南

## 概述

本指南说明如何为ChatApp前端的Demo页面组件编写单元测试。

## 测试工具

- **测试框架**: Vitest
- **组件测试**: @vue/test-utils
- **覆盖率**: vitest --coverage

## Demo页面组件测试

### LandingPage.vue 测试

**测试文件**: `tests/views/LandingPage.spec.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LandingPage from '@/views/LandingPage.vue'

describe('LandingPage', () => {
  it('renders mode cards', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: LandingPage },
        { path: '/extended', component: { template: '<div>Extended</div>' } }
      ]
    })

    const wrapper = mount(LandingPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.mode-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('扩展模式')
    expect(wrapper.text()).toContain('紧凑模式')
    expect(wrapper.text()).toContain('悬浮模式')
    expect(wrapper.text()).toContain('Iframe嵌入')
  })

  it('navigates to correct route on card click', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: LandingPage },
        { path: '/extended', component: { template: '<div>Extended</div>' } }
      ]
    })

    const wrapper = mount(LandingPage, {
      global: {
        plugins: [router]
      }
    })

    // 点击扩展模式卡片
    await wrapper.find('.mode-card').filter((w) => w.text().includes('扩展模式')).trigger('click')
    expect(router.currentRoute.value.path).toBe('/extended')
  })
})
```

### CompactDemo.vue 测试

**测试文件**: `tests/views/CompactDemo.spec.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CompactDemo from '@/views/CompactDemo.vue'

describe('CompactDemo', () => {
  it('renders back link', () => {
    const wrapper = mount(CompactDemo)
    expect(wrapper.find('.back-link').exists()).toBe(true)
    expect(wrapper.find('.back-link').text()).toContain('返回首页')
  })

  it('renders main content area', () => {
    const wrapper = mount(CompactDemo)
    expect(wrapper.find('.main-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('紧凑模式 & 边栏模式')
  })

  it('renders chat sidebar', () => {
    const wrapper = mount(CompactDemo)
    expect(wrapper.find('.chat-sidebar').exists()).toBe(true)
  })
})
```

### ExtendedDemo.vue / FloatingDemo.vue / IframeDemo.vue 测试

类似结构，测试：
- 返回链接存在
- 主要内容区域渲染
- AIChatbot组件集成

## 路由配置测试

**测试文件**: `tests/router/index.spec.ts` (已存在)

已有测试覆盖：
- 路由路径验证
- 路由名称验证
- 懒加载验证

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test LandingPage

# 查看覆盖率
npm run test:coverage
```

## 测试覆盖目标

- Demo页面组件: >80%
- 路由配置: 100%
- 全局测试覆盖率: >80%
