import type { LucideIcon } from 'lucide-react'

export interface AppCommand {
  id: string
  /** Label key for the command (e.g., 'commands.openFile') */
  labelKey: string
  /** Description key for the command */
  descriptionKey?: string
  icon?: LucideIcon
  group?: string
  keywords?: string[]
  execute: (context: CommandContext) => void | Promise<void>
  isAvailable?: (context: CommandContext) => boolean
  shortcut?: string
}

export interface CommandGroup {
  id: string
  label: string
  commands: AppCommand[]
}

export interface CommandContext {
  // Notifications
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}
