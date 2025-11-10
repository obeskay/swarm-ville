# Gamification System Specification

## ADDED Requirements

### Requirement: Achievement Type System
The system SHALL support multiple achievement types with distinct tracking mechanisms and unlock conditions.

#### Scenario: Milestone achievement tracking
- **WHEN** a player performs a trackable action (e.g., spawn agent)
- **THEN** the system SHALL increment the progress counter for all milestone achievements watching that action
- **AND** when progress reaches the target value, the achievement SHALL be unlocked

#### Scenario: Streak achievement tracking
- **WHEN** a player performs a daily action for consecutive days
- **THEN** the system SHALL maintain a streak counter
- **AND** if a day is missed, the streak SHALL reset to zero
- **AND** when the streak reaches the target, the achievement SHALL be unlocked

#### Scenario: Hidden achievement discovery
- **WHEN** a player performs a specific undisclosed action
- **THEN** the hidden achievement SHALL be revealed and unlocked
- **AND** the achievement SHALL appear in the player's unlocked list
- **BUT** locked hidden achievements SHALL NOT be visible in the achievement list

#### Scenario: Collection achievement completion
- **WHEN** a player unlocks all required items in a collection category
- **THEN** the collection achievement SHALL automatically unlock
- **AND** the system SHALL award bonus XP for completing the full collection

### Requirement: Real-time Progress Tracking
The system SHALL track achievement progress in real-time across all player actions without manual updates.

#### Scenario: Automatic progress detection
- **WHEN** any tracked game event occurs (agent spawn, conversation, navigation)
- **THEN** the achievement tracking hook SHALL detect the event
- **AND** evaluate all relevant achievement conditions
- **AND** update progress immediately in the store and database

#### Scenario: Batch progress updates
- **WHEN** multiple trackable events occur within 1 second
- **THEN** the system SHALL batch the updates
- **AND** apply them together to minimize database writes
- **AND** preserve the correct order of events

#### Scenario: Progress persistence
- **WHEN** achievement progress is updated
- **THEN** the system SHALL persist to localStorage immediately
- **AND** write to SQLite database within 5 seconds
- **AND** on app restart, the system SHALL restore progress from database

### Requirement: Achievement Unlocking and Rewards
The system SHALL automatically unlock achievements when conditions are met and award appropriate rewards.

#### Scenario: Achievement unlock with XP reward
- **WHEN** an achievement's progress reaches 100%
- **THEN** the achievement SHALL be marked as unlocked with timestamp
- **AND** XP SHALL be awarded based on the achievement's rarity
- **AND** the unlock event SHALL be recorded in achievement history
- **AND** a toast notification SHALL be displayed to the player

#### Scenario: Level-up from achievement XP
- **WHEN** XP from an achievement unlock causes total XP to exceed the level threshold
- **THEN** the player level SHALL increment
- **AND** remaining XP SHALL carry over to the next level
- **AND** a level-up celebration SHALL be triggered
- **AND** new achievements MAY be unlocked based on the new level

#### Scenario: Prerequisite achievement chain
- **WHEN** an achievement has prerequisite achievements defined
- **THEN** the dependent achievement SHALL only become trackable after prerequisites are unlocked
- **AND** attempting to unlock without prerequisites SHALL fail silently
- **AND** the UI SHALL indicate which prerequisites are missing

### Requirement: Achievement Notification System
The system SHALL display contextual notifications for achievement progress and unlocks with appropriate visual feedback.

#### Scenario: Common achievement unlock notification
- **WHEN** a common rarity achievement is unlocked
- **THEN** a toast notification SHALL slide in from the right
- **AND** display the achievement icon, title, and XP reward
- **AND** auto-dismiss after 5 seconds
- **AND** allow manual dismissal via close button

#### Scenario: Legendary achievement celebration
- **WHEN** a legendary rarity achievement is unlocked
- **THEN** a full-screen overlay SHALL appear
- **AND** confetti particles SHALL animate from the top
- **AND** achievement details SHALL scale in with glow effect
- **AND** optional sound effect SHALL play (if enabled in settings)
- **AND** auto-dismiss after 8 seconds or on manual click

#### Scenario: Progress milestone notification
- **WHEN** achievement progress reaches 25%, 50%, 75%
- **THEN** a subtle progress notification SHALL appear
- **AND** show current progress (e.g., "8/10 agents spawned")
- **AND** auto-dismiss after 3 seconds
- **BUT** not interrupt higher-priority notifications

#### Scenario: Notification stacking and queue
- **WHEN** multiple achievements unlock simultaneously
- **THEN** notifications SHALL stack vertically in the top-right corner
- **AND** display up to 3 notifications at once
- **AND** queue additional notifications to show after dismissal
- **AND** maintain z-index ordering to prevent overlap

### Requirement: Achievement Database Persistence
The system SHALL persist all achievement data, progress, and history to SQLite for analytics and recovery.

#### Scenario: Initial achievement seeding
- **WHEN** the database is initialized
- **THEN** all predefined achievements SHALL be inserted into the achievements table
- **AND** player progress records SHALL be created for non-hidden achievements
- **AND** default progress values SHALL be set to zero

#### Scenario: Progress update persistence
- **WHEN** achievement progress changes in the store
- **THEN** the system SHALL update the achievement_progress table within 5 seconds
- **AND** update the updated_at timestamp
- **AND** on database write failure, SHALL retry up to 3 times
- **AND** log errors for manual recovery

#### Scenario: Unlock history recording
- **WHEN** an achievement is unlocked
- **THEN** a record SHALL be inserted into achievement_unlocks table
- **AND** include player ID, achievement ID, timestamp, and context metadata
- **AND** the context SHALL contain relevant game state (level, agents, etc.)
- **AND** this data SHALL be used for analytics and player insights

#### Scenario: Database recovery on app start
- **WHEN** the application starts
- **THEN** achievement progress SHALL be loaded from the database
- **AND** compared with localStorage for discrepancies
- **AND** database version SHALL take precedence if timestamps differ
- **AND** corrupted data SHALL be repaired from achievement definitions

### Requirement: Achievement Analytics and Insights
The system SHALL track achievement unlock rates and player engagement metrics for analysis.

#### Scenario: Achievement unlock rate calculation
- **WHEN** viewing achievement analytics
- **THEN** the system SHALL calculate unlock percentage for each achievement
- **AND** show average time to unlock
- **AND** display rarity distribution across unlocked achievements
- **AND** compare player progress to theoretical average

#### Scenario: Player engagement scoring
- **WHEN** calculating engagement score
- **THEN** the system SHALL weight achievements by rarity
- **AND** factor in unlock speed (faster = higher score)
- **AND** consider streak achievements as high engagement indicators
- **AND** produce a score from 0-100 representing overall engagement

#### Scenario: Progress tracking over time
- **WHEN** viewing progress history
- **THEN** the system SHALL show achievements unlocked per day/week/month
- **AND** display XP earned over time as a line chart
- **AND** highlight milestone days (level-ups, rare unlocks)
- **AND** allow export as JSON or CSV

## MODIFIED Requirements

### Requirement: Game State Management
The game store SHALL be the single source of truth for all gamification state including achievements, missions, XP, and level.

**Changes from current implementation**:
- Consolidated missions from userStore into gameStore
- Added achievement tracking state
- Enhanced XP calculation with achievement rewards
- Added database sync logic

#### Scenario: XP gain from multiple sources
- **WHEN** XP is awarded from any source (mission, achievement, level-up bonus)
- **THEN** the gameStore SHALL handle the XP addition
- **AND** update the XP total
- **AND** check for level-up conditions
- **AND** persist to both localStorage and database
- **AND** trigger appropriate UI notifications

#### Scenario: Mission completion with achievement unlock
- **WHEN** a mission is completed
- **THEN** the mission SHALL be marked complete in gameStore
- **AND** mission XP SHALL be awarded
- **AND** related achievements SHALL be checked for progress
- **AND** if an achievement unlocks, its XP SHALL stack with mission XP
- **AND** level-up calculation SHALL consider total XP from both sources

### Requirement: Notification Display Consistency
All game notifications (achievements, XP gains, level-ups, missions) SHALL use a unified notification system with consistent styling and behavior.

**Changes from current implementation**:
- Replaced disparate notification approaches
- Unified z-index and positioning
- Standardized animation timing
- Added notification priority system

#### Scenario: High-priority notification interruption
- **WHEN** a high-priority notification (level-up) needs to display
- **THEN** lower-priority notifications (progress updates) SHALL pause
- **AND** high-priority notification SHALL display in the center
- **AND** after dismissal, queued notifications SHALL resume
- **AND** no notifications SHALL be lost

#### Scenario: Notification accessibility
- **WHEN** a notification appears
- **THEN** it SHALL be keyboard accessible (ESC to dismiss)
- **AND** screen readers SHALL announce the notification
- **AND** animations SHALL respect prefers-reduced-motion
- **AND** color contrast SHALL meet WCAG AA standards

## REMOVED Requirements

### Requirement: Separate Mission State in UserStore
**Reason**: Consolidating all gamification state into gameStore for consistency
**Migration**: Mission data will be moved to gameStore during implementation
**Affected Components**: All components currently using userStore.missions

### Requirement: Manual Achievement Progress Updates
**Reason**: Replaced by automated real-time tracking system
**Migration**: Remove manual updateMissionProgress calls in favor of automatic tracking
**Affected Components**: AgentSpawner.tsx, SpaceContainer.tsx, and other components with manual progress calls
