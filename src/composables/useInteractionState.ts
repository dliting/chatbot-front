/**
 * Composable for interaction state management
 */
import { reactive } from 'vue'

export interface InteractionState {
  selectedImages: string[]
}

interface UseInteractionStateOptions {
  maxImageCount?: number
}

export function useInteractionState(options: UseInteractionStateOptions = {}) {
  // Interaction State
  const interaction = reactive<InteractionState>({
    selectedImages: [],
  })

  // Actions
  const setSelectedImages = (images: string[]) => {
    interaction.selectedImages = images
  }

  const addSelectedImage = (imageUrl: string) => {
    if (options.maxImageCount && interaction.selectedImages.length >= options.maxImageCount) {
      return
    }
    interaction.selectedImages.push(imageUrl)
  }

  const removeSelectedImage = (imageUrl: string) => {
    const index = interaction.selectedImages.indexOf(imageUrl)
    if (index > -1) {
      interaction.selectedImages.splice(index, 1)
    }
  }

  const clearSelectedImages = () => {
    interaction.selectedImages = []
  }

  return {
    interaction,
    setSelectedImages,
    addSelectedImage,
    removeSelectedImage,
    clearSelectedImages,
  }
}

export type UseInteractionStateReturn = ReturnType<typeof useInteractionState>
