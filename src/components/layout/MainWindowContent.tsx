import { cn } from '@/lib/utils'
import { ViewerCanvas } from '@/components/viewer/ViewerCanvas'
import { Toolbar } from '@/components/toolbar/Toolbar'

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
          <Toolbar />
          <div className="flex flex-1 overflow-hidden">
            <ViewerCanvas />
          </div>
        </>
      )}
    </div>
  )
}
