/**
 * Application menu builder using Tauri's JavaScript API.
 *
 * This module creates native menus from JavaScript.
 * Menus are built on app startup.
 */
import {
  Menu,
  MenuItem,
  Submenu,
  PredefinedMenuItem,
} from '@tauri-apps/api/menu'
import { logger } from '@/lib/logger'

const APP_NAME = 'RawView'

/**
 * Build and set the application menu.
 */
export async function buildAppMenu(): Promise<Menu> {
  try {
    // Build the main application submenu (appears as app name on macOS)
    const appSubmenu = await Submenu.new({
      text: APP_NAME,
      items: [
        await MenuItem.new({
          id: 'about',
          text: `About ${APP_NAME}`,
          action: handleAbout,
        }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({
          item: 'Hide',
          text: `Hide ${APP_NAME}`,
        }),
        await PredefinedMenuItem.new({
          item: 'HideOthers',
          text: 'Hide Others',
        }),
        await PredefinedMenuItem.new({
          item: 'ShowAll',
          text: 'Show All',
        }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({
          item: 'Quit',
          text: `Quit ${APP_NAME}`,
        }),
      ],
    })

    // Build the complete menu
    const menu = await Menu.new({
      items: [appSubmenu],
    })

    // Set as the application menu
    await menu.setAsAppMenu()

    logger.info('Application menu built successfully')
    return menu
  } catch (error) {
    logger.error('Failed to build application menu', { error })
    throw error
  }
}

// Menu action handlers

function handleAbout(): void {
  logger.info('About menu item clicked')
  alert(
    `${APP_NAME}\n\nVersion: ${__APP_VERSION__}\n\nBuilt with Tauri v2 + React + TypeScript`
  )
}
