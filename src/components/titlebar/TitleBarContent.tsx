interface TitleBarTitleProps {
  title?: string
}

/**
 * Left-side toolbar actions (placeholder for future RawView tools).
 * Place this after window controls on macOS, or at the start on Windows/Linux.
 */
export function TitleBarLeftActions() {
  return (
    <div className="flex items-center gap-1">
      {/* RawView tool buttons will be added here */}
    </div>
  )
}

/**
 * Right-side toolbar actions.
 * Place this before window controls on Windows, or at the end on macOS/Linux.
 */
export function TitleBarRightActions() {
  return (
    <div className="flex items-center gap-1">
      {/* RawView action buttons will be added here */}
    </div>
  )
}

/**
 * Centered title for the title bar.
 * Uses absolute positioning to stay centered regardless of other content.
 */
export function TitleBarTitle({ title = 'RawView' }: TitleBarTitleProps) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <span className="text-sm font-medium text-foreground/80">{title}</span>
    </div>
  )
}

/**
 * Combined toolbar content for simple layouts.
 * Use this for Linux or when you want all toolbar items in one fragment.
 *
 * For more control, use TitleBarLeftActions, TitleBarRightActions, and TitleBarTitle separately.
 */
export function TitleBarContent({ title = 'RawView' }: TitleBarTitleProps) {
  return (
    <>
      <TitleBarLeftActions />
      <TitleBarTitle title={title} />
      <TitleBarRightActions />
    </>
  )
}
