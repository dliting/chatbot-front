<template>
  <Transition name="chatbot-ball-fade">
    <div
      v-if="visible"
      ref="ballRef"
      :class="classes"
      :style="ballStyle"
      @mousedown="handleMouseDown"
      @click="handleClick"
    >
      <!-- Icon slot or default icon -->
      <slot name="icon">
        <svg class="chatbot-ball__icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </slot>

      <!-- Badge (optional) - supports both badge and unreadCount props -->
      <span v-if="shouldShowBadge" :class="badgeClasses">
        {{ typeof displayBadge === 'number' && displayBadge > 99 ? '99+' : displayBadge }}
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Position } from '@/types'
import { makeDraggable, getInitialPosition } from '@/utils/drag'

interface Props {
  position?: Position
  size?: number
  iconColor?: string
  backgroundColor?: string
  badge?: number | null
  unreadCount?: number
  visible?: boolean
  draggable?: boolean
  clickToOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  size: 56,
  iconColor: '#ffffff',
  backgroundColor: '#409eff',
  badge: null,
  visible: true,
  draggable: true,
  clickToOpen: true,
})

interface Emits {
  (e: 'click'): void
  (e: 'dragStart', position: { x: number; y: number }): void
  (e: 'dragMove', position: { x: number; y: number }): void
  (e: 'dragEnd', position: { x: number; y: number }): void
}

const emit = defineEmits<Emits>()

const ballRef = ref<HTMLElement>()
const currentPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const hasMoved = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })

// Classes
const classes = computed(() => [
  'chatbot-ball',
  `chatbot-ball--${props.position}`,
  {
    'chatbot-ball--dragging': isDragging.value,
  },
])

// Combined badge value - supports both badge and unreadCount props
// unreadCount takes priority over badge when provided
const displayBadge = computed(() => {
  // Check unreadCount first (if explicitly provided - will be undefined if not passed)
  if (props.unreadCount !== undefined) {
    return props.unreadCount
  }
  // Fall back to badge prop
  return props.badge
})

// Determine if badge should be shown
// - unreadCount: only show when > 0
// - badge: show when not null (for backward compatibility)
const shouldShowBadge = computed(() => {
  if (props.unreadCount !== undefined) {
    return props.unreadCount > 0
  }
  return props.badge !== null
})

const badgeClasses = computed(() => [
  'suspended-ball__badge',
  'chatbot-ball__badge',
  {
    'chatbot-ball__badge--dot': typeof displayBadge.value === 'number' && displayBadge.value > 99,
  },
])

// Style
const ballStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  backgroundColor: props.backgroundColor,
  color: props.iconColor,
  left: `${currentPosition.value.x}px`,
  top: `${currentPosition.value.y}px`,
}))

// Initialize position
const initPosition = () => {
  if (!ballRef.value) return

  const size = { width: props.size, height: props.size }
  const pos = getInitialPosition(props.position, size)
  currentPosition.value = pos
}

// Handle mouse down (start drag)
const handleMouseDown = (event: MouseEvent) => {
  if (!props.draggable) return
  if (event.button !== 0) return // Only left click

  hasMoved.value = false
  isDragging.value = false
  dragStartPos.value = { x: event.clientX, y: event.clientY }
}

// Handle mouse click
const handleClick = (_event: MouseEvent) => {
  // Don't emit click if dragging occurred
  if (hasMoved.value) return

  if (props.clickToOpen) {
    emit('click')
  }
}

// Setup drag
let cleanupDrag: (() => void) | null = null

const setupDrag = () => {
  if (!ballRef.value || !props.draggable) return

  cleanupDrag = makeDraggable(ballRef.value, {
    throttleMs: 16,
    onDragStart: (pos) => {
      isDragging.value = true
      currentPosition.value = pos
      emit('dragStart', pos)
    },
    onDragMove: (pos) => {
      // Check if moved more than 5px to consider it a drag
      const dx = pos.x - dragStartPos.value.x
      const dy = pos.y - dragStartPos.value.y
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        hasMoved.value = true
      }
      currentPosition.value = pos
      emit('dragMove', pos)
    },
    onDragEnd: (pos) => {
      isDragging.value = false
      currentPosition.value = pos
      emit('dragEnd', pos)
    },
  })
}

// Watch position prop changes
watch(() => props.position, () => {
  if (!isDragging.value) {
    initPosition()
  }
})

// Lifecycle
onMounted(() => {
  initPosition()
  setupDrag()
})

onUnmounted(() => {
  cleanupDrag?.()
})
</script>

<style scoped lang="scss">
.chatbot-ball {
  position: fixed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }

  &--dragging {
    cursor: grabbing;
    transition: none;
  }

  &__icon {
    width: 50%;
    height: 50%;
    fill: currentColor;
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background-color: var(--chatbot-danger-color, #f56c6c);
    color: #fff;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    font-weight: 500;
  }
}

// Transitions
.chatbot-ball-fade-enter-active,
.chatbot-ball-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.chatbot-ball-fade-enter-from,
.chatbot-ball-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
