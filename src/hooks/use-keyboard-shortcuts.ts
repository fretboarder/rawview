import { useEffect } from 'react'
import type { CommandContext } from '@/lib/commands/types'

/**
 * Handles global keyboard shortcuts for the application.
 */
export function useKeyboardShortcuts(_commandContext: CommandContext) {
  useEffect(() => {
    const handleKeyDown = (_e: KeyboardEvent) => {
      // Keyboard shortcuts will be added as needed
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [_commandContext])
}
