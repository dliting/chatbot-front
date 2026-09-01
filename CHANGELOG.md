# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CI workflow (GitHub Actions): lint / test / build jobs with coverage upload
- Font subset maintenance tooling (`scripts/fonts/`) and browser verification
  script (`tests/verify-fonts.cjs`)

### Changed

- Bundle Noto Sans SC as woff2 subsets (GB2312 level-1 + UI text, ~4000 chars)
  instead of full TTFs — font payload per public dir reduced from ~21MB to
  ~2.1MB; out-of-subset characters fall back to system fonts

### Fixed

- Four runtime bugs surfaced by enabling strict type checking
  (`vue-tsc` 2.x): stale `labels` prop passed to `ThinkingBlock`, missing `.value`
  unwrap in `ChatPanel` template, unsafe optional-action calls, file preview
  URL fallback when `preview` is absent

## [1.0.0] - 2026-08-31

First public release.

### Added

- Vue 3 + TypeScript + Element Plus chatbot component library (`AIChatbot`)
- Three interaction modes with dual-dimension architecture: Extended (dual layout), Sidebar (single), Floating (draggable ball + window)
- Streaming chat over SSE with timeout control, thinking / chain-of-thought display
- Multi-modal input: image upload, file preview (docx / excel / pdf / images)
- Quick actions with built-in SVG icons and `{{variable}}` prompt substitution
- Topic management (create / rename / delete / search), theme support (light / dark / system), i18n (zh-CN / en-US)
- Three-tier fallback: host callbacks → REST API → local-only behavior
- Iframe embedding build (`build:iframe`) for non-Vue host pages
- Full-stack example app `examples/chatapp` with mock and Ollama-based real backends
- Unit / component test suite (Vitest, >90% coverage target) and Playwright e2e tests
