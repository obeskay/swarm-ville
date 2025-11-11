/**
 * UI Components Configuration System
 * Defines all UI-specific values: colors, sizes, behaviors for panels, badges, dialogs
 * ZERO HARDCODED VALUES - all values configured here
 */

export const uiConfig = {
  // Mission panel component configuration
  missions: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    headerText: 'Active Missions',
    headerIcon: 'target',
    maxVisibleItems: 5,
    itemBackgroundColor: 'var(--color-surface-secondary)',
    itemBorderColor: 'var(--color-border)',
    itemHoverBackgroundColor: 'var(--color-primary-100)',
    itemActiveBackgroundColor: 'var(--color-primary-200)',
    itemPadding: 12,
    itemMarginBottom: 8,
    itemBorderRadius: 6,

    // Mission item typography
    titleColor: 'var(--color-text-primary)',
    titleFontSize: 14,
    titleFontWeight: 600,
    descriptionColor: 'var(--color-text-secondary)',
    descriptionFontSize: 12,
    descriptionFontWeight: 400,

    // Progress bar styling
    progressBarHeight: 4,
    progressBarBackgroundColor: 'var(--color-neutral-200)',
    progressBarFillColor: 'var(--color-success-500)',
    progressBarBorderRadius: 2,

    // Badge styling
    badgePaddingX: 8,
    badgePaddingY: 4,
    badgeBorderRadius: 3,
    badgeFontSize: 11,
    badgeFontWeight: 600,
    badgeBackgroundColor: 'var(--color-primary-500)',
    badgeTextColor: 'var(--color-text-inverse)',
    rewardBadgeBackgroundColor: 'var(--color-warning-500)',
    rewardBadgeTextColor: 'var(--color-text-inverse)',

    // Empty state
    emptyStateIcon: 'inbox',
    emptyStateText: 'No active missions',
    emptyStateTextColor: 'var(--color-text-tertiary)',
    emptyStateFontSize: 13,
  },

  // Agent panel component configuration
  agents: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    headerText: 'Agents',
    headerIcon: 'users',
    maxVisibleItems: 10,
    itemBackgroundColor: 'var(--color-surface-secondary)',
    itemBorderColor: 'var(--color-border)',
    itemHoverBackgroundColor: 'var(--color-primary-100)',
    itemActiveBackgroundColor: 'var(--color-primary-200)',
    itemPadding: 8,
    itemMarginBottom: 6,
    itemBorderRadius: 6,
    itemMinHeight: 48,

    // Agent avatar styling
    avatarSize: 32,
    avatarBorderRadius: 'full',
    avatarBackgroundColor: 'var(--color-primary-500)',
    avatarTextColor: 'var(--color-text-inverse)',
    avatarFontSize: 14,
    avatarFontWeight: 600,

    // Agent info typography
    nameColor: 'var(--color-text-primary)',
    nameFontSize: 13,
    nameFontWeight: 600,
    roleColor: 'var(--color-text-secondary)',
    roleFontSize: 11,
    roleFontWeight: 400,

    // Status indicator
    statusIndicatorSize: 8,
    statusIndicatorPosition: 'bottom-right',
    statusOnlineColor: 'var(--color-success-500)',
    statusOfflineColor: 'var(--color-neutral-400)',
    statusBusyColor: 'var(--color-warning-500)',

    // Add agent button
    addButtonBackgroundColor: 'var(--color-primary-500)',
    addButtonHoverBackgroundColor: 'var(--color-primary-600)',
    addButtonTextColor: 'var(--color-text-inverse)',
    addButtonBorderRadius: 6,
    addButtonMinHeight: 40,

    // Empty state
    emptyStateIcon: 'users',
    emptyStateText: 'No agents yet',
    emptyStateTextColor: 'var(--color-text-tertiary)',
    emptyStateFontSize: 13,
  },

  // Status bar configuration
  statusBar: {
    backgroundColor: 'var(--color-surface)',
    borderTopColor: 'var(--color-border)',
    textColor: 'var(--color-text-primary)',
    textFontSize: 13,
    textFontWeight: 500,
    labelColor: 'var(--color-text-tertiary)',
    labelFontSize: 11,
    labelFontWeight: 600,
    itemSpacing: 24,

    // Online status indicator
    onlineIndicatorColor: 'var(--color-success-500)',
    onlineIndicatorSize: 8,
    onlineText: 'ONLINE',

    // FPS counter
    fpsBadgeBackgroundColor: 'var(--color-neutral-800)',
    fpsBadgeTextColor: 'var(--color-text-primary)',
    fpsBadgePadding: 4,
    fpsBadgeBorderRadius: 3,
  },

  // Toolbar configuration
  toolbar: {
    backgroundColor: 'var(--color-surface)',
    borderBottomColor: 'var(--color-border)',

    // Logo/Title area
    logoFontSize: 18,
    logoFontWeight: 700,
    logoColor: 'var(--color-primary-500)',
    logoText: 'SwarmVille',

    // Toolbar actions (right side)
    actionSpacing: 8,
    actionIconColor: 'var(--color-text-primary)',
    actionIconHoverColor: 'var(--color-primary-500)',
    actionIconSize: 20,

    // Dark mode toggle button
    darkModeToggleBackgroundColor: 'var(--color-neutral-800)',
    darkModeToggleHoverBackgroundColor: 'var(--color-neutral-700)',
    darkModeToggleActiveBackgroundColor: 'var(--color-primary-500)',
    darkModeToggleBorderRadius: 4,
    darkModeTogglePadding: 8,
  },

  // Button component variants
  buttons: {
    // Primary button
    primary: {
      backgroundColor: 'var(--color-primary-500)',
      hoverBackgroundColor: 'var(--color-primary-600)',
      activeBackgroundColor: 'var(--color-primary-700)',
      disabledBackgroundColor: 'var(--color-neutral-300)',
      textColor: 'var(--color-text-inverse)',
      disabledTextColor: 'var(--color-text-tertiary)',
      borderColor: 'var(--color-primary-500)',
      borderRadius: 6,
      borderWidth: 0,
      minHeight: 36,
      paddingX: 14,
      paddingY: 8,
      fontSize: 14,
      fontWeight: 600,
    },

    // Secondary button
    secondary: {
      backgroundColor: 'var(--color-neutral-200)',
      hoverBackgroundColor: 'var(--color-neutral-300)',
      activeBackgroundColor: 'var(--color-neutral-400)',
      disabledBackgroundColor: 'var(--color-neutral-100)',
      textColor: 'var(--color-text-primary)',
      disabledTextColor: 'var(--color-text-tertiary)',
      borderColor: 'var(--color-neutral-300)',
      borderRadius: 6,
      borderWidth: 1,
      minHeight: 36,
      paddingX: 14,
      paddingY: 8,
      fontSize: 14,
      fontWeight: 500,
    },

    // Icon button (small, square)
    icon: {
      backgroundColor: 'transparent',
      hoverBackgroundColor: 'var(--color-neutral-100)',
      activeBackgroundColor: 'var(--color-neutral-200)',
      textColor: 'var(--color-text-primary)',
      disabledTextColor: 'var(--color-text-tertiary)',
      borderColor: 'transparent',
      borderRadius: 4,
      borderWidth: 0,
      minHeight: 32,
      minWidth: 32,
      fontSize: 16,
    },

    // Danger button
    danger: {
      backgroundColor: 'var(--color-error-500)',
      hoverBackgroundColor: 'var(--color-error-600)',
      activeBackgroundColor: 'var(--color-error-700)',
      disabledBackgroundColor: 'var(--color-neutral-300)',
      textColor: 'var(--color-text-inverse)',
      disabledTextColor: 'var(--color-text-tertiary)',
      borderColor: 'var(--color-error-500)',
      borderRadius: 6,
      borderWidth: 0,
      minHeight: 36,
      paddingX: 14,
      paddingY: 8,
      fontSize: 14,
      fontWeight: 600,
    },
  },

  // Card component styling
  cards: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    hoverBoxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },

  // Input component styling
  inputs: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    focusBorderColor: 'var(--color-primary-500)',
    textColor: 'var(--color-text-primary)',
    placeholderColor: 'var(--color-text-tertiary)',
    disabledBackgroundColor: 'var(--color-neutral-100)',
    disabledBorderColor: 'var(--color-border)',
    disabledTextColor: 'var(--color-text-tertiary)',
    errorBorderColor: 'var(--color-error-500)',
    focusBoxShadow: '0 0 0 3px var(--color-primary-100)',
    borderWidth: 1,
    borderRadius: 6,
    height: 36,
    paddingX: 12,
    paddingY: 8,
    fontSize: 14,
    fontWeight: 400,
  },

  // Dialog/Modal styling
  dialogs: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
    backdropBackgroundColor: 'rgba(0, 0, 0, 0.5)',
    minWidth: 300,
    maxWidth: 600,

    // Title styling
    titleColor: 'var(--color-text-primary)',
    titleFontSize: 18,
    titleFontWeight: 700,

    // Content styling
    contentColor: 'var(--color-text-secondary)',
    contentFontSize: 14,
    contentFontWeight: 400,
    contentMarginTop: 16,

    // Actions spacing
    actionSpacing: 12,
    actionMarginTop: 24,
  },

  // Badge component styling
  badges: {
    // Neutral/default badge
    neutral: {
      backgroundColor: 'var(--color-neutral-200)',
      textColor: 'var(--color-text-primary)',
      borderRadius: 3,
      paddingX: 8,
      paddingY: 4,
      fontSize: 11,
      fontWeight: 600,
    },

    // Success badge (for completed missions, etc.)
    success: {
      backgroundColor: 'var(--color-success-500)',
      textColor: 'var(--color-text-inverse)',
      borderRadius: 3,
      paddingX: 8,
      paddingY: 4,
      fontSize: 11,
      fontWeight: 600,
    },

    // Warning badge (for warnings, alerts)
    warning: {
      backgroundColor: 'var(--color-warning-500)',
      textColor: 'var(--color-text-inverse)',
      borderRadius: 3,
      paddingX: 8,
      paddingY: 4,
      fontSize: 11,
      fontWeight: 600,
    },

    // Error badge (for errors, critical)
    error: {
      backgroundColor: 'var(--color-error-500)',
      textColor: 'var(--color-text-inverse)',
      borderRadius: 3,
      paddingX: 8,
      paddingY: 4,
      fontSize: 11,
      fontWeight: 600,
    },

    // Primary badge (for primary actions, XP, rewards)
    primary: {
      backgroundColor: 'var(--color-primary-500)',
      textColor: 'var(--color-text-inverse)',
      borderRadius: 3,
      paddingX: 8,
      paddingY: 4,
      fontSize: 11,
      fontWeight: 600,
    },
  },

  // Accessibility and interaction states
  focus: {
    outlineColor: 'var(--color-primary-500)',
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineOffset: 2,
  },

  // Disabled state styling
  disabled: {
    opacity: 0.6,
    cursorNotAllowed: true,
  },
} as const;

export type UIConfig = typeof uiConfig;
