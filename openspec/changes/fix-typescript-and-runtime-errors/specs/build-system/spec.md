# Build System Specification

## MODIFIED Requirements

### Requirement: TypeScript Compilation

The system SHALL compile all TypeScript source files without errors.

#### Scenario: Type-safe compilation
- **WHEN** developer runs `npm run type-check`
- **THEN** TypeScript compiler reports 0 errors
- **AND** all type definitions are valid
- **AND** all imports resolve correctly

#### Scenario: Production build
- **WHEN** developer runs `npm run build`
- **THEN** Vite builds successfully
- **AND** all modules are bundled correctly
- **AND** build completes in < 10 seconds

#### Scenario: Development mode
- **WHEN** developer runs `npm run dev`
- **THEN** Vite dev server starts without errors
- **AND** Hot Module Replacement works correctly
- **AND** TypeScript type checking is active

---

### Requirement: PixiJS Integration

The system SHALL properly integrate PixiJS v8 API with type safety.

#### Scenario: Texture loading
- **WHEN** application initializes
- **THEN** all 83 character textures load successfully
- **AND** texture sources are properly typed
- **AND** PIXI.Texture.EMPTY used as safe default

#### Scenario: Sprite creation
- **WHEN** CharacterSprite is instantiated
- **THEN** baseTexture property is initialized
- **AND** sprite creation succeeds without undefined errors
- **AND** AnimatedSprite and Sprite types are properly handled

#### Scenario: Texture cloning
- **WHEN** creating sprite frames from texture atlas
- **THEN** new PIXI.Texture constructor is used
- **AND** texture source and frame are properly defined
- **AND** no deprecated API methods are called

---

### Requirement: Test Infrastructure

The system SHALL provide functional test infrastructure with proper type definitions.

#### Scenario: Unit test imports
- **WHEN** test files import testing utilities
- **THEN** vitest imports (describe, it, expect, beforeEach) resolve correctly
- **AND** @testing-library/react imports work (render, etc.)
- **AND** component imports use correct syntax (default vs named)

#### Scenario: Test type safety
- **WHEN** tests create mock data
- **THEN** mock objects match interface definitions
- **AND** timestamp fields use number type (Date.now())
- **AND** enum values match type definitions

#### Scenario: Store testing
- **WHEN** tests interact with Zustand stores
- **THEN** store methods exist and are properly typed
- **AND** store state structure matches type definitions
- **AND** test assertions use correct property names

---

### Requirement: AI Integration Type Safety

The system SHALL handle AI API responses with proper type guards and optional chaining.

#### Scenario: Gemini API response handling
- **WHEN** GeminiSpriteGenerator receives API response
- **THEN** optional chaining used for response.candidates?.[0]?.content?.parts
- **AND** type guards prevent undefined access errors
- **AND** fallback handling for missing response data

#### Scenario: MapGenerator response handling
- **WHEN** MapGenerator receives API response
- **THEN** optional chaining used for nested response properties
- **AND** text content safely extracted
- **AND** errors logged with context

#### Scenario: Tauri runtime detection
- **WHEN** code checks for Tauri environment
- **THEN** typeof window !== "undefined" checked first
- **AND** "__TAURI_IPC__" in window checked safely
- **AND** browser-only code doesn't fail in Tauri

---

### Requirement: Browser API Compatibility

The system SHALL use browser-compatible types throughout.

#### Scenario: Timer types
- **WHEN** code uses setTimeout/setInterval
- **THEN** ReturnType<typeof setTimeout> used instead of NodeJS.Timeout
- **AND** clearTimeout/clearInterval work correctly
- **AND** no Node.js-specific types in browser code

#### Scenario: Global references
- **WHEN** test code needs global scope
- **THEN** globalThis is used instead of global
- **AND** window checks include undefined guards
- **AND** browser APIs are properly typed

---

### Requirement: Module Resolution

The system SHALL resolve all module imports correctly.

#### Scenario: Vite environment types
- **WHEN** code accesses import.meta.env
- **THEN** vite-env.d.ts provides correct types
- **AND** VITE_ prefixed variables are typed
- **AND** import.meta.env.DEV/PROD work correctly

#### Scenario: Missing module fallbacks
- **WHEN** imported module doesn't exist
- **THEN** inline type definitions provided
- **AND** placeholder implementations used
- **AND** build doesn't fail

#### Scenario: UI component exports
- **WHEN** components imported from src/components/ui
- **THEN** all exports are properly declared
- **AND** DialogContent and other components available
- **AND** no missing export errors

---

## ADDED Requirements

### Requirement: Error Recovery

The system SHALL provide helpful error messages and recovery strategies.

#### Scenario: Character sprite fallback
- **WHEN** character texture fails to load
- **THEN** placeholder sprite generated
- **AND** application continues functioning
- **AND** error logged with context

#### Scenario: AI generation fallback
- **WHEN** AI sprite generation fails
- **THEN** existing sprite assets used as fallback
- **AND** user notified of fallback mode
- **AND** application remains functional

#### Scenario: Type checking guidance
- **WHEN** developer introduces type error
- **THEN** TypeScript error message is clear
- **AND** error location precisely identified
- **AND** fix suggestions provided where possible
