<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const { settings, saveSettings, resetSettings } = useSettings()

// Local form state (edit before saving)
const form = ref({
  backendMode: settings.backendMode,
  theme: settings.theme,
  apiTimeout: settings.apiTimeout,
  showThinkingToggle: settings.showThinkingToggle,
  thinkingDefaultEnabled: settings.thinkingDefaultEnabled,
  thinkingAutoCollapse: settings.thinkingAutoCollapse,
  enableVoiceInput: settings.enableVoiceInput,
})

const saved = ref(false)
const TIMEOUT_PRESETS = [
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
]

function handleSave() {
  settings.backendMode = form.value.backendMode
  settings.theme = form.value.theme
  const timeout = Number(form.value.apiTimeout)
  settings.apiTimeout = Number.isNaN(timeout) ? 30000 : Math.max(5000, Math.min(300000, timeout))
  settings.showThinkingToggle = form.value.showThinkingToggle
  settings.thinkingDefaultEnabled = form.value.thinkingDefaultEnabled
  settings.thinkingAutoCollapse = form.value.thinkingAutoCollapse
  settings.enableVoiceInput = form.value.enableVoiceInput
  saveSettings()
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

function handleReset() {
  resetSettings()
  form.value = { ...settings }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="settings-page">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <button class="back-button" @click="goHome">← 返回首页</button>
        <h1>设置</h1>
      </div>

      <!-- Settings Form -->
      <div class="settings-card">
        <!-- Backend Mode -->
        <div class="setting-section">
          <h2>后端模式</h2>
          <div class="radio-group">
            <label class="radio-option" :class="{ active: form.backendMode === 'mock' }">
              <input v-model="form.backendMode" type="radio" value="mock" />
              <div class="radio-content">
                <span class="radio-title">模拟模式 (Mock)</span>
                <span class="radio-desc">使用模拟数据，无需 Ollama 服务</span>
              </div>
            </label>
            <label class="radio-option" :class="{ active: form.backendMode === 'real' }">
              <input v-model="form.backendMode" type="radio" value="real" />
              <div class="radio-content">
                <span class="radio-title">真实模式 (Real)</span>
                <span class="radio-desc">连接本地 Ollama 大模型服务</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Theme -->
        <div class="setting-section">
          <h2>UI 风格</h2>
          <div class="radio-group inline">
            <label class="radio-option compact" :class="{ active: form.theme === 'light' }">
              <input v-model="form.theme" type="radio" value="light" />
              <span>亮色</span>
            </label>
            <label class="radio-option compact" :class="{ active: form.theme === 'dark' }">
              <input v-model="form.theme" type="radio" value="dark" />
              <span>暗色</span>
            </label>
          </div>
        </div>

        <!-- API Timeout -->
        <div class="setting-section">
          <h2>后端超时</h2>
          <div class="timeout-input">
            <input v-model.number="form.apiTimeout" type="number" min="5000" max="300000" step="1000" />
            <span class="unit">ms</span>
          </div>
          <div class="timeout-presets">
            <button
              v-for="preset in TIMEOUT_PRESETS"
              :key="preset.value"
              class="preset-btn"
              :class="{ active: form.apiTimeout === preset.value }"
              @click="form.apiTimeout = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- 思考设置 -->
        <div class="setting-section">
          <h2>思考设置</h2>
          <div class="toggle-group">
            <label class="toggle-option">
              <span>显示思考开关</span>
              <input v-model="form.showThinkingToggle" type="checkbox" />
            </label>
            <label class="toggle-option" :class="{ disabled: !form.showThinkingToggle }">
              <span>思考默认开启</span>
              <input
                v-model="form.thinkingDefaultEnabled"
                type="checkbox"
                :disabled="!form.showThinkingToggle"
              />
            </label>
            <label class="toggle-option" :class="{ disabled: !form.showThinkingToggle }">
              <span>自动折叠思考内容</span>
              <input
                v-model="form.thinkingAutoCollapse"
                type="checkbox"
                :disabled="!form.showThinkingToggle"
              />
            </label>
          </div>
        </div>

        <!-- 语音输入 -->
        <div class="setting-section">
          <h2>语音输入</h2>
          <div class="toggle-group">
            <label class="toggle-option">
              <span>允许语音输入</span>
              <input v-model="form.enableVoiceInput" type="checkbox" />
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-primary" @click="handleSave">保存设置</button>
          <button class="btn btn-secondary" @click="handleReset">恢复默认</button>
          <span v-if="saved" class="save-hint">已保存</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 40px 20px;
  color: #333;
}

.container {
  max-width: 640px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 32px;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.back-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.35);
}

.settings-card {
  background: var(--bg-base, white);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.1));
  transition: background var(--transition-base);
}

.setting-section {
  margin-bottom: 32px;
}

.setting-section:last-of-type {
  margin-bottom: 24px;
}

.setting-section h2 {
  font-size: 18px;
  color: var(--text-primary, #333);
  margin-bottom: 12px;
  font-weight: 600;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-group.inline {
  flex-direction: row;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--border-light, #e4e7ed);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #667eea;
}

.radio-option.active {
  border-color: #667eea;
  background: #f5f7ff;
}

.radio-option input[type="radio"] {
  margin-top: 3px;
  accent-color: #667eea;
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.radio-desc {
  font-size: 13px;
  color: var(--text-tertiary, #909399);
}

.radio-option.compact {
  padding: 12px 20px;
  align-items: center;
}

.radio-option.compact span {
  font-size: 14px;
  color: var(--text-secondary, #606266);
}

.timeout-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.timeout-input input {
  width: 160px;
  padding: 8px 12px;
  border: 1px solid var(--border-base, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: var(--bg-base, white);
  color: var(--text-primary, #303133);
  transition: border-color 0.2s;
}

.timeout-input input:focus {
  border-color: #667eea;
}

.timeout-input .unit {
  color: var(--text-tertiary, #909399);
  font-size: 14px;
}

.timeout-presets {
  display: flex;
  gap: 8px;
}

.preset-btn {
  padding: 6px 16px;
  border: 1px solid var(--border-base, #dcdfe6);
  border-radius: 6px;
  background: var(--bg-base, white);
  color: var(--text-secondary, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.preset-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;

    input[type="checkbox"] {
      cursor: not-allowed;
    }
  }

  span {
    font-size: 14px;
    color: var(--text-primary, #333);
  }

  input[type="checkbox"] {
    accent-color: #667eea;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-lighter, #ebeef5);
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: var(--bg-secondary, #f5f7fa);
  color: var(--text-secondary, #606266);
  border: 1px solid var(--border-base, #dcdfe6);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #ebeef5);
}

.save-hint {
  color: var(--color-success, #67c23a);
  font-size: 14px;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 20px 12px;
  }

  .settings-card {
    padding: 20px;
  }

  .header h1 {
    font-size: 24px;
  }

  .radio-group.inline {
    flex-direction: column;
  }
}
</style>
