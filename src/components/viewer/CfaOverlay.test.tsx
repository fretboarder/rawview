import { render, screen } from '@/test/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { useViewerStore } from '@/store/viewer-store'
import { CfaOverlay } from './CfaOverlay'
import type { SessionInfo } from '@/lib/bindings'

const mockRggbSession: SessionInfo = {
  session_id: 'test-session-cfa',
  filename: 'IMG_0001.CR3',
  width: 8256,
  height: 5504,
  cfa_pattern: { type: 'Bayer', pattern: 'Rggb' },
  bit_depth: 14,
  black_level: 512,
  white_level: 16383,
  iso: 400,
}

describe('CfaOverlay', () => {
  beforeEach(() => {
    useViewerStore.setState({ session: null, status: 'idle' })
  })

  it('renders nothing when no session', () => {
    const { container } = render(<CfaOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('renders RGGB 2×2 grid with correct channel letters', () => {
    useViewerStore.setState({ session: mockRggbSession, status: 'ready' })
    render(<CfaOverlay />)

    // Should have exactly 4 cells: R, G, G, B
    const rCells = screen.getAllByLabelText('R')
    const gCells = screen.getAllByLabelText('G')
    const bCells = screen.getAllByLabelText('B')

    expect(rCells).toHaveLength(1)
    expect(gCells).toHaveLength(2)
    expect(bCells).toHaveLength(1)
  })

  it('renders aria-label for RGGB Bayer pattern', () => {
    useViewerStore.setState({ session: mockRggbSession, status: 'ready' })
    render(<CfaOverlay />)
    expect(screen.getByLabelText('CFA pattern: RGGB')).toBeInTheDocument()
  })

  it('renders BGGR layout correctly', () => {
    const bggr: SessionInfo = { ...mockRggbSession, cfa_pattern: { type: 'Bayer', pattern: 'Bggr' } }
    useViewerStore.setState({ session: bggr, status: 'ready' })
    render(<CfaOverlay />)
    expect(screen.getByLabelText('CFA pattern: BGGR')).toBeInTheDocument()
    expect(screen.getByLabelText('R')).toBeInTheDocument()
    expect(screen.getAllByLabelText('G')).toHaveLength(2)
    expect(screen.getByLabelText('B')).toBeInTheDocument()
  })

  it('renders X-Trans 6×6 grid (36 cells total)', () => {
    const xTransSession: SessionInfo = {
      ...mockRggbSession,
      cfa_pattern: {
        type: 'XTrans',
        grid: [
          [1, 0, 1, 1, 2, 1],
          [1, 1, 2, 1, 1, 0],
          [0, 1, 1, 1, 1, 1],
          [1, 2, 1, 1, 0, 1],
          [1, 1, 0, 1, 1, 1],
          [1, 1, 1, 2, 1, 1],
        ],
      },
    }
    useViewerStore.setState({ session: xTransSession, status: 'ready' })
    render(<CfaOverlay />)
    expect(screen.getByLabelText('CFA pattern: X-Trans')).toBeInTheDocument()
    // 36 cells for 6×6 grid
    const rCells = screen.getAllByLabelText('R')
    const gCells = screen.getAllByLabelText('G')
    const bCells = screen.getAllByLabelText('B')
    expect(rCells.length + gCells.length + bCells.length).toBe(36)
  })
})
