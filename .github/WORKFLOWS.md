# GitHub Actions Workflows

This document describes all automated workflows configured for SwarmVille.

## Overview

SwarmVille uses GitHub Actions for:
- **Continuous Testing**: Unit and integration tests on every push/PR
- **Code Quality**: ESLint, TypeScript checks, coverage analysis
- **Security Scanning**: Dependency vulnerabilities, code security
- **Automated Builds**: Cross-platform desktop application builds
- **Release Management**: Automated release creation and distribution

## Workflows

### 1. Test Suite (`test.yml`)

Runs on every push to `main`/`develop` and all pull requests.

**Triggers**:
- Push to `main` or `develop`
- Pull request to `main` or `develop`

**Jobs**:
- **test**: Runs on Node.js 18.x and 20.x
  - Type checking with TypeScript
  - Linting with ESLint
  - Unit and integration tests with Vitest
  - Coverage report generation
  - Coverage upload to Codecov

**Duration**: ~5-10 minutes

**Required to Pass**: ✅ Yes (blocks merges)

### 2. Build (`build.yml`)

Builds frontend and Tauri application across platforms.

**Triggers**:
- Push to `main`
- Push to tags (v*)
- Pull request to `main`

**Jobs**:

#### build-frontend
Builds React/Vite frontend:
- Runs on: Ubuntu
- Output: `dist/` directory
- Artifacts uploaded for next job

#### build-tauri
Cross-platform Tauri builds:
- Runs on: Ubuntu, macOS (Intel + ARM), Windows
- Targets:
  - `x86_64-unknown-linux-gnu` (Linux)
  - `x86_64-apple-darwin` (macOS Intel)
  - `aarch64-apple-darwin` (macOS ARM)
  - `x86_64-pc-windows-msvc` (Windows)
- Output: Platform-specific bundles
- Artifacts uploaded for releases

#### publish-release
Publishes artifacts for tagged releases:
- Triggered on version tags (v*)
- Creates GitHub release with binaries
- Assets: All platform bundles

**Duration**: ~20-40 minutes (varies by platform)

**Required to Pass**: ✅ Yes for `main` branch

### 3. Code Quality & Security (`quality.yml`)

Comprehensive code quality and security checks.

**Triggers**:
- Push to `main`/`develop`
- Pull request to `main`/`develop`
- Weekly schedule (Sunday at 00:00 UTC)

**Jobs**:

#### quality
Code quality checks:
- Type checking
- Linting
- Tests with coverage
- Coverage threshold validation

#### security
Security vulnerability scanning:
- npm audit
- Trivy filesystem scan
- SARIF report upload to GitHub Security

#### dependency-check
Dependency management:
- Outdated package detection
- Package-lock.json verification
- Dry-run install to catch breaking changes

#### rust-security
Rust-specific checks:
- Clippy linting (warnings as errors)
- RustSec security advisory checks

**Duration**: ~5-15 minutes

**Required to Pass**: ⚠️ Partial (npm audit is non-blocking)

### 4. Release (`release.yml`)

Automated release build and publication.

**Triggers**:
- Push to version tags (v*)

**Jobs**:

#### create-release
Creates GitHub release draft:
- Extracts version from tag
- Creates draft release
- Sets prerelease flag based on tag (alpha/beta/rc)

#### build-and-release
Builds and releases for all platforms:
- Builds on each platform
- Runs full test suite
- Uploads artifacts to release
- Supports cross-compilation targets

#### publish-release
Finalizes release:
- Changes from draft to published
- Marks as prerelease if appropriate
- Notifies about availability

**Duration**: ~30-50 minutes

**Required to Pass**: ✅ Yes (release depends on builds)

## Workflows Matrix

| Workflow | Trigger | Platforms | Duration | Blocking |
|----------|---------|-----------|----------|----------|
| Test | Push + PR | Ubuntu (2 Node versions) | 5-10m | ✅ |
| Build | Push (main) + PR | 4 platforms | 20-40m | ✅ |
| Quality | Push + PR + Weekly | Ubuntu | 5-15m | ⚠️ |
| Release | Version tags | 4 platforms | 30-50m | ✅ |

## Status Badge

Add to README.md:

```markdown
[![Test Suite](https://github.com/USERNAME/swarm-ville/actions/workflows/test.yml/badge.svg)](https://github.com/USERNAME/swarm-ville/actions/workflows/test.yml)
[![Build](https://github.com/USERNAME/swarm-ville/actions/workflows/build.yml/badge.svg)](https://github.com/USERNAME/swarm-ville/actions/workflows/build.yml)
[![Code Quality](https://github.com/USERNAME/swarm-ville/actions/workflows/quality.yml/badge.svg)](https://github.com/USERNAME/swarm-ville/actions/workflows/quality.yml)
```

## Troubleshooting

### Workflow Fails to Start

**Cause**: Workflow file syntax error

**Fix**:
```bash
# Validate workflow syntax
yamllint .github/workflows/

# Or check GitHub Actions documentation
```

### Build Fails on Specific Platform

**Cause**: Platform-specific dependencies missing

**Fix**: Update the workflow to install required dependencies
```yaml
- name: Install system dependencies
  if: matrix.os == 'ubuntu-latest'
  run: sudo apt-get install -y [package]
```

### Tests Pass Locally but Fail in CI

**Cause**: Environment differences

**Solutions**:
- Check Node.js version matches
- Ensure npm ci instead of npm install
- Review test isolation (setup/cleanup)
- Check for hardcoded paths

### Coverage Upload Fails

**Cause**: Codecov token missing or expired

**Fix**: Add Codecov token to repository secrets

### Release Build Hangs

**Cause**: Timeout on long compilation

**Fix**: Increase timeout in job configuration
```yaml
jobs:
  build:
    timeout-minutes: 60
```

## Performance Optimization

### Parallel Jobs

Workflows run jobs in parallel when possible. To optimize:

1. Use `needs:` to specify dependencies only when necessary
2. Matrix jobs run in parallel automatically
3. Separate independent checks into different jobs

### Caching

Cache strategy:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'  # Automatically caches node_modules
```

### Artifacts

Keep artifact retention minimal:
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: build
    path: dist/
    retention-days: 1  # Clean up after 1 day
```

## Environment Variables

Set in repository Settings → Secrets and variables:

```env
CODECOV_TOKEN=xxx
```

## Accessing Artifacts

1. Go to Actions tab
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Download desired artifacts

Note: Artifacts are automatically deleted after retention period (default 90 days).

## Customization

### Add Custom Workflow

1. Create file in `.github/workflows/`
2. Use YAML syntax
3. Commit and push
4. Workflow appears in Actions tab

### Modify Existing Workflow

1. Edit `.github/workflows/[name].yml`
2. Commit to `main` or working branch
3. New version runs on next trigger

### Disable Workflow

1. Edit workflow file
2. Change trigger conditions or add:
   ```yaml
   if: false
   ```

## Best Practices

✅ **DO**:
- Keep workflows small and focused
- Use matrix for multiple configurations
- Cache dependencies
- Set reasonable timeouts
- Clean up artifacts
- Document workflow purpose
- Use consistent naming

❌ **DON'T**:
- Have workflows with 20+ steps
- Skip tests in CI
- Ignore security warnings
- Leave workflows in draft state
- Store secrets in workflows
- Commit binaries to repo

## See Also

- [Test Suite Documentation](../../TESTING.md)
- [Build & Deployment Documentation](../../DEPLOYMENT.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tauri GitHub Actions](https://github.com/tauri-apps/tauri-action)

---

**Last Updated**: Phase 6 - GitHub Actions CI/CD Setup
**Maintained By**: SwarmVille Team
