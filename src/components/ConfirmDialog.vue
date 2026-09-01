<template>
  <Teleport to="body">
    <Transition name="confirm-dialog">
      <div v-if="show" class="confirm-dialog-overlay" @click="handleOverlayClick">
        <div class="confirm-dialog" :class="`confirm-dialog--${type}`" @click.stop>
          <div class="confirm-dialog__header">
            <div class="confirm-dialog__icon">
              <svg
                v-if="type === 'danger'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else-if="type === 'warning'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h3 class="confirm-dialog__title">{{ title }}</h3>
          </div>

          <div class="confirm-dialog__body">
            <p>{{ message }}</p>
          </div>

          <div class="confirm-dialog__footer">
            <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="confirm-dialog__btn confirm-dialog__btn--confirm" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  show?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: 'Confirm',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info',
  closeOnOverlay: true,
})

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}

// Handle ESC key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    handleCancel()
  }
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  padding: 20px;
}

.confirm-dialog {
  background: var(--bg-base, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 24px 16px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-bottom: 12px;

    svg {
      width: 24px;
      height: 24px;
    }

    .confirm-dialog--danger & {
      background: var(--color-danger-light, #fef0f0);
      color: var(--color-danger, #f56c6c);
    }

    .confirm-dialog--warning & {
      background: var(--color-warning-light, #fdf6ec);
      color: var(--color-warning, #e6a23c);
    }

    .confirm-dialog--info & {
      background: var(--color-info-light, #f4f4f5);
      color: var(--color-info, #909399);
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #303133);
    margin: 0;
    text-align: center;
  }

  &__body {
    padding: 16px 24px;
    text-align: center;

    p {
      font-size: 14px;
      color: var(--text-tertiary, #606266);
      margin: 0;
      line-height: 1.6;
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px 24px;
  }

  &__btn {
    flex: 1;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &--cancel {
      background: var(--border-light, #e4e7ed);
      color: var(--text-primary, #303133);

      &:hover {
        background: var(--border-base, #dcdfe6);
      }
    }

    &--confirm {
      background: var(--theme-primary, #409eff);
      color: white;

      &:hover {
        background: var(--theme-primary-dark, #66b1ff);
      }

      .confirm-dialog--danger & {
        background: var(--color-danger, #f56c6c);

        &:hover {
          background: var(--color-danger-dark, #f78989);
        }
      }

      .confirm-dialog--warning & {
        background: var(--color-warning, #e6a23c);

        &:hover {
          background: var(--color-warning-dark, #ebb563);
        }
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

// Transitions
.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: all 0.3s ease;
}

.confirm-dialog-enter-active .confirm-dialog,
.confirm-dialog-leave-active .confirm-dialog {
  transition: all 0.3s ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-from .confirm-dialog,
.confirm-dialog-leave-to .confirm-dialog {
  transform: scale(0.9);
  opacity: 0;
}

.confirm-dialog-enter-to,
.confirm-dialog-leave-from {
  opacity: 1;
}

.confirm-dialog-enter-to .confirm-dialog,
.confirm-dialog-leave-from .confirm-dialog {
  transform: scale(1);
  opacity: 1;
}
</style>
