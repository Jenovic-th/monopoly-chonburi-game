# Monopoly Chonburi Game

Single-player Chonburi-themed board game prototype built with React, TypeScript, and Vite.

For current project status, setup steps, gameplay systems, user preferences, and the next development plan, start here:

- [AGENTS.md](./AGENTS.md)
- [HANDOFF.md](./HANDOFF.md)
- [DEVLOG.md](./DEVLOG.md)
- [TODO.md](./TODO.md)

## Quick Start

```powershell
git status --short --branch
git fetch origin
git pull origin main
npm.cmd install
npm.cmd run dev
```

Then open the local URL printed by Vite, normally:

```text
http://localhost:5173/
```

## Clean Reclone

If Git push/pull/add starts failing repeatedly on a machine, archive the current clone and recreate it from GitHub:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\clean-reclone.ps1 -Force
```

The old folder is moved to a sibling `_repo_archive` folder before the fresh clone is created.

## Validation

Run these before pushing changes:

```powershell
npm.cmd run check:encoding
npm.cmd run lint
npm.cmd run build
```

## Tech Stack

- React
- TypeScript
- Vite

## Original Vite Notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
