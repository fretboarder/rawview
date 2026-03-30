import { useEffect } from 'react'
import { initializeCommandSystem } from './lib/commands'
import { buildAppMenu } from './lib/menu'
import { logger } from './lib/logger'
import { cleanupOldFiles } from './lib/recovery'
import './App.css'
import { MainWindow } from './components/layout/MainWindow'
import { ThemeProvider } from './components/ThemeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSquareCornersEffect } from './hooks/useSquareCornersEffect'

function App() {
  useSquareCornersEffect()

  // Initialize command system and cleanup on app startup
  useEffect(() => {
    logger.info('🚀 Frontend application starting up')
    initializeCommandSystem()
    logger.debug('Command system initialized')

    // Build the application menu
    const initMenu = async () => {
      try {
        await buildAppMenu()
        logger.debug('Application menu built')
      } catch (error) {
        logger.warn('Failed to build menu', { error })
      }
    }

    initMenu()

    // Clean up old recovery files on startup
    cleanupOldFiles().catch(error => {
      logger.warn('Failed to cleanup old recovery files', { error })
    })

    // Example of logging with context
    logger.info('App environment', {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
    })
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MainWindow />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
