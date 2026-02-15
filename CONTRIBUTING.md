# Contributing to @vahlcode/og

Thanks for considering contributing! We value your time and effort.

## Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/vahlcode/vahl-og.git
   cd vahl-og
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start build in watch mode**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

- `src/` - Source code
  - `image-response.ts` - Main logic handling `satori` and `resvg`
  - `font.ts` - Font loading and parsing
  - `image.ts` - Image fetching and processing
  - `cache.ts` - LRU cache implementation
- `test/` - Vitest test files
- `examples/` - Usage examples

## Guidelines

- **TypeScript**: Ensure all new code is typed. Run `npm run typecheck` to verify.
- **Tests**: Add tests for new features. We aim for >80% coverage.
- **Commits**: Use conventional commits (e.g. `feat: add font support`, `fix: cache expiry`).

## Pull Requests

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

Thank you for contributing!
