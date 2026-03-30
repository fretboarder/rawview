import { cn } from '@/lib/utils'
import { ViewerCanvas } from '@/components/viewer/ViewerCanvas'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { QuickStatsBar } from '@/components/panels/QuickStatsBar'
import { KeyboardShortcuts } from '@/components/toolbar/KeyboardShortcuts'
import { HistogramPanel } from '@/components/panels/HistogramPanel'
import { MetadataPanel } from '@/components/panels/MetadataPanel'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  return (
    <div className={cn('flex h-full w-full flex-col bg-background', className)}>
      {children || (
        <>
          {/* Global keyboard shortcut handler */}
          <KeyboardShortcuts />

          <Toolbar />

          {/* Main content area: canvas + side panels */}
          <div className="flex flex-1 overflow-hidden">
            <ViewerCanvas />
            <HistogramPanel />
            <MetadataPanel />
          </div>

          <QuickStatsBar />
        </>
      )}
    </div>
  )
}
