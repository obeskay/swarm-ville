# Achievement System Design

## Context

SwarmVille needs a robust gamification layer to drive engagement and provide meaningful feedback on player progress. The current system has achievements scattered across stores with no persistence or intelligent tracking.

## Goals

- **Unified State**: Single source of truth for all achievement/progression data
- **Real-time Tracking**: Instant feedback when players make progress
- **Intelligent UX**: Smooth animations, proper notifications, celebration effects
- **Persistence**: Database-backed achievement history and analytics
- **Extensibility**: Easy to add new achievement types and categories
- **Performance**: Efficient event tracking without impacting game performance

## Non-Goals

- Social/multiplayer achievements (post-MVP)
- Achievement marketplace or trading (post-MVP)
- External achievement platforms (Steam, etc.)
- Voice announcements for achievements
- 3D celebration effects

## Architecture

### State Management

```
┌─────────────────────────────────────────┐
│           gameStore (Zustand)           │
│  - Single source of truth               │
│  - Achievements, missions, XP, level    │
│  - Progress tracking                    │
│  - Unlock history                       │
└─────────────────────────────────────────┘
                    │
                    ├─ Persists to ─┐
                    │                │
                    ▼                ▼
         ┌──────────────────┐  ┌──────────────┐
         │   localStorage    │  │   SQLite DB  │
         │  (immediate sync) │  │ (long-term)  │
         └──────────────────┘  └──────────────┘
```

### Event Flow

```
User Action (e.g., spawn agent)
        │
        ▼
useAchievementTracking hook detects event
        │
        ▼
Check achievement conditions
        │
        ├─ No progress ────────┐
        │                      │
        ▼                      ▼
Update progress in store   Silent (no UI)
        │
        ▼
Progress threshold met?
        │
        ├─ Yes ─────────────────┐
        │                       │
        ▼                       ▼
Unlock achievement      Show notification
        │                       │
        ▼                       │
Award XP/rewards               │
        │                       │
        ▼                       │
Update database        ─────────┘
        │
        ▼
Check for level-up
        │
        ├─ Yes ──────────────┐
        │                    │
        ▼                    ▼
Trigger celebration    Update UI
```

### Database Schema

```sql
-- Achievements definition table
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    xp_reward INTEGER NOT NULL,
    icon TEXT,
    hidden BOOLEAN DEFAULT 0,
    prerequisite_ids TEXT, -- JSON array of achievement IDs
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Player achievement progress
CREATE TABLE achievement_progress (
    id TEXT PRIMARY KEY,
    achievement_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    max_progress INTEGER NOT NULL,
    unlocked BOOLEAN DEFAULT 0,
    unlocked_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- Unlock history for analytics
CREATE TABLE achievement_unlocks (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at INTEGER NOT NULL,
    context TEXT, -- JSON metadata about unlock
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- Create indexes for performance
CREATE INDEX idx_progress_player ON achievement_progress(player_id);
CREATE INDEX idx_progress_achievement ON achievement_progress(achievement_id);
CREATE INDEX idx_unlocks_player ON achievement_unlocks(player_id);
CREATE INDEX idx_unlocks_time ON achievement_unlocks(unlocked_at);
```

## Achievement Types

### 1. Milestone Achievements
Track cumulative progress toward a goal.

```typescript
{
  type: 'milestone',
  condition: {
    event: 'agent_spawned',
    target: 10,
    current: 0
  }
}
```

**Examples**:
- Spawn 1/5/10/25/50 agents
- Complete 10 conversations
- Reach level 5/10/20

### 2. Streak Achievements
Require consecutive days of activity.

```typescript
{
  type: 'streak',
  condition: {
    event: 'daily_login',
    consecutive_days: 7,
    current_streak: 0
  }
}
```

**Examples**:
- Log in 3/7/30 days in a row
- Spawn agent daily for a week
- Complete mission streak

### 3. Discovery Achievements
Hidden achievements unlocked by finding features.

```typescript
{
  type: 'discovery',
  hidden: true,
  condition: {
    event: 'feature_used',
    feature: 'language_learning'
  }
}
```

**Examples**:
- Use STT for the first time
- Discover language learning panel
- Find hidden easter egg

### 4. Mastery Achievements
Progress through skill levels.

```typescript
{
  type: 'mastery',
  condition: {
    skill: 'agent_management',
    level: 'expert', // beginner -> intermediate -> advanced -> expert -> master
    current_level: 'beginner'
  }
}
```

**Examples**:
- Become agent master (spawn 50+ agents)
- Language expert (teach 100 words)
- Space architect (customize 10 spaces)

### 5. Speed Achievements
Complete tasks within time limits.

```typescript
{
  type: 'speed',
  condition: {
    task: 'agent_spawn',
    time_limit_ms: 30000, // 30 seconds
    completed: false
  }
}
```

**Examples**:
- Spawn agent in < 30 seconds
- Complete tutorial in < 5 minutes
- Quick responder (reply within 10 seconds)

### 6. Collection Achievements
Unlock all items in a category.

```typescript
{
  type: 'collection',
  condition: {
    category: 'agent_roles',
    required: ['researcher', 'coder', 'designer', 'pm', 'qa'],
    unlocked: []
  }
}
```

**Examples**:
- Collect all agent roles
- Use all STT models
- Try all space themes

## Rarity System

```typescript
enum AchievementRarity {
  COMMON = 'common',     // 50 XP, 60% of achievements
  RARE = 'rare',         // 150 XP, 25% of achievements
  EPIC = 'epic',         // 300 XP, 12% of achievements
  LEGENDARY = 'legendary' // 500 XP, 3% of achievements
}
```

**Rarity Criteria**:
- **Common**: First-time actions, tutorials, basic milestones
- **Rare**: Significant progress, multiple prerequisites
- **Epic**: Advanced features, high skill requirements
- **Legendary**: Extreme dedication, hidden discoveries, perfect achievements

## UX Components

### Toast Notifications

```typescript
<AchievementToast
  achievement={achievement}
  variant={achievement.rarity}
  showProgress={!achievement.unlocked}
  autoHideDuration={5000}
  position="top-right"
  animation="slide-in-right"
/>
```

**Visual Hierarchy**:
- Common: Subtle slide-in, muted colors
- Rare: Bounce animation, vibrant colors
- Epic: Scale + glow effect, particle trail
- Legendary: Full-screen celebration, confetti, sound

### Achievement Panel

```typescript
<AchievementPanel>
  <AchievementGrid
    filter={selectedCategory}
    sort={sortBy}
    showLocked={showLocked}
  >
    {achievements.map(achievement => (
      <AchievementCard
        achievement={achievement}
        onClick={() => showDetails(achievement)}
      />
    ))}
  </AchievementGrid>
</AchievementPanel>
```

**Features**:
- Filter by category (tutorial, creation, collaboration, mastery, hidden)
- Sort by rarity, unlock date, progress
- Show/hide locked achievements
- Search by name/description
- Progress indicators on cards
- Click for detailed view

### Level-Up Celebration

```typescript
<LevelUpCelebration
  newLevel={level}
  xpEarned={xp}
  rewardsUnlocked={rewards}
  onClose={() => setShowCelebration(false)}
/>
```

**Animation Sequence**:
1. Screen overlay with dim background
2. Level badge scales up from center
3. Confetti particles from top
4. XP counter animates
5. New unlocks slide in from bottom
6. Celebration auto-closes after 5s or manual click

## Performance Optimizations

### Event Throttling
```typescript
// Throttle high-frequency events
const throttledTrack = useMemo(
  () => throttle((event) => trackAchievement(event), 1000),
  []
);
```

### Batch Updates
```typescript
// Batch multiple achievement updates
const batchUpdateAchievements = (updates: AchievementUpdate[]) => {
  const grouped = groupByAchievement(updates);
  grouped.forEach(update => {
    gameStore.getState().updateAchievementProgress(update);
  });
};
```

### Lazy Loading
```typescript
// Load achievement details on-demand
const { data: achievements } = useQuery({
  queryKey: ['achievements', category],
  queryFn: () => fetchAchievements(category),
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

## Migration Strategy

### Phase 1: Database Setup
1. Create new tables
2. Seed initial achievements
3. Migrate existing mission data

### Phase 2: Store Consolidation
1. Copy missions from userStore to gameStore
2. Update all components to use gameStore
3. Remove userStore mission code
4. Update localStorage keys

### Phase 3: Hook Integration
1. Add useAchievementTracking to App.tsx
2. Integrate with existing game loops
3. Test real-time tracking

### Phase 4: UX Enhancement
1. Replace basic toasts with new components
2. Add celebration effects
3. Implement achievement panel
4. Polish animations

## Rollback Plan

If critical bugs emerge:
1. Disable achievement tracking via feature flag
2. Revert to old userStore missions
3. Keep database tables (no data loss)
4. Fix issues in parallel branch
5. Re-enable when stable

## Open Questions

1. Should achievements be shareable/exportable?
   - **Decision**: Yes, add JSON export in Phase 2

2. How to handle achievement resets?
   - **Decision**: Admin-only feature, not exposed to users initially

3. Should we track failed attempts?
   - **Decision**: Yes, store in analytics for insights

4. Notification sound preferences?
   - **Decision**: Off by default, toggle in settings

## Success Metrics

- Achievement unlock rate > 70% for common achievements
- Average time to first achievement < 5 minutes
- Player retention increase of 20%+ with gamification
- Zero achievement sync bugs between store and DB
- Notification dismissal rate < 30%
- Performance impact < 5ms per tracked event
