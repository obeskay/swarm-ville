# Add Intelligent Achievement System

## Why

The current achievement system is basic and disconnected. We have duplicate achievement/mission data across `gameStore` and `userStore`, no real-time tracking, limited UX feedback, and no database persistence. Users don't get meaningful progress feedback, and the gamification feels shallow.

This change implements a next-level achievement system with:
- Real-time intelligent tracking across all game actions
- Beautiful, frictionless UX with animations and notifications
- Consistent state management with single source of truth
- Database persistence for achievement history
- Progressive disclosure of achievements
- Analytics and insights for player engagement

## What Changes

### Store Consolidation
- **BREAKING**: Merge achievement/mission data from `userStore` into `gameStore`
- Single source of truth for all gamification state
- Remove duplicate mission definitions
- Unified achievement unlocking logic

### Achievement Engine
- Real-time event-based tracking system
- Intelligent progress calculation
- Achievement chaining and dependencies
- Rarity-based rewards (common, rare, epic, legendary)
- Hidden achievements that unlock based on behavior

### Database Integration
- Achievement history persistence
- Progress tracking across sessions
- Analytics data collection
- Export/import functionality

### UX Enhancements
- Smooth animations for level-ups and unlocks
- Toast notifications with proper z-index layering
- Achievement showcase panel
- Progress bars with micro-interactions
- Celebration effects (confetti, particles)
- Sound effects (optional, respects settings)

### New Achievement Types
- **Milestone**: Complete X of Y (e.g., "Spawn 10 agents")
- **Streak**: Do X for Y consecutive days
- **Discovery**: Find hidden features
- **Mastery**: Reach proficiency levels
- **Social**: Collaborate with agents
- **Speed**: Complete tasks quickly
- **Collection**: Unlock all items in a set

## Impact

### Affected Systems
- **Stores**: `gameStore.ts`, `userStore.ts` (consolidation)
- **Database**: New `achievements` and `achievement_progress` tables
- **Components**: `GameHUD.tsx`, `AchievementToast.tsx`, new `AchievementPanel.tsx`
- **Hooks**: New `useAchievementTracking.ts` for auto-tracking
- **Types**: New comprehensive achievement types

### Breaking Changes
- `userStore.missions` → moved to `gameStore`
- Achievement unlock events renamed for consistency
- Database schema migration required

### Benefits
- Single source of truth eliminates sync bugs
- Real-time tracking improves engagement
- Database persistence enables long-term progression
- Better UX increases retention
- Extensible architecture for future achievement types
