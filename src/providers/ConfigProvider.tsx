/**
 * Configuration Provider
 * Centralizes all configuration (theme, layout, animations, UI)
 * Makes configuration accessible throughout the app via hooks
 * ZERO HARDCODING - all values come from config files or localStorage overrides
 */

import React, { createContext, ReactNode, useMemo } from 'react';
import { themeConfig } from '@/config/theme.config';
import { layoutConfig } from '@/config/layout.config';
import { animationsConfig } from '@/config/animations.config';
import { uiConfig } from '@/config/ui.config';

export interface AppConfig {
  theme: typeof themeConfig;
  layout: typeof layoutConfig;
  animations: typeof animationsConfig;
  ui: typeof uiConfig;
}

export const ConfigContext = createContext<AppConfig | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  overrides?: Partial<AppConfig>;
}

/**
 * Merges base config with localStorage overrides and/or custom overrides
 */
function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  // Start with base config
  const baseConfig: AppConfig = {
    theme: themeConfig,
    layout: layoutConfig,
    animations: animationsConfig,
    ui: uiConfig,
  };

  // TODO: Add localStorage override loading here
  // const storageConfig = localStorage.getItem('appConfig');
  // if (storageConfig) {
  //   try {
  //     const parsed = JSON.parse(storageConfig);
  //     // Deep merge with baseConfig
  //   } catch (e) {
  //     console.warn('Failed to parse stored config:', e);
  //   }
  // }

  // Merge custom overrides (for testing, themes, etc.)
  if (overrides) {
    return {
      theme: { ...baseConfig.theme, ...overrides.theme },
      layout: { ...baseConfig.layout, ...overrides.layout },
      animations: { ...baseConfig.animations, ...overrides.animations },
      ui: { ...baseConfig.ui, ...overrides.ui },
    };
  }

  return baseConfig;
}

/**
 * ConfigProvider - Wraps the app to provide configuration context
 *
 * Usage:
 * <ConfigProvider>
 *   <App />
 * </ConfigProvider>
 *
 * Access config in components:
 * const config = useAppConfig();
 * const theme = useThemeConfig();
 * const layout = useLayoutConfig();
 */
export function ConfigProvider({ children, overrides }: ConfigProviderProps) {
  const config = useMemo(() => loadConfig(overrides), [overrides]);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
