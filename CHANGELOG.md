# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CI workflow (GitHub Actions): lint / test / build jobs with coverage upload
- Font subset maintenance tooling (`scripts/fonts/`) and browser verification
  script (`tests/verify-fonts.cjs`)
- Clear-conversation header action behind `enableClearAll`, with confirmation
  dialog, `messages:cleared` event and `onClearMessages` callback
- Config-driven upload limits: `maxImageSize` / `allowedImageTypes` /
  `maxImageCount` now enforced in the input, `enableImageUpload` hides the
  upload button; rejection toasts localized via new `ChatbotLabels` entries
- `streamEnabled: false` now selects a real non-streaming request path
  (single POST, full reply) instead of being ignored
- Topic switching aborts in-flight loads via `AbortSignal` (passed to
  `onLoadTopics` / `onLoadMessages` / backend requests), preventing stale
  responses from slow backends
- Suspended-ball position memory (restored across reloads, PRD F-007-04)

### Changed

- Bundle Noto Sans SC as woff2 subsets (GB2312 level-1 + UI text, ~4000 chars)
  instead of full TTFs — font payload per public dir reduced from ~21MB to
  ~2.1MB; out-of-subset characters fall back to system fonts
- All `ChatbotConfig` / `ChatbotCallbacks` options are now wired or removed:
  removed `layout`, `customStyles`, `maxMessagesInMemory`, `iframeMode`,
  `panelMinWidth`, `panelMaxWidth`, `onUploadImages` and the unused
  `/upload/images` client API (breaking: drop these keys from your config)
- `enableCopyMessage` / `enableDeleteMessage` / `enableResend` / `autoScroll` /
  `enableImageUpload` / upload limits / `thinkingAutoCollapse` now take effect
  end-to-end from config through the provide chain
- Iframe `host:setConfig` patches are reactive; `window.AIChatbot.toggle /
  setTheme` delegate to the real instance and throw when not ready

### Fixed

- Four runtime bugs surfaced by enabling strict type checking
  (`vue-tsc` 2.x): stale `labels` prop passed to `ThinkingBlock`, missing `.value`
  unwrap in `ChatPanel` template, unsafe optional-action calls, file preview
  URL fallback when `preview` is absent
- Markdown code-block copy button was unstyled and non-functional (class
  mismatch between injected button and the copy handler)
- Floating window: stored position was overwritten by default placement on
  mount (`rememberPosition` now honored)
- `ChatbotLabels` type re-exported from the package root

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
