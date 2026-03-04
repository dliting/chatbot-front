<template>
  <div class="image-preview-modal" @click="$emit('close')">
    <img :src="url" class="image-preview-modal__image" @click.stop />
  </div>
</template>

<script setup lang="ts">
interface Props {
  url: string
}

defineProps<Props>()

interface Emits {
  (e: 'close'): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
.image-preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
  cursor: pointer;

  &__image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    cursor: default;
  }
}
</style>
