# space-sync Delta

## ADDED Requirements

### Requirement: Space Version Tracking
The system SHALL track version numbers for each space to enable change detection and conflict resolution.

#### Scenario: Space creation
- **WHEN** a new space is created
- **THEN** version is initialized to 1
- **AND** version is stored with space metadata

#### Scenario: Space modification
- **WHEN** space properties are modified
- **THEN** version is incremented atomically
- **AND** updatedAt timestamp is set to current time

#### Scenario: Version sync on join
- **WHEN** client joins a space
- **THEN** server sends current version in space_state message
- **AND** client stores version locally

#### Scenario: Version change notification
- **WHEN** space version changes
- **THEN** server broadcasts space_updated message with new version
- **AND** all connected clients update their local version
- **AND** clients log version change in dev mode

### Requirement: Version Conflict Detection
The system SHALL detect version mismatches to prevent stale updates.

#### Scenario: Stale client update
- **WHEN** client attempts update with old version
- **THEN** server rejects update
- **AND** server sends current version to client
- **AND** client refreshes space state

#### Scenario: Concurrent modifications
- **WHEN** multiple clients modify space simultaneously
- **THEN** only first update succeeds
- **AND** other clients receive version_conflict error
- **AND** clients retry with latest version
