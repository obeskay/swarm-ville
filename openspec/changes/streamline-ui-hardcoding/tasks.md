# Task Breakdown: Streamline UI Hardcoding

## Phase 1: Critical Fixes (Est: 1.5 hours)

### Task 1.1: Refactor Dialog Component
- [ ] Add `dialogOverlayVariants` CVA with backdrop options
- [ ] Add `dialogContentVariants` CVA with size + animation options
- [ ] Import `createPortal` from react-dom
- [ ] Implement portal rendering at `document.body`
- [ ] Add scroll lock prevention on body
- [ ] Set z-index to `z-[100]` (modal layer)
- [ ] Update DialogProps interface with variant props
- [ ] Test all Dialog consumers render correctly
- **Validation:** Dialog renders in portal, backdrop is proper, no z-index conflicts

### Task 1.2: Update Dialog Consumers
- [ ] AgentSpawner.tsx - Test dialog renders correctly
- [ ] AgentDialog.tsx - Verify backdrop/animation
- [ ] SpaceCreationDialog.tsx - Check z-index layering
- [ ] SpriteGeneratorDialog.tsx - Visual test
- **Validation:** All dialogs appear above everything else, no overlap with top bar

### Task 1.3: Fix RightSidebar Z-Index
- [ ] Remove `fixed inset-0 z-50` wrapper around AgentSpawner
- [ ] Verify AgentSpawner Dialog handles positioning itself
- [ ] Test that sidebar doesn't clip dialogs
- **Validation:** Dialogs render properly without RightSidebar z-conflicts

---

## Phase 2: Core Component Extensions (Est: 45 min)

### Task 2.1: Extend Card Variants
- [ ] Add `panel` variant: `bg-card/95 backdrop-blur-xl border shadow-lg`
- [ ] Add `hud` variant: `from-primary/10 border-2 border-primary/20`
- [ ] Add `metric` variant: `hover:bg-card/80 border hover:border-border/60`
- [ ] Add `achievement` variant: `hover:shadow-xl hover:-translate-y-1`
- [ ] Test all variants in both light/dark modes
- [ ] Verify Tailwind compiles correctly
- **Validation:** All 4 new variants render correctly, build passes

### Task 2.2: Extend Badge Variants
- [ ] Add `level` variant: Gradient with shadow
- [ ] Add `category` variant: Gradient background
- [ ] Add `status` variant: Emerald colors
- [ ] Add `metric` variant: Border style
- [ ] Test all variants
- **Validation:** All badges render correctly, colors are distinct

---

## Phase 3: Refactor High-Impact Components (Est: 2.5 hours)

### Task 3.1: Refactor AgentPanel
- [ ] Remove undefined `.card-minimal` class
- [ ] Replace with `<Card variant="minimal">`
- [ ] Remove hardcoded `bg-card shadow-lg h-10`
- [ ] Use Button variants consistently
- [ ] Remove `agent-panel` custom class
- [ ] Test collapsed/expanded states
- **Validation:** AgentPanel renders correctly, styles match design, no console errors

### Task 3.2: Refactor SpaceCard
- [ ] Remove inline `style={{backgroundColor: themeColor}}`
- [ ] Replace with theme variant system (if needed)
- [ ] Remove complex `cn()` logic
- [ ] Use Card variants for state-based styling
- [ ] Test all space states
- **Validation:** Colors render correctly, dark mode works, animations smooth

### Task 3.3: Refactor GameHUD
- [ ] Replace Card variant="yellow" usage with inline overrides
- [ ] Use Card `hud` variant consistently
- [ ] Remove `backdrop-blur-md` inline classes
- [ ] Replace hardcoded progress bar with styled component
- [ ] Use Badge `level` for level display
- [ ] Test level-up animation
- **Validation:** HUD renders correctly, XP bar animates smoothly, dark mode works

### Task 3.4: Refactor AchievementPanel
- [ ] Remove hardcoded backdrop `bg-black/60`
- [ ] Use Dialog with proper backdrop variant
- [ ] Replace CATEGORY_COLORS hardcoding with variant system
- [ ] Use Card `achievement` variant
- [ ] Remove gradient classes, use CSS variables
- [ ] Test achievement unlock animation
- **Validation:** Panel renders correctly, colors are consistent, animations work

### Task 3.5: Refactor SpaceCreationDialog
- [ ] Remove inline `style={{color: template.color}}`
- [ ] Remove gradient `from-primary/10 to-primary/5`
- [ ] Use Card variants for templates
- [ ] Replace theme colors with variant system
- [ ] Remove `cn()` complexity in buttons
- [ ] Test template preview
- **Validation:** Dialog renders correctly, templates display properly, dark mode works

### Task 3.6: Refactor RightSidebar
- [ ] Remove `sidebar-modern` custom class
- [ ] Use Card `panel` variant for cards
- [ ] Remove inline overrides on Card elements
- [ ] Test all tabs (Agents, Metrics, Activity)
- [ ] Verify scrolling works
- **Validation:** Sidebar renders cleanly, all tabs work, no style conflicts

### Task 3.7: Refactor AgentSpawner
- [ ] Test Dialog rendering with new CVA variants
- [ ] Verify form inputs use proper variants
- [ ] Remove any hardcoded button styles
- [ ] Test role selection UI
- **Validation:** Spawner renders correctly, form works, dialog backdrop visible

---

## Phase 4: Delete Dead Code (Est: 30 min)

### Task 4.1: Remove Minimal* Components
- [ ] Delete `src/components/ui/MinimalButton.tsx`
- [ ] Delete `src/components/ui/MinimalCard.tsx`
- [ ] Delete `src/components/ui/MinimalBadge.tsx`
- [ ] Delete `src/components/ui/MinimalPanel.tsx`
- [ ] Delete `src/components/ui/MinimalInput.tsx`
- [ ] Search codebase for any imports: `grep -r "Minimal" src/`
- [ ] Remove any remaining imports
- **Validation:** No imports of Minimal* components, build succeeds

### Task 4.2: Clean Up Undefined CSS Classes
- [ ] Search for `.card-minimal` usage - replace with Card variant
- [ ] Search for `.card-light` usage - replace with Card variant
- [ ] Search for `.shadow-soft` usage - replace with Tailwind shadow
- [ ] Search for `.shadow-soft-lg` usage - replace with shadow-lg
- [ ] Remove these from `src/index.css`
- [ ] Verify all references are fixed
- **Validation:** No undefined classes in CSS, grep shows zero matches

### Task 4.3: Remove Unused Files
- [ ] Delete or deprecate `useButtonConfig` hook (if exists)
- [ ] Delete or deprecate `useCardConfig` hook (if exists)
- [ ] Delete or deprecate `useBadgeConfig` hook (if exists)
- [ ] Search for any remaining config imports
- **Validation:** No config hook imports remain

---

## Phase 5: Testing & Documentation (Est: 1 hour)

### Task 5.1: Build & Verify
- [ ] `npm run build` - zero errors
- [ ] `npm run build` - zero TypeScript errors
- [ ] Check bundle size - no significant increase
- [ ] Test in browser at localhost:5173
- **Validation:** Build succeeds, app loads, no console errors

### Task 5.2: Visual Testing
- [ ] Test all pages in light mode
- [ ] Test all pages in dark mode
- [ ] Test all dialogs/modals open correctly
- [ ] Test GameHUD animations
- [ ] Test AgentPanel collapsed/expanded
- [ ] Test all cards in right sidebar
- **Validation:** Visual consistency across all pages, no broken layouts

### Task 5.3: Component Testing
- [ ] Dialog opens/closes smoothly
- [ ] Backdrop click closes dialog
- [ ] Multiple dialogs layer correctly
- [ ] Animations play smoothly
- [ ] Hover states work
- [ ] Dark mode colors are readable
- **Validation:** All interactions work as expected

### Task 5.4: Create Design System Spec
- [ ] Document all Card variants with examples
- [ ] Document all Badge variants with examples
- [ ] Document Dialog usage with backdrop options
- [ ] List color tokens and their usage
- [ ] Create component usage guide
- **Validation:** Spec is complete and accurate

---

## Validation Checklist

Before marking complete:

- ✅ Build: `npm run build` succeeds
- ✅ TypeScript: Zero errors
- ✅ Code: No hardcoded colors/spacing in components
- ✅ CSS: No undefined classes (grep shows zero matches)
- ✅ Components: All refactored components render correctly
- ✅ Tests: Visual testing passes in light + dark mode
- ✅ Performance: No bundle size increase
- ✅ Dialogs: Proper backdrop, z-index, portal rendering
- ✅ Dark Mode: All colors readable, consistent theming
- ✅ Dead Code: All Minimal* components deleted, zero remaining imports

---

## Dependencies & Ordering

**Must Complete First:**
1. Task 1.1 (Dialog fix - blocking all other work)
2. Task 2.1 & 2.2 (Card/Badge variants - needed by all refactors)

**Parallelizable:**
- Tasks 3.1-3.7 (All refactors can run in parallel)
- Task 4.x (Delete dead code - independent)

**Must Complete Last:**
- Task 5.x (Testing - validates all previous work)

---

## Notes

- All changes are backward compatible
- No new dependencies added
- Pure refactoring (no feature changes)
- Focus on code quality, not new functionality

