import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { CommandContext, AppCommand } from './types'

const { registerCommands, getAllCommands, executeCommand } =
  await import('./registry')

const createMockContext = (): CommandContext => ({
  showToast: vi.fn(),
})

describe('Command System', () => {
  let mockContext: CommandContext

  beforeEach(() => {
    mockContext = createMockContext()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Command Registration', () => {
    it('registers and retrieves commands correctly', () => {
      const testCommand: AppCommand = {
        id: 'test-command',
        labelKey: 'commands.test.label',
        execute: vi.fn(),
      }

      registerCommands([testCommand])
      const commands = getAllCommands(mockContext)
      const found = commands.find(cmd => cmd.id === 'test-command')
      expect(found).toBeDefined()
    })

    it('filters commands by search term', () => {
      const testCommand: AppCommand = {
        id: 'search-test-command',
        labelKey: 'search-test-unique-label',
        execute: vi.fn(),
      }

      registerCommands([testCommand])
      const results = getAllCommands(mockContext, 'search-test-unique')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(cmd => cmd.id === 'search-test-command')).toBe(true)
    })

    it('filters commands by availability', () => {
      const unavailableCommand: AppCommand = {
        id: 'unavailable-command',
        labelKey: 'commands.unavailable.label',
        execute: vi.fn(),
        isAvailable: () => false,
      }

      registerCommands([unavailableCommand])
      const commands = getAllCommands(mockContext)
      const found = commands.find(cmd => cmd.id === 'unavailable-command')
      expect(found).toBeUndefined()
    })
  })

  describe('Command Execution', () => {
    it('handles non-existent command', async () => {
      const result = await executeCommand('non-existent-command', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('handles command execution errors', async () => {
      const errorCommand: AppCommand = {
        id: 'error-command-unique',
        labelKey: 'commands.error.label',
        execute: () => {
          throw new Error('Test error')
        },
      }

      registerCommands([errorCommand])

      const result = await executeCommand('error-command-unique', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Test error')
    })

    it('executes a valid command successfully', async () => {
      const executeFn = vi.fn()
      const workingCommand: AppCommand = {
        id: 'working-command-unique',
        labelKey: 'commands.working.label',
        execute: executeFn,
      }

      registerCommands([workingCommand])

      const result = await executeCommand('working-command-unique', mockContext)

      expect(result.success).toBe(true)
      expect(executeFn).toHaveBeenCalledWith(mockContext)
    })
  })
})
