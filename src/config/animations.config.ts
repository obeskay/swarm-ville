/**
 * Animations Configuration System
 * Defines all animation durations, easing functions, and animation specifications
 * ZERO HARDCODED VALUES - all values configured here
 */

export const animationsConfig = {
  // Animation duration presets (milliseconds)
  duration: {
    instant: 0,
    fast: 100,
    normal: 150,
    slow: 200,
    slower: 300,
    slowest: 500,
  },

  // Easing functions
  easing: {
    linear: 'cubic-bezier(0, 0, 1, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
    easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
    easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
    elasticIn: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    elasticOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elasticInOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Transition specifications for different UI interactions
  transitions: {
    // Button interactions
    buttonPress: {
      duration: 100,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      properties: 'all',
    },
    buttonHover: {
      duration: 150,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: 'all',
    },
    buttonActive: {
      duration: 75,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: 'background-color, transform',
    },

    // Panel transitions
    panelSlide: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'transform, opacity',
    },
    panelFade: {
      duration: 150,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: 'opacity',
    },

    // Color and background transitions
    colorChange: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'background-color, color',
    },
    borderChange: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'border-color',
    },

    // Progress and loading
    progressFill: {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'width, background-color',
    },
    loadingSpinner: {
      duration: 1000,
      easing: 'linear',
      properties: 'transform',
      iterationCount: 'infinite',
    },

    // Dialog and overlay
    dialogAppear: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'opacity, transform',
    },
    backdropFade: {
      duration: 200,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      properties: 'opacity',
    },

    // Input focus and states
    inputFocus: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'border-color, box-shadow',
    },

    // Badge and notification
    badgeScale: {
      duration: 200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      properties: 'transform, opacity',
    },
    notificationSlide: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'transform, opacity',
    },

    // Sidebar on mobile
    mobileDrawerOpen: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'transform, opacity',
    },
    mobileDrawerClose: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'transform, opacity',
    },
  },

  // Keyframe animations for complex effects
  keyframes: {
    fadeIn: {
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      frames: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    },
    fadeOut: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      frames: {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
    },
    slideInLeft: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      frames: {
        from: { transform: 'translateX(-100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
    },
    slideInRight: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      frames: {
        from: { transform: 'translateX(100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
    },
    slideOutLeft: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      frames: {
        from: { transform: 'translateX(0)', opacity: 1 },
        to: { transform: 'translateX(-100%)', opacity: 0 },
      },
    },
    slideOutRight: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      frames: {
        from: { transform: 'translateX(0)', opacity: 1 },
        to: { transform: 'translateX(100%)', opacity: 0 },
      },
    },
    scaleIn: {
      duration: 200,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      frames: {
        from: { transform: 'scale(0.95)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
      },
    },
    scaleOut: {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      frames: {
        from: { transform: 'scale(1)', opacity: 1 },
        to: { transform: 'scale(0.95)', opacity: 0 },
      },
    },
    bounce: {
      duration: 600,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      frames: {
        '0%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
        '100%': { transform: 'translateY(0)' },
      },
    },
    pulse: {
      duration: 2000,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      iterationCount: 'infinite',
      frames: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
    },
    spin: {
      duration: 1000,
      easing: 'linear',
      iterationCount: 'infinite',
      frames: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    },
  },

  // Game-specific animations
  game: {
    // Character movement animation
    characterMove: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      properties: 'transform',
    },
    // Character action (attack, interact, etc.)
    characterAction: {
      duration: 200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      properties: 'transform',
    },
    // Damage or hit feedback
    damageFeedback: {
      duration: 100,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      properties: 'transform, opacity',
    },
    // Mission completion effect
    missionComplete: {
      duration: 500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      properties: 'transform, opacity',
    },
    // Camera pan/zoom
    cameraPan: {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: 'transform',
    },
  },

  // Delay presets for staggered animations
  delay: {
    none: 0,
    xs: 50,
    sm: 100,
    md: 150,
    lg: 200,
    xl: 300,
  },
} as const;

export type AnimationsConfig = typeof animationsConfig;
