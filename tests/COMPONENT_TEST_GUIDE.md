# 组件测试指南

## 概述

本指南说明如何为ChatApp前端的Demo页面组件编写单元测试。

## 测试工具

- **测试框架**: Vitest
- **组件测试**: @vue/test-utils
- **覆盖率**: vitest --coverage

## 项目结构说明

ChatApp前端的Demo页面位于 `examples/chatapp/frontend/src/views/` 目录。
组件测试可以与组件同目录放置（`__tests__`子目录）或统一放在 `tests/` 目录。

当前已存在的测试:
- `examples/chatapp/frontend/src/router/__tests__/index.test.ts` - 路由配置测试

本指南提供的测试示例为参考实现，可根据项目需要调整文件位置。

## Demo页面组件测试

### LandingPage.vue 测试

**测试文件** (示例): `examples/chatapp/frontend/src/views/__tests__/LandingPage.spec.ts`

> **注**: 以下测试示例为参考实现，实际测试文件需要根据项目结构创建。

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
    const cards = wrapper.findAll('.mode-card')
    for (const card of cards) {
      if (card.text().includes('扩展模式')) {
        await card.trigger('click')
        break
      }
    }
    expect(router.currentRoute.value.path).toBe('/extended')
  })
})
```

### CompactDemo.vue 测试

**测试文件** (示例): `examples/chatapp/frontend/src/views/__tests__/CompactDemo.spec.ts`

> **注**: 以下测试示例为参考实现，实际测试文件需要根据项目结构创建。

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

**测试文件**: `examples/chatapp/frontend/src/router/__tests__/index.test.ts` (已存在)

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

# 运行带覆盖率的测试
npm test -- --coverage
```

## 测试覆盖目标

- Demo页面组件: >80%
- 路由配置: 100%
- 全局测试覆盖率: >80%
