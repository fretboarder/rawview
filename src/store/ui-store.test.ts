import { describe, it, expect } from 'vitest'
import { useUIStore } from './ui-store'

describe('UIStore', () => {
  it('has setSquareCorners function', () => {
    const state = useUIStore.getState()
    expect(typeof state.setSquareCorners).toBe('function')
  })
})
