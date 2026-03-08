<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="media-preview-modal" @click="handleClose">
        <div class="media-preview-modal__content" @click.stop>
          <!-- 关闭按钮 -->
          <button class="media-preview-modal__close" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 图片 -->
          <img
            v-if="mediaType === 'image'"
            :src="mediaUrl"
            class="media-preview-modal__image"
            @click="handleZoom"
          />

          <!-- 视频 -->
          <video
            v-else-if="mediaType === 'video'"
            :src="mediaUrl"
            class="media-preview-modal__video"
            controls
            autoplay
          />

          <!-- 音频 -->
          <audio
            v-else-if="mediaType === 'audio'"
            :src="mediaUrl"
            class="media-preview-modal__audio"
            controls
            autoplay
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  mediaType: 'image' | 'video' | 'audio'
  mediaUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}

const handleZoom = () => {
  // 可扩展图片缩放功能
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped lang="scss">
.media-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  &__content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }

  &__close {
    position: absolute;
    top: -40px;
    right: 0;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: white;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  &__image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
  }

  &__video,
  &__audio {
    max-width: 100%;
    max-height: 80vh;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
