# Player Initialization Specification

## Context
The player stats initialization system ensures that users start with appropriate stats and that their progress is properly persisted and restored across sessions.

---

## ADDED Requirements

### Requirement: System SHALL distinguish between new and returning users
**Priority**: High
**Rationale**: Different initialization paths needed for first-time vs returning users

#### Scenario: First-time user opens the app
- **Given** the app is opened for the first time
- **And** no persisted user data exists in localStorage
- **When** the app initializes
- **Then** the system should initialize player stats with:
  - level: 1
  - xp: 0
  - balance: 50.0 (starting bonus)
  - missions: default mission list with all progress at 0
- **And** mark the user as initialized

#### Scenario: Returning user opens the app
- **Given** the app is opened by a returning user
- **And** valid persisted user data exists in localStorage
- **When** the app initializes
- **Then** the system should load the persisted stats
- **And** validate that all required fields are present
- **And** use the loaded stats in the UI

---

### Requirement: System SHALL validate persisted data integrity
**Priority**: High
**Rationale**: Corrupted or invalid data should not crash the app

#### Scenario: Persisted data is corrupted or invalid
- **Given** persisted user data exists
- **And** the data is missing required fields or has invalid values
- **When** the app attempts to load the data
- **Then** the system should log a warning
- **And** reset to default starting stats for a new user
- **And** mark the user as needing re-initialization

#### Scenario: Persisted data has valid structure
- **Given** persisted user data exists
- **And** all required fields (level, xp, balance, missions) are present
- **And** values are within valid ranges (level >= 1, xp >= 0, balance >= 0)
- **When** the app loads the data
- **Then** the system should accept and use the data
- **And** not trigger any warnings

---

### Requirement: Initialization SHALL complete before UI renders player stats
**Priority**: Critical
**Rationale**: Prevents UI showing incorrect or undefined values

#### Scenario: App initialization sequence
- **Given** the app is starting up
- **When** the initialization begins
- **Then** player stats must be loaded/initialized first
- **And** UI components accessing player stats wait for initialization
- **And** a loading state is shown until initialization completes

---

### Requirement: System SHALL provide initialization status to components
**Priority**: Medium
**Rationale**: Components need to know when stats are ready

#### Scenario: Components check initialization status
- **Given** a component needs to display player stats
- **When** the component mounts
- **Then** it should check if stats are initialized
- **And** show loading UI if not initialized
- **And** show actual stats once initialized

---

## MODIFIED Requirements

### Requirement: Default mission progress SHALL start at 0 for new users
**Priority**: Medium
**Previously**: Missions had arbitrary starting progress (e.g., "first-steps" had progress: 1)
**Now**: All missions start with progress: 0 for new users

#### Scenario: New user sees initial missions
- **Given** a new user starts the app
- **When** missions are initialized
- **Then** all mission progress values should be 0
- **And** all missions should be marked as not completed
- **And** appropriate missions should be marked as active
