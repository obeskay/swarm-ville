/**
 * Configuration Loader Utility
 * Handles loading, merging, and validating application configuration
 * Supports loading from files, localStorage, and environment variables
 * ZERO HARDCODING - all values come from external configuration
 */

import { AppConfig } from '@/providers/ConfigProvider';

/**
 * Loads custom configuration from localStorage
 * Format: appConfig_<key> where key is 'theme', 'layout', 'animations', or 'ui'
 */
export function loadConfigFromStorage(key: keyof AppConfig): Partial<any> {
  try {
    const stored = localStorage.getItem(`appConfig_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load ${key} config from localStorage:`, error);
  }
  return {};
}

/**
 * Saves configuration to localStorage for persistence
 */
export function saveConfigToStorage(key: keyof AppConfig, config: any): void {
  try {
    localStorage.setItem(`appConfig_${key}`, JSON.stringify(config));
  } catch (error) {
    console.warn(`Failed to save ${key} config to localStorage:`, error);
  }
}

/**
 * Deep merges two objects recursively
 * Objects on the right override objects on the left
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (
        sourceValue !== null &&
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue as any, sourceValue as any);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Validates that required configuration fields exist
 * Throws error if validation fails
 */
export function validateConfig(config: AppConfig): boolean {
  const requiredKeys = ['theme', 'layout', 'animations', 'ui'];

  for (const key of requiredKeys) {
    if (!config[key as keyof AppConfig]) {
      throw new Error(`Missing required config section: ${key}`);
    }
  }

  // Validate theme colors
  if (!config.theme.colors) {
    throw new Error('Missing theme.colors configuration');
  }

  // Validate layout dimensions
  if (!config.layout.breakpoints) {
    throw new Error('Missing layout.breakpoints configuration');
  }

  // Validate animations
  if (!config.animations.duration) {
    throw new Error('Missing animations.duration configuration');
  }

  return true;
}

/**
 * Gets a nested config value by dot notation path
 * Example: getConfigValue(config, 'theme.colors.primary.500')
 */
export function getConfigValue(config: AppConfig, path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], config as any);
}

/**
 * Sets a nested config value by dot notation path
 * Example: setConfigValue(config, 'theme.colors.primary.500', '#3b82f6')
 */
export function setConfigValue(config: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop();

  if (!lastKey) return;

  let current = config;
  for (const key of keys) {
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

/**
 * Creates a configuration override based on environment variables
 * Supports: VITE_* environment variables that match config structure
 */
export function loadConfigFromEnv(): Partial<AppConfig> {
  const overrides: any = {};

  // Check for VITE_CONFIG_* environment variables
  Object.entries(import.meta.env).forEach(([key, value]) => {
    if (key.startsWith('VITE_CONFIG_')) {
      // Convert VITE_CONFIG_THEME_PRIMARY_500 to theme.primary.500
      const configPath = key
        .replace('VITE_CONFIG_', '')
        .toLowerCase()
        .split('_')
        .join('.');

      setConfigValue(overrides, configPath, value);
    }
  });

  return overrides;
}

/**
 * Exports current configuration as JSON for backup/sharing
 */
export function exportConfig(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Imports configuration from JSON string
 */
export function importConfig(jsonString: string): Partial<AppConfig> {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse config JSON:', error);
    throw new Error('Invalid configuration JSON format');
  }
}

/**
 * Gets a summary of current configuration for debugging
 */
export function getConfigSummary(config: AppConfig): object {
  return {
    theme: {
      colors: Object.keys(config.theme.colors).join(', '),
      fontFamilies: Object.keys(config.theme.typography.fontFamily),
      spacingScale: Object.keys(config.theme.spacing).length + ' values',
    },
    layout: {
      breakpoints: config.layout.breakpoints,
      desktopSidebarWidth: config.layout.desktop.sidebarWidth,
      responsiveVariants: 3, // desktop, tablet, mobile
    },
    animations: {
      presetDurations: Object.keys(config.animations.duration).length + ' durations',
      easingFunctions: Object.keys(config.animations.easing).length + ' easing functions',
      transitionSpecs: Object.keys(config.animations.transitions).length + ' transitions',
    },
    ui: {
      componentVariants: 'buttons, cards, inputs, dialogs, badges',
      panelConfigs: 'missions, agents, statusBar, toolbar',
    },
  };
}

/**
 * Resets configuration to defaults (clears localStorage overrides)
 */
export function resetConfigToDefaults(): void {
  const keys: (keyof AppConfig)[] = ['theme', 'layout', 'animations', 'ui'];
  keys.forEach(key => {
    try {
      localStorage.removeItem(`appConfig_${key}`);
    } catch (error) {
      console.warn(`Failed to remove ${key} config from localStorage:`, error);
    }
  });
}
