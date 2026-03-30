import { describe, it, expect } from 'vitest'
import { mapCanvasToSensor } from './coordinateMapper'

describe('mapCanvasToSensor', () => {
  // A 800×600 canvas with a 4000×3000 sensor (same 4:3 ratio)
  // base_scale = min(800/4000, 600/3000) = min(0.2, 0.2) = 0.2
  // At zoom=1: sensor fills canvas exactly
  // offsetX = (800 - 4000*0.2) / 2 = (800 - 800) / 2 = 0
  // offsetY = (600 - 3000*0.2) / 2 = (600 - 600) / 2 = 0

  const CANVAS_W = 800
  const CANVAS_H = 600
  const SENSOR_W = 4000
  const SENSOR_H = 3000

  describe('zoom=1, pan=0', () => {
    it('maps top-left corner to (0, 0)', () => {
      const result = mapCanvasToSensor(0, 0, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result).toEqual({ row: 0, col: 0 })
    })

    it('maps center to sensor center', () => {
      // Canvas center = (400, 300). Scale = 0.2
      // col = floor(400 / 0.2) = floor(2000) = 2000
      // row = floor(300 / 0.2) = floor(1500) = 1500
      const result = mapCanvasToSensor(400, 300, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result).toEqual({ row: 1500, col: 2000 })
    })

    it('maps near bottom-right to sensor dimensions - 1', () => {
      // Canvas pixel at (799, 599): col = floor(799/0.2) = 3995, row = floor(599/0.2) = 2995
      const result = mapCanvasToSensor(799, 599, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result).toEqual({ row: 2995, col: 3995 })
    })

    it('returns null for position exactly at canvas right edge (outside sensor)', () => {
      // col = floor(800/0.2) = 4000 → >= SENSOR_W → null
      const result = mapCanvasToSensor(800, 300, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result).toBeNull()
    })

    it('returns null for negative position', () => {
      const result = mapCanvasToSensor(-1, 0, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result).toBeNull()
    })
  })

  describe('zoom=2, pan=0', () => {
    // scale = 0.2 * 2 = 0.4
    // offsetX = (800 - 4000*0.4) / 2 = (800 - 1600) / 2 = -400
    // offsetY = (600 - 3000*0.4) / 2 = (600 - 1200) / 2 = -300
    it('maps canvas center to sensor center', () => {
      // col = floor((400 - (-400)) / 0.4) = floor(800 / 0.4) = 2000
      // row = floor((300 - (-300)) / 0.4) = floor(600 / 0.4) = 1500
      const result = mapCanvasToSensor(400, 300, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 2, 0, 0)
      expect(result).toEqual({ row: 1500, col: 2000 })
    })

    it('maps canvas top-left to sensor top-left visible at zoom 2', () => {
      // col = floor((0 - (-400)) / 0.4) = floor(1000) = 1000
      // row = floor((0 - (-300)) / 0.4) = floor(750) = 750
      const result = mapCanvasToSensor(0, 0, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 2, 0, 0)
      expect(result).toEqual({ row: 750, col: 1000 })
    })
  })

  describe('with pan offset', () => {
    it('accounts for panX shift', () => {
      // zoom=1, panX=100 → offsetX = 0 + 100 = 100
      // col at x=200: floor((200 - 100) / 0.2) = floor(500) = 500
      const result = mapCanvasToSensor(200, 0, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 100, 0)
      expect(result?.col).toBe(500)
    })

    it('accounts for panY shift', () => {
      // zoom=1, panY=60 → offsetY = 0 + 60 = 60
      // row at y=120: floor((120 - 60) / 0.2) = floor(300) = 300
      const result = mapCanvasToSensor(0, 120, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 60)
      expect(result?.row).toBe(300)
    })
  })

  describe('non-square sensor in different aspect canvas', () => {
    // Landscape sensor 6000×4000 in a square 600×600 canvas
    // base_scale = min(600/6000, 600/4000) = min(0.1, 0.15) = 0.1 (width limited)
    // displayW = 6000*0.1 = 600, displayH = 4000*0.1 = 400
    // offsetX = (600 - 600) / 2 = 0
    // offsetY = (600 - 400) / 2 = 100
    it('handles letterboxed sensor correctly', () => {
      const result = mapCanvasToSensor(0, 100, 600, 600, 6000, 4000, 1, 0, 0)
      expect(result).toEqual({ row: 0, col: 0 })
    })

    it('returns null for letterbox area above sensor', () => {
      // y=50 → row = floor((50 - 100) / 0.1) = floor(-500) = -500 → null
      const result = mapCanvasToSensor(0, 50, 600, 600, 6000, 4000, 1, 0, 0)
      expect(result).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('returns null for zero-size sensor', () => {
      const result = mapCanvasToSensor(100, 100, 800, 600, 0, 0, 1, 0, 0)
      expect(result).toBeNull()
    })

    it('handles fractional coordinates correctly (floors to integer)', () => {
      // zoom=1, no pan, canvas=800x600, sensor=4000x3000, scale=0.2
      // x=0.5 → col = floor(0.5/0.2) = floor(2.5) = 2
      const result = mapCanvasToSensor(0.5, 0, CANVAS_W, CANVAS_H, SENSOR_W, SENSOR_H, 1, 0, 0)
      expect(result?.col).toBe(2)
    })
  })
})
