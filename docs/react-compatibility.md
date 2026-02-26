# React compatibility matrix

This document captures the current compatibility decision for React versions.

## Decision

- Supported runtime: React/ReactDOM `19.x`.
- Unsupported runtimes: React/ReactDOM `16.x`, `17.x`, `18.x`.

## Validation approach

Compatibility is validated by `scripts/react-compat-smoke.mjs`.

For each React version the smoke check creates an isolated temp consumer app and runs:

1. Type-check of `VirtualList` and `VirtualGrid` usage.
2. Runtime SSR render smoke (`renderToString`) for `VirtualList`.

## Current results

| React   | Types smoke | Runtime smoke                                           | Status      |
| ------- | ----------- | ------------------------------------------------------- | ----------- |
| 16.14.0 | pass        | fail (`recentlyCreatedOwnerStacks` in jsx runtime path) | unsupported |
| 17.0.2  | pass        | fail (`recentlyCreatedOwnerStacks` in jsx runtime path) | unsupported |
| 18.3.1  | pass        | fail (`recentlyCreatedOwnerStacks` in jsx runtime path) | unsupported |
| 19.2.0  | pass        | pass                                                    | supported   |

## Tooling notes

- Repository tooling is aligned with React 19 (`peerDependencies`, storybook setup, test stack).
- CI runs the smoke matrix for React 16/17/18/19 and enforces expected support status.
