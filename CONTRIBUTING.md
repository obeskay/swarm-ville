# Contributing to SwarmVille

Thank you for your interest in contributing to SwarmVille!

## Development Setup

### Prerequisites
- Node.js 18+
- Rust 1.75+
- Tauri CLI: `npm install -g @tauri-apps/cli`

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/swarm-ville.git
cd swarm-ville

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run tests
npm run test

# Run linting
npm run lint
npm run type-check
```

## Project Structure

```
swarm-ville/
├── src/                    # React frontend
├── src-tauri/              # Rust backend
├── openspec/               # Specifications (single source of truth)
├── package.json
└── README.md
```

## Development Workflow

1. **Check OpenSpec First**: All specifications are in `openspec/specs/`
2. **Create Feature Branch**: `git checkout -b feat/your-feature`
3. **Make Changes**: Follow the spec and existing code patterns
4. **Test Locally**: `npm run tauri dev`
5. **Run Tests**: `npm run test`
6. **Commit**: Use semantic commits (`feat:`, `fix:`, `docs:`, etc.)
7. **Push & Create PR**: Include reference to spec section

## Code Style

- **Frontend**: TypeScript + React 18, follow existing patterns in `src/`
- **Backend**: Rust 2021 edition, `cargo fmt` before commit
- **CSS**: Tailwind CSS utilities only

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- src/lib/utils.ts

# Watch mode
npm run test -- --watch
```

## Commit Messages

Use semantic commit messages:

```
feat: add agent positioning engine
fix: prevent grid movement out of bounds
docs: update README with setup instructions
chore: update dependencies
refactor: simplify proximity calculation
```

## Pull Request Process

1. Update documentation if needed
2. Add/update tests for new functionality
3. Ensure all tests pass: `npm run test`
4. Run linter: `npm run lint`
5. Check types: `npm run type-check`
6. Reference spec sections in PR description

## Reporting Issues

Use GitHub issues with clear descriptions:
- What happened
- What should happen
- Steps to reproduce
- Screenshots if applicable

## Questions?

Open an issue or check the specs in `openspec/specs/`

---

Happy contributing! 🚀
