import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  setSquareCorners: (enabled: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    _set => ({
      setSquareCorners: (enabled: boolean) => {
        document.documentElement.classList.toggle('square-corners', enabled)
      },
    }),
    {
      name: 'ui-store',
    }
  )
)
