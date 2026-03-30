import { render, screen } from '@/test/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { useViewerStore } from '@/store/viewer-store'
import { QuickStatsBar } from './QuickStatsBar'
import type { SessionInfo } from '@/lib/bindings'

const mockSession: SessionInfo = {
  session_id: 'test-session-1',
  filename: 'IMG_0001.CR3',
  width: 8256,
  height: 5504,
  cfa_pattern: { type: 'Bayer', pattern: 'Rggb' },
  bit_depth: 14,
  black_level: 512,
  white_level: 16383,
  iso: 400,
}

describe('QuickStatsBar', () => {
  beforeEach(() => {
    useViewerStore.setState({ session: null, status: 'idle' })
  })

  it('renders placeholder dashes when no session', () => {
    render(<QuickStatsBar />)
    const bar = screen.getByLabelText('Quick stats bar')
    // The bar should show 7 placeholder dashes
    const text = bar.textContent ?? ''
    const dashCount = (text.match(/—/g) ?? []).length
    expect(dashCount).toBe(7)
  })

  it('renders filename when session is active', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('IMG_0001.CR3')).toBeInTheDocument()
  })

  it('renders dimensions in correct format', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('8256×5504')).toBeInTheDocument()
  })

  it('renders CFA pattern as uppercase', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('RGGB')).toBeInTheDocument()
  })

  it('renders bit depth', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('14-bit')).toBeInTheDocument()
  })

  it('renders black level and white level', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('BL:512')).toBeInTheDocument()
    expect(screen.getByText('WL:16383')).toBeInTheDocument()
  })

  it('renders ISO value', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    expect(screen.getByText('ISO 400')).toBeInTheDocument()
  })

  it('renders X-Trans label for XTrans pattern', () => {
    const xTransSession: SessionInfo = {
      ...mockSession,
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
    render(<QuickStatsBar />)
    expect(screen.getByText('X-Trans')).toBeInTheDocument()
  })

  it('has monospace font class', () => {
    useViewerStore.setState({ session: mockSession, status: 'ready' })
    render(<QuickStatsBar />)
    const bar = screen.getByLabelText('Quick stats bar')
    expect(bar.querySelector('.font-mono')).not.toBeNull()
  })
})
