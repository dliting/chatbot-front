<template>
  <!-- Image content -->
  <div v-if="hasImages" class="chatbot-message__images">
    <img
      v-for="(image, index) in imageAttachments"
      :key="index"
      :src="image.url"
      :alt="`Image ${index + 1}`"
      class="chatbot-message__image"
      @click="$emit('file-click', { type: 'image', url: image.url })"
    />
  </div>

  <!-- Video content -->
  <div v-if="hasVideos" class="chatbot-message__videos">
    <div
      v-for="(video, index) in videoAttachments"
      :key="`video-${index}`"
      class="chatbot-message__video"
      @click="$emit('file-click', { type: 'video', url: video.url })"
    >
      <video :src="video.url" class="chatbot-message__video-player" preload="metadata" />
      <div class="chatbot-message__video-overlay">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Audio content -->
  <div v-if="hasAudios" class="chatbot-message__audios">
    <div
      v-for="(audio, index) in audioAttachments"
      :key="`audio-${index}`"
      class="chatbot-message__audio"
      @click="$emit('file-click', { type: 'audio', url: audio.url })"
    >
      <audio :src="audio.url" controls class="chatbot-message__audio-player" />
    </div>
  </div>

  <!-- Document content -->
  <div v-if="hasDocuments" class="chatbot-message__documents">
    <div
      v-for="(doc, index) in documentAttachments"
      :key="`doc-${index}`"
      class="chatbot-message__document"
      @click="$emit('file-click', { type: doc.type, url: doc.url, name: doc.name })"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="chatbot-message__document-name">{{ doc.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Attachment } from '@/types'

interface Props {
  attachments?: Attachment[]
}

const props = withDefaults(defineProps<Props>(), {
  attachments: () => [],
})

interface Emits {
  (e: 'file-click', file: { type: string; url: string; name?: string }): void
}

defineEmits<Emits>()

const imageAttachments = computed(() => props.attachments.filter((a) => a.type === 'image'))
const videoAttachments = computed(() => props.attachments.filter((a) => a.type === 'video'))
const audioAttachments = computed(() => props.attachments.filter((a) => a.type === 'audio'))
const documentAttachments = computed(() => props.attachments.filter((a) => a.type === 'document'))
const hasImages = computed(() => imageAttachments.value.length > 0)
const hasVideos = computed(() => videoAttachments.value.length > 0)
const hasAudios = computed(() => audioAttachments.value.length > 0)
const hasDocuments = computed(() => documentAttachments.value.length > 0)
</script>

<style scoped lang="scss">
.chatbot-message__images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  .chatbot-message__bubble--image & {
    margin-top: 0;
  }
}

.chatbot-message__image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.chatbot-message__videos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.chatbot-message__video {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-video-overlay, #000);

  &-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-overlay, rgba(0, 0, 0, 0.3));

    svg {
      width: 48px;
      height: 48px;
      fill: var(--text-on-primary, #fff);
    }
  }
}

.chatbot-message__audios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 250px;
}

.chatbot-message__audio-player {
  width: 100%;
  height: 40px;
}

.chatbot-message__documents {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.chatbot-message__document {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    stroke: var(--text-primary, #606266);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  &-name {
    font-size: 13px;
    color: var(--text-primary, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
