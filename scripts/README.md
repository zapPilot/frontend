# CI Testing Scripts

This directory contains scripts to test CI workflows locally before pushing to GitHub.

## Scripts

### `test-ci-local.sh`

Comprehensive CI simulation that mirrors GitHub Actions workflow:

- Package manager detection
- Dependency installation
- Type checking
- Linting
- Build process
- Output verification
- Performance checks

Run with:

```bash
npm run ci:test
# or directly:
./scripts/test-ci-local.sh
```

### `quick-ci-check.sh`

Fast verification of basic CI requirements:

- Package manager detection
- Dependency status
- Build success
- Output generation

Run with:

```bash
npm run ci:quick
# or directly:
./scripts/quick-ci-check.sh
```

## Best Practices

1. **Run before pushing**: Always run `npm run ci:quick` before committing changes
2. **Full test for major changes**: Use `npm run ci:test` for significant modifications
3. **Debug failures locally**: These scripts help identify CI issues without waiting for GitHub
   Actions
4. **Package manager consistency**: Scripts detect the same package manager as GitHub Actions

## Troubleshooting

- **Build failures**: Check dependencies and TypeScript errors
- **Package manager issues**: Ensure lock files match your actual package manager
- **Missing output**: Verify Next.js configuration and export settings
- **Permission errors**: Run `chmod +x scripts/*.sh` to make scripts executable

## Integration with GitHub Actions

These scripts simulate the exact same steps as the GitHub Actions workflow:

1. Package manager detection (prioritizes package-lock.json)
2. Clean dependency installation
3. Build with Next.js
4. Output verification for GitHub Pages deployment
