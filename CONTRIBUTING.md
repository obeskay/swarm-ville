# Contributing to SwarmVille

First off, thanks for taking the time to contribute! 🎉

SwarmVille is an open-source project that welcomes contributions of all kinds: code, documentation, design, bug reports, feature requests, and more.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

**Be respectful, inclusive, and constructive.** We're all here to build something cool together.

## How Can I Contribute?

### Report Bugs

Found a bug? [Open an issue](https://github.com/obeskay/swarm-ville/issues/new?template=bug_report.md) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Your OS, Node.js version, and Tauri version

### Suggest Features

Have an idea? [Create a feature request](https://github.com/obeskay/swarm-ville/issues/new?template=feature_request.md) with:
- Clear description of the feature
- Why it would be useful
- Possible implementation approach (if you have thoughts)

### Improve Documentation

Documentation improvements are always welcome:
- Fix typos or clarify confusing sections
- Add examples or tutorials
- Translate documentation to other languages

### Submit Code

1. Check existing [issues](https://github.com/obeskay/swarm-ville/issues) or create one to discuss your idea
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes following our [style guidelines](#style-guidelines)
5. Write or update tests as needed
6. Ensure all tests pass (`pnpm run test:all`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to your branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Development Setup

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Rust** (via [rustup](https://rustup.rs/))
- **Git**

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/swarm-ville.git
cd swarm-ville

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Start development servers
pnpm run dev:all
```

### Project Structure

```
src/               # React frontend
├── components/    # UI components
├── game/          # PixiJS game engine
└── hooks/         # React hooks

src-tauri/         # Rust backend
└── src/
    ├── agents/    # Agent runtime
    ├── ws/        # WebSocket server
    └── db/        # SQLite database

server/            # Node.js WebSocket server
└── providers/     # AI provider adapters

public/sprites/    # Pixel-art assets
```

## Pull Request Process

1. **Update documentation** if you change behavior
2. **Add tests** for new features or bug fixes
3. **Ensure CI passes** (type check, lint, tests)
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Checklist

- [ ] Code compiles without errors
- [ ] All tests pass (`pnpm run test:all`)
- [ ] Linting passes (`pnpm run lint`)
- [ ] Type checking passes (`pnpm run type-check`)
- [ ] Documentation updated (if needed)
- [ ] Tests added/updated (if needed)

## Style Guidelines

### TypeScript/React

- Use **TypeScript** for all new files
- Follow existing code style (Prettier handles this)
- Use **functional components** with hooks
- Prefer **composition** over inheritance
- Keep components **small and focused**

### Commit Messages

Write clear, descriptive commit messages:

```
feat: add agent collision detection
fix: resolve WebSocket reconnection bug
docs: update installation instructions
style: format code with Prettier
refactor: simplify agent state management
test: add E2E tests for agent spawning
chore: update dependencies
```

### Code Comments

- Comment **why**, not **what**
- Use JSDoc for public functions/components
- Keep comments up-to-date with code changes

## Community

- **GitHub Issues**: For bugs, features, and discussions
- **Pull Requests**: For code contributions
- **Discord**: (Coming soon)
- **Twitter**: (Coming soon)

---

Thank you for contributing to SwarmVille! Your efforts help make AI collaboration more visual and accessible for everyone.
