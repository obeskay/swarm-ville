/**
 * Layout Configuration System
 * Defines all layout-related values: breakpoints, dimensions, spacing
 * ZERO HARDCODED VALUES - all values configured here
 */

export const layoutConfig = {
  // Responsive breakpoints (pixels)
  breakpoints: {
    mobile: 0,     // Mobile-first approach
    tablet: 768,   // Tablet breakpoint
    desktop: 1280, // Desktop breakpoint
  },

  // Desktop layout (3-column: sidebar | canvas | sidebar)
  desktop: {
    sidebarWidth: 280,        // Left and right sidebar width
    toolbarHeight: 56,        // Top toolbar height
    statusBarHeight: 40,      // Bottom status bar height
    canvasPaddingX: 8,        // Horizontal padding around canvas
    canvasPaddingY: 8,        // Vertical padding around canvas
    sidebarGap: 8,            // Gap between sidebar and canvas
    contentHeight: 'calc(100vh - 56px - 40px - 16px)', // Viewport height minus toolbar, status bar, padding
  },

  // Tablet layout (toggle sidebar: 240px | canvas)
  tablet: {
    sidebarWidth: 240,
    sidebarCollapsedWidth: 0,  // Hidden when collapsed
    toolbarHeight: 48,
    statusBarHeight: 40,
    canvasPaddingX: 6,
    canvasPaddingY: 6,
    toggleButtonSize: 40,      // Size of sidebar toggle button
    contentHeight: 'calc(100vh - 48px - 40px - 12px)',
  },

  // Mobile layout (full canvas with overlay sidebars)
  mobile: {
    toolbarHeight: 48,
    statusBarHeight: 40,
    canvasPaddingX: 4,
    canvasPaddingY: 4,
    overlayWidth: 280,         // Overlay sidebar width on mobile
    overlayZIndex: 1000,       // Z-index for overlay
    overlayBackdropZIndex: 999,
    contentHeight: 'calc(100vh - 48px - 40px - 8px)',
  },

  // Toolbar configuration
  toolbar: {
    height: 56,
    desktopHeight: 56,
    tabletHeight: 48,
    mobileHeight: 48,
    backgroundColor: 'var(--color-surface)',
    borderBottomWidth: '1px',
    borderBottomColor: 'var(--color-border)',
    paddingX: 16,
    paddingY: 8,
    itemSpacing: 8,
    logoSize: 32,
    logoFontSize: 20,
    logoFontWeight: 700,
  },

  // Sidebar configuration
  sidebar: {
    width: 280,
    tabletWidth: 240,
    mobileWidth: 280,
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    borderWidth: '1px',
    paddingTop: 16,
    paddingBottom: 16,
    paddingX: 12,
    itemSpacing: 8,
    sectionSpacing: 16,
    headerFontSize: 14,
    headerFontWeight: 600,
    headerLetterSpacing: '0.05em',
    headerTextColor: 'var(--color-text-secondary)',
  },

  // Mission panel configuration (left sidebar)
  missionPanel: {
    maxVisibleItems: 5,        // Number of missions shown before scroll
    itemHeight: 56,            // Height of each mission item
    itemPadding: 12,
    itemMargin: 8,
    badgePadding: 4,
    badgeRounding: 'full',
    showRewardBadge: true,
    showProgressBar: true,
    progressBarHeight: 3,
  },

  // Agent panel configuration (right sidebar)
  agentPanel: {
    maxVisibleItems: 10,       // Number of agents shown before scroll
    itemHeight: 48,            // Height of each agent item
    itemPadding: 8,
    itemMargin: 6,
    avatarSize: 32,
    avatarRounding: 'full',
    statusIndicatorSize: 8,
    statusIndicatorPosition: 'bottom-right',
    nameEllipsis: true,
    maxNameLength: 20,
  },

  // Status bar configuration
  statusBar: {
    height: 40,
    backgroundColor: 'var(--color-surface)',
    borderTopWidth: '1px',
    borderTopColor: 'var(--color-border)',
    paddingX: 16,
    paddingY: 8,
    itemSpacing: 24,
    itemFontSize: 13,
    itemFontWeight: 500,
    labelFontSize: 11,
    labelFontWeight: 600,
    labelColor: 'var(--color-text-tertiary)',
  },

  // Game canvas configuration
  canvas: {
    minWidth: 400,
    minHeight: 300,
    backgroundColor: '#1a1a2e',  // Dark canvas background
    borderRadius: 4,
    tileSize: 32,                // Pixel size of each tile
    gridWidth: 48,               // Number of tiles horizontally
    gridHeight: 48,              // Number of tiles vertically
    scaleFactor: 1,              // Zoom level (1 = normal)
  },

  // Component size standards
  button: {
    heightSm: 28,
    heightMd: 36,
    heightLg: 44,
    paddingXSm: 10,
    paddingXMd: 14,
    paddingXLg: 18,
    borderRadius: 4,
    minWidth: 24,               // Minimum width to prevent too-narrow buttons
  },

  // Input component sizing
  input: {
    height: 36,
    paddingX: 12,
    paddingY: 8,
    borderRadius: 4,
    borderWidth: 1,
    fontSize: 14,
    minWidth: 200,
  },

  // Card and container sizing
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    boxShadowSmall: '0 1px 2px rgba(0, 0, 0, 0.05)',
    boxShadowMedium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    boxShadowLarge: '0 10px 15px rgba(0, 0, 0, 0.1)',
    gapBetweenItems: 12,
  },

  // Badge sizing
  badge: {
    paddingX: 8,
    paddingY: 4,
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    minHeight: 20,
  },

  // Dialog/Modal configuration
  dialog: {
    minWidth: 300,
    maxWidth: 600,
    borderRadius: 8,
    padding: 24,
    backdropColor: 'rgba(0, 0, 0, 0.5)',
    backdropZIndex: 900,
    dialogZIndex: 901,
    actionSpacing: 12,
  },

  // Z-index layers (mobile-first, overlays on top)
  zIndex: {
    canvas: 0,
    sidebar: 10,
    toolbar: 20,
    statusBar: 20,
    mobileSidebarBackdrop: 99,
    mobileSidebar: 100,
    dialogBackdrop: 900,
    dialog: 901,
    tooltip: 950,
    notification: 1000,
  },

  // Animation timing and transitions
  transition: {
    fast: '0.1s',
    normal: '0.15s',
    slow: '0.2s',
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

export type LayoutConfig = typeof layoutConfig;
