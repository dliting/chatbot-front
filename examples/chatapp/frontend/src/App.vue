<template>
  <router-view />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useSettings } from './composables/useSettings'

const { settings } = useSettings()

// 监听主题变化并应用到 document 根元素
watch(() => settings.theme, (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}, { immediate: true })
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>
