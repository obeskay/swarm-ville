/**
 * useUIConfig Hook
 * Provides access to UI component configuration throughout the app
 * ZERO HARDCODING - all UI colors, sizes, and behaviors come from config
 */

import { useContext } from 'react';
import { ConfigContext } from '@/providers/ConfigProvider';

/**
 * Hook to access UI configuration
 *
 * Usage:
 * const ui = useUIConfig();
 * const missionConfig = ui.missions;
 * const buttonConfig = ui.buttons.primary;
 *
 * @throws Error if used outside of ConfigProvider
 * @returns UI configuration object
 */
export function useUIConfig() {
  const config = useContext(ConfigContext);

  if (!config) {
    throw new Error(
      'useUIConfig must be used within a ConfigProvider. ' +
      'Make sure your app is wrapped with <ConfigProvider></ConfigProvider>'
    );
  }

  return config.ui;
}

/**
 * Hook to access mission panel UI configuration
 *
 * Usage:
 * const missions = useMissionsUIConfig();
 * const bgColor = missions.backgroundColor;
 */
export function useMissionsUIConfig() {
  const ui = useUIConfig();
  return ui.missions;
}

/**
 * Hook to access agent panel UI configuration
 *
 * Usage:
 * const agents = useAgentsUIConfig();
 * const headerText = agents.headerText;
 */
export function useAgentsUIConfig() {
  const ui = useUIConfig();
  return ui.agents;
}

/**
 * Hook to access status bar UI configuration
 *
 * Usage:
 * const statusBar = useStatusBarUIConfig();
 * const bgColor = statusBar.backgroundColor;
 */
export function useStatusBarUIConfig() {
  const ui = useUIConfig();
  return ui.statusBar;
}

/**
 * Hook to access toolbar UI configuration
 *
 * Usage:
 * const toolbar = useToolbarUIConfig();
 * const logoText = toolbar.logoText;
 */
export function useToolbarUIConfig() {
  const ui = useUIConfig();
  return ui.toolbar;
}

/**
 * Hook to access button styling for a specific variant
 *
 * Usage:
 * const primaryButton = useButtonConfig('primary');
 * const bgColor = primaryButton.backgroundColor;
 */
export function useButtonConfig(variant: 'primary' | 'secondary' | 'icon' | 'danger' = 'primary') {
  const ui = useUIConfig();
  return ui.buttons[variant];
}

/**
 * Hook to access card component styling
 *
 * Usage:
 * const cards = useCardConfig();
 * const padding = cards.padding;
 */
export function useCardConfig() {
  const ui = useUIConfig();
  return ui.cards;
}

/**
 * Hook to access input component styling
 *
 * Usage:
 * const inputs = useInputConfig();
 * const height = inputs.height;
 */
export function useInputConfig() {
  const ui = useUIConfig();
  return ui.inputs;
}

/**
 * Hook to access dialog/modal component styling
 *
 * Usage:
 * const dialogs = useDialogConfig();
 * const maxWidth = dialogs.maxWidth;
 */
export function useDialogConfig() {
  const ui = useUIConfig();
  return ui.dialogs;
}

/**
 * Hook to access badge styling for a specific variant
 *
 * Usage:
 * const successBadge = useBadgeConfig('success');
 * const bgColor = successBadge.backgroundColor;
 */
export function useBadgeConfig(variant: 'neutral' | 'success' | 'warning' | 'error' | 'primary' = 'neutral') {
  const ui = useUIConfig();
  return ui.badges[variant];
}

/**
 * Hook to access focus state styling
 *
 * Usage:
 * const focus = useFocusConfig();
 * const outlineColor = focus.outlineColor;
 */
export function useFocusConfig() {
  const ui = useUIConfig();
  return ui.focus;
}

/**
 * Hook to access disabled state styling
 *
 * Usage:
 * const disabled = useDisabledConfig();
 * const opacity = disabled.opacity;
 */
export function useDisabledConfig() {
  const ui = useUIConfig();
  return ui.disabled;
}
