import { cn } from '@/lib/utils'
import { ProtocolTest } from '@/components/viewer/ProtocolTest'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children || <ProtocolTest />}
    </div>
  )
}
